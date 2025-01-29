const { poolPromise, sql } = require('../db');

const permitModel = {
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
      .input('riskAssessmentDocument', sql.VarChar(255), permitData.riskAssessmentDocument)
      .query(`
        INSERT INTO JobPermits (
          StartDate, EndDate, PermitDuration, Department,
          JobLocation, SubLocation, LocationDetail,
          JobDescription, PermitReceiver, ContractType,
          ContractCompanyName, StaffID, NumberOfWorkers,
          WorkersNames, RiskAssessmentDocument, Creator, Created, Status
        )
        OUTPUT INSERTED.JobPermitID
        VALUES (
          @startDate, @endDate, @permitDuration, @department,
          @jobLocation, @subLocation, @locationDetail,
          @jobDescription, @permitReceiver, @contractType,
          @contractCompanyName, @staffId, @numberOfWorkers,
          @workersNames, @riskAssessmentDocument, ${userId}, GETDATE(), 'Pending'
        );
      `);

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

  async getPermitsByRole(user) {
    const pool = await poolPromise;
    const request = pool.request();
  
    let query = `
      SELECT 
        jp.*,
        u.FirstName + ' ' + u.LastName AS IssuerName,
        u.DepartmentID AS IssuerDepartment,
        u.RoleID,
        d.DepartmentName
      FROM JobPermits jp
      LEFT JOIN Users u ON u.UserID = jp.Creator
      LEFT JOIN Departments d ON RTRIM(u.DepartmentID) = RTRIM(d.DepartmentID)
      WHERE 1=1
    `;
  
    // Safely get trimmed values with null checks
    const userRole = user.role ? user.role.trim() : null;
    const userDepartmentId = user.departmentId ? user.departmentId.trim() : null;
  
    // For QA role - only see permits assigned to QA
    if (userRole === 'QA') {
      query += ` AND jp.AssignedTo = 'QA'`;
    }
    // For QHSSE department - see ALL permits without any department filter
    else if (userDepartmentId === 'QHSSE') {
      // No additional filtering needed
    }
    // For ISS role - see permits assigned to ISS and matching the user's department
    else if (userRole === 'ISS' && userDepartmentId) {
      query += ` AND jp.AssignedTo = 'ISS'
                 AND (
                   jp.Department IN (
                     SELECT DepartmentName 
                     FROM Departments 
                     WHERE DepartmentID = '${userDepartmentId}'
                   ) OR 
                   jp.Department IN (
                     SELECT DepartmentID 
                     FROM Departments 
                     WHERE DepartmentName = '${userDepartmentId}'
                   )
                 )`;
    }
    // For HOD - see permits assigned to HOD and matching the user's department
    else if (userRole === 'HOD' && userDepartmentId) {
      query += ` AND jp.AssignedTo = 'HOD'
                 AND (
                   jp.Department IN (
                     SELECT DepartmentName 
                     FROM Departments 
                     WHERE DepartmentID = '${userDepartmentId}'
                   ) OR 
                   jp.Department IN (
                     SELECT DepartmentID 
                     FROM Departments 
                     WHERE DepartmentName = '${userDepartmentId}'
                   )
                 )`;
    }
    // For external users and other roles - only see permits they submitted
    else {
      query += ` AND jp.Creator = ${user.userId}`;
    }
  
    query += ` ORDER BY jp.Created DESC`;
  
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

  async searchPermits(searchParams) {
    const pool = await poolPromise;
    try {
      const request = pool.request();

      // Add parameters including department
      request
        .input('permitReceiver', searchParams.permitReceiver || null)
        .input('jobPermitId', searchParams.jobPermitId || null)
        .input('contractCompanyName', searchParams.contractCompanyName || null)
        .input('status', searchParams.status || null)
        .input('department', searchParams.department || null)  // Add department parameter
        .input('startDate', searchParams.startDate ? new Date(searchParams.startDate) : null)
        .input('endDate', searchParams.endDate ? new Date(searchParams.endDate) : null);

      const result = await request.query(`
        SELECT 
          jp.*,
          jpc.SectionItemID,
          jpc.Selected,
          jpc.TextInput,
          si.ItemLabel,
          s.SectionName
        FROM JobPermits jp
        LEFT JOIN JobPermitCheckboxes jpc ON jp.JobPermitID = jpc.JobPermitID
        LEFT JOIN SectionItems si ON jpc.SectionItemID = si.SectionItemID
        LEFT JOIN Sections s ON si.SectionID = s.SectionID
        WHERE (@permitReceiver IS NULL OR jp.PermitReceiver = @permitReceiver)
        AND (@jobPermitId IS NULL OR jp.JobPermitID LIKE '%' + @jobPermitId + '%')
        AND (@contractCompanyName IS NULL OR jp.ContractCompanyName LIKE '%' + @contractCompanyName + '%')
        AND (@status IS NULL OR jp.Status = @status)
        AND (@department IS NULL OR jp.Department = @department)  -- Add department filter
        AND (@startDate IS NULL OR jp.StartDate >= @startDate)
        AND (@endDate IS NULL OR jp.EndDate <= @endDate)
        ORDER BY jp.Created DESC
      `);
      return result.recordset;
    } catch (error) {
      console.error('Error in searchPermits:', error);
      throw error;
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
          p.RiskAssessmentDocument,
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
          -- Get approver names
          CONCAT(issuer.FirstName, ' ', issuer.LastName) as IssuerApproverName,
          CONCAT(hod.FirstName, ' ', hod.LastName) as HODApproverName,
          CONCAT(qa.FirstName, ' ', qa.LastName) as QHSSEApproverName
        FROM JobPermits p
        LEFT JOIN Users issuer ON p.IssuerApprovedBy = issuer.UserID
        LEFT JOIN Users hod ON p.HODApprovedBy = hod.UserID
        LEFT JOIN Users qa ON p.QHSSEApprovedBy = qa.UserID
        WHERE p.JobPermitID = @permitId;

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
      return { permit: null, sections: [], checkboxes: [] };
    }

    // Group checkboxes by section
    const sections = result.recordsets[1];
    const checkboxes = result.recordsets[2];
    
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
      groupedCheckboxes: groupedCheckboxes
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
      .input('permitToWorkId', sql.Int, parseInt(permitToWorkId))
      .query(`
        SELECT 
          ptw.*,
          jp.JobDescription,
          jp.JobLocation,
          jp.Department,
          jp.PermitReceiver,
          CONCAT(issuer.FirstName, ' ', issuer.LastName) as IssuerApproverName,
          CONCAT(hod.FirstName, ' ', hod.LastName) as HODApproverName,
          CONCAT(qa.FirstName, ' ', qa.LastName) as QHSSEApproverName
        FROM PermitToWork ptw
        INNER JOIN JobPermits jp ON ptw.JobPermitID = jp.JobPermitID
        LEFT JOIN Users issuer ON ptw.IssuerApprovedBy = issuer.UserID
        LEFT JOIN Users hod ON ptw.HODApprovedBy = hod.UserID
        LEFT JOIN Users qa ON ptw.QHSSEApprovedBy = qa.UserID
        WHERE ptw.PermitToWorkID = @permitToWorkId
      `);

    return result.recordset[0];
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
      nextApprover === 'COMPLETED' ? null : nextApprover
    )
    .query(`
      UPDATE PermitToWork 
      SET
        ${currentStageColumns.status} = @status,
        ${currentStageColumns.comments} = @comments,
        ${currentStageColumns.approvedBy} = @userId,
        ${currentStageColumns.approvedDate} = GETDATE(),
        AssignedTo = CASE
          WHEN @status = 'Rejected' THEN NULL
          WHEN @status = 'Approved' AND @nextApprover IS NOT NULL THEN @nextApprover
          WHEN @status = 'Approved' AND @assignedTo = 'QA' THEN NULL
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
    SELECT 
      ptw.*,
      jp.JobDescription,
      jp.JobLocation,
      jp.Department,
      jp.PermitReceiver,
      u.FirstName + ' ' + u.LastName AS IssuerName,
      u.DepartmentID AS IssuerDepartment
    FROM PermitToWork ptw
    INNER JOIN JobPermits jp ON ptw.JobPermitID = jp.JobPermitID
    LEFT JOIN Users u ON u.UserID = ptw.Creator
    WHERE 1=1
  `;

  const userRole = user.role ? user.role.trim() : null;
  const userDepartmentId = user.departmentId ? user.departmentId.trim() : null;

  if (userRole === 'QA') {
    query += ` AND ptw.AssignedTo = 'QA'`;
  }
  else if (userDepartmentId === 'QHSSE') {
    // No additional filtering needed
  }
  else if (userRole === 'ISS' && userDepartmentId) {
    query += ` AND ptw.AssignedTo = 'ISS'
               AND jp.Department IN (
                 SELECT DepartmentName 
                 FROM Departments 
                 WHERE DepartmentID = '${userDepartmentId}'
                 OR DepartmentName = '${userDepartmentId}'
               )`;
  }
  else if (userRole === 'HOD' && userDepartmentId) {
    query += ` AND ptw.AssignedTo = 'HOD'
               AND jp.Department IN (
                 SELECT DepartmentName 
                 FROM Departments 
                 WHERE DepartmentID = '${userDepartmentId}'
                 OR DepartmentName = '${userDepartmentId}'
               )`;
  }
  else {
    query += ` AND ptw.Creator = ${user.userId}`;
  }

  query += ` ORDER BY ptw.Created DESC`;
  const result = await request.query(query)
  return result;
},

  async updatePermitStatus(permitId, status, changerId, transaction) {
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
  }
};

module.exports = permitModel;