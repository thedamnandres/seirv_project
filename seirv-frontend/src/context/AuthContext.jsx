import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

// Usar variable de entorno o default a localhost para desarrollo
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';


function saveAuthData(token, user) {
  if (token) localStorage.setItem('access_token', token);
  if (user) localStorage.setItem('user', JSON.stringify(user));
}

function loadUserFromStorage() {
  const stored = localStorage.getItem('user');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function clearAuthData() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(loadUserFromStorage());
  const [loading, setLoading] = useState(true);

  // Al montar, si hay token, opcionalmente podríamos validar con /auth/me
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }

    // Intentar obtener info actualizada del usuario
    const fetchMe = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          // asumo que el backend devuelve info del usuario aquí
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        } else {
          clearAuthData();
          setUser(null);
        }
      } catch {
        // si falla, sigue con lo que haya en localStorage
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

const login = async ({ username, password }) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    let errorData = {};
    try {
      errorData = await res.json();
    } catch {
      // no body legible
    }
    const msg = errorData.detail || 'Credenciales incorrectas';
    const err = new Error(msg);
    err.response = { data: errorData };
    throw err;
  }

  const data = await res.json();

  // el backend te devuelve exactamente esto:
  // { access_token, token_type, user: { ... } }
  const token = data.access_token;
  const userData = data.user;

  if (token) {
    localStorage.setItem('access_token', token);
  }
  if (userData) {
    localStorage.setItem('user', JSON.stringify(userData));
  }

  setUser(userData);
};



const register = async ({ full_name, username, email, password }) => {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ full_name, username, email, password }),
  });

  if (!res.ok) {
    let errorData = {};
    try {
      errorData = await res.json();
    } catch {}
    const msg = errorData.detail || 'Error al registrar usuario';
    const err = new Error(msg);
    err.response = { data: errorData };
    throw err;
  }

  try {
    return await res.json();
  } catch {
    return null;
  }
};



  const logout = () => {
    clearAuthData();
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
