import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase connection
const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

// Checks if Supabase connection is configured with valid credentials
export const isSupabaseConfigured = (): boolean => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.length > 0 &&
    !supabaseUrl.includes('your-project') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.length > 0 &&
    !supabaseAnonKey.includes('your-supabase-anon-key')
  );
};

// Singleton Supabase Client Instance (fallback to dummy URL if missing to prevent startup crash)
export const supabase = createClient(
  isSupabaseConfigured() ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-key'
);

// Super Admin Default Credentials Reference
export const SUPER_ADMIN_CREDENTIALS = {
  fullName: 'Super Administrador Rosquetes',
  email: 'admin@rosquetes.com',
  pinCode: 'admin2026',
  alternatePins: ['admin', '1234'],
};

/**
 * Helper to test Supabase connection status
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase no está configurado aún. Agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tus variables de entorno.',
    };
  }

  try {
    const { data, error } = await supabase.from('store_settings').select('id').limit(1);
    if (error) {
      return { success: false, message: `Error de conexión: ${error.message}` };
    }
    return { success: true, message: '¡Conexión exitosa con la base de datos de Supabase!' };
  } catch (err: any) {
    return { success: false, message: `Excepción al conectar: ${err?.message || 'Error desconocido'}` };
  }
}
