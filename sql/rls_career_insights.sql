create policy "Allow logged-in users to insert career insights"
on public.career_insights
for insert
with check (auth.uid() = user_id);
