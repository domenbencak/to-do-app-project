import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TodoItem from "./TodoItem";

const baseTodo = { _id: "1", title: "Example todo", completed: false };

describe("TodoItem", () => {
  test("calls onToggle with the flipped completed value", async () => {
    const onToggle = jest.fn();

    render(<TodoItem todo={baseTodo} onToggle={onToggle} onDelete={jest.fn()} />);
    await userEvent.click(screen.getByText("Example todo"));

    expect(onToggle).toHaveBeenCalledWith("1", true);
  });

  test("calls onDelete with the todo id", async () => {
    const onDelete = jest.fn();

    render(<TodoItem todo={baseTodo} onToggle={jest.fn()} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole("button", { name: "Delete todo" }));

    expect(onDelete).toHaveBeenCalledWith("1");
  });
});
