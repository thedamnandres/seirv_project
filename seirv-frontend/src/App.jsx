import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import VehicleForm from './pages/VehicleForm';
import Recalls from './pages/Recalls';
import UsersManagement from './pages/UsersManagement';
import './App.css';

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
        <div className="app">
      {!isAuthPage && <Navbar />}
          <Routes>
            {/* primera vista → login */}
            <Route path="/" element={<Navigate to="/login" />} />

            {/* públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* protegidas */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />

            <Route
              path="/vehicles"
              element={
                <PrivateRoute>
                  <Vehicles />
                </PrivateRoute>
              }
            />

            <Route
              path="/vehicles/new"
              element={
                <PrivateRoute>
                  <VehicleForm />
                </PrivateRoute>
              }
            />

            <Route
              path="/recalls"
              element={
                <PrivateRoute>
                  <Recalls />
                </PrivateRoute>
              }
            />

            {/* ruta de administración - solo para admin */}
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <UsersManagement />
                </AdminRoute>
              }
            />

            {/* fallback */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
