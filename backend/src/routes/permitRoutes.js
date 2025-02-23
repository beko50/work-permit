const express = require('express');
const router = express.Router();
const permitController = require('../controllers/permitController');
const authMiddleware = require('../middleware/authMiddleware');
const { poolPromise, sql } = require('../db');

// Debug middleware for POST requests
router.use((req, res, next) => {
  if (req.method === 'POST') {
    // console.log('Request body received in route:', req.body);
  }
  next();
});

// Main permit routes
router.get('/form-sections',permitController.getFormSections);
router.post('/', permitController.createPermit);
router.get('', authMiddleware, permitController.getPermits);

router.get('/search', authMiddleware, permitController.searchPermits);

// Permit to Work routes - Make sure these come BEFORE the general permitId route
router.post('/permit-to-work', authMiddleware, permitController.createPermitToWork);
router.get('/permit-to-work', authMiddleware, permitController.getPermitToWork);
router.get('/permit-to-work/search', authMiddleware, permitController.searchPTW);  // Move this line UP
router.get('/permit-to-work/:permitToWorkId', authMiddleware, permitController.getPermitToWorkById);  // Move this line DOWN
// Keep this route for initial PTW creation
router.get('/permit-to-work/job-permit/:jobPermitId', authMiddleware, permitController.getPermitToWorkByJobPermitId);
router.post('/permit-to-work/:permitToWorkId/approve', authMiddleware, permitController.approvePermitToWork);
router.post('/permit-to-work/:permitToWorkId/complete', authMiddleware, permitController.completePermitToWork);


router.get('/:permitId', authMiddleware, permitController.getPermitById);
router.get('/department/:departmentId', permitController.getPermitsByDepartment);
router.post('/approve', authMiddleware, permitController.approvePermit);
router.post('/revoke/initiate', authMiddleware, permitController.initiateRevocation);
router.get('/revoke/pending', authMiddleware, permitController.getPendingRevocations);
router.post('/revoke/approve', authMiddleware, permitController.approveRevocation);
//router.put('/status',  permitController.updatePermitStatus);

// // Debug/testing routes
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