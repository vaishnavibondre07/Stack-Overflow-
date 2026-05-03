import express from "express";
import {
  createPost,
  getAllPosts,
  likePost,
  commentPost,
  sharePost,
  deletePost,
  getPostingEligibility,
} from "../controller/post.js";
import auth from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/posting-eligibility", auth, getPostingEligibility);
router.post(
  "/create",
  auth,
  upload.fields([{ name: "image", maxCount: 1 }, { name: "video", maxCount: 1 }]),
  createPost
);
router.get("/getall", getAllPosts);
router.patch("/like/:id", auth, likePost);
router.post("/comment/:id", auth, commentPost);
router.patch("/share/:id", sharePost);
router.delete("/delete/:id", auth, deletePost);

export default router;

