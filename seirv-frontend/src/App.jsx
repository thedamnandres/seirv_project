import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Loading from './components/Loading';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Vehicles = lazy(() => import('./pages/Vehicles'));
const VehicleForm = lazy(() => import('./pages/VehicleForm'));
const Recalls = lazy(() => import('./pages/Recalls'));
const UsersManagement = lazy(() => import('./pages/UsersManagement'));
import './App.css';

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
        <div className="app">
      {!isAuthPage && <Navbar />}
          <Suspense fallback={<Loading />}>
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
          </Suspense>
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
