import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import HomePage from "../../pages/HomePage/HomePage";
import BoardPage from "../../pages/BoardPage/BoardPage";
import JobsPage from "../../pages/JobsPage/JobsPage";
import AccountPage from "../../pages/AccountPage/AccountPage";
import PostDetailPage from "../../pages/PostDetailPage/PostDetailPage";
import CareerInsightPage from "../../pages/CareerInsightPage/CareerInsightPage";
import ExperiencePage from "../../pages/ExperiencePage/ExperiencePage";
import ConnectionsPage from "../../pages/ConnectionsPage/ConnectionsPage";
import "./MainContent.scss";

const MainContent = ({ searchQuery, searchContext }) => {
  const location = useLocation();
  
  // 判斷頁面類型
  const isJobsPage = location.pathname.includes('/jobs');
  const isAccountPage = location.pathname.includes('/account');
  const isBoardPage = location.pathname.includes('/board/');
  const isPostDetailPage = location.pathname.includes('/post/');
  const isHomePage = location.pathname === '/' || location.pathname === '/home';
  const isCareerPage = location.pathname === '/career';
  const isStandardPage = !isJobsPage && !isAccountPage && !isBoardPage && !isPostDetailPage && !isHomePage && !isCareerPage;
  
  // 設定頁面類型的 CSS 類別
  const pageClass = isJobsPage 
    ? 'jobs-page' 
    : isAccountPage 
      ? 'account-page' 
      : isBoardPage 
        ? 'board-page' 
        : isHomePage
          ? 'home-page'
          : isPostDetailPage 
            ? 'post-detail-page' 
            : isCareerPage
              ? 'career-page'
              : 'standard-page';

  return (
    <main className={`main-content ${pageClass}`}>
      <div className="content-area">
        <Routes>
          <Route path="/" element={<HomePage searchQuery={searchQuery} />} />
          <Route path="/home" element={<HomePage searchQuery={searchQuery} />} />
          <Route path="/board/:id" element={<BoardPage />} />
          <Route path="/jobs" element={<JobsPage searchQuery={searchQuery} searchContext={searchContext} />} />
          <Route path="/post/:id" element={<PostDetailPage />} />
          <Route path="/career" element={<CareerInsightPage />} />
          <Route path="/experience" element={<ExperiencePage />} />
          <Route path="/connections" element={<ConnectionsPage />} />
          <Route path="/account/*" element={<AccountPage />} />
        </Routes>
      </div>
    </main>
  );
};

export default MainContent;