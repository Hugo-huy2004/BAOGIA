import React from "react";
import AdminSidebar from "./AdminSidebar";
import AdminBottomNav from "./AdminBottomNav";

export default function AdminTabBar({ 
  activeTab, 
  setActiveTab, 
  counts, 
  handleLogout 
}) {
  const { t } = useTranslation();
  return (
    <>
      <AdminSidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counts={counts}
        handleLogout={handleLogout}
      />
      <AdminBottomNav 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counts={counts}
      />
    </>
  );
}
