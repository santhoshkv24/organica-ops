import React, { useState, useEffect } from "react";
import {
  CModal,
  CModalHeader,
  CModalBody,
  CModalFooter,
  CButton,
  CForm,
  CFormSelect,
  CFormInput,
  CSpinner,
  CAlert,
} from "@coreui/react";
import { getCompanies, getTeams, importEmployees } from "../../services/api";
import * as XLSX from 'xlsx';

const EmployeeImportModal = ({ visible, onClose, onImportSuccess }) => {
  const [branches, setBranches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    if (visible) {
      fetchBranches();
    }
  }, [visible]);

  useEffect(() => {
    if (selectedBranch) {
      fetchTeamsForBranch(selectedBranch);
    }
  }, [selectedBranch]);

  const fetchBranches = async () => {
    try {
      const response = await getCompanies();
      setBranches(response.data.data || response.data);
    } catch (err) {
      setError("Failed to load branches.");
    }
  };

  const fetchTeamsForBranch = async (branchId) => {
    try {
      const response = await getTeams();
      const filteredTeams = (response.data.data || response.data).filter(
        (team) => team.branch_id == branchId
      );
      setTeams(filteredTeams);
    } catch (err) {
      setError("Failed to load teams.");
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleImport = async () => {
    if (!selectedTeam || !file) {
      setError("Please select a team and a file.");
      return;
    }

    setLoading(true);
    setError(null);
    setImportResult(null);

    const formData = new FormData();
    formData.append("team_id", selectedTeam);
    formData.append("file", file);

    try {
      const response = await importEmployees(formData);
      setImportResult(response.data);
      onImportSuccess();
    } catch (err) {
      setError(
        err.response?.data?.message || "An error occurred during import."
      );
      setImportResult(err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "first_name",
      "last_name",
      "email",
      "phone",
      "hire_date",
      "position",
    ];

    // Create a worksheet from headers (as a single row)
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");

    // Write the workbook and trigger download
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "employee_template.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const handleClose = () => {
    setSelectedBranch("");
    setSelectedTeam("");
    setFile(null);
    setError(null);
    setImportResult(null);
    onClose();
  };

  return (
    <CModal visible={visible} onClose={handleClose}>
      <CModalHeader>Import Employees from Excel</CModalHeader>
      <CModalBody>
        {error && <CAlert color="danger">{error}</CAlert>}
        {importResult && !importResult.errors && (
          <CAlert color="success">{importResult.message}</CAlert>
        )}
        {importResult && importResult.errors && (
          <CAlert color="danger">
            <p>{importResult.message}</p>
            <ul>
              {importResult.errors.map((err, index) => (
                <li key={index}>
                  Row {err.row}: {err.message}
                </li>
              ))}
            </ul>
          </CAlert>
        )}
        <CForm>
          <div className="mb-3">
            <CFormSelect
              label="Branch"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="">Select Branch</option>
              {branches.map((branch) => (
                <option key={branch.branch_id} value={branch.branch_id}>
                  {branch.name}
                </option>
              ))}
            </CFormSelect>
          </div>
          <div className="mb-3">
            <CFormSelect
              label="Team"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              disabled={!selectedBranch}
            >
              <option value="">Select Team</option>
              {teams.map((team) => (
                <option key={team.team_id} value={team.team_id}>
                  {team.name}
                </option>
              ))}
            </CFormSelect>
          </div>
          <div className="mb-3">
            <CFormInput
              type="file"
              label="Excel File"
              onChange={handleFileChange}
            />
          </div>
        </CForm>
        <CButton color="link" onClick={handleDownloadTemplate}>
          Download Template
        </CButton>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={handleClose}>
          Close
        </CButton>
        <CButton color="primary" onClick={handleImport} disabled={loading}>
          {loading && <CSpinner size="sm" className="me-2" />} Import
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default EmployeeImportModal;
