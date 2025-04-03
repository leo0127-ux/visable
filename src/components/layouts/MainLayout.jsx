import React from "react";
import Sidebar from "../ui/Sidebar/Sidebar";
import MainContent from "../../layout/MainContent/MainContent";
import "./MainLayout.scss";

const MainLayout = () => {
  return (
    <div className="layout">
      <nav className="navbar">...</nav>
      <div className="layout__content">
        <Sidebar />
        <MainContent />
      </div>
    </div>
  );
};

export default MainLayout;