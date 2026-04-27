const organization = require("../models/organization");
const express = require("express");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
 // ✅ IMPORTANT

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, organizationName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let orgId = null;

    // 🔥 If registering as organization
    if (role === "organization") {
      if (!organizationName) {
        return res.status(400).json({ message: "Organization name required" });
      }

      // Check if org exists
      let org = await organization.findOne({ name: organizationName });

      // If not → create it
      if (!org) {
        org = await organization.create({ name: organizationName });
      }

      orgId = org._id;
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
      organization: orgId
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization
      }
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization // 🔥 IMPORTANT
      }
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;