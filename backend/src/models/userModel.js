const { poolPromise, sql } = require('../db');

const userModel = {
  async findByEmail(email) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT TOP 1 * FROM Users WHERE Email = @email');
    return result.recordset[0];
  },

  async createUser(userData, transaction) {
    // Determine if user is internal based on email domain
    const isInternalUser = userData.email.endsWith('@mps-gh.com');
    
    const result = await transaction.request()
      .input('firstName', sql.VarChar, userData.firstName)
      .input('lastName', sql.VarChar, userData.lastName)
      .input('email', sql.VarChar, userData.email)
      .input('passwordHash', sql.VarChar, userData.passwordHash)
      .input('contractCompanyName', sql.VarChar, userData.contractCompanyName)
      .input('department', sql.VarChar, isInternalUser ? userData.department : null)
      .input('roleId', sql.VarChar, userData.roleId)
      .input('userType', sql.VarChar, isInternalUser ? 'Internal' : 'External')
      .query(`
        INSERT INTO Users (
          FirstName, 
          LastName, 
          Email, 
          PasswordHash, 
          ContractCompanyName, 
          Department,
          RoleID,
          UserType,
          Created
        )
        VALUES (
          @firstName,
          @lastName,
          @email,
          @passwordHash,
          @contractCompanyName,
          @department,
          @roleId,
          @userType,
          GETDATE()
        );
        SELECT SCOPE_IDENTITY() AS userId;
      `);
    return result.recordset[0];
  },

  async findById(userId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          UserID, 
          FirstName, 
          LastName, 
          Email, 
          Department, 
          RoleID,
          UserType,
          ContractCompanyName,
          Created
        FROM Users 
        WHERE UserID = @userId
      `);
    return result.recordset[0];
  },

  async getRoles() {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT RoleID, RoleName FROM Roles');
    return result.recordset;
  },

  async getDepartments() {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT DepartmentID, DepartmentName  FROM Departments');
    return result.recordset;
  }
};

module.exports = userModel;