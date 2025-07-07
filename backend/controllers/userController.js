const { query, getOne, insert, update, remove, callProcedure, getOneProcedure } = require('../utils/dbUtils');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await callProcedure('sp_GetAllUsers', []);
    
    res.status(200).json({ 
      success: true, 
      count: users.length,
      data: users 
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await getOneProcedure('sp_GetUserById', [req.params.id]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If there's an employee_id, get employee details
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
    console.error('Error getting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { username, email, role, employee_id } = req.body;
    
    // Check if user exists
    const user = await getOneProcedure('sp_GetUserById', [req.params.id]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate role
    const validRoles = ['admin', 'manager', 'employee'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be admin, manager, or employee' });
    }
    
    // Check email uniqueness (excluding current user)
    if (email && email !== user.email) {
      const emailExists = await callProcedure('sp_CheckUserExists', [email, req.params.id]);
      
      if (emailExists[0]?.email_count > 0) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Check if employee exists if employee_id is provided
    if (employee_id) {
      const employee = await getOneProcedure('sp_GetEmployeeById', [employee_id]);
      
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
    }
    
    // Update user
    await callProcedure('sp_UpdateUser', [
      req.params.id,
      username,
      email,
      role,
      employee_id,
      null // No customer_id in new schema
    ]);

    // Get updated user
    const updatedUser = await getOneProcedure('sp_GetUserById', [req.params.id]);
    
    // Add employee details if available
    if (updatedUser.employee_id) {
      const employee = await getOneProcedure('sp_GetEmployeeById', [updatedUser.employee_id]);
      if (employee) {
        updatedUser.employee = employee;
      }
    }

    // Remove password from response
    delete updatedUser.password;

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    // Check if user exists
    const user = await getOneProcedure('sp_GetUserById', [req.params.id]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user
    const result = await callProcedure('sp_DeleteUser', [req.params.id]);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user role
const updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    // Check if user exists
    const user = await getOneProcedure('sp_GetUserById', [req.params.id]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate role
    const validRoles = ['admin', 'manager', 'employee'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be admin, manager, or employee' });
    }
    
    // Update role
    await callProcedure('sp_UpdateUserRole', [req.params.id, role]);

    // Get updated user
    const updatedUser = await getOneProcedure('sp_GetUserById', [req.params.id]);

    // Remove password from response
    delete updatedUser.password;

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reset user password
const resetPassword = async (req, res) => {
  try {
    // Check if user exists
    const user = await getOneProcedure('sp_GetUserById', [req.params.id]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a random temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    // Update password
    await callProcedure('sp_UpdateUserPassword', [req.params.id, hashedPassword]);

    res.status(200).json({
      success: true,
      data: {
        temporary_password: tempPassword
      }
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }
    
    // Update user profile picture in database
    const picturePath = `/uploads/profile/${req.file.filename}`;
    await callProcedure('sp_UpdateUserProfilePicture', [req.user.user_id, picturePath]);

    res.status(200).json({ 
      success: true, 
      data: { 
        profile_picture: picturePath
      }
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    
    // Delete the uploaded file if there was an error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a new user account
const createUser = async (req, res) => {
  try {
    const { username, email, password, role, employee_id } = req.body;
    
    // Validate role
    const validRoles = ['admin', 'manager', 'employee'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be admin, manager, or employee' });
    }
    
    // Check if email already exists
    const emailExists = await callProcedure('sp_CheckUserExists', [email, 0]);
    
    if (emailExists[0]?.email_count > 0) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    // Check if employee exists
    if (employee_id) {
      const employee = await getOneProcedure('sp_GetEmployeeById', [employee_id]);
      
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      
      // Check if employee already has a user account
      const existingUser = await callProcedure('sp_GetUserByEmployeeId', [employee_id]);
      
      if (existingUser.length > 0) {
        return res.status(400).json({ message: 'Employee already has a user account' });
      }
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const result = await callProcedure('sp_CreateUser', [
      username,
      email,
      hashedPassword,
      role,
      employee_id,
      null // No customer_id in new schema
    ]);
    
    const userId = result[0]?.user_id;
    
    // Get the created user
    const user = await getOneProcedure('sp_GetUserById', [userId]);
    
    // Add employee details if available
    if (user.employee_id) {
      const employee = await getOneProcedure('sp_GetEmployeeById', [user.employee_id]);
      if (employee) {
        user.employee = employee;
      }
    }
    
    // Remove password from response
    delete user.password;
    
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateRole,
  resetPassword,
  uploadProfilePicture,
  createUser
}; 