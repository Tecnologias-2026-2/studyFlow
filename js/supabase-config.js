/* =========================================================
   StudyFlow — Conexión con Supabase (solo cuentas de usuario)

   url: dirección del proyecto de Supabase.
   key: clave "publishable" (sb_publishable_...) o "anon" del proyecto.
        Es pública por diseño: va en el navegador y no da acceso a las
        contraseñas. NUNCA pongas aquí la clave secreta (service_role).

   Si "key" está vacía, las cuentas se guardan en el navegador como antes.
   ========================================================= */

window.SF_SUPABASE = {
  url: 'https://dguoocmhmbyazetmesow.supabase.co',
  key: ''
};
