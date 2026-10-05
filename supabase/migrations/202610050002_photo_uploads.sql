begin;
alter table public.humor_captions add column image_data_url text;
alter table public.humor_captions drop constraint humor_captions_scene_id_check;
alter table public.humor_captions drop constraint humor_captions_check;
alter table public.humor_captions add constraint humor_captions_picture_check check (
 (scene_id in ('subway','library','bagel','dorm') and image_path = '/jokes/' || scene_id || '.svg' and image_data_url is null)
 or (scene_id = 'upload' and image_path = '/uploads/photo' and image_data_url is not null
 and char_length(image_data_url) between 30 and 1400000
 and image_data_url ~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$')
);
grant insert (image_data_url) on public.humor_captions to authenticated;
commit;
