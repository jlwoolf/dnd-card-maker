import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AddToDeckPopover from "../AddToDeckPopover";

vi.mock("@src/services/api", () => ({
  cardApi: {
    getDecks: vi.fn().mockResolvedValue({ data: [] }),
    updateDecks: vi.fn().mockResolvedValue({ data: {} }),
  },
  deckApi: {
    list: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

describe("AddToDeckPopover", () => {
  it("renders as Dialog when no anchor provided", () => {
    render(
      <AddToDeckPopover
        open={true}
        anchorEl={null}
        cardId="card-1"
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Add to Deck")).toBeInTheDocument();
  });

  it("renders as Popover when anchor is provided", () => {
    const anchor = document.createElement("div");
    document.body.appendChild(anchor);

    render(
      <AddToDeckPopover
        open={true}
        anchorEl={anchor}
        cardId="card-1"
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Add to Deck")).toBeInTheDocument();
  });
});
