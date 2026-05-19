import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { isMemberAuthenticated, isAdminAuthenticated } from "../services/authSession";

export default function MobileNav() {
  const location = useLocation();
  const [activeNav, setActiveNav] = useState("intro");

  const isLoggedIn = isMemberAuthenticated() || isAdminAuthenticated();
  const accountPath = isAdminAuthenticated() ? "/admin" : (isMemberAuthenticated() ? "/member" : "/login");
  const accountLabel = isLoggedIn ? "Tài Khoản" : "Đăng Nhập";
  const accountIcon = isLoggedIn ? "account_circle" : "login";

  useEffect(() => {
    if (location.pathname === "/" || location.pathname === "/introduction" || location.pathname === "/bio") setActiveNav("intro");
    else if (location.pathname === "/services") setActiveNav("services");
    else if (location.pathname === "/booking") setActiveNav("booking");
    else if (location.pathname === "/conggiao") setActiveNav("faith");
    else if (location.pathname === "/dongthap") setActiveNav("region");
    else if (location.pathname === "/login" || location.pathname === "/member" || location.pathname === "/admin") setActiveNav("login");
  }, [location.pathname]);

  const navItems = [
    { id: "intro", icon: "home", label: "Giới Thiệu", path: "/introduction" },
    { id: "services", icon: "shopping_bag", label: "Dịch Vụ", path: "/services" },
    { id: "booking", icon: "calendar_month", label: "Đặt Lịch", path: "/booking" },
    { id: "login", icon: accountIcon, label: accountLabel, path: accountPath }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container dark:bg-[#1a1623] border-t border-outline-variant/30 dark:border-slate-700 z-40">
      <div className="flex justify-around items-center px-4 py-2">
        {navItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            onClick={() => setActiveNav(item.id)}
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all ${
              activeNav === item.id
                ? "text-primary dark:text-[#a5b4fc] bg-primary-container/20 dark:bg-slate-700/40"
                : "text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-[#a5b4fc]"
            }`}
          >
            <span className="material-symbols-outlined text-sm">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
