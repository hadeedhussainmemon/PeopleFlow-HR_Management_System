import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import TeamRequests from './pages/TeamRequests';
import ApplyLeave from './pages/ApplyLeave';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/CalendarPage';
import Settings from './pages/Settings';
import Layout from './components/Layout';

const PrivateRoute = ({ children }) => {
  const { isLoggedIn, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  return isLoggedIn ? children : <Navigate to="/login" />;
};

const App = () => {
  const { isLoggedIn, user, checkAuth, isLoading } = useAuth();

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={isLoggedIn ? <Navigate to="/" /> : <Login />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/apply-leave" element={<ApplyLeave />} />
                  <Route path="/settings" element={<Settings />} />
                  {(user?.role === 'manager' || user?.role === 'admin') && (
                    <Route path="/team-requests" element={<TeamRequests />} />
                  )}
                  {user?.role === 'admin' ? (
                    <>
                      <Route path="/admin-dashboard" element={<AdminDashboard />} />
                      <Route path="/admin/users" element={<AdminUsers />} />
                    </>
                  ) : (
                    <Route path="/admin-dashboard" element={<Navigate to="/" replace />} />
                  )}
                  {/* Catch all for inner routes */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;