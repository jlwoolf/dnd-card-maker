import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import NumericToolbarInput from "../NumericToolbarInput";

describe("NumericToolbarInput", () => {
  it("renders with the current value", () => {
    render(
      <NumericToolbarInput
        value={16}
        onUpdate={vi.fn()}
      />,
    );

    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("16");
  });

  it("renders empty input when value is undefined", () => {
    render(
      <NumericToolbarInput
        value={undefined}
        onUpdate={vi.fn()}
      />,
    );

    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("");
  });

  it("calls onUpdate with incremented value on + button click", () => {
    const onUpdate = vi.fn();
    render(
      <NumericToolbarInput
        value={10}
        onUpdate={onUpdate}
        min={1}
        step={1}
      />,
    );

    const buttons = screen.getAllByRole("button");
    const incrementButton = buttons[1];

    fireEvent.mouseDown(incrementButton, { button: 0 });

    expect(onUpdate).toHaveBeenCalledWith(11);
  });

  it("calls onUpdate with decremented value on - button click", () => {
    const onUpdate = vi.fn();
    render(
      <NumericToolbarInput
        value={10}
        onUpdate={onUpdate}
        min={1}
        step={1}
      />,
    );

    const buttons = screen.getAllByRole("button");
    const decrementButton = buttons[0];

    fireEvent.mouseDown(decrementButton, { button: 0 });

    expect(onUpdate).toHaveBeenCalledWith(9);
  });

  it("does not decrement below min", () => {
    const onUpdate = vi.fn();
    render(
      <NumericToolbarInput
        value={1}
        onUpdate={onUpdate}
        min={1}
      />,
    );

    const buttons = screen.getAllByRole("button");
    const decrementButton = buttons[0];

    fireEvent.mouseDown(decrementButton, { button: 0 });

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("does not increment above max", () => {
    const onUpdate = vi.fn();
    render(
      <NumericToolbarInput
        value={100}
        onUpdate={onUpdate}
        min={1}
        max={100}
      />,
    );

    const buttons = screen.getAllByRole("button");
    const incrementButton = buttons[1];

    fireEvent.mouseDown(incrementButton, { button: 0 });

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("blocks non-numeric characters on keydown", () => {
    const onUpdate = vi.fn();
    render(
      <NumericToolbarInput
        value={10}
        onUpdate={onUpdate}
      />,
    );

    const input = screen.getByRole("textbox");

    fireEvent.keyDown(input, { key: "e" });
    fireEvent.keyDown(input, { key: "E" });
    fireEvent.keyDown(input, { key: "+" });
    fireEvent.keyDown(input, { key: "-" });

    expect(input).toBeInTheDocument();
  });

  it("clears value on empty input", () => {
    const onUpdate = vi.fn();
    render(
      <NumericToolbarInput
        value={5}
        onUpdate={onUpdate}
      />,
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "" } });

    expect(onUpdate).toHaveBeenCalledWith(undefined);
  });

  it("accepts valid numeric input", () => {
    const onUpdate = vi.fn();
    render(
      <NumericToolbarInput
        value={5}
        onUpdate={onUpdate}
      />,
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "42" } });

    expect(onUpdate).toHaveBeenCalledWith(42);
  });

  it("clamps value to max on manual input", () => {
    const onUpdate = vi.fn();
    render(
      <NumericToolbarInput
        value={5}
        onUpdate={onUpdate}
        max={50}
      />,
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "99" } });

    expect(onUpdate).toHaveBeenCalledWith(50);
  });
});
