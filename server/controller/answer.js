import mongoose from "mongoose";
import question from "../models/question.js";
import { awardPoints, checkAndAwardBadges } from "../utils/rewardService.js";

export const Askanswer = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  const { answerbody, useranswered, userid } = req.body;

  try {
    const updatequestion = await question.findByIdAndUpdate(
      _id,
      {
        $push: {
          answer: {
            answerbody,
            useranswered,
            userid,
            pointsAwarded: 5,
            fiveUpvoteRewardGiven: false,
          },
        },
      },
      { new: true }
    );
    await updatenoofanswer(_id);
    
    // Award 5 points for answering
    const updatedUser = await awardPoints(userid, 5);
    await checkAndAwardBadges(userid, updatedUser.points);
    
    res.status(200).json({ data: updatequestion });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};
const updatenoofanswer = async (_id) => {
  try {
    const questionDoc = await question.findById(_id).select("answer");
    if (!questionDoc) {
      return;
    }
    await question.findByIdAndUpdate(_id, {
      $set: { noofanswer: questionDoc.answer.length },
    });
  } catch (error) {
    console.log(error);
  }
};

export const voteAnswer = async (req, res) => {
  const { id: _id, answerId } = req.params;
  const { value, userid } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  if (!mongoose.Types.ObjectId.isValid(answerId)) {
    return res.status(400).json({ message: "answer unavailable" });
  }
  
  try {
    const questionDoc = await question.findById(_id);
    if (!questionDoc) {
      return res.status(404).json({ message: "Question not found" });
    }
    
    const answerIndex = questionDoc.answer.findIndex(
      (ans) => ans._id.toString() === answerId
    );
    
    if (answerIndex === -1) {
      return res.status(404).json({ message: "Answer not found" });
    }
    
    const answer = questionDoc.answer[answerIndex];
    const upvoteArray = answer.upvote || [];
    const downvoteArray = answer.downvote || [];
    const upindex = upvoteArray.findIndex((id) => id === String(userid));
    const downindex = downvoteArray.findIndex((id) => id === String(userid));
    
    let pointsChanged = false;
    const answerAuthorId = answer.userid;
    
    if (value === "upvote") {
      if (downindex !== -1) {
        // Remove from downvote
        questionDoc.answer[answerIndex].downvote = downvoteArray.filter(
          (id) => id !== String(userid)
        );
        // Award point back to author (removing downvote)
        await awardPoints(answerAuthorId, 1);
        pointsChanged = true;
      }
      if (upindex === -1) {
        // Add upvote
        if (!questionDoc.answer[answerIndex].upvote) {
          questionDoc.answer[answerIndex].upvote = [];
        }
        questionDoc.answer[answerIndex].upvote.push(userid);
      } else {
        // Remove upvote
        questionDoc.answer[answerIndex].upvote = upvoteArray.filter(
          (id) => id !== String(userid)
        );
      }
    } else if (value === "downvote") {
      if (upindex !== -1) {
        // Remove from upvote
        questionDoc.answer[answerIndex].upvote = upvoteArray.filter(
          (id) => id !== String(userid)
        );
      }
      if (downindex === -1) {
        // Add downvote
        if (!questionDoc.answer[answerIndex].downvote) {
          questionDoc.answer[answerIndex].downvote = [];
        }
        questionDoc.answer[answerIndex].downvote.push(userid);
        // Deduct point from author
        await awardPoints(answerAuthorId, -1);
        pointsChanged = true;
      } else {
        // Remove downvote
        questionDoc.answer[answerIndex].downvote = downvoteArray.filter(
          (id) => id !== String(userid)
        );
        // Award point back to author (removing downvote)
        await awardPoints(answerAuthorId, 1);
        pointsChanged = true;
      }
    }
    
    // Check if answer reached 5 upvotes and award bonus points
    const updatedAnswer = questionDoc.answer[answerIndex];
    const upvoteCount = (updatedAnswer.upvote || []).length;
    
    if (upvoteCount >= 5 && !updatedAnswer.fiveUpvoteRewardGiven) {
      const updatedUser = await awardPoints(answerAuthorId, 5);
      questionDoc.answer[answerIndex].fiveUpvoteRewardGiven = true;
      questionDoc.answer[answerIndex].pointsAwarded = 
        (updatedAnswer.pointsAwarded || 5) + 5;
      pointsChanged = true;
      
      await checkAndAwardBadges(answerAuthorId, updatedUser.points);
    }
    
    const updatedQuestion = await question.findByIdAndUpdate(_id, questionDoc, { new: true });
    res.status(200).json({ data: updatedQuestion });
  } catch (error) {
    console.error("Vote answer error:", error);
    res.status(500).json({ message: "something went wrong.." });
    return;
  }
};
export const deleteanswer = async (req, res) => {
  const { id: _id } = req.params;
  const { answerid } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  if (!mongoose.Types.ObjectId.isValid(answerid)) {
    return res.status(400).json({ message: "answer unavailable" });
  }
  
  try {
    // Get the answer before deleting to deduct points
    const questionDoc = await question.findById(_id);
    const answerToDelete = questionDoc.answer.find(
      (ans) => ans._id.toString() === answerid
    );
    
    if (answerToDelete) {
      // Deduct points that were awarded for this answer
      const pointsToDeduct = answerToDelete.pointsAwarded || 5;
      await awardPoints(answerToDelete.userid, -pointsToDeduct);
    }
    
    const updatequestion = await question.updateOne(
      { _id },
      {
        $pull: { answer: { _id: answerid } },
      }
    );
    await updatenoofanswer(_id);
    res.status(200).json({ data: updatequestion });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};
