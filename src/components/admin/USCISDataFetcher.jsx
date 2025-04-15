import React, { useState } from 'react';
import { Card, Form, Select, Input, Button, message, Progress, Space, Alert, Divider } from 'antd';
import { SyncOutlined, DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import supabase from '../../services/supabase/supabaseClient';
import './USCISDataFetcher.scss';

const { Option } = Select;

const USCISDataFetcher = ({ onDataFetched }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  
  // Generate fiscal year options from 2015 to current year
  const currentYear = new Date().getFullYear();
  const fiscalYears = [];
  for (let year = currentYear; year >= 2015; year--) {
    fiscalYears.push(year.toString());
  }
  
  // Industry (NAICS) code options - sample of common tech industries
  const industryOptions = [
    { value: '', label: 'All Industries' },
    { value: '54', label: '54 - Professional, Scientific, and Technical Services' },
    { value: '62', label: '62 - Health Care and Social Assistance' },
    { value: '52', label: '52 - Finance and Insurance' },
    { value: '51', label: '51 - Information' },
    { value: '61', label: '61 - Educational Services' },
    { value: '31-33', label: '31-33 - Manufacturing' },
  ];
  
  // State options - top states for H-1B
  const stateOptions = [
    { value: '', label: 'All States' },
    { value: 'CA', label: 'California' },
    { value: 'TX', label: 'Texas' },
    { value: 'NY', label: 'New York' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'IL', label: 'Illinois' },
    { value: 'WA', label: 'Washington' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'GA', label: 'Georgia' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'VA', label: 'Virginia' },
  ];

  const simulateProgress = () => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      if (currentProgress >= 95) {
        clearInterval(interval);
      } else {
        setProgress(currentProgress);
      }
    }, 500);
    
    return interval;
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setProgress(0);
      setStatus('Starting data fetch from USCIS...');
      setResult(null);
      
      const progressInterval = simulateProgress();
      
      // Try direct fetch first with explicit error handling
      try {
        console.log('Trying direct fetch to Edge Function...');
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-uscis-h1b-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_KEY}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            fiscal_year: values.fiscal_year,
            employer: values.employer || '',
            industry: values.industry || '',
            state: values.state || '',
            city: values.city || '',
            zip: values.zip || ''
          })
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        clearInterval(progressInterval);
        setProgress(100);
        setStatus(`Successfully fetched ${data.count} records!`);
        setResult(data);
        
        if (onDataFetched) {
          onDataFetched(data);
        }
        
        message.success(`Successfully fetched ${data.count} records from USCIS`);
        return;
      } catch (directFetchError) {
        console.warn('Direct fetch failed, falling back to supabase client:', directFetchError);
      }
      
      // Fall back to using Supabase client
      console.log('Trying via Supabase client...');
      const { data, error } = await supabase.functions.invoke('fetch-uscis-h1b-data', {
        body: {
          fiscal_year: values.fiscal_year,
          employer: values.employer || '',
          industry: values.industry || '',
          state: values.state || '',
          city: values.city || '',
          zip: values.zip || ''
        }
      });
      
      clearInterval(progressInterval);
      
      if (error) {
        throw new Error(`Function error: ${error.message}`);
      }
      
      setProgress(100);
      setStatus(`Successfully fetched ${data.count} records!`);
      setResult(data);
      
      if (onDataFetched) {
        onDataFetched(data);
      }
      
      message.success(`Successfully fetched ${data.count} records from USCIS`);
    } catch (error) {
      setProgress(0);
      setStatus(`Error: ${error.message}`);
      message.error(`Failed to fetch data: ${error.message}`);
      console.error('Fetch error details:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      title={
        <Space>
          <SearchOutlined /> USCIS H-1B Data Fetcher
        </Space>
      }
      className="uscis-fetcher-card"
    >
      <Alert
        message="USCIS H-1B Employer Data Hub"
        description="This tool helps you fetch H-1B visa data from USCIS. You can filter by fiscal year, employer name, industry, state, city, or zip code. The fetched data will be stored in the system and displayed on the report page."
        type="info"
        showIcon
        style={{ marginBottom: '20px' }}
      />
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ fiscal_year: currentYear.toString() }}
      >
        <Form.Item
          name="fiscal_year"
          label="Fiscal Year"
          rules={[{ required: true, message: 'Please select a fiscal year' }]}
        >
          <Select placeholder="Select Fiscal Year">
            {fiscalYears.map(year => (
              <Option key={year} value={year}>{year}</Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item
          name="industry"
          label="Industry (NAICS Code)"
        >
          <Select placeholder="Select Industry" allowClear>
            {industryOptions.map(option => (
              <Option key={option.value} value={option.value}>{option.label}</Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item
          name="state"
          label="State"
        >
          <Select placeholder="Select State" allowClear>
            {stateOptions.map(option => (
              <Option key={option.value} value={option.value}>{option.label}</Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item
          name="city"
          label="City"
        >
          <Input placeholder="Enter City Name" />
        </Form.Item>
        
        <Form.Item
          name="zip"
          label="Zip Code"
        >
          <Input placeholder="Enter Zip Code" />
        </Form.Item>
        
        <Form.Item
          name="employer"
          label="Employer Name (Optional)"
        >
          <Input placeholder="Enter Employer Name (e.g., Google, Microsoft, Amazon)" />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            icon={<SyncOutlined spin={loading} />}
            loading={loading}
            className="submit-button"
          >
            Fetch H-1B Data
          </Button>
        </Form.Item>
      </Form>
      
      {loading && (
        <div className="progress-container">
          <Progress percent={progress} status="active" />
          <p className="status-message">{status}</p>
        </div>
      )}
      
      {result && (
        <>
          <Divider />
          <Alert
            message="Data Fetch Successful"
            description={`Successfully fetched and processed ${result.count} records. You can now view these data on the report page.`}
            type="success"
            showIcon
          />
          <Button 
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => window.location.href = '/visa-report'}
          >
            View Data Report
          </Button>
        </>
      )}
    </Card>
  );
};

export default USCISDataFetcher;
