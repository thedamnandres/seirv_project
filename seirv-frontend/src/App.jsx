import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Loading from './components/Loading';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import './App.css';

// Páginas con lazy loading
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Vehicles = lazy(() => import('./pages/Vehicles'));
const VehicleForm = lazy(() => import('./pages/VehicleForm'));
const VehicleDetail = lazy(() => import('./pages/VehicleDetail'));   // <-- NUEVO
const Recalls = lazy(() => import('./pages/Recalls'));
const UsersManagement = lazy(() => import('./pages/UsersManagement'));
const AdminRecalls = lazy(() => import('./pages/AdminRecalls'));
const AdminRecallDetail = lazy(() => import('./pages/AdminRecallDetail'));


function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="app">
      {!isAuthPage && <Navbar />}
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Redirección inicial */}
          <Route path="/" element={<Navigate to="/login" />} />

          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rutas privadas */}
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

          {/* --- RUTA NUEVA: DETALLE DEL VEHÍCULO --- */}
          <Route
            path="/vehicles/:id"
            element={
              <PrivateRoute>
                <VehicleDetail />
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

          {/* Ruta solo admin */}
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <UsersManagement />
              </AdminRoute>
            }
          />
           <Route
            path="/admin/recalls"
            element={
              <AdminRoute>
                <AdminRecalls />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/recalls/:id"
            element={
              <AdminRoute>
                <AdminRecallDetail />
              </AdminRoute>
            }
          />

          {/* Fallback */}
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
