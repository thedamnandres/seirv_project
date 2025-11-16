import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import VehicleForm from './pages/VehicleForm';
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
