import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { clearAdminSession, isAdminAuthenticated } from '../../services/api/core/authSession';

export default function AdminProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

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
          credentials: 'include',
          signal: AbortSignal.timeout(30000),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (res.status === 401 && data.code === 'AUTH_SESSION_INVALID' && data.authRole === 'admin') {
            if (isMounted) { clearAdminSession(); setIsAuthenticated(false); }
            return;
          }
          throw new Error(data.error || 'Server unavailable');
        } else {
          // Thành công
          const data = await res.json();
          if (data.success) {
            if (isMounted) setIsAuthenticated(true);
          } else {
            throw new Error('Invalid server response');
          }
        }
      } catch (error) {
        console.error('Lỗi xác thực Admin:', error);
        if (isMounted) setError('Chưa kết nối được máy chủ. Phiên đăng nhập vẫn được giữ.');
      }
    };

    verifyAdmin();

    return () => {
      isMounted = false;
    };
  }, [attempt]);

  if (error) {
    return <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p role="alert">{error}</p>
      <button className="rounded-lg border px-4 py-2" onClick={() => { setError(''); setAttempt(value => value + 1); }}>Thử lại</button>
    </div>;
  }

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
