export function PrivacyPage({ onNavigateHome }) {
  return (
    <div className="page-wrapper page-info">
      <div className="page-container max-w-narrow">
        <button onClick={onNavigateHome} className="btn-back-link">← Volver al Inicio</button>
        <h1 className="page-title margin-top-sm">Política de Privacidad</h1>
        <p className="page-meta">Última actualización: Septiembre 2024</p>
        
        <div className="info-content-body margin-top-md">
          <h2>1. Información que recopilamos</h2>
          <p>En Hara Vitalis recopilamos información personal básica como tu nombre, correo electrónico y número de teléfono al momento de registrarte para agendar tus clases de Pilates Reformer.</p>
          
          <h2>2. Uso de la Información</h2>
          <p>Utilizamos tus datos únicamente para gestionar tus reservas de clases, coordinar tus horarios, comunicarte novedades sobre tu suscripción o cambios en el calendario de clases y brindarte una atención personalizada.</p>
          
          <h2>3. Protección de Datos</h2>
          <p>Tus datos se almacenan de manera segura utilizando infraestructura de autenticación de Firebase con cifrado estándar de la industria. No compartimos ni vendemos tu información a terceros.</p>
          
          <h2>4. Tus Derechos</h2>
          <p>Puedes solicitar la corrección, actualización o eliminación de tus datos personales en cualquier momento poniéndote en contacto con nuestro equipo directivo.</p>
        </div>
      </div>
    </div>
  );
}

export function TermsPage({ onNavigateHome }) {
  return (
    <div className="page-wrapper page-info">
      <div className="page-container max-w-narrow">
        <button onClick={onNavigateHome} className="btn-back-link">← Volver al Inicio</button>
        <h1 className="page-title margin-top-sm">Términos y Condiciones de Servicio</h1>
        <p className="page-meta">Última actualización: Septiembre 2024</p>
        
        <div className="info-content-body margin-top-md">
          <h2>1. Reservas y Cancelaciones</h2>
          <p>Las reservas de clases de Pilates Reformer deben realizarse con al menos 2 horas de anticipación a través de la plataforma. Para cancelar una clase reservada sin penalización de cupo, debes avisar con mínimo 6 horas de antelación.</p>
          
          <h2>2. Puntualidad y Código de Conducta</h2>
          <p>Para no interrumpir la dinámica de la sesión y garantizar el correcto calentamiento articular, se otorga una tolerancia máxima de 10 minutos de atraso. Se requiere el uso de calcetines antideslizantes durante el uso de la máquina Reformer.</p>
          
          <h2>3. Estado Físico y Declaración de Salud</h2>
          <p>Es responsabilidad del alumno notificar al instructor sobre cualquier lesión previa, cirugía reciente o embarazo antes del inicio de la clase para realizar las adaptaciones necesarias en los resortes.</p>
        </div>
      </div>
    </div>
  );
}

export function ContactPage({ onNavigateHome }) {
  return (
    <div className="page-wrapper page-info">
      <div className="page-container max-w-narrow">
        <button onClick={onNavigateHome} className="btn-back-link">← Volver al Inicio</button>
        <h1 className="page-title margin-top-sm">Contacto & Ubicación</h1>
        <p className="page-lead">Estamos aquí para resolver tus dudas y acompañarte en tu práctica de Pilates Reformer.</p>

        <div className="grid-2-cols margin-top-lg gap-lg">
          <div className="contact-info-card">
            <h3>Información de Estudio</h3>
            <p><strong>Dirección:</strong> Av. Providencia 1234, Oficina 502, Santiago</p>
            <p><strong>Teléfono / WhatsApp:</strong> +56 9 1234 5678</p>
            <p><strong>Correo Electrónico:</strong> contacto@haravitalis.cl</p>
            <p><strong>Horario de Atención:</strong> Lunes a Viernes de 07:30 AM a 09:00 PM | Sábados de 08:30 AM a 02:00 PM</p>
          </div>

          <form className="contact-form-box" onSubmit={(e) => { e.preventDefault(); alert("¡Gracias por tu mensaje! Te responderemos a la brevedad."); }}>
            <h3>Envíanos un Mensaje Directo</h3>
            <div className="form-group margin-top-sm">
              <label htmlFor="contact-nombre" className="form-label">Nombre Completo</label>
              <input id="contact-nombre" type="text" required placeholder="Tu nombre" className="form-input" />
            </div>
            <div className="form-group">
              <label htmlFor="contact-email" className="form-label">Correo Electrónico</label>
              <input id="contact-email" type="email" required placeholder="tu@correo.com" className="form-input" />
            </div>
            <div className="form-group">
              <label htmlFor="contact-mensaje" className="form-label">Mensaje</label>
              <textarea id="contact-mensaje" required rows="4" placeholder="¿En qué te podemos ayudar?" className="form-input text-area-input"></textarea>
            </div>
            <button type="submit" className="btn-primary margin-top-sm">Enviar Mensaje</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function FaqPage({ onNavigateHome }) {
  const faqs = [
    {
      q: "¿Necesito experiencia previa para tomar clases de Pilates Reformer?",
      a: "No. Nuestras clases cuentan con grupos reducidos (máximo 5 personas) y los instructores adaptan la resistencia de los resortes y la complejidad de los ejercicios a tu nivel actual."
    },
    {
      q: "¿Qué debo llevar a mi primera clase?",
      a: "Te recomendamos asistir con ropa deportiva cómoda (idealmente ajustada para evitar enganches con las poleas), calcetines antideslizantes (obligatorios por higiene y agarre) y tu botella de agua."
    },
    {
      q: "¿Con cuánta anticipación puedo cancelar o reprogramar una clase?",
      a: "Puedes cancelar o cambiar tu reserva hasta con 12 horas de anticipación desde tu panel de usuario sin perder la clase de tu paquete."
    },
    {
      q: "¿Es adecuado el Reformer si tengo lesiones de espalda o articulaciones?",
      a: "Sí. El Pilates Reformer fue diseñado originalmente con fines de rehabilitación. El soporte del carro deslizante alivia la presión articular y fortalece los músculos estabilizadores de la columna."
    }
  ];

  return (
    <div className="page-wrapper page-info">
      <div className="page-container max-w-narrow">
        <button onClick={onNavigateHome} className="btn-back-link">← Volver al Inicio</button>
        <h1 className="page-title margin-top-sm">Preguntas Frecuentes (FAQ)</h1>
        <p className="page-lead">Respuestas rápidas a las consultas más habituales sobre nuestras clases de Reformer.</p>

        <div className="faq-list margin-top-lg">
          {faqs.map((faq) => (
            <div key={faq.q} className="faq-card">
              <h3 className="faq-question">❓ {faq.q}</h3>
              <p className="faq-answer">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
