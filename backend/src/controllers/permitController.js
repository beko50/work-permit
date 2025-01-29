const { poolPromise } = require('../db');
const permitModel = require('../models/permitModel');

const permitController = {
  async getFormSections(req, res) {
    try {
      const result = await permitModel.getFormSections();

      const sections = result.reduce((acc, item) => {
        if (!acc[item.SectionID]) {
          acc[item.SectionID] = {
            sectionId: item.SectionID,
            sectionName: item.SectionName,
            items: []
          };
        }

        if (item.SectionItemID) {
          acc[item.SectionID].items.push({
            sectionItemId: item.SectionItemID,
            label: item.ItemLabel,
            displaySequence: item.ItemDisplaySequence,
            allowTextInput: item.AllowTextInput === 'Yes'
          });
        }

        return acc;
      }, {});

      res.json({ sections: Object.values(sections) });
    } catch (error) {
      console.error('Error fetching form sections:', error);
      res.status(500).json({ message: 'Error fetching form sections' });
    }
  },

  async createPermit(req, res) {
    const pool = await poolPromise;
    const transaction = await pool.transaction();

    try {
      const { checkboxSelections, ...permitData } = req.body;

      // Handle contract company name based on contract type
      if (permitData.contractType === 'Internal / MPS') {
        permitData.contractCompanyName = 'Meridian Port Services Ltd';
      }

      // console.log('Raw request body:', req.body);
      // console.log('Checkbox selections:', checkboxSelections);

      // console.log(req.body)

      await transaction.begin();

      const permitResult = await permitModel.createPermit(permitData, checkboxSelections, req.body.user.id, transaction);
      const jobPermitId = permitResult.JobPermitID;

      if (Array.isArray(checkboxSelections) && checkboxSelections.length > 0) {
        await permitModel.createPermitCheckboxes(jobPermitId, checkboxSelections, transaction);
      }

      await transaction.commit();
      res.status(201).json({
        message: 'Work permit created successfully',
        jobPermitId: jobPermitId,
        checkboxCount: checkboxSelections?.length || 0,
        checkboxes: checkboxSelections
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating work permit:', error);
      res.status(500).json({
        message: 'Error creating work permit',
        error: error.message,
        details: {
          requestBody: req.body,
          checkboxSelections: req.body.checkboxSelections
        }
      });
    }
  },

  async getPermits(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      console.log('User object:', req.user); // Log full user object

      // Add null check for department
    const user = {
      ...req.user,
      departmentId: req.user.departmentId || null,
      roleId: req.user.roleId ? req.user.roleId.trim() : null
    };

      const queryResult = await permitModel.getPermitsByRole(req.user);

      console.log(queryResult.recordset)

      if (!queryResult || !queryResult.recordset) {
        return res.status(500).json({ message: 'Error retrieving permits' });
      }

      // Format the permits with their checkboxes
      const formattedPermits = {};
      queryResult.recordset.forEach(row => {
        if (!formattedPermits[row.JobPermitID]) {
          // Create new permit entry if it doesn't exist
          formattedPermits[row.JobPermitID] = {
            JobPermitID: row.JobPermitID,
            StartDate: row.StartDate,
            EndDate: row.EndDate,
            PermitDuration: row.PermitDuration,
            Department: row.Department,
            JobLocation: row.JobLocation,
            SubLocation: row.SubLocation,
            LocationDetail: row.LocationDetail,
            JobDescription: row.JobDescription,
            PermitReceiver: row.PermitReceiver,
            ContractType: row.ContractType,
            ContractCompanyName: row.ContractCompanyName,
            Status: row.Status,
            Created: row.Created,
            Changed: row.Changed,
            IssuerName: row.IssuerName,
            IssuerDepartment: row.IssuerDepartment,
            AssignedTo: row.AssignedTo,
            checkboxes: []
          };
        }

        // Add checkbox data if it exists
        if (row.SectionItemID) {
          formattedPermits[row.JobPermitID].checkboxes.push({
            sectionItemId: row.SectionItemID,
            sectionName: row.SectionName,
            label: row.ItemLabel,
            selected: row.Selected === 1,
            textInput: row.TextInput
          });
        }
      });

      res.json({ 
        permits: Object.values(formattedPermits),
        userRole: req.user.roleId ? req.user.roleId.trim() : null,
        userDepartment: req.user.departmentId ? req.user.departmentId.trim() : null
      });
      
    } catch (error) {
      console.error('Error in getPermits controller:', error);
      res.status(500).json({ 
        message: 'Error fetching permits',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  async getPermitsByDepartment(req, res) {
    try {
      const { departmentId } = req.params;
      const permits = await permitModel.getPermitsByDepartment(departmentId);
      
      res.json({ 
        permits,
        success: true 
      });
    } catch (error) {
      console.error('Error fetching department permits:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch permits' 
      });
    }
  },

  async getPermitById(req, res) {
    const permitId = req.params.permitId;

    try {
      // Call the permitModel method to fetch the permit data
      const permit = await permitModel.getPermitById(permitId);

      if (!permit) {
        return res.status(404).json({ message: 'Permit not found' });
      }

      res.json(permit);
    } catch (error) {
      console.error('Error fetching permit:', error);
      res.status(500).json({ message: 'Error fetching permit', error: error.message });
    }
  },

  async approvePermit(req, res) {
    const pool = await poolPromise;
    const transaction = await pool.transaction();
  
    try {
      // Extract and validate required fields
      const { jobPermitId, status, comments } = req.body;
      
      // Input validation
      if (!jobPermitId || !status) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields: jobPermitId and status are required' 
        });
      }
  
      // Validate user authentication
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not authenticated' 
        });
      }

      await transaction.begin();
      
      // Get current permit details to check AssignedTo
      const permitResult = await permitModel.getPermitById(jobPermitId);
      
      if (!permitResult || !permitResult.permit) {
        await transaction.rollback();
        return res.status(404).json({ 
          success: false, 
          message: 'Permit not found' 
        });
      }
      
      // Extract AssignedTo from permit
      const { AssignedTo } = permitResult.permit;

      // Validate that the user has permission for this approval stage
      const userRole = req.user.role.trim();
      if (
        (AssignedTo === 'ISS' && userRole !== 'ISS') ||
        (AssignedTo === 'HOD' && userRole !== 'HOD') ||
        (AssignedTo === 'QA' && userRole !== 'QA')
      ) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: 'User does not have permission to approve this stage'
        });
      }
  
      // Process the approval
      const rowsAffected = await permitModel.approvePermit(
        jobPermitId,
        AssignedTo,
        status,
        comments || null,
        req.user.userId,
        transaction
      );
  
      if (rowsAffected === 0) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Permit not found or no updates were made'
        });
      }
  
      await transaction.commit();

      // Determine next stage for response message
      const nextStageMap = {
        'ISS': 'HOD',
        'HOD': 'QHSSE',
        'QA': null
      };
      
      const nextStage = status === 'Approved' ? nextStageMap[AssignedTo] : null;
      const responseMessage = status === 'Approved' 
        ? (nextStage 
            ? `Permit approved successfully. Forwarded to ${nextStage} for review.`
            : 'Permit approved successfully. Process complete.')
        : 'Permit rejected successfully.';
  
      res.json({ 
        success: true,
        message: responseMessage,
        status,
        previousStage: AssignedTo,
        nextStage: nextStage
      });

    } catch (error) {
      // Ensure transaction rollback on error
      if (transaction && transaction._begun) {
        await transaction.rollback();
      }

      console.error('Error processing permit approval:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error processing permit approval',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? {
          requestBody: req.body,
          errorStack: error.stack
        } : undefined
      });
    }
  },


  // PERMIT TO WORK  -- SECOND PHASE
  async createPermitToWork(req, res) {
    const pool = await poolPromise;
    const transaction = await pool.transaction();

    try {
      const { jobPermitId, ...permitData } = req.body;

      // Start transaction only once
      await transaction.begin();

      // Validate job permit using the model
      const jobPermit = await permitModel.validateJobPermit(jobPermitId, transaction);

      if (!jobPermit) {
        await transaction.rollback();
        return res.status(404).json({ 
          message: 'Referenced Job Permit not found' 
        });
      }

      if (jobPermit.Status !== 'Approved') {
        await transaction.rollback();
        return res.status(400).json({ 
          message: 'Cannot create Permit to Work for unapproved Job Permit' 
        });
      }

      // Validate entry and exit dates are within JobPermit date range
      const entryDate = new Date(permitData.entryDate);
      const exitDate = new Date(permitData.exitDate);
      const jobStartDate = new Date(jobPermit.StartDate);
      const jobEndDate = new Date(jobPermit.EndDate);
      
      if (entryDate < jobStartDate || exitDate > jobEndDate) {
        await transaction.rollback();
        return res.status(400).json({ 
          message: 'Entry and Exit dates must be within Job Permit date range' 
        });
      }

      // Validate work duration
      if (permitData.workDuration > 5) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Work duration cannot exceed 5 days'
        });
      }

      const result = await permitModel.createPermitToWork(
        { jobPermitId, ...permitData },
        req.user.userId,
        transaction
      );

      await transaction.commit();

      res.status(201).json({
        message: 'Permit to Work created successfully',
        permitToWorkId: result.PermitToWorkID
      });

    } catch (error) {
      // Only rollback if transaction was started
      if (transaction._begun) {
        await transaction.rollback();
      }
      console.error('Error creating permit to work:', error);
      res.status(500).json({
        message: 'Error creating permit to work',
        error: error.message
      });
    }
},

  async getPermitToWorkById(req, res) {
    try {
      const { permitToWorkId } = req.params;
      
      const permit = await permitModel.getPermitToWorkById(permitToWorkId);
      
      if (!permit) {
        return res.status(404).json({ message: 'Permit to Work not found' });
      }

      res.json(permit);
    } catch (error) {
      console.error('Error fetching permit to work:', error);
      res.status(500).json({ 
        message: 'Error fetching permit to work',
        error: error.message 
      });
    }
  },

  async approvePermitToWork(req, res) {
    const pool = await poolPromise;
    const transaction = await pool.transaction();

    try {
      const { permitToWorkId, status, comments } = req.body;

      if (!permitToWorkId || !status) {
        return res.status(400).json({ 
          message: 'Missing required fields: permitToWorkId and status are required' 
        });
      }

      if (!req.user || !req.user.userId) {
        return res.status(401).json({ 
          message: 'User not authenticated' 
        });
      }

      await transaction.begin();

      const permitResult = await permitModel.getPermitToWorkById(permitToWorkId);

      if (!permitResult) {
        await transaction.rollback();
        return res.status(404).json({ 
          message: 'Permit to Work not found' 
        });
      }

      const { AssignedTo } = permitResult;

      const userRole = req.user.role.trim();
      if (
        (AssignedTo === 'ISS' && userRole !== 'ISS') ||
        (AssignedTo === 'HOD' && userRole !== 'HOD') ||
        (AssignedTo === 'QA' && userRole !== 'QA')
      ) {
        await transaction.rollback();
        return res.status(403).json({
          message: 'User does not have permission to approve this stage'
        });
      }

      const rowsAffected = await permitModel.approvePermitToWork(
        permitToWorkId,
        AssignedTo,
        status,
        comments || null,
        req.user.userId,
        transaction
      );

      if (rowsAffected === 0) {
        await transaction.rollback();
        return res.status(404).json({
          message: 'Permit not found or no updates were made'
        });
      }

      await transaction.commit();

      const nextStageMap = {
        'ISS': 'HOD',
        'HOD': 'QHSSE',
        'QA': null
      };

      const nextStage = status === 'Approved' ? nextStageMap[AssignedTo] : null;
      const responseMessage = status === 'Approved'
        ? (nextStage
          ? `Permit to Work approved successfully. Forwarded to ${nextStage} for review.`
          : 'Permit to Work approved successfully. Process complete.')
        : 'Permit to Work rejected successfully.';

      res.json({
        message: responseMessage,
        status,
        previousStage: AssignedTo,
        nextStage: nextStage
      });

    } catch (error) {
      if (transaction && transaction._begun) {
        await transaction.rollback();
      }

      console.error('Error processing permit to work approval:', error);
      res.status(500).json({
        message: 'Error processing permit to work approval',
        error: error.message
      });
    }
  },

  async getPermitToWork(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const queryResult = await permitModel.getPermitToWorkByRole(req.user);

      if (!queryResult || !queryResult.recordset) {
        return res.status(500).json({ message: 'Error retrieving permits to work' });
      }

      res.json({ 
        permits: queryResult.recordset,
        userRole: req.user.roleId ? req.user.roleId.trim() : null,
        userDepartment: req.user.departmentId ? req.user.departmentId.trim() : null
      });
      
    } catch (error) {
      console.error('Error in getPermitToWork controller:', error);
      res.status(500).json({ 
        message: 'Error fetching permits to work',
        error: error.message
      });
    }
  },

  async updatePermitStatus(req, res) {
    const pool = await poolPromise;
    const transaction = await pool.transaction();

    try {
      const { permitId, status } = req.body;

      if (!permitId || !status) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      await transaction.begin();

      const rowsAffected = await permitModel.updatePermitStatus(permitId, status, req.user.userId, transaction);

      if (rowsAffected === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Permit not found' });
      }

      await transaction.commit();
      res.json({ message: 'Permit status updated successfully' });
    } catch (error) {
      await transaction.rollback();
      console.error('Error updating permit status:', error);
      res.status(500).json({ message: 'Error updating permit status' });
    }
  }
};

module.exports = permitController;