import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import BannerIcon from "../BannerIcon";

describe("BannerIcon", () => {
  it("renders an SVG element", () => {
    const { container } = render(<BannerIcon />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("contains a path element", () => {
    const { container } = render(<BannerIcon />);
    const path = container.querySelector("path");
    expect(path).toBeInTheDocument();
  });

  it("has correct viewBox", () => {
    const { container } = render(<BannerIcon />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("viewBox", "0 0 52.916669 52.916675");
  });

  it("applies additional sx props", () => {
    const { container } = render(<BannerIcon sx={{ color: "red" }} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
