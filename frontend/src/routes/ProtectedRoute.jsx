import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { fetchCurrentUser } from '../services/AuthServices';

const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Yüklenme durumu

  useEffect(() => {
    const checkUser = async () => {
      const currentUsr = await fetchCurrentUser();
      setIsAuthenticated(!!currentUsr);
      setLoading(false); // Yüklenme tamamlandığında false olarak ayarla
    };

    checkUser();
  }, []);

  if (loading) {
    return <p>Yükleniyor...</p>; // Yüklenme sırasında gösterilecek durum
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
