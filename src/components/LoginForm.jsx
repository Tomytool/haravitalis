import { useState } from 'react';
import { LogoIcon } from './Navbar';
import { usuarios } from '../datos/datos';

export default function LoginForm({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    // Verificar las credenciales con los datos de datos.js
    setTimeout(() => {
      setIsLoading(false);
      
      const inputTrimmed = email.trim().toLowerCase();
      const usuarioEncontrado = usuarios.find(
        (u) => 
          (u.email.toLowerCase() === inputTrimmed || u.usuario.toLowerCase() === inputTrimmed) &&
          u.contrasena === password
      );

      if (usuarioEncontrado) {
        console.log("El usuario está correcto:", usuarioEncontrado);
        setSuccessMessage(`¡Bienvenido de nuevo, ${usuarioEncontrado.usuario}! Redirigiendo...`);
        
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(usuarioEncontrado);
          }
        }, 500);
      } else {
        console.log("Usuario inválido");
        setErrorMessage("Usuario inválido");
      }
    }, 600);
  };

  return (
    <div className="auth-card">
      {/* Header Badge con Logo */}
      <div className="auth-card-header">
        <div className="auth-logo-badge">
          <LogoIcon size={32} color="#253B59" />
          <div style={{ 
            fontSize: '0.65rem', 
            fontWeight: '700', 
            color: '#253B59', 
            marginTop: '4px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            textAlign: 'center',
            lineHeight: 1
          }}>
            Hara Vitalis
          </div>
          <div style={{ 
            fontSize: '0.45rem', 
            color: '#64748B', 
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textAlign: 'center',
            marginTop: '2px'
          }}>
            Pilates Studio
          </div>
        </div>

        <h1 className="auth-title">Bienvenido de nuevo</h1>
        <p className="auth-subtitle">
          Ingresa tus credenciales para acceder a tu cuenta de Hara Vitalis.
        </p>
      </div>

      {/* Formulario */}
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="email">
            Correo electrónico o Usuario
          </label>
          <div className="input-wrapper">
            <input
              id="email"
              type="text"
              required
              className="form-input"
              placeholder="tu@correo.com o usuario"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <div className="form-label-row">
            <label className="form-label" htmlFor="password">
              Contraseña
            </label>
            <a href="#forgot" className="forgot-link">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          <div className="input-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              style={{
                position: 'absolute',
                right: '12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748B',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            color: '#991B1B',
            fontSize: '0.875rem',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '8px',
            color: '#166534',
            fontSize: '0.875rem',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            {successMessage}
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? (
            <span>Verificando...</span>
          ) : (
            <>
              <span>Entrar</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </>
          )}
        </button>
      </form>

      <p className="auth-footer-text">
        ¿No tienes una cuenta?{' '}
        <a href="#register" className="register-link">
          Regístrate aquí
        </a>
      </p>
    </div>
  );
}
