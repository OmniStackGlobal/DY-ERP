-- ============================================================================
-- DY ERP · 0001 地基
-- 用户与角色、客户公司、账户主数据、费用（业务支出 / 公司开支）、汇率、操作日志
-- 全部表启用 RLS；权限规则集中在下面的辅助函数里。
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 枚举
-- ----------------------------------------------------------------------------
create type public.user_role as enum ('admin', 'finance', 'staff', 'viewer');
create type public.company_kind as enum ('client', 'management');
create type public.account_provider as enum ('paypal', 'airwallex', 'wallet');
create type public.wallet_chain as enum ('tron', 'ethereum', 'base');
create type public.expense_scope as enum ('business', 'company');
create type public.expense_sharing as enum ('pending', 'client', 'management', 'shared', 'individual');

-- ----------------------------------------------------------------------------
-- 通用：updated_at 自动更新
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ----------------------------------------------------------------------------
-- 用户资料（与 auth.users 一一对应）
-- ----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text not null default '',
  role        public.user_role not null default 'staff',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- 新用户注册时自动建档；系统里第一个用户自动成为管理员
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  first_user boolean;
begin
  select not exists (select 1 from public.profiles) into first_user;
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1)),
    case when first_user then 'admin'::public.user_role
         when (new.raw_user_meta_data ->> 'role') in ('admin', 'finance', 'staff', 'viewer')
           then (new.raw_user_meta_data ->> 'role')::public.user_role
         else 'staff'::public.user_role end
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 权限辅助函数（security definer，避免 RLS 递归）
-- ----------------------------------------------------------------------------
create or replace function public.my_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and is_active
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid() and is_active), false)
$$;

create or replace function public.is_finance()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('admin', 'finance') from public.profiles where id = auth.uid() and is_active), false)
$$;

create or replace function public.is_active_user()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_active from public.profiles where id = auth.uid()), false)
$$;

-- ----------------------------------------------------------------------------
-- 公司（客户公司 + 管理公司自身）
-- ----------------------------------------------------------------------------
create table public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  code        text not null,
  kind        public.company_kind not null default 'client',
  color       text not null default '#1f4fd8',
  note        text not null default '',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (code)
);
create trigger companies_updated_at before update on public.companies
  for each row execute function public.set_updated_at();

-- 非管理员/财务的用户，能看到哪些公司
create table public.company_access (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  company_id  uuid not null references public.companies(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, company_id)
);

create or replace function public.can_access_company(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_finance()
      or exists (select 1 from public.company_access where user_id = auth.uid() and company_id = cid)
$$;

-- ----------------------------------------------------------------------------
-- 账户主数据：PayPal / Airwallex / 链上钱包
-- ----------------------------------------------------------------------------
create table public.accounts (
  id                 uuid primary key default gen_random_uuid(),
  company_id         uuid not null references public.companies(id) on delete restrict,
  provider           public.account_provider not null,
  name               text not null,
  identifier         text not null default '',   -- PayPal 邮箱 / 银行尾号 / 钱包地址缩写
  currency           text not null default 'USD',
  holder_name        text not null default '',
  chain              public.wallet_chain,
  address            text,
  bank_account_id    uuid references public.accounts(id) on delete set null,
  wallet_account_id  uuid references public.accounts(id) on delete set null,
  note               text not null default '',
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index accounts_company_idx on public.accounts (company_id, provider);
create trigger accounts_updated_at before update on public.accounts
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 费用分类
-- ----------------------------------------------------------------------------
create table public.expense_categories (
  id          uuid primary key default gen_random_uuid(),
  scope       public.expense_scope not null,
  name        text not null,
  sort        integer not null default 100,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (scope, name)
);

-- ----------------------------------------------------------------------------
-- 费用：业务支出（可归属客户公司）与公司开支（管理公司自身）
-- ----------------------------------------------------------------------------
create table public.expenses (
  id             uuid primary key default gen_random_uuid(),
  scope          public.expense_scope not null,
  company_id     uuid references public.companies(id) on delete restrict,
  category_id    uuid references public.expense_categories(id) on delete set null,
  expense_date   date not null default current_date,
  amount         numeric(20, 6) not null check (amount > 0),
  currency       text not null default 'USD',
  handler_id     uuid references public.profiles(id) on delete set null,
  handler_name   text not null default '',
  sharing        public.expense_sharing not null default 'pending',
  share_ratio    numeric(5, 4) check (share_ratio is null or (share_ratio >= 0 and share_ratio <= 1)),
  note           text not null default '',
  created_by     uuid not null references public.profiles(id) on delete restrict,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index expenses_date_idx on public.expenses (expense_date desc);
create index expenses_company_idx on public.expenses (company_id, expense_date desc);
create index expenses_handler_idx on public.expenses (handler_id);
create trigger expenses_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();

create table public.expense_attachments (
  id            uuid primary key default gen_random_uuid(),
  expense_id    uuid not null references public.expenses(id) on delete cascade,
  storage_path  text not null,
  file_name     text not null,
  size_bytes    integer not null default 0,
  mime_type     text not null default '',
  uploaded_by   uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index expense_attachments_expense_idx on public.expense_attachments (expense_id);

-- 当前用户能否看到某条费用
create or replace function public.can_view_expense(e public.expenses)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_finance()
      or e.created_by = auth.uid()
      or e.handler_id = auth.uid()
      or (public.my_role() = 'viewer' and e.company_id is not null and public.can_access_company(e.company_id))
$$;

-- ----------------------------------------------------------------------------
-- 每日汇率（中间价），由定时任务写入
-- ----------------------------------------------------------------------------
create table public.fx_rates (
  rate_date   date not null,
  base        text not null,
  quote       text not null,
  rate        numeric(20, 10) not null,
  source      text not null default '',
  fetched_at  timestamptz not null default now(),
  primary key (rate_date, base, quote)
);

-- ----------------------------------------------------------------------------
-- 操作日志
-- ----------------------------------------------------------------------------
create table public.audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid references public.profiles(id) on delete set null,
  action      text not null,
  entity      text not null,
  entity_id   text,
  detail      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index audit_log_created_idx on public.audit_log (created_at desc);

create or replace function public.log_action(p_action text, p_entity text, p_entity_id text, p_detail jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.audit_log (actor_id, action, entity, entity_id, detail)
  values (auth.uid(), p_action, p_entity, p_entity_id, coalesce(p_detail, '{}'::jsonb))
$$;

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.profiles            enable row level security;
alter table public.companies           enable row level security;
alter table public.company_access      enable row level security;
alter table public.accounts            enable row level security;
alter table public.expense_categories  enable row level security;
alter table public.expenses            enable row level security;
alter table public.expense_attachments enable row level security;
alter table public.fx_rates            enable row level security;
alter table public.audit_log           enable row level security;

-- profiles：所有在职用户可读（需要显示姓名）；本人可改姓名；管理员可改一切
create policy profiles_select on public.profiles for select to authenticated
  using (public.is_active_user());
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and role = public.my_role() and is_active = true);
create policy profiles_admin_all on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- companies：按访问范围可读；管理员可写
create policy companies_select on public.companies for select to authenticated
  using (public.is_active_user() and (public.can_access_company(id) or kind = 'management'));
create policy companies_admin_write on public.companies for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- company_access：本人可读自己的；管理员可写
create policy company_access_select on public.company_access for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy company_access_admin_write on public.company_access for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- accounts：按公司访问范围可读；财务及以上可写
create policy accounts_select on public.accounts for select to authenticated
  using (public.is_active_user() and public.can_access_company(company_id));
create policy accounts_finance_write on public.accounts for all to authenticated
  using (public.is_finance()) with check (public.is_finance());

-- expense_categories：在职用户可读；财务及以上可写
create policy expense_categories_select on public.expense_categories for select to authenticated
  using (public.is_active_user());
create policy expense_categories_finance_write on public.expense_categories for all to authenticated
  using (public.is_finance()) with check (public.is_finance());

-- expenses
create policy expenses_select on public.expenses for select to authenticated
  using (public.is_active_user() and public.can_view_expense(expenses));
create policy expenses_insert on public.expenses for insert to authenticated
  with check (
    public.is_active_user()
    and created_by = auth.uid()
    and public.my_role() in ('admin', 'finance', 'staff')
    and (public.is_finance() or (handler_id = auth.uid() and (company_id is null or public.can_access_company(company_id))))
  );
create policy expenses_update on public.expenses for update to authenticated
  using (
    public.is_finance()
    or (public.my_role() = 'staff' and created_by = auth.uid() and sharing = 'pending')
  )
  with check (
    public.is_finance()
    or (public.my_role() = 'staff' and created_by = auth.uid() and handler_id = auth.uid())
  );
create policy expenses_delete on public.expenses for delete to authenticated
  using (public.is_finance() or (public.my_role() = 'staff' and created_by = auth.uid() and sharing = 'pending'));

-- expense_attachments：跟随费用的可见性
create policy expense_attachments_select on public.expense_attachments for select to authenticated
  using (exists (select 1 from public.expenses e where e.id = expense_id and public.can_view_expense(e)));
create policy expense_attachments_insert on public.expense_attachments for insert to authenticated
  with check (
    uploaded_by = auth.uid()
    and exists (select 1 from public.expenses e where e.id = expense_id
                and (public.is_finance() or e.created_by = auth.uid()))
  );
create policy expense_attachments_delete on public.expense_attachments for delete to authenticated
  using (public.is_finance() or uploaded_by = auth.uid());

-- fx_rates：所有人可读；只有服务端（service_role）写
create policy fx_rates_select on public.fx_rates for select to authenticated
  using (public.is_active_user());

-- audit_log：财务及以上可读；写入走 log_action()
create policy audit_log_select on public.audit_log for select to authenticated
  using (public.is_finance());

-- ============================================================================
-- 凭证文件桶（私有），路径：expenses/<expense_id>/<file>
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts', 'receipts', false, 10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'application/pdf']
)
on conflict (id) do nothing;

create policy receipts_select on storage.objects for select to authenticated
  using (
    bucket_id = 'receipts'
    and exists (
      select 1 from public.expenses e
      where e.id::text = (storage.foldername(name))[2] and public.can_view_expense(e)
    )
  );
create policy receipts_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = 'expenses'
    and exists (
      select 1 from public.expenses e
      where e.id::text = (storage.foldername(name))[2]
        and (public.is_finance() or e.created_by = auth.uid())
    )
  );
create policy receipts_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'receipts'
    and (public.is_finance() or owner_id = auth.uid()::text)
  );

-- ============================================================================
-- 初始数据：管理公司自身 + 费用分类（来自最初的 DY ERP 大纲）
-- ============================================================================
insert into public.companies (name, code, kind, color, note)
values ('DY 管理公司', 'DY', 'management', '#16181d', '管理公司自身，用于公司开支与自付费用')
on conflict (code) do nothing;

insert into public.expense_categories (scope, name, sort) values
  ('business', '广告费', 10),
  ('business', 'IP 费用', 20),
  ('business', '法人打款费用', 30),
  ('business', 'ADS 费用', 40),
  ('business', 'Salesmartly 费用', 50),
  ('business', 'VPN 费用', 60),
  ('business', 'API 费用', 70),
  ('business', '其他', 999),
  ('company',  '房租', 10),
  ('company',  '水电', 20),
  ('company',  '工资', 30),
  ('company',  '清洁费', 40),
  ('company',  '杂费', 50)
on conflict (scope, name) do nothing;
