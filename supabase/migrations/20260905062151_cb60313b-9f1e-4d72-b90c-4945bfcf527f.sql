GRANT EXECUTE ON FUNCTION public.update_wheel_settings(text, text[], integer) TO anon;
GRANT EXECUTE ON FUNCTION public.update_wheel_settings(text, text[], integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_wheel_settings(text, text[], integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.request_spin() TO anon;
GRANT EXECUTE ON FUNCTION public.request_spin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_spin() TO service_role;