
-- Create functions for encryption and decryption of API keys

-- Function to encrypt API key using pgcrypto
CREATE OR REPLACE FUNCTION public.encrypt_api_key(p_key TEXT, p_secret TEXT)
RETURNS TABLE(encrypted_key BYTEA) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT 
    pgp_sym_encrypt(p_key, p_secret, 'cipher-algo=aes256') AS encrypted_key;
END;
$$;

-- Function to decrypt API key using pgcrypto
CREATE OR REPLACE FUNCTION public.decrypt_api_key(p_encrypted_key BYTEA, p_secret TEXT)
RETURNS TABLE(decrypted_key TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT 
    pgp_sym_decrypt(p_encrypted_key, p_secret)::TEXT AS decrypted_key;
END;
$$;

-- Function to update token usage
CREATE OR REPLACE FUNCTION public.update_openai_usage(
  p_profile_id UUID, 
  p_prompt_tokens INT, 
  p_completion_tokens INT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.openai_usage_profile 
    (profile_id, day, prompt_tokens, completion_tokens)
  VALUES 
    (p_profile_id, current_date, p_prompt_tokens, p_completion_tokens)
  ON CONFLICT (profile_id, day) 
  DO UPDATE SET
    prompt_tokens = openai_usage_profile.prompt_tokens + p_prompt_tokens,
    completion_tokens = openai_usage_profile.completion_tokens + p_completion_tokens;
END;
$$;
