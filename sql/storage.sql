-- 請通過 Supabase 管理界面或 CLI 創建存儲桶 post-images

-- 設置存儲桶的公開訪問策略
create policy "Public access to post-images"
on storage.objects
for select
using (bucket_id = 'post-images');
