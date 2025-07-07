const { query, getOne, insert, update, remove, callProcedure, getOneProcedure } = require('../utils/dbUtils');

// Get all branches
const getBranches = async (req, res) => {
  try {
    const branches = await callProcedure('sp_GetAllBranches', []);
    
    res.status(200).json({
      success: true,
      count: branches.length,
      data: branches
    });
  } catch (error) {
    console.error('Error getting branches:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single branch
const getBranch = async (req, res) => {
  try {
    const branch = await getOneProcedure('sp_GetBranchById', [req.params.id]);

    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    res.status(200).json({
      success: true,
      data: branch
    });
  } catch (error) {
    console.error('Error getting branch:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create branch
const createBranch = async (req, res) => {
  try {
    const { name, address, contact_email, contact_phone } = req.body;

    // Check if name is already in use
    const nameExists = await callProcedure('sp_CheckBranchNameExists', [name, 0]);
    
    if (nameExists[0]?.name_count > 0) {
      return res.status(400).json({ message: 'Branch name already in use' });
    }

    // Create branch
    const result = await callProcedure('sp_CreateBranch', [name, address, contact_email, contact_phone]);
    
    const branchId = result[0]?.branch_id;
    
    // Get the created branch
    const branch = await getOneProcedure('sp_GetBranchById', [branchId]);

    res.status(201).json({
      success: true,
      data: branch
    });
  } catch (error) {
    console.error('Error creating branch:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update branch
const updateBranch = async (req, res) => {
  try {
    const { name, address, contact_email, contact_phone } = req.body;
    const branchId = parseInt(req.params.id);

    if (isNaN(branchId)) {
      return res.status(400).json({ message: 'Invalid branch ID' });
    }

    // Check if branch exists
    const branch = await getOneProcedure('sp_GetBranchById', [branchId]);

    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Check if name is already in use (by another branch)
    if (name) {
      const nameExists = await callProcedure('sp_CheckBranchNameExists', [name, branchId]);

      if (nameExists[0]?.name_count > 0) {
        return res.status(400).json({ message: 'Branch name already in use' });
      }
    }

    // Update branch
    await callProcedure('sp_UpdateBranch', [
      branchId,
        name,
        address,
        contact_email,
        contact_phone
    ]);

    // Get updated branch
    const updatedBranch = await getOneProcedure('sp_GetBranchById', [branchId]);

    res.status(200).json({
      success: true,
      data: updatedBranch
    });
  } catch (error) {
    console.error('Error updating branch:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete branch
const deleteBranch = async (req, res) => {
  try {
    // Check if branch exists
    const branch = await getOneProcedure('sp_GetBranchById', [req.params.id]);

    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Check for dependencies
    const dependencies = await callProcedure('sp_CountBranchDependencies', [req.params.id]);

    if (dependencies[0]?.count > 0) {
      return res.status(400).json({
        message: 'Cannot delete branch with existing teams or employees. Remove or reassign these first.'
      });
    }

    // Delete branch
    const result = await callProcedure('sp_DeleteBranch', [req.params.id]);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getBranches,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch
};
