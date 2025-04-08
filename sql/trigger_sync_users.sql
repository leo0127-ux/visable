-- 修改觸發器函數以處理 Google 登入
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, created_at, vpoint)
  values (
    new.id, 
    new.email, 
    now(), 
    0
  )
  on conflict (id) do update 
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- 確保觸發器存在且正確綁定
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
