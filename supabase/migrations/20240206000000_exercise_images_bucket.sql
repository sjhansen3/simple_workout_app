-- Create storage bucket for exercise images
INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise-images', 'exercise-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload exercise images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exercise-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update their own exercise images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'exercise-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete their own exercise images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'exercise-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access (for shared workouts)
CREATE POLICY "Anyone can view exercise images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'exercise-images');
