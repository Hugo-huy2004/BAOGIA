import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function SmartUserSearch({ onSelect, placeholder = "Tìm theo Tên, Email hoặc SĐT...", selectedUser, onClear }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const { getAdminSession } = await import('../../services/authSession');
        const session = getAdminSession();
        const response = await fetch(`${API_BASE_URL}/admin/users/search?q=${encodeURIComponent(query)}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {})
          }
        });

        if (response.status === 401 || response.status === 403) {
          setResults([]);
          setIsOpen(false);
          notify.error('Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại.');
          return;
        }

        const data = await response.json();
        if (data.success) {
          setResults(data.data);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (user) => {
    onSelect(user);
    setIsOpen(false);
    setQuery('');
  };

  if (selectedUser) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-border/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={selectedUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.displayName)}`} alt="avatar" className="w-8 h-8 rounded-full bg-slate-200" />
          <div>
            <div className="text-xs font-bold text-foreground">{selectedUser.displayName}</div>
            <div className="text-[10px] text-muted-foreground">{selectedUser.email}</div>
          </div>
        </div>
        <button type="button" onClick={onClear} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <span className="material-symbols-outlined text-base">search</span>
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs focus:outline-none input-premium-focus transition-all text-foreground font-medium"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            <span className="material-symbols-outlined text-base animate-spin">refresh</span>
          </span>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
          {results.map((user) => (
            <div
              key={user._id || user.email}
              onClick={() => handleSelect(user)}
              className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border-b border-border/50 last:border-0"
            >
              <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}`} alt="avatar" className="w-8 h-8 rounded-full bg-slate-200" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-foreground truncate">{user.displayName}</div>
                <div className="text-[10px] text-muted-foreground truncate">{user.email} {user.phone ? `• ${user.phone}` : ''}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-amber-500">{user.joyBalance || 0} JOY</div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {isOpen && query.length >= 2 && !loading && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-card border border-border rounded-xl shadow-lg p-4 text-center text-xs text-muted-foreground">
          Không tìm thấy người dùng nào
        </div>
      )}
    </div>
  );
}
