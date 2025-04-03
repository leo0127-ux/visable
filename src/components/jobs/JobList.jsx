import React, { useState, useEffect } from "react";
import supabase from "../../services/supabase/supabaseClient";

const JobList = ({ searchQuery }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);

      let query = supabase.from("jobs").select("*").order("created_at", { ascending: false });

      // 如果有搜尋條件，添加過濾條件
      if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching jobs:", error);
      } else {
        setJobs(data);
      }

      setLoading(false);
    };

    fetchJobs();
  }, [searchQuery]);

  if (loading) {
    return <p>Loading jobs...</p>;
  }

  return (
    <div className="job-list">
      {jobs.length > 0 ? (
        jobs.map((job) => (
          <div key={job.id} className="job-card">
            <h3>{job.title}</h3>
            <p>{job.company}</p>
            <p>{job.location}</p>
            <p>Posted on: {new Date(job.created_at).toLocaleDateString()}</p>
            {job.salary_min && job.salary_max && (
              <p>
                Salary: ${job.salary_min} - ${job.salary_max}
              </p>
            )}
          </div>
        ))
      ) : (
        <p>No jobs found.</p>
      )}
    </div>
  );
};

export default JobList;