import { body, param, query, validationResult } from "express-validator";
import DOMPurify from "isomorphic-dompurify";

// General input sanitization middleware
export const sanitizeInputs = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      // Remove potential XSS attacks
      return DOMPurify.sanitize(value, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true
      }).trim();
    }
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return value.map(sanitizeValue);
      }
      const sanitized = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val);
      }
      return sanitized;
    }
    return value;
  };

  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }

  // Sanitize URL parameters
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }

  next();
};

// Handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      data: {
        errors: formattedErrors,
      },
    });
  }

  next();
};

// User validation rules
export const validateRegistration = [
  body("fullName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("phoneNumber")
    .optional()
    .matches(/^\+?[\d\s-()]{10,}$/)
    .withMessage("Please provide a valid phone number"),

  body("password")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),

  body("role")
    .optional()
    .isIn(["CITIZEN", "ADMINISTRATOR", "WARD_OFFICER", "MAINTENANCE_TEAM"])
    .withMessage("Invalid role"),

  handleValidationErrors,
];

export const validateUserRegistration = validateRegistration;

export const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("password").notEmpty().withMessage("Password is required"),

  handleValidationErrors,
];

export const validateUserLogin = validateLogin;

export const validateUserProfileUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("phone")
    .optional()
    .matches(/^\+?[\d\s-()]{10,}$/)
    .withMessage("Please provide a valid phone number"),

  body("preferences.language")
    .optional()
    .isIn(["en", "hi", "ml"])
    .withMessage("Invalid language preference"),

  body("preferences.notifications")
    .optional()
    .isBoolean()
    .withMessage("Notifications preference must be boolean"),

  body("preferences.emailAlerts")
    .optional()
    .isBoolean()
    .withMessage("Email alerts preference must be boolean"),

  handleValidationErrors,
];

// Complaint validation rules
export const validateComplaintCreation = [
  body("type")
    .custom(async (value) => {
      // Dynamic validation using complaint type helper
      const { isValidComplaintType } = await import("../utils/complaintTypeHelper.js");

      try {
        const isValid = await isValidComplaintType(value);
        if (!isValid) {
          throw new Error(`Invalid complaint type: ${value}`);
        }
        return true;
      } catch (error) {
        throw new Error(`Complaint type validation failed: ${error.message}`);
      }
    }),

  body("description")
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),

  body("priority")
    .optional()
    .isIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .withMessage("Invalid priority"),

  body("contactPhone")
    .optional()
    .matches(/^\+?[\d\s-()]{10,}$/)
    .withMessage("Please provide a valid phone number"),

  body("contactEmail")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("wardId").notEmpty().withMessage("Ward is required"),

  body("area")
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Area must be between 2 and 200 characters"),

  body("address")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Address cannot exceed 500 characters"),

  body("coordinates.latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Invalid latitude"),

  body("coordinates.longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Invalid longitude"),

  handleValidationErrors,
];

export const validateComplaintUpdate = [
  body("status")
    .optional()
    .isIn([
      "REGISTERED",
      "ASSIGNED",
      "IN_PROGRESS",
      "RESOLVED",
      "CLOSED",
      "REOPENED",
    ])
    .withMessage("Invalid status"),

  body("priority")
    .optional()
    .isIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .withMessage("Invalid priority"),

  body("assignedToId").optional().isString().withMessage("Invalid user ID"),

  body("comment")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Comment cannot exceed 1000 characters"),

  handleValidationErrors,
];

export const validateComplaintFeedback = [
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("comment")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Comment cannot exceed 1000 characters"),

  handleValidationErrors,
];

// ID validation - Updated to support CUID format used by Prisma
export const validateMongoId = [
  param("id")
    .isLength({ min: 1 })
    .withMessage("ID is required")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Invalid ID format"),

  handleValidationErrors,
];

// Query validation
export const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  handleValidationErrors,
];

// Ward validation
export const validateWard = [
  body("name")
    .notEmpty()
    .withMessage("Ward name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Ward name must be between 2 and 100 characters"),
  body("description")
    .notEmpty()
    .withMessage("Ward description is required")
    .isLength({ min: 10, max: 500 })
    .withMessage("Description must be between 10 and 500 characters"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  handleValidationErrors,
];

// SubZone validation
export const validateSubZone = [
  body("name")
    .notEmpty()
    .withMessage("Sub-zone name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Sub-zone name must be between 2 and 100 characters"),
  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description must be less than 500 characters"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  handleValidationErrors,
];

// User creation validation (Admin)
export const validateUser = [
  body("fullName")
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),
  body("phoneNumber")
    .optional()
    .isMobilePhone()
    .withMessage("Please enter a valid phone number"),
  body("role")
    .isIn(["CITIZEN", "WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"])
    .withMessage("Invalid role"),
  body("wardId").optional().isString().withMessage("Invalid ward ID"),
  body("department")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Department name too long"),
  handleValidationErrors,
];

// User update validation (Admin)
export const validateUserUpdate = [
  body("fullName")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .optional()
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),
  body("phoneNumber")
    .optional()
    .isMobilePhone()
    .withMessage("Please enter a valid phone number"),
  body("role")
    .optional()
    .isIn(["CITIZEN", "WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"])
    .withMessage("Invalid role"),
  body("wardId").optional().isString().withMessage("Invalid ward ID"),
  body("department")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Department name too long"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  handleValidationErrors,
];

export const validateComplaintFilters = [
  query("status")
    .optional()
    .isIn([
      "REGISTERED",
      "ASSIGNED",
      "IN_PROGRESS",
      "RESOLVED",
      "CLOSED",
      "REOPENED",
    ])
    .withMessage("Invalid status filter"),

  query("priority")
    .optional()
    .isIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .withMessage("Invalid priority filter"),

  query("type")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Type filter cannot be empty"),

  query("wardId")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Ward filter cannot be empty"),

  query("assignedToId")
    .optional()
    .isString()
    .withMessage("Invalid assignedTo filter"),

  query("submittedById")
    .optional()
    .isString()
    .withMessage("Invalid submittedBy filter"),

  query("dateFrom")
    .optional()
    .isISO8601()
    .withMessage("Invalid dateFrom format"),

  query("dateTo").optional().isISO8601().withMessage("Invalid dateTo format"),

  query("search")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search term must be between 1 and 100 characters"),

  handleValidationErrors,
];

// Password validation
export const validatePasswordReset = [
  body("token").notEmpty().withMessage("Reset token is required"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),

  handleValidationErrors,
];

export const validatePasswordChange = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),

  handleValidationErrors,
];

// OTP validation
export const validateOTP = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("otpCode")
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("OTP must be a 6-digit number"),

  handleValidationErrors,
];

// OTP request validation (for login/registration)
export const validateOTPRequest = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  handleValidationErrors,
];

// Ward boundary validation
export const validateWardBoundaries = [
  body("boundaries")
    .optional()
    .custom((value) => {
      if (value) {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed) || parsed.length < 3) {
            throw new Error("Boundaries must be an array of at least 3 coordinate pairs");
          }
          // Validate each coordinate pair
          for (const coord of parsed) {
            if (!Array.isArray(coord) || coord.length !== 2 ||
              typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
              throw new Error("Each boundary coordinate must be [longitude, latitude] number pair");
            }
            if (coord[0] < -180 || coord[0] > 180 || coord[1] < -90 || coord[1] > 90) {
              throw new Error("Coordinates must be valid longitude (-180 to 180) and latitude (-90 to 90)");
            }
          }
          return true;
        } catch (error) {
          throw new Error(`Invalid boundaries JSON: ${error.message}`);
        }
      }
      return true;
    }),

  body("centerLat")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Center latitude must be between -90 and 90"),

  body("centerLng")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Center longitude must be between -180 and 180"),

  body("boundingBox")
    .optional()
    .custom((value) => {
      if (value) {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed) || parsed.length !== 4) {
            throw new Error("Bounding box must be an array of 4 numbers [minLng, minLat, maxLng, maxLat]");
          }
          const [minLng, minLat, maxLng, maxLat] = parsed;
          if (typeof minLng !== 'number' || typeof minLat !== 'number' ||
            typeof maxLng !== 'number' || typeof maxLat !== 'number') {
            throw new Error("All bounding box values must be numbers");
          }
          if (minLng >= maxLng || minLat >= maxLat) {
            throw new Error("Invalid bounding box: min values must be less than max values");
          }
          return true;
        } catch (error) {
          throw new Error(`Invalid bounding box JSON: ${error.message}`);
        }
      }
      return true;
    }),

  handleValidationErrors,
];

// Location detection validation
export const validateLocationDetection = [
  body("latitude")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),

  body("longitude")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),

  handleValidationErrors,
];

// System config validation (enhanced)
export const validateSystemConfigBulk = [
  body("settings")
    .isArray({ min: 1 })
    .withMessage("Settings must be a non-empty array"),

  body("settings.*.key")
    .matches(/^[A-Z_][A-Z0-9_]*$/)
    .withMessage("Each key must be uppercase letters and underscores only"),

  body("settings.*.value")
    .notEmpty()
    .withMessage("Each setting must have a value")
    .isLength({ max: 5000 })
    .withMessage("Setting value cannot exceed 5000 characters"),

  body("settings.*.type")
    .optional()
    .isIn(["string", "number", "boolean", "json"])
    .withMessage("Type must be one of: string, number, boolean, json"),

  body("settings.*.description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  handleValidationErrors,
];

// Feedback validation (enhanced)
export const validateComplaintFeedbackEnhanced = [
  body("feedback")
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage("Feedback must be between 5 and 1000 characters")
    .escape(), // Sanitize HTML entities

  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  handleValidationErrors,
];

// Reopen complaint validation
export const validateComplaintReopen = [
  body("reason")
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("Reason must be between 10 and 500 characters")
    .escape(),

  body("comment")
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("Comment must be between 10 and 500 characters")
    .escape(),

  handleValidationErrors,
];

// Bulk user actions validation
export const validateBulkUserActions = [
  body("action")
    .isIn(["activate", "deactivate", "delete"])
    .withMessage("Action must be one of: activate, deactivate, delete"),

  body("userIds")
    .isArray({ min: 1, max: 100 })
    .withMessage("User IDs must be an array with 1-100 items"),

  body("userIds.*")
    .isString()
    .isLength({ min: 1 })
    .withMessage("Each user ID must be a non-empty string"),

  handleValidationErrors,
];

// Role management validation
export const validateRoleManagement = [
  body("userId")
    .isString()
    .isLength({ min: 1 })
    .withMessage("User ID is required"),

  body("newRole")
    .isIn(["CITIZEN", "WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"])
    .withMessage("Invalid role"),

  body("wardId")
    .optional()
    .isString()
    .withMessage("Ward ID must be a string"),

  handleValidationErrors,
];

// Guest validation rules
export const validateOtpRequest = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("purpose")
    .optional()
    .isIn(["complaint_submission"])
    .withMessage("Invalid purpose"),

  handleValidationErrors,
];

// File upload validation
export const validateFileUpload = [
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  handleValidationErrors,
];

// Generic ID validation for various endpoints
export const validateId = [
  param("id")
    .isString()
    .isLength({ min: 1 })
    .withMessage("Invalid ID format"),

  handleValidationErrors,
];

// Ward ID validation for path parameters
export const validateWardId = [
  param("wardId")
    .isString()
    .isLength({ min: 1 })
    .withMessage("Invalid ward ID format"),

  handleValidationErrors,
];

// Query parameter validation for search and filters
export const validateSearchQuery = [
  query("search")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search term must be between 1 and 100 characters"),

  query("sort")
    .optional()
    .isIn(["asc", "desc", "newest", "oldest", "priority", "status"])
    .withMessage("Invalid sort parameter"),

  handleValidationErrors,
];

// System health and stats validation
export const validateDateRange = [
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid start date format"),

  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid end date format"),

  query("ward")
    .optional()
    .isString()
    .withMessage("Invalid ward parameter"),

  handleValidationErrors,
];

export const validateOtpVerification = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("otpCode")
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("OTP must be a 6-digit number"),

  body("complaintId").notEmpty().withMessage("Complaint ID is required"),

  handleValidationErrors,
];

export const validateGuestComplaintInitiation = [
  body("fullName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("phoneNumber")
    .matches(/^\+?[\d\s-()]{10,}$/)
    .withMessage("Please provide a valid phone number"),

  handleValidationErrors,
];

export const validateGuestRegistration = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("otpCode")
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("OTP must be a 6-digit number"),

  body("fullName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),

  body("type")
    .isIn([
      "WATER_SUPPLY",
      "ELECTRICITY",
      "ROAD_REPAIR",
      "GARBAGE_COLLECTION",
      "STREET_LIGHTING",
      "SEWERAGE",
      "PUBLIC_HEALTH",
      "TRAFFIC",
      "OTHERS",
    ])
    .withMessage("Invalid complaint type"),

  body("description")
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),

  body("wardId").notEmpty().withMessage("Ward is required"),

  handleValidationErrors,
];

export const validateGuestComplaint = [
  body("fullName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("phoneNumber")
    .matches(/^\+?[\d\s-()]{10,}$/)
    .withMessage("Please provide a valid phone number"),

  body("type")
    .isIn([
      "WATER_SUPPLY",
      "ELECTRICITY",
      "ROAD_REPAIR",
      "GARBAGE_COLLECTION",
      "STREET_LIGHTING",
      "SEWERAGE",
      "PUBLIC_HEALTH",
      "TRAFFIC",
      "OTHERS",
    ])
    .withMessage("Invalid complaint type"),

  body("description")
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),

  body("priority")
    .optional()
    .isIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .withMessage("Invalid priority"),

  body("wardId").notEmpty().withMessage("Ward is required"),

  body("area")
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Area must be between 2 and 200 characters"),

  body("address")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Address cannot exceed 500 characters"),

  body("coordinates.latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Invalid latitude"),

  body("coordinates.longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Invalid longitude"),

  handleValidationErrors,
];

export const validateComplaintTracking = [
  query("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  query("phoneNumber")
    .optional()
    .matches(/^\+?[\d\s-()]{10,}$/)
    .withMessage("Please provide a valid phone number"),

  handleValidationErrors,
];
