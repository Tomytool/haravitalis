import LoginForm from './LoginForm';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, initialRegisterMode = false }) {
  if (!isOpen) return null;

  return (
    <div 
      className="auth-modal-overlay" 
      onClick={onClose} 
      aria-modal="true" 
      role="dialog"
      aria-label="Modal de autenticación de usuario"
    >
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose} aria-label="Cerrar ventana modal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <LoginForm 
          onLoginSuccess={(user) => {
            onLoginSuccess(user);
            onClose();
          }} 
          initialRegisterMode={initialRegisterMode} 
        />
      </div>
    </div>
  );
}
