
-- Create a view for auth users that can be accessed by the edge function
CREATE OR REPLACE VIEW public.auth_users_view AS
SELECT id, email
FROM auth.users;

-- Grant access to the service role
GRANT SELECT ON public.auth_users_view TO service_role;
