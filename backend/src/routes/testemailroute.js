const express = require('express');
const router = express.Router();
const NotificationService = require('../services/emailService');

// Test email route
router.get('/send-test-email', async (req, res) => {
  try {
    // You can modify the email address as needed
    const email = req.query.email || 'jajilima@mps-gh.com';
    
    const result = await NotificationService.sendTestEmail(email);
    
    res.status(200).json({
      message: 'Test email sent successfully',
      details: result
    });
  } catch (error) {
    console.error('Test email sending error:', error);
    res.status(500).json({
      message: 'Failed to send test email',
      error: error.toString()
    });
  }
});

module.exports = router;