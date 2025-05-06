
CREATE OR REPLACE FUNCTION public.get_public_related_records(
  p_record_id UUID,
  p_related_object_type_id UUID,
  p_relationship_id UUID
)
RETURNS SETOF JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH related_records AS (
    SELECT 
      r.id,
      r.record_id,
      r.object_type_id,
      r.created_at,
      r.updated_at,
      r.owner_id
    FROM 
      public.object_records r
    WHERE
      r.object_type_id = p_related_object_type_id
  ),
  field_values AS (
    SELECT 
      fv.record_id,
      jsonb_object_agg(fv.field_api_name, fv.value) AS field_values
    FROM 
      public.object_field_values fv
    JOIN 
      related_records rr ON fv.record_id = rr.id
    GROUP BY 
      fv.record_id
  )
  SELECT 
    jsonb_build_object(
      'id', r.id,
      'record_id', r.record_id,
      'object_type_id', r.object_type_id,
      'created_at', r.created_at,
      'updated_at', r.updated_at,
      'owner_id', r.owner_id,
      'field_values', COALESCE(fv.field_values, '{}'::jsonb)
    )
  FROM 
    related_records r
  LEFT JOIN 
    field_values fv ON r.id = fv.record_id;
END;
$$;

-- Grant execution permission to public
GRANT EXECUTE ON FUNCTION public.get_public_related_records TO public;

COMMENT ON FUNCTION public.get_public_related_records IS 'Efficiently fetches related records and their field values in a single query for public record sharing';
