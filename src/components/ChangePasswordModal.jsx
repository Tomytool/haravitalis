import { useState } from 'react';
import { cambiarPasswordUsuario } from '../firebase/authService';

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [claveAntigua, setClaveAntigua] = useState('');
  const [claveNueva, setClaveNueva] = useState('');
  const [rectificarClave, setRectificarClave] = useState('');

  const [showAntigua, setShowAntigua] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showRectificar, setShowRectificar] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensajeExito('');
    setMensajeError('');

    try {
      if (claveNueva !== rectificarClave) {
        throw new Error("La nueva contraseña y la confirmación no coinciden.");
      }

      if (claveNueva.length < 6) {
        throw new Error("La nueva contraseña debe tener al menos 6 caracteres.");
      }

      const res = await cambiarPasswordUsuario({
        claveAntigua,
        claveNueva,
        rectificarClave
      });

      setMensajeExito(res);
      setClaveAntigua('');
      setClaveNueva('');
      setRectificarClave('');

      setTimeout(() => {
        setMensajeExito('');
        onClose();
      }, 2500);
    } catch (error) {
      console.error("Error cambiando clave:", error);
      setMensajeError(error.message || "No se pudo cambiar la contraseña.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1200,
      padding: '1.5rem'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        maxWidth: '460px',
        width: '100%',
        padding: '2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #CED0F2'
      }}>
        {/* Header Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#253B59', margin: 0 }}>
              🔑 Cambiar Contraseña
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>
              Actualiza tu clave de acceso en Firebase
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de cambio de contraseña"
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748B' }}
          >
            ✕
          </button>
        </div>

        {/* Mensajes de Alerta */}
        {mensajeError && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '10px',
            color: '#991B1B',
            fontSize: '0.875rem',
            fontWeight: '600',
            marginBottom: '1rem'
          }}>
            ⚠️ {mensajeError}
          </div>
        )}

        {mensajeExito && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '10px',
            color: '#166534',
            fontSize: '0.875rem',
            fontWeight: '600',
            marginBottom: '1rem'
          }}>
            ✨ {mensajeExito}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* 1. Clave Antigua */}
          <div>
            <label htmlFor="clave-antigua" style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', color: '#253B59', marginBottom: '0.35rem' }}>
              1. Contraseña Antigua (Actual) *
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="clave-antigua"
                type={showAntigua ? 'text' : 'password'}
                required
                value={claveAntigua}
                onChange={(e) => setClaveAntigua(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '0.75rem 2.5rem 0.75rem 0.75rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.95rem' }}
              />
              <button
                type="button"
                aria-label={showAntigua ? "Ocultar contraseña antigua" : "Mostrar contraseña antigua"}
                onClick={() => setShowAntigua(!showAntigua)}
                style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '0.8rem', fontWeight: '600' }}
              >
                {showAntigua ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          {/* 2. Nueva Clave */}
          <div>
            <label htmlFor="clave-nueva" style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', color: '#253B59', marginBottom: '0.35rem' }}>
              2. Nueva Contraseña *
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="clave-nueva"
                type={showNueva ? 'text' : 'password'}
                required
                minLength={6}
                value={claveNueva}
                onChange={(e) => setClaveNueva(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                style={{ width: '100%', padding: '0.75rem 2.5rem 0.75rem 0.75rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.95rem' }}
              />
              <button
                type="button"
                aria-label={showNueva ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"}
                onClick={() => setShowNueva(!showNueva)}
                style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '0.8rem', fontWeight: '600' }}
              >
                {showNueva ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          {/* 3. Rectificar Nueva Clave */}
          <div>
            <label htmlFor="clave-confirmar" style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', color: '#253B59', marginBottom: '0.35rem' }}>
              3. Rectificar / Confirmar Nueva Contraseña *
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="clave-confirmar"
                type={showRectificar ? 'text' : 'password'}
                required
                minLength={6}
                value={rectificarClave}
                onChange={(e) => setRectificarClave(e.target.value)}
                placeholder="Repite la nueva contraseña"
                style={{ width: '100%', padding: '0.75rem 2.5rem 0.75rem 0.75rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.95rem' }}
              />
              <button
                type="button"
                aria-label={showRectificar ? "Ocultar confirmación de contraseña" : "Mostrar confirmación de contraseña"}
                onClick={() => setShowRectificar(!showRectificar)}
                style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '0.8rem', fontWeight: '600' }}
              >
                {showRectificar ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          {/* Acciones */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#F1F5F9',
                color: '#64748B',
                borderRadius: '9999px',
                padding: '0.75rem 1.5rem',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              style={{
                backgroundColor: '#253B59',
                color: '#FFFFFF',
                borderRadius: '9999px',
                padding: '0.75rem 1.75rem',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 59, 89, 0.25)'
              }}
            >
              {cargando ? 'Cambiando clave...' : 'Actualizar Contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
