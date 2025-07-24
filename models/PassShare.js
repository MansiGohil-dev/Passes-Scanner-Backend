const mongoose = require("mongoose");
const crypto = require("crypto");

const PassShareSchema = new mongoose.Schema({
  mobile: { type: String, required: true },
  name: { type: String }, // Recipient name for tracking
  count: { type: Number, required: true }, // Total passes assigned to this user
  remaining: { type: Number, required: true }, // Passes left to share (including 0)
  sharedAt: { type: Date, default: Date.now },
  token: { type: String, unique: true, required: true }, // Unique QR/pass for this user
  parentToken: { type: String }, // Who shared this pass (token of sharer)
  allowedEmployees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }], // Assigned employees for scanning
  used: { type: Boolean, default: false }, // Mark pass as used after scan
});

// Generate a unique token before saving if not present
PassShareSchema.pre("validate", function (next) {
  if (!this.token) {
    this.token = crypto.randomBytes(16).toString("hex");
  }
  next();
});

module.exports = mongoose.model("PassShare", PassShareSchema);
