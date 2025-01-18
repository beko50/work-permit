const express = require('express');
const router = express.Router();
const permitController = require('../controllers/permitController');
const authMiddleware = require('../middleware/authMiddleware');
const { poolPromise, sql } = require('../db');

// Debug middleware for POST requests
router.use((req, res, next) => {
  if (req.method === 'POST') {
    console.log('Request body received in route:', req.body);
  }
  next();
});

// Main permit routes
router.get('/form-sections', authMiddleware, permitController.getFormSections);
router.post('/', authMiddleware, permitController.createPermit);
router.get('/', authMiddleware, permitController.getPermits);
router.put('/status', authMiddleware, permitController.updatePermitStatus);

// Debug/testing routes
router.get('/test-checkboxes/:permitId', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('permitId', sql.Int, req.params.permitId)
      .query(`
        SELECT 
          jpc.*,
          si.ItemLabel,
          fs.SectionName
        FROM JobPermitCheckboxes jpc
        JOIN SectionItems si ON jpc.SectionItemID = si.SectionItemID
        JOIN FormSections fs ON si.SectionID = fs.SectionID
        WHERE jpc.JobPermitID = @permitId
      `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;