const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateRegisterInput, validateLoginInput } = require('../middleware/validateInput');
const authMiddleware = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const notificationService = require('../services/emailService');
require('dotenv').config();

// Define admin middleware inline to avoid the casing issue
const adminMiddleware = (req, res, next) => {
  try {
    console.log('Checking admin access for user:', req.user);
    
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if user has ADMIN role
    if (req.user.roleId !== 'ADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ message: 'Server error in admin verification' });
  }
};

// Group related routes with comments
// Authentication routes
router.post('/register', validateRegisterInput, userController.register);
router.post('/login', validateLoginInput, userController.login);

// Protected routes
router.get('/profile', authMiddleware, userController.getProfile);
router.get('/roles', userController.getRoles);
router.get('/departments', userController.getDepartments);

// Admin routes - protected by both auth and admin middlewares
router.post('/admin/create', authMiddleware, adminMiddleware, userController.createAdmin);
router.get('/admin/users', authMiddleware, adminMiddleware, userController.getAllUsers);
router.put('/admin/users/:userId/role', authMiddleware, adminMiddleware, userController.updateUserRole);
router.delete('/admin/users/:userId', authMiddleware, adminMiddleware, userController.deleteUser);

router.post('/admin/login', validateLoginInput, async (req, res) => {
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

    // Check if user is admin before proceeding
    const roleId = user.RoleID ? user.RoleID.trim() : null;
    if (roleId !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const token = jwt.sign(
      { 
        userId: user.UserID, 
        role: roleId,
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
        roleId: roleId,
        roleName: user.RoleName,
        firstName: user.FirstName,
        lastName: user.LastName,
        departmentId: user.DepartmentID,
        departmentName: user.DepartmentName,
        userType: user.UserType,
        contractCompanyName: user.ContractCompanyName
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Error during login' });
  }
});

router.put('/admin/users/:userId/activate', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    const changerId = req.user.userId;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const success = await userModel.updateUserActivation(userId, isActive, changerId);
    
    if (!success) {
      return res.status(404).json({ message: 'Failed to update user status' });
    }

    res.json({ 
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully` 
    });
  } catch (error) {
    console.error('Error updating user activation status:', error);
    res.status(500).json({ message: 'Error updating user status' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user exists
    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(404).json({ 
        message: 'If this email exists in our system, you will receive a password reset link.' 
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.UserID },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Save reset token and expiry in database
    await userModel.saveResetToken(user.UserID, resetToken);

    // Send reset email
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await notificationService.sendNotification(
      email,
      'passwordReset',
      {
        firstName: user.FirstName,
        lastName: user.LastName,
        resetLink: resetLink
      }
    );

    res.json({ 
      message: 'If this email exists in our system, you will receive a password reset link.' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Error processing password reset request' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is valid and not expired in database
    const isValidToken = await userModel.validateResetToken(decoded.userId, token);
    if (!isValidToken) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await userModel.updatePassword(decoded.userId, hashedPassword);

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({ message: 'Invalid or expired reset token' });
  }
});

module.exports = router;