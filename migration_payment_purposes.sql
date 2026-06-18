-- Create payment purposes table
create table payment_purposes (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  amount integer not null default 0,
  created_at timestamp default now()
);

-- Enable Row Level Security
alter table payment_purposes enable row level security;

-- Configure security policies
create policy "Anyone can read payment purposes"
  on payment_purposes for select to anon, authenticated using (true);

create policy "Auth users manage payment purposes"
  on payment_purposes for all to authenticated using (true);
