-- Safely add columns if they don't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'food_items' and column_name = 'user_id') then
        alter table food_items add column user_id uuid references auth.users default auth.uid();
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'food_items' and column_name = 'created_by') then
        alter table food_items add column created_by text;
    end if;
end $$;

-- Enable RLS (idempotent)
alter table food_items enable row level security;

-- DROP existing policies to ensure we start fresh with the new "Open Access" rules
drop policy if exists "Users can see their own items" on food_items;
drop policy if exists "Users can insert their own items" on food_items;
drop policy if exists "Users can update their own items" on food_items;
drop policy if exists "Users can delete their own items" on food_items;
drop policy if exists "Authenticated users can do everything" on food_items;

-- Create the new OPEN policy
create policy "Authenticated users can do everything"
on food_items for all
to authenticated
using ( true )
with check ( true );
