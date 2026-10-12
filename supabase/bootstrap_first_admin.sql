-- Reemplaza el correo por el del primer administrador, después de crear ese usuario en Supabase Authentication.
update public.profiles set role = 'superadmin' where id = (select id from auth.users where email = 'TU_CORREO@EJEMPLO.CL');
