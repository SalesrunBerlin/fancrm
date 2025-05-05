
CREATE OR REPLACE FUNCTION public.swap_tab_order(
  tab_id_1 UUID,
  tab_id_2 UUID,
  new_order_1 INT,
  new_order_2 INT
) RETURNS VOID AS $$
BEGIN
  -- Update first tab order
  UPDATE public.help_tabs
  SET display_order = new_order_1
  WHERE id = tab_id_1;
  
  -- Update second tab order
  UPDATE public.help_tabs
  SET display_order = new_order_2
  WHERE id = tab_id_2;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.swap_tab_order IS 'Swaps the display order of two tabs';
