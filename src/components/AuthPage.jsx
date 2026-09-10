import LoginForm from './LoginForm';
import imagenFondo from '/pilates-studio-wide.jpg';

export default function AuthPage({ onLoginSuccess, initialRegisterMode = false, onNavigateHome }) {
  return (
    <div className="auth-page-container">
      <div className="auth-page-split">
        {/* Columna Izquierda: Imagen del Estudio */}
        <div className="auth-page-image-col">
          <img 
            src={imagenFondo} 
            alt="Estudio Pilates Reformer - Hara Vitalis" 
            className="auth-page-img"
          />
          <div className="auth-page-image-overlay">
            <button onClick={onNavigateHome} className="btn-back-home">
              ← Volver al Inicio
            </button>
            <div className="auth-image-text">
              <h2>Tu espacio de bienestar y renovación</h2>
              <p>Únete a Hara Vitalis y comienza tu transformación a través de la precisión del Pilates Reformer.</p>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Formulario de Autenticación / Registro */}
        <div className="auth-page-form-col">
          <div className="auth-form-wrapper">
            <LoginForm 
              onLoginSuccess={onLoginSuccess} 
              initialRegisterMode={initialRegisterMode} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
