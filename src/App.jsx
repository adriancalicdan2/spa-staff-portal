// src/App.jsx
import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './App.css';
import { auth, db } from './firebase/config';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, getDocs, query, where, updateDoc, deleteDoc } from 'firebase/firestore';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('spa2024');
  const [isLoading, setIsLoading] = useState(false);

  // Login function
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('Auth successful, fetching employee data for:', email);
      
      // Get employee data from Firestore
      const employeesRef = collection(db, 'employees');
      const q = query(employeesRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const employeeData = doc.data();
        console.log('Employee data found:', employeeData);
        
        // Make sure all required fields exist
        const userData = {
          uid: user.uid,
          email: user.email,
          name: employeeData.name || 'Unknown',
          role: employeeData.role || 'Employee',
          department: employeeData.department || 'General',
          employeeId: employeeData.employeeId || 'N/A',
          position: employeeData.position || 'Staff'
        };
        
        console.log('Setting current user:', userData);
        setCurrentUser(userData);
      } else {
        alert('Employee record not found in database. Please contact HR.');
        await signOut(auth);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setEmail('');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Submit leave request
  const submitLeaveRequest = async (requestData) => {
    try {
      await addDoc(collection(db, 'leaveRequests'), {
        ...requestData,
        status: 'Pending',
        submissionDate: new Date()
      });
      alert('Leave request submitted successfully!');
      return true;
    } catch (error) {
      console.error('Error submitting leave request:', error);
      alert('Error submitting request: ' + error.message);
      return false;
    }
  };

  // Submit overtime request
  const submitOvertimeRequest = async (requestData) => {
    try {
      await addDoc(collection(db, 'overtimeRequests'), {
        ...requestData,
        status: 'Pending',
        submissionDate: new Date()
      });
      alert('Overtime request submitted successfully!');
      return true;
    } catch (error) {
      console.error('Error submitting overtime request:', error);
      alert('Error submitting request: ' + error.message);
      return false;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const employeesRef = collection(db, 'employees');
          const q = query(employeesRef, where('email', '==', user.email));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const employeeData = doc.data();
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              name: employeeData.name || 'Unknown',
              role: employeeData.role || 'Employee',
              department: employeeData.department || 'General',
              employeeId: employeeData.employeeId || 'N/A',
              position: employeeData.position || 'Staff'
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setCurrentUser(null);
      }
    });

    return unsubscribe;
  }, []);

  if (!currentUser) {
    return (
      <div className="container-fluid">
        <div className="login-container">
          <div className="card">
            <div className="brand-header">
              <div className="brand-logo">
                <i className="fas fa-spa"></i>
              </div>
              <h3>Luo City Spa Club</h3>
              <p className="mb-0">Staff Portal</p>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label">
                    <i className="fas fa-envelope me-2"></i>Email Address
                  </label>
                  <input 
                    type="email" 
                    className="form-control" 
                    placeholder="Enter your email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label">
                    <i className="fas fa-lock me-2"></i>Password
                  </label>
                  <input 
                    type="password" 
                    className="form-control" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                  <small className="text-muted">Default password: spa2024</small>
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary w-100 py-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><i className="fas fa-spinner fa-spin me-2"></i>Signing in...</>
                  ) : (
                    <><i className="fas fa-sign-in-alt me-2"></i>Access Portal</>
                  )}
                </button>
              </form>
              <div className="text-center mt-3">
                <small className="text-muted">
                  <i className="fas fa-info-circle me-1"></i>
                  Use your company email and password
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Employee View Component
  const EmployeeView = () => {
    const [activeTab, setActiveTab] = useState('leave');
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [myRequests, setMyRequests] = useState([]);
    const [requestsLoading, setRequestsLoading] = useState(true);

    // Load employee's requests
    useEffect(() => {
      loadMyRequests();
    }, []);

    const loadMyRequests = async () => {
      try {
        setRequestsLoading(true);
        
        // Get leave requests
        const leaveQuery = query(
          collection(db, 'leaveRequests'),
          where('employeeId', '==', currentUser.employeeId)
        );
        
        // Get overtime requests
        const overtimeQuery = query(
          collection(db, 'overtimeRequests'),
          where('employeeId', '==', currentUser.employeeId)
        );

        const [leaveSnapshot, overtimeSnapshot] = await Promise.all([
          getDocs(leaveQuery),
          getDocs(overtimeQuery)
        ]);

        const leaveRequests = leaveSnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'Leave',
          ...doc.data()
        }));

        const overtimeRequests = overtimeSnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'Overtime',
          ...doc.data()
        }));

        // Sort by submission date (newest first)
        const allRequests = [...leaveRequests, ...overtimeRequests].sort((a, b) => {
          const dateA = a.submissionDate?.toDate ? a.submissionDate.toDate() : new Date(a.submissionDate);
          const dateB = b.submissionDate?.toDate ? b.submissionDate.toDate() : new Date(b.submissionDate);
          return dateB - dateA;
        });

        setMyRequests(allRequests);
      } catch (error) {
        console.error('Error loading requests:', error);
        alert('Error loading your requests: ' + error.message);
      } finally {
        setRequestsLoading(false);
      }
    };

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
        alert('Please fill in all required fields.');
        return;
      }

      const totalDays = calculateDaysDifference(leaveForm.startDate, leaveForm.endDate);
      
      if (totalDays <= 0) {
        alert('End date must be after start date.');
        return;
      }

      setIsSubmitting(true);

      const requestData = {
        employeeName: currentUser.name || 'Unknown',
        employeeId: currentUser.employeeId || 'N/A',
        department: currentUser.department || 'General',
        leaveType: leaveForm.leaveType,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        totalDays: totalDays,
        reason: leaveForm.reason
      };

      console.log('Submitting leave request:', requestData);

      try {
        await submitLeaveRequest(requestData);
        alert('Leave request submitted successfully!');
        setLeaveForm({ leaveType: '', startDate: '', endDate: '', reason: '' });
        loadMyRequests(); // Refresh requests list
      } catch (error) {
        console.error('Submit error:', error);
        alert('Error submitting request: ' + error.message);
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleOvertimeSubmit = async () => {
      if (!overtimeForm.adjustmentType || !overtimeForm.startDate || !overtimeForm.endDate || !overtimeForm.reason) {
        alert('Please fill in all required fields.');
        return;
      }

      const totalHours = calculateHoursDifference(overtimeForm.startDate, overtimeForm.endDate);
      
      if (totalHours <= 0) {
        alert('End time must be after start time.');
        return;
      }

      setIsSubmitting(true);

      const requestData = {
        employeeName: currentUser.name || 'Unknown',
        employeeId: currentUser.employeeId || 'N/A',
        department: currentUser.department || 'General',
        adjustmentType: overtimeForm.adjustmentType,
        startDate: overtimeForm.startDate,
        endDate: overtimeForm.endDate,
        totalHours: totalHours,
        reason: overtimeForm.reason
      };

      console.log('Submitting overtime request:', requestData);

      try {
        await submitOvertimeRequest(requestData);
        alert('Overtime request submitted successfully!');
        setOvertimeForm({ adjustmentType: 'Overtime', startDate: '', endDate: '', reason: '' });
        loadMyRequests(); // Refresh requests list
      } catch (error) {
        console.error('Submit error:', error);
        alert('Error submitting request: ' + error.message);
      } finally {
        setIsSubmitting(false);
      }
    };

    const getStatusBadgeClass = (status) => {
      switch(status) {
        case 'Approved': return 'bg-success';
        case 'Rejected': return 'bg-danger';
        case 'Pending': return 'bg-warning';
        default: return 'bg-secondary';
      }
    };

    const formatDate = (dateString) => {
      if (!dateString) return '-';
      try {
        if (dateString.toDate) {
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

            <ul className="nav nav-tabs" role="tablist">
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'leave' ? 'active' : ''}`}
                  onClick={() => setActiveTab('leave')}
                >
                  <i className="fas fa-umbrella-beach me-1"></i>Leave Request
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'overtime' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overtime')}
                >
                  <i className="fas fa-clock me-1"></i>Overtime Request
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'myRequests' ? 'active' : ''}`}
                  onClick={() => setActiveTab('myRequests')}
                >
                  <i className="fas fa-history me-1"></i>My Requests ({myRequests.length})
                </button>
              </li>
            </ul>

            <div className="tab-content mt-4">
              {/* Leave Request Tab */}
              {activeTab === 'leave' && (
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
                  </div>
                </div>
              )}

              {/* Overtime Request Tab */}
              {activeTab === 'overtime' && (
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
                  </div>
                </div>
              )}

              {/* My Requests Tab */}
              {activeTab === 'myRequests' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">My Request History</h5>
                    <button className="btn btn-sm btn-outline-primary" onClick={loadMyRequests}>
                      <i className="fas fa-sync-alt me-1"></i>Refresh
                    </button>
                  </div>

                  {requestsLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2 text-muted">Loading your requests...</p>
                    </div>
                  ) : myRequests.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                      <h5 className="text-muted">No Requests Found</h5>
                      <p className="text-muted">You haven't submitted any requests yet.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Type</th>
                            <th>Details</th>
                            <th>Dates</th>
                            <th>Duration</th>
                            <th>Status</th>
                            <th>Submitted</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myRequests.map((request, index) => (
                            <tr key={request.id || index}>
                              <td>
                                <span className={`badge ${request.type === 'Leave' ? 'bg-info' : 'bg-warning'}`}>
                                  {request.type}
                                </span>
                                <div className="small text-muted mt-1">
                                  {request.leaveType || request.adjustmentType}
                                </div>
                              </td>
                              <td>
                                <div className="small">{request.reason || 'No reason provided'}</div>
                              </td>
                              <td>
                                <div className="small">
                                  {formatDate(request.startDate)} to {formatDate(request.endDate)}
                                </div>
                              </td>
                              <td>
                                <strong>
                                  {request.type === 'Leave' ? 
                                    request.totalDays + ' days' : 
                                    request.totalHours + ' hours'
                                  }
                                </strong>
                              </td>
                              <td>
                                <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                                  {request.status}
                                </span>
                                {request.approvedBy && (
                                  <div className="small text-muted mt-1">
                                    by {request.approvedBy}
                                  </div>
                                )}
                              </td>
                              <td>
                                <small>{formatDate(request.submissionDate)}</small>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Head View Component - Fixed to only show their department
  const HeadView = () => {
    const [departmentRequests, setDepartmentRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      loadDepartmentRequests();
    }, []);

    const loadDepartmentRequests = async () => {
      try {
        setIsLoading(true);
        
        console.log('Loading requests for department:', currentUser.department);
        
        // Get leave requests for their department only
        const leaveQuery = query(
          collection(db, 'leaveRequests'),
          where('department', '==', currentUser.department),
          where('status', '==', 'Pending')
        );
        
        // Get overtime requests for their department only
        const overtimeQuery = query(
          collection(db, 'overtimeRequests'),
          where('department', '==', currentUser.department),
          where('status', '==', 'Pending')
        );

        const [leaveSnapshot, overtimeSnapshot] = await Promise.all([
          getDocs(leaveQuery),
          getDocs(overtimeQuery)
        ]);

        const leaveRequests = leaveSnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'Leave',
          ...doc.data()
        }));

        const overtimeRequests = overtimeSnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'Overtime',
          ...doc.data()
        }));

        console.log(`Found ${leaveRequests.length} leave requests and ${overtimeRequests.length} overtime requests for ${currentUser.department}`);

        setDepartmentRequests([...leaveRequests, ...overtimeRequests]);
      } catch (error) {
        console.error('Error loading requests:', error);
        alert('Error loading requests: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    const updateRequestStatus = async (requestId, status, type) => {
      try {
        const collectionName = type === 'Leave' ? 'leaveRequests' : 'overtimeRequests';
        const requestRef = doc(db, collectionName, requestId);
        await updateDoc(requestRef, {
          status,
          approvedBy: currentUser.name,
          approvedAt: new Date()
        });
        
        alert(`Request ${status.toLowerCase()} successfully!`);
        loadDepartmentRequests(); // Refresh the list
      } catch (error) {
        console.error('Error updating request:', error);
        alert('Error updating request: ' + error.message);
      }
    };

    const formatDate = (dateString) => {
      if (!dateString) return '-';
      try {
        if (dateString.toDate) {
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

    return (
      <div className="row">
        <div className="col-12">
          <div className="dashboard-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h4 className="mb-1">
                  <i className="fas fa-user-tie me-2 text-primary"></i>Manager Dashboard
                </h4>
                <p className="text-muted mb-0">Department: {currentUser.department}</p>
              </div>
              <span className="badge bg-warning">Department Head</span>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Pending Requests for {currentUser.department} Department</h5>
              <button className="btn btn-sm btn-primary" onClick={loadDepartmentRequests}>
                <i className="fas fa-sync-alt me-1"></i>Refresh
              </button>
            </div>
            
            {isLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading requests for {currentUser.department}...</p>
              </div>
            ) : departmentRequests.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">No Pending Requests</h5>
                <p className="text-muted">No pending requests found in {currentUser.department} department.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover table-bordered">
                  <thead className="table-dark">
                    <tr>
                      <th>Employee</th>
                      <th>Type</th>
                      <th>Dates</th>
                      <th>Duration</th>
                      <th>Reason</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentRequests.map((request, index) => (
                      <tr key={request.id || index}>
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
                        <td>
                          <div className="btn-group-vertical">
                            <button 
                              className="btn btn-success btn-sm mb-1" 
                              onClick={() => updateRequestStatus(request.id, 'Approved', request.type)}
                            >
                              <i className="fas fa-check me-1"></i>Approve
                            </button>
                            <button 
                              className="btn btn-danger btn-sm" 
                              onClick={() => updateRequestStatus(request.id, 'Rejected', request.type)}
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
            )}
          </div>
        </div>
      </div>
    );
  };

  // HR View Component - Enhanced with Request Filtering
  const HRView = () => {
    const [allRequests, setAllRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hrActiveTab, setHrActiveTab] = useState('requests');
    
    // Add Employee Form State
    const [newEmployee, setNewEmployee] = useState({
      name: '',
      email: '',
      role: 'Employee',
      department: '',
      employeeId: '',
      position: '',
      hireDate: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit Employee State
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [editForm, setEditForm] = useState({
      name: '',
      email: '',
      role: '',
      department: '',
      employeeId: '',
      position: '',
      hireDate: ''
    });

    // Search and Filter State
    const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
    const [employeeFilterDepartment, setEmployeeFilterDepartment] = useState('');
    const [employeeFilterRole, setEmployeeFilterRole] = useState('');

    // Request Filter State
    const [requestSearchTerm, setRequestSearchTerm] = useState('');
    const [requestFilterDepartment, setRequestFilterDepartment] = useState('');
    const [requestFilterStatus, setRequestFilterStatus] = useState('');
    const [requestFilterType, setRequestFilterType] = useState('');

    const departments = [
      'Massage Therapist',
      'Operation', 
      'Reception',
      'Technical',
      'Human Resources',
      'Maintenance',
      'Admin',
      'Finance',
      'Accounting'
    ];

    const roles = ['Employee', 'Head', 'HR'];
    const statuses = ['Pending', 'Approved', 'Rejected'];
    const requestTypes = ['Leave', 'Overtime'];

    useEffect(() => {
      loadHRData();
    }, []);

    useEffect(() => {
      filterEmployees();
    }, [employees, employeeSearchTerm, employeeFilterDepartment, employeeFilterRole]);

    useEffect(() => {
      filterRequests();
    }, [allRequests, requestSearchTerm, requestFilterDepartment, requestFilterStatus, requestFilterType]);

    const loadHRData = async () => {
      try {
        setIsLoading(true);
        
        const [leaveSnapshot, overtimeSnapshot, employeesSnapshot] = await Promise.all([
          getDocs(collection(db, 'leaveRequests')),
          getDocs(collection(db, 'overtimeRequests')),
          getDocs(collection(db, 'employees'))
        ]);

        const leaveRequests = leaveSnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'Leave',
          ...doc.data()
        }));

        const overtimeRequests = overtimeSnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'Overtime',
          ...doc.data()
        }));

        const employeesData = employeesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort requests by submission date (newest first)
        const allRequestsData = [...leaveRequests, ...overtimeRequests].sort((a, b) => {
          const dateA = a.submissionDate?.toDate ? a.submissionDate.toDate() : new Date(a.submissionDate);
          const dateB = b.submissionDate?.toDate ? b.submissionDate.toDate() : new Date(b.submissionDate);
          return dateB - dateA;
        });

        setAllRequests(allRequestsData);
        setEmployees(employeesData);
      } catch (error) {
        console.error('Error loading HR data:', error);
        alert('Error loading data: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    const filterEmployees = () => {
      let filtered = employees;

      // Search by name, email, or employee ID
      if (employeeSearchTerm) {
        filtered = filtered.filter(emp => 
          emp.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
          emp.email.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
          emp.employeeId.toLowerCase().includes(employeeSearchTerm.toLowerCase())
        );
      }

      // Filter by department
      if (employeeFilterDepartment) {
        filtered = filtered.filter(emp => emp.department === employeeFilterDepartment);
      }

      // Filter by role
      if (employeeFilterRole) {
        filtered = filtered.filter(emp => emp.role === employeeFilterRole);
      }

      setFilteredEmployees(filtered);
    };

    const filterRequests = () => {
      let filtered = allRequests;

      // Search by employee name, email, or ID
      if (requestSearchTerm) {
        filtered = filtered.filter(request => 
          request.employeeName.toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
          request.employeeId.toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
          (request.employeeEmail && request.employeeEmail.toLowerCase().includes(requestSearchTerm.toLowerCase()))
        );
      }

      // Filter by department
      if (requestFilterDepartment) {
        filtered = filtered.filter(request => request.department === requestFilterDepartment);
      }

      // Filter by status
      if (requestFilterStatus) {
        filtered = filtered.filter(request => request.status === requestFilterStatus);
      }

      // Filter by type
      if (requestFilterType) {
        filtered = filtered.filter(request => request.type === requestFilterType);
      }

      setFilteredRequests(filtered);
    };

    // Add Employee Function - Fixed to not auto-login
    const handleAddEmployee = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
        // Validate required fields
        if (!newEmployee.name || !newEmployee.email || !newEmployee.department || !newEmployee.employeeId) {
          alert('Please fill in all required fields.');
          return;
        }

        // Check if employee ID already exists
        const existingEmployee = employees.find(emp => emp.employeeId === newEmployee.employeeId);
        if (existingEmployee) {
          alert(`Employee ID ${newEmployee.employeeId} already exists.`);
          return;
        }

        // Check if email already exists
        const existingEmail = employees.find(emp => emp.email === newEmployee.email);
        if (existingEmail) {
          alert(`Email ${newEmployee.email} is already registered.`);
          return;
        }

        console.log('Adding new employee:', newEmployee);

        // Create auth user with default password (without auto-login)
        const password = 'spa2024';
        await createUserWithEmailAndPassword(auth, newEmployee.email, password);

        // Add employee to Firestore
        const employeeData = {
          name: newEmployee.name,
          email: newEmployee.email,
          role: newEmployee.role,
          department: newEmployee.department,
          employeeId: newEmployee.employeeId,
          position: newEmployee.position,
          hireDate: newEmployee.hireDate ? new Date(newEmployee.hireDate) : new Date(),
          createdAt: new Date()
        };

        await addDoc(collection(db, 'employees'), employeeData);

        alert(`Employee ${newEmployee.name} added successfully!\n\nEmail: ${newEmployee.email}\nDefault Password: spa2024\n\nPlease inform the employee to use these credentials for login.`);
        
        // Reset form and refresh data
        setNewEmployee({
          name: '',
          email: '',
          role: 'Employee',
          department: '',
          employeeId: '',
          position: '',
          hireDate: ''
        });
        loadHRData();

      } catch (error) {
        console.error('Error adding employee:', error);
        if (error.code === 'auth/email-already-in-use') {
          alert('This email is already registered in the system.');
        } else {
          alert('Failed to add employee: ' + error.message);
        }
      } finally {
        setIsSubmitting(false);
      }
    };

    // Edit Employee Function
    const handleEditEmployee = (employee) => {
      setEditingEmployee(employee);
      setEditForm({
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
        employeeId: employee.employeeId,
        position: employee.position || '',
        hireDate: employee.hireDate ? new Date(employee.hireDate.toDate ? employee.hireDate.toDate() : employee.hireDate).toISOString().split('T')[0] : ''
      });
    };

    const handleUpdateEmployee = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
        if (!editForm.name || !editForm.email || !editForm.department || !editForm.employeeId) {
          alert('Please fill in all required fields.');
          return;
        }

        // Check if employee ID already exists (excluding current employee)
        const existingEmployee = employees.find(emp => 
          emp.employeeId === editForm.employeeId && emp.id !== editingEmployee.id
        );
        if (existingEmployee) {
          alert(`Employee ID ${editForm.employeeId} already exists.`);
          return;
        }

        const employeeRef = doc(db, 'employees', editingEmployee.id);
        await updateDoc(employeeRef, {
          name: editForm.name,
          email: editForm.email,
          role: editForm.role,
          department: editForm.department,
          employeeId: editForm.employeeId,
          position: editForm.position,
          hireDate: editForm.hireDate ? new Date(editForm.hireDate) : editingEmployee.hireDate,
          updatedAt: new Date()
        });

        alert('Employee updated successfully!');
        setEditingEmployee(null);
        loadHRData();
      } catch (error) {
        console.error('Error updating employee:', error);
        alert('Failed to update employee: ' + error.message);
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleDeleteEmployee = async (employee) => {
      if (!window.confirm(`Are you sure you want to delete ${employee.name}? This action cannot be undone.`)) {
        return;
      }

      try {
        // Note: We're only deleting from Firestore, not from Auth (for safety)
        // In production, you might want to also delete the auth user
        await deleteDoc(doc(db, 'employees', employee.id));
        
        alert(`Employee ${employee.name} deleted successfully!`);
        loadHRData();
      } catch (error) {
        console.error('Error deleting employee:', error);
        alert('Failed to delete employee: ' + error.message);
      }
    };

    const getStatusBadgeClass = (status) => {
      switch(status) {
        case 'Approved': return 'bg-success';
        case 'Rejected': return 'bg-danger';
        case 'Pending': return 'bg-warning';
        default: return 'bg-secondary';
      }
    };

    const formatDate = (dateString) => {
      if (!dateString) return '-';
      try {
        if (dateString.toDate) {
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

    const clearEmployeeFilters = () => {
      setEmployeeSearchTerm('');
      setEmployeeFilterDepartment('');
      setEmployeeFilterRole('');
    };

    const clearRequestFilters = () => {
      setRequestSearchTerm('');
      setRequestFilterDepartment('');
      setRequestFilterStatus('');
      setRequestFilterType('');
    };

    return (
      <div className="row">
        <div className="col-12">
          <div className="dashboard-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h4 className="mb-1">
                  <i className="fas fa-users me-2 text-primary"></i>HR Management Dashboard
                </h4>
                <p className="text-muted mb-0">Complete oversight of all staff requests and employees</p>
              </div>
              <span className="badge bg-info">HR Administrator</span>
            </div>

            {/* Tabs Navigation */}
            <ul className="nav nav-tabs" role="tablist">
              <li className="nav-item">
                <button 
                  className={`nav-link ${hrActiveTab === 'requests' ? 'active' : ''}`}
                  onClick={() => setHrActiveTab('requests')}
                >
                  <i className="fas fa-list me-1"></i>All Requests ({filteredRequests.length})
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${hrActiveTab === 'employees' ? 'active' : ''}`}
                  onClick={() => setHrActiveTab('employees')}
                >
                  <i className="fas fa-users me-1"></i>Employees ({filteredEmployees.length})
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${hrActiveTab === 'addEmployee' ? 'active' : ''}`}
                  onClick={() => setHrActiveTab('addEmployee')}
                >
                  <i className="fas fa-user-plus me-1"></i>Add Employee
                </button>
              </li>
            </ul>

            <div className="tab-content mt-4">
              {/* Requests Tab */}
              {hrActiveTab === 'requests' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">
                      All Staff Requests ({filteredRequests.length} of {allRequests.length})
                    </h5>
                    <button className="btn btn-sm btn-outline-primary" onClick={loadHRData}>
                      <i className="fas fa-sync-alt me-1"></i>Refresh
                    </button>
                  </div>

                  {/* Request Search and Filter Section */}
                  <div className="row mb-3">
                    <div className="col-md-3">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by employee name or ID..."
                        value={requestSearchTerm}
                        onChange={(e) => setRequestSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="col-md-2">
                      <select
                        className="form-select"
                        value={requestFilterDepartment}
                        onChange={(e) => setRequestFilterDepartment(e.target.value)}
                      >
                        <option value="">All Departments</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-2">
                      <select
                        className="form-select"
                        value={requestFilterStatus}
                        onChange={(e) => setRequestFilterStatus(e.target.value)}
                      >
                        <option value="">All Status</option>
                        {statuses.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-2">
                      <select
                        className="form-select"
                        value={requestFilterType}
                        onChange={(e) => setRequestFilterType(e.target.value)}
                      >
                        <option value="">All Types</option>
                        {requestTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-2">
                      <button 
                        className="btn btn-outline-secondary w-100"
                        onClick={clearRequestFilters}
                      >
                        <i className="fas fa-times me-1"></i>Clear
                      </button>
                    </div>
                  </div>
                  
                  <div className="table-responsive">
                    <table className="table table-hover mobile-friendly">
                      <thead className="table-light">
                        <tr>
                          <th>Employee</th>
                          <th>Department</th>
                          <th>Type</th>
                          <th>Details</th>
                          <th>Status</th>
                          <th>Submitted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr>
                            <td colSpan="6" className="text-center py-4">
                              <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                              <p className="mt-2 text-muted">Loading all requests...</p>
                            </td>
                          </tr>
                        ) : filteredRequests.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center py-4 text-muted">
                              No requests found matching your filters.
                            </td>
                          </tr>
                        ) : (
                          filteredRequests.map((request, index) => (
                            <tr key={request.id || index}>
                              <td>
                                <div className="fw-semibold">{request.employeeName}</div>
                                <small className="text-muted">{request.employeeId}</small>
                              </td>
                              <td>
                                <span className="badge bg-light text-dark">
                                  {request.department}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${request.type === 'Leave' ? 'bg-info' : 'bg-warning'}`}>
                                  {request.type}
                                </span>
                                <div className="small text-muted mt-1">
                                  {request.leaveType || request.adjustmentType}
                                </div>
                              </td>
                              <td>
                                <div className="small">
                                  {formatDate(request.startDate)} to {formatDate(request.endDate)}
                                </div>
                                <div className="small text-muted">
                                  {request.type === 'Leave' ? 
                                    request.totalDays + ' days' : 
                                    request.totalHours + ' hours'
                                  }
                                </div>
                                <div className="small text-truncate" style={{maxWidth: '200px'}} title={request.reason || 'No reason'}>
                                  {request.reason || '-'}
                                </div>
                              </td>
                              <td>
                                <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                                  {request.status}
                                </span>
                                {request.approvedBy && (
                                  <div className="small text-muted">
                                    by {request.approvedBy}
                                  </div>
                                )}
                              </td>
                              <td>
                                <small>{formatDate(request.submissionDate)}</small>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Employees Tab */}
              {hrActiveTab === 'employees' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">
                      All Employees ({filteredEmployees.length} of {employees.length})
                    </h5>
                    <div>
                      <button 
                        className="btn btn-sm btn-outline-primary me-2" 
                        onClick={loadHRData}
                      >
                        <i className="fas fa-sync-alt me-1"></i>Refresh
                      </button>
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => setHrActiveTab('addEmployee')}
                      >
                        <i className="fas fa-user-plus me-1"></i>Add New Employee
                      </button>
                    </div>
                  </div>

                  {/* Employee Search and Filter Section */}
                  <div className="row mb-3">
                    <div className="col-md-4">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by name, email, or ID..."
                        value={employeeSearchTerm}
                        onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="col-md-3">
                      <select
                        className="form-select"
                        value={employeeFilterDepartment}
                        onChange={(e) => setEmployeeFilterDepartment(e.target.value)}
                      >
                        <option value="">All Departments</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <select
                        className="form-select"
                        value={employeeFilterRole}
                        onChange={(e) => setEmployeeFilterRole(e.target.value)}
                      >
                        <option value="">All Roles</option>
                        {roles.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-2">
                      <button 
                        className="btn btn-outline-secondary w-100"
                        onClick={clearEmployeeFilters}
                      >
                        <i className="fas fa-times me-1"></i>Clear
                      </button>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-hover mobile-friendly">
                      <thead className="table-light">
                        <tr>
                          <th>Name</th>
                          <th>Employee ID</th>
                          <th>Department</th>
                          <th>Position</th>
                          <th>Role</th>
                          <th>Email</th>
                          <th>Hire Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr>
                            <td colSpan="8" className="text-center py-4">
                              <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                              <p className="mt-2 text-muted">Loading employees...</p>
                            </td>
                          </tr>
                        ) : filteredEmployees.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="text-center py-4 text-muted">
                              No employees found matching your filters. <a href="#" onClick={() => setHrActiveTab('addEmployee')}>Add a new employee</a>
                            </td>
                          </tr>
                        ) : (
                          filteredEmployees.map((employee, index) => (
                            <tr key={employee.id || index}>
                              <td>
                                <div className="fw-semibold">{employee.name}</div>
                              </td>
                              <td>
                                <code>{employee.employeeId}</code>
                              </td>
                              <td>
                                <span className="badge bg-light text-dark">
                                  {employee.department}
                                </span>
                              </td>
                              <td>{employee.position}</td>
                              <td>
                                <span className={`badge ${
                                  employee.role === 'HR' ? 'bg-info' : 
                                  employee.role === 'Head' ? 'bg-warning' : 'bg-primary'
                                }`}>
                                  {employee.role}
                                </span>
                              </td>
                              <td>
                                <small>{employee.email}</small>
                              </td>
                              <td>
                                <small>{formatDate(employee.hireDate)}</small>
                              </td>
                              <td>
                                <div className="btn-group btn-group-sm">
                                  <button 
                                    className="btn btn-outline-primary"
                                    onClick={() => handleEditEmployee(employee)}
                                    title="Edit Employee"
                                  >
                                    <i className="fas fa-edit"></i>
                                  </button>
                                  <button 
                                    className="btn btn-outline-danger"
                                    onClick={() => handleDeleteEmployee(employee)}
                                    title="Delete Employee"
                                    disabled={employee.email === currentUser.email} // Can't delete yourself
                                  >
                                    <i className="fas fa-trash"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Add Employee Tab */}
              {hrActiveTab === 'addEmployee' && (
                <div className="row">
                  <div className="col-12">
                    <div className="dashboard-card">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="mb-0">
                          <i className="fas fa-user-plus me-2 text-primary"></i>Add New Employee
                        </h5>
                        <button 
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setHrActiveTab('employees')}
                        >
                          <i className="fas fa-arrow-left me-1"></i>Back to Employees
                        </button>
                      </div>

                      <form onSubmit={handleAddEmployee}>
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label className="form-label">Full Name <span className="text-danger">*</span></label>
                            <input
                              type="text"
                              className="form-control"
                              value={newEmployee.name}
                              onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                              placeholder="Enter full name"
                              required
                            />
                          </div>

                          <div className="col-md-6 mb-3">
                            <label className="form-label">Email Address <span className="text-danger">*</span></label>
                            <input
                              type="email"
                              className="form-control"
                              value={newEmployee.email}
                              onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                              placeholder="Enter company email"
                              required
                            />
                          </div>

                          <div className="col-md-6 mb-3">
                            <label className="form-label">Employee ID <span className="text-danger">*</span></label>
                            <input
                              type="text"
                              className="form-control"
                              value={newEmployee.employeeId}
                              onChange={(e) => setNewEmployee({...newEmployee, employeeId: e.target.value})}
                              placeholder="e.g., MT001, SC001"
                              required
                            />
                          </div>

                          <div className="col-md-6 mb-3">
                            <label className="form-label">Department <span className="text-danger">*</span></label>
                            <select
                              className="form-select"
                              value={newEmployee.department}
                              onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                              required
                            >
                              <option value="">Select Department</option>
                              {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                              ))}
                            </select>
                          </div>

                          <div className="col-md-6 mb-3">
                            <label className="form-label">Position</label>
                            <input
                              type="text"
                              className="form-control"
                              value={newEmployee.position}
                              onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
                              placeholder="e.g., Senior Massage Therapist"
                            />
                          </div>

                          <div className="col-md-6 mb-3">
                            <label className="form-label">Role <span className="text-danger">*</span></label>
                            <select
                              className="form-select"
                              value={newEmployee.role}
                              onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                              required
                            >
                              {roles.map(role => (
                                <option key={role} value={role}>{role}</option>
                              ))}
                            </select>
                          </div>

                          <div className="col-md-6 mb-3">
                            <label className="form-label">Hire Date</label>
                            <input
                              type="date"
                              className="form-control"
                              value={newEmployee.hireDate}
                              onChange={(e) => setNewEmployee({...newEmployee, hireDate: e.target.value})}
                            />
                          </div>
                        </div>

                        <div className="alert alert-info">
                          <i className="fas fa-info-circle me-2"></i>
                          <strong>Default Password:</strong> spa2024<br/>
                          <small>The employee will use this password for their first login.</small>
                        </div>

                        <div className="d-flex gap-2">
                          <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <><i className="fas fa-spinner fa-spin me-2"></i>Adding Employee...</>
                            ) : (
                              <><i className="fas fa-user-plus me-2"></i>Add Employee</>
                            )}
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-outline-secondary"
                            onClick={() => {
                              setNewEmployee({
                                name: '',
                                email: '',
                                role: 'Employee',
                                department: '',
                                employeeId: '',
                                position: '',
                                hireDate: ''
                              });
                            }}
                          >
                            <i className="fas fa-undo me-2"></i>Clear Form
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Employee Modal */}
        {editingEmployee && (
          <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fas fa-edit me-2"></i>Edit Employee: {editingEmployee.name}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setEditingEmployee(null)}
                  ></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleUpdateEmployee}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Full Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          value={editForm.name}
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Email Address <span className="text-danger">*</span></label>
                        <input
                          type="email"
                          className="form-control"
                          value={editForm.email}
                          onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Employee ID <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          value={editForm.employeeId}
                          onChange={(e) => setEditForm({...editForm, employeeId: e.target.value})}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Department <span className="text-danger">*</span></label>
                        <select
                          className="form-select"
                          value={editForm.department}
                          onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                          required
                        >
                          <option value="">Select Department</option>
                          {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Position</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editForm.position}
                          onChange={(e) => setEditForm({...editForm, position: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Role <span className="text-danger">*</span></label>
                        <select
                          className="form-select"
                          value={editForm.role}
                          onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                          required
                        >
                          {roles.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Hire Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={editForm.hireDate}
                          onChange={(e) => setEditForm({...editForm, hireDate: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={() => setEditingEmployee(null)}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <><i className="fas fa-spinner fa-spin me-2"></i>Updating...</>
                        ) : (
                          <><i className="fas fa-save me-2"></i>Update Employee</>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="App">
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
        <div className="container-fluid">
          <span className="navbar-brand">
            <i className="fas fa-spa me-2"></i>Luo City Spa Club
          </span>
          <div className="navbar-nav ms-auto align-items-center">
            <span className="navbar-text me-3 d-none d-md-block">
              Welcome, {currentUser.name} ({currentUser.role})
            </span>
            <div className="btn-group">
              <button className="btn btn-outline-secondary btn-sm">
                <i className="fas fa-question-circle me-1"></i>Help
              </button>
              <button className="btn btn-outline-primary btn-sm" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt me-1"></i>Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container-fluid mt-4">
        {currentUser.role === 'Employee' && <EmployeeView />}
        {currentUser.role === 'Head' && <HeadView />}
        {currentUser.role === 'HR' && <HRView />}
      </div>
    </div>
  );
}

export default App;