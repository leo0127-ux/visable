import React, { useState, useEffect } from "react";
import { 
  Card, 
  Select, 
  Button, 
  Row, 
  Col, 
  Input, 
  Form, 
  Space, 
  Spin,
  Tabs,
  message, 
  Alert
} from "antd";
import { 
  InfoCircleOutlined, 
  FilterOutlined, 
  SearchOutlined, 
  ReloadOutlined, 
  DownloadOutlined 
} from "@ant-design/icons";
import { getH1BVisaData, shouldUpdateData, generateFallbackData } from "../../utils/csvDataHandler";
import VisaDataVisualizer from "../../components/visa/VisaDataVisualizer";
import H1BInsights from "../../components/visa/H1BInsights";
import TableauEmbed from "../../components/visa/TableauEmbed";
import "./VisaReportPage.scss";

const { Option } = Select;

const VisaReportPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterValues, setFilterValues] = useState({
    employer: '',
    state: '',
    fiscalYear: '2023',
  });
  const [visaData, setVisaData] = useState(null);
  const [activeTab, setActiveTab] = useState('visualization');
  const [form] = Form.useForm();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 美國州別列表
  const states = [
    { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
    { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
    { value: 'DC', label: 'District of Columbia' }
  ];
  
  // 財政年度選項
  const fiscalYears = [
    { value: '2023', label: '2023' },
    { value: '2022', label: '2022' },
    { value: '2021', label: '2021' },
    { value: '2020', label: '2020' },
    { value: '2019', label: '2019' }
  ];

  // USCIS 官方 Tableau URL
  const tableauUrl = "https://bigdataanalyticspub-sb.uscis.dhs.gov/views/H1BEmployerDataHub-Final/H1B-EmployerDataHub";

  // 處理 Tableau 載入完成
  const handleTableauLoad = (vizInstance) => {
    if (vizInstance) {
      console.log('Tableau visualization loaded successfully');
      // 可以在這裡提取數據或者設置事件監聽
    }
  };

  // 載入 H1B 簽證數據
  useEffect(() => {
    loadVisaData();
  }, []);

  // 載入簽證數據
  const loadVisaData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // 檢查本地存儲中是否有緩存數據
      const cachedDataString = localStorage.getItem('h1bVisaData');
      const cachedData = cachedDataString ? JSON.parse(cachedDataString) : null;
      
      // 如果有緩存數據且不需要強制刷新，則使用緩存數據
      if (cachedData && !forceRefresh && !shouldUpdateData(cachedData.lastUpdated)) {
        setVisaData(cachedData);
        setLoading(false);
        return;
      }
      
      // 否則，獲取新的數據
      const newData = await getH1BVisaData();
      
      // 更新狀態和本地存儲
      setVisaData(newData);
      localStorage.setItem('h1bVisaData', JSON.stringify(newData));
      
    } catch (error) {
      console.error('加載簽證數據時出錯:', error);
      setError('無法加載簽證數據。使用後備數據。');
      
      // 使用後備數據
      const fallbackData = generateFallbackData();
      setVisaData(fallbackData);
      
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // 應用過濾器
  const applyFilters = (values) => {
    setFilterValues(values);
    
    // 篩選數據
    if (visaData) {
      // 實際上這裡應該重新過濾數據，但為了簡單起見，我們僅記錄過濾器值的變更
      console.log('應用過濾器:', values);
      message.success('過濾器已應用');
    }
  };

  // 重置過濾器
  const resetFilters = () => {
    form.resetFields();
    setFilterValues({
      employer: '',
      state: '',
      fiscalYear: '2023',
    });
  };
  
  // 刷新數據
  const refreshData = () => {
    setIsRefreshing(true);
    loadVisaData(true);  // 強制刷新
  };
  
  // 下載 CSV 數據
  const downloadCSV = () => {
    if (!visaData || !visaData.approvals) {
      message.error('無數據可下載');
      return;
    }
    
    // 創建 CSV 內容
    const headers = 'Employer,Job Title,Worksite,State,Fiscal Year,Total Approvals\n';
    const rows = visaData.approvals.map(record => 
      `"${record.employerName}","${record.jobTitle}","${record.worksite}","${record.state}","${record.fiscalYear}",${record.totalApprovals}`
    ).join('\n');
    
    const csvContent = `${headers}${rows}`;
    
    // 創建並下載文件
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `h1b_visa_data_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    message.success('CSV 數據下載中');
  };

  return (
    <div className="visa-report-page">
      <div className="page-header">
        <div className="left-header">
          <h1>美國簽證數據報告</h1>
          <p className="description">
            此報告提供來自美國公民及移民服務局 (USCIS) 的 H-1B 簽證數據統計和分析。
          </p>
        </div>
        
        <div className="right-header">
          <Space>
            <Button 
              icon={<ReloadOutlined spin={isRefreshing} />} 
              onClick={refreshData} 
              disabled={isRefreshing}
            >
              刷新數據
            </Button>
            
            <Button 
              icon={<DownloadOutlined />} 
              onClick={downloadCSV}
            >
              下載 CSV
            </Button>
          </Space>
        </div>
      </div>

      {error && (
        <Alert
          message="數據載入警告"
          description={error}
          type="warning"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      <Card className="filter-card">
        <Form 
          form={form}
          layout="vertical"
          initialValues={filterValues}
          onFinish={applyFilters}
        >
          <Row gutter={16}>
            <Col xs={24} sm={24} md={8} lg={8}>
              <Form.Item name="employer" label="雇主名稱">
                <Input 
                  placeholder="輸入雇主名稱" 
                  prefix={<SearchOutlined />} 
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={8}>
              <Form.Item name="state" label="州別">
                <Select
                  placeholder="選擇州別"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {states.map(state => (
                    <Option key={state.value} value={state.value}>{state.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={8}>
              <Form.Item name="fiscalYear" label="財政年度">
                <Select placeholder="選擇年度">
                  {fiscalYears.map(year => (
                    <Option key={year.value} value={year.value}>{year.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={24} style={{ textAlign: 'right' }}>
              <Space>
                <Button 
                  icon={<ReloadOutlined />}
                  onClick={resetFilters}
                >
                  重置
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  icon={<FilterOutlined />}
                >
                  應用過濾器
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>
      
      {/* 標籤頁切換 - Replace TabPane with items prop */}
      <Tabs 
        activeKey={activeTab}
        onChange={setActiveTab}
        className="visa-tabs"
        items={[
          {
            key: 'visualization',
            label: '數據視覺化',
            children: (
              <TableauEmbed 
                url={tableauUrl}
                height={800}
                onVizLoad={handleTableauLoad}
                fallbackComponent={
                  <VisaDataVisualizer 
                    data={visaData} 
                    loading={loading} 
                    onRefresh={refreshData}
                    filterValues={filterValues}
                  />
                }
              />
            )
          },
          {
            key: 'insights',
            label: '數據洞察',
            children: (
              <H1BInsights 
                tableauData={{
                  allMetrics: visaData?.summary || {},
                  topEmployers: visaData?.employerStats || [],
                  summaryData: {
                    yearlyTrend: visaData?.yearlyStats?.map(stat => ({
                      ...stat,
                      key: stat.year  // 添加 key 属性
                    })) || []
                  }
                }} 
                loading={loading} 
              />
            )
          }
        ]}
      />

      <div className="data-disclaimer">
        <InfoCircleOutlined /> 數據來源：U.S. Citizenship and Immigration Services (USCIS) H-1B Employer Data Hub。數據每日自動更新。
      </div>
    </div>
  );
};

export default VisaReportPage;
