import { createClient } from '@supabase/supabase-js';

// REEMPLAZA ESTOS VALORES CON TUS CREDENCIALES DE SUPABASE
const supabaseUrl = 'https://ucfuyvdiejphvruokvxi.supabase.co'; // Ejemplo: https://xxxxx.supabase.co
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjZnV5dmRpZWpwaHZydW9rdnhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDIwNzMxNCwiZXhwIjoyMDc1NzgzMzE0fQ.ZIyLmDVYOo6bE3ixisjgzqNK2FjXYM-X_O1gDz2yCIw'; // La clave pública que copiaste

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Función helper para obtener el usuario actual
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Función helper para obtener el perfil completo del usuario
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error obteniendo perfil:', error);
    return null;
  }
  
  return data;
};