import React, { useState, useEffect } from 'react';
import { Card, Avatar, Spin, Button, Tag, Typography, message } from 'antd';
import { 
  GlobalOutlined, 
  LinkedinOutlined, 
  TwitterOutlined,
  FacebookOutlined,
  TeamOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  TagOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import supabase from '../../services/supabase/supabaseClient';
import './CompanyInfoCard.scss';

const { Title, Paragraph, Text, Link } = Typography;

const CompanyInfoCard = ({ domain, showFullInfo = false }) => {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCompanyData = async (forceRefresh = false) => {
    if (!domain) return;
    
    try {
      setLoading(true);
      setError(null);
      
      if (forceRefresh) {
        setRefreshing(true);
        // 调用edge function获取最新数据
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-company-data?domain=${domain}`,
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            }
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch company data');
        }
        
        const data = await response.json();
        setCompany(data);
        message.success(`${data.company_name} 数据已更新`);
      } else {
        // 从Supabase直接获取
        const { data, error } = await supabase
          .from('us_companies')
          .select(`
            *,
            us_company_tags (tag)
          `)
          .eq('company_domain', domain)
          .single();
          
        if (error) {
          if (error.code === 'PGRST116') {
            // 公司不存在，尝试使用edge function获取
            return await fetchCompanyData(true);
          }
          throw error;
        }
        
        setCompany(data);
      }
    } catch (err) {
      console.error('Error fetching company data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, [domain]);

  const handleRefresh = () => {
    fetchCompanyData(true);
  };

  if (loading) {
    return (
      <Card className="company-info-card loading">
        <div className="company-loading">
          <Spin size="large" />
          <div>加载公司数据中...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="company-info-card error">
        <div className="company-error">
          <div>无法加载公司数据: {error}</div>
          <Button onClick={handleRefresh} icon={<ReloadOutlined />}>重试</Button>
        </div>
      </Card>
    );
  }

  if (!company) {
    return (
      <Card className="company-info-card empty">
        <div className="company-empty">
          <div>没有找到公司数据</div>
          <Button onClick={handleRefresh} icon={<ReloadOutlined />}>
            尝试获取数据
          </Button>
        </div>
      </Card>
    );
  }

  // 简洁版显示
  if (!showFullInfo) {
    return (
      <Card className="company-info-card compact">
        <div className="company-header">
          <Avatar
            src={company.logo_url}
            size={64}
            className="company-logo"
          />
          <div className="company-title">
            <Title level={4}>{company.company_name}</Title>
            {company.industry && (
              <Text type="secondary">{company.industry}</Text>
            )}
          </div>
        </div>
        
        {company.description && (
          <Paragraph ellipsis={{ rows: 2 }} className="company-description">
            {company.description}
          </Paragraph>
        )}
        
        <div className="company-footer">
          <Button type="link" href={company.website} target="_blank">
            <GlobalOutlined /> 官网
          </Button>
          
          <Button type="primary" size="small" onClick={() => setShowFullInfo(true)}>
            查看详情
          </Button>
        </div>
      </Card>
    );
  }

  // 完整版显示
  return (
    <Card 
      className="company-info-card full"
      title={
        <div className="company-header">
          <Avatar
            src={company.logo_url}
            size={64}
            className="company-logo"
            shape="square"
          />
          <div className="company-title">
            <Title level={4}>{company.company_name}</Title>
            {company.legal_name && company.legal_name !== company.company_name && (
              <Text type="secondary">({company.legal_name})</Text>
            )}
          </div>
        </div>
      }
      extra={
        <Button 
          icon={<ReloadOutlined />} 
          onClick={handleRefresh}
          loading={refreshing}
        >
          刷新
        </Button>
      }
    >
      <div className="company-content">
        {company.description && (
          <section className="company-section">
            <Paragraph>{company.description}</Paragraph>
          </section>
        )}
        
        <section className="company-section">
          <Title level={5}>基本信息</Title>
          <ul className="company-info-list">
            {company.industry && (
              <li>
                <strong>行业:</strong> {company.industry}
                {company.sector && ` (${company.sector})`}
              </li>
            )}
            
            {company.founded_year && (
              <li>
                <CalendarOutlined className="info-icon" />
                <strong>成立年份:</strong> {company.founded_year}
              </li>
            )}
            
            {company.employee_count && (
              <li>
                <TeamOutlined className="info-icon" />
                <strong>员工人数:</strong> {company.employee_count.toLocaleString()}
              </li>
            )}
            
            {(company.hq_city || company.hq_state) && (
              <li>
                <EnvironmentOutlined className="info-icon" />
                <strong>总部:</strong> {[company.hq_city, company.hq_state].filter(Boolean).join(', ')}
              </li>
            )}
          </ul>
        </section>
        
        <section className="company-section">
          <Title level={5}>联系方式</Title>
          <div className="company-links">
            {company.website && (
              <Button type="link" href={company.website} target="_blank">
                <GlobalOutlined /> 官方网站
              </Button>
            )}
            
            {company.linkedin_url && (
              <Button type="link" href={company.linkedin_url} target="_blank">
                <LinkedinOutlined /> LinkedIn
              </Button>
            )}
            
            {company.twitter_url && (
              <Button type="link" href={company.twitter_url} target="_blank">
                <TwitterOutlined /> Twitter
              </Button>
            )}
            
            {company.facebook_url && (
              <Button type="link" href={company.facebook_url} target="_blank">
                <FacebookOutlined /> Facebook
              </Button>
            )}
          </div>
        </section>
        
        {company.us_company_tags && company.us_company_tags.length > 0 && (
          <section className="company-section">
            <Title level={5}>
              <TagOutlined /> 标签
            </Title>
            <div className="company-tags">
              {company.us_company_tags.map((tagObj, index) => (
                <Tag key={index} color="blue">{tagObj.tag}</Tag>
              ))}
            </div>
          </section>
        )}
        
        <div className="company-footer">
          <Text type="secondary" className="updated-at">
            最后更新: {new Date(company.last_updated).toLocaleString()}
          </Text>
        </div>
      </div>
    </Card>
  );
};

export default CompanyInfoCard;
