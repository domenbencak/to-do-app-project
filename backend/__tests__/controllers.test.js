import { signup, signin, refreshToken } from "../controllers/authController.js";
import { createTodo, updateTodo } from "../controllers/todoController.js";
import { likePost, dislikePost } from "../controllers/postController.js";
import User from "../models/User.js";
import Todo from "../models/Todo.js";
import Post from "../models/Post.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

jest.mock("../models/User.js", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn()
  }
}));

jest.mock("../models/Todo.js", () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn()
  }
}));

jest.mock("../models/Post.js", () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn()
  }
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn()
}));

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

let consoleErrorSpy;

beforeAll(() => {
  consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

beforeEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  consoleErrorSpy.mockRestore();
});

describe("authController", () => {
  test("signup rejects when email already registered", async () => {
    User.findOne.mockResolvedValueOnce({ _id: "abc" });
    const res = createRes();

    await signup(
      { body: { username: "John", email: "john@test.com", password: "pass" } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Email already registered" });
  });

  test("signup creates user and returns tokens", async () => {
    User.findOne.mockResolvedValueOnce(null);
    bcrypt.hash.mockResolvedValueOnce("hashed");
    User.create.mockResolvedValueOnce({ _id: "1", username: "Jane", email: "j@test.com" });
    jwt.sign.mockReturnValueOnce("access123").mockReturnValueOnce("refresh123");
    const res = createRes();

    await signup(
      { body: { username: "Jane", email: "j@test.com", password: "secret" } },
      res
    );

    expect(User.create).toHaveBeenCalledWith({
      username: "Jane",
      email: "j@test.com",
      password: "hashed"
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      token: "access123",
      refreshToken: "refresh123",
      user: { id: "1", username: "Jane", email: "j@test.com" }
    });
  });

  test("signin returns 400 when user is missing", async () => {
    User.findOne.mockResolvedValueOnce(null);
    const res = createRes();

    await signin({ body: { email: "a@test.com", password: "pass" } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
  });

  test("signin returns 400 when password is invalid", async () => {
    User.findOne.mockResolvedValueOnce({
      _id: "1",
      email: "a@test.com",
      username: "Alice",
      password: "hashed"
    });
    bcrypt.compare.mockResolvedValueOnce(false);
    const res = createRes();

    await signin({ body: { email: "a@test.com", password: "bad" } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
  });

  test("signin returns tokens and user data on success", async () => {
    User.findOne.mockResolvedValueOnce({
      _id: "1",
      email: "a@test.com",
      username: "Alice",
      password: "hashed"
    });
    bcrypt.compare.mockResolvedValueOnce(true);
    jwt.sign.mockReturnValueOnce("token-1").mockReturnValueOnce("refresh-1");
    const res = createRes();

    await signin({ body: { email: "a@test.com", password: "good" } }, res);

    expect(res.json).toHaveBeenCalledWith({
      token: "token-1",
      refreshToken: "refresh-1",
      user: { id: "1", username: "Alice", email: "a@test.com" }
    });
  });

  test("refreshToken rejects invalid refresh token", async () => {
    jwt.verify.mockImplementationOnce(() => {
      throw new Error("invalid");
    });
    const res = createRes();

    await refreshToken({ body: { token: "broken" } }, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid refresh token" });
  });

  test("refreshToken returns new access token", async () => {
    jwt.verify.mockReturnValueOnce({ id: "user-1" });
    jwt.sign.mockReturnValueOnce("new-access");
    const res = createRes();

    await refreshToken({ body: { token: "valid" } }, res);

    expect(res.json).toHaveBeenCalledWith({ token: "new-access" });
  });
});

describe("todoController", () => {
  test("createTodo enforces a non-empty title", async () => {
    const res = createRes();

    await createTodo({ body: { title: "   " }, user: { _id: "user1" } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Title is required" });
    expect(Todo.create).not.toHaveBeenCalled();
  });

  test("updateTodo returns 404 when todo is missing", async () => {
    Todo.findOneAndUpdate.mockResolvedValueOnce(null);
    const res = createRes();

    await updateTodo(
      { params: { id: "todo-1" }, body: { completed: true }, user: { _id: "user1" } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Todo not found" });
  });
});

describe("postController", () => {
  test("likePost prevents duplicate likes", async () => {
    const res = createRes();
    Post.findById.mockResolvedValueOnce({
      likes: ["user1"],
      dislikes: [],
      save: jest.fn()
    });

    await likePost({ params: { id: "post-1" }, user: { _id: "user1" } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "You have already liked this post" });
  });

  test("dislikePost returns 404 when post is missing", async () => {
    const res = createRes();
    Post.findById.mockResolvedValueOnce(null);

    await dislikePost({ params: { id: "missing" }, user: { _id: "user1" } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Post not found" });
  });
});
