import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import JoinOrganization from './pages/auth/JoinOrganization';
import AdminPanel from './pages/AdminPanel';
import PrivateRoute from './components/auth/PrivateRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/join" element={<JoinOrganization />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard/*" element={
              <PrivateRoute>
                <AdminPanel />
              </PrivateRoute>
            } />

            {/* Redirect root to signin */}
            <Route path="/" element={<Navigate to="/signin\" replace />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;