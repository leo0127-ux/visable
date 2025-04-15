"use client";
import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import supabase from "../../../services/supabase/supabaseClient";
import { useLanguage } from "../../../context/LanguageContext"; // 添加語言上下文
import "./Sidebar.scss";

const Sidebar = () => {
  const [isCommunityOpen, setIsCommunityOpen] = React.useState(true);
  const [communityItems, setCommunityItems] = React.useState([]);
  const { t } = useLanguage(); // 使用語言上下文

  const toggleCommunity = () => {
    setIsCommunityOpen((prev) => !prev);
  };

  React.useEffect(() => {
    const fetchBoards = async () => {
      const { data, error } = await supabase.from("boards").select("*");
      if (error) {
        console.error("Error fetching boards:", error);
      } else {
        const formattedBoards = data.map((board) => ({
          path: `/board/${board.id}`,
          label: board.name,
          icon: (
            <div className="icon-container">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="icon"
              >
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
          ),
        }));
        setCommunityItems(formattedBoards);
      }
    };

    fetchBoards();
  }, []);

  const menuItems = [
    {
      path: "/",
      label: t("home"), // 翻譯「首頁」
      icon: (
        <div className="icon-container">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 9.75L12 3l9 6.75v9.75a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 19.5V9.75z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 22.5v-6h6v6"
            />
          </svg>
        </div>
      ),
    },
    {
      path: "/jobs",
      label: t("findJobs"), // 翻譯「找工作」
      icon: (
        <div className="icon-container">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75A2.25 2.25 0 0014.25 4.5h-4.5A2.25 2.25 0 007.5 6.75v3.75m9 0h3.75a.75.75 0 01.75.75v9a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 20.25v-9a.75.75 0 01.75-.75H7.5m9 0v3.75a3 3 0 11-6 0V10.5m0 0h6"
            />
          </svg>
        </div>
      ),
    },
    {
      path: "/career",
      label: t("careerInsights"), // 翻譯「職場洞察」
      icon: (
        <div className="icon-container">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
            />
          </svg>
        </div>
      ),
    },
    {
      path: "/connections",
      label: t("connections"), // 翻譯「人脈」
      icon: (
        <div className="icon-container">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
            />
          </svg>
        </div>
      ),
    },
    {
      path: "/visa-report",
      label: t("visaReport"), // 翻譯「簽證報告」
      icon: (
        <div className="icon-container">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
        </div>
      ),
    },
  ];

  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? "active" : ""}`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
        <div className="sidebar__divider"></div>
        <div className="sidebar__community">
          <div className="sidebar__community-header" onClick={toggleCommunity}>
            <span>{t("community")}</span> {/* 翻譯「社群」 */}
            <div className="icon-container">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="icon"
              >
                {isCommunityOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 12h-15"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 19.5V4.5m7.5 7.5h-15"
                  />
                )}
              </svg>
            </div>
          </div>
          {isCommunityOpen && (
            <div className="sidebar__community-list">
              {communityItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar__link ${isActive ? "active" : ""}`
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;