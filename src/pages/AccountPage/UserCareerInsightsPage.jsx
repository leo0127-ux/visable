import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Empty, Spin, Tag } from 'antd';
import { LoadingOutlined, DollarOutlined, CompassOutlined } from '@ant-design/icons';
import supabase from '../../services/supabase/supabaseClient';
import './UserCareerInsightsPage.scss';

const UserCareerInsightsPage = ({ userId }) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserInsights = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('id, title, content, created_at, company_name, job_title, base_salary, location, category')
          .eq('user_id', userId)
          .eq('category', 'career')  // Only get career insights
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setInsights(data || []);
      } catch (err) {
        console.error('Error fetching user career insights:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserInsights();
  }, [userId]);
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  const handleInsightClick = (insightId) => {
    navigate(`/post/${insightId}`);
  };
  
  const formatSalary = (salary) => {
    if (!salary) return 'Not disclosed';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(salary);
  };
  
  if (loading) {
    return (
      <div className="user-insights-loading">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        <p>Loading your career insights...</p>
      </div>
    );
  }
  
  if (insights.length === 0) {
    return (
      <div className="user-insights-empty">
        <Empty
          description="You haven't shared any career insights yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }
  
  return (
    <div className="user-career-insights-page">
      <h2>My Career Insights</h2>
      <div className="user-insights-list">
        {insights.map(insight => (
          <div 
            key={insight.id} 
            className="user-insight-card"
            onClick={() => handleInsightClick(insight.id)}
          >
            <div className="insight-header">
              <div className="company-info">
                <h3 className="company-name">{insight.company_name}</h3>
                <span className="job-title">{insight.job_title}</span>
              </div>
              <span className="insight-date">{formatDate(insight.created_at)}</span>
            </div>
            
            <div className="insight-meta">
              <Tag color="blue" icon={<DollarOutlined />}>
                {formatSalary(insight.base_salary)}
              </Tag>
              {insight.location && (
                <Tag color="green" icon={<CompassOutlined />}>
                  {insight.location}
                </Tag>
              )}
            </div>
            
            <p className="insight-excerpt">{insight.content.substring(0, 150)}...</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserCareerInsightsPage;
