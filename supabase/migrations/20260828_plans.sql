-- ============================================
-- WMN — Migration: Gói dịch vụ (Plans)
-- Chạy trong Supabase SQL Editor
-- ============================================

-- 1) Thêm cột plan cho profiles
alter table public.profiles
  add column if not exists plan text not null default 'free';

-- 2) Ràng buộc giá trị hợp lệ
alter table public.profiles
  drop constraint if exists profiles_plan_check;
alter table public.profiles
  add constraint profiles_plan_check
  check (plan in ('free', 'premium', 'unlimited'));

-- 3) Index cho truy vấn thống kê admin
create index if not exists idx_profiles_plan on public.profiles (plan);
create index if not exists idx_notifications_user_created
  on public.notifications (user_id, created_at);

-- 4) Mặc định user mới là free (trigger hiện có chỉ insert id, full_name
--    nên plan sẽ tự nhận default 'free').

-- 5) Cấp admin + gói unlimited cho tài khoản chủ hệ thống
update public.profiles set is_admin = true, plan = 'unlimited'
  where id = '264a84ab-d23d-482b-92b5-b092da5ac200';
