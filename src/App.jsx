import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import AgendarCita from './pages/AgendarCita';
import ServicioTaller from './pages/ServicioTaller';
import Login from './pages/Login';
import Register from './pages/Register';
import KanbanTareas from './components/KanbanTareas';
import OrdenesTrabajo from './components/OrdenesTrabajo';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Rutas que requieren autenticación */}
          <Route 
            path="/agendar-cita" 
            element={
              <ProtectedRoute>
                <AgendarCita />
              </ProtectedRoute>
            } 
          />
          
          {/* Ruta solo para Admin y Mecánico */}
          <Route 
            path="/servicio-taller" 
            element={
              <ProtectedRoute>
                <ServicioTaller />
              </ProtectedRoute>
            } 
          />

          {/* NUEVAS RUTAS - Kanban y Órdenes de Trabajo */}
          <Route 
            path="/taller/kanban" 
            element={
              <ProtectedRoute>
                <KanbanTareas />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/taller/ordenes" 
            element={
              <ProtectedRoute>
                <OrdenesTrabajo />
              </ProtectedRoute>
            } 
          />
        </Routes>
        <Footer />
        <WhatsAppButton />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;