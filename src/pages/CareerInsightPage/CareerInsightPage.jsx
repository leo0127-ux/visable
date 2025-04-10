import React, { useEffect, useState } from "react";
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import supabase from "../../services/supabase/supabaseClient";
import PostCard from "../../components/Post/PostCard";
import CreatePostModal from "../../components/Post/CreatePostModal";
import "./CareerInsightPage.scss";

const CareerInsightPage = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'salary', or 'interview'
  
  useEffect(() => {
    fetchInsights();
  }, [filterType]);
  
  const fetchInsights = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("posts")
        .select("*")
        .eq("category", "career")
        .order("created_at", { ascending: false });
      
      // Apply filter if not 'all'
      if (filterType === 'salary') {
        query = query.eq("insight_type", "salary");
      } else if (filterType === 'interview') {
        query = query.eq("insight_type", "interview");
      }
        
      const { data, error: fetchError } = await query;
      
      if (fetchError) {
        throw fetchError;
      }
      
      // Format posts for display
      const formattedInsights = data.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        user_id: post.user_id,
        created_at: post.created_at,
        is_anonymous: post.is_anonymous,
        is_archived: post.is_archived,
        boardName: post.company_name || "Career Insight",
        timeAgo: calculateTimeAgo(post.created_at),
        // Add career insight specific fields
        company_name: post.company_name,
        job_title: post.job_title,
        location: post.location,
        base_salary: post.base_salary,
        insight_type: post.insight_type
      }));
      
      setInsights(formattedInsights);
      setError(null);
    } catch (err) {
      console.error("Error fetching insights:", err);
      setError("Failed to load career insights. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeAgo = (createdAt) => {
    const now = new Date();
    const createdDate = new Date(createdAt);
    const diffInMinutes = Math.floor((now - createdDate) / (1000 * 60));
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hr ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  const handleCreateInsight = () => {
    setIsCreateModalOpen(true);
  };

  return (
    <div className="career-insight-page">
      <div className="career-insight-header">
        <h1>Career Insights</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleCreateInsight}
        >
          Share Your Experience
        </Button>
      </div>
      
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
          onClick={() => setFilterType('all')}
        >
          All Insights
        </button>
        <button 
          className={`filter-tab ${filterType === 'salary' ? 'active' : ''}`}
          onClick={() => setFilterType('salary')}
        >
          Salary Information
        </button>
        <button 
          className={`filter-tab ${filterType === 'interview' ? 'active' : ''}`}
          onClick={() => setFilterType('interview')}
        >
          Interview Experiences
        </button>
      </div>
      
      <div className="career-insights-container">
        {loading ? (
          <div className="loading-message">Loading career insights...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : insights.length === 0 ? (
          <div className="no-insights-message">
            <p>No career insights found. Be the first to share your experience!</p>
            <Button type="primary" onClick={handleCreateInsight}>Share Now</Button>
          </div>
        ) : (
          insights.map(insight => (
            <PostCard 
              key={insight.id} 
              post={insight} 
            />
          ))
        )}
      </div>
      
      {isCreateModalOpen && (
        <CreatePostModal
          onClose={() => setIsCreateModalOpen(false)}
          defaultPostType="careerInsight"
        />
      )}
    </div>
  );
};

export default CareerInsightPage;