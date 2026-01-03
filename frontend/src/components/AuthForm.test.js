import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthForm from "./AuthForm";
import axios from "axios";

jest.mock("axios", () => ({
  post: jest.fn()
}));

describe("AuthForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test("shows sign in fields by default", () => {
    render(<AuthForm mode="signin" onAuthSuccess={jest.fn()} />);

    expect(screen.queryByPlaceholderText("Username")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  test("renders username input when in signup mode", () => {
    render(<AuthForm mode="signup" onAuthSuccess={jest.fn()} />);

    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument();
  });

  test("submits credentials and stores tokens on success", async () => {
    const onAuthSuccess = jest.fn();
    axios.post.mockResolvedValueOnce({
      data: {
        token: "token-123",
        refreshToken: "refresh-123",
        user: { id: "1", username: "Jenny" }
      }
    });

    render(<AuthForm mode="signup" onAuthSuccess={onAuthSuccess} />);
    await userEvent.type(screen.getByPlaceholderText("Username"), "Jenny");
    await userEvent.type(screen.getByPlaceholderText("Email"), "jenny@test.com");
    await userEvent.type(screen.getByPlaceholderText("Password"), "supersecret");
    await userEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("/api/auth/signup", {
        username: "Jenny",
        email: "jenny@test.com",
        password: "supersecret"
      });
    });
    expect(localStorage.getItem("token")).toBe("token-123");
    expect(localStorage.getItem("refreshToken")).toBe("refresh-123");
    expect(onAuthSuccess).toHaveBeenCalledWith({ id: "1", username: "Jenny" });
  });

  test("shows API error message on failure", async () => {
    axios.post.mockRejectedValueOnce({
      response: { data: { message: "Invalid credentials" } }
    });

    render(<AuthForm mode="signin" onAuthSuccess={jest.fn()} />);
    await userEvent.type(screen.getByPlaceholderText("Email"), "bad@test.com");
    await userEvent.type(screen.getByPlaceholderText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
  });
});
