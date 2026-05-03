import { parseUserAgent } from "../utils/deviceInfo.js";

/**
 * Middleware to restrict mobile device access to specific hours (10 AM - 1 PM)
 */
export const mobileTimeRestriction = (req, res, next) => {
  try {
    const userAgent = req.headers["user-agent"] || "";
    const deviceInfo = parseUserAgent(userAgent);

    // Only apply restriction to mobile devices
    if (deviceInfo.deviceType === "mobile") {
      const currentHour = new Date().getHours();
      
      // Check if current time is outside allowed hours (10 AM to 1 PM)
      if (currentHour < 10 || currentHour >= 13) {
        return res.status(403).json({
          message: "Mobile access is restricted. Please access between 10 AM to 1 PM.",
          allowedHours: "10:00 AM - 1:00 PM",
          currentTime: new Date().toLocaleTimeString(),
        });
      }
    }

    next();
  } catch (error) {
    console.error("Mobile time restriction error:", error);
    next(); // Continue on error to avoid blocking all requests
  }
};

export default mobileTimeRestriction;

