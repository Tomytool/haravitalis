import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi } from "vitest";
import HomePage from "../components/HomePage";

describe("HomePage Component", () => {
  test("renders hero section heading and primary/secondary CTA buttons", () => {
    render(<HomePage onNavigateToBooking={vi.fn()} currentUser={null} />);

    expect(
      screen.getByRole("heading", {
        name: /Descubre la Ciencia y Elegancia del Pilates Reformer/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /Agendar Clase Demo/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Explora Nuestros Planes/i })).toBeInTheDocument();
  });

  test("filters plan cards when clicking category tabs", async () => {
    const user = userEvent.setup();
    render(<HomePage onNavigateToBooking={vi.fn()} currentUser={null} />);

    // Default: 'todos' tab active
    expect(screen.getByRole("button", { name: /Todos los Planes/i })).toBeInTheDocument();

    // Switch tab to 'Planes Pilates'
    const pilatesTab = screen.getByRole("button", { name: /Planes Pilates/i });
    await user.click(pilatesTab);
    expect(pilatesTab).toHaveClass("active");

    // Switch tab to 'Súper Planes'
    const superTab = screen.getByRole("button", { name: /Súper Planes/i });
    await user.click(superTab);
    expect(superTab).toHaveClass("active");
    expect(screen.getByText("Super Plan 16")).toBeInTheDocument();
  });
});
