import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi } from "vitest";
import {
  PrivacyPage,
  TermsPage,
  ContactPage,
  FaqPage,
} from "../components/InfoPages";

describe("InfoPages Components", () => {
  test("PrivacyPage renders title and handles back button click", async () => {
    const user = userEvent.setup();
    const handleHome = vi.fn();
    render(<PrivacyPage onNavigateHome={handleHome} />);

    expect(screen.getByRole("heading", { name: /Política de Privacidad/i })).toBeInTheDocument();

    const backButton = screen.getByRole("button", { name: /Volver al Inicio/i });
    await user.click(backButton);
    expect(handleHome).toHaveBeenCalledTimes(1);
  });

  test("TermsPage renders terms correctly", () => {
    render(<TermsPage onNavigateHome={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: /Términos y Condiciones de Servicio/i })
    ).toBeInTheDocument();
  });

  test("ContactPage renders contact information and form", async () => {
    const user = userEvent.setup();
    render(<ContactPage onNavigateHome={vi.fn()} />);

    expect(screen.getByRole("heading", { name: /Contacto & Ubicación/i })).toBeInTheDocument();
    expect(screen.getByText(/Av. Valparaíso 2650, Villa Alemana/i)).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(/Tu nombre/i);
    const emailInput = screen.getByPlaceholderText(/tu@correo.com/i);

    await user.type(nameInput, "María González");
    await user.type(emailInput, "maria@example.com");

    expect(nameInput).toHaveValue("María González");
    expect(emailInput).toHaveValue("maria@example.com");
  });

  test("FaqPage renders FAQ list and allows navigating back", async () => {
    const user = userEvent.setup();
    const handleHome = vi.fn();
    render(<FaqPage onNavigateHome={handleHome} />);

    expect(screen.getByRole("heading", { name: /Preguntas Frecuentes/i })).toBeInTheDocument();
    expect(
      screen.getByText(/¿Necesito experiencia previa para tomar clases de Pilates Reformer\?/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Volver al Inicio/i }));
    expect(handleHome).toHaveBeenCalledTimes(1);
  });
});
