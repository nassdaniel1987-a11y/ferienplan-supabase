-- Storage Policies für ferienplan-bilder Bucket
-- Diese SQL-Befehle kannst du im Supabase SQL Editor ausführen
-- Alternative zum manuellen Erstellen der Policies im UI

-- Policy 1: Upload erlauben (INSERT)
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'ferienplan-bilder');

-- Policy 2: Download/Lesen erlauben (SELECT)
CREATE POLICY "Public Read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'ferienplan-bilder');

-- Policy 3: Löschen erlauben (DELETE)
CREATE POLICY "Public Delete"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'ferienplan-bilder');

-- Policy 4: Update erlauben (UPDATE) - optional
CREATE POLICY "Public Update"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'ferienplan-bilder')
WITH CHECK (bucket_id = 'ferienplan-bilder');

-- HINWEIS:
-- Wenn du diese Policies später wieder löschen willst:
-- DROP POLICY "Public Upload" ON storage.objects;
-- DROP POLICY "Public Read" ON storage.objects;
-- DROP POLICY "Public Delete" ON storage.objects;
-- DROP POLICY "Public Update" ON storage.objects;
