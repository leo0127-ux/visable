import React, { useState, useEffect } from "react";
import supabase from "../../services/supabase/supabaseClient";
import FilterButton from "../../components/ui/FilterButton/FilterButton"; // 確保導入 FilterButton
import "./JobsPage.scss";

const JobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    postDate: null,
    experienceLevel: null,
    jobType: null,
  });
  const [selectedJob, setSelectedJob] = useState(null); // 新增選中的工作
  const [openFilter, setOpenFilter] = useState(null); // Track which filter is open

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data, error } = await supabase.from("jobs").select("*");
        if (error) throw error;
        setJobs(data);
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError("Failed to fetch jobs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const handleFilterChange = (filterKey, value) => {
    setFilters((prev) => ({ ...prev, [filterKey]: value }));
  };

  const handleToggleFilter = (filterKey) => {
    setOpenFilter((prev) => (prev === filterKey ? null : filterKey)); // Toggle the filter
  };

  if (loading) return <div>Loading jobs...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="jobs-page">
      <h1>Jobs at Ubisoft</h1>
      <div className="jobs-page__filters">
        <FilterButton
          label="職缺發布時間"
          options={[
            { label: "Last 24 hours", value: "Last 24 hours" },
            { label: "Last 7 days", value: "Last 7 days" },
          ]}
          onSelect={(value) => handleFilterChange("postDate", value)}
          isOpen={openFilter === "postDate"}
          onToggle={() => handleToggleFilter("postDate")}
        />
        <FilterButton
          label="經驗要求"
          options={[
            { label: "Entry Level", value: "Entry Level" },
            { label: "Mid Level", value: "Mid Level" },
          ]}
          onSelect={(value) => handleFilterChange("experienceLevel", value)}
          isOpen={openFilter === "experienceLevel"}
          onToggle={() => handleToggleFilter("experienceLevel")}
        />
        <FilterButton
          label="職缺類型"
          options={[
            { label: "Full-Time", value: "Full-Time" },
            { label: "Part-Time", value: "Part-Time" },
          ]}
          onSelect={(value) => handleFilterChange("jobType", value)}
          isOpen={openFilter === "jobType"}
          onToggle={() => handleToggleFilter("jobType")}
        />
      </div>
      <div className="jobs-page__content">
        <div className="jobs-page__list">
          <ul className="jobs-list">
            {jobs.map((job, index) => (
              <li
                key={index}
                className={`job-card ${selectedJob === job ? "active" : ""}`}
                onClick={() => setSelectedJob(job)} // 點擊時設置選中的工作
              >
                <h3>{job.title}</h3>
                <p>Location: {job.location}</p>
                <p>
                  Salary: {job.salary_min || "Not specified"} -{" "}
                  {job.salary_max || "Not specified"}
                </p>
                <a href={job.url} target="_blank" rel="noopener noreferrer">
                  View Job
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="jobs-page__details">
          {selectedJob ? (
            <div className="job-details">
              <h2>{selectedJob.title}</h2>
              <p>
                <strong>Company:</strong> {selectedJob.company}
              </p>
              <p>
                <strong>Location:</strong> {selectedJob.location}
              </p>
              {selectedJob.salary_min && selectedJob.salary_max && (
                <p>
                  <strong>Salary:</strong> ${selectedJob.salary_min.toLocaleString()} - ${selectedJob.salary_max.toLocaleString()}
                </p>
              )}
              <p>
                <strong>Description:</strong> {selectedJob.description || "No description available."}
              </p>
              <a href={selectedJob.url} target="_blank" rel="noopener noreferrer">
                Apply Now
              </a>
            </div>
          ) : (
            <div className="job-details-placeholder">
              <p>Select a job to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobsPage;