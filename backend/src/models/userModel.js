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
    const result = await transaction.request()
      .input('firstName', sql.VarChar, userData.firstName)
      .input('lastName', sql.VarChar, userData.lastName)
      .input('email', sql.VarChar, userData.email)
      .input('passwordHash', sql.VarChar, userData.passwordHash)
      .input('contractCompanyName', sql.VarChar, userData.contractCompanyName)
      .input('userType', sql.VarChar, userData.userType)
      .query(`
        INSERT INTO Users (FirstName, LastName, Email, PasswordHash, ContractCompanyName, UserType)
        VALUES (@firstName, @lastName, @email, @passwordHash, @contractCompanyName, @userType);
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
          DepartmentID, 
          RoleID, 
          UserType,
          Created
        FROM Users 
        WHERE UserID = @userId
      `);
    return result.recordset[0];
  }
};

module.exports = userModel;