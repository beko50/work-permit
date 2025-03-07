const adminMiddleware = (req, res, next) => {
    try {
      // Log for debugging
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
  
  module.exports = adminMiddleware;