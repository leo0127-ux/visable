import React, { useState, useEffect } from 'react';
import { Button, Upload, message, Spin } from 'antd';
import { UploadOutlined, FileOutlined, LoadingOutlined } from '@ant-design/icons';
import supabase from '../../services/supabase/supabaseClient';
import './DocumentsPage.scss';

const DocumentsPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [userDocuments, setUserDocuments] = useState({
    resume: null,
    coverLetter: null
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Get user from auth
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          throw authError;
        }
        
        if (!authUser) {
          setLoading(false);
          return;
        }
        
        setUser(authUser);
        
        // Get user documents from public.users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('resume, cover_letter')
          .eq('id', authUser.id)
          .single();
        
        if (userError && userError.code !== 'PGRST116') {
          // If it's not a "not found" error, throw it
          throw userError;
        }
        
        if (userData) {
          setUserDocuments({
            resume: userData.resume || null,
            coverLetter: userData.cover_letter || null
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        message.error("Failed to load your documents");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
    
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        const { user: authUser } = session;
        setUser(authUser);
        fetchUserData();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserDocuments({ resume: null, coverLetter: null });
      }
    });
    
    return () => {
      // Clean up subscription
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const handleUpload = async (file, documentType) => {
    if (!user) {
      message.error("Please log in to upload documents");
      return;
    }
    
    setUploading(true);
    
    try {
      // Check file type and size
      const fileExt = file.name.split('.').pop();
      if (!['pdf', 'doc', 'docx'].includes(fileExt.toLowerCase())) {
        message.error('Only PDF, DOC, and DOCX files are allowed');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        message.error('File must be smaller than 5MB');
        return;
      }
      
      // Upload to Supabase Storage
      const fileName = `${documentType}_${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `documents/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('user_documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('user_documents')
        .getPublicUrl(filePath);
      
      // Update user record with document URL
      const updateData = documentType === 'resume' 
        ? { resume: publicUrl } 
        : { cover_letter: publicUrl };
      
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);
      
      if (updateError) {
        throw updateError;
      }
      
      // Update local state
      setUserDocuments(prev => ({
        ...prev,
        [documentType === 'resume' ? 'resume' : 'coverLetter']: publicUrl
      }));
      
      message.success(`${documentType === 'resume' ? 'Resume' : 'Cover Letter'} uploaded successfully`);
    } catch (error) {
      console.error(`Error uploading ${documentType}:`, error);
      message.error(`Failed to upload ${documentType === 'resume' ? 'resume' : 'cover letter'}`);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="documents-page loading">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        <p>Loading your documents...</p>
      </div>
    );
  }
  
  if (!user) {
    // This case should technically never happen if the user is already logged in
    return (
      <div className="documents-page not-logged-in">
        <p>Please log in to manage your documents.</p>
        <p>If you're seeing this message and you're already logged in, please try refreshing the page.</p>
      </div>
    );
  }
  
  return (
    <div className="documents-page">
      <h2>My Documents</h2>
      
      <div className="document-section">
        <h3>Resume</h3>
        <p className="section-description">
          Upload your resume to quickly apply for jobs. Supported formats: PDF, DOC, DOCX.
        </p>
        
        <div className="file-upload">
          <Upload
            name="resume"
            beforeUpload={(file) => {
              handleUpload(file, 'resume');
              return false; // Prevent default upload behavior
            }}
            showUploadList={false}
            disabled={uploading}
          >
            <Button 
              icon={<UploadOutlined />} 
              loading={uploading}
            >
              {userDocuments.resume ? 'Update Resume' : 'Upload Resume'}
            </Button>
          </Upload>
        </div>
        
        {userDocuments.resume && (
          <div className="current-file">
            <p>Current resume:</p>
            <a 
              href={userDocuments.resume} 
              target="_blank" 
              rel="noopener noreferrer"
              className="file-link"
            >
              <FileOutlined /> View Resume
            </a>
          </div>
        )}
      </div>
      
      <div className="document-section">
        <h3>Cover Letter</h3>
        <p className="section-description">
          Have a general cover letter ready to customize for job applications. 
          Supported formats: PDF, DOC, DOCX.
        </p>
        
        <div className="file-upload">
          <Upload
            name="coverLetter"
            beforeUpload={(file) => {
              handleUpload(file, 'coverLetter');
              return false; // Prevent default upload behavior
            }}
            showUploadList={false}
            disabled={uploading}
          >
            <Button 
              icon={<UploadOutlined />}
              loading={uploading}
            >
              {userDocuments.coverLetter ? 'Update Cover Letter' : 'Upload Cover Letter'}
            </Button>
          </Upload>
        </div>
        
        {userDocuments.coverLetter && (
          <div className="current-file">
            <p>Current cover letter:</p>
            <a 
              href={userDocuments.coverLetter} 
              target="_blank" 
              rel="noopener noreferrer"
              className="file-link"
            >
              <FileOutlined /> View Cover Letter
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsPage;
