// src/components/HeadView.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToDepartmentRequests, updateRequestStatus } from '../services/firebaseService';

const HeadView = ({ showMessage }) => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.department) return;

    setIsLoading(true);
    
    const unsubscribe = subscribeToDepartmentRequests(currentUser.department, (departmentRequests) => {
      setRequests(departmentRequests);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [currentUser?.department]);

  const handleApproveRequest = async (requestId, type) => {
    if (window.confirm('Are you sure you want to APPROVE this request?')) {
      try {
        await updateRequestStatus(requestId, 'Approved', type, currentUser.name);
        showMessage('Success', 'Request approved successfully!');
      } catch (error) {
        showMessage('Error', 'Failed to approve request. Please try again.');
      }
    }
  };

  const handleRejectRequest = async (requestId, type) => {
    if (window.confirm('Are you sure you want to REJECT this request?')) {
      try {
        await updateRequestStatus(requestId, 'Rejected', type, currentUser.name);
        showMessage('Notice', 'Request rejected.');
      } catch (error) {
        showMessage('Error', 'Failed to reject request. Please try again.');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      if (dateString.toDate) {
        // Firestore Timestamp
        const date = dateString.toDate();
        return date.toLocaleDateString('en-US');
      } else {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US');
      }
    } catch (e) {
      return String(dateString);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      if (dateString.toDate) {
        const date = dateString.toDate();
        return date.toLocaleString('en-US');
      } else {
        const date = new Date(dateString);
        return date.toLocaleString('en-US');
      }
    } catch (e) {
      return String(dateString);
    }
  };

  return (
    <div className="row">
      <div className="col-12">
        <div className="dashboard-card">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="mb-1">
                <i className="fas fa-user-tie me-2 text-primary"></i>Manager Dashboard
              </h4>
              <p className="text-muted mb-0">Department: {currentUser?.department}</p>
            </div>
            <span className="badge bg-warning">Department Head</span>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Pending Requests for Approval</h5>
            <div>
              <span className="badge bg-primary me-2">
                {requests.length} Pending
              </span>
            </div>
          </div>
          
          <div id="requestsContainer">
            {isLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading requests for your department...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">No Pending Requests</h5>
                <p className="text-muted">No pending requests found in your department.</p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-hover table-bordered">
                    <thead className="table-dark">
                      <tr>
                        <th>Request ID</th>
                        <th>Employee</th>
                        <th>Type</th>
                        <th>Dates</th>
                        <th>Duration</th>
                        <th>Reason</th>
                        <th>Submitted</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((request, index) => (
                        <tr key={request.id || index}>
                          <td><small>{request.id}</small></td>
                          <td>
                            <strong>{request.employeeName}</strong><br/>
                            <small className="text-muted">{request.employeeId}</small>
                          </td>
                          <td>
                            <span className={`badge ${request.type === 'Leave' ? 'bg-info' : 'bg-warning'}`}>
                              {request.type}
                            </span>
                            <br/>
                            <small>{request.leaveType || request.adjustmentType}</small>
                          </td>
                          <td>
                            {formatDate(request.startDate)}<br/>
                            <small className="text-muted">to {formatDate(request.endDate)}</small>
                          </td>
                          <td>
                            <strong>
                              {request.type === 'Leave' ? 
                                request.totalDays + ' days' : 
                                request.totalHours + ' hours'
                              }
                            </strong>
                          </td>
                          <td>{request.reason || 'No reason provided'}</td>
                          <td><small>{formatDateTime(request.submissionDate)}</small></td>
                          <td>
                            <div className="btn-group-vertical">
                              <button 
                                className="btn btn-success btn-sm mb-1" 
                                onClick={() => handleApproveRequest(request.id, request.type)}
                              >
                                <i className="fas fa-check me-1"></i>Approve
                              </button>
                              <button 
                                className="btn btn-danger btn-sm" 
                                onClick={() => handleRejectRequest(request.id, request.type)}
                              >
                                <i className="fas fa-times me-1"></i>Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3">
                  <p className="text-muted"><small>Found {requests.length} pending request(s)</small></p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeadView;