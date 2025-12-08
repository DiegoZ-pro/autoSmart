import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  X,
  Save,
  Mail,
  Phone,
  User,
  Shield,
  Lock
} from 'lucide-react';
import './GestionUsuarios.css';

const GestionUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  
  const [formData, setFormData] = useState({
    id: '',
    email: '',
    nombre_completo: '',
    telefono: '',
    rol: 'cliente',
    password: ''
  });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      setMensaje({ tipo: 'error', texto: 'Error al cargar usuarios' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const abrirModalNuevo = () => {
    setFormData({
      id: '',
      email: '',
      nombre_completo: '',
      telefono: '',
      rol: 'cliente',
      password: ''
    });
    setEditMode(false);
    setModalOpen(true);
    setMensaje({ tipo: '', texto: '' });
  };

  const abrirModalEditar = (usuario) => {
    setFormData({
      id: usuario.id,
      email: usuario.email,
      nombre_completo: usuario.nombre_completo,
      telefono: usuario.telefono || '',
      rol: usuario.rol,
      password: '' // No mostramos la contraseña
    });
    setEditMode(true);
    setModalOpen(true);
    setMensaje({ tipo: '', texto: '' });
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setFormData({
      id: '',
      email: '',
      nombre_completo: '',
      telefono: '',
      rol: 'cliente',
      password: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      if (editMode) {
        // ACTUALIZAR usuario existente
        const { error: updateError } = await supabase
          .from('perfiles')
          .update({
            nombre_completo: formData.nombre_completo,
            telefono: formData.telefono,
            rol: formData.rol
          })
          .eq('id', formData.id);

        if (updateError) throw updateError;

        // Si cambió el email, actualizarlo en auth.users también
        if (formData.email !== usuarios.find(u => u.id === formData.id)?.email) {
          const { error: authError } = await supabase.auth.admin.updateUserById(
            formData.id,
            { email: formData.email }
          );
          if (authError) console.error('Error actualizando email:', authError);
        }

        // Si hay nueva contraseña, actualizarla
        if (formData.password) {
          const { error: passError } = await supabase.auth.admin.updateUserById(
            formData.id,
            { password: formData.password }
          );
          if (passError) console.error('Error actualizando contraseña:', passError);
        }

        setMensaje({ tipo: 'exito', texto: '✅ Usuario actualizado exitosamente' });
      } else {
        // CREAR nuevo usuario
        if (!formData.password || formData.password.length < 6) {
          setMensaje({ tipo: 'error', texto: 'La contraseña debe tener al menos 6 caracteres' });
          setLoading(false);
          return;
        }

        // Crear usuario en auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          email_confirm: true,
          user_metadata: {
            nombre_completo: formData.nombre_completo,
            telefono: formData.telefono
          }
        });


        if (authError) throw authError;

        // Si el rol NO es cliente, actualizarlo
        if (authData.user && formData.rol !== 'cliente') {
          const { error: updateRolError } = await supabase
            .from('perfiles')
            .update({ rol: formData.rol })
            .eq('id', authData.user.id);

          if (updateRolError) throw updateRolError;
        }

        setMensaje({ tipo: 'exito', texto: '✅ Usuario creado exitosamente' });
      }

      await cargarUsuarios();
      setTimeout(() => {
        cerrarModal();
      }, 1500);

    } catch (error) {
      console.error('Error:', error);
      setMensaje({ 
        tipo: 'error', 
        texto: `❌ Error: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const eliminarUsuario = async (id, email) => {
    if (!window.confirm(`¿Estás seguro de eliminar al usuario ${email}?`)) {
      return;
    }

    setLoading(true);
    try {
      // Eliminar de auth (esto también eliminará de perfiles por CASCADE)
      const { error: authError } = await supabase.auth.admin.deleteUser(id);
      
      if (authError) throw authError;

      setMensaje({ tipo: 'exito', texto: '✅ Usuario eliminado exitosamente' });
      await cargarUsuarios();
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      setMensaje({ tipo: 'error', texto: '❌ Error al eliminar usuario' });
    } finally {
      setLoading(false);
    }
  };

  const usuariosFiltrados = usuarios.filter(usuario =>
    usuario.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.rol?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRolBadge = (rol) => {
    const badges = {
      admin: { color: '#DC2626', bg: '#FEE2E2', text: 'Administrador' },
      mecanico: { color: '#0066CC', bg: '#DBEAFE', text: 'Mecánico' },
      cliente: { color: '#059669', bg: '#D1FAE5', text: 'Cliente' }
    };
    return badges[rol] || badges.cliente;
  };

  return (
    <div className="gestion-usuarios">
      <div className="usuarios-header">
        <div className="header-left">
          <Users size={32} />
          <div>
            <h2>Gestión de Usuarios</h2>
            <p>Administra usuarios, roles y permisos del sistema</p>
          </div>
        </div>
        <button className="btn-nuevo-usuario" onClick={abrirModalNuevo}>
          <UserPlus size={20} />
          Nuevo Usuario
        </button>
      </div>

      {mensaje.texto && (
        <div className={`mensaje-alert ${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="usuarios-toolbar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, email o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="usuarios-stats">
          <span>Total: {usuariosFiltrados.length} usuarios</span>
        </div>
      </div>

      <div className="usuarios-table-container">
        <table className="usuarios-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Rol</th>
              <th>Fecha Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                  Cargando usuarios...
                </td>
              </tr>
            ) : usuariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                  No se encontraron usuarios
                </td>
              </tr>
            ) : (
              usuariosFiltrados.map((usuario) => {
                const rolBadge = getRolBadge(usuario.rol);
                return (
                  <tr key={usuario.id}>
                    <td>
                      <div className="usuario-info">
                        <div className="usuario-avatar">
                          {usuario.nombre_completo?.charAt(0).toUpperCase()}
                        </div>
                        <span className="usuario-nombre">{usuario.nombre_completo}</span>
                      </div>
                    </td>
                    <td>{usuario.email}</td>
                    <td>{usuario.telefono || '-'}</td>
                    <td>
                      <span 
                        className="rol-badge" 
                        style={{ 
                          backgroundColor: rolBadge.bg, 
                          color: rolBadge.color 
                        }}
                      >
                        {rolBadge.text}
                      </span>
                    </td>
                    <td>{new Date(usuario.fecha_creacion).toLocaleDateString()}</td>
                    <td>
                      <div className="acciones-btns">
                        <button 
                          className="btn-accion editar" 
                          onClick={() => abrirModalEditar(usuario)}
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="btn-accion eliminar" 
                          onClick={() => eliminarUsuario(usuario.id, usuario.email)}
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editMode ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <button className="btn-cerrar-modal" onClick={cerrarModal}>
                <X size={24} />
              </button>
            </div>

            {mensaje.texto && (
              <div className={`mensaje-alert ${mensaje.tipo}`}>
                {mensaje.texto}
              </div>
            )}

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row-two">
                <div className="form-group">
                  <label>
                    <User size={18} />
                    Nombre Completo*
                  </label>
                  <input
                    type="text"
                    name="nombre_completo"
                    value={formData.nombre_completo}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Mail size={18} />
                    Email*
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={loading || editMode}
                  />
                </div>
              </div>

              <div className="form-row-two">
                <div className="form-group">
                  <label>
                    <Phone size={18} />
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Shield size={18} />
                    Rol*
                  </label>
                  <select
                    name="rol"
                    value={formData.rol}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  >
                    <option value="cliente">Cliente</option>
                    <option value="mecanico">Mecánico</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>
                  <Lock size={18} />
                  {editMode ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña*'}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={editMode ? 'Dejar vacío si no desea cambiar' : 'Mínimo 6 caracteres'}
                  required={!editMode}
                  disabled={loading}
                />
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-cancelar" 
                  onClick={cerrarModal}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-guardar"
                  disabled={loading}
                >
                  <Save size={20} />
                  {loading ? 'Guardando...' : editMode ? 'Actualizar' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionUsuarios;