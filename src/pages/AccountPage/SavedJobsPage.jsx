import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '../../services/supabase/supabaseClient';
import { DeleteOutlined } from '@ant-design/icons';
import './AccountPage.scss';
import './SavedJobsPage.scss';

const SavedJobsPage = ({ onLoginRequired, searchQuery }) => {
  const [user, setUser] = useState(null);
  const [savedJobs, setSavedJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const navigate = useNavigate();

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
                company_logo_url,
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

  // Filter saved jobs when search query changes
  useEffect(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      setFilteredJobs(savedJobs);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = savedJobs.filter(item => 
        item.jobs?.job_position?.toLowerCase().includes(query) ||
        item.jobs?.company_name?.toLowerCase().includes(query) ||
        item.jobs?.job_location?.toLowerCase().includes(query)
      );
      setFilteredJobs(filtered);
    }
  }, [searchQuery, savedJobs]);

  const handleRemoveSavedJob = async (event, jobId) => {
    event.stopPropagation();
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

      // Update UI after successful deletion
      setSavedJobs(prevJobs => prevJobs.filter(item => item.job_id !== jobId));
      alert("Job removed from saved jobs.");
    } catch (err) {
      console.error("Error removing saved job:", err);
      alert("Failed to remove job from saved list.");
    }
  };
  
  const handleJobClick = (job) => {
    // Navigate to jobs page with the selected job in state
    console.log("Navigating to JobsPage with job:", job.job_id);
    navigate('/jobs', { 
      state: { 
        selectedJobId: job.job_id 
      }
    });
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstItem, indexOfLastItem); // Use filteredJobs instead of savedJobs
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage); // Calculate based on filteredJobs
  
  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <div className="saved-jobs-page loading">Loading...</div>;
  if (authChecked && !user) return <div className="saved-jobs-page not-logged-in">Please log in to view saved jobs.</div>;

  return (
    <div className="saved-jobs-page">
      <h2>Saved Jobs</h2>
      
      {filteredJobs.length === 0 ? (
        <div className="no-saved-jobs">
          {savedJobs.length === 0 ? (
            <>
              <p>You haven't saved any jobs yet.</p>
              <Link to="/jobs" className="find-jobs-btn">Find Jobs</Link>
            </>
          ) : (
            <p>No matching jobs found for "{searchQuery}".</p>
          )}
        </div>
      ) : (
        <>
          <div className="saved-jobs-table">
            <div className="table-header">
              <div className="col company-col">Company</div>
              <div className="col job-col">Job Position</div>
              <div className="col location-col">Location</div>
              <div className="col date-col">Date Saved</div>
              <div className="col actions-col">Actions</div>
            </div>
            
            {currentJobs.map(item => (
              <div 
                key={item.id} 
                className="saved-job-card" 
                onClick={() => handleJobClick(item.jobs)}
              >
                <div className="col company-col">
                  <div className="company-logo-container">
                    <img 
                      src={item.jobs?.company_logo_url || "https://via.placeholder.com/40"} 
                      alt={`${item.jobs?.company_name} logo`}
                      className="company-logo"
                    />
                  </div>
                  <span className="company-name">{item.jobs?.company_name || 'Unknown company'}</span>
                </div>
                
                <div className="col job-col">
                  <h3>{item.jobs?.job_position || 'Unknown position'}</h3>
                </div>
                
                <div className="col location-col">
                  <span>{item.jobs?.job_location || 'Unknown location'}</span>
                </div>
                
                <div className="col date-col">
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                
                <div className="col actions-col">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(item.jobs?.job_link, '_blank');
                    }}
                    className="apply-button"
                  >
                    Apply
                  </button>
                  <button 
                    onClick={(e) => handleRemoveSavedJob(e, item.jobs.job_id)}
                    className="remove-button"
                    title="Remove from saved jobs"
                  >
                    <DeleteOutlined />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="pagination-container">
            <div className="pagination-info">
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredJobs.length)} of {filteredJobs.length} items
            </div>
            
            <div className="pagination">
              <button 
                className={`pagination-button ${currentPage === 1 ? 'disabled' : ''}`}
                onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                disabled={currentPage === 1}
              >
                &lt;
              </button>
              
              {[...Array(totalPages).keys()].map(number => (
                <button
                  key={number + 1}
                  className={`pagination-button ${currentPage === number + 1 ? 'active' : ''}`}
                  onClick={() => paginate(number + 1)}
                >
                  {number + 1}
                </button>
              ))}
              
              <button 
                className={`pagination-button ${currentPage === totalPages ? 'disabled' : ''}`}
                onClick={() => currentPage < totalPages && paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                &gt;
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SavedJobsPage;
