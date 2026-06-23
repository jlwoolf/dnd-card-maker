import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ImagePreview from "../Preview";

describe("ImagePreview", () => {
  it("renders an img element with the provided src", () => {
    render(
      <ImagePreview
        src="https://example.com/image.png"
        radius={4}
        width={80}
        id="img-1"
      />,
    );

    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/image.png");
    expect(img).toHaveAttribute("alt", "img-1");
  });

  it("uses placeholder when src is empty", () => {
    render(
      <ImagePreview
        src=""
        radius={0}
        width={100}
        id="img-empty"
      />,
    );

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://placehold.co/600x400");
  });

  it("has objectFit cover style", () => {
    render(
      <ImagePreview
        src="test.png"
        radius={2}
        width={50}
        id="img-fit"
      />,
    );

    const img = screen.getByRole("img");
    expect(img).toHaveStyle({ objectFit: "cover" });
  });
});
