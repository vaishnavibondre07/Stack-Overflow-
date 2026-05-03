import mongoose from "mongoose";
import question from "../models/question.js";
import user from "../models/auth.js";

// Plan configurations
const PLAN_CONFIG = {
  free: { questionsPerDay: 1 },
  bronze: { questionsPerDay: 5 },
  silver: { questionsPerDay: 10 },
  gold: { questionsPerDay: Infinity },
};

// Helper function to get questions count for today
const getTodayQuestionsCount = async (userid) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const count = await question.countDocuments({
    userid: userid,
    askedon: {
      $gte: today,
      $lt: tomorrow,
    },
  });
  return count;
};

export const Askquestion = async (req, res) => {
  const { postquestiondata } = req.body;
  const userid = req.userid || postquestiondata.userid;

  if (!userid) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Get user subscription
    const userDoc = await user.findById(userid);
    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    let subscription = userDoc.subscription || { plan: "free", status: "active" };

    // Check if subscription has expired
    if (subscription.endDate && new Date() > new Date(subscription.endDate)) {
      subscription.plan = "free";
      subscription.status = "expired";
      userDoc.subscription = subscription;
      await userDoc.save();
    }

    const plan = subscription.plan || "free";
    const planConfig = PLAN_CONFIG[plan] || PLAN_CONFIG.free;
    const questionsPerDay = planConfig.questionsPerDay;

    // Check daily limit (only if not unlimited)
    if (questionsPerDay !== Infinity) {
      const todayQuestionsCount = await getTodayQuestionsCount(userid);
      if (todayQuestionsCount >= questionsPerDay) {
        return res.status(403).json({
          message: `You have reached your daily question limit (${questionsPerDay} question${questionsPerDay > 1 ? "s" : ""} per day). Upgrade your plan to post more questions!`,
          currentPlan: plan,
          questionsPosted: todayQuestionsCount,
          questionsAllowed: questionsPerDay,
        });
      }
    }

    const postques = new question({ ...postquestiondata });
    await postques.save();
    res.status(200).json({ data: postques });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const getallquestion = async (req, res) => {
  try {
    const allquestion = await question.find().sort({ askedon: -1 });
    res.status(200).json({ data: allquestion });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};
export const getquestionbyid = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "Invalid question id" });
  }
  try {
    const foundquestion = await question.findById(_id);
    if (!foundquestion) return res.status(404).json({ message: "Question not found" });
    res.status(200).json({ data: foundquestion });
  } catch (error) {
    res.status(500).json({ message: "something went wrong.." });
  }
};

export const getalltags = async (req, res) => {
  try {
    const allquestions = await question.find({}, { questiontags: 1 });
    const tagCounts = {};
    
    allquestions.forEach((q) => {
      if (q.questiontags && Array.isArray(q.questiontags)) {
        q.questiontags.forEach((tag) => {
          if (tag) {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          }
        });
      }
    });

    // Convert to array and sort by count
    const tags = Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    res.status(200).json({ data: tags });
  } catch (error) {
    console.error("Error fetching tags:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const deletequestion = async (req, res) => {
  const { id: _id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  try {
    await question.findByIdAndDelete(_id);
    res.status(200).json({ message: "question deleted" });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};
export const votequestion = async (req, res) => {
  const { id: _id } = req.params;
  const { value ,userid} = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  try {
    const questionDoc = await question.findById(_id);
    if (!questionDoc) {
      return res.status(404).json({ message: "Question not found" });
    }
    
    const upvoteArray = questionDoc.upvote || [];
    const downvoteArray = questionDoc.downvote || [];
    const upindex = upvoteArray.findIndex((id) => id === String(userid));
    const downindex = downvoteArray.findIndex(
      (id) => id === String(userid)
    );
    if (value === "upvote") {
      if (downindex !== -1) {
        questionDoc.downvote = downvoteArray.filter(
          (id) => id !== String(userid)
        );
      }
      if (upindex === -1) {
        if (!questionDoc.upvote) {
          questionDoc.upvote = [];
        }
        questionDoc.upvote.push(userid);
      } else {
        questionDoc.upvote = upvoteArray.filter((id) => id !== String(userid));
      }
    } else if (value === "downvote") {
      if (upindex !== -1) {
        questionDoc.upvote = upvoteArray.filter((id) => id !== String(userid));
      }
      if (downindex === -1) {
        if (!questionDoc.downvote) {
          questionDoc.downvote = [];
        }
        questionDoc.downvote.push(userid);
      } else {
        questionDoc.downvote = downvoteArray.filter(
          (id) => id !== String(userid)
        );
      }
    }
    const questionvote = await question.findByIdAndUpdate(_id, questionDoc, { new: true });
    res.status(200).json({ data: questionvote });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};
