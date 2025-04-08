import React, { useState, useEffect, useRef, useCallback } from "react";
import supabase from "../../services/supabase/supabaseClient";
import fetchAndInsertJobs from "../../services/supabase/fetchAndInsertJobs";
import FilterButton from "../../components/ui/FilterButton/FilterButton";
import "./JobsPage.scss";
import { 
  BookOutlined, 
  CloseOutlined, 
  SendOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  GlobalOutlined 
} from "@ant-design/icons";

const JobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    postDate: null,
    experienceLevel: null,
    jobType: null,
  });
  const [selectedJob, setSelectedJob] = useState(null);
  const [openFilter, setOpenFilter] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef(null);
  
  const ITEMS_PER_PAGE = 10;

  // Load initial jobs
  useEffect(() => {
    const initializeJobs = async () => {
      try {
        // Fetch initial batch of jobs
        await fetchJobs(0);
      } catch (err) {
        console.error("Error initializing jobs:", err);
        setError("Failed to initialize jobs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    initializeJobs();
  }, []);

  // Fetch jobs with pagination
  const fetchJobs = async (pageNumber) => {
    try {
      const from = pageNumber * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      const { data, error, count } = await supabase
        .from("jobs")
        .select("*", { count: 'exact' })
        .range(from, to);
        
      if (error) throw error;
      
      if (data.length === 0) {
        setHasMore(false);
        return;
      }
      
      if (pageNumber === 0) {
        setJobs(data);
        // Auto-select first job if any
        if (data.length > 0 && !selectedJob) {
          setSelectedJob(data[0]);
        }
      } else {
        setJobs(prevJobs => [...prevJobs, ...data]);
      }
      
      // Check if we've loaded all jobs
      setHasMore(from + data.length < count);
      
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError("Failed to fetch jobs. Please try again later.");
    }
  };

  // Intersection Observer for infinite scrolling
  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !loadingMore) {
      setLoadingMore(true);
      setPage(prevPage => {
        const nextPage = prevPage + 1;
        fetchJobs(nextPage).finally(() => setLoadingMore(false));
        return nextPage;
      });
    }
  }, [hasMore, loadingMore]);

  // Setup Intersection Observer
  useEffect(() => {
    const option = {
      root: null,
      rootMargin: "20px",
      threshold: 0.1
    };
    const observer = new IntersectionObserver(handleObserver, option);
    if (loaderRef.current) observer.observe(loaderRef.current);
    
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [handleObserver]);

  const handleFilterChange = (filterKey, value) => {
    setFilters((prev) => ({ ...prev, [filterKey]: value }));
  };

  const handleToggleFilter = (filterKey) => {
    // 防止事件冒泡並確保只有點擊當前按鈕才會切換狀態
    setOpenFilter((prev) => (prev === filterKey ? null : filterKey));
  };

  const handleSaveJob = async (job) => {
    try {
      // Check if user is logged in
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        alert("You must be logged in to save a job.");
        return;
      }

      // Try to directly create the saved job without checking for user in public.users
      const { error: insertError } = await supabase
        .from("saved_jobs")
        .insert([{
          user_id: user.id,
          job_id: job.job_id
        }]);

      if (insertError) {
        console.error("Error saving job:", insertError);
        
        // If the error is about duplication, provide a friendly message
        if (insertError.code === '23505' || insertError.message.includes('duplicate')) {
          alert("You have already saved this job.");
          return;
        }
        
        // Handle foreign key violation specifically
        if (insertError.code === '23503' || insertError.message.includes('violates foreign key')) {
          // Attempt to create the user record and retry
          const { error: createUserError } = await supabase
            .from("users")
            .insert([{
              id: user.id,
              email: user.email,
              created_at: new Date().toISOString()
            }]);
            
          if (createUserError) {
            throw new Error(`Could not create user record: ${createUserError.message}`);
          }
          
          // Retry the save after creating user record
          const { error: retryError } = await supabase
            .from("saved_jobs")
            .insert([{
              user_id: user.id,
              job_id: job.job_id
            }]);
            
          if (retryError) {
            throw new Error(`Failed to save job after creating user: ${retryError.message}`);
          }
        } else {
          throw new Error(insertError.message);
        }
      }

      alert("Job saved successfully!");
    } catch (err) {
      console.error("Error in handleSaveJob:", err);
      alert(`Failed to save job: ${err.message}`);
    }
  };

  const handleHideJob = (jobId) => {
    setJobs((prevJobs) => prevJobs.filter((job) => job.job_id !== jobId));
  };

  if (loading) return <div>Loading jobs...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="jobs-page">
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
                onClick={() => setSelectedJob(job)}
              >
                <div className="job-card__content">
                  <h3>{job.job_position}</h3>
                  <p>Company: {job.company_name}</p>
                  <p>Location: {job.job_location}</p>
                  <p>Posted on: {job.job_posting_date}</p>
                </div>
                <div className="job-card__actions">
                  <button
                    className="icon-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveJob(job);
                    }}
                  >
                    <BookOutlined className="icon" />
                  </button>
                  <button
                    className="icon-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHideJob(job.job_id);
                    }}
                  >
                    <CloseOutlined className="icon" />
                  </button>
                </div>
              </li>
            ))}
            {/* Loader element for intersection observer */}
            {hasMore && (
              <div ref={loaderRef} className="loader">
                {loadingMore ? "Loading more jobs..." : ""}
              </div>
            )}
          </ul>
        </div>
        <div className="jobs-page__details">
          {selectedJob ? (
            <div className="job-details">
              <div className="job-details__header">
                <img
                  src={selectedJob.company_logo_url || "https://via.placeholder.com/40"}
                  alt={`${selectedJob.company_name} logo`}
                  className="job-details__header__logo"
                />
                <span className="job-details__header__company-name">
                  {selectedJob.company_name}
                </span>
              </div>
              <h2>{selectedJob.job_position}</h2>
              <p>
                <strong>Location:</strong> {selectedJob.job_location}
              </p>
              <p>
                <strong>Posted on:</strong> {selectedJob.job_posting_date}
              </p>
              <p>
                <strong>Salary:</strong>{" "}
                {selectedJob.salary_min
                  ? `$${selectedJob.salary_min} - $${selectedJob.salary_max}`
                  : "Not specified"}
              </p>
              
              {/* 移動 Apply 和 Save 按鈕到 additional-info 上方 */}
              <div className="job-actions">
                <button
                  className="apply-button"
                  onClick={() => window.open(selectedJob.job_link, "_blank")}
                >
                  <SendOutlined className="icon" />
                  Apply
                </button>
                <button
                  className="save-button"
                  onClick={() => handleSaveJob(selectedJob)}
                >
                  <BookOutlined className="icon" />
                  Save
                </button>
              </div>

              <div className="job-details__additional-info">
                <div className="job-details__section">
                  <h3>Job Details</h3>
                  <div className="job-details__grid">
                    <div className="job-details__grid-item">
                      <span className="label">Job Type</span>
                      <span className="value">Full-time</span>
                    </div>
                    <div className="job-details__grid-item">
                      <span className="label">Experience Level</span>
                      <span className="value">Mid-Level</span>
                    </div>
                    <div className="job-details__grid-item">
                      <span className="label">Industry</span>
                      <span className="value">Technology</span>
                    </div>
                    <div className="job-details__grid-item">
                      <span className="label">Function</span>
                      <span className="value">Engineering</span>
                    </div>
                  </div>
                </div>

                <div className="job-details__section">
                  <h3>Visa Sponsorship</h3>
                  <ul className="job-details__visa-list">
                    <li>H-1B Visa</li>
                    <li>Green Card</li>
                  </ul>
                </div>

                <div className="job-details__section">
                  <h3>About the Job</h3>
                  <div className="job-details__about">
                    <p>We are seeking a talented Software Engineer to join our growing team. In this role, you will be responsible for developing high-quality applications and implementing new features that enhance our product offering.</p>
                    <p>You will work closely with our product and design teams to understand requirements and translate them into technical specifications. This role offers the opportunity to make a significant impact on our core products while growing your skills in a collaborative environment.</p>
                  </div>
                </div>

                <div className="job-details__section">
                  <h3>About the employer</h3>
                  <div className="job-details__employer">
                    <div className="employer-info">
                      <div className="employer-stats">
                        <div className="stat-item">
                          <span className="label">Company size</span>
                          <span className="value">1,000-5,000 employees</span>
                        </div>
                        <div className="stat-item">
                          <span className="label">Industry</span>
                          <span className="value">Technology</span>
                        </div>
                      </div>
                      <p>Founded in 2010, our company is focused on building innovative solutions that transform how businesses operate. We offer competitive salaries, comprehensive benefits, including health insurance, 401(k) matching, and generous PTO.</p>
                      <p>Our culture values collaboration, continuous learning, and work-life balance. Remote work options are available for most positions, and we provide the tools and support needed to succeed in a distributed environment.</p>
                    </div>
                  </div>
                </div>

                <div className="job-details__section">
                  <h3>Job Description</h3>
                  <p>{selectedJob.description || "No description available."}</p>
                </div>

                <div className="job-details__section">
                  <h3>Requirements</h3>
                  <ul className="job-requirements">
                    <li>Bachelor's degree in Computer Science or related field</li>
                    <li>3+ years of experience in frontend development</li>
                    <li>Strong proficiency in React.js and modern JavaScript</li>
                    <li>Experience with state management libraries (Redux, MobX)</li>
                    <li>Familiarity with REST APIs and GraphQL</li>
                  </ul>
                </div>
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
  );
};

export default JobsPage;