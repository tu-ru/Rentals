-- INSERT INTO storage.buckets (id, name, public)
-- VALUES
--   ('property-images', 'property-images', false),
--   ('maintenance-photos', 'maintenance-photos', false),
--   ('documents', 'documents', false),
--   ('avatars', 'avatars', false);

-- CREATE POLICY "property_images_select" ON storage.objects
-- FOR SELECT USING (
--   bucket_id = 'property-images'
--   AND auth.role() = 'authenticated'
--   AND split_part(name, '/', 1)::uuid = get_my_org_id()
-- );

-- CREATE POLICY "property_images_insert" ON storage.objects
-- FOR INSERT WITH CHECK (
--   bucket_id = 'property-images'
--   AND auth.role() = 'authenticated'
--   AND split_part(name, '/', 1)::uuid = get_my_org_id()
-- );

-- CREATE POLICY "property_images_update" ON storage.objects
-- FOR UPDATE USING (
--   bucket_id = 'property-images'
--   AND auth.role() = 'authenticated'
--   AND split_part(name, '/', 1)::uuid = get_my_org_id()
-- )
-- WITH CHECK (
--   bucket_id = 'property-images'
--   AND auth.role() = 'authenticated'
--   AND split_part(name, '/', 1)::uuid = get_my_org_id()
-- );

-- CREATE POLICY "property_images_delete" ON storage.objects
-- FOR DELETE USING (
--   bucket_id = 'property-images'
--   AND auth.role() = 'authenticated'
--   AND split_part(name, '/', 1)::uuid = get_my_org_id()
-- );

-- CREATE POLICY "maintenance_photos_select" ON storage.objects
-- FOR SELECT USING (
--   bucket_id = 'maintenance-photos'
--   AND auth.role() = 'authenticated'
--   AND split_part(name, '/', 1)::uuid = get_my_org_id()
-- );

-- CREATE POLICY "maintenance_photos_insert" ON storage.objects
-- FOR INSERT WITH CHECK (
--   bucket_id = 'maintenance-photos'
--   AND auth.role() = 'authenticated'
--   AND split_part(name, '/', 1)::uuid = get_my_org_id()
-- );

-- CREATE POLICY "maintenance_photos_update" ON storage.objects
-- FOR UPDATE USING (
--   bucket_id = 'maintenance-photos'
--   AND auth.role() = 'authenticated'
--   AND split_part(name, '/', 1)::uuid = get_my_org_id()
-- )
-- WITH CHECK (
--   bucket_id = 'maintenance-photos'
--   AND auth.role() = 'authenticated'
--   AND split_part(name, '/', 1)::uuid = get_my_org_id()
-- );

-- CREATE POLICY "maintenance_photos_delete" ON storage.objects
-- FOR DELETE USING (
--   bucket_id = 'maintenance-photos'
--   AND auth.role() = 'authenticated'
--   AND split_part(name, '/', 1)::uuid = get_my_org_id()
-- );

-- CREATE POLICY "documents_select" ON storage.objects
-- FOR SELECT USING (
--   bucket_id = 'documents'
--   AND auth.role() = 'authenticated'
--   AND split_part(name, '/', 1)::uuid = get_my_org_id()
-- );

-- CREATE POLICY "documents_insert" ON storage.objects
-- FOR INSERT WITH CHECK (
--   bucket_id = 'documents'
--   AND auth.role() = 'authenticated'
--   AND split_part(name, '/', 1)::uuid = get_my_org_id()
-- );

-- CREATE POLICY "documents_update" ON storage.objects
-- FOR UPDATE USING (
--   bucket_id = 'documents'
--   AND auth.role() = 'authenticated'
--   AND split_part(name, '/', 1)::uuid = get_my_org_id()
-- )
-- WITH CHECK (
--   bucket_id = 'documents'
--   AND auth.role() = 'authenticated'
--   AND split_part(name, '/', 1)::uuid = get_my_org_id()
-- );

-- CREATE POLICY "documents_delete" ON storage.objects
-- FOR DELETE USING (
--   bucket_id = 'documents'
--   AND auth.role() = 'authenticated'
--   AND split_part(name, '/', 1)::uuid = get_my_org_id()
-- );

-- CREATE POLICY "avatars_select" ON storage.objects
-- FOR SELECT USING (
--   bucket_id = 'avatars'
--   AND auth.role() = 'authenticated'
--   AND split_part(name, '/', 1)::uuid = get_my_org_id()
-- );

-- CREATE POLICY "avatars_insert" ON storage.objects
-- FOR INSERT WITH CHECK (
--   bucket_id = 'avatars'
--   AND auth.role() = 'authenticated'
--   AND split_part(name, '/', 1)::uuid = get_my_org_id()
-- );

-- CREATE POLICY "avatars_update" ON storage.objects
-- FOR UPDATE USING (
--   bucket_id = 'avatars'
--   AND auth.role() = 'authenticated'
--   AND split_part(name, '/', 1)::uuid = get_my_org_id()
-- )
-- WITH CHECK (
--   bucket_id = 'avatars'
--   AND auth.role() = 'authenticated'
--   AND split_part(name, '/', 1)::uuid = get_my_org_id()
-- );

-- CREATE POLICY "avatars_delete" ON storage.objects
-- FOR DELETE USING (
--   bucket_id = 'avatars'
--   AND auth.role() = 'authenticated'
--   AND split_part(name, '/', 1)::uuid = get_my_org_id()
-- );
