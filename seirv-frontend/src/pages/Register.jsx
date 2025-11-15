import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './auth.scss';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);       // usa /api/v1/auth/register
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al registrar usuario';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <h1 className="auth-title">Crear Cuenta</h1>
        <p className="auth-subtitle">Regístrate en el Sistema SEIRV</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre Completo</label>
            <input
              name="full_name"
              type="text"
              placeholder="Ej: Juan Pérez"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Usuario</label>
            <input
              name="username"
              type="text"
              placeholder="Ej: juanperez"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              name="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              name="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <p className="auth-switch">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
