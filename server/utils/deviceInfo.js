/**
 * Parse user agent string to extract device information
 * @param {String} userAgent - User agent string from request
 * @returns {Object} Device information object
 */
export const parseUserAgent = (userAgent) => {
  if (!userAgent) {
    return {
      browser: "Unknown",
      os: "Unknown",
      deviceType: "unknown",
    };
  }

  const ua = userAgent.toLowerCase();
  
  // Detect Browser
  let browser = "Unknown";
  if (ua.includes("chrome") && !ua.includes("edg")) {
    browser = "Google Chrome";
  } else if (ua.includes("edg")) {
    browser = "Microsoft Edge";
  } else if (ua.includes("firefox")) {
    browser = "Firefox";
  } else if (ua.includes("safari") && !ua.includes("chrome")) {
    browser = "Safari";
  } else if (ua.includes("opera") || ua.includes("opr")) {
    browser = "Opera";
  } else if (ua.includes("msie") || ua.includes("trident")) {
    browser = "Internet Explorer";
  }

  // Detect OS
  let os = "Unknown";
  if (ua.includes("windows")) {
    os = "Windows";
  } else if (ua.includes("mac os") || ua.includes("macos")) {
    os = "macOS";
  } else if (ua.includes("linux")) {
    os = "Linux";
  } else if (ua.includes("android")) {
    os = "Android";
  } else if (ua.includes("ios") || ua.includes("iphone") || ua.includes("ipad")) {
    os = "iOS";
  } else if (ua.includes("ubuntu")) {
    os = "Ubuntu";
  }

  // Detect Device Type
  let deviceType = "unknown";
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
    deviceType = "mobile";
  } else if (ua.includes("tablet") || ua.includes("ipad")) {
    deviceType = "tablet";
  } else if (ua.includes("windows") || ua.includes("mac") || ua.includes("linux")) {
    // Distinguish between desktop and laptop (this is approximate)
    if (ua.includes("mobile") || ua.includes("touch")) {
      deviceType = "laptop";
    } else {
      deviceType = "desktop";
    }
  }

  return {
    browser,
    os,
    deviceType,
  };
};

/**
 * Get client IP address from request
 * @param {Object} req - Express request object
 * @returns {String} IP address
 */
export const getClientIP = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    "Unknown"
  );
};

