import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  // Role can be 'commander_admin', 'agency', 'client', or null
  const [role, setRole] = useState(() => {
    return localStorage.getItem('userRole') || null;
  });

  const [features, setFeatures] = useState(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.features || [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    if (role) {
      localStorage.setItem('userRole', role);
    } else {
      localStorage.removeItem('userRole');
    }
  }, [role]);

  const login = (user) => {
    setRole(user.role);
    setFeatures(user.features || []);
    
    if (user.role === 'supreme_super_admin') {
      navigate('/superadmin/dashboard');
    } else if (user.role === 'commander_admin') {
      navigate('/dashboard');
    } else if (['agency_super_admin', 'agency_manager'].includes(user.role)) {
      navigate('/agency/overview');
    } else if (['agency_client', 'brand_super_admin', 'brand_manager', 'brand_team_user'].includes(user.role)) {
      navigate('/client/dashboard');
    } else {
      // Fallback for custom roles (like developer, seo, etc)
      if (user.role === 'superadmin') navigate('/superadmin/dashboard');
      else if (user.role === 'agency') navigate('/agency/overview');
      else if (user.role === 'client') navigate('/client/dashboard');
      else navigate('/user/dashboard');
    }
  };

  const logout = () => {
    setRole(null);
    setFeatures([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/signin');
  };

  return (
    <AuthContext.Provider value={{ role, features, setFeatures, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
