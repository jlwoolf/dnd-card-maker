import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TextPreview from "../Preview";

describe("TextPreview", () => {
  const plainTextValue = [
    {
      type: "paragraph" as const,
      children: [{ text: "Hello World" }],
    },
  ];

  const richTextValue = [
    {
      type: "paragraph" as const,
      children: [
        { text: "Normal " },
        { text: "Bold", bold: true },
        { text: " and " },
        { text: "Italic", italic: true },
      ],
    },
  ];

  it("renders text content from plain Slate nodes", () => {
    render(
      <TextPreview
        value={plainTextValue}
        variant="banner"
        width={100}
        expand={false}
        id="text-1"
      />,
    );

    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("renders bold text spans", () => {
    render(
      <TextPreview
        value={richTextValue}
        variant="box"
        width={100}
        expand={false}
        id="text-bold"
      />,
    );

    const boldSpan = screen.getByText("Bold");
    expect(boldSpan).toBeInTheDocument();
    expect(boldSpan.tagName).toBe("SPAN");
    expect(boldSpan).toHaveStyle({ fontWeight: "bold" });
  });

  it("renders italic text spans", () => {
    render(
      <TextPreview
        value={richTextValue}
        variant="box"
        width={100}
        expand={false}
        id="text-italic"
      />,
    );

    const italicSpan = screen.getByText("Italic");
    expect(italicSpan).toBeInTheDocument();
    expect(italicSpan).toHaveStyle({ fontStyle: "italic" });
  });

  it("renders all children text", () => {
    render(
      <TextPreview
        value={richTextValue}
        variant="banner"
        width={75}
        expand={true}
        id="text-all"
      />,
    );

    expect(screen.getByText(/Normal/)).toBeInTheDocument();
    expect(screen.getByText("Bold")).toBeInTheDocument();
    expect(screen.getByText(/and/)).toBeInTheDocument();
    expect(screen.getByText("Italic")).toBeInTheDocument();
  });

  it("renders fontSize style on text nodes", () => {
    const fontSizeValue = [
      {
        type: "paragraph" as const,
        children: [{ text: "Big", fontSize: 24 }],
      },
    ];

    render(
      <TextPreview
        value={fontSizeValue}
        variant="banner"
        width={100}
        expand={false}
        id="text-size"
      />,
    );

    const span = screen.getByText("Big");
    expect(span).toHaveStyle({ fontSize: "24px" });
  });
});
