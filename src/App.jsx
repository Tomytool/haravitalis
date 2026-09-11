import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import HomePage from "./components/HomePage";
import QuienesSomosPage from "./components/QuienesSomosPage";
import TerapiasPage from "./components/TerapiasPage";
import AuthPage from "./components/AuthPage";
import BookingPage from "./components/BookingPage";
import AdminClasesPage from "./components/AdminClasesPage";
import { PrivacyPage, TermsPage, ContactPage, FaqPage } from "./components/InfoPages";
import Footer from "./components/Footer";
import { suscribirEstadoAuth, cerrarSesion } from "./firebase/authService";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authCargando, setAuthCargando] = useState(true);
  
  // Vistas soportadas: "home" | "quienes-somos" | "terapia" | "login" | "register" | "reserva" | "admin" | "privacidad" | "terminos" | "contacto" | "faq"
  const [vistaActual, setVistaActual] = useState("home");

  useEffect(() => {
    const unsubscribe = suscribirEstadoAuth((user) => {
      setCurrentUser(user);
      setAuthCargando(false);
    });

    return () => unsubscribe();
  }, []);

  const handleNavigateToAuth = (isRegister = false) => {
    setVistaActual(isRegister ? "register" : "login");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (user?.rol === 'admin') {
      setVistaActual('admin');
    } else {
      setVistaActual('reserva');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    try {
      setCurrentUser(null);
      setVistaActual('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      await cerrarSesion();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  if (authCargando) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F7F8FC',
        color: '#253B59',
        fontWeight: '600',
        fontSize: '1.1rem',
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}>
        Cargando Hara Vitalis Pilates...
      </div>
    );
  }

  const renderContent = () => {
    switch (vistaActual) {
      case "quienes-somos":
        return (
          <QuienesSomosPage 
            onNavigateToAuth={handleNavigateToAuth}
            onNavigateToBooking={() => setVistaActual('reserva')}
            currentUser={currentUser}
          />
        );
      case "terapia":
        return (
          <TerapiasPage 
            onNavigateToAuth={handleNavigateToAuth}
            onNavigateToBooking={() => setVistaActual('reserva')}
            currentUser={currentUser}
          />
        );
      case "login":
        return (
          <AuthPage 
            onLoginSuccess={handleLoginSuccess}
            initialRegisterMode={false}
            onNavigateHome={() => setVistaActual('home')}
          />
        );
      case "register":
        return (
          <AuthPage 
            onLoginSuccess={handleLoginSuccess}
            initialRegisterMode={true}
            onNavigateHome={() => setVistaActual('home')}
          />
        );
      case "privacidad":
        return <PrivacyPage onNavigateHome={() => setVistaActual('home')} />;
      case "terminos":
        return <TermsPage onNavigateHome={() => setVistaActual('home')} />;
      case "contacto":
        return <ContactPage onNavigateHome={() => setVistaActual('home')} />;
      case "faq":
        return <FaqPage onNavigateHome={() => setVistaActual('home')} />;
      case "admin":
        return currentUser?.rol === "admin" ? (
          <AdminClasesPage currentUser={currentUser} />
        ) : (
          <HomePage 
            onNavigateToAuth={handleNavigateToAuth} 
            onNavigateToBooking={() => setVistaActual('reserva')}
            currentUser={currentUser} 
          />
        );
      case "reserva":
        return currentUser ? (
          <BookingPage currentUser={currentUser} />
        ) : (
          <AuthPage 
            onLoginSuccess={handleLoginSuccess}
            initialRegisterMode={true}
            onNavigateHome={() => setVistaActual('home')}
          />
        );
      case "home":
      default:
        return (
          <HomePage 
            onNavigateToAuth={handleNavigateToAuth} 
            onNavigateToBooking={() => setVistaActual('reserva')}
            currentUser={currentUser} 
          />
        );
    }
  };

  return (
    <div className="app-container">
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        vistaActual={vistaActual}
        setVistaActual={setVistaActual}
        onNavigateToAuth={handleNavigateToAuth}
      />

      <main className="main-content">
        {renderContent()}
      </main>

      <Footer setVistaActual={setVistaActual} />
    </div>
  );
}
