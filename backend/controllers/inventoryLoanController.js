const { callProcedure } = require('../utils/dbUtils');

// Create a new inventory loan
exports.createInventoryLoan = async (req, res) => {
  try {
    const { project_id, responsible_team_id, expected_return_date, purpose, items } = req.body;
    const requested_by_user_id = req.user.user_id;
    // items: array of { item_name, quantity_requested }
    const items_json = JSON.stringify(items);
    const [result] = await callProcedure('sp_CreateInventoryLoan', [
      project_id,
      requested_by_user_id,
      responsible_team_id,
      expected_return_date,
      purpose,
      items_json
    ]);
    res.status(201).json({ success: true, loan_id: result.loan_id });
  } catch (error) {
    console.error('Error creating inventory loan:', error);
    res.status(500).json({ success: false, message: 'Failed to create inventory loan', error: error.message });
  }
};

// Approve or reject a loan
exports.approveRejectInventoryLoan = async (req, res) => {
  try {
    const { loan_id } = req.params;
    const { status } = req.body; // 'Approved' or 'Rejected'
    const approved_by_user_id = req.user.user_id;
    await callProcedure('sp_ApproveRejectInventoryLoan', [loan_id, status, approved_by_user_id]);
    res.status(200).json({ success: true, message: `Loan ${status.toLowerCase()}` });
  } catch (error) {
    console.error('Error approving/rejecting inventory loan:', error);
    res.status(500).json({ success: false, message: 'Failed to update loan status', error: error.message });
  }
};

// Assign & issue items
exports.issueInventoryLoan = async (req, res) => {
  try {
    const { loan_id } = req.params;
    const { items } = req.body; // array of { loan_item_id, quantity_issued }
    const issued_by_user_id = req.user.user_id;
    const items_json = JSON.stringify(items);
    await callProcedure('sp_IssueInventoryLoan', [loan_id, issued_by_user_id, items_json]);
    res.status(200).json({ success: true, message: 'Loan issued' });
  } catch (error) {
    console.error('Error issuing inventory loan:', error);
    res.status(500).json({ success: false, message: 'Failed to issue loan', error: error.message });
  }
};

// Return items
exports.returnInventoryLoanItems = async (req, res) => {
  try {
    const { loan_id } = req.params;
    const { items } = req.body; // array of { loan_item_id, quantity_returned }
    const items_json = JSON.stringify(items);
    await callProcedure('sp_ReturnInventoryLoanItems', [loan_id, items_json]);
    res.status(200).json({ success: true, message: 'Items returned' });
  } catch (error) {
    console.error('Error returning inventory loan items:', error);
    res.status(500).json({ success: false, message: 'Failed to return items', error: error.message });
  }
};

// Get loans by user
exports.getInventoryLoansByUser = async (req, res) => {
  try {
    const user_id = req.params.userId || req.user.user_id;
    const results = await callProcedure('sp_GetInventoryLoansByUser', [user_id]);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error('Error getting inventory loans by user:', error);
    res.status(500).json({ success: false, message: 'Failed to get loans', error: error.message });
  }
};

// Get loan details by ID
exports.getInventoryLoanDetails = async (req, res) => {
  try {
    const { loan_id } = req.params;
    const result = await callProcedure('sp_GetInventoryLoanDetails', [loan_id]);
    res.status(200).json({
      success: true,
      data: {
        loanDetails: result[0] && result[0][0] ? result[0][0] : null,
        loanItems: Array.isArray(result[1]) ? result[1] : []
      }
    });
  } catch (error) {
    console.error('Error getting inventory loan details:', error);
    res.status(500).json({ success: false, message: 'Failed to get loan details', error: error.message });
  }
};

// Get loans by project
exports.getInventoryLoansByProject = async (req, res) => {
  try {
    const { project_id } = req.params;
    const results = await callProcedure('sp_GetInventoryLoansByProject', [project_id]);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error('Error getting inventory loans by project:', error);
    res.status(500).json({ success: false, message: 'Failed to get loans by project', error: error.message });
  }
};

// Get pending approvals for team leads
exports.getInventoryLoansPendingApproval = async (req, res) => {
  try {
    const { team_id } = req.params;
    const results = await callProcedure('sp_GetInventoryLoansPendingApproval', [team_id]);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error('Error getting pending approvals:', error);
    res.status(500).json({ success: false, message: 'Failed to get pending approvals', error: error.message });
  }
};

// Get loans by team (for team members)
exports.getInventoryLoansByTeam = async (req, res) => {
  try {
    const { team_id } = req.params;
    const results = await callProcedure('sp_GetInventoryLoansByTeam', [team_id]);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error('Error getting loans by team:', error);
    res.status(500).json({ success: false, message: 'Failed to get loans by team', error: error.message });
  }
};
