create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  role text not null default 'patient' check (role in ('patient', 'doctor', 'admin', 'pharmacist')),
  specialization text,
  experience_years integer,
  availability text,
  license_number text,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists specialization text;
alter table public.profiles add column if not exists experience_years integer;
alter table public.profiles add column if not exists availability text;
alter table public.profiles add column if not exists license_number text;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('patient', 'doctor', 'admin', 'pharmacist'));

alter table public.profiles enable row level security;
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = user_id);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = user_id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = user_id);

create or replace function public.has_role(required_role text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where user_id = auth.uid() and role = required_role);
$$;

create or replace function public.is_doctor(profile_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where user_id = profile_id and role = 'doctor');
$$;

create policy "Patients can view doctor profiles" on public.profiles for select using (
  role = 'doctor' and auth.uid() is not null
);
create policy "Staff can view profiles" on public.profiles for select using (
  public.has_role('doctor') or public.has_role('admin') or public.has_role('pharmacist')
);

-- Appointment scheduling
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  doctor_id uuid not null references auth.users(id) on delete cascade,
  appointment_date date not null,
  appointment_time time not null,
  reason text,
  notes text,
  status text not null default 'Pending' check (status in ('Pending', 'Confirmed', 'Completed', 'Cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (doctor_id, appointment_date, appointment_time)
);

-- Keep existing installations compatible with the appointment workflow.
alter table public.appointments add column if not exists patient_id uuid;
alter table public.appointments add column if not exists doctor_id uuid;
alter table public.appointments add column if not exists appointment_date date;
alter table public.appointments add column if not exists appointment_time time;
alter table public.appointments add column if not exists reason text;
alter table public.appointments add column if not exists notes text;
alter table public.appointments add column if not exists status text default 'Pending';
alter table public.appointments add column if not exists created_at timestamptz not null default now();
alter table public.appointments add column if not exists updated_at timestamptz not null default now();
alter table public.appointments alter column status set default 'Pending';
update public.appointments set status = 'Pending' where status is null or status not in ('Pending', 'Confirmed', 'Completed', 'Cancelled');
alter table public.appointments alter column status set not null;
alter table public.appointments drop constraint if exists appointments_status_check;
alter table public.appointments add constraint appointments_status_check check (status in ('Pending', 'Confirmed', 'Completed', 'Cancelled'));
create unique index if not exists appointments_doctor_slot_key on public.appointments (doctor_id, appointment_date, appointment_time);

alter table public.appointments enable row level security;
drop policy if exists "Patients view their appointments" on public.appointments;
drop policy if exists "Doctors view their appointments" on public.appointments;
drop policy if exists "Admins view all appointments" on public.appointments;
drop policy if exists "Patients create appointments" on public.appointments;
drop policy if exists "Staff manage appointments" on public.appointments;
drop policy if exists "Patients cancel appointments" on public.appointments;
create policy "Patients view their appointments" on public.appointments for select using (patient_id = auth.uid());
create policy "Doctors view their appointments" on public.appointments for select using (doctor_id = auth.uid());
create policy "Admins view all appointments" on public.appointments for select using (public.has_role('admin'));
create policy "Patients create appointments" on public.appointments for insert with check (patient_id = auth.uid() and public.is_doctor(doctor_id));
create policy "Staff manage appointments" on public.appointments for update using (doctor_id = auth.uid() or public.has_role('admin'));
create policy "Patients cancel appointments" on public.appointments for update using (patient_id = auth.uid());

-- Pharmacy inventory and prescription workflow
create table if not exists public.medicines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  quantity integer not null default 0 check (quantity >= 0),
  low_stock_threshold integer not null default 10 check (low_stock_threshold >= 0),
  price numeric(10,2) not null default 0 check (price >= 0),
  expiry_date date not null,
  manufacturer text,
  batch_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.medicines add column if not exists description text;

alter table public.medicines enable row level security;
create policy "Authenticated users view medicines" on public.medicines for select using (auth.uid() is not null);
create policy "Pharmacy staff manage medicines" on public.medicines for all using (public.has_role('admin') or public.has_role('pharmacist'));

create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  doctor_id uuid not null references auth.users(id) on delete cascade,
  medicine_id uuid not null references public.medicines(id) on delete restrict,
  dosage text not null,
  frequency text not null,
  duration text not null,
  instructions text,
  status text not null default 'Prescribed' check (status in ('Prescribed', 'Dispensed', 'Cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.prescriptions enable row level security;
create policy "Patients view their prescriptions" on public.prescriptions for select using (patient_id = auth.uid());
create policy "Doctors view prescriptions" on public.prescriptions for select using (doctor_id = auth.uid());
create policy "Doctors create prescriptions" on public.prescriptions for insert with check (doctor_id = auth.uid() and public.has_role('doctor'));
create policy "Pharmacy staff manage prescriptions" on public.prescriptions for all using (public.has_role('admin') or public.has_role('pharmacist'));

-- Patient pharmacy orders
create table if not exists public.pharmacy_orders (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  total_amount numeric(10,2) not null default 0 check (total_amount >= 0),
  status text not null default 'Pending' check (status in ('Pending', 'Processing', 'Ready', 'Completed', 'Cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pharmacy_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.pharmacy_orders(id) on delete cascade,
  medicine_id uuid not null references public.medicines(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0)
);

alter table public.pharmacy_orders enable row level security;
alter table public.pharmacy_order_items enable row level security;
create policy "Patients view their pharmacy orders" on public.pharmacy_orders for select using (patient_id = auth.uid());
create policy "Patients view their pharmacy order items" on public.pharmacy_order_items for select using (
  exists (select 1 from public.pharmacy_orders where id = order_id and patient_id = auth.uid())
);
create policy "Pharmacy staff manage orders" on public.pharmacy_orders for all using (public.has_role('admin') or public.has_role('pharmacist'));
create policy "Pharmacy staff manage order items" on public.pharmacy_order_items for all using (public.has_role('admin') or public.has_role('pharmacist'));

create or replace function public.place_pharmacy_order(order_items jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  new_order_id uuid;
  item jsonb;
  selected_medicine public.medicines%rowtype;
  requested_quantity integer;
  order_total numeric(10,2) := 0;
begin
  if auth.uid() is null or jsonb_typeof(order_items) <> 'array' or jsonb_array_length(order_items) = 0 then
    raise exception 'A signed-in patient and at least one medicine are required';
  end if;

  insert into public.pharmacy_orders (patient_id) values (auth.uid()) returning id into new_order_id;
  for item in select * from jsonb_array_elements(order_items) loop
    requested_quantity := (item->>'quantity')::integer;
    select * into selected_medicine from public.medicines where id = (item->>'medicine_id')::uuid for update;
    if selected_medicine.id is null or selected_medicine.expiry_date < current_date or requested_quantity < 1 then
      raise exception 'Medicine is unavailable';
    end if;
    if selected_medicine.quantity < requested_quantity then
      raise exception 'Insufficient stock for %', selected_medicine.name;
    end if;
    update public.medicines set quantity = quantity - requested_quantity, updated_at = now() where id = selected_medicine.id;
    insert into public.pharmacy_order_items (order_id, medicine_id, quantity, unit_price)
      values (new_order_id, selected_medicine.id, requested_quantity, selected_medicine.price);
    order_total := order_total + (selected_medicine.price * requested_quantity);
  end loop;
  update public.pharmacy_orders set total_amount = order_total, updated_at = now() where id = new_order_id;
  return new_order_id;
exception when others then
  if new_order_id is not null then delete from public.pharmacy_orders where id = new_order_id; end if;
  raise;
end;
$$;

create or replace function public.dispense_prescription(prescription_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  selected_prescription public.prescriptions%rowtype;
begin
  if not (public.has_role('admin') or public.has_role('pharmacist')) then
    raise exception 'Only pharmacy staff can dispense prescriptions';
  end if;

  select * into selected_prescription from public.prescriptions where id = prescription_id for update;
  if selected_prescription.id is null or selected_prescription.status <> 'Prescribed' then
    raise exception 'Prescription is unavailable for dispensing';
  end if;

  update public.medicines
  set quantity = quantity - 1, updated_at = now()
  where id = selected_prescription.medicine_id and quantity > 0 and expiry_date >= current_date;
  if not found then
    raise exception 'Medicine is out of stock or expired';
  end if;

  update public.prescriptions set status = 'Dispensed', updated_at = now() where id = prescription_id;
end;
$$;

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
