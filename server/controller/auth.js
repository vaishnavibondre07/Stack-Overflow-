import mongoose from "mongoose";
import user from "../models/auth.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import PasswordReset from "../models/passwordReset.js";
import LoginHistory from "../models/loginHistory.js";
import OTP from "../models/otp.js";
import { checkAndAwardBadges } from "../utils/rewardService.js";
import { parseUserAgent, getClientIP } from "../utils/deviceInfo.js";
import { sendOTPEmail } from "../utils/emailService.js";
import LanguageChange from "../models/languageChange.js";

const sanitizeUser = (userDoc) => {
  if (!userDoc) return userDoc;
  const userObject =
    typeof userDoc.toObject === "function" ? userDoc.toObject() : { ...userDoc };
  delete userObject.password;
  return userObject;
};

export const Signup = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exisitinguser = await user.findOne({ email });
    if (exisitinguser) {
      return res.status(409).json({ message: "User already exist" });
    }
    const hashpassword = await bcrypt.hash(password, 12);
    const newuser = await user.create({
      name,
      email,
      password: hashpassword,
    });
    const token = jwt.sign(
      { email: newuser.email, id: newuser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(201).json({ data: sanitizeUser(newuser), token });
  } catch (error) {
    res.status(500).json({ message: "something went wrong.." });
  }
};
export const Login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const exisitinguser = await user.findOne({ email });
    if (!exisitinguser) {
      return res.status(404).json({ message: "User does not exist" });
    }

    const ispasswordcrct = await bcrypt.compare(
      password,
      exisitinguser.password
    );
    if (!ispasswordcrct) {
      // Log failed login attempt
      const userAgent = req.headers["user-agent"] || "";
      const deviceInfo = parseUserAgent(userAgent);
      const ipAddress = getClientIP(req);
      
      await LoginHistory.create({
        userid: exisitinguser._id.toString(),
        email: exisitinguser.email,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        deviceType: deviceInfo.deviceType,
        ipAddress: ipAddress,
        userAgent: userAgent,
        status: "failed",
      });
      
      return res.status(400).json({ message: "Invalid password" });
    }

    // Extract device information
    const userAgent = req.headers["user-agent"] || "";
    const deviceInfo = parseUserAgent(userAgent);
    const ipAddress = getClientIP(req);
    const browser = deviceInfo.browser;

    // Check if it's Google Chrome - requires OTP
    const requiresOTP = browser === "Google Chrome";
    
    // Check if it's mobile device and validate time restriction
    if (deviceInfo.deviceType === "mobile") {
      const currentHour = new Date().getHours();
      if (currentHour < 10 || currentHour >= 13) {
        await LoginHistory.create({
          userid: exisitinguser._id.toString(),
          email: exisitinguser.email,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          deviceType: deviceInfo.deviceType,
          ipAddress: ipAddress,
          userAgent: userAgent,
          status: "failed",
        });
        
        return res.status(403).json({ 
          message: "Mobile access is only allowed between 10 AM to 1 PM" 
        });
      }
    }

    // Microsoft Edge/Browser - no OTP required
    if (browser === "Microsoft Edge" || browser.includes("Microsoft")) {
      const token = jwt.sign(
        { email: exisitinguser.email, id: exisitinguser._id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      // Log successful login
      await LoginHistory.create({
        userid: exisitinguser._id.toString(),
        email: exisitinguser.email,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        deviceType: deviceInfo.deviceType,
        ipAddress: ipAddress,
        userAgent: userAgent,
        status: "success",
        requiresOTP: false,
        otpVerified: true,
      });

      const safeUser = sanitizeUser(exisitinguser);
      return res.status(200).json({ data: safeUser, token });
    }

    // Google Chrome - requires OTP
    if (requiresOTP) {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP valid for 10 minutes

      // Save OTP
      const otpDoc = await OTP.create({
        userid: exisitinguser._id.toString(),
        email: exisitinguser.email,
        otp: otp,
        expiresAt: expiresAt,
      });

      // Log login attempt with pending status
      const loginHistory = await LoginHistory.create({
        userid: exisitinguser._id.toString(),
        email: exisitinguser.email,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        deviceType: deviceInfo.deviceType,
        ipAddress: ipAddress,
        userAgent: userAgent,
        status: "pending",
        requiresOTP: true,
        otpVerified: false,
      });

      // Update OTP with login history ID
      otpDoc.loginHistoryId = loginHistory._id.toString();
      await otpDoc.save();

      // Send OTP email
      await sendOTPEmail(exisitinguser.email, exisitinguser.name, otp);

      return res.status(200).json({ 
        message: "OTP sent to your email. Please verify to complete login.",
        requiresOTP: true,
        loginHistoryId: loginHistory._id.toString(),
        userId: exisitinguser._id.toString(),
      });
    }

    // Other browsers - standard login
    const token = jwt.sign(
      { email: exisitinguser.email, id: exisitinguser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Log successful login
    await LoginHistory.create({
      userid: exisitinguser._id.toString(),
      email: exisitinguser.email,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      deviceType: deviceInfo.deviceType,
      ipAddress: ipAddress,
      userAgent: userAgent,
      status: "success",
      requiresOTP: false,
      otpVerified: true,
    });

    const safeUser = sanitizeUser(exisitinguser);
    res.status(200).json({ data: safeUser, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "something went wrong.." });
    return;
  }
};
export const getallusers = async (req, res) => {
  try {
    const alluser = await user.find({}, { password: 0 });
    res.status(200).json({ data: alluser });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};
export const getUserById = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "User unavailable" });
  }
  try {
    const userData = await user.findById(_id).select("-password");
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ data: userData });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};
export const getuserbyid = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "Invalid user id" });
  }
  try {
    const founduser = await user.findById(_id).select("-password");
    if (!founduser) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ data: founduser });
  } catch (error) {
    res.status(500).json({ message: "something went wrong.." });
  }
};
export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { name, about, tags } = req.body.editForm;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "User unavailable" });
  }
  try {
    const updateprofile = await user.findByIdAndUpdate(
      _id,
      { $set: { name: name, about: about, tags: tags } },
      { new: true }
    ).select("-password");
    res.status(200).json({ data: updateprofile });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const addFriend = async (req, res) => {
  const { friendId } = req.body;
  const userid = req.userid;

  if (!mongoose.Types.ObjectId.isValid(friendId)) {
    return res.status(400).json({ message: "Invalid friend ID" });
  }

  if (userid === friendId) {
    return res.status(400).json({ message: "You cannot add yourself as a friend" });
  }

  try {
    const currentUser = await user.findById(userid);
    const friendUser = await user.findById(friendId);

    if (!currentUser || !friendUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (currentUser.friends?.includes(friendId)) {
      return res.status(400).json({ message: "User is already your friend" });
    }

    // Add friend to current user's friends list
    currentUser.friends = currentUser.friends || [];
    currentUser.friends.push(friendId);

    // Add current user to friend's friends list (mutual friendship)
    friendUser.friends = friendUser.friends || [];
    friendUser.friends.push(userid);

    await currentUser.save();
    await friendUser.save();

    res.status(200).json({ 
      data: currentUser, 
      message: "Friend added successfully" 
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getFriends = async (req, res) => {
  const userid = req.userid;

  try {
    const userDoc = await user.findById(userid).populate("friends");
    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get friend details
    const friendIds = userDoc.friends || [];
    const friendsList = await user.find({ _id: { $in: friendIds } });

    res.status(200).json({ 
      data: friendsList,
      count: friendsList.length 
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const generatePassword = async (req, res) => {
  try {
    const { length } = req.body;
    const passwordLength = length && length >= 8 && length <= 32 ? length : 12;
    
    const uppercaseLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercaseLetters = "abcdefghijklmnopqrstuvwxyz";
    const allLetters = uppercaseLetters + lowercaseLetters;
    
    let password = "";
    
    // Ensure at least one uppercase and one lowercase letter
    password += uppercaseLetters[Math.floor(Math.random() * uppercaseLetters.length)];
    password += lowercaseLetters[Math.floor(Math.random() * lowercaseLetters.length)];
    
    // Fill the rest with random letters
    for (let i = 2; i < passwordLength; i++) {
      password += allLetters[Math.floor(Math.random() * allLetters.length)];
    }
    
    // Shuffle the password to randomize position of guaranteed characters
    const generatedPassword = password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
    
    res.status(200).json({ password: generatedPassword });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const { email, phone } = req.body;
    
    if (!email && !phone) {
      return res.status(400).json({ message: "Please provide email or phone number" });
    }

    // Find user by email or phone
    let userDoc;
    if (email) {
      userDoc = await user.findOne({ email });
    } else {
      userDoc = await user.findOne({ phone });
    }

    if (!userDoc) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({ 
        message: "If an account exists, a password reset link has been sent",
        resetToken: null 
      });
    }

    // Check if user has already requested password reset today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingRequest = await PasswordReset.findOne({
      userid: userDoc._id.toString(),
      requestedAt: {
        $gte: today,
        $lt: tomorrow,
      },
      used: false,
    });

    if (existingRequest) {
      return res.status(429).json({ 
        message: "You have already requested a password reset today. Please try again tomorrow.",
        canRequestAgain: false 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Save reset token
    await PasswordReset.create({
      userid: userDoc._id.toString(),
      resetToken,
      expiresAt,
    });

    // In a real application, you would send an email/SMS here with the reset token
    // For now, we'll return it (in production, remove this)
    res.status(200).json({ 
      message: "Password reset link has been sent",
      resetToken, // Remove this in production, only return in development
      userId: userDoc._id.toString()
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword, userId } = req.body;

    if (!resetToken || !newPassword || !userId) {
      return res.status(400).json({ message: "Reset token, user ID, and new password are required" });
    }

    // Find the reset token
    const resetRequest = await PasswordReset.findOne({
      resetToken,
      userid: userId,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetRequest) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Find user
    const userDoc = await user.findById(userId);
    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash new password
    const hashpassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await user.findByIdAndUpdate(userId, { password: hashpassword });

    // Mark reset token as used
    resetRequest.used = true;
    await resetRequest.save();

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: "Search query is required" });
    }
    
    const searchRegex = new RegExp(query, "i");
    const usersList = await user.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex },
      ],
    }).select("name email _id points badges").limit(20);
    
    res.status(200).json({ data: usersList });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { otp, userId, loginHistoryId } = req.body;

    if (!otp || !userId || !loginHistoryId) {
      return res.status(400).json({ message: "OTP, user ID, and login history ID are required" });
    }

    // Find valid OTP
    const otpDoc = await OTP.findOne({
      userid: userId,
      otp: otp,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpDoc) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Verify login history matches
    const loginHistory = await LoginHistory.findById(loginHistoryId);
    if (!loginHistory || loginHistory.userid !== userId) {
      return res.status(400).json({ message: "Invalid login session" });
    }

    // Mark OTP as used
    otpDoc.used = true;
    await otpDoc.save();

    // Update login history
    loginHistory.status = "success";
    loginHistory.otpVerified = true;
    await loginHistory.save();

    // Get user
    const userDoc = await user.findById(userId);
    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate token
    const token = jwt.sign(
      { email: userDoc.email, id: userDoc._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ 
      message: "OTP verified successfully",
      data: sanitizeUser(userDoc),
      token 
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getLoginHistory = async (req, res) => {
  try {
    const userid = req.userid;

    if (!userid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const loginHistory = await LoginHistory.find({ userid: userid })
      .sort({ loginTime: -1 })
      .limit(50); // Get last 50 login attempts

    res.status(200).json({ data: loginHistory });
  } catch (error) {
    console.error("Get login history error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const requestLanguageChange = async (req, res) => {
  try {
    const userid = req.userid;
    const { newLanguage } = req.body;

    if (!userid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const validLanguages = ["en", "es", "hi", "pt", "zh", "fr"];
    if (!validLanguages.includes(newLanguage)) {
      return res.status(400).json({ message: "Invalid language" });
    }

    const userDoc = await user.findById(userid);
    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentLanguage = userDoc.preferredLanguage || "en";
    if (currentLanguage === newLanguage) {
      return res.status(400).json({ message: "Language is already set to this" });
    }

    // All language changes require email verification
    const verificationMethod = "email";

    // Check if user has email
    if (!userDoc.email) {
      return res.status(400).json({ 
        message: "Email is required for language change. Please update your profile with an email address." 
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP valid for 10 minutes

    // Create language change request
    const languageChange = await LanguageChange.create({
      userid: userid,
      currentLanguage: currentLanguage,
      newLanguage: newLanguage,
      verificationMethod: verificationMethod,
      verified: false,
    });

    // Save OTP
    const otpData = {
      userid: userid,
      email: userDoc.email,
      otp: otp,
      expiresAt: expiresAt,
      languageChangeId: languageChange._id.toString(),
      type: "language-change",
    };

    await OTP.create(otpData);
    // Send OTP via email
    await sendOTPEmail(userDoc.email, userDoc.name, otp);

    res.status(200).json({
      message: "OTP sent to your email. Please verify to change language.",
      languageChangeId: languageChange._id.toString(),
      verificationMethod: verificationMethod,
    });
  } catch (error) {
    console.error("Request language change error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const verifyLanguageChange = async (req, res) => {
  try {
    const userid = req.userid;
    const { otp, languageChangeId } = req.body;

    if (!userid || !otp || !languageChangeId) {
      return res.status(400).json({ message: "OTP and language change ID are required" });
    }

    // Find language change request
    const languageChange = await LanguageChange.findById(languageChangeId);
    if (!languageChange || languageChange.userid !== userid) {
      return res.status(404).json({ message: "Language change request not found" });
    }

    if (languageChange.verified) {
      return res.status(400).json({ message: "Language change already verified" });
    }

    // Find valid OTP
    const otpDoc = await OTP.findOne({
      userid: userid,
      otp: otp,
      languageChangeId: languageChangeId,
      used: false,
      expiresAt: { $gt: new Date() },
      type: "language-change",
    });

    if (!otpDoc) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Mark OTP as used
    otpDoc.used = true;
    await otpDoc.save();

    // Update language change request
    languageChange.verified = true;
    languageChange.verifiedAt = new Date();
    await languageChange.save();

    // Update user's preferred language
    const userDoc = await user.findById(userid);
    userDoc.preferredLanguage = languageChange.newLanguage;
    await userDoc.save();

    res.status(200).json({
      message: "Language changed successfully",
      data: {
        language: languageChange.newLanguage,
        previousLanguage: languageChange.currentLanguage,
      },
    });
  } catch (error) {
    console.error("Verify language change error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getCurrentLanguage = async (req, res) => {
  try {
    const userid = req.userid;

    if (!userid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userDoc = await user.findById(userid);
    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      language: userDoc.preferredLanguage || "en",
    });
  } catch (error) {
    console.error("Get current language error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const transferPoints = async (req, res) => {
  try {
    const { recipientId, points } = req.body;
    const senderId = req.userid;
    
    if (!recipientId || !points) {
      return res.status(400).json({ message: "Recipient ID and points are required" });
    }
    
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ message: "Invalid recipient ID" });
    }
    
    if (senderId === recipientId) {
      return res.status(400).json({ message: "You cannot transfer points to yourself" });
    }
    
    const pointsToTransfer = parseInt(points);
    if (isNaN(pointsToTransfer) || pointsToTransfer <= 0) {
      return res.status(400).json({ message: "Points must be a positive number" });
    }
    
    // Get sender
    const sender = await user.findById(senderId);
    if (!sender) {
      return res.status(404).json({ message: "Sender not found" });
    }
    
    // Check if sender has minimum 10 points
    if ((sender.points || 0) < 10) {
      return res.status(400).json({ 
        message: "You need at least 10 points to transfer points to others" 
      });
    }
    
    // Check if sender has enough points
    if ((sender.points || 0) < pointsToTransfer) {
      return res.status(400).json({ 
        message: "Insufficient points. You don't have enough points to transfer" 
      });
    }
    
    // Get recipient
    const recipient = await user.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }
    
    // Transfer points
    sender.points = (sender.points || 0) - pointsToTransfer;
    recipient.points = (recipient.points || 0) + pointsToTransfer;
    
    await sender.save();
    await recipient.save();
    
    // Check badges for recipient
    await checkAndAwardBadges(recipientId, recipient.points);
    
    res.status(200).json({ 
      message: "Points transferred successfully",
      data: {
        sender: { points: sender.points },
        recipient: { points: recipient.points, name: recipient.name }
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
