const { poolPromise } = require('../db');
const permitModel = require('../models/permitModel');
const notificationService = require('../services/emailService');

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
      const { checkboxSelections,riskAssessmentDocuments, ...permitData } = req.body;

      // Handle contract company name based on contract type
      if (permitData.contractType === 'Internal / MPS') {
        permitData.contractCompanyName = 'Meridian Port Services Ltd';
      }

      // console.log('Raw request body:', req.body);
      // console.log('Checkbox selections:', checkboxSelections);

      // console.log(req.body)

      await transaction.begin();

      // Add the documents back to permitData
      const permitDataWithDocs = {
        ...permitData,
        riskAssessmentDocuments
      };

      const permitResult = await permitModel.createPermit(permitDataWithDocs, checkboxSelections, req.body.user.id, transaction);
      const jobPermitId = permitResult.JobPermitID;

      if (Array.isArray(checkboxSelections) && checkboxSelections.length > 0) {
        await permitModel.createPermitCheckboxes(jobPermitId, checkboxSelections, transaction);
      }

      await transaction.commit();

       // Send email notification for permit creation after transaction is committed
    try {
      await notificationService.handlePermitCreated({
        permitId: jobPermitId,
        createdBy: req.body.user.name || 'System User', // Use consistent user reference
        createdByEmail: req.body.user.email,
        department: permitData.department,
        location: permitData.jobLocation,
        workDescription: permitData.jobDescription,
        startDate: permitData.startDate,
        endDate: permitData.endDate,
        permitType: 'JobPermit'
      });
    } catch (notificationError) {
      // Log notification error but don't fail the entire operation
      console.error('Failed to send notification, but permit was created:', notificationError);
    }

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
      // console.log('User object:', req.user); // Log full user object

      // Add null check for department
    const user = {
      ...req.user,
      departmentId: req.user.departmentId || null,
      roleId: req.user.roleId ? req.user.roleId.trim() : null
    };

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

      const queryResult = await permitModel.getPermitsByRole(req.user,page,limit);

      const totalCount = queryResult.recordset[0]?.TotalCount || 0;

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
        userDepartment: req.user.departmentId ? req.user.departmentId.trim() : null,
        pagination: {
          totalCount: totalCount, // Use the actual total count
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page
        }
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
      const result = await permitModel.getPermitById(permitId);
  
      if (!result) {
        return res.status(404).json({ 
          success: false, 
          message: 'Permit not found' 
        });
      }
  
      // Structure the response to match what the frontend expects
      const response = {
        success: true,
        data: {
          permit: result.permit,
          documents: result.documents || [],
          groupedCheckboxes: result.groupedCheckboxes || []
        }
      };
  
      res.json(response);
    } catch (error) {
      console.error('Error fetching permit:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching permit', 
        error: error.message 
      });
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

      const creatorEmail = await permitModel.getCreatorEmail(permitResult.Creator);
      const userDetails = await notificationService.handleStatusUpdate(
        jobPermitId,
        status,
        req.user,
        comments
      );
      
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

       // Send status update notification after commit
       try {
        const usersToNotify = await notificationService.getUsersToNotify({
          department: req.user.departmentId,
          permitType: 'JobPermit',
          createdByEmail: creatorEmail
        });
  
        await notificationService.sendNotification(
          usersToNotify,
          'permitStatusUpdate',
          userDetails,
          {
            permitId: jobPermitId,
            status: status,
            updatedBy: req.user.name,
            userRole: req.user.role,
            departmentName: req.user.departmentName || req.user.departmentId,
            comments: comments
          }
        );
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
      }

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

  async searchPermits(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Normalize search parameters
      const searchParams = {
        jobPermitId: req.query.jobPermitId,
        permitReceiver: req.query.permitReceiver,
        contractCompanyName: req.query.contractCompanyName,
        department: req.query.department,
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        changedStartDate: req.query.changedStartDate,
        changedEndDate: req.query.changedEndDate,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10
      };

      // Normalize user data
      const user = {
        userId: req.user.userId,
        roleId: req.user.roleId ? req.user.roleId.trim() : null,
        departmentId: req.user.departmentId ? req.user.departmentId.trim() : null
      };

      const result = await permitModel.searchPermits(searchParams, user);

      if (result.success) {
        // If the search was successful but returned no results
        if (result.data.length === 0) {
          return res.json({
            success: false,
            message: searchParams.jobPermitId ? 
              'Permit number not found' : 
              'No permits found matching your search criteria',
            data: [],
            total: 0,
            totalPages: 0,
            currentPage: searchParams.page
          });
        }

        res.json({
          success: true,
          data: result.data,
          total: result.total,
          totalPages: result.totalPages,
          currentPage: searchParams.page
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.error || 'An error occurred while searching permits'
        });
      }
    } catch (error) {
      console.error('Error in searchPermits controller:', error);
      res.status(500).json({
        success: false,
        error: error.message
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

      const isSameOrAfterDate = (date1, date2) => {
        const d1 = new Date(date1.setHours(0, 0, 0, 0));
        const d2 = new Date(date2.setHours(0, 0, 0, 0));
        return d1 >= d2;
      };
      
      if (!isSameOrAfterDate(entryDate, jobStartDate)) {
        await transaction.rollback();
        return res.status(400).json({ 
          message: 'Entry date cannot be earlier than Job Permit start date' 
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

      try {
        await notificationService.handlePermitToWorkCreated({
          permitId: result.PermitToWorkID,
          jobPermitId: permitData.jobPermitId,
          createdBy: req.user.name,
          createdByEmail: req.user.email,
          department: req.user.departmentName || req.user.departmentId,
          location: permitData.jobLocation || permitData.location,
          workDuration: permitData.workDuration,
          startDate: permitData.entryDate,
          endDate: permitData.exitDate,
          permitType: 'PermitToWork'
        });
      } catch (notificationError) {
        console.error('Failed to send PTW creation notification:', {
          permitId: result.PermitToWorkID,
          error: notificationError.message
        });
      }

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
    // console.log('Fetching PermitToWork for PermitToWorkID:', permitToWorkId); // Log the ID

    const result = await permitModel.getPermitToWorkById(permitToWorkId);
    // console.log('Fetched Data:', result); // Log the fetched data

    if (!result) {
      return res.status(404).json({ 
        success: false,
        message: 'Permit to Work not found' 
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching permit to work:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching permit to work',
      error: error.message 
    });
  }
},

async getPermitToWorkByJobPermitId(req, res) {
  try {
    const { jobPermitId } = req.params;
    
    const result = await permitModel.getPermitToWorkByJobPermitId(jobPermitId);
    
    if (!result) {
      return res.status(404).json({ 
        success: false,
        message: 'No Permit to Work found for this Job Permit' 
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching permit to work:', error);
    res.status(500).json({ 
      success: false,
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

    if (!permitResult || !permitResult.permit) { // Check for permitResult.permit
      await transaction.rollback();
      return res.status(404).json({ 
        message: 'Permit to Work not found' 
      });
    }

    // Get AssignedTo from the nested permit object
    const { AssignedTo } = permitResult.permit;

    // Get user details including department
    const userDetails = await notificationService.handleStatusUpdate(
      permitToWorkId,
      status,
      {
        ...req.user,
        name: `${req.user.firstName} ${req.user.lastName}`.trim() // Ensure we have the full name
      },
      comments
    );

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

    try {
      const permitDetails = await permitModel.getPermitToWorkById(permitToWorkId);
      const usersToNotify = await notificationService.getUsersToNotify({
        department: permitDetails.permit.Department,
        permitType: 'PermitToWork',
        createdByEmail: permitDetails.permit.CreatedByEmail
      });
  
      await notificationService.sendNotification(
        usersToNotify,
        'permitToWorkStatusUpdate',
        {
          permitId: permitToWorkId,
          jobPermitId: permitDetails.permit.JobPermitID,
          status: status,
          updatedBy: userDetails.updatedBy, // Use the name from userDetails
          userRole: userDetails.userRole,
          departmentName: userDetails.departmentName,
          assignedTo: AssignedTo,
          comments: comments,
          permitType: 'PermitToWork'
        }
      );
    } catch (notificationError) {
      console.error('Failed to send PTW approval notification:', {
        permitId: permitToWorkId,
        error: notificationError.message
      });
    }

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

  async searchPTW(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
  
      // Normalize search parameters
      const searchParams = {
        permitId: req.query.permitId,
        jobPermitId: req.query.jobPermitId,
        status: req.query.status,
        issuerStatus: req.query.issuerStatus,
        hodStatus: req.query.hodStatus,
        qhsseStatus: req.query.qhsseStatus,
        assignedTo: req.query.assignedTo,
        entryDate: req.query.entryDate,
        exitDate: req.query.exitDate,
        department: req.query.department,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10
      };
  
      // Normalize user data
      const user = {
        userId: req.user.userId,
        roleId: req.user.roleId ? req.user.roleId.trim() : null,
        departmentId: req.user.departmentId ? req.user.departmentId.trim() : null
      };
  
      const result = await permitModel.searchPTW(searchParams, user);
  
      if (result.success) {
        // If the search was successful but returned no results
        if (result.data.length === 0) {
          return res.json({
            success: false,
            message: searchParams.permitId || searchParams.jobPermitId ? 
              'Permit not found' : 
              'No permits found matching your search criteria',
            data: [],
            total: 0,
            totalPages: 0,
            currentPage: searchParams.page
          });
        }
  
        res.json({
          success: true,
          data: result.data,
          total: result.total,
          totalPages: result.totalPages,
          currentPage: searchParams.page
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.error || 'An error occurred while searching permits'
        });
      }
    } catch (error) {
      console.error('Error in searchPTW controller:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async completePermitToWork(req, res) {
    const { permitToWorkId } = req.params;
    const { stage, remarks } = req.body;

    try {
      if (!permitToWorkId || !stage) {
        return res.status(400).json({ 
          success: false, 
          message: 'Permit ID and completion stage are required' 
        });
      }

      // Add authentication check
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ 
          success: false,
          message: 'User not authenticated' 
        });
      }

      const pool = await poolPromise;
      const transaction = await pool.transaction();
      
      try {
        await transaction.begin();

        // Verify permit status using the model
        const permit = await permitModel.verifyPermitStatus(permitToWorkId, transaction);

        if (!permit) {
          throw new Error('Permit not found');
        }

        if (permit.IsRevoked) {
          throw new Error('Cannot complete a revoked permit');
        }

        // Validate based on completion stage
        if (stage === 'ISS') {
          if (permit.Status !== 'Approved') {
            throw new Error('Permit must be fully approved before completion');
          }
          
          if (permit.IssuerCompletionStatus === 'Completed') {
            throw new Error('Issuer has already completed this permit');
          }

          // Check if user has Issuer role
          if (req.user.role !== 'ISS') {
            throw new Error('Only Issuers can complete this stage');
          }
        } else if (stage === 'QA') {
          if (permit.IssuerCompletionStatus !== 'Completed') {
            throw new Error('Issuer must complete the permit first');
          }
          
          if (permit.QHSSECompletionStatus === 'Completed') {
            throw new Error('QHSSE has already completed this permit');
          }

          if (!remarks) {
            throw new Error('Completion comments are required for QHSSE completion');
          }

          // Check if user has QA role
          if (req.user.role !== 'QA') {
            throw new Error('Only QHSSE can complete this stage');
          }
        } else {
          throw new Error('Invalid completion stage');
        }

        // Process the completion
        await permitModel.completePermitToWork(
          permitToWorkId,
          { stage, remarks },
          req.user.userId, // Pass the authenticated user's ID
          transaction
        );

        await transaction.commit();

        try {
          const permitDetails = await permitModel.getPermitToWorkById(permitToWorkId);
          await notificationService.sendNotification(
            await notificationService.getUsersToNotify({
              department: permitDetails.permit.Department,
              permitType: 'PermitToWork'
            }),
            'permitToWorkCompleted',
            {
              permitId: permitToWorkId,
              completedBy: req.user.name,
              stage: stage,
              remarks: remarks || 'No remarks provided',
              remarksSection: remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ''
            }
          );
        } catch (notificationError) {
          console.error('Failed to send PTW completion notification:', {
            permitId: permitToWorkId,
            error: notificationError.message
          });
        }

        res.json({
          success: true,
          message: `Permit successfully completed by ${stage === 'ISS' ? 'Issuer' : 'QHSSE'}`
        });

      } catch (error) {
        if (transaction._begun) {
          await transaction.rollback();
        }
        throw error;
      }

    } catch (error) {
      console.error('Error in completePermitToWork:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to complete permit'
      });
    }
},



//PERMIT REVOCATION PHASE
async initiateRevocation(req, res) {
  const pool = await poolPromise;
  const transaction = await pool.transaction();

  try {
    const { permits, reason } = req.body;
    
    if (!permits || !permits.length || !reason) {
      return res.status(400).json({ 
        message: 'Permits and reason are required' 
      });
    }

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ 
        message: 'User not authenticated' 
      });
    }

    // Check user permission
    const hasPermission = await permitModel.checkUserPermissionForRevocation(
      req.user.userId,
      req.user.role
    );

    if (!hasPermission) {
      return res.status(403).json({
        message: 'User does not have permission to initiate revocation'
      });
    }

    await transaction.begin();

    const results = await Promise.all(permits.map(async permit => {
      if (permit.type === 'job') {
        return permitModel.initiateJobPermitRevocation(
          permit.id,
          reason,
          req.user.userId,
          transaction
        );
      } else {
        return permitModel.initiatePermitToWorkRevocation(
          permit.id,
          reason,
          req.user.userId,
          transaction
        );
      }
    }));

    // Check if all operations were successful
    if (results.some(result => result === 0)) {
      await transaction.rollback();
      return res.status(404).json({
        message: 'One or more permits not found or already revoked'
      });
    }

    await transaction.commit();

    // Send revocation notifications after commit
    try {
      for (const permit of permits) {
        await notificationService.sendNotification(
          await notificationService.getUsersToNotify({
            department: req.user.departmentId,
            permitType: permit.type === 'job' ? 'JobPermit' : 'PermitToWork'
          }),
          'permitStatusUpdate',
          {
            permitId: permit.id,
            status: 'Revocation Initiated',
            updatedBy: req.user.name,
            comments: reason
          }
        );
      }
    } catch (notificationError) {
      console.error('Failed to send revocation notification:', {
        permits: permits.map(p => ({ id: p.id, type: p.type })),
        error: notificationError.message,
        stack: notificationError.stack,
        userData: {
          name: req.user.name,
          department: req.user.departmentId
        }
      });
    }

    const isQHSSE = req.user.role === 'QA';
    res.json({
      message: isQHSSE ? 
        'Selected permits have been revoked' : 
        'Revocation request has been initiated and pending QHSSE approval'
    });

  } catch (error) {
    if (transaction._begun) {
      await transaction.rollback();
    }
    console.error('Error initiating revocation:', error);
    res.status(500).json({
      message: 'Error initiating revocation',
      error: error.message
    });
  }
},

async getPendingRevocations(req, res) {
  const pool = await poolPromise;
  
  try {
    if (!req.user || !req.user.userId || req.user.role !== 'QA') {
      return res.status(403).json({ 
        message: 'Only QHSSE/QA users can view pending revocations' 
      });
    }

    // Query both JobPermits and PermitToWork tables for pending revocations
    const result = await pool.request().query(`
      -- Get Job Permits pending revocation
      SELECT 
        'job' as type,
        jp.JobPermitID as id,
        jp.JobDescription,
        jp.Department,
        jp.JobLocation,
        jp.Status,
        jp.RevocationInitiatedDate,
        jp.RevocationReason,
        u.UserName as InitiatedBy
      FROM JobPermits jp
      LEFT JOIN Users u ON jp.RevocationInitiatedBy = u.UserID
      WHERE jp.Status = 'Revocation Pending'

      UNION ALL

      -- Get Permit to Work records pending revocation
      SELECT 
        'work' as type,
        ptw.PermitToWorkID as id,
        jp.JobDescription,
        jp.Department,
        jp.JobLocation,
        ptw.Status,
        ptw.RevocationInitiatedDate,
        ptw.RevocationReason,
        u.UserName as InitiatedBy
      FROM PermitToWork ptw
      JOIN JobPermits jp ON ptw.JobPermitID = jp.JobPermitID
      LEFT JOIN Users u ON ptw.RevocationInitiatedBy = u.UserID
      WHERE ptw.Status = 'Revocation Pending'
      ORDER BY RevocationInitiatedDate DESC
    `);

    res.json(result.recordset);

  } catch (error) {
    console.error('Error fetching pending revocations:', error);
    res.status(500).json({
      message: 'Error fetching pending revocations',
      error: error.message
    });
  }
},

async approveRevocation(req, res) {
  const pool = await poolPromise;
  const transaction = await pool.transaction();

  try {
    const { permits, status, comments } = req.body;

    if (!permits || !permits.length || !status) {
      return res.status(400).json({ 
        message: 'Permits and status are required' 
      });
    }

    if (!req.user || !req.user.userId || req.user.role !== 'QA') {
      return res.status(403).json({ 
        message: 'Only QHSSE/QA users can approve revocations' 
      });
    }

    await transaction.begin();

    try {
      await Promise.all(permits.map(async permit => {
        return permitModel.approveRevocation(
          permit.id,
          permit.type === 'job',
          status,
          comments,
          req.user.userId,
          transaction
        );
      }));

      await transaction.commit();

      try {
        await Promise.all(permits.map(async permit => {
          const permitDetails = permit.type === 'job' 
            ? await permitModel.getPermitById(permit.id)
            : await permitModel.getPermitToWorkById(permit.id);
            
          await notificationService.sendNotification(
            await notificationService.getUsersToNotify({
              department: permitDetails.Department,
              permitType: permit.type === 'job' ? 'JobPermit' : 'PermitToWork'
            }),
            'permitRevoked',
            {
              permitId: permit.id,
              permitType: permit.type === 'job' ? 'Job Permit' : 'Permit to Work',
              status: status,
              approvedBy: req.user.name,
              comments: comments,
              permitUrlPath: permit.type === 'job' ? 'permits' : 'permits/ptw'
            }
          );
        }));
      } catch (notificationError) {
        console.error('Failed to send revocation notification:', {
          permits: permits.map(p => ({ id: p.id, type: p.type })),
          error: notificationError.message
        });
      }

      const statusMessage = status === 'Approved' 
        ? 'Permit has been revoked successfully'
        : 'Revocation request has been rejected, permit restored to approved state';

      res.json({
        message: statusMessage
      });

    } catch (error) {
      await transaction.rollback();
      
      if (error.message.includes('not in a valid state')) {
        return res.status(400).json({
          message: 'Permit is not in a valid state for revocation'
        });
      }
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          message: 'Permit not found'
        });
      }

      throw error; // Re-throw other errors to be caught by outer catch block
    }

  } catch (error) {
    console.error('Error processing revocation:', error);
    res.status(500).json({
      message: 'Error processing revocation',
      error: error.message
    });
  }
}

};

module.exports = permitController;