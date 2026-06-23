import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CloseFab from "../CloseFab";

describe("CloseFab", () => {
  it("renders a Floating Action Button", () => {
    render(<CloseFab onClose={vi.fn()} />);

    const fab = screen.getByRole("button");
    expect(fab).toBeInTheDocument();
  });

  it("calls onClose when clicked", () => {
    const onClose = vi.fn();
    render(<CloseFab onClose={onClose} />);

    fireEvent.click(screen.getByRole("button"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("contains a close icon", () => {
    const { container } = render(<CloseFab onClose={vi.fn()} />);

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
