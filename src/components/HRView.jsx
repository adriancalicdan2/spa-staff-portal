// src/components/HRView.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAllRequests, getAllEmployees, createEmployee } from '../services/firebaseService';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';

const HRView = ({ showMessage }) => {
  const { currentUser } = useAuth();
  const [allRequests, setAllRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New employee form state
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    role: 'Employee',
    department: '',
    employeeId: '',
    position: '',
    hireDate: ''
  });

  const departments = [
    'Massage Therapy',
    'Skin Care',
    'Reception',
    'Spa Management',
    'Human Resources',
    'Maintenance',
    'Training'
  ];

  const roles = ['Employee', 'Head', 'HR'];

  useEffect(() => {
    loadHRData();
  }, []);

  const loadHRData = async () => {
    try {
      setIsLoading(true);
      const [requestsData, employeesData] = await Promise.all([
        getAllRequests(),
        getAllEmployees()
      ]);
      
      setAllRequests(requestsData);
      setEmployees(employeesData);
    } catch (error) {
      showMessage('Error', 'Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!newEmployee.name || !newEmployee.email || !newEmployee.department || !newEmployee.employeeId) {
        showMessage('Error', 'Please fill in all required fields.');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmployee.email)) {
        showMessage('Error', 'Please enter a valid email address.');
        return;
      }

      // Check if employee ID already exists
      const existingEmployee = employees.find(emp => emp.employeeId === newEmployee.employeeId);
      if (existingEmployee) {
        showMessage('Error', `Employee ID ${newEmployee.employeeId} already exists.`);
        return;
      }

      // Check if email already exists
      const existingEmail = employees.find(emp => emp.email === newEmployee.email);
      if (existingEmail) {
        showMessage('Error', `Email ${newEmployee.email} is already registered.`);
        return;
      }

      console.log('Adding new employee:', newEmployee);

      // Create auth user with default password
      const password = 'spa2024'; // Default password
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

      await createEmployee(employeeData);

      showMessage('Success', `Employee ${newEmployee.name} added successfully! Default password: spa2024`);
      
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
      setShowAddForm(false);
      loadHRData();

    } catch (error) {
      console.error('Error adding employee:', error);
      if (error.code === 'auth/email-already-in-use') {
        showMessage('Error', 'This email is already registered in authentication.');
      } else {
        showMessage('Error', 'Failed to add employee: ' + error.message);
      }
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
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      } else {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      }
    } catch (e) {
      return String(dateString);
    }
  };

  const getStats = () => {
    const totalEmployees = employees.length;
    const totalRequests = allRequests.length;
    const pendingRequests = allRequests.filter(r => r.status === 'Pending').length;
    const approvedRequests = allRequests.filter(r => r.status === 'Approved').length;

    return { totalEmployees, totalRequests, pendingRequests, approvedRequests };
  };

  const stats = getStats();

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

          {/* Statistics Cards */}
          <div className="row mb-4">
            <div className="col-md-3 col-6">
              <div className="stat-card">
                <div className="stat-number">{stats.totalEmployees}</div>
                <div className="text-muted">Total Employees</div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="stat-card">
                <div className="stat-number">{stats.totalRequests}</div>
                <div className="text-muted">Total Requests</div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="stat-card">
                <div className="stat-number">{stats.pendingRequests}</div>
                <div className="text-muted">Pending</div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="stat-card">
                <div className="stat-number">{stats.approvedRequests}</div>
                <div className="text-muted">Approved</div>
              </div>
            </div>
          </div>

          <ul className="nav nav-tabs" role="tablist">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'requests' ? 'active' : ''}`}
                onClick={() => setActiveTab('requests')}
              >
                <i className="fas fa-list me-1"></i>All Requests
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'employees' ? 'active' : ''}`}
                onClick={() => setActiveTab('employees')}
              >
                <i className="fas fa-users me-1"></i>Employees ({employees.length})
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'addEmployee' ? 'active' : ''}`}
                onClick={() => setActiveTab('addEmployee')}
              >
                <i className="fas fa-user-plus me-1"></i>Add Employee
              </button>
            </li>
          </ul>

          <div className="tab-content mt-4">
            {/* Requests Tab */}
            <div className={`tab-pane fade ${activeTab === 'requests' ? 'show active' : ''}`}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">All Staff Requests</h5>
                <button className="btn btn-sm btn-outline-primary" onClick={loadHRData}>
                  <i className="fas fa-sync-alt me-1"></i>Refresh
                </button>
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
                    ) : allRequests.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-muted">
                          No requests found in the system
                        </td>
                      </tr>
                    ) : (
                      allRequests.map((request, index) => (
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

            {/* Employees Tab */}
            <div className={`tab-pane fade ${activeTab === 'employees' ? 'show active' : ''}`}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">All Employees ({employees.length})</h5>
                <div>
                  <button 
                    className="btn btn-sm btn-outline-primary me-2" 
                    onClick={loadHRData}
                  >
                    <i className="fas fa-sync-alt me-1"></i>Refresh
                  </button>
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={() => setActiveTab('addEmployee')}
                  >
                    <i className="fas fa-user-plus me-1"></i>Add New Employee
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
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <p className="mt-2 text-muted">Loading employees...</p>
                        </td>
                      </tr>
                    ) : employees.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4 text-muted">
                          No employees found. <a href="#" onClick={() => setActiveTab('addEmployee')}>Add the first employee</a>
                        </td>
                      </tr>
                    ) : (
                      employees.map((employee, index) => (
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
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add Employee Tab */}
            <div className={`tab-pane fade ${activeTab === 'addEmployee' ? 'show active' : ''}`}>
              <div className="row">
                <div className="col-12">
                  <div className="dashboard-card">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="mb-0">
                        <i className="fas fa-user-plus me-2 text-primary"></i>Add New Employee
                      </h5>
                      <button 
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setActiveTab('employees')}
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
                        <small>The employee will use this password for their first login. They should change it after logging in.</small>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRView;