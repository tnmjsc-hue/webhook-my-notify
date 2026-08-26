-- ============================================
-- Webhook My Notify (WMN) — Database Schema
-- Chạy trong Supabase SQL Editor
-- ============================================

-- Bảng mở rộng auth.users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  is_admin boolean default false,
  balance numeric default 0,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Auto-tạo profile khi đăng ký
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- API Keys
create table api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  key_hash text unique not null,
  key_prefix text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table api_keys enable row level security;

create policy "Users can manage own api_keys"
  on api_keys for all
  using (auth.uid() = user_id);

-- Webhook Configs
create table webhook_configs (
  user_id uuid primary key references profiles(id) on delete cascade,
  target_url text,
  is_enabled boolean default false
);

alter table webhook_configs enable row level security;

create policy "Users can manage own webhook_config"
  on webhook_configs for all
  using (auth.uid() = user_id);

-- Notify Queue (hàng đợi)
create table notify_queue (
  id bigint generated always as identity primary key,
  api_key_id uuid references api_keys(id) on delete set null,
  user_id uuid references profiles(id) on delete set null,
  raw_payload jsonb not null,
  status text default 'pending' check (status in ('pending', 'processing', 'done', 'failed')),
  retry_count int default 0,
  received_at timestamptz default now(),
  processed_at timestamptz
);

create index idx_notify_queue_pending on notify_queue (received_at)
  where status = 'pending';

-- Notifications (log đã xử lý)
create table notifications (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete set null,
  application text,
  event_time timestamptz,
  money numeric,
  detail text,
  forwarded boolean default false,
  forward_status_code int,
  forward_bytes int,
  forward_error text,
  created_at timestamptz default now()
);

alter table notifications enable row level security;

create policy "Users can read own notifications"
  on notifications for select
  using (auth.uid() = user_id);

-- Payments
create table payments (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete set null,
  amount numeric not null,
  qr_ref_code text,
  status text default 'pending' check (status in ('pending', 'paid')),
  created_at timestamptz default now()
);

alter table payments enable row level security;

create policy "Users can read own payments"
  on payments for select
  using (auth.uid() = user_id);

-- ============================================
-- pg_cron + pg_net: Worker xử lý queue
-- Chạy trong Supabase SQL Editor (kích hoạt Extension trước)
-- ============================================

-- Kích hoạt extensions (Supabase Dashboard → Database → Extensions)
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;

-- Function xử lý queue
create or replace function public.process_notify_queue()
returns void as $$
declare
  item record;
  config record;
  payload jsonb;
  forward_ok boolean;
  forward_code int;
  forward_bytes int;
  forward_err text;
  max_retries int := 3;
begin
  for item in
    select * from notify_queue
    where status = 'pending' and retry_count < max_retries
    order by received_at asc
    limit 50
    for update skip locked
  loop
    -- Đánh dấu đang xử lý
    update notify_queue set status = 'processing' where id = item.id;
    payload := item.raw_payload;

    -- Lưu vào notifications
    insert into notifications (user_id, application, event_time, money, detail)
    values (
      item.user_id,
      payload->>'application',
      (payload->>'time')::timestamptz,
      (payload->>'money')::numeric,
      payload->>'detail'
    );

    -- Kiểm tra webhook config
    forward_ok := false;
    forward_code := null;
    forward_bytes := null;
    forward_err := null;

    select * into config
    from webhook_configs
    where user_id = item.user_id and is_enabled = true and target_url is not null;

    if found then
      begin
        select
          status_code,
          length(content)::int,
          null
        into forward_code, forward_bytes, forward_err
        from net.http_post(
          url := config.target_url,
          body := payload::text,
          content_type := 'application/json',
          timeout_milliseconds := 10000
        );
        forward_ok := (forward_code between 200 and 299);
      exception when others then
        forward_err := SQLERRM;
        forward_code := 0;
      end;
    end if;

    -- Cập nhật notifications
    update notifications set
      forwarded := forward_ok,
      forward_status_code := forward_code,
      forward_bytes := forward_bytes,
      forward_error := forward_err
    where user_id = item.user_id
      and detail = payload->>'detail'
      and id = (select id from notifications where user_id = item.user_id order by id desc limit 1);

    -- Đánh dấu done hoặc failed
    if forward_ok or config is null then
      update notify_queue set status = 'done', processed_at = now() where id = item.id;
    else
      update notify_queue set
        status = case when item.retry_count + 1 >= max_retries then 'failed' else 'pending' end,
        retry_count = item.retry_count + 1
      where id = item.id;
    end if;
  end loop;
end;
$$ language plpgsql;

-- pg_cron: chạy mỗi 10 giây
-- select cron.schedule('process-queue', '*/10 * * * * *', $$select public.process_notify_queue()$$);
