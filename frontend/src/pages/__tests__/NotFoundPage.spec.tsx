import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotFoundPage from "../../pages/NotFoundPage";

describe("NotFoundPage", () => {
  function renderPage() {
    return render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );
  }

  it("renders 404 heading", () => {
    renderPage();
    expect(screen.getByText("404")).toBeInTheDocument();
  });

  it("renders page not found message", () => {
    renderPage();
    expect(screen.getByText("Page Not Found")).toBeInTheDocument();
  });

  it("renders a link to the home page", () => {
    renderPage();
    expect(screen.getByRole("link", { name: /go home/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go home/i })).toHaveAttribute("href", "/");
  });
});
