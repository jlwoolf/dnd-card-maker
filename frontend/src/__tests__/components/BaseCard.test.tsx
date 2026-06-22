import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BaseCard from "../../components/Card/BaseCard";

describe("BaseCard", () => {
  it("renders children inside a Paper container", () => {
    render(
      <BaseCard>
        <div data-testid="child">Card Content</div>
      </BaseCard>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("has the correct container id", () => {
    const { container } = render(<BaseCard>Test</BaseCard>);
    const paper = container.querySelector("#base-card-paper-container");
    expect(paper).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<BaseCard className="custom-class">Test</BaseCard>);
    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });
});
