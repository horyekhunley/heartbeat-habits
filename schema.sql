-- Heartbeat Habits Schema

-- Rooms table
create table public.rooms (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Users table
create table public.users (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.rooms(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habits table
create table public.habits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  room_id uuid references public.rooms(id) on delete cascade not null,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Completions table
create table public.completions (
  id uuid default gen_random_uuid() primary key,
  habit_id uuid references public.habits(id) on delete cascade not null,
  completed_at date default current_date not null,
  unique(habit_id, completed_at)
);

-- Notes table
create table public.notes (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.rooms(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  content text not null,
  date date default current_date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Nudges table
create table public.nudges (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.rooms(id) on delete cascade not null,
  from_user_id uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (simplified for this "secret room" approach)
alter table public.rooms enable row level security;
alter table public.users enable row level security;
alter table public.habits enable row level security;
alter table public.completions enable row level security;
alter table public.notes enable row level security;
alter table public.nudges enable row level security;

-- Policies: allow all if you have the room id or secret code (simplified for prototype)
create policy "Public access to rooms by code" on public.rooms for select using (true);
create policy "Insert rooms" on public.rooms for insert with check (true);

create policy "Room access" on public.users for all using (true) with check (true);
create policy "Habit access" on public.habits for all using (true) with check (true);
create policy "Completion access" on public.completions for all using (true) with check (true);
create policy "Note access" on public.notes for all using (true) with check (true);
create policy "Nudge access" on public.nudges for all using (true) with check (true);
