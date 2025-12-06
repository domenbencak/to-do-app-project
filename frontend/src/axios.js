import axios from "axios";

const apiBaseUrl =
  process.env.REACT_APP_API_URL || "http://localhost:3242";

const api = axios.create({
  baseURL: apiBaseUrl,
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 by refreshing token
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/"; // redirect to login
        return Promise.reject(err);
      }

      try {
        const { data } = await api.post("/api/auth/refresh", {
          token: refreshToken,
        });
        localStorage.setItem("token", data.token);
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest); // retry original request
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/"; // redirect to login
        return Promise.reject(err);
      }
    }
    return Promise.reject(err);
  }
);

export default api;
