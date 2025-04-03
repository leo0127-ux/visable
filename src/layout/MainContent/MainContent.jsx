import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PostList from "../../components/Post/PostList";
import CareerInsightPage from "../../pages/CareerInsightPage/CareerInsightPage";
import PostDetail from "../../components/Post/PostDetail";
import "./MainContent.scss";
import supabase from "../../services/supabase/supabaseClient";
import FilterButton from "../../components/ui/FilterButton/FilterButton";
import JobCard from "../../components/jobs/JobCard";

const MainContent = ({ searchQuery }) => {
  const [content, setContent] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeTab, setActiveTab] = useState("salary"); // 預設選中的 Tab
  const [filters, setFilters] = useState({
    postDate: null,
    experienceLevel: null,
    jobType: null,
  });
  const [dropdownOpen, setDropdownOpen] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      const { data, error } = await supabase.from("posts").select("*");
      if (!error) setContent(data);
    };

    const fetchJobs = async () => {
      try {
        // 檢查 Supabase 是否已有數據
        const { data: cachedJobs, error: fetchError } = await supabase.from("jobs").select("*");
        if (fetchError) throw fetchError;

        if (cachedJobs.length > 0) {
          setJobs(cachedJobs);
          setLoading(false);
          return;
        }

        // 如果沒有緩存數據，發送 API 請求
        const url = "https://indeed12.p.rapidapi.com/company/Ubisoft/jobs?locality=us&start=1";
        const options = {
          method: "GET",
          headers: {
            "x-rapidapi-host": "indeed12.p.rapidapi.com",
            "x-rapidapi-key": "2a2407282cmsh477e458e81d60ebp10c350jsn29e36707aa66", // 保持金鑰不變
          },
        };

        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setJobs(result.jobs || []);

        // 將數據存儲到 Supabase
        if (result.jobs.length > 0) {
          const { error: insertError } = await supabase.from("jobs").insert(
            result.jobs.map((job) => ({
              title: job.title,
              company: job.company,
              location: job.location,
              salary_min: job.salary_min || null,
              salary_max: job.salary_max || null,
              url: job.url,
              description: job.description || "No description available.",
              h1b_records: job.h1b_records || "No H-1B records available.",
            }))
          );
          if (insertError) {
            console.error("Error saving jobs to Supabase:", insertError);
          }
        }
      } catch (err) {
        if (err.message.includes("429")) {
          console.error("Rate limit exceeded. Please try again later.");
        } else {
          console.error("Error fetching jobs:", err);
          setError("Failed to fetch jobs. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
    fetchJobs();
  }, []);

  const handleFilterChange = (filterKey, value) => {
    setFilters((prev) => ({ ...prev, [filterKey]: value }));
    setDropdownOpen(null); // Close dropdown after selection
  };

  const applyFilters = () => {
    console.log("Applied filters:", filters);
    // Add logic to filter jobs based on selected filters
  };

  const filteredContent = searchQuery.trim()
    ? content.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : content;

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <main className="main-content">
      <Routes>
        <Route path="/" element={<Navigate to="/homepage" />} />
        <Route path="/homepage" element={<PostList />} />
        <Route path="/careerinsightpage" element={<CareerInsightPage />} />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route
          path="/jobs"
          element={
            <div className="jobs-page">
              <div className="jobs-page__filters">
                <FilterButton
                  label="職缺發布時間"
                  options={[
                    { label: "Last 24 hours", value: "Last 24 hours" },
                    { label: "Last 7 days", value: "Last 7 days" },
                  ]}
                  onSelect={(value) => handleFilterChange("postDate", value)}
                />
                <FilterButton
                  label="經驗要求"
                  options={[
                    { label: "Entry Level", value: "Entry Level" },
                    { label: "Mid Level", value: "Mid Level" },
                  ]}
                  onSelect={(value) => handleFilterChange("experienceLevel", value)}
                />
                <FilterButton
                  label="職缺類型"
                  options={[
                    { label: "Full-Time", value: "Full-Time" },
                    { label: "Part-Time", value: "Part-Time" },
                  ]}
                  onSelect={(value) => handleFilterChange("jobType", value)}
                />
                <button className="apply-button" onClick={applyFilters}>
                  確定
                </button>
              </div>
              <div className="jobs-page__content">
                <div className="jobs-page__list">
                  {jobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onClick={() => setSelectedJob(job)}
                    />
                  ))}
                </div>
                <div className="jobs-page__details">
                  {selectedJob ? (
                    <div className="job-details">
                      <h2>{selectedJob.title}</h2>
                      <p><strong>Company:</strong> {selectedJob.company}</p>
                      <p><strong>Location:</strong> {selectedJob.location}</p>
                      {selectedJob.salary_min && selectedJob.salary_max && (
                        <p>
                          <strong>Salary:</strong> ${selectedJob.salary_min.toLocaleString()} - ${selectedJob.salary_max.toLocaleString()}
                        </p>
                      )}
                      <div className="job-actions">
                        <button className="apply-button">Apply</button>
                        <button className="save-button">Save</button>
                      </div>
                      <p><strong>Description:</strong> {selectedJob.description}</p>
                      <p><strong>H-1B Records:</strong> {selectedJob.h1b_records}</p>
                      <div className="career-insights-tabs">
                        <button
                          className={activeTab === "salary" ? "active" : ""}
                          onClick={() => setActiveTab("salary")}
                        >
                          Salary
                        </button>
                        <button
                          className={activeTab === "interview" ? "active" : ""}
                          onClick={() => setActiveTab("interview")}
                        >
                          Interview
                        </button>
                      </div>
                      <div className="career-insights-content">
                        {activeTab === "salary" && <p>Salary insights will be displayed here.</p>}
                        {activeTab === "interview" && <p>Interview insights will be displayed here.</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="job-details-placeholder">
                      <p>Select a job to view details</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          }
        />
      </Routes>
    </main>
  );
};

export default MainContent;