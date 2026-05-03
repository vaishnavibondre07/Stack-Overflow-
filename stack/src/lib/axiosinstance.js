import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
axiosInstance.interceptors.request.use(
  (req) => {
    if (typeof window !== "undefined") {
      try {
        const user = localStorage.getItem("user");
        if (user) {
          const parsedUser = JSON.parse(user);
          const token = parsedUser?.token;
          if (token) {
            req.headers.Authorization = `Bearer ${token}`;
          }
        }
      } catch (error) {
        console.error("Error parsing user from localStorage:", error);
        localStorage.removeItem("user");
      }
      // Don't set Content-Type for FormData - browser will set it with boundary
      if (req.data instanceof FormData) {
        delete req.headers["Content-Type"];
      }
    }
    return req;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors (unauthorized)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid user data
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
        // Optionally redirect to login page
        if (window.location.pathname !== "/auth" && window.location.pathname !== "/signup") {
          window.location.href = "/auth";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
