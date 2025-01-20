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

      console.log('Raw request body:', req.body);
      console.log('Checkbox selections:', checkboxSelections);

      await transaction.begin();

      const permitResult = await permitModel.createPermit(permitData, checkboxSelections, req.user.userId, transaction);
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
      const result = await permitModel.getAllPermits();

      const permits = {};
      result.forEach(row => {
        if (!permits[row.JobPermitID]) {
          permits[row.JobPermitID] = {
            ...row,
            checkboxes: []
          };
          delete permits[row.JobPermitID].SectionItemID;
          delete permits[row.JobPermitID].Selected;
          delete permits[row.JobPermitID].TextInput;
          delete permits[row.JobPermitID].ItemLabel;
          delete permits[row.JobPermitID].SectionName;
        }

        if (row.SectionItemID) {
          permits[row.JobPermitID].checkboxes.push({
            sectionItemId: row.SectionItemID,
            sectionName: row.SectionName,
            label: row.ItemLabel,
            selected: row.Selected === 'Yes',
            textInput: row.TextInput
          });
        }
      });

      res.json({ permits: Object.values(permits) });
    } catch (error) {
      console.error('Error fetching permits:', error);
      res.status(500).json({ message: 'Error fetching permits' });
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