-- ============================================
-- WMN — Migration: Chu kỳ thanh toán
-- Chạy trong Supabase SQL Editor
-- ============================================

alter table public.profiles
  add column if not exists billing_cycle text not null default 'monthly';

alter table public.profiles
  drop constraint if exists profiles_billing_cycle_check;
alter table public.profiles
  add constraint profiles_billing_cycle_check
  check (billing_cycle in ('monthly', 'yearly'));
