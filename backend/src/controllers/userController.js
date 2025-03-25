const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { poolPromise } = require('../db');
const userModel = require('../models/userModel');

const userController = {
  async register(req, res) {
    const pool = await poolPromise;
    const transaction = pool.transaction();
  
    try {
      const { 
        firstName, 
        lastName, 
        email, 
        password, 
        contractCompanyName
      } = req.body;
  
      await transaction.begin();
  
      // Check if user already exists
      const existingUser = await userModel.findByEmail(email);
      if (existingUser) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Email already registered' });
      }
  
      // Determine if user is internal based on email domain
      const isInternalUser = email.endsWith('@mps-gh.com') || email.endsWith('@mpsgh.onmicrosoft.com');
  
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Prepare user data
      const userData = {
        firstName,
        lastName,
        email,
        passwordHash: hashedPassword,
        contractCompanyName,
        departmentId: null, // Will be set by admin later if needed
        departmentName: null, // Will be set by admin later if needed
        roleId: 'RCV', // Default role for all new users
        userType: isInternalUser ? 'Internal' : 'External',
        isActive: 0, // All new users start as inactive
        Created: new Date(), // Add creation date
        Changed: null,      // No changes yet
        Changer: null   
      };
  
      // Create user
      const result = await userModel.createUser(userData, transaction);
  
      await transaction.commit();
      
      res.status(201).json({ 
        message: 'User registered successfully. Your account is pending activation by an administrator.', 
        userId: result.userId 
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Registration error:', error);
      res.status(500).json({ 
        message: 'Error registering user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined 
      });
    }
  },

  async createAdmin(req, res) {
    try {
      const { firstName, lastName, email, password, departmentId } = req.body;
      
      // Validate required fields
      if (!firstName || !lastName || !email || !password || !departmentId) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Validate email domain
      if (!email.endsWith('@mps-gh.com') && !email.endsWith('@mpsgh.onmicrosoft.com')) {
        return res.status(400).json({ message: 'Admin email must be an MPS Ghana email address' });
      }

      // Check if user already exists
      const existingUser = await userModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Prepare user data
      const userData = {
        firstName,
        lastName,
        email: email.toLowerCase(),
        password: hashedPassword,
        roleId: 'ADMIN',
        departmentId,
        userType: 'Internal',
        isActive: true,
        contractCompanyName: 'MPS Ghana',
        Created: new Date(), // Add creation date
        Changed: null,      // No changes yet
        Changer: null,    
        createdBy: req.user.userId // Track who created the admin
      };

      // Create the admin user
      const newUserId = await userModel.createAdmin(userData);
      
      if (!newUserId) {
        return res.status(500).json({ message: 'Failed to create admin user' });
      }

      res.status(201).json({
        message: 'Admin user created successfully',
        userId: newUserId
      });

    } catch (error) {
      console.error('Error creating admin:', error);
      res.status(500).json({ message: 'Error creating admin user' });
    }
  },

  async getAllUsers(req, res) {
    try {
      const users = await userModel.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Error fetching users' });
    }
  },

  async updateUserRole(req, res) {
    try {
      const { userId } = req.params;
      const { roleId, departmentId } = req.body;
      const changerId = req.user.userId; // Get the ID of the user making the change
  
      // Get user details first
      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Check if user is internal
      const isInternal = user.Email.endsWith('@mps-gh.com') || user.Email.endsWith('@mpsgh.onmicrosoft.com');
  
      // Validation rules
      if (!isInternal) {
        // External users can only be RCV
        if (roleId !== 'RCV') {
          return res.status(400).json({ 
            message: 'External users can only have Permit Receiver role' 
          });
        }
        // External users cannot have departments
        if (departmentId) {
          return res.status(400).json({ 
            message: 'External users cannot be assigned to departments' 
          });
        }
      }
  
      // Don't allow changing to ADMIN role
      if (roleId === 'ADMIN') {
        return res.status(403).json({ 
          message: 'Cannot assign ADMIN role through this interface' 
        });
      }
  
      const success = await userModel.updateUserRole(userId, roleId, isInternal ? departmentId : null, changerId);
      
      if (!success) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.json({ message: 'User role updated successfully' });
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ message: 'Error updating user role' });
    }
  },

  async deleteUser(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const success = await userModel.deleteUser(userId);
      
      if (!success) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Error deleting user' });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await userModel.findByEmail(email);
  
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      const validPassword = await bcrypt.compare(password, user.PasswordHash);
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      // Check if user is active
      if (!user.IsActive) {
        return res.status(403).json({ 
          message: 'Your account is pending activation. Please contact an administrator.' 
        });
      }
  
      const token = jwt.sign(
        { 
          userId: user.UserID, 
          role: user.RoleID,
          userType: user.UserType,
          departmentId: user.DepartmentID 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
  
      res.json({
        token,
        user: {
          id: user.UserID,
          email: user.Email,
          roleId: user.RoleID,
          roleName: user.RoleName,
          firstName: user.FirstName,
          lastName: user.LastName,
          departmentId: user.DepartmentID,
          departmentName: user.DepartmentName,
          userType: user.UserType,
          isActive: user.IsActive,
          contractCompanyName: user.ContractCompanyName
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Error during login' });
    }
  },

  async getRoles(req, res) {
    try {
      const roles = await userModel.getRoles();
      res.json(roles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({ message: 'Error fetching roles' });
    }
  },

  async getDepartments(req, res) {
    try {
      const departments = await userModel.getDepartments();
      res.json(departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      res.status(500).json({ message: 'Error fetching departments' });
    }
  },

  async getProfile(req, res) {
    try {
      const user = await userModel.findById(req.user.userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      delete user.PasswordHash;
      res.json({ user });
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ message: 'Error fetching profile' });
    }
  }
};

module.exports = userController;