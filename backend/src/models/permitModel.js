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

  async getAllPermits() {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT 
          jp.*,
          creator.FirstName as CreatorFirstName,
          creator.LastName as CreatorLastName,
          changer.FirstName as ChangerFirstName,
          changer.LastName as ChangerLastName,
          jpc.SectionItemID,
          jpc.Selected,
          jpc.TextInput,
          si.ItemLabel,
          fs.SectionName
        FROM JobPermits jp
        LEFT JOIN Users creator ON jp.Creator = creator.UserID
        LEFT JOIN Users changer ON jp.Changer = changer.UserID
        LEFT JOIN JobPermitCheckboxes jpc ON jp.JobPermitID = jpc.JobPermitID
        LEFT JOIN SectionItems si ON jpc.SectionItemID = si.SectionItemID
        LEFT JOIN FormSections fs ON si.SectionID = fs.SectionID
        ORDER BY jp.Created DESC
      `);
    return result.recordset;
  },

  async searchPermits(searchParams) {
    const pool = await poolPromise;
    try {
      const request = pool.request();

      // Add parameters
      request
        .input('permitReceiver', searchParams.permitReceiver || null)
        .input('jobPermitId', searchParams.jobPermitId || null)
        .input('contractCompanyName', searchParams.contractCompanyName || null)
        .input('status', searchParams.status || null)
        .input('startDate', searchParams.startDate ? new Date(searchParams.startDate) : null)
        .input('endDate', searchParams.endDate ? new Date(searchParams.endDate) : null);

      const result = await request.query(`
        SELECT 
          jp.*,
          jpc.SectionItemID,
          jpc.Selected,  -- Using Selected instead of IsChecked
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