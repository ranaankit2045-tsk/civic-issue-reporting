const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    image: {
      type: String
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true
      },
      coordinates: {
        type: [Number],
        required: true
      }
    },
    status: {
      type: String,
      enum: ["Submitted", "In Progress", "Resolved"],
      default: "Submitted"
    },

    // 🔥 UPDATED: now references Organization
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null
    },

    // 🔥 NEW: proof image uploaded by organization
    proofImage: {
      type: String
    },

    // 🔥 NEW: notifications / history log
    updates: [
      {
        message: String,
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ]

  },
  { timestamps: true }
);

// Geospatial index
reportSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Report", reportSchema);