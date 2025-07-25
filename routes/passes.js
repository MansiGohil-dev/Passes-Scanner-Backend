// const express = require("express");
// const multer = require("multer");
// const Pass = require("../models/Pass");
// const router = express.Router();
// const path = require("path");
// const PassShare = require("../models/PassShare");
// const axios = require('axios');

// // In-memory OTP storage (for demo purposes - use Redis in production)
// const otpStorage = new Map();

// // Set up multer for file uploads
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/");
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });
// const upload = multer({ storage });

// // Create or update pass (single pass template)
// router.post("/", upload.single("image"), async (req, res) => {
//   try {
//     const { count } = req.body;
//     if (!req.file) return res.status(400).json({ message: "Image required" });

//     // Remove old pass if exists (only one pass allowed)
//     await Pass.deleteMany({});

//     const pass = new Pass({
//       imageUrl: req.file.path,
//       count: parseInt(count, 10),
//     });
//     await pass.save();
//     res.status(201).json(pass);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // Get current pass
// router.get("/", async (req, res) => {
//   try {
//     const pass = await Pass.findOne();
//     if (!pass) return res.status(404).json({ message: "No pass found" });
//     res.json(pass);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // Edit pass (update image and/or count)
// router.put("/", upload.single("image"), async (req, res) => {
//   try {
//     const { count } = req.body;
//     const update = {};
//     if (count) update.count = parseInt(count, 10);
//     if (req.file) update.imageUrl = req.file.path;

//     const pass = await Pass.findOneAndUpdate({}, update, { new: true });
//     if (!pass) return res.status(404).json({ message: "No pass found" });
//     res.json(pass);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // Admin dashboard: get total, available, and sold passes
// router.get("/summary", async (req, res) => {
//   try {
//     const pass = await Pass.findOne();
//     const total = pass ? pass.count + (await PassShare.aggregate([{ $group: { _id: null, total: { $sum: "$count" } } }]))[0]?.total || 0 : 0;
//     const available = pass ? pass.count : 0;
//     const sold = (await PassShare.aggregate([{ $group: { _id: null, total: { $sum: "$count" } } }]))[0]?.total || 0;
//     res.json({ total, available, sold });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // Admin dashboard: get all sales/pass shares
// router.get("/sales", async (req, res) => {
//   try {
//     const shares = await PassShare.find({}, { name: 1, mobile: 1, count: 1, createdAt: 1, token: 1, parentToken: 1, _id: 0 }).sort({ createdAt: -1 });
//     res.json(shares);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // Share passes: admin can share multiple, users can share one or more if they have enough remaining
// // TODO: Add authentication middleware here for admin or user protection, e.g. [authMiddleware]
// // router.post("/share", async (req, res) => {
// //   try {
// //     let { mobile, count, parentToken, name, allowedEmployees } = req.body;
// //     const shareCount = parseInt(count, 10);

// //     // Mobile validation: must be a 10-digit Indian number or +91XXXXXXXXXX
// //     if (!mobile) {
// //       return res.status(400).json({ message: "Mobile is required" });
// //     }
// //     let cleanMobile = mobile.replace(/\D/g, '');
// //     if (/^\d{10}$/.test(cleanMobile)) {
// //       mobile = '+91' + cleanMobile;
// //     } else if (/^91\d{10}$/.test(cleanMobile)) {
// //       mobile = '+' + cleanMobile;
// //     } else if (/^\+91\d{10}$/.test(mobile)) {
// //       // already correct
// //     } else {
// //       return res.status(400).json({ message: "Enter a valid 10-digit Indian mobile number" });
// //     }
// //     if (!shareCount || shareCount < 1) {
// //       return res.status(400).json({ message: "A valid pass count is required" });
// //     }
// //     // If parentToken is not provided, this is an admin share (initial allocation)
// //     if (!parentToken) {
// //       // Admin must provide name
// //       if (!name) return res.status(400).json({ message: "Recipient name required" });
// //       // allowedEmployees can be empty or array of employee IDs

// //       // ENFORCE: Only one pass per mobile
// //       const existingShare = await PassShare.findOne({ mobile });
// //       if (existingShare) {
// //         return res.status(400).json({ message: "This mobile already has a pass assigned." });
// //       }
// //       // Admin can share multiple passes at once
// //       const pass = await Pass.findOne();
// //       if (!pass) return res.status(404).json({ message: "No pass found" });
// //       if (pass.count < shareCount) {
// //         return res.status(400).json({ message: "Not enough passes available" });
// //       }
// //       pass.count -= shareCount;
// //       await pass.save();
// //       // User gets all passes, remaining = count
// //       // Add all employees to allowedEmployees by default
// //       const allEmployees = await Employee.find({}, '_id');
// //       const employeeIds = allEmployees.map(e => e._id);
// //       const share = new PassShare({ mobile, name, count: shareCount, remaining: shareCount, allowedEmployees: employeeIds });
// //       await share.save();
// //       // For admin dashboard: return available and sold
// //       const sold = (await PassShare.aggregate([{ $group: { _id: null, total: { $sum: "$count" } } }]))[0]?.total || 0;
// //       res.json({ message: `Passes shared successfully`, available: pass.count, sold, token: share.token });
// //     } else {
// //       // User sharing to friend: require name and allow sharing more than one pass if enough remaining
// //       if (!name) return res.status(400).json({ message: "Recipient name required" });
// //       // ENFORCE: Only one pass per mobile
// //       const existingShare = await PassShare.findOne({ mobile });
// //       if (existingShare) {
// //         return res.status(400).json({ message: "This mobile already has a pass assigned." });
// //       }
// //       const parentShare = await PassShare.findOne({ token: parentToken });
// //       if (!parentShare || parentShare.remaining < shareCount) {
// //         return res.status(400).json({ message: "Not enough passes left to share" });
// //       }
// //       // ENFORCE: Sender must always keep at least 1 pass for themselves
// //       if (shareCount >= parentShare.remaining) {
// //         return res.status(400).json({ message: `You can only share up to ${parentShare.remaining - 1} passes.` });
// //       }
// //       parentShare.remaining -= shareCount;
// //       await parentShare.save();
// //       // Recipient gets all passes, remaining = count
// //       // Add all employees to allowedEmployees by default
// //       const allEmployees = await Employee.find({}, '_id');
// //       const employeeIds = allEmployees.map(e => e._id);
// //       const passShare = new PassShare({
// //         mobile,
// //         name,
// //         count: shareCount,
// //         remaining: shareCount,
// //         sharedAt: new Date(),
// //         parentToken,
// //         allowedEmployees: employeeIds,
// //       });
// //       await passShare.save();
// //       res.json({ message: `Passes shared successfully`, token: passShare.token });
// //     }
// //   } catch (err) {
// //     res.status(500).json({ message: err.message });
// //   }
// // });

// // Share passes: admin can share multiple, users can share one or more if they have enough remaining
// router.post("/share", async (req, res) => {
//   try {
//     let { mobile, count, parentToken, name, allowedEmployees } = req.body;
//     const shareCount = parseInt(count, 10);

//     // Mobile validation: must be a 10-digit Indian number or +91XXXXXXXXXX
//     if (!mobile) {
//       return res.status(400).json({ message: "Mobile is required" });
//     }
//     let cleanMobile = mobile.replace(/\D/g, '');
//     if (/^\d{10}$/.test(cleanMobile)) {
//       mobile = '+91' + cleanMobile;
//     } else if (/^91\d{10}$/.test(cleanMobile)) {
//       mobile = '+' + cleanMobile;
//     } else if (/^\+91\d{10}$/.test(mobile)) {
//       // already correct
//     } else {
//       return res.status(400).json({ message: "Enter a valid 10-digit Indian mobile number" });
//     }
//     if (!shareCount || shareCount < 1) {
//       return res.status(400).json({ message: "A valid pass count is required" });
//     }
//     // If parentToken is not provided, this is an admin share (initial allocation)
//     if (!parentToken) {
//       // Admin must provide name
//       if (!name) return res.status(400).json({ message: "Recipient name required" });
//       // allowedEmployees can be empty or array of employee IDs

//       // Admin can share multiple passes at once
//       const pass = await Pass.findOne();
//       if (!pass) return res.status(404).json({ message: "No pass found" });
//       if (pass.count < shareCount) {
//         return res.status(400).json({ message: "Not enough passes available" });
//       }
//       pass.count -= shareCount;
//       await pass.save();
//       // User gets all passes, remaining = count
//       // Add all employees to allowedEmployees by default
//       const allEmployees = await Employee.find({}, '_id');
//       const employeeIds = allEmployees.map(e => e._id);
//       const share = new PassShare({ mobile, name, count: shareCount, remaining: shareCount, allowedEmployees: employeeIds });
//       await share.save();
//       // For admin dashboard: return available and sold
//       const sold = (await PassShare.aggregate([{ $group: { _id: null, total: { $sum: "$count" } } }]))[0]?.total || 0;
//       res.json({ message: `Passes shared successfully`, available: pass.count, sold, token: share.token });
//     } else {
//       // User sharing to friend: require name and allow sharing more than one pass if enough remaining
//       if (!name) return res.status(400).json({ message: "Recipient name required" });
//       const parentShare = await PassShare.findOne({ token: parentToken });
//       if (!parentShare || parentShare.remaining < shareCount) {
//         return res.status(400).json({ message: "Not enough passes left to share" });
//       }
//       // ENFORCE: Sender must always keep at least 1 pass for themselves
//       if (shareCount >= parentShare.remaining) {
//         return res.status(400).json({ message: `You can only share up to ${parentShare.remaining - 1} passes.` });
//       }
//       parentShare.remaining -= shareCount;
//       await parentShare.save();
//       // Recipient gets all passes, remaining = count
//       // Add all employees to allowedEmployees by default
//       const allEmployees = await Employee.find({}, '_id');
//       const employeeIds = allEmployees.map(e => e._id);
//       const passShare = new PassShare({
//         mobile,
//         name,
//         count: shareCount,
//         remaining: shareCount,
//         sharedAt: new Date(),
//         parentToken,
//         allowedEmployees: employeeIds,
//       });
//       await passShare.save();
//       res.json({ message: `Passes shared successfully`, token: passShare.token });
//     }
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // Get shared pass info by token
// // Get shared pass info by token
// router.get("/shared/:token", async (req, res) => {
//   try {
//     const { token } = req.params;
//     console.log('Fetching shared pass for token:', token);
    
//     const share = await PassShare.findOne({ token });
//     console.log('Found share:', !!share);
    
//     if (!share) {
//       console.log('No share found for token:', token);
//       return res.status(404).json({ message: "Invalid or expired link", found: false });
//     }
    
//     const pass = await Pass.findOne();
//     console.log('Found pass:', !!pass);
    
//     if (!pass) {
//       console.log('No pass found in database');
//       return res.status(404).json({ message: "No pass found", found: false });
//     }
    
//     // Patch: If remaining is undefined or < 1 but count > 1, set remaining = count
//     let correctRemaining = share.remaining;
//     if ((correctRemaining === undefined || correctRemaining < 1) && share.count > 1) {
//       correctRemaining = share.count;
//     }
    
//     const response = {
//       mobile: share.mobile,
//       count: share.count,
//       remaining: correctRemaining,
//       sharedAt: share.sharedAt,
//       token: share.token,
//       parentToken: share.parentToken,
//       imageUrl: pass.imageUrl,
//       found: true
//     };
    
//     console.log('Sending response:', response);
//     res.json(response);
//   } catch (err) {
//     console.error('Error in /shared/:token:', err);
//     res.status(500).json({ message: err.message });
//   }
// });

// // Send OTP for WhatsApp sharing
// router.post("/send-otp", async (req, res) => {
//   try {
//     const { mobile } = req.body;
//     if (!mobile) {
//       return res.status(400).json({ message: "Mobile number required" });
//     }

//     // Generate 6-digit OTP
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();

//     // Store OTP with 5-minute expiry
//     otpStorage.set(mobile, {
//       otp,
//       expires: Date.now() + 5 * 60 * 1000 // 5 minutes
//     });

//     let smsSuccess = false;
//     let smsMessage = '';

//     // Only use Fast2SMS for OTP delivery
//     if (process.env.FAST2SMS_API_KEY) {
//       try {
//         const cleanMobile = mobile.replace(/^\+91/, '').replace(/^91/, '');
//         const otpMessage = `Your OTP for pass sharing is ${otp}. Valid for 5 minutes.`;

//         console.log('Attempting Fast2SMS with mobile:', cleanMobile);
//         console.log('API Key present:', !!process.env.FAST2SMS_API_KEY);

//         const fast2smsUrl = 'https://www.fast2sms.com/dev/bulkV2';

//         const fast2smsData = {
//           sender_id: 'FSTSMS',
//           message: otpMessage,
//           language: 'english',
//           route: 'q',
//           numbers: cleanMobile
//         };

//         // Clean the API key to remove any potential invalid characters
//         const apiKey = process.env.FAST2SMS_API_KEY.trim();
        
//         const response = await axios.post(fast2smsUrl, fast2smsData, {
//           headers: {
//             'Authorization': apiKey,
//             'Content-Type': 'application/json'
//           }
//         });

//         console.log('Fast2SMS Response:', response.data);

//         if (response.data.return === true) {
//           console.log(`OTP sent via Fast2SMS to +91${cleanMobile}: ${otp}`);
//           smsSuccess = true;
//           smsMessage = "OTP sent successfully to your mobile via Fast2SMS";
//         } else {
//           // Log full Fast2SMS error for debugging
//           console.log('Fast2SMS error:', response.data);
//         }
//       } catch (fast2smsError) {
//         console.log('Fast2SMS failed:', fast2smsError.response?.data || fast2smsError.message);
//       }
//     }

//     // Final response
//     if (smsSuccess) {
//       res.json({ message: smsMessage, success: true });
//     } else {
//       // Fallback for demo mode
//       console.log(`OTP for ${mobile}: ${otp} (Demo mode - SMS services failed or not configured)`);
//       res.json({
//         message: "OTP sent successfully (Demo mode - check console)",
//         success: true,
//         demo: true,
//         otp: otp
//       });
//     }
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // Verify OTP for WhatsApp sharing
// router.post("/verify-otp", async (req, res) => {
//   try {
//     const { mobile, otp } = req.body;
//     if (!mobile || !otp) {
//       return res.status(400).json({ message: "Mobile and OTP required" });
//     }
    
//     const storedData = otpStorage.get(mobile);
//     if (!storedData) {
//       return res.status(400).json({ message: "OTP not found or expired", success: false });
//     }
    
//     if (Date.now() > storedData.expires) {
//       otpStorage.delete(mobile);
//       return res.status(400).json({ message: "OTP expired", success: false });
//     }
    
//     if (storedData.otp !== otp) {
//       return res.status(400).json({ message: "Invalid OTP", success: false });
//     }
    
//     // OTP verified, remove from storage
//     otpStorage.delete(mobile);
    
//     res.json({ message: "OTP verified successfully", success: true });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // Mark a shared pass as used (after confirmation)
// router.patch("/shared/:token/use", async (req, res) => {
//   const { token } = req.params;
//   const { mobile, employeeId } = req.body;
//   try {
//     const share = await PassShare.findOne({ token });
//     if (!share) return res.status(404).json({ message: "Invalid or expired link" });
//     if (share.used) return res.status(400).json({ message: "Pass already used" });
//     // Optionally, validate employee if needed
//     share.used = true;
//     await share.save();
//     return res.json({
//       message: "Pass marked as used",
//       name: share.name,
//       mobile: share.mobile,
//       used: true,
//       token: share.token
//     });
//   } catch (err) {
//     return res.status(500).json({ message: err.message });
//   }
// });

// // Employee scans QR for entry validation
// const Employee = require("../models/Employee");

// router.post("/shared/:token/scan", async (req, res) => {
//   const { token } = req.params;
//   const { mobile, employeeId } = req.body;
//   const share = await PassShare.findOne({ token });
//   if (!share) return res.status(404).json({ message: "Invalid or expired link" });

//   let emp = null;
//   if (employeeId) {
//     try {
//       emp = await Employee.findById(employeeId);
//     } catch (e) {
//       emp = null;
//     }
//   }
//   if (!emp && mobile) {
//     const cleanMobile = mobile.replace(/\D/g, '');
//     emp = await Employee.findOne({
//       $or: [
//         { mobile: cleanMobile },
//         { mobile: '+91' + cleanMobile },
//         { mobile: '91' + cleanMobile }
//       ]
//     });
//   }
//   console.log("Scan attempt:", { inputMobile: mobile, employeeId, foundEmployee: emp });
//   if (!emp) {
//     return res.status(403).json({ message: "You are not authorized to scan this pass.", allowed: false, name: share.name || 'N/A' });
//   }

//   // Only check, do NOT set used=true here!
//   if (share.used) {
//     return res.json({
//       message: "Pass already used.",
//       allowed: false,
//       name: share.name || 'N/A',
//       mobile: share.mobile,
//       used: true
//     });
//   }

//   // Success: show pass owner info, but do NOT mark as used
//   return res.json({
//     message: "Entry allowed",
//     name: share.name,
//     mobile: share.mobile,
//     allowed: true,
//     used: false
//   });
// });

// // Debugging endpoint to list all shared pass tokens
// router.get("/shared-tokens", async (req, res) => {
//   const shares = await PassShare.find({}, { token: 1, name: 1, mobile: 1 });
//   res.json(shares);
// });

// module.exports = router;


const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Pass = require("../models/Pass");
const PassShare = require("../models/PassShare");
const Employee = require("../models/Employee");
const axios = require("axios");
const router = express.Router();

// In-memory OTP storage (use Redis in production)
const otpStorage = new Map();

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log("Created uploads folder in Multer at:", uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Create pass
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { count } = req.body;
    if (!req.file) return res.status(400).json({ message: "Image required" });
    const parsedCount = parseInt(count, 10);
    if (isNaN(parsedCount) || parsedCount < 0) {
      return res.status(400).json({ message: "Invalid count value" });
    }

    // Store relative path for imageUrl
    const relativePath = `uploads/${req.file.filename}`;
    await Pass.deleteMany({});
    const pass = new Pass({
      imageUrl: relativePath,
      count: parsedCount,
    });
    await pass.save();
    console.log("Pass created:", { imageUrl: pass.imageUrl, count: pass.count });
    res.status(201).json(pass);
  } catch (err) {
    console.error("Error in POST /api/passes:", {
      message: err.message,
      stack: err.stack,
      body: req.body,
      file: req.file,
    });
    res.status(500).json({ message: err.message });
  }
});

// Get current pass
router.get("/", async (req, res) => {
  try {
    const pass = await Pass.findOne();
    if (!pass) return res.status(404).json({ message: "No pass found" });
    res.json(pass);
  } catch (err) {
    console.error("Error in GET /api/passes:", err);
    res.status(500).json({ message: err.message });
  }
});

// Update pass
router.put("/", upload.single("image"), async (req, res) => {
  try {
    const { count } = req.body;
    const update = {};

    if (count) {
      const parsedCount = parseInt(count, 10);
      if (isNaN(parsedCount) || parsedCount < 0) {
        return res.status(400).json({ message: "Invalid count value" });
      }
      update.count = parsedCount;
    }
    if (req.file) {
      // Store relative path for imageUrl
      update.imageUrl = `uploads/${req.file.filename}`;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "No updates provided" });
    }

    const pass = await Pass.findOneAndUpdate({}, update, { new: true });
    if (!pass) return res.status(404).json({ message: "No pass found" });

    console.log("Pass updated:", { imageUrl: pass.imageUrl, count: pass.count });
    res.json(pass);
  } catch (err) {
    console.error("Error in PUT /api/passes:", {
      message: err.message,
      stack: err.stack,
      body: req.body,
      file: req.file,
    });
    res.status(500).json({ message: "Failed to update pass", error: err.message });
  }
});

// Get summary
router.get("/summary", async (req, res) => {
  try {
    const pass = await Pass.findOne();
    const total = pass ? pass.count + (await PassShare.aggregate([{ $group: { _id: null, total: { $sum: "$count" } } }]))[0]?.total || 0 : 0;
    const available = pass ? pass.count : 0;
    const sold = (await PassShare.aggregate([{ $group: { _id: null, total: { $sum: "$count" } } }]))[0]?.total || 0;
    res.json({ total, available, sold });
  } catch (err) {
    console.error("Error in GET /api/passes/summary:", err);
    res.status(500).json({ message: err.message });
  }
});

// Share passes
router.post("/share", async (req, res) => {
  try {
    let { mobile, count, parentToken, name, allowedEmployees } = req.body;
    const shareCount = parseInt(count, 10);

    if (!mobile) {
      return res.status(400).json({ message: "Mobile is required" });
    }
    let cleanMobile = mobile.replace(/\D/g, "");
    if (/^\d{10}$/.test(cleanMobile)) {
      mobile = "+91" + cleanMobile;
    } else if (/^91\d{10}$/.test(cleanMobile)) {
      mobile = "+" + cleanMobile;
    } else if (/^\+91\d{10}$/.test(mobile)) {
      // Already correct
    } else {
      return res.status(400).json({ message: "Enter a valid 10-digit Indian mobile number" });
    }
    if (!shareCount || shareCount < 1) {
      return res.status(400).json({ message: "A valid pass count is required" });
    }

    if (!parentToken) {
      if (!name) return res.status(400).json({ message: "Recipient name required" });
      const existingShare = await PassShare.findOne({ mobile });
      if (existingShare) {
        return res.status(400).json({ message: "This mobile already has a pass assigned" });
      }
      const pass = await Pass.findOne();
      if (!pass) return res.status(404).json({ message: "No pass found" });
      if (pass.count < shareCount) {
        return res.status(400).json({ message: "Not enough passes available" });
      }
      pass.count -= shareCount;
      await pass.save();
      const allEmployees = await Employee.find({}, "_id");
      const employeeIds = allEmployees.map((e) => e._id);
      const share = new PassShare({
        mobile,
        name,
        count: shareCount,
        remaining: shareCount,
        allowedEmployees: employeeIds,
      });
      await share.save();
      const sold = (await PassShare.aggregate([{ $group: { _id: null, total: { $sum: "$count" } } }]))[0]?.total || 0;
      res.json({ message: "Passes shared successfully", available: pass.count, sold, token: share.token });
    } else {
      if (!name) return res.status(400).json({ message: "Recipient name required" });
      const existingShare = await PassShare.findOne({ mobile });
      if (existingShare) {
        return res.status(400).json({ message: "This mobile already has a pass assigned" });
      }
      const parentShare = await PassShare.findOne({ token: parentToken });
      if (!parentShare || parentShare.remaining < shareCount) {
        return res.status(400).json({ message: "Not enough passes left to share" });
      }
      if (shareCount >= parentShare.remaining) {
        return res.status(400).json({ message: `You can only share up to ${parentShare.remaining - 1} passes` });
      }
      parentShare.remaining -= shareCount;
      await parentShare.save();
      const allEmployees = await Employee.find({}, "_id");
      const employeeIds = allEmployees.map((e) => e._id);
      const passShare = new PassShare({
        mobile,
        name,
        count: shareCount,
        remaining: shareCount,
        sharedAt: new Date(),
        parentToken,
        allowedEmployees: employeeIds,
      });
      await passShare.save();
      res.json({ message: "Passes shared successfully", token: passShare.token });
    }
  } catch (err) {
    console.error("Error in POST /api/passes/share:", err);
    res.status(500).json({ message: err.message });
  }
});

// Get shared pass info by token
router.get("/shared/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const share = await PassShare.findOne({ token });
    if (!share) {
      return res.status(404).json({ message: "Invalid or expired link", found: false });
    }
    const pass = await Pass.findOne();
    if (!pass) {
      return res.status(404).json({ message: "No pass found", found: false });
    }
    let correctRemaining = share.remaining;
    if ((correctRemaining === undefined || correctRemaining < 1) && share.count > 1) {
      correctRemaining = share.count;
    }
    res.json({
      mobile: share.mobile,
      count: share.count,
      remaining: correctRemaining,
      sharedAt: share.sharedAt,
      token: share.token,
      parentToken: share.parentToken,
      imageUrl: pass.imageUrl,
      found: true,
    });
  } catch (err) {
    console.error("Error in GET /api/passes/shared/:token:", err);
    res.status(500).json({ message: err.message });
  }
});

// Send OTP
router.post("/send-otp", async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) {
      return res.status(400).json({ message: "Mobile number required" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStorage.set(mobile, {
      otp,
      expires: Date.now() + 5 * 60 * 1000,
    });
    let smsSuccess = false;
    let smsMessage = "";
    if (process.env.FAST2SMS_API_KEY) {
      try {
        const cleanMobile = mobile.replace(/^\+91/, "").replace(/^91/, "");
        const otpMessage = `Your OTP for pass sharing is ${otp}. Valid for 5 minutes.`;
        const response = await axios.post(
          "https://www.fast2sms.com/dev/bulkV2",
          {
            sender_id: "FSTSMS",
            message: otpMessage,
            language: "english",
            route: "q",
            numbers: cleanMobile,
          },
          {
            headers: {
              Authorization: process.env.FAST2SMS_API_KEY.trim(),
              "Content-Type": "application/json",
            },
          }
        );
        if (response.data.return === true) {
          smsSuccess = true;
          smsMessage = "OTP sent successfully to your mobile via Fast2SMS";
        }
      } catch (fast2smsError) {
        console.error("Fast2SMS failed:", fast2smsError.response?.data || fast2smsError.message);
      }
    }
    if (smsSuccess) {
      res.json({ message: smsMessage, success: true });
    } else {
      console.log(`OTP for ${mobile}: ${otp} (Demo mode)`);
      res.json({
        message: "OTP sent successfully (Demo mode - check console)",
        success: true,
        demo: true,
        otp,
      });
    }
  } catch (err) {
    console.error("Error in POST /api/passes/send-otp:", err);
    res.status(500).json({ message: err.message });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) {
      return res.status(400).json({ message: "Mobile and OTP required" });
    }
    const storedData = otpStorage.get(mobile);
    if (!storedData) {
      return res.status(400).json({ message: "OTP not found or expired", success: false });
    }
    if (Date.now() > storedData.expires) {
      otpStorage.delete(mobile);
      return res.status(400).json({ message: "OTP expired", success: false });
    }
    if (storedData.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP", success: false });
    }
    otpStorage.delete(mobile);
    res.json({ message: "OTP verified successfully", success: true });
  } catch (err) {
    console.error("Error in POST /api/passes/verify-otp:", err);
    res.status(500).json({ message: err.message });
  }
});

// Mark pass as used
router.patch("/shared/:token/use", async (req, res) => {
  try {
    const { token } = req.params;
    const { mobile, employeeId } = req.body;
    const share = await PassShare.findOne({ token });
    if (!share) return res.status(404).json({ message: "Invalid or expired link" });
    if (share.used) return res.status(400).json({ message: "Pass already used" });
    share.used = true;
    await share.save();
    res.json({
      message: "Pass marked as used",
      name: share.name,
      mobile: share.mobile,
      used: true,
      token: share.token,
    });
  } catch (err) {
    console.error("Error in PATCH /api/passes/shared/:token/use:", err);
    res.status(500).json({ message: err.message });
  }
});

// Scan pass
router.post("/shared/:token/scan", async (req, res) => {
  try {
    const { token } = req.params;
    const { mobile, employeeId } = req.body;
    const share = await PassShare.findOne({ token });
    if (!share) return res.status(404).json({ message: "Invalid or expired link" });
    let emp = null;
    if (employeeId) {
      emp = await Employee.findById(employeeId);
    }
    if (!emp && mobile) {
      const cleanMobile = mobile.replace(/\D/g, "");
      emp = await Employee.findOne({
        $or: [
          { mobile: cleanMobile },
          { mobile: "+91" + cleanMobile },
          { mobile: "91" + cleanMobile },
        ],
      });
    }
    if (!emp) {
      return res.status(403).json({
        message: "You are not authorized to scan this pass.",
        allowed: false,
        name: share.name || "N/A",
      });
    }
    if (share.used) {
      return res.json({
        message: "Pass already used.",
        allowed: false,
        name: share.name || "N/A",
        mobile: share.mobile,
        used: true,
      });
    }
    res.json({
      message: "Entry allowed",
      name: share.name,
      mobile: share.mobile,
      allowed: true,
      used: false,
    });
  } catch (err) {
    console.error("Error in POST /api/passes/shared/:token/scan:", err);
    res.status(500).json({ message: err.message });
  }
});

// Debugging endpoint for shared tokens
router.get("/shared-tokens", async (req, res) => {
  try {
    const shares = await PassShare.find({}, { token: 1, name: 1, mobile: 1 });
    res.json(shares);
  } catch (err) {
    console.error("Error in GET /api/passes/shared-tokens:", err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/sales", async (req, res) => {
  try {
    const shares = await PassShare.find({}, { name: 1, mobile: 1, count: 1, createdAt: 1, token: 1, parentToken: 1, _id: 0 }).sort({ createdAt: -1 });
    res.json(shares);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a user's pass share by mobile and restore the main pass count
router.delete("/sales/:mobile", async (req, res) => {
  try {
    const { mobile } = req.params;
    // Find the pass share by mobile
    const share = await PassShare.findOne({ mobile });
    if (!share) {
      return res.status(404).json({ message: "No pass found for this mobile" });
    }
    // Remove the share
    await PassShare.deleteOne({ mobile });
    // Restore count to main Pass
    const pass = await Pass.findOne();
    if (pass) {
      pass.count += share.count;
      await pass.save();
    }
    res.json({ message: "Pass deleted and count restored", pass });
  } catch (err) {
    console.error("Error in DELETE /api/passes/sales/:mobile:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
