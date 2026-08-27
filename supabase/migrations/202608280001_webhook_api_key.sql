-- ============================================
-- WMN — Migration: Gắn webhook_config với API key duy nhất
-- Chạy trong Supabase SQL Editor
-- ============================================

-- 1) Thêm cột api_key_id (1 webhook = 1 api key duy nhất)
alter table public.webhook_configs
  add column if not exists api_key_id uuid references public.api_keys(id) on delete set null;

-- 2) Bỏ khoá chính trên user_id (cho phép nhiều webhook/user, mỗi webhook gắn 1 key)
alter table public.webhook_configs
  drop constraint if exists webhook_configs_pkey;

-- 3) Ràng buộc: một API key chỉ được gắn vào tối đa 1 webhook URL (không trùng)
create unique index if not exists idx_webhook_configs_api_key_unique
  on public.webhook_configs (api_key_id)
  where api_key_id is not null;

-- 4) (Nếu có dữ liệu webhook cũ gắn theo user, bạn có thể chạy thủ công
--    để gán api_key_id cho config hiện có sau khi tạo key trong dashboard)
