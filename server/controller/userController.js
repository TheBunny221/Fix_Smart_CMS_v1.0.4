import { getPrisma } from "../db/connection.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { sendEmail, sendPasswordSetupEmail } from "../utils/emailService.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = getPrisma();

// Helper function to hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin)
export const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role, wardId, isActive, search } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const filters = {};

  // Apply filters
  if (role) filters.role = role;
  if (wardId) filters.wardId = wardId;
  if (isActive !== undefined) filters.isActive = isActive === "true";

  // Search filter
  // Note: SQLite doesn't support mode: "insensitive". Using case-sensitive search for compatibility.
  if (search) {
    filters.OR = [
      { fullName: { contains: search } },
      { email: { contains: search } },
      { phoneNumber: { contains: search } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: filters,
      skip,
      take: parseInt(limit),
      orderBy: { joinedOn: "desc" },
      include: {
        ward: true,
        _count: {
          select: {
            submittedComplaints: true,
            assignedComplaints: true,
          },
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        wardId: true,
        department: true,
        language: true,
        avatar: true,
        isActive: true,
        lastLogin: true,
        joinedOn: true,
        ward: true,
        _count: true,
      },
    }),
    prisma.user.count({ where: filters }),
  ]);

  res.status(200).json({
    success: true,
    message: "Users retrieved successfully",
    data: {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1,
      },
    },
  });
});

// @desc    Get single user (Admin only)
// @route   GET /api/users/:id
// @access  Private (Admin)
export const getUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      ward: true,
      submittedComplaints: {
        orderBy: { submittedOn: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          type: true,
          submittedOn: true,
        },
      },
      assignedComplaints: {
        orderBy: { assignedOn: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          type: true,
          assignedOn: true,
        },
      },
      _count: {
        select: {
          submittedComplaints: true,
          assignedComplaints: true,
          notifications: true,
        },
      },
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      role: true,
      wardId: true,
      department: true,
      language: true,
      avatar: true,
      isActive: true,
      lastLogin: true,
      joinedOn: true,
      ward: true,
      submittedComplaints: true,
      assignedComplaints: true,
      _count: true,
    },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      data: null,
    });
  }

  res.status(200).json({
    success: true,
    message: "User retrieved successfully",
    data: { user },
  });
});

// @desc    Create user (Admin only)
// @route   POST /api/users
// @access  Private (Admin)
export const createUser = asyncHandler(async (req, res) => {
  const { fullName, email, phoneNumber, role, wardId, department, password } =
    req.body;

  // Basic validation - return structured errors
  const validationErrors = {};
  if (!fullName || String(fullName).trim().length < 3) {
    validationErrors.fullName = "Full name must be at least 3 characters.";
  }
  if (!email) {
    validationErrors.email = "Email is required.";
  }
  if (!role) {
    validationErrors.role = "Role is required.";
  }

  if (Object.keys(validationErrors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: validationErrors,
      data: null,
    });
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "User already exists with this email",
      errors: { email: "User already exists with this email" },
      data: null,
    });
  }

  let hashedPassword = null;
  let sendVerificationEmail = false;

  // Handle password based on role
  if (role === "CITIZEN" && password) {
    hashedPassword = await hashPassword(password);
  } else if (["WARD_OFFICER", "MAINTENANCE_TEAM"].includes(role)) {
    // For ward officers and maintenance team, send verification email
    sendVerificationEmail = true;
  } else if (role === "ADMINISTRATOR" && password) {
    hashedPassword = await hashPassword(password);
  }

  const userData = {
    fullName,
    email,
    phoneNumber,
    role,
    isActive: true,
    joinedOn: new Date(),
  };

  if (hashedPassword) {
    userData.password = hashedPassword;
  }

  if (wardId) {
    userData.wardId = wardId;
  }

  if (department) {
    userData.department = department;
  }

  const user = await prisma.user.create({
    data: userData,
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      role: true,
      wardId: true,
      department: true,
      language: true,
      avatar: true,
      isActive: true,
      lastLogin: true,
      joinedOn: true,
      ward: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  });

  // Send verification email for ward officers and maintenance team
  if (sendVerificationEmail) {
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const resetPasswordExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store reset token in password field temporarily
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: JSON.stringify({
          resetPasswordToken,
          resetPasswordExpire: resetPasswordExpire.toISOString(),
          isVerificationToken: true,
        }),
      },
    });

    const resetUrl = `${process.env.CLIENT_URL}/verify-account/${resetToken}`;

    const emailSent = await sendEmail({
      to: user.email,
      subject: "Account Verification - NLC-CMS",
      text: `Your account has been created. Please verify your account and set your password by clicking: ${resetUrl}`,
      html: `
        <h2>Account Created - Verification Required</h2>
        <p>Hello ${user.fullName},</p>
        <p>Your account has been created for NLC-CMS E-Governance Portal as a ${role.replace("_", " ").toLowerCase()}.</p>
        <p>Please click the link below to verify your account and set your password:</p>
        <a href="${resetUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Account</a>
        <p>This link will expire in 24 hours.</p>
        <p>If you cannot click the button, copy and paste this link: ${resetUrl}</p>
      `,
    });

    if (!emailSent) {
      // Delete user if email fails
      await prisma.user.delete({ where: { id: user.id } });
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. User creation cancelled.",
        data: null,
      });
    }
  }

  res.status(201).json({
    success: true,
    message: sendVerificationEmail
      ? "User created successfully. Verification email sent."
      : "User created successfully",
    data: { user },
  });
});

// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
// @access  Private (Admin)
export const updateUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const allowedFields = [
    "fullName",
    "phoneNumber",
    "role",
    "wardId",
    "department",
    "isActive",
    "language",
  ];

  const updates = {};
  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const user = await prisma.user.update({
    where: { id: userId },
    data: updates,
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      role: true,
      wardId: true,
      department: true,
      language: true,
      avatar: true,
      isActive: true,
      lastLogin: true,
      joinedOn: true,
      ward: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: { user },
  });
});

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin)
export const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      data: null,
    });
  }

  // Don't allow deleting the last admin
  if (user.role === "ADMINISTRATOR") {
    const adminCount = await prisma.user.count({
      where: { role: "ADMINISTRATOR", isActive: true },
    });

    if (adminCount <= 1) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete the last administrator",
        data: null,
      });
    }
  }

  // Soft delete (deactivate) instead of hard delete to preserve data integrity
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });

  res.status(200).json({
    success: true,
    message: "User deactivated successfully",
    data: null,
  });
});

// @desc    Get user statistics (Admin only)
// @route   GET /api/users/stats
// @access  Private (Admin)
export const getUserStats = asyncHandler(async (req, res) => {
  const [totalUsers, activeUsers, roleDistribution, recentRegistrations] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.groupBy({
        by: ["role"],
        _count: { role: true },
      }),
      prisma.user.count({
        where: {
          joinedOn: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    ]);

  const stats = {
    total: totalUsers,
    active: activeUsers,
    inactive: totalUsers - activeUsers,
    recentRegistrations,
    byRole: roleDistribution.reduce((acc, item) => {
      acc[item.role] = item._count.role;
      return acc;
    }, {}),
  };

  res.status(200).json({
    success: true,
    message: "User statistics retrieved successfully",
    data: { stats },
  });
});

// @desc    Verify account (Ward Officer/Maintenance Team)
// @route   POST /api/users/verify-account/:token
// @access  Public
export const verifyAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  // Get hashed token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  // Find user with valid verification token
  const users = await prisma.user.findMany({
    where: {
      password: {
        contains: resetPasswordToken,
      },
    },
  });

  const user = users.find((u) => {
    try {
      if (!u.password) return false;
      const resetData = JSON.parse(u.password);
      return (
        resetData.resetPasswordToken === resetPasswordToken &&
        new Date(resetData.resetPasswordExpire) > new Date() &&
        resetData.isVerificationToken === true
      );
    } catch {
      return false;
    }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired verification token",
      data: null,
    });
  }

  // Hash new password
  const hashedPassword = await hashPassword(password);

  // Update user with new password and activate account
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      role: true,
      wardId: true,
      department: true,
      language: true,
      avatar: true,
      isActive: true,
      lastLogin: true,
      joinedOn: true,
      ward: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    message: "Account verified and password set successfully",
    data: { user: updatedUser },
  });
});

// @desc    Get wards (for dropdown/selection)
// @route   GET /api/users/wards
// @access  Public (GET only, mutations require authentication)
export const getWards = asyncHandler(async (req, res) => {
  console.log("🏛️ getWards called (public endpoint) - fetching wards from database...");
  
  const { include, all } = req.query;
  console.log("🔍 Query params received:", { include, all });

  const includeSubZones = include === "subzones";
  const fetchAll = all === "true";
  
  console.log("🔍 Computed flags:", { includeSubZones, fetchAll });

  try {
    const queryConfig = {
      where: fetchAll ? {} : { isActive: true },
      orderBy: { name: "asc" },
      ...(includeSubZones
        ? {
            include: {
              subZones: {
                where: { isActive: true },
                orderBy: { name: "asc" },
              },
            },
          }
        : {
            select: {
              id: true,
              name: true,
              description: true,
              isActive: true,
            },
          }),
    };
    
    console.log("🔍 Prisma query config:", JSON.stringify(queryConfig, null, 2));
    
    const wards = await prisma.ward.findMany(queryConfig);

    console.log(`✅ Found ${wards.length} wards in database`);
    console.log("🔍 First ward from DB:", wards[0]);
    console.log("🔍 First ward subZones from DB:", wards[0]?.subZones);
    
    const response = {
      success: true,
      message: "Wards retrieved successfully",
      data: { wards },
    };
    
    console.log("🔍 Sending response structure:", {
      success: response.success,
      message: response.message,
      dataType: typeof response.data,
      wardsCount: response.data.wards.length,
      firstWardHasSubZones: !!response.data.wards[0]?.subZones
    });

    res.status(200).json(response);
  } catch (error) {
    console.error("❌ Error in getWards:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve wards",
      error: error.message,
    });
  }
});

// @desc    Get officers (for dropdown/selection)
// @route   GET /api/users/officers
// @access  Private
export const getOfficers = asyncHandler(async (req, res) => {
  const { role, wardId, all } = req.query;

  const fetchAll = all === "true";
  const where = {};

  // Filter by active status unless explicitly requesting all
  if (!fetchAll) {
    where.isActive = true;
  }

  // Filter by role if specified
  if (role) {
    where.role = role;
  }

  // Filter by ward if specified
  if (wardId) {
    where.wardId = wardId;
  }

  // Default to officer roles if no specific role is requested
  if (!role) {
    where.role = {
      in: ["WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"]
    };
  }

  const officers = await prisma.user.findMany({
    where,
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      wardId: true,
      isActive: true,
      ward: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    message: "Officers retrieved successfully",
    data: { officers },
  });
});

// @desc    Create ward (Admin only)
// @route   POST /api/users/wards
// @access  Private (Admin)
export const createWard = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const existingWard = await prisma.ward.findUnique({
    where: { name },
  });

  if (existingWard) {
    return res.status(400).json({
      success: false,
      message: "Ward with this name already exists",
      data: null,
    });
  }

  const ward = await prisma.ward.create({
    data: {
      name,
      description,
      isActive: true,
    },
  });

  res.status(201).json({
    success: true,
    message: "Ward created successfully",
    data: { ward },
  });
});

// @desc    Update ward (Admin only)
// @route   PUT /api/users/wards/:id
// @access  Private (Admin)
export const updateWard = asyncHandler(async (req, res) => {
  const { name, description, isActive } = req.body;
  const wardId = req.params.id;

  const ward = await prisma.ward.update({
    where: { id: wardId },
    data: {
      name,
      description,
      isActive,
    },
  });

  res.status(200).json({
    success: true,
    message: "Ward updated successfully",
    data: { ward },
  });
});

// @desc    Delete ward (Admin only)
// @route   DELETE /api/users/wards/:id
// @access  Private (Admin)
export const deleteWard = asyncHandler(async (req, res) => {
  const wardId = req.params.id;

  // Check if ward exists
  const ward = await prisma.ward.findUnique({
    where: { id: wardId },
  });

  if (!ward) {
    return res.status(404).json({
      success: false,
      message: "Ward not found",
    });
  }

  // Check if ward has any users assigned to it
  const usersInWard = await prisma.user.count({
    where: { wardId: wardId },
  });

  if (usersInWard > 0) {
    return res.status(400).json({
      success: false,
      message: "Cannot delete ward. There are users assigned to this ward.",
    });
  }

  // Check if ward has any complaints
  const complaintsInWard = await prisma.complaint.count({
    where: { wardId: wardId },
  });

  if (complaintsInWard > 0) {
    return res.status(400).json({
      success: false,
      message:
        "Cannot delete ward. There are complaints assigned to this ward.",
    });
  }

  // Delete the ward
  await prisma.ward.delete({
    where: { id: wardId },
  });

  res.status(200).json({
    success: true,
    message: "Ward deleted successfully",
  });
});

// @desc    Create sub-zone (Admin only)
// @route   POST /api/users/wards/:wardId/subzones
// @access  Private (Admin)
export const createSubZone = asyncHandler(async (req, res) => {
  const { name, description, isActive = true } = req.body;
  const wardId = req.params.wardId;

  // Check if ward exists
  const ward = await prisma.ward.findUnique({
    where: { id: wardId },
  });

  if (!ward) {
    return res.status(404).json({
      success: false,
      message: "Ward not found",
    });
  }

  // Check if sub-zone name already exists in this ward
  const existingSubZone = await prisma.subZone.findFirst({
    where: {
      name,
      wardId,
    },
  });

  if (existingSubZone) {
    return res.status(400).json({
      success: false,
      message: "Sub-zone name already exists in this ward",
    });
  }

  const subZone = await prisma.subZone.create({
    data: {
      name,
      description,
      wardId,
      isActive,
    },
  });

  res.status(201).json({
    success: true,
    message: "Sub-zone created successfully",
    data: subZone,
  });
});

// @desc    Update sub-zone (Admin only)
// @route   PUT /api/users/wards/:wardId/subzones/:id
// @access  Private (Admin)
export const updateSubZone = asyncHandler(async (req, res) => {
  const { name, description, isActive } = req.body;
  const { wardId, id: subZoneId } = req.params;

  // Check if ward exists
  const ward = await prisma.ward.findUnique({
    where: { id: wardId },
  });

  if (!ward) {
    return res.status(404).json({
      success: false,
      message: "Ward not found",
    });
  }

  // Check if sub-zone exists and belongs to the ward
  const existingSubZone = await prisma.subZone.findUnique({
    where: { id: subZoneId },
  });

  if (!existingSubZone) {
    return res.status(404).json({
      success: false,
      message: "Sub-zone not found",
    });
  }

  if (existingSubZone.wardId !== wardId) {
    return res.status(400).json({
      success: false,
      message: "Sub-zone does not belong to this ward",
    });
  }

  const subZone = await prisma.subZone.update({
    where: { id: subZoneId },
    data: {
      name,
      description,
      isActive,
    },
  });

  res.status(200).json({
    success: true,
    message: "Sub-zone updated successfully",
    data: subZone,
  });
});

// @desc    Delete sub-zone (Admin only)
// @route   DELETE /api/users/wards/:wardId/subzones/:id
// @access  Private (Admin)
export const deleteSubZone = asyncHandler(async (req, res) => {
  const { wardId, id: subZoneId } = req.params;

  // Check if ward exists
  const ward = await prisma.ward.findUnique({
    where: { id: wardId },
  });

  if (!ward) {
    return res.status(404).json({
      success: false,
      message: "Ward not found",
    });
  }

  // Check if sub-zone exists and belongs to the ward
  const subZone = await prisma.subZone.findUnique({
    where: { id: subZoneId },
  });

  if (!subZone) {
    return res.status(404).json({
      success: false,
      message: "Sub-zone not found",
    });
  }

  if (subZone.wardId !== wardId) {
    return res.status(400).json({
      success: false,
      message: "Sub-zone does not belong to this ward",
    });
  }

  // Check if sub-zone has any complaints
  const complaintsInSubZone = await prisma.complaint.count({
    where: { subZoneId: subZoneId },
  });

  if (complaintsInSubZone > 0) {
    return res.status(400).json({
      success: false,
      message:
        "Cannot delete sub-zone. There are complaints assigned to this sub-zone.",
    });
  }

  // Delete the sub-zone
  await prisma.subZone.delete({
    where: { id: subZoneId },
  });

  res.status(200).json({
    success: true,
    message: "Sub-zone deleted successfully",
  });
});

// Helper function to validate password strength
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!hasLowerCase) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!hasNumbers) {
    errors.push("Password must contain at least one number");
  }
  if (!hasSpecialChar) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// @desc    Change password (Authenticated users)
// @route   POST /api/users/change-password
// @access  Private
export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const userId = req.user.id;

  // Validation
  if (!oldPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({
      status: "error",
      code: 400,
      message: "All fields are required",
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      status: "error",
      code: 400,
      message: "New password and confirm password do not match",
    });
  }

  // Validate password strength
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      status: "error",
      code: 400,
      message: "Password does not meet security requirements",
      errors: passwordValidation.errors,
    });
  }

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      password: true,
    },
  });

  if (!user) {
    return res.status(404).json({
      status: "error",
      code: 404,
      message: "User not found",
    });
  }

  // Check if user has a valid password (not a JSON object from verification flow)
  let isValidCurrentPassword = false;
  try {
    if (user.password && typeof user.password === 'string') {
      // Try to parse as JSON - if it succeeds, it's a verification token
      JSON.parse(user.password);
      // If we reach here, it's a JSON object (verification token)
      isValidCurrentPassword = false;
    } else {
      isValidCurrentPassword = true;
    }
  } catch {
    // If JSON.parse fails, it's a regular hashed password
    isValidCurrentPassword = true;
  }

  if (!isValidCurrentPassword) {
    return res.status(400).json({
      status: "error",
      code: 400,
      message: "Account not yet verified. Please complete account verification first.",
    });
  }

  // Verify old password
  const isOldPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
  if (!isOldPasswordCorrect) {
    return res.status(401).json({
      status: "error",
      code: 401,
      message: "Incorrect current password",
    });
  }

  // Hash new password
  const hashedNewPassword = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword },
  });

  res.status(200).json({
    status: "success",
    code: 200,
    message: "Password updated successfully",
  });
});
// @desc    Send OTP for password setting (for users without password)
// @route   POST /api/user/send-otp
// @access  Private
export const sendPasswordSetupOTP = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get user details
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      password: true,
      isActive: true,
    },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      data: null,
    });
  }

  if (!user.isActive) {
    return res.status(400).json({
      success: false,
      message: "Account is deactivated. Please contact support.",
      data: null,
    });
  }

  // Check if user already has a password set
  let hasValidPassword = false;
  try {
    if (user.password && typeof user.password === 'string') {
      // Try to parse as JSON - if it succeeds, it's a verification token, not a password
      JSON.parse(user.password);
      hasValidPassword = false;
    } else if (user.password) {
      hasValidPassword = true;
    }
  } catch {
    // If JSON.parse fails, it's a regular hashed password
    hasValidPassword = !!user.password;
  }

  if (hasValidPassword) {
    return res.status(400).json({
      success: false,
      message: "Password already set. Use change password instead.",
      data: null,
    });
  }

  // Invalidate existing password setup OTP sessions
  await prisma.oTPSession.updateMany({
    where: {
      email: user.email,
      purpose: "PASSWORD_SETUP",
      isVerified: false,
    },
    data: {
      expiresAt: new Date(), // Expire immediately
    },
  });

  // Generate new OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Create new OTP session
  await prisma.oTPSession.create({
    data: {
      userId: user.id,
      email: user.email,
      otpCode,
      purpose: "PASSWORD_SETUP",
      expiresAt,
    },
  });

  // Send OTP email using existing mail service
  try {
    const { sendOTPEmail } = await import("../utils/emailService.js");
    const emailSent = await sendOTPEmail(user.email, otpCode, {
      purpose: "password_setup",
      fullName: user.fullName,
    });

    if (!emailSent) {
      throw new Error("Email service failed");
    }

    res.status(200).json({
      success: true,
      message: "OTP sent to your email for password setup",
      data: {
        email: user.email,
        expiresAt,
      },
    });
  } catch (error) {
    // Clean up the OTP session if email fails
    await prisma.oTPSession.updateMany({
      where: {
        email: user.email,
        purpose: "PASSWORD_SETUP",
        otpCode,
      },
      data: {
        expiresAt: new Date(),
      },
    });

    res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again.",
      data: null,
    });
  }
});

// @desc    Verify OTP for password setting
// @route   POST /api/user/verify-otp
// @access  Private
export const verifyPasswordSetupOTP = asyncHandler(async (req, res) => {
  const { otpCode } = req.body;
  const userId = req.user.id;

  if (!otpCode) {
    return res.status(400).json({
      success: false,
      message: "OTP code is required",
      data: null,
    });
  }

  // Get user details
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      isActive: true,
    },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      data: null,
    });
  }

  if (!user.isActive) {
    return res.status(400).json({
      success: false,
      message: "Account is deactivated. Please contact support.",
      data: null,
    });
  }

  // Find valid OTP session
  const otpSession = await prisma.oTPSession.findFirst({
    where: {
      email: user.email,
      otpCode,
      purpose: "PASSWORD_SETUP",
      isVerified: false,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!otpSession) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired OTP",
      data: null,
    });
  }

  // Mark OTP as verified
  await prisma.oTPSession.update({
    where: { id: otpSession.id },
    data: {
      isVerified: true,
      verifiedAt: new Date(),
    },
  });

  res.status(200).json({
    success: true,
    message: "OTP verified successfully",
    data: {
      email: user.email,
      verified: true,
    },
  });
});

// @desc    Set password after OTP verification
// @route   POST /api/user/set-password
// @access  Private
export const setPasswordAfterOTP = asyncHandler(async (req, res) => {
  const { password, confirmPassword } = req.body;
  const userId = req.user.id;

  if (!password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "Password and confirm password are required",
      data: null,
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "Passwords do not match",
      data: null,
    });
  }

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: "Password does not meet security requirements",
      data: {
        errors: passwordValidation.errors,
      },
    });
  }

  // Get user details
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      password: true,
      isActive: true,
    },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      data: null,
    });
  }

  if (!user.isActive) {
    return res.status(400).json({
      success: false,
      message: "Account is deactivated. Please contact support.",
      data: null,
    });
  }

  // Check if user already has a password set
  let hasValidPassword = false;
  try {
    if (user.password && typeof user.password === 'string') {
      // Try to parse as JSON - if it succeeds, it's a verification token, not a password
      JSON.parse(user.password);
      hasValidPassword = false;
    } else if (user.password) {
      hasValidPassword = true;
    }
  } catch {
    // If JSON.parse fails, it's a regular hashed password
    hasValidPassword = !!user.password;
  }

  if (hasValidPassword) {
    return res.status(400).json({
      success: false,
      message: "Password already set. Use change password instead.",
      data: null,
    });
  }

  // Find verified OTP session (within last 30 minutes)
  const verifiedOTPSession = await prisma.oTPSession.findFirst({
    where: {
      email: user.email,
      purpose: "PASSWORD_SETUP",
      isVerified: true,
      verifiedAt: {
        gt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes
      },
    },
    orderBy: {
      verifiedAt: "desc",
    },
  });

  if (!verifiedOTPSession) {
    return res.status(400).json({
      success: false,
      message: "OTP verification required or expired. Please request a new OTP.",
      data: null,
    });
  }

  // Hash new password
  const hashedPassword = await hashPassword(password);

  // Update user password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  // Invalidate all password setup OTP sessions for this user
  await prisma.oTPSession.updateMany({
    where: {
      email: user.email,
      purpose: "PASSWORD_SETUP",
    },
    data: {
      expiresAt: new Date(), // Expire immediately
    },
  });

  // Send confirmation email
  try {
    const { sendPasswordResetSuccessEmail } = await import("../utils/mailService.js");
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
    await sendPasswordResetSuccessEmail(
      user.email,
      user.fullName,
      ipAddress
    );
  } catch (emailError) {
    // Don't fail the request if email fails
    console.error("Failed to send password setup confirmation email:", emailError);
  }

  res.status(200).json({
    success: true,
    message: "Password set successfully",
    data: {
      hasPassword: true,
    },
  });
});