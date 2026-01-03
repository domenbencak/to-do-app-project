import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import api from "./axios";

jest.mock("./components/AuthForm", () => () => <div data-testid="auth-form" />);
jest.mock("./axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }
}));

const mockApi = api;

const authResponse = { data: { user: { username: "Jane", email: "jane@test.com" } } };
const baseTodos = [
  { _id: "1", title: "Write docs", completed: false },
  { _id: "2", title: "Ship feature", completed: true }
];

describe("App component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test("renders authentication view when no user is present", () => {
    render(<App />);

    expect(screen.getByText("📝 To‑Do App")).toBeInTheDocument();
    expect(screen.getByText("Sign in to manage your tasks")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument();
  });

  test("loads todos for an authenticated user", async () => {
    localStorage.setItem("token", "abc");
    mockApi.get.mockResolvedValueOnce(authResponse);
    mockApi.get.mockResolvedValueOnce({ data: baseTodos });

    render(<App />);

    expect(await screen.findByText(/Jane's To/i)).toBeInTheDocument();
    expect(screen.getByText("Write docs")).toBeInTheDocument();
    expect(screen.getByText("Ship feature")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
  });

  test("adds a todo and clears the input", async () => {
    localStorage.setItem("token", "abc");
    mockApi.get.mockResolvedValueOnce(authResponse);
    mockApi.get.mockResolvedValueOnce({ data: baseTodos });
    mockApi.post.mockResolvedValueOnce({ data: { _id: "3", title: "New task", completed: false } });

    render(<App />);
    const input = await screen.findByPlaceholderText("Enter a task...");
    await screen.findByText("Write docs");

    await userEvent.type(input, "New task");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith("/api/todos", { title: "New task" });
    });
    expect(await screen.findByText("New task")).toBeInTheDocument();
    await waitFor(() => expect(input).toHaveValue(""));
  });

  test("toggles a todo via its title", async () => {
    localStorage.setItem("token", "abc");
    mockApi.get.mockResolvedValueOnce(authResponse);
    mockApi.get.mockResolvedValueOnce({ data: baseTodos });
    mockApi.put.mockResolvedValueOnce({
      data: { _id: "1", title: "Write docs", completed: true }
    });

    render(<App />);
    await screen.findByText("Write docs");

    await userEvent.click(screen.getByText("Write docs"));

    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledWith("/api/todos/1", { completed: true });
    });
    expect(screen.getByText("Write docs")).toBeInTheDocument();
  });

  test("deletes a todo from the list", async () => {
    localStorage.setItem("token", "abc");
    mockApi.get.mockResolvedValueOnce(authResponse);
    mockApi.get.mockResolvedValueOnce({ data: baseTodos });
    mockApi.delete.mockResolvedValueOnce({});

    render(<App />);
    await screen.findByText("Write docs");

    await userEvent.click(screen.getAllByRole("button", { name: "Delete todo" })[0]);

    await waitFor(() => expect(mockApi.delete).toHaveBeenCalledWith("/api/todos/1"));
    await waitFor(() => expect(screen.queryByText("Write docs")).not.toBeInTheDocument());
  });
});
