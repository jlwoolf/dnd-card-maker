import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import useExportCards from "@src/stores/useExportCards";
import DownloadButton from "../DownloadButton";

describe("Deck DownloadButton", () => {
  beforeEach(() => {
    useExportCards.setState({ cards: [], pdfProgress: 0 });
  });

  it("renders a button", () => {
    render(<DownloadButton />);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("contains a download SVG icon", () => {
    const { container } = render(<DownloadButton />);

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("calls onClick handler when clicked", () => {
    const onClick = vi.fn();
    render(<DownloadButton onClick={onClick} />);

    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders with disabled prop", () => {
    render(<DownloadButton disabled />);

    expect(screen.getByRole("button")).toBeDisabled();
  });
});
