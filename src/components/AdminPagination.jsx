/**
 * Componente accesible y responsivo de paginación para las tablas de administración.
 * Cumple con estándares de @ui-ux-pro-max: botones táctiles >= 44px, navegación por teclado,
 * elipsis inteligente de páginas e indicador de rango visible.
 */
export default function AdminPagination({
  paginaActual,
  totalElementos,
  elementosPorPagina = 10,
  onCambiarPagina,
  etiquetaItem = "registros",
}) {
  const totalPaginas = Math.max(1, Math.ceil(totalElementos / elementosPorPagina));

  if (totalElementos === 0) return null;

  const desde = (paginaActual - 1) * elementosPorPagina + 1;
  const hasta = Math.min(paginaActual * elementosPorPagina, totalElementos);

  /**
   * Genera los números de página con elipsis inteligente (...) si hay muchas páginas
   */
  const obtenerNumerosPagina = () => {
    if (totalPaginas <= 7) {
      return Array.from({ length: totalPaginas }, (_, i) => i + 1);
    }

    if (paginaActual <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPaginas];
    }

    if (paginaActual >= totalPaginas - 3) {
      return [
        1,
        "...",
        totalPaginas - 4,
        totalPaginas - 3,
        totalPaginas - 2,
        totalPaginas - 1,
        totalPaginas,
      ];
    }

    return [
      1,
      "...",
      paginaActual - 1,
      paginaActual,
      paginaActual + 1,
      "...",
      totalPaginas,
    ];
  };

  const numeros = obtenerNumerosPagina();

  return (
    <nav
      aria-label={`Paginación de ${etiquetaItem}`}
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        padding: "1rem 1.25rem",
        backgroundColor: "#FFFFFF",
        borderTop: "1px solid #E2E8F0",
      }}
    >
      {/* Resumen del rango actual visible */}
      <div
        style={{
          fontSize: "0.875rem",
          color: "#64748B",
          fontWeight: "500",
        }}
      >
        Mostrando <strong style={{ color: "#253B59" }}>{desde}</strong> a{" "}
        <strong style={{ color: "#253B59" }}>{hasta}</strong> de{" "}
        <strong style={{ color: "#253B59" }}>{totalElementos}</strong> {etiquetaItem}
      </div>

      {/* Controles de paginación */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
          flexWrap: "wrap",
        }}
      >
        {/* Botón Anterior */}
        <button
          type="button"
          onClick={() => onCambiarPagina(Math.max(1, paginaActual - 1))}
          disabled={paginaActual <= 1}
          aria-label="Página anterior"
          style={{
            minHeight: "44px",
            padding: "0 0.85rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            borderRadius: "10px",
            border: "1px solid #CBD5E1",
            backgroundColor: paginaActual <= 1 ? "#F8FAFC" : "#FFFFFF",
            color: paginaActual <= 1 ? "#94A3B8" : "#253B59",
            fontWeight: "600",
            fontSize: "0.85rem",
            cursor: paginaActual <= 1 ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <span>←</span>
          <span>Anterior</span>
        </button>

        {/* Botones de Páginas Numéricas */}
        {numeros.map((item, index) => {
          if (item === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                style={{
                  minWidth: "36px",
                  textAlign: "center",
                  color: "#94A3B8",
                  fontWeight: "700",
                  userSelect: "none",
                }}
              >
                …
              </span>
            );
          }

          const esActiva = paginaActual === item;

          return (
            <button
              key={`page-${item}`}
              type="button"
              onClick={() => onCambiarPagina(item)}
              aria-label={`Ir a la página ${item}`}
              aria-current={esActiva ? "page" : undefined}
              style={{
                minHeight: "44px",
                minWidth: "44px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "10px",
                border: esActiva ? "none" : "1px solid #CBD5E1",
                backgroundColor: esActiva ? "#253B59" : "#FFFFFF",
                color: esActiva ? "#FFFFFF" : "#253B59",
                fontWeight: "700",
                fontSize: "0.875rem",
                cursor: "pointer",
                boxShadow: esActiva ? "0 2px 8px rgba(37, 59, 89, 0.25)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              {item}
            </button>
          );
        })}

        {/* Botón Siguiente */}
        <button
          type="button"
          onClick={() => onCambiarPagina(Math.min(totalPaginas, paginaActual + 1))}
          disabled={paginaActual >= totalPaginas}
          aria-label="Página siguiente"
          style={{
            minHeight: "44px",
            padding: "0 0.85rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            borderRadius: "10px",
            border: "1px solid #CBD5E1",
            backgroundColor: paginaActual >= totalPaginas ? "#F8FAFC" : "#FFFFFF",
            color: paginaActual >= totalPaginas ? "#94A3B8" : "#253B59",
            fontWeight: "600",
            fontSize: "0.85rem",
            cursor: paginaActual >= totalPaginas ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <span>Siguiente</span>
          <span>→</span>
        </button>
      </div>
    </nav>
  );
}
