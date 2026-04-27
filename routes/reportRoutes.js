const organization = require("../models/organization");
const express = require("express");
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");
const Report = require("../models/Report");


const router = express.Router();

// ================= MULTER CONFIG =================
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

// ================= CREATE REPORT =================
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { title, description, category, latitude, longitude, userId } = req.body;

    if (!title || !description || !category || latitude === undefined || longitude === undefined || !userId) {
      return res.status(400).json({
        message: "All required fields must be provided"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

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
      status: "Submitted",
      updates: [
        { message: "Report submitted" }
      ]
    });

    res.status(201).json({ report });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= GET REPORTS =================
// supports ?orgId= for NGO dashboard
router.get("/", async (req, res) => {
  try {
    const { orgId } = req.query;

    let query = {};

    if (orgId && mongoose.Types.ObjectId.isValid(orgId)) {
      query.assignedTo = orgId;
    }

    const reports = await Report.find(query)
      .populate("user", "name email")
      .populate("assignedTo", "name")
      .sort({ createdAt: -1 });

    res.json(reports);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= UPDATE STATUS =================
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["Submitted", "In Progress", "Resolved"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    report.status = status;

    // 🔔 notification
    report.updates.push({
      message: `Status updated to ${status}`
    });

    await report.save();

    res.json({ report });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= ASSIGN ORGANIZATION =================
router.patch("/:id/assign", async (req, res) => {
  try {
    const { assignedTo } = req.body;

    if (assignedTo && !mongoose.Types.ObjectId.isValid(assignedTo)) {
      return res.status(400).json({ message: "Invalid organization id" });
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    report.assignedTo = assignedTo || null;

    // 🔔 notification
    report.updates.push({
      message: "Assigned to organization"
    });

    await report.save();

    const populated = await Report.findById(report._id)
      .populate("assignedTo", "name");

    res.json({ report: populated });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= UPLOAD PROOF =================
router.patch("/:id/proof", upload.single("image"), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    report.proofImage = `/uploads/${req.file.filename}`;

    // 🔔 notification
    report.updates.push({
      message: "Proof uploaded"
    });

    await report.save();

    res.json({ report });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= DELETE =================
router.delete("/:id", async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json({ message: "Deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// GET all organizations
router.get("/orgs", async (req, res) => {
  try {
    const Organization = require("../models/Organization");

    const orgs = await Organization.find();
    res.json(orgs);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;