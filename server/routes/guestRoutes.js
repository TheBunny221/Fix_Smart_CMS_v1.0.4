import express from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  submitGuestComplaint,
  submitGuestComplaintWithAttachments,
  verifyOTPAndRegister,
  resendOTP,
  trackComplaint,
  getPublicStats,
  getPublicWards,
  getPublicComplaintTypes,
} from "../controller/guestController.js";
import {
  submitGuestServiceRequest,
  verifyServiceRequestOTP,
  trackServiceRequest,
  getServiceTypes,
} from "../controller/guestServiceRequestController.js";
import {
  validateOtpVerification,
  validateComplaintTracking,
  validateGuestComplaint,
  validateGuestComplaintInitiation,
  validateGuestRegistration,
  validateOtpRequest,
  sanitizeInputs
} from "../middleware/validation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rate limiting for guest OTP operations
const guestOtpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: process.env.NODE_ENV === "production" ? 3 : 50, // 3 OTP requests per 5 minutes in production
  message: {
    success: false,
    message: "Too many OTP requests. Please wait 5 minutes before requesting again.",
    errorCode: "OTP_RATE_LIMIT_EXCEEDED"
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
});

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Guest
 *   description: Guest user operations (anonymous complaints and service requests)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     GuestComplaintRequest:
 *       type: object
 *       required:
 *         - description
 *         - area
 *         - contactPhone
 *         - wardId
 *       properties:
 *         title:
 *           type: string
 *           description: Brief title of the complaint
 *           example: "Street light not working"
 *         description:
 *           type: string
 *           description: Detailed description of the complaint
 *           example: "The street light on MG Road has been non-functional for 3 days"
 *         type:
 *           type: string
 *           description: Type of complaint
 *           example: "STREET_LIGHTING"
 *         area:
 *           type: string
 *           description: Area where the complaint is located
 *           example: "MG Road"
 *         landmark:
 *           type: string
 *           description: Nearby landmark
 *           example: "Near City Mall"
 *         address:
 *           type: string
 *           description: Full address
 *           example: "MG Road, Near City Mall, Kochi"
 *         latitude:
 *           type: number
 *           description: Latitude coordinate
 *           example: 9.9312
 *         longitude:
 *           type: number
 *           description: Longitude coordinate
 *           example: 76.2673
 *         contactName:
 *           type: string
 *           description: Contact person name
 *           example: "John Doe"
 *         contactEmail:
 *           type: string
 *           format: email
 *           description: Contact email address
 *           example: "john.doe@example.com"
 *         contactPhone:
 *           type: string
 *           description: Contact phone number
 *           example: "+91-9876543210"
 *         wardId:
 *           type: string
 *           description: Ward ID where complaint is located
 *           example: "ward123"
 *         subZoneId:
 *           type: string
 *           description: Sub-zone ID (optional)
 *           example: "subzone123"
 *         isAnonymous:
 *           type: boolean
 *           description: Whether to submit anonymously
 *           default: false
 *         priority:
 *           type: string
 *           enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
 *           default: "MEDIUM"
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *             format: binary
 *           description: File attachments (max 5 files, 10MB each)
 *     
 *     GuestComplaintResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             complaint:
 *               $ref: '#/components/schemas/Complaint'
 *             trackingId:
 *               type: string
 *               description: Tracking ID for the complaint
 *               example: "KSC0001"
 *             otpSent:
 *               type: boolean
 *               description: Whether OTP was sent for verification
 *     
 *     OTPVerificationRequest:
 *       type: object
 *       required:
 *         - email
 *         - otpCode
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         otpCode:
 *           type: string
 *           pattern: '^[0-9]{6}$'
 *           example: "123456"
 *     
 *     PublicStats:
 *       type: object
 *       properties:
 *         totalComplaints:
 *           type: integer
 *         resolvedComplaints:
 *           type: integer
 *         pendingComplaints:
 *           type: integer
 *         averageResolutionTime:
 *           type: number
 *           description: Average resolution time in hours
 *         wardStats:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               wardId:
 *                 type: string
 *               wardName:
 *                 type: string
 *               complaintCount:
 *                 type: integer
 *     
 *     ServiceRequest:
 *       type: object
 *       required:
 *         - serviceType
 *         - description
 *         - contactPhone
 *       properties:
 *         serviceType:
 *           type: string
 *           description: Type of service requested
 *           example: "WATER_CONNECTION"
 *         description:
 *           type: string
 *           description: Detailed description of service request
 *         contactName:
 *           type: string
 *         contactEmail:
 *           type: string
 *           format: email
 *         contactPhone:
 *           type: string
 *         address:
 *           type: string
 *         wardId:
 *           type: string
 */

// Configure multer for guest complaint file uploads
const uploadDir = process.env.UPLOAD_PATH || "./uploads";
const guestUploadDir = path.join(uploadDir, "complaints"); // Use same directory as authenticated complaints

// Ensure upload directory exists
if (!fs.existsSync(guestUploadDir)) {
  fs.mkdirSync(guestUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, guestUploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    cb(null, `${baseName}-${uniqueSuffix}${extension}`);
  },
});

// File filter for guest complaints - allow same types as authenticated complaints
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
  const fileExtension = path
    .extname(file.originalname)
    .toLowerCase()
    .substring(1);

  if (allowedTypes.test(fileExtension)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only images (JPEG, PNG, GIF) and documents (PDF, DOC, DOCX, TXT) are allowed",
      ),
      false,
    );
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5, // Max 5 files
  },
  fileFilter: fileFilter,
});

// Public guest routes

/**
 * @swagger
 * /api/guest/complaint:
 *   post:
 *     summary: Submit a guest complaint
 *     tags: [Guest]
 *     description: Submit a complaint as a guest user without authentication
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/GuestComplaintRequest'
 *           encoding:
 *             attachments:
 *               contentType: image/*, application/pdf, application/msword, text/plain
 *     responses:
 *       201:
 *         description: Complaint submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GuestComplaintResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       413:
 *         description: File too large (max 10MB per file)
 *       415:
 *         description: Unsupported file type
 */
router.post("/complaint", upload.array("attachments", 5), sanitizeInputs, validateGuestComplaintInitiation, submitGuestComplaint);
/**
 * @swagger
 * /api/guest/complaint-with-attachments:
 *   post:
 *     summary: Submit guest complaint with multiple attachments
 *     tags: [Guest]
 *     description: Submit a complaint with multiple file attachments
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/GuestComplaintRequest'
 *     responses:
 *       201:
 *         description: Complaint with attachments submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GuestComplaintResponse'
 *       400:
 *         description: Validation error
 *       413:
 *         description: File too large
 *       415:
 *         description: Unsupported file type
 */
router.post(
  "/complaint-with-attachments",
  upload.array("attachments", 5),
  sanitizeInputs,
  validateGuestComplaint,
  submitGuestComplaintWithAttachments,
);
/**
 * @swagger
 * /api/guest/verify-otp:
 *   post:
 *     summary: Verify OTP and register guest complaint
 *     tags: [Guest]
 *     description: Verify OTP sent to email and complete complaint registration
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/OTPVerificationRequest'
 *               - type: object
 *                 properties:
 *                   attachments:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: binary
 *     responses:
 *       200:
 *         description: OTP verified and complaint registered successfully
 *       400:
 *         description: Invalid or expired OTP
 *       404:
 *         description: OTP session not found
 */
router.post(
  "/verify-otp",
  guestOtpLimiter,
  upload.array("attachments", 5),
  sanitizeInputs,
  validateGuestRegistration,
  verifyOTPAndRegister,
);

/**
 * @swagger
 * /api/guest/resend-otp:
 *   post:
 *     summary: Resend OTP for guest complaint verification
 *     tags: [Guest]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       400:
 *         description: Invalid email or no pending OTP session
 *       429:
 *         description: Too many OTP requests
 */
router.post("/resend-otp", guestOtpLimiter, sanitizeInputs, validateOtpRequest, resendOTP);

/**
 * @swagger
 * /api/guest/track/{complaintId}:
 *   get:
 *     summary: Track complaint status
 *     tags: [Guest]
 *     description: Track the status of a complaint using complaint ID
 *     parameters:
 *       - in: path
 *         name: complaintId
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint tracking ID (e.g., KSC0001)
 *         example: "KSC0001"
 *     responses:
 *       200:
 *         description: Complaint details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     complaint:
 *                       $ref: '#/components/schemas/Complaint'
 *                     statusHistory:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/StatusLog'
 *       404:
 *         description: Complaint not found
 */
router.get("/track/:complaintId", validateComplaintTracking, trackComplaint);

/**
 * @swagger
 * /api/guest/stats:
 *   get:
 *     summary: Get public complaint statistics
 *     tags: [Guest]
 *     description: Retrieve public statistics about complaints and system performance
 *     responses:
 *       200:
 *         description: Public statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PublicStats'
 */
router.get("/stats", getPublicStats);

/**
 * @swagger
 * /api/guest/wards:
 *   get:
 *     summary: Get list of available wards
 *     tags: [Guest]
 *     description: Retrieve list of all active wards for complaint submission
 *     responses:
 *       200:
 *         description: Wards list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Ward'
 */
router.get("/wards", getPublicWards);

/**
 * @swagger
 * /api/guest/complaint-types:
 *   get:
 *     summary: Get available complaint types
 *     tags: [Guest]
 *     description: Retrieve list of all active complaint types
 *     responses:
 *       200:
 *         description: Complaint types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ComplaintType'
 */
router.get("/complaint-types", getPublicComplaintTypes);

// Service request routes

/**
 * @swagger
 * /api/guest/service-request:
 *   post:
 *     summary: Submit a guest service request
 *     tags: [Guest]
 *     description: Submit a service request as a guest user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceRequest'
 *     responses:
 *       201:
 *         description: Service request submitted successfully
 *       400:
 *         description: Validation error
 */
router.post("/service-request", submitGuestServiceRequest);

/**
 * @swagger
 * /api/guest/verify-service-otp:
 *   post:
 *     summary: Verify OTP for service request
 *     tags: [Guest]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OTPVerificationRequest'
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired OTP
 */
router.post("/verify-service-otp", guestOtpLimiter, verifyServiceRequestOTP);

/**
 * @swagger
 * /api/guest/track-service/{requestId}:
 *   get:
 *     summary: Track service request status
 *     tags: [Guest]
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: Service request ID
 *     responses:
 *       200:
 *         description: Service request details retrieved
 *       404:
 *         description: Service request not found
 */
router.get("/track-service/:requestId", trackServiceRequest);

/**
 * @swagger
 * /api/guest/service-types:
 *   get:
 *     summary: Get available service types
 *     tags: [Guest]
 *     description: Retrieve list of all available service types
 *     responses:
 *       200:
 *         description: Service types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 */
router.get("/service-types", getServiceTypes);

/**
 * @swagger
 * /api/guest/files/{filename}:
 *   get:
 *     summary: Serve uploaded guest files
 *     tags: [Guest]
 *     description: Retrieve uploaded files from guest complaints
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the uploaded file
 *     responses:
 *       200:
 *         description: File served successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: File not found
 */
// Serve uploaded guest files
router.get("/files/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(guestUploadDir, filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: "File not found",
    });
  }

  // Set appropriate headers
  res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
  res.sendFile(path.resolve(filePath));
});

export default router;
