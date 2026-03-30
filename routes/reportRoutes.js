const express = require("express");
const multer = require("multer");
const path = require("path");
const Report = require("../models/Report");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Configure multer storage for local uploads folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// POST /api/reports (protected)
router.post("/", protect, upload.single("image"), async (req, res) => {
  try {
    const { title, description, category, latitude, longitude } = req.body;

    if (!title || !description || !category || !latitude || !longitude) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    const report = await Report.create({
      user: req.user.id,
      title,
      description,
      category,
      image: req.file ? `/uploads/${req.file.filename}` : "",
      location: {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)]
      },
      status: "Submitted"
    });

    return res.status(201).json({ message: "Report created successfully", report });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET /api/reports/my (user)
router.get("/my", protect, async (req, res) => {
  try {
    const reports = await Report.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.json(reports);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET /api/reports (admin)
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    return res.json(reports);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// PATCH /api/reports/:id/status (admin)
router.patch("/:id/status", protect, authorize("admin"), async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["Submitted", "In Progress", "Resolved"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedReport) {
      return res.status(404).json({ message: "Report not found" });
    }

    return res.json({ message: "Report status updated", report: updatedReport });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
