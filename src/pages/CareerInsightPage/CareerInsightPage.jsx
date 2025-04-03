import React, { useEffect, useState } from "react";
import supabase from "../../services/supabase/supabaseClient";
import PostCard from "../../components/Post/PostCard";

const CareerInsightPage = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInsights = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("category", "career"); // 過濾出 Career Insights 的文章
      if (error) {
        console.error("Error fetching insights:", error);
        setError(error.message);
      } else {
        setInsights(data);
      }
      setLoading(false);
    };

    fetchInsights();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="career-insight-page">
      {insights.map((insight) => (
        <PostCard key={insight.id} post={insight} />
      ))}
    </div>
  );
};

export default CareerInsightPage;