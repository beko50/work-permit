const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { poolPromise } = require('../db');
const userModel = require('../models/userModel');

const userController = {
  async register(req, res) {
    const pool = await poolPromise;
    const transaction = pool.transaction();

    try {
      const { firstName, lastName, email, password, contractCompanyName } = req.body;

      await transaction.begin();

      const existingUser = await userModel.findByEmail(email);
      if (existingUser) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userData = {
        firstName,
        lastName,
        email,
        passwordHash: hashedPassword,
        contractCompanyName,
        userType: 'External'
      };

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
          userType: user.UserType 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.UserID,
          email: user.Email,
          role: user.RoleID,
          firstName: user.FirstName,
          lastName: user.LastName,
          departmentId: user.DepartmentID,
          userType: user.UserType
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Error during login' });
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