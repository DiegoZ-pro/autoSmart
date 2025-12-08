import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sesión actual
    checkUser();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await loadUserProfile(user.id);
      }
    } catch (error) {
      console.error('Error verificando usuario:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error cargando perfil:', error);
    }
  };

  // REGISTRO de nuevo usuario (solo como cliente)
  const signUp = async (email, password, nombreCompleto, telefono) => {
    try {
      // Verificar si el email ya existe
      const { data: existingUser } = await supabase
        .from('perfiles')
        .select('email')
        .eq('email', email)
        .single();

      if (existingUser) {
        return { 
          data: null, 
          error: { message: 'Este correo electrónico ya está registrado' } 
        };
      }

      // Crear usuario en Auth CON metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre_completo: nombreCompleto,
            telefono: telefono,
          }
        }
      });

      if (authError) throw authError;

      // El trigger automáticamente creará el perfil
      return { data: authData, error: null };
    } catch (error) {
      console.error('Error en registro:', error);
      return { data: null, error };
    }
  };

  // LOGIN
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error en login:', error);
      return { data: null, error };
    }
  };

  // LOGOUT
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  // CREAR USUARIO (Admin crea Mecánico o Admin)
  const createUser = async (email, password, nombreCompleto, telefono, rol) => {
    try {
      // Solo admin puede crear usuarios con roles diferentes a cliente
      if (profile?.rol !== 'admin') {
        throw new Error('No tienes permisos para crear usuarios');
      }

      // 1. Crear usuario en Auth CON metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre_completo: nombreCompleto,
            telefono: telefono,
            rol_solicitado: rol, // Pasamos el rol deseado
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Como admin, actualizar el rol manualmente
        const { error: updateError } = await supabase
          .from('perfiles')
          .update({ rol: rol })
          .eq('id', authData.user.id);

        if (updateError) throw updateError;
        return { data: authData, error: null };
      }
    } catch (error) {
      console.error('Error creando usuario:', error);
      return { data: null, error };
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    createUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;