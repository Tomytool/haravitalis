import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi } from "vitest";
import TerapiasPage from "../components/TerapiasPage";

// Mock Firebase service subscription to prevent network calls in unit tests
vi.mock("../firebase/terapiasService", () => ({
  suscribirTerapiasActivas: (callback) => {
    callback([]);
    return () => {};
  },
}));

describe("TerapiasPage Component", () => {
  test("renders hero title and section header correctly", () => {
    render(<TerapiasPage currentUser={null} onNavigateToAuth={vi.fn()} onNavigateToBooking={vi.fn()} />);

    expect(
      screen.getByRole("heading", {
        name: /Medicina Tradicional China y Terapias Integrativas/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: /Terapias Integrativas Disponibles/i })
    ).toBeInTheDocument();
  });

  test("renders the 3 required static therapy pricing plan cards", () => {
    render(<TerapiasPage currentUser={null} onNavigateToAuth={vi.fn()} onNavigateToBooking={vi.fn()} />);

    // Check titles of the 3 plan cards
    expect(screen.getByRole("heading", { name: "1 Sesión de Terapia" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Plan 2 Sesiones" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Plan 3 Sesiones" })).toBeInTheDocument();

    // Check pricing amounts
    expect(screen.getByText("$25.000")).toBeInTheDocument();
    expect(screen.getByText("$32.990")).toBeInTheDocument();
    expect(screen.getByText("$39.990")).toBeInTheDocument();
  });

  test("redirects to auth when clicking reserve while logged out", async () => {
    const user = userEvent.setup();
    const handleAuth = vi.fn();
    render(<TerapiasPage currentUser={null} onNavigateToAuth={handleAuth} onNavigateToBooking={vi.fn()} />);

    const buttons = screen.getAllByRole("button", { name: /Inicia Sesión para Reservar/i });
    expect(buttons).toHaveLength(3);

    await user.click(buttons[0]);
    expect(handleAuth).toHaveBeenCalledWith(true);
  });

  test("triggers booking callback when user has available session credits", async () => {
    const user = userEvent.setup();
    const handleBooking = vi.fn();
    const mockUser = { sesion_terapia: 2 };

    render(<TerapiasPage currentUser={mockUser} onNavigateToAuth={vi.fn()} onNavigateToBooking={handleBooking} />);

    const reserveButtons = screen.getAllByRole("button", { name: /Reservar Sesión/i });
    expect(reserveButtons.length).toBeGreaterThan(0);

    await user.click(reserveButtons[0]);
    expect(handleBooking).toHaveBeenCalledWith("1 Sesión de Terapia");
  });
});
