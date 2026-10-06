-- Migration: Create business-assets storage bucket, storage RLS policies and cover_image_url column

-- 1. Add cover_image_url column to public.businesses if not exists
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS cover_image_url text;

-- 2. Create business-assets bucket in storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-assets',
  'business-assets',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

-- 3. Storage RLS policies on storage.objects
DROP POLICY IF EXISTS "Business assets select policy" ON storage.objects;
DROP POLICY IF EXISTS "Owners can upload business assets" ON storage.objects;
DROP POLICY IF EXISTS "Owners can update business assets" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete business assets" ON storage.objects;

-- SELECT policy: anonymous users (public booking) or the owner of that business_id
CREATE POLICY "Business assets select policy"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'business-assets'
  AND (
    auth.role() = 'anon'
    OR
    (
      split_part(name, '/', 1) ~ '^[0-9]+$'
      AND split_part(name, '/', 1)::bigint IN (
        SELECT id FROM public.businesses WHERE owner_id = auth.uid()
      )
    )
  )
);

-- INSERT policy: authenticated owner of the business specified in the first folder segment
CREATE POLICY "Owners can upload business assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-assets'
  AND (split_part(name, '/', 1) ~ '^[0-9]+$')
  AND (split_part(name, '/', 1)::bigint IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ))
);

-- UPDATE policy: authenticated owner of the business specified in the first folder segment
CREATE POLICY "Owners can update business assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'business-assets'
  AND (split_part(name, '/', 1) ~ '^[0-9]+$')
  AND (split_part(name, '/', 1)::bigint IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ))
)
WITH CHECK (
  bucket_id = 'business-assets'
  AND (split_part(name, '/', 1) ~ '^[0-9]+$')
  AND (split_part(name, '/', 1)::bigint IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ))
);

-- DELETE policy: authenticated owner of the business specified in the first folder segment
CREATE POLICY "Owners can delete business assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-assets'
  AND (split_part(name, '/', 1) ~ '^[0-9]+$')
  AND (split_part(name, '/', 1)::bigint IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ))
);

-- 4. Update get_public_business_data to return cover_image_url
CREATE OR REPLACE FUNCTION public.get_public_business_data(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bus RECORD;
  v_settings jsonb;
  v_hours jsonb;
  v_services jsonb;
  v_professionals jsonb;
  v_resources jsonb;
BEGIN
  -- 1. Find business by slug
  SELECT id, name, slug, business_type, phone, address, description, logo_url, cover_image_url
  INTO v_bus
  FROM public.businesses
  WHERE slug = p_slug;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- 2. Business settings (public rules only)
  SELECT jsonb_build_object(
    'avg_duration_minutes', avg_duration_minutes,
    'min_advance_hours', min_advance_hours,
    'tolerance_minutes', tolerance_minutes,
    'auto_confirm', auto_confirm,
    'cancellation_policy', cancellation_policy,
    'category_settings', category_settings
  )
  INTO v_settings
  FROM public.business_settings
  WHERE business_id = v_bus.id;

  IF v_settings IS NULL THEN
    v_settings := '{}'::jsonb;
  END IF;

  -- 3. Business hours
  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'day_of_week', day_of_week,
      'opening_time', opening_time::text,
      'closing_time', closing_time::text,
      'is_open', is_open
    ) ORDER BY day_of_week
  ), '[]'::jsonb)
  INTO v_hours
  FROM public.business_hours
  WHERE business_id = v_bus.id;

  -- 4. Active Services
  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'name', name,
      'description', description,
      'price', price,
      'duration_minutes', duration_minutes
    ) ORDER BY id
  ), '[]'::jsonb)
  INTO v_services
  FROM public.services
  WHERE business_id = v_bus.id AND active = true;

  -- 5. Active Professionals
  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'name', name,
      'specialty', specialty,
      'photo_url', photo_url
    ) ORDER BY id
  ), '[]'::jsonb)
  INTO v_professionals
  FROM public.professionals
  WHERE business_id = v_bus.id AND active = true;

  -- 6. Active Resources
  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'name', name,
      'resource_type', resource_type,
      'capacity', capacity
    ) ORDER BY id
  ), '[]'::jsonb)
  INTO v_resources
  FROM public.resources
  WHERE business_id = v_bus.id AND active = true;

  RETURN jsonb_build_object(
    'business', jsonb_build_object(
      'id', v_bus.id,
      'name', v_bus.name,
      'slug', v_bus.slug,
      'business_type', v_bus.business_type,
      'phone', v_bus.phone,
      'address', v_bus.address,
      'description', v_bus.description,
      'logo_url', v_bus.logo_url,
      'cover_image_url', v_bus.cover_image_url
    ),
    'settings', v_settings,
    'hours', v_hours,
    'services', v_services,
    'professionals', v_professionals,
    'resources', v_resources
  );
END;
$$;
