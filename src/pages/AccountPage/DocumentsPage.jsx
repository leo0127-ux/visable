import React, { useState, useEffect } from 'react';
import supabase from '../../services/supabase/supabaseClient';
import './AccountPage.scss';

const DocumentsPage = ({ onLoginRequired }) => {
  const [user, setUser] = useState(null);
  const [resume, setResume] = useState(null);
  const [coverLetter, setCoverLetter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);

        // Fetch user documents
        const { data, error } = await supabase
          .from("users")
          .select("resume, cover_letter")
          .eq("id", session.user.id)
          .single();

        if (data) {
          setResume(data.resume);
          setCoverLetter(data.cover_letter);
        }
        
        setLoading(false);
      } else {
        onLoginRequired?.(); // Trigger login popup if provided
        setLoading(false);
      }
    };

    checkAuth();
  }, [onLoginRequired]);

  const handleUpload = async (type, file) => {
    if (!file) return;
    
    try {
      const filePath = `${user.id}/${type}/${file.name}`;
      const { error } = await supabase.storage
        .from("user-files")
        .upload(filePath, file, { upsert: true });
        
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from("user-files")
        .getPublicUrl(filePath);
        
      const fileUrl = urlData.publicUrl;
        
      // Update user record with file URL
      const { error: updateError } = await supabase
        .from("users")
        .update({ [type]: fileUrl })
        .eq("id", user.id);
        
      if (updateError) throw updateError;
      
      if (type === 'resume') {
        setResume(fileUrl);
      } else if (type === 'cover_letter') {
        setCoverLetter(fileUrl);
      }
      
      alert(`${type === 'resume' ? 'Resume' : 'Cover letter'} uploaded successfully!`);
    } catch (err) {
      console.error(`Error uploading ${type}:`, err);
      alert(`Failed to upload ${type}.`);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in to manage your documents.</div>;

  return (
    <div className="account-page">
      <h2>Documents</h2>
      
      <div className="document-section">
        <h3>Resume</h3>
        <div className="file-upload">
          <input 
            type="file" 
            id="resume-upload"
            onChange={(e) => handleUpload('resume', e.target.files[0])} 
            accept=".pdf,.doc,.docx"
          />
          <label htmlFor="resume-upload" className="upload-button">
            Select Resume File
          </label>
        </div>
        
        {resume && (
          <div className="current-file">
            <p>Current Resume:</p>
            <a href={resume} target="_blank" rel="noreferrer">View Resume</a>
          </div>
        )}
      </div>
      
      <div className="document-section">
        <h3>Cover Letter</h3>
        <div className="file-upload">
          <input 
            type="file" 
            id="cover-letter-upload"
            onChange={(e) => handleUpload('cover_letter', e.target.files[0])} 
            accept=".pdf,.doc,.docx"
          />
          <label htmlFor="cover-letter-upload" className="upload-button">
            Select Cover Letter File
          </label>
        </div>
        
        {coverLetter && (
          <div className="current-file">
            <p>Current Cover Letter:</p>
            <a href={coverLetter} target="_blank" rel="noreferrer">View Cover Letter</a>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsPage;
