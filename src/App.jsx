import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/ui/Navbar/Navbar";
import Sidebar from "./components/ui/Sidebar/Sidebar";
import MainContent from "./layout/MainContent/MainContent"; // 確保正確導入 MainContent
import './styles/global.scss';

const App = () => {
  const [searchQuery, setSearchQuery] = useState(""); // 新增搜尋狀態

  return (
    <Router>
      <div className="layout" style={{ overflow: "visible" }}> {/* Ensure dropdown is not clipped */}
        <Navbar onSearch={setSearchQuery} /> {/* 傳遞 setSearchQuery */}
        <div className="layout__content">
          <Sidebar />
          <MainContent
            searchQuery={searchQuery}
            className={window.location.pathname === "/jobs" ? "jobs-page" : ""}
          /> {/* Add conditional class for jobs page */}
        </div>
      </div>
    </Router>
  );
};

export default App;