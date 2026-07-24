import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usuarios as api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => { setUsername(''); setEmail(''); setPassword(''); setError(null); setShowPassword(false); };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const users = await api.listar();
      const found = users.find(
        (u) => u.email === email && u.password === password
      );
      if (!found) throw new Error('Email o contrasena incorrectos.');
      login(found);
      navigate('/');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    if (!username || !email || !password) { setError('Todos los campos son obligatorios.'); return; }
    setLoading(true);
    try {
      const newUser = await api.registrar({ username, email, password, rol: 'USER' });
      login(newUser);
      navigate('/');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 style={{ fontSize: '1.4rem', color: 'var(--text)', marginBottom: '4px' }}>
          {mode === 'login' ? 'Iniciar Sesion' : 'Crear Cuenta'}
        </h2>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', marginBottom: '24px' }}>
          {mode === 'login'
            ? 'Ingresa tus credenciales para acceder'
            : 'Registrate para empezar a comprar'}
        </p>

        {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{error}</div>}

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="mi_usuario"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contrasena</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
                style={{ paddingRight: '42px' }}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
            {loading ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Registrarse'}
          </button>
        </form>

        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '18px', textAlign: 'center' }}>
          {mode === 'login' ? (
            <>No tienes cuenta? <button className="link-btn" onClick={() => { resetForm(); setMode('register'); }}>Registrate</button></>
          ) : (
            <>Ya tienes cuenta? <button className="link-btn" onClick={() => { resetForm(); setMode('login'); }}>Inicia sesion</button></>
          )}
        </p>
      </div>
    </div>
  );
}
