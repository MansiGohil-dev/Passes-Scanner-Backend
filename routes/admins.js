const express = require("express");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
const router = express.Router();

// Register admin
router.post("/", async (req, res) => {
  const { email, password, team420 } = req.body;
  if (!team420) return res.status(403).json({ message: "Not allowed" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({ email, password: hashedPassword });
    await admin.save();
    res.status(201).json(admin);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all admins
router.get("/", async (req, res) => {
  const admins = await Admin.find({}, "-password");
  res.json(admins);
});

// Edit admin
router.put("/:id", async (req, res) => {
  const { email, password } = req.body;
  try {
    const update = { email };
    if (password) {
      update.password = await bcrypt.hash(password, 10);
    }
    const admin = await Admin.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });
    res.json(admin);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Login admin
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Login successful
    res.json({
      message: "Login successful",
      admin: {
        id: admin._id,
        email: admin.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete admin
router.delete("/:id", async (req, res) => {
  try {
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ message: "Admin deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
