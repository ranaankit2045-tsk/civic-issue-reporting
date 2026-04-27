const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  }
});

// 🔥 FIX: prevent overwrite error
module.exports = mongoose.models.Organization || mongoose.model("Organization", organizationSchema);