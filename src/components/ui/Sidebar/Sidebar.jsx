"use client";
import * as React from "react";
import { NavLink } from "react-router-dom";
import supabase from "../../../services/supabase/supabaseClient";
import "./Sidebar.scss";

const Sidebar = () => {
  const [isCommunityOpen, setIsCommunityOpen] = React.useState(true);
  const [communityItems, setCommunityItems] = React.useState([]);

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
  }, []); // 僅在組件掛載時執行

  const menuItems = [
    {
      path: "/",
      label: "首頁",
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
      label: "找工作",
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
      path: "/experience",
      label: "經驗分享",
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
              d="M12 20.25c4.97 0 9-4.03 9-9s-4.03-9-9-9-9 4.03-9 9 4.03 9 9 9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 7.5v5.25l3 1.5"
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
            <span>社群</span>
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