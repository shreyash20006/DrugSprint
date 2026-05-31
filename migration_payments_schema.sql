-- Create payments table
create table payments (
  id uuid default gen_random_uuid() primary key,
  student_name text not null,
  student_email text not null,
  student_phone text,
  student_year text not null,
  purpose text not null,
  amount integer not null,
  payment_id text unique,
  order_id text,
  status text default 'pending',
  receipt_sent boolean default false,
  created_at timestamp default now()
);

-- Enable Row Level Security
alter table payments enable row level security;

-- Configure Security Policies
create policy "Anyone can insert payments"
  on payments for insert to anon with check (true);

create policy "Auth users manage payments"
  on payments for all to authenticated using (true);
