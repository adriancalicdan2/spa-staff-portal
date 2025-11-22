// src/components/EmployeeView.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { submitLeaveRequest, submitOvertimeRequest } from '../services/firebaseService';

const EmployeeView = ({ showMessage }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('leave');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [leaveForm, setLeaveForm] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: ''
  });
  
  const [overtimeForm, setOvertimeForm] = useState({
    adjustmentType: 'Overtime',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const calculateDaysDifference = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const calculateHoursDifference = (startDateTime, endDateTime) => {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const diffTime = Math.abs(end - start);
    return parseFloat((diffTime / (1000 * 60 * 60)).toFixed(2));
  };

  const handleLeaveSubmit = async () => {
    if (!leaveForm.leaveType || !leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      showMessage('Error', 'Please fill in all required fields.');
      return;
    }

    const totalDays = calculateDaysDifference(leaveForm.startDate, leaveForm.endDate);
    
    if (totalDays <= 0) {
      showMessage('Invalid Dates', 'End date must be after start date.');
      return;
    }

    setIsSubmitting(true);

    const requestData = {
      employeeName: currentUser.name,
      employeeId: currentUser.employeeId,
      department: currentUser.department,
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      totalDays: totalDays,
      reason: leaveForm.reason
    };

    try {
      await submitLeaveRequest(requestData);
      showMessage('Success', 'Leave request submitted successfully!');
      setLeaveForm({ leaveType: '', startDate: '', endDate: '', reason: '' });
    } catch (error) {
      showMessage('Error', 'Failed to submit leave request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOvertimeSubmit = async () => {
    if (!overtimeForm.adjustmentType || !overtimeForm.startDate || !overtimeForm.endDate || !overtimeForm.reason) {
      showMessage('Error', 'Please fill in all required fields.');
      return;
    }

    const totalHours = calculateHoursDifference(overtimeForm.startDate, overtimeForm.endDate);
    
    if (totalHours <= 0) {
      showMessage('Invalid Times', 'End time must be after start time.');
      return;
    }

    setIsSubmitting(true);

    const requestData = {
      employeeName: currentUser.name,
      employeeId: currentUser.employeeId,
      department: currentUser.department,
      adjustmentType: overtimeForm.adjustmentType,
      startDate: overtimeForm.startDate,
      endDate: overtimeForm.endDate,
      totalHours: totalHours,
      reason: overtimeForm.reason
    };

    try {
      await submitOvertimeRequest(requestData);
      showMessage('Success', 'Overtime request submitted successfully!');
      setOvertimeForm({ adjustmentType: 'Overtime', startDate: '', endDate: '', reason: '' });
    } catch (error) {
      showMessage('Error', 'Failed to submit overtime request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearLeaveForm = () => {
    setLeaveForm({ leaveType: '', startDate: '', endDate: '', reason: '' });
  };

  const clearOvertimeForm = () => {
    setOvertimeForm({ adjustmentType: 'Overtime', startDate: '', endDate: '', reason: '' });
  };

  return (
    <div className="row">
      <div className="col-12">
        <div className="dashboard-card">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0">
              <i className="fas fa-user-circle me-2 text-primary"></i>My Dashboard
            </h4>
            <span className="badge bg-primary">Employee</span>
          </div>

          <ul className="nav nav-tabs" id="employeeTabs" role="tablist">
            <li className="nav-item" role="presentation">
              <button 
                className={`nav-link ${activeTab === 'leave' ? 'active' : ''}`}
                onClick={() => setActiveTab('leave')}
              >
                <i className="fas fa-umbrella-beach me-1"></i>Leave Request
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button 
                className={`nav-link ${activeTab === 'overtime' ? 'active' : ''}`}
                onClick={() => setActiveTab('overtime')}
              >
                <i className="fas fa-clock me-1"></i>Overtime Request
              </button>
            </li>
          </ul>

          <div className="tab-content mt-4">
            {/* Leave Request Tab */}
            <div className={`tab-pane fade ${activeTab === 'leave' ? 'show active' : ''}`}>
              <div className="row mobile-friendly">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Leave Type <span className="text-danger">*</span></label>
                  <select 
                    className="form-select" 
                    value={leaveForm.leaveType}
                    onChange={(e) => setLeaveForm({...leaveForm, leaveType: e.target.value})}
                    required
                  >
                    <option value="">Select Leave Type</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Vacation">Vacation</option>
                    <option value="Personal Leave">Personal Leave</option>
                    <option value="Emergency Leave">Emergency Leave</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Start Date <span className="text-danger">*</span></label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})}
                    required 
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">End Date <span className="text-danger">*</span></label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})}
                    required 
                  />
                </div>
                <div className="col-12 mb-3">
                  <label className="form-label">Reason for Leave <span className="text-danger">*</span></label>
                  <textarea 
                    className="form-control" 
                    rows="4" 
                    placeholder="Please provide details for your leave request..."
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                    required
                  ></textarea>
                </div>
                <div className="col-12">
                  <button 
                    type="button" 
                    className="btn btn-primary px-4" 
                    onClick={handleLeaveSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <><i className="fas fa-spinner fa-spin me-2"></i>Submitting...</>
                    ) : (
                      <><i className="fas fa-paper-plane me-2"></i>Submit Leave Request</>
                    )}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary ms-2" 
                    onClick={clearLeaveForm}
                  >
                    <i className="fas fa-undo me-2"></i>Clear Form
                  </button>
                </div>
              </div>
            </div>

            {/* Overtime Request Tab */}
            <div className={`tab-pane fade ${activeTab === 'overtime' ? 'show active' : ''}`}>
              <div className="row mobile-friendly">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Adjustment Type <span className="text-danger">*</span></label>
                  <select 
                    className="form-select" 
                    value={overtimeForm.adjustmentType}
                    onChange={(e) => setOvertimeForm({...overtimeForm, adjustmentType: e.target.value})}
                    required
                  >
                    <option value="Overtime">Overtime</option>
                    <option value="Holiday Work">Holiday Work</option>
                    <option value="Weekend Work">Weekend Work</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Start Date & Time <span className="text-danger">*</span></label>
                  <input 
                    type="datetime-local" 
                    className="form-control" 
                    value={overtimeForm.startDate}
                    onChange={(e) => setOvertimeForm({...overtimeForm, startDate: e.target.value})}
                    required 
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">End Date & Time <span className="text-danger">*</span></label>
                  <input 
                    type="datetime-local" 
                    className="form-control" 
                    value={overtimeForm.endDate}
                    onChange={(e) => setOvertimeForm({...overtimeForm, endDate: e.target.value})}
                    required 
                  />
                </div>
                <div className="col-12 mb-3">
                  <label className="form-label">Reason for Overtime <span className="text-danger">*</span></label>
                  <textarea 
                    className="form-control" 
                    rows="4" 
                    placeholder="Please explain why overtime is needed..."
                    value={overtimeForm.reason}
                    onChange={(e) => setOvertimeForm({...overtimeForm, reason: e.target.value})}
                    required
                  ></textarea>
                </div>
                <div className="col-12">
                  <button 
                    type="button" 
                    className="btn btn-primary px-4" 
                    onClick={handleOvertimeSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <><i className="fas fa-spinner fa-spin me-2"></i>Submitting...</>
                    ) : (
                      <><i className="fas fa-paper-plane me-2"></i>Submit Overtime Request</>
                    )}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary ms-2" 
                    onClick={clearOvertimeForm}
                  >
                    <i className="fas fa-undo me-2"></i>Clear Form
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeView;