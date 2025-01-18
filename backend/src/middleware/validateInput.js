const validateRegisterInput = (req, res, next) => {
  const { firstName, lastName, email, password, contractCompanyName } = req.body;

  // Check for required fields
  if (!firstName || !lastName || !email || !password || !contractCompanyName) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Password length validation
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  // Email format validation
  if (!email.includes('@')) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  next();
};
  
  //Login
  const validateLoginInput = (req, res, next) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
  
    next();
  };
  
  module.exports = { validateRegisterInput, validateLoginInput };
  
  