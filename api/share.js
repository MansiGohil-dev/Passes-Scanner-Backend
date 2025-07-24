// Pseudocode for backend pass sharing and tracking API
// This is a design sketch for your backend team or for further implementation

const express = require('express');
const router = express.Router();
const { Pass, SharedPass } = require('../models'); // Assume Mongoose models
const sendWhatsApp = require('../utils/sendWhatsApp'); // Utility to send WhatsApp message

// POST /api/passes/share-extra
// Body: { mainToken, friendMobile, sharedBy }
router.post('/share-extra', async (req, res) => {
  const { mainToken, friendMobile, sharedBy } = req.body;
  // Validate input ...
  // Find main pass by token
  const mainPass = await Pass.findOne({ token: mainToken });
  if (!mainPass) return res.status(404).json({ error: 'Main pass not found' });

  // Generate unique token for friend
  const friendToken = mainToken + '-' + friendMobile;

  // Save to SharedPass collection
  await SharedPass.create({
    mainToken,
    friendMobile,
    friendToken,
    sharedBy,
    createdAt: new Date()
  });

  // Generate link
  const link = `${process.env.FRONTEND_URL}/shared-pass/${friendToken}`;

  // WhatsApp message
  const message = `You have been shared a pass! Click here: ${link}`;
  await sendWhatsApp(friendMobile, message);

  res.json({ success: true, link });
});

// GET /api/passes/shared/:friendToken
// Returns info for that friend's pass (QR, image, etc)
router.get('/shared/:friendToken', async (req, res) => {
  const { friendToken } = req.params;
  const shared = await SharedPass.findOne({ friendToken });
  if (!shared) return res.status(404).json({ error: 'Not found' });
  // Optionally: mark as viewed, log open, etc
  // Return pass info (image, QR, etc)
  const mainPass = await Pass.findOne({ token: shared.mainToken });
  res.json({
    imageUrl: mainPass.imageUrl,
    qr: friendToken,
    mobile: shared.friendMobile,
    sharedBy: shared.sharedBy,
    createdAt: shared.createdAt
  });
});

module.exports = router;
