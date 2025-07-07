const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { query, getOne, insert, callProcedure, getOneProcedure } = require('../utils/dbUtils');
const { generateToken, sendTokenResponse } = require('../utils/jwtUtils');

// JWT expiration time in seconds (30 days)
const JWT_EXPIRES_IN = '30 days';

// Register user
const register = async (req, res) => {
  try {
    const { username, email, password, role, employee_id } = req.body;

    // Check if user exists
    const existingUser = await getOneProcedure('sp_GetUserByEmail', [email]);

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Validate role value to match the database ENUM
    const validRoles = ['admin', 'manager', 'employee'];
    const userRole = validRoles.includes(role) ? role : 'employee'; // Default to employee if invalid

    // Check if employee exists if employee_id is provided
    if (employee_id) {
      const employee = await getOneProcedure('sp_GetEmployeeById', [employee_id]);
      
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      
      // Check if employee already has a user account
      const existingAccount = await callProcedure('sp_GetUserByEmployeeId', [employee_id]);
      
      if (existingAccount.length > 0) {
        return res.status(400).json({ message: 'Employee already has a user account' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user using stored procedure
    const result = await callProcedure('sp_CreateUser', [
      username,
      email,
      hashedPassword,
      userRole,
      employee_id,
      null // No customer_id in new schema
    ]);
    
    const userId = result[0]?.user_id;

    // Get created user
    const user = await getOneProcedure('sp_GetUserById', [userId]);

    // Add employee details if available
    if (user.employee_id) {
      const employee = await getOneProcedure('sp_GetEmployeeById', [user.employee_id]);
      if (employee) {
        user.employee = employee;
      }
    }

    // Send token response
    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await getOneProcedure('sp_GetUserByEmail', [email]);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login time
    await callProcedure('sp_UpdateUserLastLogin', [user.user_id]);

    // Add employee details if available
    if (user.employee_id) {
      const employee = await getOneProcedure('sp_GetEmployeeById', [user.employee_id]);
      if (employee) {
        user.employee = employee;
      }
    }

    // Send token response
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Logout user
const logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // Expires in 10 seconds
    httpOnly: true
  });

  res.status(200).json({ success: true, data: {} });
};

// Get current user
const getMe = async (req, res) => {
  try {
    const user = await getOneProcedure('sp_GetUserById', [req.user.user_id]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add employee details if available
    if (user.employee_id) {
      const employee = await getOneProcedure('sp_GetEmployeeById', [user.employee_id]);
      if (employee) {
        user.employee = employee;
      }
    }

    // Remove password from response
    delete user.password;

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await getOneProcedure('sp_GetUserByEmail', [req.user.email]);

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await callProcedure('sp_UpdateUserPassword', [req.user.user_id, hashedPassword]);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Set first time password
const setFirstTimePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await callProcedure('sp_UpdateUserPassword', [req.user.user_id, hashedPassword]);

    res.status(200).json({
      success: true,
      message: 'Password set successfully'
    });
  } catch (error) {
    console.error('Set first time password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await getOneProcedure('sp_GetUserByEmail', [email]);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Create reset code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await callProcedure('sp_SetPasswordResetToken', [user.user_id, resetCode, passwordResetExpires]);

        // Create email transporter
        const transporter = nodemailer.createTransport({
            // CONFIGURE YOUR EMAIL TRANSPORTER HERE
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        // Email options
        const mailOptions = {
            from: 'santhoshvedakrishnan@gmail.com',
            to: user.email,
            subject: 'Password Reset Code',
            text: `Your password reset code is: ${resetCode}`,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ success: true, data: 'Email sent' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const verifyResetCode = async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await getOneProcedure('sp_GetUserByResetToken', [code]);

        if (!user || user.email !== email) {
            return res.status(400).json({ message: 'Invalid code' });
        }

        // Generate a new secure token for password reset
        const resetToken = crypto.randomBytes(20).toString('hex');
        const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await callProcedure('sp_SetPasswordResetToken', [user.user_id, passwordResetToken, passwordResetExpires]);

        res.status(200).json({ success: true, data: { resetToken } });
    } catch (error) {
        console.error('Verify reset code error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        // Get hashed token
        const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await getOneProcedure('sp_GetUserByResetToken', [passwordResetToken]);

        if (!user) {
            return res.status(400).json({ message: 'Invalid token' });
        }

        // Set new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await callProcedure('sp_UpdateUserPassword', [user.user_id, hashedPassword]);

        // Clear password reset token fields
        await callProcedure('sp_SetPasswordResetToken', [user.user_id, null, null]);

        sendTokenResponse(user, 200, res);
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  changePassword,
  setFirstTimePassword,
  forgotPassword,
  verifyResetCode,
  resetPassword
};
