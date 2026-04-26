const express = require("express");
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");
const Report = require("../models/Report");


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

// POST /api/reports (user id from body; session via localStorage on client)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { title, description, category, latitude, longitude, userId } = req.body;

    if (!title || !description || !category || latitude === undefined || longitude === undefined || !userId) {
      return res.status(400).json({
        message: "All required fields must be provided (including location and userId)"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ message: "Latitude and longitude must be valid numbers" });
    }

    const report = await Report.create({
      user: userId,
      title,
      description,
      category,
      image: req.file ? `/uploads/${req.file.filename}` : "",
      location: {
        type: "Point",
        coordinates: [lng, lat]
      },
      status: "Submitted"
    });

    return res.status(201).json({ message: "Report created successfully", report });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET /api/reports (admin)
router.get("/", async (req, res) => {
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
router.patch("/:id/status", async (req, res) => {
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
router.delete("/:id", async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
