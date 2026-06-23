import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useActiveCardStore } from "@src/stores/useActiveCardStore";
import useExportCards from "@src/stores/useExportCards";
import type { Card } from "@src/schemas";
import CardButtons from "../CardButtons";

describe("Deck CardButtons", () => {
  const mockCard: Card = {
    id: "card-1",
    elements: [
      {
        id: "el-1",
        type: "text",
        value: {
          variant: "banner",
          expand: false,
          width: 100,
          value: [{ type: "paragraph", children: [{ text: "Test" }] }],
        },
        style: { grow: false, align: "center" },
      },
    ],
    imgUrl: "data:image/png;base64,abc",
    theme: {
      fill: "#111",
      bannerFill: "#222",
      boxFill: "#333",
      stroke: "#444",
      bannerText: "#555",
      boxText: "#666",
    },
  };

  beforeEach(() => {
    useActiveCardStore.setState({
      elements: [],
      theme: { fill: "#000", bannerFill: "#000", boxFill: "#000", stroke: "#000", bannerText: "#000", boxText: "#000" },
      cardId: undefined,
      cloudCardId: undefined,
      activeSettingsId: undefined,
    });
    useExportCards.setState({ cards: [], pdfProgress: 0 });
  });

  it("renders Edit button", () => {
    render(
      <CardButtons card={mockCard} />,
    );

    expect(screen.getByTestId("deck-action-button-edit")).toBeInTheDocument();
  });

  it("renders Copy button", () => {
    render(
      <CardButtons card={mockCard} />,
    );

    expect(screen.getByTestId("deck-action-button-copy")).toBeInTheDocument();
  });

  it("renders Delete button", () => {
    render(
      <CardButtons card={mockCard} />,
    );

    expect(screen.getByTestId("deck-action-button-delete")).toBeInTheDocument();
  });

  it("renders Download button", () => {
    render(
      <CardButtons card={mockCard} />,
    );

    expect(screen.getByTestId("deck-action-button-download")).toBeInTheDocument();
  });

  it("calls onEdit callback when Edit is clicked", () => {
    const onEdit = vi.fn();
    render(
      <CardButtons card={mockCard} onEdit={onEdit} />,
    );

    fireEvent.click(screen.getByTestId("deck-action-button-edit"));
    expect(onEdit).toHaveBeenCalledWith(mockCard);
  });

  it("calls onCopy callback when Copy is clicked", () => {
    const onCopy = vi.fn();
    render(
      <CardButtons card={mockCard} onCopy={onCopy} />,
    );

    fireEvent.click(screen.getByTestId("deck-action-button-copy"));
    expect(onCopy).toHaveBeenCalledWith(mockCard);
  });

  it("calls onDelete callback when Delete is clicked", () => {
    const onDelete = vi.fn();
    render(
      <CardButtons card={mockCard} onDelete={onDelete} />,
    );

    fireEvent.click(screen.getByTestId("deck-action-button-delete"));
    expect(onDelete).toHaveBeenCalledWith(mockCard);
  });

  it("calls onDownload callback when Download is clicked", () => {
    const onDownload = vi.fn();
    render(
      <CardButtons card={mockCard} onDownload={onDownload} />,
    );

    fireEvent.click(screen.getByTestId("deck-action-button-download"));
    expect(onDownload).toHaveBeenCalledWith(mockCard);
  });
});
