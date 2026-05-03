import express from "express";
import {
  getallusers,
  getuserbyid,
  Login,
  Signup,
  updateprofile,
  addFriend,
  getFriends,
  generatePassword,
  requestPasswordReset,
  resetPassword,
  searchUsers,
  transferPoints,
  verifyOTP,
  getLoginHistory,
  requestLanguageChange,
  verifyLanguageChange,
  getCurrentLanguage,
} from "../controller/auth.js";

const router = express.Router();
import auth from "../middleware/auth.js";
router.post("/signup", Signup);
router.post("/login", Login);
router.post("/verify-otp", verifyOTP);
router.get("/getalluser", getallusers);
router.get("/getuser/:id", getuserbyid);
router.patch("/update/:id", auth,updateprofile);
router.post("/addfriend", auth, addFriend);
router.get("/friends", auth, getFriends);
router.post("/generate-password", generatePassword);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.get("/search", auth, searchUsers);
router.post("/transfer-points", auth, transferPoints);
router.get("/login-history", auth, getLoginHistory);
router.get("/language", auth, getCurrentLanguage);
router.post("/language/change", auth, requestLanguageChange);
router.post("/language/verify", auth, verifyLanguageChange);
export default router;
