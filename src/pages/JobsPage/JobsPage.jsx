import React, { useState, useEffect } from "react";
import supabase from "../../services/supabase/supabaseClient";
import "./JobsPage.scss";

const JobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      const url = "https://indeed12.p.rapidapi.com/company/Ubisoft/jobs?locality=us&start=1";
      const options = {
        method: "GET",
        headers: {
          "x-rapidapi-host": "indeed12.p.rapidapi.com",
          "x-rapidapi-key": "2a2407282cmsh477e458e81d60ebp10c350jsn29e36707aa66", // 保持金鑰不變
        },
      };

      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log("API Response:", result);

        const jobsData = result.jobs || [];
        setJobs(jobsData);

        // 將數據存儲到 Supabase
        if (jobsData.length > 0) {
          const { data, error } = await supabase.from("jobs").insert(
            jobsData.map((job) => ({
              title: job.title,
              company: job.company,
              location: job.location,
              salary_min: job.salary_min || null,
              salary_max: job.salary_max || null,
              url: job.url,
            }))
          );

          if (error) {
            console.error("Error saving jobs to Supabase:", error);
          } else {
            console.log("Jobs saved to Supabase:", data);
          }
        }
      } catch (err) {
        if (err.message.includes("429")) {
          console.error("Rate limit exceeded. Please try again later.");
        } else if (err.message.includes("403")) {
          console.error("Forbidden: Check your API key or subscription.");
        } else {
          console.error("Error fetching jobs:", err);
          setError("Failed to fetch jobs. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    // 節流請求，延遲執行
    const timeoutId = setTimeout(fetchJobs, 1000); // 延遲 1 秒執行請求
    return () => clearTimeout(timeoutId); // 清理定時器
  }, []);

  if (loading) return <div>Loading jobs...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="jobs-page">
      <h1>Jobs at Ubisoft</h1>
      <ul className="jobs-list">
        {jobs.map((job, index) => (
          <li key={index} className="job-card">
            <h3>{job.title}</h3>
            <p>Location: {job.location}</p>
            <p>Salary: {job.salary_min || "Not specified"} - {job.salary_max || "Not specified"}</p>
            <a href={job.url} target="_blank" rel="noopener noreferrer">
              View Job
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default JobsPage;