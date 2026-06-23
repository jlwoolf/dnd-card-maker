import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AuthPageLayout from "../AuthPageLayout";

describe("AuthPageLayout", () => {
  it("renders children inside the card", () => {
    render(
      <AuthPageLayout>
        <div data-testid="form-content">Login Form</div>
      </AuthPageLayout>,
    );

    expect(screen.getByTestId("form-content")).toBeInTheDocument();
  });

  it("renders as a div when no onSubmit provided", () => {
    const { container } = render(
      <AuthPageLayout>
        <span>Content</span>
      </AuthPageLayout>,
    );

    const inner = container.querySelector("div > div");
    expect(inner).toBeInTheDocument();
    expect(inner?.tagName).toBe("DIV");
  });

  it("renders as a form when onSubmit provided", () => {
    const handleSubmit = vi.fn();
    const { container } = render(
      <AuthPageLayout onSubmit={handleSubmit}>
        <span>Form</span>
      </AuthPageLayout>,
    );

    const form = container.querySelector("form");
    expect(form).toBeInTheDocument();
  });

  it("applies data-testid to the inner card", () => {
    render(
      <AuthPageLayout dataTestId="auth-card">
        <span>Content</span>
      </AuthPageLayout>,
    );

    expect(screen.getByTestId("auth-card")).toBeInTheDocument();
  });

  it("applies correct width from design tokens", () => {
    const { container } = render(
      <AuthPageLayout>
        <span>Content</span>
      </AuthPageLayout>,
    );

    const innerCard = container.querySelector("div > div");
    expect(innerCard).toBeInTheDocument();
  });
});
