
-- Roles enum
create type public.app_role as enum ('admin', 'employee', 'shareholder', 'vendor');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company_name text,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles for select
  to authenticated using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated with check (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated using (auth.uid() = id);

-- User roles (separate table — security best practice)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

create policy "Users can view own roles"
  on public.user_roles for select
  to authenticated using (user_id = auth.uid());
create policy "Admins can manage all roles"
  on public.user_roles for all
  to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile + default vendor role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, company_name, phone, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'phone',
    new.email
  );
  insert into public.user_roles (user_id, role) values (new.id, 'vendor');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- HO Requirements (tenders)
create type public.requirement_status as enum ('open', 'closed', 'awarded');

create table public.ho_requirements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_ar text,
  description text not null,
  description_ar text,
  category text,
  deadline timestamptz,
  status public.requirement_status not null default 'open',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ho_requirements enable row level security;

create policy "Requirements are publicly viewable"
  on public.ho_requirements for select
  using (true);
create policy "Admins manage requirements"
  on public.ho_requirements for all
  to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Quotations
create type public.quotation_status as enum ('pending', 'approved', 'rejected');

create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references public.ho_requirements(id) on delete cascade,
  vendor_id uuid not null references auth.users(id) on delete cascade,
  price numeric(14,3) not null,
  currency text not null default 'KWD',
  notes text,
  status public.quotation_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.quotations enable row level security;

create policy "Vendors view own quotations"
  on public.quotations for select
  to authenticated using (vendor_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Vendors insert own quotations"
  on public.quotations for insert
  to authenticated with check (vendor_id = auth.uid() and public.has_role(auth.uid(), 'vendor'));
create policy "Vendors update own pending quotations"
  on public.quotations for update
  to authenticated using (vendor_id = auth.uid() and status = 'pending');
create policy "Admins manage all quotations"
  on public.quotations for all
  to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Quotation documents (metadata; files in storage)
create table public.quotation_documents (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_at timestamptz not null default now()
);
alter table public.quotation_documents enable row level security;

create policy "Vendors view own docs"
  on public.quotation_documents for select
  to authenticated using (
    exists(select 1 from public.quotations q where q.id = quotation_id
      and (q.vendor_id = auth.uid() or public.has_role(auth.uid(), 'admin')))
  );
create policy "Vendors insert docs for own quotations"
  on public.quotation_documents for insert
  to authenticated with check (
    exists(select 1 from public.quotations q where q.id = quotation_id and q.vendor_id = auth.uid())
  );
create policy "Vendors delete own docs"
  on public.quotation_documents for delete
  to authenticated using (
    exists(select 1 from public.quotations q where q.id = quotation_id and q.vendor_id = auth.uid())
  );

-- Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;

create policy "Users view own notifications"
  on public.notifications for select
  to authenticated using (user_id = auth.uid());
create policy "Users update own notifications"
  on public.notifications for update
  to authenticated using (user_id = auth.uid());
create policy "Admins create notifications"
  on public.notifications for insert
  to authenticated with check (public.has_role(auth.uid(), 'admin'));

-- updated_at triggers
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger trg_requirements_updated before update on public.ho_requirements for each row execute function public.set_updated_at();
create trigger trg_quotations_updated before update on public.quotations for each row execute function public.set_updated_at();

-- Storage bucket
insert into storage.buckets (id, name, public) values ('vendor-documents', 'vendor-documents', false)
on conflict (id) do nothing;

create policy "Vendors upload own files"
  on storage.objects for insert
  to authenticated with check (
    bucket_id = 'vendor-documents' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Vendors read own files"
  on storage.objects for select
  to authenticated using (
    bucket_id = 'vendor-documents' and (
      (storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(), 'admin')
    )
  );
create policy "Vendors delete own files"
  on storage.objects for delete
  to authenticated using (
    bucket_id = 'vendor-documents' and (storage.foldername(name))[1] = auth.uid()::text
  );
