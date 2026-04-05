import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { adminUser } from "../data/adminUser.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

function buildTokenPayload() {
  return {
    id: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
  };
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (email.toLowerCase() !== adminUser.email.toLowerCase()) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(password, adminUser.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(buildTokenPayload(), process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("admin_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.json({
      message: "Login successful",
      user: buildTokenPayload(),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error during login" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("admin_token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return res.json({ message: "Logged out" });
});

router.get("/me", requireAuth, (req, res) => {
  return res.json({
    user: req.user,
  });
});

export default router;