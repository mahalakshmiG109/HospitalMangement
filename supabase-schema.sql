create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  role text not null default 'patient' check (role in ('patient', 'doctor', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = user_id);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = user_id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, full_name, email, phone, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email, new.raw_user_meta_data->>'phone', coalesce(new.raw_user_meta_data->>'role', 'patient'));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Wards/Departments table
create table if not exists public.wards (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  floor integer,
  total_beds integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wards enable row level security;
create policy "Anyone can view wards" on public.wards for select using (true);
create policy "Admin can manage wards" on public.wards for all using (
  exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
);

-- Beds table
create table if not exists public.beds (
  id uuid primary key default gen_random_uuid(),
  bed_id text not null,
  ward_id uuid not null references public.wards(id) on delete cascade,
  room_number text not null,
  bed_type text not null check (bed_type in ('General', 'ICU', 'Emergency', 'Private', 'Semi-Private')),
  floor integer not null,
  status text not null default 'Available' check (status in ('Available', 'Occupied', 'Reserved', 'Maintenance')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(bed_id)
);

alter table public.beds enable row level security;
create policy "Anyone can view beds" on public.beds for select using (true);
create policy "Authorized staff can update beds" on public.beds for update using (
  exists (select 1 from public.profiles where user_id = auth.uid() and role in ('admin', 'doctor'))
);

-- Admissions table
create table if not exists public.admissions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  bed_id uuid not null references public.beds(id) on delete set null,
  ward_id uuid not null references public.wards(id) on delete cascade,
  admission_date timestamptz not null,
  discharge_date timestamptz,
  status text not null default 'Active' check (status in ('Active', 'Discharged', 'Transferred')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admissions enable row level security;
create policy "Users can view their own admissions" on public.admissions for select using (patient_id = auth.uid());
create policy "Staff can view all admissions" on public.admissions for select using (
  exists (select 1 from public.profiles where user_id = auth.uid() and role in ('admin', 'doctor'))
);
create policy "Staff can update admissions" on public.admissions for update using (
  exists (select 1 from public.profiles where user_id = auth.uid() and role in ('admin', 'doctor'))
);

-- Bed history for audit trail
create table if not exists public.bed_history (
  id uuid primary key default gen_random_uuid(),
  bed_id uuid not null references public.beds(id) on delete cascade,
  previous_status text not null,
  new_status text not null,
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default now(),
  notes text
);

alter table public.bed_history enable row level security;
create policy "Staff can view bed history" on public.bed_history for select using (
  exists (select 1 from public.profiles where user_id = auth.uid() and role in ('admin', 'doctor'))
);

-- Admins should be granted additional policies through a server-side role strategy.
-- Never expose a service-role key in the Vite client.
