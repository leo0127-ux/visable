import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../../services/supabase/supabaseClient';
import './AccountPage.scss';
import './SavedJobsPage.scss';

const SavedJobsPage = ({ onLoginRequired }) => {
  const [user, setUser] = useState(null);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (session?.user) {
          console.log("User is authenticated:", session.user.email);
          setUser(session.user);
          
          // Fetch saved jobs with job details
          const { data, error } = await supabase
            .from("saved_jobs")
            .select(`
              id,
              job_id,
              created_at,
              jobs (
                id,
                job_id,
                job_position,
                job_link,
                company_name,
                job_location,
                job_posting_date
              )
            `)
            .eq("user_id", session.user.id);

          if (error) {
            console.error("Error fetching saved jobs:", error);
            throw error;
          }

          // Filter out any null references and format data
          const validJobs = data?.filter(item => item.jobs) || [];
          console.log("Fetched saved jobs:", validJobs);
          setSavedJobs(validJobs);
        } else {
          console.log("No authenticated user found");
          if (onLoginRequired) onLoginRequired();
        }
      } catch (err) {
        console.error("Error in authentication check:", err);
      } finally {
        setLoading(false);
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, [onLoginRequired]);

  const handleRemoveSavedJob = async (jobId) => {
    try {
      if (!user) {
        console.error("No authenticated user");
        return;
      }
      
      const { error } = await supabase
        .from("saved_jobs")
        .delete()
        .eq("job_id", jobId)
        .eq("user_id", user.id);

      if (error) throw error;

      setSavedJobs(savedJobs.filter(job => job.job_id !== jobId));
    } catch (err) {
      console.error("Error removing saved job:", err);
      alert("Failed to remove job from saved list.");
    }
  };

  if (loading) return <div className="saved-jobs-page loading">Loading...</div>;
  if (authChecked && !user) return <div className="saved-jobs-page not-logged-in">Please log in to view saved jobs.</div>;

  return (
    <div className="saved-jobs-page">
      <h2>Saved Jobs</h2>
      
      {savedJobs.length === 0 ? (
        <div className="no-saved-jobs">
          <p>You haven't saved any jobs yet.</p>
          <Link to="/jobs" className="find-jobs-btn">Find Jobs</Link>
        </div>
      ) : (
        <div className="saved-jobs-list">
          {savedJobs.map(item => (
            <div key={item.id} className="saved-job-card">
              <div className="job-info">
                <h3>{item.jobs?.job_position || 'Unknown position'}</h3>
                <p className="company-name">{item.jobs?.company_name || 'Unknown company'}</p>
                <p className="job-location">{item.jobs?.job_location || 'Unknown location'}</p>
                <p className="saved-date">Saved on: {new Date(item.created_at).toLocaleDateString()}</p>
              </div>
              <div className="job-actions">
                <button 
                  onClick={() => window.open(item.jobs?.job_link, '_blank')}
                  className="view-button"
                >
                  View Job
                </button>
                <button 
                  onClick={() => handleRemoveSavedJob(item.job_id)}
                  className="remove-button"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedJobsPage;
