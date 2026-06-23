import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import CardButtons from "../CardButtons";
import { ElementRefProvider } from "../ElementRefContext";

const mockAddCard = vi.fn();
const mockUpdateCard = vi.fn();
const mockSetCardCloudId = vi.fn();
const mockShowSnackbar = vi.fn();
let mockIsAuthenticated = false;

vi.mock("@src/stores/useAuthStore", () => ({
  useAuthStore: (selector?: (s: unknown) => unknown) => {
    const state = { user: mockIsAuthenticated ? { id: "u1", email: "test@test.com" } : null, isAuthenticated: mockIsAuthenticated, isLoading: false };
    return selector ? selector(state) : state;
  },
}));

vi.mock("@src/stores/useActiveCardStore", () => ({
  useActiveCardStore: (selector?: (s: unknown) => unknown) => {
    const state = {
      elements: [],
      cardId: undefined,
      cloudCardId: undefined,
      theme: { fill: "#000", bannerFill: "#000", boxFill: "#000", stroke: "#000", bannerText: "#000", boxText: "#000" },
      setCloudCardId: vi.fn(),
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock("@src/hooks/useExportCards", () => ({
  default: (selector?: (s: unknown) => unknown) => {
    const state = { cards: [], addCard: mockAddCard, updateCard: mockUpdateCard, setCardCloudId: mockSetCardCloudId };
    return selector ? selector(state) : state;
  },
}));

vi.mock("@src/hooks/useSnackbar", () => ({
  useSnackbar: (selector?: (s: unknown) => unknown) => {
    const state = { showSnackbar: mockShowSnackbar, closeSnackbar: vi.fn(), open: false, message: "", severity: "info" as const };
    return selector ? selector(state) : state;
  },
}));

vi.mock("@src/services/api", () => ({
  cardApi: {
    create: vi.fn(),
    update: vi.fn(),
    toggleSave: vi.fn(),
  },
}));

vi.mock("@src/services/ImageProcessor", () => ({
  ImageProcessor: {
    captureElement: vi.fn().mockResolvedValue("data:image/png;base64,captured"),
    generateThumbnail: vi.fn().mockResolvedValue("data:image/png;base64,thumb"),
  },
}));

describe("CardButtons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = false;
  });

  function renderWithProvider() {
    return render(
      <ElementRefProvider>
        <CardButtons />
      </ElementRefProvider>,
    );
  }

  it("renders the add to deck button", () => {
    renderWithProvider();
    expect(screen.getByTestId("add-to-deck-btn")).toBeInTheDocument();
  });

  it("renders rounded button group container", () => {
    renderWithProvider();
    expect(screen.getByTestId("card-persistence-actions")).toBeInTheDocument();
  });

  it("hides save to cloud button when not authenticated", () => {
    renderWithProvider();
    expect(screen.queryByTestId("save-cloud-btn")).not.toBeInTheDocument();
  });

  it("shows save to cloud button when authenticated", () => {
    mockIsAuthenticated = true;
    renderWithProvider();
    expect(screen.getByTestId("save-cloud-btn")).toBeInTheDocument();
  });

  it("hides save button when card does not exist in deck", () => {
    renderWithProvider();
    expect(screen.queryByTestId("save-card-btn")).not.toBeInTheDocument();
  });
});
