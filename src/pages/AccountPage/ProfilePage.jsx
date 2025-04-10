import React, { useState, useEffect } from 'react';
import { Spin, Avatar, Button, Form, Input, message } from 'antd';
import { UserOutlined, LoadingOutlined } from '@ant-design/icons';
import supabase from '../../services/supabase/supabaseClient';
import './ProfilePage.scss';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError) throw authError;
        if (!authUser) return;
        
        setUser(authUser);
        
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('full_name, bio, website, location')
          .eq('id', authUser.id)
          .single();
        
        if (userError && userError.code !== 'PGRST116') {
          // Not found error is ok - just means we need to create profile details
          console.error('Error fetching user data:', userError);
        }
        
        form.setFieldsValue({
          email: authUser.email,
          full_name: userData?.full_name || '',
          bio: userData?.bio || '',
          website: userData?.website || '',
          location: userData?.location || ''
        });
      } catch (error) {
        console.error('Error loading profile:', error);
        message.error('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [form]);
  
  const handleSubmit = async (values) => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          full_name: values.full_name,
          bio: values.bio,
          website: values.website,
          location: values.location,
          updated_at: new Date()
        }, {
          onConflict: 'id'
        });
      
      if (error) throw error;
      
      message.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="profile-page loading">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        <p>Loading profile...</p>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="profile-page not-logged-in">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }
  
  return (
    <div className="profile-page">
      <div className="profile-header">
        <Avatar size={80} icon={<UserOutlined />} />
        <h2>{user.email}</h2>
      </div>
      
      <div className="profile-form">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item name="email" label="Email">
            <Input disabled />
          </Form.Item>
          
          <Form.Item name="full_name" label="Full Name">
            <Input placeholder="Your full name" />
          </Form.Item>
          
          <Form.Item name="bio" label="Bio">
            <Input.TextArea 
              placeholder="Tell us about yourself" 
              rows={4} 
            />
          </Form.Item>
          
          <Form.Item name="website" label="Website">
            <Input placeholder="Your personal website" />
          </Form.Item>
          
          <Form.Item name="location" label="Location">
            <Input placeholder="Where are you based?" />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={saving}
            >
              Save Profile
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default ProfilePage;
