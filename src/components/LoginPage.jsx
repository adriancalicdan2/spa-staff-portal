// src/components/LoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = ({ showMessage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      showMessage('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
    } catch (error) {
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.message === 'Employee record not found') {
        errorMessage = 'No employee record found for this email.';
      }
      
      showMessage('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  <i className="fas fa-envelope me-2"></i>Email Address
                </label>
                <input 
                  type="email" 
                  className="form-control" 
                  id="email" 
                  placeholder="Enter your company email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="mb-4">
                <label htmlFor="password" className="form-label">
                  <i className="fas fa-lock me-2"></i>Password
                </label>
                <input 
                  type="password" 
                  className="form-control" 
                  id="password" 
                  placeholder="Enter your password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary w-100 py-2" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>Signing in...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt me-2"></i>Access Portal
                  </>
                )}
              </button>
            </form>
            <div className="text-center mt-3">
              <small className="text-muted">
                <i className="fas fa-info-circle me-1"></i>
                Use your company email and password to login
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;