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
        contractCompanyName,
        departmentId,
        roleId
      } = req.body;

      await transaction.begin();

      // Check if user already exists
      const existingUser = await userModel.findByEmail(email);
      if (existingUser) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Email already registered' });
      }

      // Validate internal user requirements
      const isInternalUser = email.endsWith('@mps-gh.com');
      if (isInternalUser && !departmentId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Department ID is required for internal users' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Prepare user data
      const userData = {
        firstName,
        lastName,
        email,
        passwordHash: hashedPassword,
        contractCompanyName,
        departmentId,
        roleId: roleId.trim() 
      };

      // Create user
      const result = await userModel.createUser(userData, transaction);

      await transaction.commit();
      
      res.status(201).json({ 
        message: 'User registered successfully', 
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
          firstName: user.FirstName,
          lastName: user.LastName,
          departmentId: user.DepartmentID,
          userType: user.UserType,
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