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
  
     // Clean up the department ID by trimming
  const userDepartmentId = user.departmentId ? user.departmentId.trim() : null;
  
  // For QHSSE department - can see all permits
  if (userDepartmentId === 'QHSSE') {
    // No additional filter needed
  }
  // For HOD and ISS roles - see permits for their department
  else if (user.role.trim() === 'HOD' || user.role.trim() === 'ISS') {
    console.log(user.DepartmentID)
    query += ` AND jp.AssignedTo = '${user.role.trim()}' AND jp.Department = '${user.departmentId.trim}'`;

  }
  // For other roles (e.g., RCV) - only see permits they submitted
  else {
    // request.input('receiverName', sql.VarChar, `${user.firstName} ${user.lastName}`.trim());
    // query += ` AND jp.PermitReceiver = @receiverName`;
    query += ` AND jp.Creator = ${user.userId}`;
  }

  query += ` ORDER BY jp.Created DESC`;

  return await request.query(query);
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