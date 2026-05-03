import mongoose from "mongoose";
import post from "../models/post.js";
import user from "../models/auth.js";

// Helper function to get posts count for today
const getTodayPostsCount = async (userid) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const count = await post.countDocuments({
    userid: userid,
    postedon: {
      $gte: today,
      $lt: tomorrow,
    },
  });
  return count;
};

// Helper function to get allowed posts per day based on friend count
const getAllowedPostsPerDay = (friendCount) => {
  if (friendCount === 0) return 0;
  if (friendCount === 1) return 1;
  if (friendCount === 2) return 2;
  if (friendCount >= 10) return Infinity;
  return 1; // default for 3-9 friends
};

// Helper function to get display message for friend count
const getFriendPostMessage = (friendCount) => {
  if (friendCount === 0) {
    return { canPost: false, message: "You need at least 1 friend to post. Add friends to unlock posting!", limit: 0 };
  }
  if (friendCount === 1) {
    return { canPost: true, message: "You have 1 friend. You can post 1 time per day.", limit: 1 };
  }
  if (friendCount === 2) {
    return { canPost: true, message: "You have 2 friends. You can post 2 times per day.", limit: 2 };
  }
  if (friendCount >= 10) {
    return { canPost: true, message: "You have 10+ friends! Unlimited posts per day.", limit: Infinity };
  }
  return { canPost: true, message: `You have ${friendCount} friends. You can post 1 time per day. Add more friends for more posts!`, limit: 1 };
};

// Get posting eligibility
export const getPostingEligibility = async (req, res) => {
  try {
    const userid = req.userid;
    if (!userid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userDoc = await user.findById(userid);
    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    const friendCount = userDoc.friends?.length || 0;
    const allowedPosts = getAllowedPostsPerDay(friendCount);
    const todayPostsCount = allowedPosts === Infinity ? 0 : await getTodayPostsCount(userid);
    const remainingPosts = allowedPosts === Infinity ? Infinity : allowedPosts - todayPostsCount;

    return res.status(200).json({
      friendCount,
      allowedPosts: allowedPosts === Infinity ? "unlimited" : allowedPosts,
      todayPostsCount,
      remainingPosts: remainingPosts === Infinity ? "unlimited" : remainingPosts,
      canPost: allowedPosts > todayPostsCount,
      ...getFriendPostMessage(friendCount),
    });
  } catch (error) {
    console.error("Error getting posting eligibility:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Create a post
export const createPost = async (req, res) => {
  try {
    const { content } = req.body;
    const userid = req.userid;

    if (!userid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get user to check friend count
    const userDoc = await user.findById(userid);
    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    const friendCount = userDoc.friends?.length || 0;
    const allowedPosts = getAllowedPostsPerDay(friendCount);

    // Check if user has any friends
    if (friendCount === 0) {
      return res.status(403).json({
        message: "You cannot post without friends. Add at least 1 friend to start posting!",
        friendCount: 0,
        allowedPosts: 0,
      });
    }

    // Check if user has exceeded their daily limit
    if (allowedPosts !== Infinity) {
      const todayPostsCount = await getTodayPostsCount(userid);
      if (todayPostsCount >= allowedPosts) {
        return res.status(403).json({
          message: `Daily limit reached! You can only post ${allowedPosts} time${allowedPosts > 1 ? "s" : ""} per day with ${friendCount} friend${friendCount > 1 ? "s" : ""}. Add more friends to post more often!`,
          friendCount,
          allowedPosts,
          todayPostsCount,
        });
      }
    }

    const image = req.files?.image?.[0]?.filename;
    const video = req.files?.video?.[0]?.filename;

    if (!image && !video && !content) {
      return res.status(400).json({
        message: "Post must contain content, image, or video",
      });
    }

    const newPost = await post.create({
      content: content || "",
      image: image ? `/uploads/${image}` : null,
      video: video ? `/uploads/${video}` : null,
      userid: userid,
      username: userDoc.name,
    });

    res.status(200).json({ data: newPost, message: "Post created successfully!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Get all posts
export const getAllPosts = async (req, res) => {
  try {
    const allPosts = await post.find().sort({ postedon: -1 });
    res.status(200).json({ data: allPosts });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Like/Unlike a post
export const likePost = async (req, res) => {
  try {
    const { id: _id } = req.params;
    const userid = req.userid;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ message: "Post unavailable" });
    }

    const postDoc = await post.findById(_id);
    if (!postDoc) {
      return res.status(404).json({ message: "Post not found" });
    }

    const likeIndex = postDoc.likes.findIndex((id) => id === String(userid));

    if (likeIndex === -1) {
      postDoc.likes.push(userid);
    } else {
      postDoc.likes = postDoc.likes.filter((id) => id !== String(userid));
    }

    const updatedPost = await post.findByIdAndUpdate(_id, postDoc, {
      new: true,
    });

    res.status(200).json({ data: updatedPost });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Comment on a post
export const commentPost = async (req, res) => {
  try {
    const { id: _id } = req.params;
    const { commentbody } = req.body;
    const userid = req.userid;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ message: "Post unavailable" });
    }

    if (!commentbody) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const userDoc = await user.findById(userid);
    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    const postDoc = await post.findById(_id);
    if (!postDoc) {
      return res.status(404).json({ message: "Post not found" });
    }

    postDoc.comments.push({
      commentbody,
      userid,
      username: userDoc.name,
      commentedon: new Date(),
    });

    const updatedPost = await post.findByIdAndUpdate(_id, postDoc, {
      new: true,
    });

    res.status(200).json({ data: updatedPost });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Share a post
export const sharePost = async (req, res) => {
  try {
    const { id: _id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ message: "Post unavailable" });
    }

    const postDoc = await post.findById(_id);
    if (!postDoc) {
      return res.status(404).json({ message: "Post not found" });
    }

    postDoc.shares = (postDoc.shares || 0) + 1;

    const updatedPost = await post.findByIdAndUpdate(_id, postDoc, {
      new: true,
    });

    res.status(200).json({ data: updatedPost });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Delete a post
export const deletePost = async (req, res) => {
  try {
    const { id: _id } = req.params;
    const userid = req.userid;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ message: "Post unavailable" });
    }

    const postDoc = await post.findById(_id);
    if (!postDoc) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (postDoc.userid !== userid) {
      return res.status(403).json({ message: "You can only delete your own posts" });
    }

    await post.findByIdAndDelete(_id);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
