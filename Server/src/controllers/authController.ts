
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User";
import RefreshSession from "../models/RefreshSession";
import { signToken } from "../utils/jwt";
import { sendEmail } from "../utils/mail";
import { AuthRequest } from "../middlewares/auth";
import Settings from "../models/Settings";

const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 30);

const REFRESH_COOKIE = "pcare_refresh_token";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function sendVerificationEmail(user: InstanceType<typeof User>, rawToken: string) {
  const backendUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 4000}`;
  const verificationUrl =
    `${backendUrl.replace(/\/$/, "")}/api/auth/verify-email?token=${encodeURIComponent(rawToken)}`;
  const settings = await Settings.findOne().select("whatsapp_number");
  const whatsappNumber = settings?.whatsapp_number?.replace(/[^\d]/g, "");
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}` : "";
  await sendEmail({
    to: user.email,
    subject: "P.C. Care Sagar - Verify your email",
    text: [
      `Hello ${user.name},`,
      "",
      `Verify your email address: ${verificationUrl}`,
      "This link expires in 24 hours.",
      whatsappLink ? `Contact us on WhatsApp: ${whatsappLink}` : "",
    ].filter(Boolean).join("\n"),
  });
}

export async function createEmailVerification(user: InstanceType<typeof User>) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  user.emailVerificationToken = hashToken(rawToken);
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();
  await sendVerificationEmail(user, rawToken);
}

function refreshExpiry() {
  return new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: REFRESH_DAYS * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
  });
}

function publicUser(user: any) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    phone: user.phone,
    company: user.company,
    createdAt: user.createdAt,
  };
}

async function createSession(req: Request, res: Response, user: any) {
  const refreshToken = crypto.randomBytes(48).toString("hex");

  const session = await RefreshSession.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: refreshExpiry(),
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip,
  });

  const accessToken = signToken({
    userId: user._id.toString(),
    sessionId: session.id,
  });

  setRefreshCookie(res, refreshToken);

  return accessToken;
}

export async function register(req: Request, res: Response) {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").toLowerCase().trim();
    const password = String(req.body.password || "");

    if (!name || !email || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Name, valid email and password of at least 8 characters are required",
      });
    }

    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email already in use",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Public registration always creates a customer.
    // Admin, seller and technician roles must be assigned by an admin.
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "customer",
      isActive: true,
    });

    try {
      await createEmailVerification(user);
    } catch (error) {
      console.error("Could not send email verification:", error);
      return res.status(503).json({
        success: false,
        message: "Account created, but verification email could not be sent. Please request a new email.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Registration successful. Verify your email before logging in.",
      data: {
        user: publicUser(user),
      },
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already in use",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    const password = String(req.body.password || "");

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is deactivated",
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    const accessToken = await createSession(req, res, user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: publicUser(user),
        accessToken,
      },
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
}

export async function verifyEmail(req: Request, res: Response) {
    try {
      const rawToken = String(req.query.token || req.body.token || "");
      if (!rawToken) {
        return res.status(400).json({ success: false, message: "Verification token is required" });
      }
      const user = await User.findOne({
        emailVerificationToken: hashToken(rawToken),
        emailVerificationExpires: { $gt: new Date() },
      }).select("+emailVerificationToken +emailVerificationExpires");
      if (!user) {
        return res.status(400).json({ success: false, message: "Verification link is invalid or expired" });
      }
      user.emailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      const settings = await Settings.findOne().select("company_name whatsapp_number");
      const whatsappNumber = settings?.whatsapp_number?.replace(/[^\d]/g, "");
      const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}` : "";
      try {
        await sendEmail({
          to: user.email,
          subject: "Welcome to P.C. Care Sagar",
          text: [
            `Hello ${user.name},`,
            "",
            "Your email has been verified. Welcome to P.C. Care Sagar!",
            "If you do not have a password yet, request a password reset from the sign-in page.",
            whatsappLink ? `Contact us on WhatsApp: ${whatsappLink}` : "",
          ].filter(Boolean).join("\n"),
        });
      } catch (error) {
        console.error("Welcome email could not be sent:", error);
      }

      return res.status(200).json({
        success: true,
        message: "Email verified. You can now log in.",
        data: { email: user.email, emailVerified: true },
      });
    } catch (error) {
      console.error("Email verification failed:", error);
      return res.status(500).json({ success: false, message: "Email verification failed" });
    }
  }

export async function resendVerificationEmail(req: Request, res: Response) {
    const response = {
      success: true,
      message: "If the account needs verification, a new email will be sent",
    };
    const email = String(req.body.email || "").toLowerCase().trim();
    const user = await User.findOne({ email, isActive: true });
    if (!user || user.emailVerified) return res.status(200).json(response);
    try {
      await createEmailVerification(user);
    } catch (error) {
      console.error("Could not resend email verification:", error);
      return res.status(503).json({ success: false, message: "Verification email could not be sent" });
    }
    return res.status(200).json(response);
}

export async function refreshToken(req: Request, res: Response) {
  try {
    const oldToken = req.cookies?.[REFRESH_COOKIE];

    if (!oldToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    const oldHash = hashToken(oldToken);

    const oldSession = await RefreshSession.findOne({
      tokenHash: oldHash,
    });

    if (!oldSession) {
      clearRefreshCookie(res);
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    if (oldSession.revokedAt || oldSession.expiresAt <= new Date()) {
      // Reuse of a rotated/revoked token revokes remaining sessions
      // for that user as a precaution.
      if (oldSession.revokedAt) {
        await RefreshSession.updateMany(
          { userId: oldSession.userId, revokedAt: null },
          { $set: { revokedAt: new Date() } }
        );
      }

      clearRefreshCookie(res);

      return res.status(401).json({
        success: false,
        message: "Refresh token expired or revoked",
      });
    }

    const user = await User.findById(oldSession.userId);

    if (!user || !user.isActive) {
      oldSession.revokedAt = new Date();
      await oldSession.save();
      clearRefreshCookie(res);

      return res.status(403).json({
        success: false,
        message: "Account is unavailable",
      });
    }

    const newRefreshToken = crypto.randomBytes(48).toString("hex");
    const newHash = hashToken(newRefreshToken);

    const newSession = await RefreshSession.create({
      userId: user._id,
      tokenHash: newHash,
      expiresAt: refreshExpiry(),
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    oldSession.revokedAt = new Date();
    oldSession.replacedByTokenHash = newHash;
    await oldSession.save();

    const accessToken = signToken({
      userId: user._id.toString(),
      sessionId: newSession.id,
    });

    setRefreshCookie(res, newRefreshToken);

    return res.status(200).json({
      success: true,
      data: { accessToken },
    });
  } catch {
    clearRefreshCookie(res);
    return res.status(401).json({
      success: false,
      message: "Unable to refresh session",
    });
  }
}

export async function logout(req: AuthRequest, res: Response) {
  try {
    if (req.sessionId) {
      await RefreshSession.findByIdAndUpdate(req.sessionId, {
        revokedAt: new Date(),
      });
    }

    clearRefreshCookie(res);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
}

export async function logoutAll(req: AuthRequest, res: Response) {
  try {
    await RefreshSession.updateMany(
      { userId: req.user?._id, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );

    clearRefreshCookie(res);

    return res.status(200).json({
      success: true,
      message: "All sessions logged out successfully",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();

    const user = await User.findOne({ email });

    // Same response whether the account exists or not.
    const response = {
      success: true,
      message: "If an account exists, a password reset email will be sent",
    };

    if (!user || !user.isActive) {
      return res.status(200).json(response);
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = hashToken(rawToken);

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      throw new Error("FRONTEND_URL is not configured");
    }

    const resetUrl =
      `${frontendUrl.replace(/\/$/, "")}/reset-password?token=${rawToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "P.C. Care Sagar - Password Reset",
        text: `Use this link to reset your password. It expires in 15 minutes: ${resetUrl}`,
        html: `
          <h2>Password Reset</h2>
          <p>We received a request to reset your password.</p>
          <p><a href="${resetUrl}">Reset Password</a></p>
          <p>This link expires in 15 minutes.</p>
          <p>If you did not request this, ignore this email.</p>
        `,
      });
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      throw error;
    }

    return res.status(200).json(response);
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to process password reset request",
    });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const token = String(req.body.token || "");
    const password = String(req.body.password || "");

    if (!token || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "A valid token and password of at least 8 characters are required",
      });
    }

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    user.password = await bcrypt.hash(password, 12);
    user.passwordChangedAt = new Date();
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    await RefreshSession.updateMany(
      { userId: user._id, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );

    return res.status(200).json({
      success: true,
      message: "Password reset successful. Please log in again.",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Password reset failed",
    });
  }
}

export async function changePassword(req: AuthRequest, res: Response) {
  try {
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must contain at least 8 characters",
      });
    }

    const user = await User.findById(req.user?._id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordChangedAt = new Date();

    await user.save();

    await RefreshSession.updateMany(
      { userId: user._id, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );

    clearRefreshCookie(res);

    return res.status(200).json({
      success: true,
      message: "Password changed successfully. Please log in again.",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Password change failed",
    });
  }
}

export async function me(req: AuthRequest, res: Response) {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user ? publicUser(req.user) : null,
    },
  });
}
