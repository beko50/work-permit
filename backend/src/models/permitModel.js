const { poolPromise, sql } = require('../db');

const permitModel = {
  async getCreatorEmail(creatorId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('creatorId', sql.Int, creatorId)
      .query(`
        SELECT Email
        FROM Users
        WHERE UserID = @creatorId
      `);
    
    return result.recordset[0]?.Email;
  },

  async getFormSections() {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT 
          fs.SectionID,
          fs.SectionName,
          si.SectionItemID,
          si.ItemLabel,
          si.ItemDisplaySequence,
          si.AllowTextInput
        FROM FormSections fs
        LEFT JOIN SectionItems si ON fs.SectionID = si.SectionID
        ORDER BY fs.SectionID, si.ItemDisplaySequence
      `);
    return result.recordset;
  },

  async createPermit(permitData, checkboxSelections, userId, transaction) {
    const riskAssessmentDoc = permitData.riskAssessmentDocument;

    console.log(userId)
    // Ensure contractCompanyName is never NULL for Internal/MPS
    const contractCompanyName = (permitData.contractType === 'Internal / MPS')
      ? 'Meridian Port Services Ltd'
      : permitData.contractCompanyName;

    const permitResult = await transaction.request()
      .input('startDate', sql.DateTime, new Date(permitData.startDate))
      .input('endDate', sql.DateTime, new Date(permitData.endDate))
      .input('permitDuration', sql.Int, permitData.permitDuration)
      .input('department', sql.VarChar(100), permitData.department)
      .input('jobLocation', sql.VarChar(255), permitData.jobLocation)
      .input('subLocation', sql.VarChar(255), permitData.subLocation)
      .input('locationDetail', sql.VarChar(255), permitData.locationDetail)
      .input('jobDescription', sql.VarChar(255), permitData.jobDescription)
      .input('permitReceiver', sql.VarChar(100), permitData.permitReceiver)
      .input('contractType', sql.VarChar(50), permitData.contractType)
      .input('contractCompanyName', sql.VarChar(100), permitData.contractCompanyName)
      .input('staffId', sql.VarChar(50), permitData.staffID)
      .input('numberOfWorkers', sql.Int, permitData.numberOfWorkers)
      .input('workersNames', sql.VarChar(sql.MAX), permitData.workersNames)
      //.input('riskAssessmentDocument', sql.NVarChar(sql.MAX), riskAssessmentDoc)
      .query(`
        INSERT INTO JobPermits (
          StartDate, EndDate, PermitDuration, Department,
          JobLocation, SubLocation, LocationDetail,
          JobDescription, PermitReceiver, ContractType,
          ContractCompanyName, StaffID, NumberOfWorkers,
          WorkersNames, Creator, Created, Status
        )
        OUTPUT INSERTED.JobPermitID
        VALUES (
          @startDate, @endDate, @permitDuration, @department,
          @jobLocation, @subLocation, @locationDetail,
          @jobDescription, @permitReceiver, @contractType,
          @contractCompanyName, @staffId, @numberOfWorkers,
          @workersNames, ${userId}, GETDATE(), 'Pending'
        );
      `);

      const jobPermitId = permitResult.recordset[0].JobPermitID;

    // Then insert all documents if they exist
    if (permitData.riskAssessmentDocuments && permitData.riskAssessmentDocuments.length > 0) {
      for (const doc of permitData.riskAssessmentDocuments) {
        await transaction.request()
          .input('jobPermitId', sql.Int, jobPermitId)
          .input('fileName', sql.NVarChar(255), doc.fileName)
          .input('fileType', sql.NVarChar(100), doc.fileType)
          .input('fileData', sql.NVarChar(sql.MAX), doc.data)
          .query(`
            INSERT INTO JobPermitDocuments (
              JobPermitID, FileName, FileType, FileData
            )
            VALUES (
              @jobPermitId, @fileName, @fileType, @fileData
            );
          `);
      }
    }

    return permitResult.recordset[0];
  },

  async createPermitCheckboxes(jobPermitId, checkboxSelections, transaction) {
    for (const selection of checkboxSelections) {
      await transaction.request()
        .input('jobPermitId', sql.Int, jobPermitId)
        .input('sectionItemId', sql.Int, selection.sectionItemId)
        .input('selected', sql.Bit, selection.selected ? 1 : 0)
        .input('textInput', sql.NVarChar(sql.MAX), selection.textInput || null)
        .query(`
          INSERT INTO JobPermitCheckboxes (
            JobPermitID,
            SectionItemID,
            Selected,
            TextInput
          )
          VALUES (
            @jobPermitId,
            @sectionItemId,
            @selected,
            @textInput
          )
        `);
    }
  },

  async getPermitsByRole(user, page = 1, limit =10) {
    const pool = await poolPromise;
    const request = pool.request();
  
    let query = `
      SELECT 
        jp.*,
        u.FirstName + ' ' + u.LastName AS IssuerName,
        u.DepartmentID AS IssuerDepartment,
        u.RoleID,
        d.DepartmentName,
        COUNT(*) OVER() as TotalCount
      FROM JobPermits jp
      LEFT JOIN Users u ON u.UserID = jp.Creator
      LEFT JOIN Departments d ON RTRIM(u.DepartmentID) = RTRIM(d.DepartmentID)
      WHERE 1=1
    `;
  
    // Safely get trimmed values with null checks
    const userRole = user.role ? user.role.trim() : null;
    const userDepartmentId = user.departmentId ? user.departmentId.trim() : null;
  
    // For QA role - see permits assigned to QA and all Revocation Pending permits
    if (userRole === 'QA') {
      query += ` AND (jp.AssignedTo = 'QA' OR jp.Status = 'Revocation Pending')`;
    }
    // For QHSSE department with ISS role - see permits assigned to ISS
    else if (userDepartmentId === 'QHSSE' && userRole === 'ISS') {
      query += ` AND jp.AssignedTo = 'ISS' AND jp.Department = 'QHSSE'`;
    }
    // For QHSSE department with HOD role - see permits assigned to HOD
    else if (userDepartmentId === 'QHSSE' && userRole === 'HOD') {
      query += ` AND jp.AssignedTo = 'HOD' AND jp.Department = 'QHSSE'`;
    }
    // For QHSSE department with other roles - see all permits
    else if (userDepartmentId === 'QHSSE') {
      // No additional filtering needed for QHSSE with other roles
    }
    // For ISS role - see permits assigned to ISS and matching the user's department
    else if (userRole === 'ISS' && userDepartmentId) {
      query += ` AND jp.AssignedTo = 'ISS'
                 AND (
                   jp.Department = @departmentId OR
                   jp.Department IN (
                     SELECT DepartmentName 
                     FROM Departments 
                     WHERE DepartmentID = @departmentId
                   )
                 )`;
      request.input('departmentId', sql.VarChar(50), userDepartmentId);
    }
    // For HOD - see permits assigned to HOD and matching the user's department
    else if (userRole === 'HOD' && userDepartmentId) {
      query += ` AND jp.AssignedTo = 'HOD'
                 AND (
                   jp.Department = @departmentId OR
                   jp.Department IN (
                     SELECT DepartmentName 
                     FROM Departments 
                     WHERE DepartmentID = @departmentId
                   )
                 )`;
      request.input('departmentId', sql.VarChar(50), userDepartmentId);
    }
    // For ASM, OPS, and IT users - see permits for their department
    else if (userDepartmentId && (userDepartmentId === 'ASM' || userDepartmentId === 'OPS' || userDepartmentId === 'IT')) {
      // Check if the user is a Permit Receiver role
      if (userRole === 'RCV') {
        // Internal Permit Receivers should only see permits they created
        query += ` AND jp.Creator = @userId`;
        request.input('userId', sql.Int, user.userId);
      } else {
        // Other department users see all department permits
        query += ` AND (
          jp.Department = @departmentId OR
          jp.Department IN (
            SELECT DepartmentName 
            FROM Departments 
            WHERE DepartmentID = @departmentId
          )
        )`;
        request.input('departmentId', sql.VarChar(50), userDepartmentId);
      }
    }
    // For RCV users - only see permits they created (both internal and external)
    else if (userRole === 'RCV') {
      query += ` AND jp.Creator = @userId`;
      request.input('userId', sql.Int, user.userId);
    }
    // For other users - only see permits they submitted
    else {
      query += ` AND jp.Creator = @userId`;
      request.input('userId', sql.Int, user.userId);
    }
  
    // Add pagination
    const offset = (page - 1) * limit;
    query += ` 
      ORDER BY jp.Created DESC
      OFFSET ${offset} ROWS
      FETCH NEXT ${limit} ROWS ONLY
    `;
  
    return await request.query(query);
  },

  async getPermitsByDepartment(departmentId) {
    const pool = await poolPromise;
    const request = pool.request();
  
    const query = `
      SELECT 
        jp.*,
        u.FirstName + ' ' + u.LastName AS IssuerName,
        u.DepartmentID AS IssuerDepartment
      FROM JobPermits jp
      LEFT JOIN Users u ON u.UserID = jp.Creator
      LEFT JOIN Departments d ON (
        jp.Department = d.DepartmentName OR 
        jp.Department = d.DepartmentID
      )
      WHERE d.DepartmentID = @departmentId OR d.DepartmentName = @departmentId
      ORDER BY jp.Created DESC
    `;
  
    const result = await request.input('departmentId', sql.VarChar(50), departmentId)
      .query(query);
  
    return result.recordset;
  },

  async searchPermits(searchParams, user) {
    const pool = await poolPromise;
    const request = pool.request();
  
    try {
      let query = `
        SELECT 
          p.*,
          CONCAT(u.FirstName, ' ', u.LastName) as CreatorName,
          u.DepartmentID as CreatorDepartment,
          d.DepartmentName,
          COUNT(*) OVER() as TotalCount
        FROM JobPermits p
        LEFT JOIN Users u ON p.Creator = u.UserID
        LEFT JOIN Departments d ON RTRIM(u.DepartmentID) = RTRIM(d.DepartmentID)
        WHERE 1=1
      `;
  
      // Department-based filtering logic
    if (user.roleId === 'QA') {
      // QA sees all permits assigned to QA
      query += ` AND (p.AssignedTo = 'QA' OR p.Status = 'Revocation Pending')`;
    } else if (user.departmentId === 'QHSSE') {
      if (user.roleId === 'ISS') {
        // QHSSE Issuers see permits assigned to ISS and from QHSSE department
        query += ` AND p.AssignedTo = 'ISS' AND p.Department = 'QHSSE'`;
      } else if (user.roleId === 'HOD') {
        // QHSSE HODs see permits assigned to HOD and from QHSSE department
        query += ` AND p.AssignedTo = 'HOD' AND p.Department = 'QHSSE'`;
      }
      // Other QHSSE roles see all permits (no filter)
    } else if (user.departmentId === 'ASM' || user.departmentId === 'OPS' || user.departmentId === 'IT') {
        // ASM, OPS, and IT see their department permits
        query += ` AND (
          p.Department = @departmentId 
          OR p.Department IN (
            SELECT DepartmentName 
            FROM Departments 
            WHERE DepartmentID = @departmentId
          )
        )`;
        request.input('departmentId', sql.VarChar(50), user.departmentId);
      } else {
        // Other users only see their own permits
        query += ` AND p.Creator = @userId`;
        request.input('userId', sql.Int, user.userId);
      }
  
      // Add search filters
      if (searchParams.jobPermitId) {
        query += ` AND p.JobPermitID = @jobPermitId`;
        request.input('jobPermitId', sql.VarChar(50), searchParams.jobPermitId);
      }
  
      if (searchParams.permitReceiver) {
        query += ` AND p.PermitReceiver LIKE @permitReceiver`;
        request.input('permitReceiver', sql.VarChar(100), `%${searchParams.permitReceiver}%`);
      }
  
      if (searchParams.contractCompanyName) {
        query += ` AND p.ContractCompanyName LIKE @contractCompanyName`;
        request.input('contractCompanyName', sql.VarChar(100), `%${searchParams.contractCompanyName}%`);
      }
  
      if (searchParams.status) {
        query += ` AND p.Status = @status`;
        request.input('status', sql.VarChar(50), searchParams.status);
      }
  
      if (searchParams.changedStartDate) {
        query += ` AND CAST(p.Changed AS DATE) >= @changedStartDate`;
        request.input('changedStartDate', sql.Date, new Date(searchParams.changedStartDate));
      } else if (searchParams.startDate) {
        query += ` AND CAST(p.Created AS DATE) >= @startDate`;
        request.input('startDate', sql.Date, new Date(searchParams.startDate));
      }
  
      if (searchParams.changedEndDate) {
        query += ` AND CAST(p.Changed AS DATE) <= @changedEndDate`;
        request.input('changedEndDate', sql.Date, new Date(searchParams.changedEndDate));
      } else if (searchParams.endDate) {
        query += ` AND CAST(p.Created AS DATE) <= @endDate`;
        request.input('endDate', sql.Date, new Date(searchParams.endDate));
      }

      // Add department filter if provided
      if (searchParams.department) {
        query += ` AND 
          p.Department IN (
            SELECT DepartmentName 
            FROM Departments 
            WHERE DepartmentID = @filterDepartment
          )
        `;
        request.input('filterDepartment', sql.VarChar(50), searchParams.department);
      }
  
      // Add sorting and pagination
      const offset = (searchParams.page - 1) * searchParams.limit;
      query += `
        ORDER BY 
          CASE WHEN p.Changed IS NULL THEN 1 ELSE 0 END, -- Put NULL Changed values (new permits) first
          p.Changed DESC, -- Then sort by Changed date descending
          p.Created DESC -- For ties or all NULL Changed values, sort by Created date
        OFFSET ${offset} ROWS
        FETCH NEXT ${searchParams.limit} ROWS ONLY
      `;
  
      console.log('Executing query with params:', {
        user,
        searchParams,
        query
      });
  
      const result = await request.query(query);
      const totalCount = result.recordset[0]?.TotalCount || 0;
  
      return {
        success: true,
        data: result.recordset,
        total: totalCount,
        totalPages: Math.ceil(totalCount / searchParams.limit),
        currentPage: searchParams.page
      };
    } catch (error) {
      console.error('Error in searchPermits:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

async getPermitById(permitId) {
  const pool = await poolPromise;

  try {
    const result = await pool.request()
      .input('permitId', sql.Int, parseInt(permitId))
      .query(`
        -- Fetch permit details with approver names
        SELECT 
          p.JobPermitID,
          p.StartDate,
          p.EndDate,
          p.PermitDuration,
          p.Department,
          p.JobLocation,
          p.SubLocation,
          p.LocationDetail,
          p.JobDescription,
          p.PermitReceiver,
          p.ContractType,
          p.ContractCompanyName,
          p.StaffID,
          p.NumberOfWorkers,
          p.WorkersNames,
          p.Created,
          p.Status,
          p.Creator,
          p.Changed,
          p.Changer,
          p.AssignedTo,
          p.IssuerStatus,
          p.HODStatus,
          p.QHSSEStatus,
          -- New columns
          p.IssuerComments,
          p.IssuerApprovedBy,
          p.IssuerApprovedDate,
          p.HODComments,
          p.HODApprovedBy,
          p.HODApprovedDate,
          p.QHSSEComments,
          p.QHSSEApprovedBy,
          p.QHSSEApprovedDate,
          -- Revocation data
          p.RevocationInitiatedBy,
          p.RevocationInitiatedDate,
          p.RevocationReason,
          p.RevocationApprovedBy,
          p.RevocationApprovedDate,
          p.RevocationComments,
          p.QHSSERevocationStatus,
          -- Get approver names
          CONCAT(issuer.FirstName, ' ', issuer.LastName) as IssuerApproverName,
          CONCAT(hod.FirstName, ' ', hod.LastName) as HODApproverName,
          CONCAT(qa.FirstName, ' ', qa.LastName) as QHSSEApproverName,
          -- Get revocation initiator name
          CONCAT(revInitiator.FirstName, ' ', revInitiator.LastName) as RevocationInitiatedByName,
          -- Get revocation approver name
          CONCAT(revApprover.FirstName, ' ', revApprover.LastName) as RevocationApprovedByName
        FROM JobPermits p
        LEFT JOIN Users issuer ON p.IssuerApprovedBy = issuer.UserID
        LEFT JOIN Users hod ON p.HODApprovedBy = hod.UserID
        LEFT JOIN Users qa ON p.QHSSEApprovedBy = qa.UserID
        LEFT JOIN Users revInitiator ON p.RevocationInitiatedBy = revInitiator.UserID
        LEFT JOIN Users revApprover ON p.RevocationApprovedBy = revApprover.UserID
        WHERE p.JobPermitID = @permitId;

        -- Fetch all documents for this permit
        SELECT 
          DocumentID,
          FileName,
          FileType,
          FileData,
          Created
        FROM JobPermitDocuments
        WHERE JobPermitID = @permitId;

        -- First, get all unique sections that have selected checkboxes
        SELECT DISTINCT
          fs.SectionID,
          fs.SectionName
        FROM JobPermitCheckboxes jb
        INNER JOIN SectionItems si ON jb.SectionItemID = si.SectionItemID
        INNER JOIN FormSections fs ON fs.SectionID = si.SectionID
        WHERE jb.JobPermitID = @permitId 
        AND jb.Selected = 1
        ORDER BY fs.SectionID;

        -- Then get all selected checkboxes with their details
        SELECT 
          jb.JobPermitID,
          fs.SectionID,
          fs.SectionName,
          si.ItemLabel,
          jb.SectionItemID,
          jb.Selected,
          jb.TextInput
        FROM JobPermitCheckboxes jb
        INNER JOIN SectionItems si ON jb.SectionItemID = si.SectionItemID
        INNER JOIN FormSections fs ON fs.SectionID = si.SectionID
        WHERE jb.JobPermitID = @permitId 
        AND jb.Selected = 1
        ORDER BY fs.SectionID;
      `);

      if (result.recordset.length === 0) {
        return { permit: null, documents: [], groupedCheckboxes: [] };
      }

     // Process documents
    const documents = result.recordsets[1].map(doc => ({
      id: doc.DocumentID,
      fileName: doc.FileName,
      fileType: doc.FileType,
      fileData: doc.FileData,
      created: doc.Created
    }));

    // Group checkboxes by section
    // recordsets[2] contains sections, recordsets[3] contains checkboxes
    const sections = result.recordsets[2];
    const checkboxes = result.recordsets[3];
    
    const groupedCheckboxes = sections.map(section => ({
      sectionId: section.SectionID,
      sectionName: section.SectionName,
      items: checkboxes.filter(checkbox => 
        checkbox.SectionID === section.SectionID
      ).map(checkbox => ({
        itemLabel: checkbox.ItemLabel,
        sectionItemId: checkbox.SectionItemID,
        textInput: checkbox.TextInput
      }))
    }));
    
    return { 
      permit: result.recordset[0], 
      documents,
      groupedCheckboxes
    };
  } catch (error) {
    console.error('Error fetching permit and checkboxes:', error);
    throw error;
  }
},

async approvePermit(jobPermitId, assignedTo, status, comments, userId, transaction) {
  if (!userId) {
    throw new Error('User ID is required for approval');
  }

  // First validate that the nextApprover exists in the Roles table
  const nextApproverMapping = {
    'ISS': 'HOD',
    'HOD': 'QA',
    'QA': 'COMPLETED'
  };

  // Map the AssignedTo value to the correct status and comment columns
  const columnMap = {
    'ISS': {
      status: 'IssuerStatus',
      comments: 'IssuerComments',
      approvedBy: 'IssuerApprovedBy',
      approvedDate: 'IssuerApprovedDate'
    },
    'HOD': {
      status: 'HODStatus',
      comments: 'HODComments',
      approvedBy: 'HODApprovedBy',
      approvedDate: 'HODApprovedDate'
    },
    'QA': {
      status: 'QHSSEStatus',
      comments: 'QHSSEComments',
      approvedBy: 'QHSSEApprovedBy',
      approvedDate: 'QHSSEApprovedDate'
    }
  };

  const currentStageColumns = columnMap[assignedTo];
  
  // Calculate the next approver value
  const nextApprover = status === 'Approved' 
    ? nextApproverMapping[assignedTo] 
    : null;   // Set to null for rejections

  // If there's going to be a next approver, validate it exists in Roles table
  if (nextApprover && nextApprover !== 'COMPLETED') {
    const validRole = await transaction.request()
      .input('roleId', sql.VarChar(50), nextApprover)
      .query(`
        SELECT COUNT(*) as count 
        FROM Roles 
        WHERE RoleID = @roleId
      `);
    
    if (validRole.recordset[0].count === 0) {
      throw new Error(`Invalid next approver role: ${nextApprover}`);
    }
  }

  // Proceed with the update only if the role validation passed
  const result = await transaction.request()
    .input('jobPermitId', sql.Int, jobPermitId)
    .input('status', sql.VarChar(50), status)
    .input('assignedTo', sql.VarChar(50), assignedTo)
    .input('userId', sql.Int, userId)
    .input('comments', sql.NVarChar(sql.MAX), comments || '')
    .input('nextApprover', sql.VarChar(50), nextApprover)
    .query(`
      UPDATE JobPermits 
      SET
        ${currentStageColumns.status} = @status,
        ${currentStageColumns.comments} = @comments,
        ${currentStageColumns.approvedBy} = @userId,
        ${currentStageColumns.approvedDate} = GETDATE(),
        AssignedTo = CASE
          WHEN @status = 'Rejected' THEN NULL
          WHEN @status = 'Approved' AND @nextApprover = 'COMPLETED' THEN 'COMPLETED'
          WHEN @status = 'Approved' AND @nextApprover IS NOT NULL THEN @nextApprover
          ELSE AssignedTo
        END,
        Status = CASE
          WHEN @status = 'Rejected' THEN 'Rejected'
          WHEN @status = 'Approved' AND @nextApprover = 'COMPLETED' THEN 'Approved'
          ELSE Status
        END,
        Changed = GETDATE(),
        Changer = @userId
      WHERE JobPermitID = @jobPermitId
    `);

  return result.rowsAffected[0];
},


//PERMIT TO WORK FUNCTIONS  -- SECOND PHASE
async createPermitToWork(permitData, userId, transaction) {
  const permitResult = await transaction.request()
    .input('jobPermitId', sql.Int, permitData.jobPermitId)
    .input('entryDate', sql.DateTime, new Date(permitData.entryDate))
    .input('exitDate', sql.DateTime, new Date(permitData.exitDate))
    .input('workDuration', sql.Int, permitData.workDuration)
    .query(`
      INSERT INTO PermitToWork (
        JobPermitID,
        EntryDate,
        ExitDate,
        WorkDuration,
        Created,
        Status,
        Creator,
        AssignedTo
      )
      OUTPUT INSERTED.PermitToWorkID
      VALUES (
        @jobPermitId,
        @entryDate,
        @exitDate,
        @workDuration,
        GETDATE(),
        'Pending',
        ${userId},
        'ISS'
      );
    `);

  return permitResult.recordset[0];
},

async validateJobPermit(jobPermitId, transaction) {
  const jobPermitCheck = await transaction.request()
    .input('jobPermitId', sql.Int, jobPermitId)
    .query(`
      SELECT StartDate, EndDate, Status 
      FROM JobPermits 
      WHERE JobPermitID = @jobPermitId
    `);

  return jobPermitCheck.recordset[0];
},

async getPermitToWorkById(permitToWorkId) {
  const pool = await poolPromise;
  try {
    const result = await pool.request()
      .input('permitToWorkId', sql.Int, permitToWorkId)
      .query(`
        SELECT 
          ptw.*,
          jp.JobDescription,
          jp.JobLocation,
          jp.SubLocation,
          jp.LocationDetail,
          jp.Department,
          jp.ContractCompanyName,
          jp.PermitReceiver,
          jp.NumberOfWorkers,
          jp.WorkersNames,
          -- Approver names
          CONCAT(issuer.FirstName, ' ', issuer.LastName) as IssuerApproverName,
          CONCAT(hod.FirstName, ' ', hod.LastName) as HODApproverName,
          CONCAT(qa.FirstName, ' ', qa.LastName) as QHSSEApproverName,
          CONCAT(issuerCompleter.FirstName, ' ', issuerCompleter.LastName) as IssuerCompleterName,
          CONCAT(qaCompleter.FirstName, ' ', qaCompleter.LastName) as QHSSECompleterName,
          -- Revocation details
          CONCAT(revInitiator.FirstName, ' ', revInitiator.LastName) as RevocationInitiatedByName,
          CONCAT(revApprover.FirstName, ' ', revApprover.LastName) as RevocationApprovedByName
        FROM PermitToWork ptw
        INNER JOIN JobPermits jp ON ptw.JobPermitID = jp.JobPermitID
        LEFT JOIN Users issuer ON ptw.IssuerApprovedBy = issuer.UserID
        LEFT JOIN Users hod ON ptw.HODApprovedBy = hod.UserID
        LEFT JOIN Users qa ON ptw.QHSSEApprovedBy = qa.UserID
        LEFT JOIN Users issuerCompleter ON ptw.IssuerCompletedBy = issuerCompleter.UserID
        LEFT JOIN Users qaCompleter ON ptw.QHSSECompletedBy = qaCompleter.UserID
        LEFT JOIN Users revInitiator ON ptw.RevocationInitiatedBy = revInitiator.UserID
        LEFT JOIN Users revApprover ON ptw.RevocationApprovedBy = revApprover.UserID
        WHERE ptw.PermitToWorkID = @permitToWorkId
      `);
    
    if (result.recordset.length === 0) return null;

    const permit = result.recordset[0];
    
    return {
      permit: {
        PermitToWorkID: permit.PermitToWorkID,
        JobPermitID: permit.JobPermitID,
        EntryDate: permit.EntryDate,
        ExitDate: permit.ExitDate,
        WorkDuration: permit.WorkDuration,
        Status: permit.Status,
        CompletionStatus: permit.CompletionStatus,
        Created: permit.Created,
        AssignedTo: permit.AssignedTo,
        // Approval details
        IssuerStatus: permit.IssuerStatus,
        IssuerComments: permit.IssuerComments,
        IssuerApproverName: permit.IssuerApproverName,
        IssuerApprovedDate: permit.IssuerApprovedDate,
        HODStatus: permit.HODStatus,
        HODComments: permit.HODComments,
        HODApproverName: permit.HODApproverName,
        HODApprovedDate: permit.HODApprovedDate,
        QHSSEStatus: permit.QHSSEStatus,
        QHSSEComments: permit.QHSSEComments,
        QHSSEApproverName: permit.QHSSEApproverName,
        QHSSEApprovedDate: permit.QHSSEApprovedDate,
        // Revocation details
        RevocationInitiatedBy: permit.RevocationInitiatedBy,
        RevocationInitiatedByName: permit.RevocationInitiatedByName,
        RevocationInitiatedDate: permit.RevocationInitiatedDate,
        RevocationReason: permit.RevocationReason,
        RevocationApprovedBy: permit.RevocationApprovedBy,
        RevocationApprovedByName: permit.RevocationApprovedByName,
        RevocationApprovedDate: permit.RevocationApprovedDate,
        RevocationComments: permit.RevocationComments,
        QHSSERevocationStatus: permit.QHSSERevocationStatus,
        // Completion details
        IssuerCompletionStatus: permit.IssuerCompletionStatus,
        IssuerCompletionDate: permit.IssuerCompletionDate,
        IssuerCompleterName: permit.IssuerCompleterName,
        QHSSECompletionStatus: permit.QHSSECompletionStatus,
        QHSSECompletionDate: permit.QHSSECompletionDate,
        QHSSECompleterName: permit.QHSSECompleterName,
        QHSSECompletionComments: permit.QHSSECompletionComments
      },
      jobPermit: {
        JobDescription: permit.JobDescription,
        JobLocation: permit.JobLocation,
        SubLocation: permit.SubLocation,
        LocationDetail: permit.LocationDetail,
        Department: permit.Department,
        ContractCompanyName: permit.ContractCompanyName,
        PermitReceiver: permit.PermitReceiver,
        NumberOfWorkers: permit.NumberOfWorkers,
        WorkersNames: permit.WorkersNames
      }
    };
  } catch (error) {
    console.error('Error fetching permit to work:', error);
    throw error;
  }
},

async getPermitToWorkByJobPermitId(jobPermitId) {
  const pool = await poolPromise;

  try {
    const result = await pool.request()
      .input('jobPermitId', sql.Int, parseInt(jobPermitId))
      .query(`
        SELECT 
          ptw.*,
          -- Job Permit details
          jp.JobDescription,
          jp.JobLocation,
          jp.SubLocation,
          jp.LocationDetail,
          jp.Department,
          jp.ContractCompanyName,
          jp.PermitReceiver,
          jp.NumberOfWorkers,
          jp.WorkersNames,
          -- Approval details with approver names
          CONCAT(issuer.FirstName, ' ', issuer.LastName) as IssuerApproverName,
          CONCAT(hod.FirstName, ' ', hod.LastName) as HODApproverName,
          CONCAT(qa.FirstName, ' ', qa.LastName) as QHSSEApproverName
        FROM PermitToWork ptw
        INNER JOIN JobPermits jp ON ptw.JobPermitID = jp.JobPermitID
        LEFT JOIN Users issuer ON ptw.IssuerApprovedBy = issuer.UserID
        LEFT JOIN Users hod ON ptw.HODApprovedBy = hod.UserID
        LEFT JOIN Users qa ON ptw.QHSSEApprovedBy = qa.UserID
        WHERE ptw.JobPermitID = @jobPermitId
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    const permit = result.recordset[0];
    return {
      permit: {
        PermitToWorkID: permit.PermitToWorkID,
        JobPermitID: permit.JobPermitID,
        EntryDate: permit.EntryDate,
        ExitDate: permit.ExitDate,
        WorkDuration: permit.WorkDuration,
        Status: permit.Status,
        Created: permit.Created,
        AssignedTo: permit.AssignedTo,
        IssuerStatus: permit.IssuerStatus,
        IssuerComments: permit.IssuerComments,
        IssuerApproverName: permit.IssuerApproverName,
        IssuerApprovedDate: permit.IssuerApprovedDate,
        HODStatus: permit.HODStatus,
        HODComments: permit.HODComments,
        HODApproverName: permit.HODApproverName,
        HODApprovedDate: permit.HODApprovedDate,
        QHSSEStatus: permit.QHSSEStatus,
        QHSSEComments: permit.QHSSEComments,
        QHSSEApproverName: permit.QHSSEApproverName,
        QHSSEApprovedDate: permit.QHSSEApprovedDate
      },
      jobPermit: {
        JobDescription: permit.JobDescription,
        JobLocation: permit.JobLocation,
        SubLocation: permit.SubLocation,
        LocationDetail: permit.LocationDetail,
        Department: permit.Department,
        ContractCompanyName: permit.ContractCompanyName,
        PermitReceiver: permit.PermitReceiver,
        NumberOfWorkers: permit.NumberOfWorkers,
        WorkersNames: permit.WorkersNames
      }
    };
  } catch (error) {
    console.error('Error fetching permit to work:', error);
    throw error;
  }
},

async approvePermitToWork(permitToWorkId, assignedTo, status, comments, userId, transaction) {
  if (!userId) {
    throw new Error('User ID is required for approval');
  }

  const nextApproverMapping = {
    'ISS': 'HOD',
    'HOD': 'QA',
    'QA': 'COMPLETED'
  };

  const columnMap = {
    'ISS': {
      status: 'IssuerStatus',
      comments: 'IssuerComments',
      approvedBy: 'IssuerApprovedBy',
      approvedDate: 'IssuerApprovedDate'
    },
    'HOD': {
      status: 'HODStatus',
      comments: 'HODComments',
      approvedBy: 'HODApprovedBy',
      approvedDate: 'HODApprovedDate'
    },
    'QA': {
      status: 'QHSSEStatus',
      comments: 'QHSSEComments',
      approvedBy: 'QHSSEApprovedBy',
      approvedDate: 'QHSSEApprovedDate'
    }
  };

  const currentStageColumns = columnMap[assignedTo];
  const nextApprover = status === 'Approved' 
    ? nextApproverMapping[assignedTo] 
    : null;

  const result = await transaction.request()
    .input('permitToWorkId', sql.Int, permitToWorkId)
    .input('status', sql.VarChar(50), status)
    .input('assignedTo', sql.VarChar(50), assignedTo)
    .input('userId', sql.Int, userId)
    .input('comments', sql.NVarChar(sql.MAX), comments || '')
    .input('nextApprover', sql.VarChar(50), 
      nextApprover === 'COMPLETED' ? 'ONGOING' : nextApprover // Changed from null to 'ACTIVE'
    )
    .query(`
      UPDATE PermitToWork 
      SET
        ${currentStageColumns.status} = @status,
        ${currentStageColumns.comments} = @comments,
        ${currentStageColumns.approvedBy} = @userId,
        ${currentStageColumns.approvedDate} = GETDATE(),
        AssignedTo = CASE
          WHEN @status = 'Rejected' THEN 'REJECTED'
          WHEN @status = 'Approved' AND @nextApprover IS NOT NULL THEN @nextApprover
          WHEN @status = 'Approved' AND @assignedTo = 'QA' THEN 'ONGOING'    -- Changed from NULL to 'ONGOING'
          ELSE AssignedTo
        END,
        Status = CASE
          WHEN @status = 'Rejected' THEN 'Rejected'
          WHEN @assignedTo = 'QA' AND @status = 'Approved' THEN 'Approved'
          ELSE Status
        END,
        Changed = GETDATE(),
        Changer = @userId
      WHERE PermitToWorkID = @permitToWorkId
    `);

  return result.rowsAffected[0];
},

async getPermitToWorkByRole(user) {
  const pool = await poolPromise;
  const request = pool.request();
  
  let query = `
    SELECT ptw.*, jp.JobDescription, jp.JobLocation, jp.Department, jp.PermitReceiver, jp.ContractCompanyName,
    u.FirstName + ' ' + u.LastName AS IssuerName, u.DepartmentID AS IssuerDepartment
    FROM PermitToWork ptw
    INNER JOIN JobPermits jp ON ptw.JobPermitID = jp.JobPermitID
    LEFT JOIN Users u ON u.UserID = ptw.Creator
    WHERE 1=1
  `;

  // Get user role info and trim whitespace
  const userRoleInfo = await this.getUserRole(user.userId);
  const userRoleId = userRoleInfo ? userRoleInfo.RoleID.trim() : null;
  
  const userDepartmentId = user.departmentId ? user.departmentId.trim() : null;
  
  console.log(`Determined role for user ${user.userId}: '${userRoleId}', Department: ${userDepartmentId}`);
  
  // For QA role (QHS Approver) - can see ALL permits to work regardless of department
  // QA roles only exist in QHSSE department
  if (userRoleId === 'QA' && userDepartmentId === 'QHSSE') {
    // No additional filtering needed - QA sees all permits
    console.log(`QA role detected for user ${user.userId}. No department filtering applied.`);
  }
  // For ISS and HOD roles in QHSSE - they only see QHSSE department permits
  else if ((userRoleId === 'ISS' || userRoleId === 'HOD') && userDepartmentId === 'QHSSE') {
    request.input('departmentId', sql.VarChar(50), userDepartmentId);
    query += `
      AND (
        jp.Department = @departmentId 
        OR jp.Department IN (
          SELECT DepartmentName FROM Departments WHERE DepartmentID = @departmentId
        )
      )
    `;
    console.log(`Filtering for ${userRoleId} role in QHSSE department`);
  }
  // For all other departments and roles - see permits for their department only
  else if (userDepartmentId) {
    request.input('departmentId', sql.VarChar(50), userDepartmentId);
    query += `
      AND (
        jp.Department = @departmentId 
        OR jp.Department IN (
          SELECT DepartmentName FROM Departments WHERE DepartmentID = @departmentId
        )
      )
    `;
    console.log(`Filtering for role in department ${userDepartmentId}`);
  }
  // Regular users/receivers only see their own submissions
  else {
    request.input('userId', sql.Int, user.userId);
    query += ` AND ptw.Creator = @userId`;
    console.log(`Filtering for regular user ${user.userId}`);
  }

  // Log the full query and user info for debugging
  console.log(`User Role: '${userRoleId}', Department: ${userDepartmentId}`);
  console.log(`Generated SQL: ${query}`);
  
  query += ` ORDER BY ptw.Changed DESC, ptw.Created DESC`;
  
  return await request.query(query);
},

// Helper method to get the user's role from the database
async getUserRole(userId) {
  try {
    const pool = await poolPromise;
    const request = pool.request();
    request.input('userId', sql.Int, userId);
    
    // Use RTRIM to remove trailing spaces in the query itself
    const query = `
      SELECT RTRIM(r.RoleID) AS RoleID, r.RoleName
      FROM Users u
      JOIN Roles r ON RTRIM(u.RoleID) = RTRIM(r.RoleID)
      WHERE u.UserID = @userId
    `;
    
    const result = await request.query(query);
    
    if (result.recordset && result.recordset.length > 0) {
      // Also trim here for double protection
      const role = result.recordset[0];
      if (role.RoleID) {
        role.RoleID = role.RoleID.trim();
      }
      return role;
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting user role for user ${userId}:`, error);
    return null;
  }
},

async verifyPermitStatus(permitToWorkId, transaction) {
  const result = await transaction.request()
    .input('permitToWorkId', sql.Int, permitToWorkId)
    .query(`
      SELECT 
        Status,
        IssuerCompletionStatus,
        QHSSECompletionStatus,
        IsRevoked,
        CompletionStatus
      FROM PermitToWork 
      WHERE PermitToWorkID = @permitToWorkId
    `);

  return result.recordset[0];
},

async searchPTW(searchParams, user) {
  const pool = await poolPromise;
  const request = pool.request();

  try {
    let query = `
      SELECT 
        p.*,
        CONCAT(u.FirstName, ' ', u.LastName) as CreatorName,
        u.DepartmentID as CreatorDepartment,
        d.DepartmentName,
        jp.Department as JobPermitDepartment,
        COUNT(*) OVER() as TotalCount
      FROM PermitToWork p
      LEFT JOIN Users u ON p.Creator = u.UserID
      LEFT JOIN Departments d ON RTRIM(u.DepartmentID) = RTRIM(d.DepartmentID)
      LEFT JOIN JobPermits jp ON p.JobPermitID = jp.JobPermitID
      WHERE 1=1
    `;

    // Department-based filtering logic - aligned with searchPermits
    if (user.roleId === 'QA' || user.departmentId === 'QHSSE') {
      // QA and QHSSE see all permits
    } else if (user.departmentId === 'ASM' || user.departmentId === 'OPS' || user.departmentId === 'IT') {
      // ASM, OPS, and IT see their department permits
      query += ` AND (
        jp.Department = @departmentId 
        OR jp.Department IN (
          SELECT DepartmentName 
          FROM Departments 
          WHERE DepartmentID = @departmentId
        )
      )`;
      request.input('departmentId', sql.VarChar(50), user.departmentId);
    } else {
      // Other users only see their own permits
      query += ` AND p.Creator = @userId`;
      request.input('userId', sql.Int, user.userId);
    }

    // Add search filters
    if (searchParams.permitId) {
      query += ` AND p.PermitToWorkID = @permitId`;
      request.input('permitId', sql.Int, searchParams.permitId);
    }

    if (searchParams.jobPermitId) {
      query += ` AND p.JobPermitID = @jobPermitId`;
      request.input('jobPermitId', sql.VarChar(50), searchParams.jobPermitId);
    }

    if (searchParams.status) {
      query += ` AND p.Status = @status`;
      request.input('status', sql.VarChar(50), searchParams.status);
    }

    if (searchParams.issuerStatus) {
      query += ` AND p.IssuerStatus = @issuerStatus`;
      request.input('issuerStatus', sql.VarChar(50), searchParams.issuerStatus);
    }

    if (searchParams.hodStatus) {
      query += ` AND p.HODStatus = @hodStatus`;
      request.input('hodStatus', sql.VarChar(50), searchParams.hodStatus);
    }

    if (searchParams.qhsseStatus) {
      query += ` AND p.QHSSEStatus = @qhsseStatus`;
      request.input('qhsseStatus', sql.VarChar(50), searchParams.qhsseStatus);
    }

    if (searchParams.assignedTo) {
      query += ` AND p.AssignedTo = @assignedTo`;
      request.input('assignedTo', sql.VarChar(50), searchParams.assignedTo);
    }

    if (searchParams.entryDate) {
      query += ` AND CAST(p.EntryDate AS DATE) = @entryDate`;
      request.input('entryDate', sql.Date, new Date(searchParams.entryDate));
    }

    if (searchParams.exitDate) {
      query += ` AND CAST(p.ExitDate AS DATE) = @exitDate`;
      request.input('exitDate', sql.Date, new Date(searchParams.exitDate));
    }

    // Add department filter if provided
    if (searchParams.department) {
      query += ` AND (
        jp.Department = @filterDepartment 
        OR jp.Department IN (
          SELECT DepartmentName 
          FROM Departments 
          WHERE DepartmentID = @filterDepartment
        )
      )`;
      request.input('filterDepartment', sql.VarChar(50), searchParams.department);
    }

    // Add sorting and pagination
    const offset = (searchParams.page - 1) * searchParams.limit;
    query += `
      ORDER BY p.Created DESC
      OFFSET ${offset} ROWS
      FETCH NEXT ${searchParams.limit} ROWS ONLY
    `;

    console.log('Executing PTW search query:', {
      user,
      searchParams,
      query
    });

    const result = await request.query(query);
    const totalCount = result.recordset[0]?.TotalCount || 0;

    return {
      success: true,
      data: result.recordset,
      total: totalCount,
      totalPages: Math.ceil(totalCount / searchParams.limit),
      currentPage: searchParams.page
    };
  } catch (error) {
    console.error('Error in searchPTW:', error);
    return {
      success: false,
      error: error.message
    };
  }
},

  async completePermitToWork(permitToWorkId, completionData, userId, transaction) {
    const { stage, remarks } = completionData;

    if (!userId) {
      throw new Error('User ID is required for completion');
    }

    const columnMap = {
      'ISS': {
        status: 'IssuerCompletionStatus',
        date: 'IssuerCompletionDate',
        completedBy: 'IssuerCompletedBy'
      },
      'QA': {
        status: 'QHSSECompletionStatus',
        date: 'QHSSECompletionDate',
        completedBy: 'QHSSECompletedBy',
        comments: 'QHSSECompletionComments'
      }
    };

    const currentStageColumns = columnMap[stage];

    let query = `
      UPDATE PermitToWork 
      SET
        ${currentStageColumns.status} = 'Completed',
        ${currentStageColumns.date} = GETDATE(),
        ${currentStageColumns.completedBy} = @userId,
    `;

    if (stage === 'ISS') {
      // When Issuer completes, set overall status to 'Pending Completion'
      // and prepare for QA review
      query += `
        CompletionStatus = 'Pending Completion',
        QHSSECompletionStatus = 'Pending',
      `;
    } else if (stage === 'QA') {
      // When QA completes, set final completion status
      query += `
        CompletionStatus = CASE 
          WHEN @remarks LIKE '%reject%' OR @remarks LIKE '%revision%' THEN 'In Progress'
          ELSE 'Job Completed'
        END,
        ${currentStageColumns.comments} = @remarks,
      `;
    }

    query += `
        Changed = GETDATE(),
        Changer = @userId
      WHERE PermitToWorkID = @permitToWorkId
    `;

    const result = await transaction.request()
      .input('permitToWorkId', sql.Int, permitToWorkId)
      .input('userId', sql.Int, userId)
      .input('remarks', sql.NVarChar(sql.MAX), remarks || '')
      .input('stage', sql.VarChar(3), stage)
      .query(query);

    return result.rowsAffected[0];
  },

  /* async updatePermitStatus(permitId, status, changerId, transaction) {
    const result = await transaction.request()
      .input('permitId', sql.Int, permitId)
      .input('status', sql.VarChar(50), status)
      .input('changerId', sql.Int, changerId)
      .query(`
        UPDATE JobPermits
        SET Status = @status,
            Changed = GETDATE(),
            Changer = @changerId
        WHERE JobPermitID = @permitId;
      `);
    return result.rowsAffected[0];
  } */



//REVOCATION PROCESS
async checkUserPermissionForRevocation(userId, role) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT RoleID 
        FROM Users 
        WHERE UserID = @userId AND (RoleID = 'ISS' OR RoleID = 'QA')
      `);
    
    return result.recordset.length > 0;
  },
  
  async initiatePermitToWorkRevocation(permitToWorkId, reason, userId, transaction) {
    const result = await transaction.request()
      .input('permitToWorkId', sql.Int, permitToWorkId)
      .input('userId', sql.Int, userId)
      .input('reason', sql.NVarChar(sql.MAX), reason)
      .query(`
        UPDATE PermitToWork
        SET Status = CASE 
              WHEN (SELECT RoleID FROM Users WHERE UserID = @userId) = 'QA' 
              THEN 'Revoked'
              ELSE 'Revocation Pending'
            END,
            RevocationInitiatedBy = @userId,
            RevocationInitiatedDate = GETDATE(),
            RevocationReason = @reason,
            RevocationApprovedBy = CASE 
              WHEN (SELECT RoleID FROM Users WHERE UserID = @userId) = 'QA' 
              THEN @userId
              ELSE NULL
            END,
            RevocationApprovedDate = CASE 
              WHEN (SELECT RoleID FROM Users WHERE UserID = @userId) = 'QA' 
              THEN GETDATE()
              ELSE NULL
            END,
            Changed = GETDATE(),
            Changer = @userId
        WHERE PermitToWorkID = @permitToWorkId;
      `);
    
    return result.rowsAffected[0];
  },

  async initiateJobPermitRevocation(jobPermitId, reason, userId, transaction) {
    // First get the user's role
    const userRole = await transaction.request()
        .input('userId', sql.Int, userId)
        .query(`SELECT RoleID FROM Users WHERE UserID = @userId`);
    
    const isQHSSE = userRole.recordset[0]?.RoleID === 'QA';

    const result = await transaction.request()
        .input('jobPermitId', sql.Int, jobPermitId)
        .input('userId', sql.Int, userId)
        .input('reason', sql.NVarChar(sql.MAX), reason)
        .input('isQHSSE', sql.Bit, isQHSSE ? 1 : 0)  // Add this line
        .query(`
            UPDATE JobPermits 
            SET 
                Status = CASE 
                    WHEN @isQHSSE = 1 THEN 'Revoked' 
                    ELSE 'Revocation Pending' 
                END,
                RevocationInitiatedBy = @userId,
                RevocationInitiatedDate = GETDATE(),
                RevocationReason = @reason,
                Changed = GETDATE(),
                Changer = @userId
            WHERE JobPermitID = @jobPermitId;
        `);

    return result.rowsAffected[0];
},

async approveRevocation(permitId, isJobPermit, status, comments, userId, transaction) {
  if (isJobPermit) {
    // Job Permit revocation logic remains the same
    const result = await transaction.request()
      .input('permitId', sql.Int, permitId)
      .input('userId', sql.Int, userId)
      .input('status', sql.VarChar(50), status)
      .input('comments', sql.NVarChar(sql.MAX), comments)
      .query(`
        BEGIN TRANSACTION;
        
        -- Update the Job Permit
        UPDATE JobPermits
        SET Status = CASE 
              WHEN @status = 'Approved' THEN 'Revoked'     
              WHEN @status = 'Rejected' THEN 'Approved'    
              ELSE Status
            END,
            QHSSERevocationStatus = @status,              
            RevocationApprovedBy = @userId,
            RevocationApprovedDate = GETDATE(),
            RevocationComments = @comments,
            Changed = GETDATE(),
            Changer = @userId
        WHERE JobPermitID = @permitId;

        -- Update all related Permits to Work when approved
        IF @status = 'Approved'
        BEGIN
          UPDATE PermitToWork
          SET Status = 'Revoked',
              QHSSERevocationStatus = 'Approved',
              RevocationApprovedBy = @userId,
              RevocationApprovedDate = GETDATE(),
              RevocationComments = CONCAT('Automatically revoked due to Job Permit ', @permitId, ' revocation. ', @comments),
              Changed = GETDATE(),
              Changer = @userId,
              RevocationInitiatedBy = @userId,
              RevocationInitiatedDate = GETDATE(),
              RevocationReason = CONCAT('Job Permit ', @permitId, ' was revoked')
          WHERE JobPermitID = @permitId
          AND Status IN ('Pending', 'Approved', 'Revocation Pending');
        END
        ELSE IF @status = 'Rejected'
        BEGIN
          UPDATE PermitToWork
          SET Status = 'Approved',
              QHSSERevocationStatus = @status,
              RevocationApprovedBy = @userId,
              RevocationApprovedDate = GETDATE(),
              RevocationComments = @comments,
              Changed = GETDATE(),
              Changer = @userId
          WHERE JobPermitID = @permitId
          AND Status = 'Revocation Pending';
        END

        COMMIT TRANSACTION;
      `);

    return result.rowsAffected[0];
  } else {
    // For Permit to Work - modify the status handling when rejected
    const result = await transaction.request()
      .input('permitId', sql.Int, permitId)
      .input('userId', sql.Int, userId)
      .input('status', sql.VarChar(50), status)
      .input('comments', sql.NVarChar(sql.MAX), comments)
      .query(`
        -- First check if the permit exists and can be revoked
        DECLARE @currentStatus VARCHAR(50)
        SELECT @currentStatus = Status 
        FROM PermitToWork 
        WHERE PermitToWorkID = @permitId;

        IF @currentStatus IS NULL
          THROW 50001, 'Permit not found', 1;
        
        -- Proceed with the update if permit exists
        UPDATE PermitToWork
        SET Status = CASE 
              WHEN @status = 'Approved' THEN 'Revoked'
              WHEN @status = 'Rejected' THEN 'Approved' -- Keep the Status as Approved
              ELSE Status
            END,
            CompletionStatus = CASE
              WHEN @status = 'Rejected' THEN 'In Progress' -- Set CompletionStatus to In Progress
              ELSE CompletionStatus
            END,
            QHSSERevocationStatus = @status,
            RevocationApprovedBy = @userId,
            RevocationApprovedDate = GETDATE(),
            RevocationComments = @comments,
            -- Reset revocation fields when rejected
            RevocationInitiatedBy = CASE
              WHEN @status = 'Rejected' THEN NULL
              ELSE RevocationInitiatedBy
            END,
            RevocationInitiatedDate = CASE
              WHEN @status = 'Rejected' THEN NULL
              ELSE RevocationInitiatedDate
            END,
            RevocationReason = CASE
              WHEN @status = 'Rejected' THEN NULL
              ELSE RevocationReason
            END,
            Changed = GETDATE(),
            Changer = @userId
        WHERE PermitToWorkID = @permitId
        AND Status IN ('Pending', 'Approved', 'Revocation Pending');

        SELECT @@ROWCOUNT as AffectedRows;
      `);

    if (result.recordset[0].AffectedRows === 0) {
      throw new Error(`Permit ${permitId} is not in a valid state for revocation`);
    }

    return result.recordset[0].AffectedRows;
  }
}

};
module.exports = permitModel;