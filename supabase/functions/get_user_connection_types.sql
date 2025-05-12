
CREATE OR REPLACE FUNCTION public.get_user_connection_types()
 RETURNS TABLE(service_type text, has_connection boolean, display_name text, connection_id uuid, is_active boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY 
  SELECT 
    uc.service_type,
    true AS has_connection,
    uc.display_name,
    uc.id AS connection_id,
    uc.is_active
  FROM 
    public.user_connections uc
  WHERE 
    uc.profile_id = auth.uid()
  
  UNION
  
  -- Include predefined connection types that don't exist yet for this user
  SELECT 
    service_type,
    false AS has_connection,
    service_type AS display_name,
    NULL::uuid AS connection_id,
    false AS is_active
  FROM (
    VALUES 
      ('openai'),
      ('anthropic'),
      ('google'),
      ('azure'),
      ('perplexity')
  ) AS predefined(service_type)
  WHERE 
    NOT EXISTS (
      SELECT 1 
      FROM public.user_connections 
      WHERE profile_id = auth.uid() AND service_type = predefined.service_type
    );
END;
$function$
