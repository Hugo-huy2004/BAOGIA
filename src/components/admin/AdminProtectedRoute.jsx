import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { logoutAuth, isAdminAuthenticated } from '../../services/authSession';

export default function AdminProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const verifyAdmin = async () => {
      // 1. Kiểm tra nhanh localStorage trên frontend
      if (!isAdminAuthenticated()) {
        if (isMounted) setIsAuthenticated(false);
        return;
      }

      // 2. Xác thực sâu bằng Cookie với Backend
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
        const res = await fetch(`${API_BASE_URL}/admin/verify-session`, {
          credentials: 'include'
        });

        if (!res.ok) {
          // Lỗi mạng hoặc 401/403
          await logoutAuth();
          if (isMounted) setIsAuthenticated(false);
        } else {
          // Thành công
          const data = await res.json();
          if (data.success) {
            if (isMounted) setIsAuthenticated(true);
          } else {
            await logoutAuth();
            if (isMounted) setIsAuthenticated(false);
          }
        }
      } catch (error) {
        // Lỗi mạng (bị block bởi hacker hoặc rớt mạng)
        console.error('Lỗi xác thực Admin:', error);
        await logoutAuth();
        if (isMounted) setIsAuthenticated(false);
      }
    };

    verifyAdmin();

    return () => {
      isMounted = false;
    };
  }, []);

  // Đang gọi API
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-3 animate-fadeIn">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
            Đang xác thực bảo mật...
          </p>
        </div>
      </div>
    );
  }

  // Thất bại
  if (isAuthenticated === false) {
    return <Navigate to="/login" replace />;
  }

  // Thành công, hiển thị nội dung Admin
  return children;
}
