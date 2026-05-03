import user from "../models/auth.js";

/**
 * Award points to a user
 * @param {String} userId - User ID
 * @param {Number} points - Points to award (can be negative for deduction)
 * @returns {Promise<Object>} Updated user object
 */
export const awardPoints = async (userId, points) => {
  try {
    const userDoc = await user.findById(userId);
    if (!userDoc) {
      throw new Error("User not found");
    }
    
    const newPoints = Math.max(0, (userDoc.points || 0) + points);
    userDoc.points = newPoints;
    await userDoc.save();
    
    return userDoc;
  } catch (error) {
    console.error("Error awarding points:", error);
    throw error;
  }
};

/**
 * Check and award badge based on points
 * @param {String} userId - User ID
 * @param {Number} totalPoints - Total points user has
 */
export const checkAndAwardBadges = async (userId, totalPoints) => {
  try {
    const userDoc = await user.findById(userId);
    if (!userDoc) return;
    
    const badges = userDoc.badges || [];
    const newBadges = [];
    
    // Define badge thresholds
    if (totalPoints >= 1000 && !badges.includes("Expert")) {
      newBadges.push("Expert");
    }
    if (totalPoints >= 500 && !badges.includes("Advanced")) {
      newBadges.push("Advanced");
    }
    if (totalPoints >= 100 && !badges.includes("Intermediate")) {
      newBadges.push("Intermediate");
    }
    if (totalPoints >= 50 && !badges.includes("Beginner")) {
      newBadges.push("Beginner");
    }
    
    if (newBadges.length > 0) {
      userDoc.badges = [...badges, ...newBadges];
      await userDoc.save();
    }
  } catch (error) {
    console.error("Error checking badges:", error);
  }
};

