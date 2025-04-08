import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import PostList from "../../components/Post/PostList";
import CareerInsightPage from "../../pages/CareerInsightPage/CareerInsightPage";
import PostDetail from "../../components/Post/PostDetail";
import PostDetailPage from "../../pages/PostDetailPage/PostDetailPage"; // Add the import
import "./MainContent.scss";
import supabase from "../../services/supabase/supabaseClient";
import HomePage from "../../pages/HomePage/HomePage";
import ExperiencePage from "../../pages/ExperiencePage/ExperiencePage";
import JobsPage from "../../pages/JobsPage/JobsPage";
import AccountPage from "../../pages/AccountPage/AccountPage";
import BoardPage from "../../pages/BoardPage/BoardPage"; // Add this import
import SavedJobsPage from "../../pages/AccountPage/SavedJobsPage"; // Add this import
import DocumentsPage from "../../pages/AccountPage/DocumentsPage"; // Add this import
import RecentPostsSidebar from "../../components/Sidebar/RecentPostsSidebar";

const MainContent = ({ searchQuery }) => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const isJobsPage = location.pathname === "/jobs";
  const isAccountPage = location.pathname.includes("/account");
  const shouldShowSidebar = !isJobsPage && !isAccountPage;

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data, error } = await supabase.from("posts").select("*");
        if (error) {
          console.error("Error fetching posts:", error);
          setError("Failed to fetch posts. Please check your API key or permissions.");
          return;
        }
        setContent(data);
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  const filteredContent = searchQuery?.trim()
    ? content.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : content;

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <main className={`main-content ${isJobsPage ? 'jobs-page' : ''} ${isAccountPage ? 'account-page' : ''}`}>
      <div className="content-area">
        <Routes>
          <Route path="/" element={<Navigate to="/homepage" replace />} />
          <Route path="/homepage" element={<HomePage />} />
          <Route path="/experience" element={<ExperiencePage />} />
          <Route path="/jobs" element={<JobsPage searchQuery={searchQuery} />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/account/saved-jobs" element={<SavedJobsPage />} />
          <Route path="/account/documents" element={<DocumentsPage />} />
          <Route path="/career-insights" element={<CareerInsightPage />} />
          <Route path="/posts" element={<PostList posts={filteredContent} />} />
          <Route path="/posts/:id" element={<PostDetailPage />} /> {/* Use the new component */}
          <Route path="/post/:id" element={<PostDetailPage />} /> {/* Add an additional route for post/id pattern */}
          <Route path="/board/:id" element={<BoardPage />} /> {/* Add this route */}
        </Routes>
      </div>
      {shouldShowSidebar && <RecentPostsSidebar />}
    </main>
  );
};

export default MainContent;