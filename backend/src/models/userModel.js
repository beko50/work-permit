const { poolPromise, sql } = require('../db');

const userModel = {
  async getAllUsers() {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT 
          u.UserID,
          u.FirstName,
          u.LastName,
          u.Email,
          u.Department,
          u.DepartmentID,
          u.RoleID,
          u.UserType,
          u.ContractCompanyName,
          u.Created,
          u.Changed,
          u.IsActive,
          r.RoleName,
          d.DepartmentName,
         CONCAT(c.FirstName, ' ', c.LastName) AS ChangerName
          FROM Users u
          LEFT JOIN Roles r ON u.RoleID = r.RoleID
          LEFT JOIN Departments d ON u.DepartmentID = d.DepartmentID
          LEFT JOIN Users c ON u.Changer = c.UserID -- Join to get changer's name
          ORDER BY u.Created DESC
          `);
    return result.recordset;
  },

  // Update user role with proper tracking
  async updateUserRole(userId, roleId, departmentId, changerId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('roleId', sql.VarChar, roleId)
      .input('departmentId', sql.VarChar, departmentId)
      .input('changerId', sql.Int, changerId)
      .input('changed', sql.DateTime, new Date())
      .query(`
        UPDATE Users
        SET RoleID = @roleId,
            DepartmentID = @departmentId,
            Changed = @changed,
            Changer = @changerId
        WHERE UserID = @userId
      `);
    return result.rowsAffected[0] > 0;
  },

  async deleteUser(userId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        DELETE FROM Users
        WHERE UserID = @userId
      `);
    return result.rowsAffected[0] > 0;
  }, 
  
  // Modified login check to verify activation
  async findByEmail(email) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query(`
        SELECT u.*, r.RoleName, d.DepartmentName
        FROM Users u
        LEFT JOIN Roles r ON u.RoleID = r.RoleID
        LEFT JOIN Departments d ON u.DepartmentID = d.DepartmentID
        WHERE u.Email = @email
      `);
    return result.recordset[0];
  },

  // Create new user with proper defaults
  async createUser(userData, transaction) {
    // Determine if user is internal based on email domain
    const isInternalUser = userData.email.endsWith('@mps-gh.com') || 
                        userData.email.endsWith('@mpsgh.onmicrosoft.com');
    
    const result = await transaction.request()
      .input('firstName', sql.VarChar, userData.firstName)
      .input('lastName', sql.VarChar, userData.lastName)
      .input('email', sql.VarChar, userData.email)
      .input('passwordHash', sql.VarChar, userData.passwordHash)
      .input('contractCompanyName', sql.VarChar, userData.contractCompanyName)
      .input('department', sql.VarChar, null) // Will be set by admin later if needed
      .input('departmentId', sql.VarChar, null) // Will be set by admin later if needed
      .input('roleId', sql.VarChar, 'RCV') // Default role for all new users
      .input('userType', sql.VarChar, isInternalUser ? 'Internal' : 'External')
      .input('isActive', sql.Bit, 0) // All new users start as inactive
      .query(`
        INSERT INTO Users (
          FirstName,
          LastName,
          Email,
          PasswordHash,
          ContractCompanyName,
          Department,
          DepartmentID,
          RoleID,
          UserType,
          IsActive,
          Created,
          Changed,
          Changer
        ) VALUES (
          @firstName,
          @lastName,
          @email,
          @passwordHash,
          @contractCompanyName,
          @department,
          @departmentId,
          @roleId,
          @userType,
          @isActive,
          GETDATE(),
           NULL,         -- Set Changed to NULL initially
          NULL
        );
        SELECT SCOPE_IDENTITY() AS userId;
      `);
    return result.recordset[0];
  },

  async createAdmin(userData) {
    const pool = await poolPromise;
    const transaction = pool.transaction();
    
    try {
      await transaction.begin();
  
      const result = await transaction.request()
        .input('firstName', sql.VarChar, userData.firstName)
        .input('lastName', sql.VarChar, userData.lastName)
        .input('email', sql.VarChar, userData.email)
        .input('passwordHash', sql.VarChar, userData.password)
        .input('roleId', sql.VarChar, userData.roleId)
        .input('departmentId', sql.VarChar, userData.departmentId)
        .input('userType', sql.VarChar, userData.userType)
        .input('isActive', sql.Bit, userData.isActive ? 1 : 0)
        .input('contractCompanyName', sql.VarChar, userData.contractCompanyName)
        .input('changer', sql.Int, userData.createdBy) // Use Changer instead of CreatedBy
        .query(`
          INSERT INTO Users (
            FirstName, 
            LastName, 
            Email, 
            PasswordHash, 
            RoleID, 
            DepartmentID, 
            UserType, 
            IsActive, 
            ContractCompanyName,
            Changer
          ) VALUES (
            @firstName,
            @lastName,
            @email,
            @passwordHash,
            @roleId,
            @departmentId,
            @userType,
            @isActive,
            @contractCompanyName,
            @changer
          );
          SELECT SCOPE_IDENTITY() AS userId;
        `);
  
      await transaction.commit();
      return result.recordset[0].userId;
  
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  // Update user activation status
  async updateUserActivation(userId, isActive, changerId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('isActive', sql.Bit, isActive)
      .input('changerId', sql.Int, changerId)
      .input('changed', sql.DateTime, new Date())
      .query(`
        UPDATE Users
        SET IsActive = @isActive,
            Changed = @changed,
            Changer = @changerId
        WHERE UserID = @userId
      `);
    return result.rowsAffected[0] > 0;
  },

  async findById(userId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          u.UserID, 
          u.FirstName, 
          u.LastName, 
          u.Email, 
          u.Department, 
          u.RoleID,
          r.RoleName,
          u.UserType,
          u.ContractCompanyName,
          u.Created
        FROM Users u
        LEFT JOIN Roles r ON u.RoleID = r.RoleID
        WHERE u.UserID = @userId
      `);
    return result.recordset[0];
  },

  async saveResetToken(userId, resetToken) {
    const pool = await poolPromise;
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('resetToken', sql.VarChar, resetToken)
      .input('resetTokenExpiry', sql.DateTime, new Date(Date.now() + 3600000)) // 1 hour from now
      .query(`
        UPDATE Users
        SET ResetToken = @resetToken,
            ResetTokenExpiry = @resetTokenExpiry
        WHERE UserID = @userId
      `);
  },
  
  async validateResetToken(userId, resetToken) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('resetToken', sql.VarChar, resetToken)
      .input('now', sql.DateTime, new Date())
      .query(`
        SELECT 1
        FROM Users
        WHERE UserID = @userId
          AND ResetToken = @resetToken
          AND ResetTokenExpiry > @now
      `);
    return result.recordset.length > 0;
  },
  
  async updatePassword(userId, hashedPassword) {
    const pool = await poolPromise;
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('passwordHash', sql.VarChar, hashedPassword)
      .query(`
        UPDATE Users
        SET PasswordHash = @passwordHash,
            ResetToken = NULL,
            ResetTokenExpiry = NULL,
            Changed = GETDATE()
        WHERE UserID = @userId
      `);
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