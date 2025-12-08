import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, redirigir a login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si se requiere un rol específico y el usuario no lo tiene
  if (requiredRole && profile?.rol !== requiredRole) {
    // Si es cliente intentando acceder a servicio taller, redirigir a inicio
    if (profile?.rol === 'cliente') {
      return <Navigate to="/" replace />;
    }
    // Si es mecánico/admin sin el rol correcto, redirigir a login
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;