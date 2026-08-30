import { useState } from 'react';
import Navbar from './components/Navbar';
import LoginForm from './components/LoginForm';
import BookingPage from './components/BookingPage';
import Footer from './components/Footer';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <div className="app-container">
      <Navbar currentUser={currentUser} onLogout={handleLogout} />
      
      <main className="main-content">
        {!currentUser ? (
          <div className="split-layout">
            {/* Columna Izquierda: Imagen del Estudio */}
            <div className="hero-image-container">
              <img 
                src="/pilates-studio.jpg" 
                alt="Estudio de Pilates Reformer con grandes ventanales y luz natural" 
                className="hero-image"
              />
            </div>

            {/* Columna Derecha: Tarjeta de Autenticación */}
            <section className="auth-section">
              <LoginForm onLoginSuccess={handleLoginSuccess} />
            </section>
          </div>
        ) : (
          <BookingPage currentUser={currentUser} />
        )}
      </main>

      <Footer />
    </div>
  );
}
