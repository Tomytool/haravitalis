import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock static image imports with absolute public root paths
vi.mock("/terapias_holisticas.png", () => ({ default: "test-file-stub" }));
vi.mock("/pilates-studio.jpg", () => ({ default: "test-file-stub" }));
vi.mock("/qr_terapia.svg", () => ({ default: "test-file-stub" }));
vi.mock("/contacto_orlando.jpeg", () => ({ default: "test-file-stub" }));
