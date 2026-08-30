
export const LogoIcon = ({ size = 24, color = "#253B59" }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M20 8C21.6569 8 23 6.65685 23 5C23 3.34315 21.6569 2 20 2C18.3431 2 17 3.34315 17 5C17 6.65685 18.3431 8 20 8Z" 
      stroke={color} 
      strokeWidth="2.2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M12 16C15 14 18 13.5 22 14.5C26 15.5 28 18 30 20" 
      stroke={color} 
      strokeWidth="2.2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M14 22L19 16L24 23L31 27" 
      stroke={color} 
      strokeWidth="2.2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M19 23L15 34" 
      stroke={color} 
      strokeWidth="2.2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M24 23L27 34" 
      stroke={color} 
      strokeWidth="2.2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export default function Navbar({ currentUser, onLogout }) {
  return (
    <header className="navbar">
      <a href="#" className="brand-logo" aria-label="Hara Vitalis Inicio">
        <div className="brand-icon">
          <LogoIcon size={24} color="#253B59" />
        </div>
        <span className="brand-name">Hara Vitalis</span>
      </a>

      {currentUser && (
        <div className="navbar-user-actions">
          <div className="user-badge">
            <span>👤</span>
            <span>{currentUser.usuario}</span>
          </div>
          <button onClick={onLogout} className="btn-logout">
            Cerrar sesión
          </button>
        </div>
      )}
    </header>
  );
}
