import { useState, useEffect } from "react";
import { createContext } from "react";
import axiosInstance from "./axiosinstance";
import { toast } from "react-toastify";
import { useContext } from "react";
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  const [loading, setloading] = useState(false);
  const [error, seterror] = useState(null);

  const Signup = async ({ name, email, password }) => {
    setloading(true);
    seterror(null);
    try {
      const res = await axiosInstance.post("/user/signup", { name, email, password });
      const { data, token } = res.data;
      const userWithToken = { ...data, token };
      localStorage.setItem("user", JSON.stringify(userWithToken));
      setUser(userWithToken);
      toast.success("Signup Successful");
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || "Signup failed";
      seterror(msg);
      toast.error(msg);
      throw error;
    } finally {
      setloading(false);
    }
  };
  const Login = async ({ email, password }) => {
    setloading(true);
    seterror(null);
    try {
      const res = await axiosInstance.post("/user/login", { email, password });
      
      // Check if OTP is required (Chrome browser)
      if (res.data.requiresOTP) {
        setloading(false);
        return {
          requiresOTP: true,
          loginHistoryId: res.data.loginHistoryId,
          userId: res.data.userId,
        };
      }
      
      const { data, token } = res.data;
      localStorage.setItem("user", JSON.stringify({ ...data, token }));
      setUser({ ...data, token });
      toast.success("Login Successful");
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || "Login failed";
      seterror(msg);
      toast.error(msg);
      throw error;
    } finally {
      setloading(false);
    }
  };

  const verifyOTP = async ({ otp, userId, loginHistoryId }) => {
    setloading(true);
    seterror(null);
    try {
      const res = await axiosInstance.post("/user/verify-otp", {
        otp,
        userId,
        loginHistoryId,
      });
      const { data, token } = res.data;
      const userWithToken = { ...data, token };
      localStorage.setItem("user", JSON.stringify(userWithToken));
      setUser(userWithToken);
      toast.success("OTP verified successfully");
      setloading(false);
      return { success: true };
    } catch (error) {
      const msg = error.response?.data.message || "OTP verification failed";
      seterror(msg);
      toast.error(msg);
      setloading(false);
      throw error;
    }
  };
  const Logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    toast.info("Logged out");
  };
  return (
    <AuthContext.Provider
      value={{ user, Signup, Login, Logout, verifyOTP, loading, error }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => useContext(AuthContext);
