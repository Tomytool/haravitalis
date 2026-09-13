import { useState } from "react";
import { LogoIcon } from "./Navbar";
import {
  iniciarSesion,
  registrarUsuario,
  recuperarPassword,
  iniciarSesionConGoogle,
} from "../firebase/authService";

export default function LoginForm({
  onLoginSuccess,
  initialRegisterMode = false,
}) {
  const [isRegisterMode, setIsRegisterMode] = useState(initialRegisterMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const usuarioLogueado = await iniciarSesionConGoogle();
      setSuccessMessage(
        `¡Bienvenido(a), ${usuarioLogueado.nombre || "usuario"}! Autenticación con Google exitosa...`,
      );
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(usuarioLogueado);
        }
      }, 600);
    } catch (error) {
      console.error("Error en autenticación con Google:", error);
      let msg = "No se pudo iniciar sesión con Google.";
      if (error.code === "auth/popup-closed-by-user") {
        msg =
          "La ventana de inicio de sesión de Google fue cerrada antes de finalizar.";
      } else if (error.code === "auth/unauthorized-domain") {
        msg =
          "El dominio actual no está autorizado en Firebase Console para Google Sign-In.";
      } else if (error.code === "auth/popup-blocked") {
        msg =
          "Tu navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes e intenta de nuevo.";
      } else if (error.message) {
        msg = error.message;
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecuperar = async () => {
    if (!email.trim()) {
      setErrorMessage(
        "Por favor ingresa tu correo electrónico en el campo superior para enviarte las instrucciones.",
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const msg = await recuperarPassword(email);
      setSuccessMessage(msg);
    } catch (error) {
      console.error("Error al recuperar clave:", error);
      let msg = "No se pudo enviar el correo de restablecimiento.";
      if (error.code === "auth/user-not-found") {
        msg = "No existe una cuenta registrada con este correo electrónico.";
      } else if (error.code === "auth/invalid-email") {
        msg = "El formato de correo electrónico no es válido.";
      } else if (error.message) {
        msg = error.message;
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      if (isRegisterMode) {
        if (!nombre.trim()) {
          setErrorMessage("Por favor ingresa tu nombre completo.");
          setIsLoading(false);
          return;
        }

        const usuarioCreado = await registrarUsuario({
          email: email.trim(),
          password,
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          rol: "cliente",
        });

        setSuccessMessage(
          `¡Cuenta creada con éxito, ${usuarioCreado.nombre}! El administrador debe asignarte tus clases pactadas según tu plan para habilitar tus reservas.`,
        );
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(usuarioCreado);
          }
        }, 1200);
      } else {
        const usuarioLogueado = await iniciarSesion(email.trim(), password);
        setSuccessMessage(
          `¡Bienvenido(a) de nuevo, ${usuarioLogueado.nombre || "usuario"}! Redirigiendo...`,
        );
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(usuarioLogueado);
          }
        }, 600);
      }
    } catch (error) {
      console.error("Error en autenticación:", error);
      let msg = "Ocurrió un error al procesar la solicitud.";
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        msg = "Correo o contraseña incorrectos.";
      } else if (error.code === "auth/email-already-in-use") {
        msg = "Este correo electrónico ya se encuentra registrado.";
      } else if (error.code === "auth/weak-password") {
        msg = "La contraseña debe tener al menos 6 caracteres.";
      } else if (error.code === "auth/invalid-email") {
        msg = "El formato de correo electrónico no es válido.";
      } else if (error.message) {
        msg = error.message;
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-card">
      {/* Header Badge con Logo */}
      <div className="auth-card-header">
        <div className="auth-logo-badge">
          <LogoIcon size={72} />
        </div>

        <h1 className="auth-title">
          {isRegisterMode ? "Crea tu cuenta" : "Bienvenido de nuevo"}
        </h1>
        <p className="auth-subtitle">
          {isRegisterMode
            ? "Regístrate para reservar tus clases de Pilates Reformer."
            : "Ingresa tus credenciales para acceder a tu cuenta."}
        </p>
      </div>

      {/* Tabs Modo Inicio / Registro */}
      <div
        style={{
          display: "flex",
          backgroundColor: "#F1F5F9",
          borderRadius: "10px",
          padding: "4px",
          marginBottom: "1.25rem",
        }}
      >
        <button
          type="button"
          onClick={() => {
            setIsRegisterMode(false);
            setErrorMessage("");
            setSuccessMessage("");
          }}
          style={{
            flex: 1,
            padding: "0.5rem",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "0.85rem",
            cursor: "pointer",
            backgroundColor: !isRegisterMode ? "#FFFFFF" : "transparent",
            color: !isRegisterMode ? "#253B59" : "#64748B",
            boxShadow: !isRegisterMode ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            transition:
              "background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease",
          }}
        >
          Iniciar Sesión
        </button>
        <button
          type="button"
          onClick={() => {
            setIsRegisterMode(true);
            setErrorMessage("");
            setSuccessMessage("");
          }}
          style={{
            flex: 1,
            padding: "0.5rem",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "0.85rem",
            cursor: "pointer",
            backgroundColor: isRegisterMode ? "#FFFFFF" : "transparent",
            color: isRegisterMode ? "#253B59" : "#64748B",
            boxShadow: isRegisterMode ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            transition:
              "background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease",
          }}
        >
          Registrarse
        </button>
      </div>

      {/* Botón de Autenticación con Google */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          padding: "0.75rem 1rem",
          backgroundColor: "#FFFFFF",
          border: "1px solid #CBD5E1",
          borderRadius: "10px",
          color: "#1E293B",
          fontWeight: "600",
          fontSize: "0.95rem",
          cursor: isLoading ? "not-allowed" : "pointer",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          transition: "all 0.2s ease",
          marginBottom: "1rem",
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = "#F8FAFC";
            e.currentTarget.style.borderColor = "#94A3B8";
          }
        }}
        onMouseLeave={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = "#FFFFFF";
            e.currentTarget.style.borderColor = "#CBD5E1";
          }
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.3 7.31 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.18 0 10.03 0 12s.46 3.82 1.26 5.42l4.02-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
        <span>
          {isRegisterMode ? "Registrarse con Google" : "Continuar con Google"}
        </span>
      </button>

      {/* Separador Visual */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "1.25rem",
          color: "#94A3B8",
          fontSize: "0.8rem",
          fontWeight: "500",
        }}
      >
        <div
          style={{ flex: 1, height: "1px", backgroundColor: "#E2E8F0" }}
        ></div>
        <span
          style={{
            padding: "0 10px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          o con tu correo
        </span>
        <div
          style={{ flex: 1, height: "1px", backgroundColor: "#E2E8F0" }}
        ></div>
      </div>

      {/* Formulario */}
      <form className="auth-form" onSubmit={handleSubmit}>
        {isRegisterMode && (
          <>
            <div className="form-group">
              <label className="form-label" htmlFor="nombre">
                Nombre Completo
              </label>
              <div className="input-wrapper">
                <input
                  id="nombre"
                  type="text"
                  required
                  className="form-input"
                  placeholder="ej. Valeria Rojas"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="telefono">
                Teléfono
              </label>
              <div className="input-wrapper">
                <input
                  id="telefono"
                  type="tel"
                  className="form-input"
                  placeholder="ej. +56912345678"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="email">
            Correo Electrónico
          </label>
          <div className="input-wrapper">
            <input
              id="email"
              type="email"
              required
              className="form-input"
              placeholder="tu@correo.com"
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
            {!isRegisterMode && (
              <button
                type="button"
                onClick={handleRecuperar}
                className="forgot-link"
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </div>
          <div
            className="input-wrapper"
            style={{ display: "flex", alignItems: "center" }}
          >
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              style={{
                position: "absolute",
                right: "12px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#64748B",
                fontSize: "0.8rem",
                fontWeight: "600",
              }}
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div
            style={{
              padding: "0.75rem",
              backgroundColor: "#FEF2F2",
              border: "1px solid #FCA5A5",
              borderRadius: "8px",
              color: "#991B1B",
              fontSize: "0.875rem",
              textAlign: "center",
              fontWeight: "500",
            }}
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            style={{
              padding: "0.75rem",
              backgroundColor: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: "8px",
              color: "#166534",
              fontSize: "0.875rem",
              textAlign: "center",
              fontWeight: "500",
            }}
          >
            {successMessage}
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? (
            <span>Procesando...</span>
          ) : (
            <>
              <span>{isRegisterMode ? "Crear Cuenta" : "Entrar"}</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </>
          )}
        </button>
      </form>

      <p className="auth-footer-text">
        {isRegisterMode ? "¿Ya tienes una cuenta?" : "¿No tienes una cuenta?"}{" "}
        <button
          type="button"
          onClick={() => {
            setIsRegisterMode(!isRegisterMode);
            setErrorMessage("");
            setSuccessMessage("");
          }}
          style={{
            background: "none",
            border: "none",
            color: "#253B59",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          {isRegisterMode ? "Inicia sesión aquí" : "Regístrate aquí"}
        </button>
      </p>
    </div>
  );
}
