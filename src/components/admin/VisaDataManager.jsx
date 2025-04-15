import React, { useState, useEffect } from 'react';
import { Button, Table, Modal, Drawer, Spin, Alert, Progress, Space, Tabs } from 'antd';
import { SyncOutlined, FileTextOutlined, CloseOutlined, DownloadOutlined } from '@ant-design/icons';
import supabase from '../../services/supabase/supabaseClient';
import './VisaDataManager.scss';

const { TabPane } = Tabs;

const VisaDataManager = ({ userId, isAdmin }) => {
  const [isLogsDrawerOpen, setIsLogsDrawerOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [updateStatus, setUpdateStatus] = useState('');
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  
  const [visaData, setVisaData] = useState({
    h1b_approvals: [],
    h1b_denials: [],
    h1b_lca: [],
    perm: [],
    prevailing_wage: []
  });
  const [activeDataTab, setActiveDataTab] = useState('h1b_approvals');
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState(null);
  
  useEffect(() => {
    if (isAdmin) {
      fetchVisaData(activeDataTab);
    }
  }, [isAdmin, activeDataTab]);
  
  const fetchLogs = async () => {
    if (!isAdmin) return;
    
    setIsLogsLoading(true);
    try {
      const { data, error } = await supabase
        .from('visa_data_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
        
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setIsLogsLoading(false);
    }
  };

  const fetchVisaData = async (dataType) => {
    if (!isAdmin) return;
    
    setDataLoading(true);
    setDataError(null);
    
    try {
      const { data, error } = await supabase
        .from(`visa_${dataType}`)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
        
      if (error) throw error;
      
      setVisaData(prev => ({
        ...prev,
        [dataType]: data || []
      }));
    } catch (err) {
      console.error(`Error fetching ${dataType} data:`, err);
      setDataError(`Failed to load ${dataType} data: ${err.message}`);
    } finally {
      setDataLoading(false);
    }
  };

  const triggerManualUpdate = async () => {
    if (!isAdmin) return;
    
    setIsUpdating(true);
    setProgress(0);
    setUpdateStatus('正在准备更新...');
    setCurrentStep('准备中');
    
    try {
      console.log('Starting data update process...');
      
      // Use a direct fetch with proper CORS headers instead of Supabase Functions SDK
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/visa-data-fetcher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_KEY}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({ manual: true })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API响应错误: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      console.log('Update result:', data);
      
      // Simulate a progress flow, as the actual operation is asynchronous
      for (let i = 1; i <= 5; i++) {
        await simulateStep(i);
      }
      
      setProgress(100);
      setUpdateStatus('数据更新成功！');
      setCurrentStep('完成');
      
      // Get the latest logs
      await fetchLogs();
    } catch (err) {
      console.error('Error triggering update:', err);
      setUpdateStatus(`更新失败: ${err.message}`);
      setProgress(0);
    } finally {
      setTimeout(() => {
        setIsUpdating(false);
      }, 2000);
    }
  };

  const simulateStep = async (step) => {
    const steps = [
      '下载H1B批准数据...',
      '下载H1B拒绝数据...',
      '下载LCA数据...',
      '下载PERM数据...',
      '更新数据库和统计信息...'
    ];
    
    setCurrentStep(steps[step - 1]);
    setProgress(step * 20);
    
    return new Promise(resolve => setTimeout(resolve, 1000));
  };

  const getColumns = (dataType) => {
    switch(dataType) {
      case 'h1b_approvals':
        return [
          { title: 'Employer', dataIndex: 'employer_name', key: 'employer_name', sorter: (a, b) => a.employer_name.localeCompare(b.employer_name) },
          { title: 'Job Title', dataIndex: 'job_title', key: 'job_title' },
          { title: 'Location', dataIndex: 'worksite_location', key: 'worksite_location' },
          { title: 'Fiscal Year', dataIndex: 'fiscal_year', key: 'fiscal_year' },
          { title: 'Wage', dataIndex: 'wage', key: 'wage', 
            render: (text) => text ? `$${Number(text).toLocaleString()}` : '-'
          },
        ];
      case 'h1b_denials':
        return [
          { title: 'Employer', dataIndex: 'employer_name', key: 'employer_name' },
          { title: 'Job Title', dataIndex: 'job_title', key: 'job_title' },
          { title: 'Location', dataIndex: 'worksite_location', key: 'worksite_location' },
          { title: 'Fiscal Year', dataIndex: 'fiscal_year', key: 'fiscal_year' },
          { title: 'Denial Reason', dataIndex: 'denial_reason', key: 'denial_reason',
            ellipsis: true, 
            render: (text) => text ? text : '-'
          },
        ];
      case 'h1b_lca':
        return [
          { title: 'Case Number', dataIndex: 'case_number', key: 'case_number' },
          { title: 'Employer', dataIndex: 'employer_name', key: 'employer_name' },
          { title: 'Job Title', dataIndex: 'job_title', key: 'job_title' },
          { title: 'Location', dataIndex: 'worksite_location', key: 'worksite_location' },
          { title: 'Wage', dataIndex: 'wage', key: 'wage',
            render: (text, record) => text ? `$${Number(text).toLocaleString()}${record.wage_unit ? ` / ${record.wage_unit}` : ''}` : '-'
          },
          { title: 'Status', dataIndex: 'status', key: 'status' },
        ];
      case 'perm':
        return [
          { title: 'Employer', dataIndex: 'employer_name', key: 'employer_name' },
          { title: 'Job Title', dataIndex: 'job_title', key: 'job_title' },
          { title: 'Location', dataIndex: 'worksite_location', key: 'worksite_location' },
          { title: 'Filing Date', dataIndex: 'filing_date', key: 'filing_date' },
          { title: 'Status', dataIndex: 'case_status', key: 'case_status' },
        ];
      case 'prevailing_wage':
        return [
          { title: 'Job Title', dataIndex: 'job_title', key: 'job_title' },
          { title: 'Area', dataIndex: 'area_of_employment', key: 'area_of_employment' },
          { title: 'Level', dataIndex: 'wage_level', key: 'wage_level' },
          { title: 'Wage', dataIndex: 'prevailing_wage', key: 'prevailing_wage',
            render: (text) => text ? `$${Number(text).toLocaleString()}` : '-'
          },
          { title: 'Effective Date', dataIndex: 'effective_date', key: 'effective_date' },
        ];
      default:
        return [];
    }
  };
  
  const expandedRowRender = (record, dataType) => {
    switch(dataType) {
      case 'h1b_approvals':
        return (
          <div className="expanded-row-content">
            <p><strong>ID:</strong> {record.id}</p>
            <p><strong>Case Status:</strong> {record.case_status || 'Approved'}</p>
            <p><strong>Created At:</strong> {new Date(record.created_at).toLocaleString()}</p>
          </div>
        );
      case 'h1b_denials':
        return (
          <div className="expanded-row-content">
            <p><strong>ID:</strong> {record.id}</p>
            <p><strong>Full Denial Reason:</strong> {record.denial_reason || 'Not specified'}</p>
            <p><strong>Created At:</strong> {new Date(record.created_at).toLocaleString()}</p>
          </div>
        );
      default:
        return (
          <div className="expanded-row-content">
            <p><strong>ID:</strong> {record.id}</p>
            <p><strong>Created At:</strong> {new Date(record.created_at).toLocaleString()}</p>
            <p><strong>Updated At:</strong> {new Date(record.updated_at).toLocaleString()}</p>
          </div>
        );
    }
  };

  const handleTabChange = (activeKey) => {
    setActiveDataTab(activeKey);
  };

  const exportToCSV = (dataType) => {
    if (!visaData[dataType] || visaData[dataType].length === 0) {
      message.error('No data to export');
      return;
    }
    
    const headers = Object.keys(visaData[dataType][0]).join(',');
    const rows = visaData[dataType].map(item => 
      Object.values(item).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `visa_${dataType}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="visa-data-manager">
      {isAdmin && (
        <>
          <div className="admin-actions">
            <Button 
              type="primary"
              icon={<SyncOutlined spin={isUpdating} />}
              onClick={() => setIsModalVisible(true)}
              disabled={isUpdating}
            >
              手动更新数据
            </Button>
            <Button
              icon={<FileTextOutlined />}
              onClick={() => {
                setIsLogsDrawerOpen(true);
                fetchLogs();
              }}
            >
              查看日志
            </Button>
          </div>
          
          <div className="visa-data-section">
            <div className="section-header">
              <h2>签证数据预览</h2>
              <Button 
                type="default"
                icon={<DownloadOutlined />}
                onClick={() => exportToCSV(activeDataTab)}
              >
                导出CSV
              </Button>
            </div>
            
            <Tabs activeKey={activeDataTab} onChange={handleTabChange}>
              <TabPane tab="H1B批准" key="h1b_approvals">
                {dataLoading ? (
                  <div className="loading-container"><Spin /> 加载中...</div>
                ) : dataError ? (
                  <Alert type="error" message={dataError} />
                ) : (
                  <Table 
                    columns={getColumns('h1b_approvals')} 
                    dataSource={visaData.h1b_approvals}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    expandable={{
                      expandedRowRender: record => expandedRowRender(record, 'h1b_approvals'),
                      expandRowByClick: true
                    }}
                    className="visa-data-table"
                    scroll={{ x: 'max-content' }}
                  />
                )}
              </TabPane>
              <TabPane tab="H1B拒绝" key="h1b_denials">
                {dataLoading ? (
                  <div className="loading-container"><Spin /> 加载中...</div>
                ) : dataError ? (
                  <Alert type="error" message={dataError} />
                ) : (
                  <Table 
                    columns={getColumns('h1b_denials')} 
                    dataSource={visaData.h1b_denials}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    expandable={{
                      expandedRowRender: record => expandedRowRender(record, 'h1b_denials'),
                      expandRowByClick: true
                    }}
                    className="visa-data-table"
                    scroll={{ x: 'max-content' }}
                  />
                )}
              </TabPane>
              <TabPane tab="H1B LCA" key="h1b_lca">
                {dataLoading ? (
                  <div className="loading-container"><Spin /> 加载中...</div>
                ) : dataError ? (
                  <Alert type="error" message={dataError} />
                ) : (
                  <Table 
                    columns={getColumns('h1b_lca')} 
                    dataSource={visaData.h1b_lca}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    expandable={{
                      expandedRowRender: record => expandedRowRender(record, 'h1b_lca'),
                      expandRowByClick: true
                    }}
                    className="visa-data-table"
                    scroll={{ x: 'max-content' }}
                  />
                )}
              </TabPane>
              <TabPane tab="绿卡(PERM)" key="perm">
                {dataLoading ? (
                  <div className="loading-container"><Spin /> 加载中...</div>
                ) : dataError ? (
                  <Alert type="error" message={dataError} />
                ) : (
                  <Table 
                    columns={getColumns('perm')} 
                    dataSource={visaData.perm}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    expandable={{
                      expandedRowRender: record => expandedRowRender(record, 'perm'),
                      expandRowByClick: true
                    }}
                    className="visa-data-table"
                    scroll={{ x: 'max-content' }}
                  />
                )}
              </TabPane>
              <TabPane tab="标准工资" key="prevailing_wage">
                {dataLoading ? (
                  <div className="loading-container"><Spin /> 加载中...</div>
                ) : dataError ? (
                  <Alert type="error" message={dataError} />
                ) : (
                  <Table 
                    columns={getColumns('prevailing_wage')} 
                    dataSource={visaData.prevailing_wage}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    expandable={{
                      expandedRowRender: record => expandedRowRender(record, 'prevailing_wage'),
                      expandRowByClick: true
                    }}
                    className="visa-data-table"
                    scroll={{ x: 'max-content' }}
                  />
                )}
              </TabPane>
            </Tabs>
          </div>
          
          <Modal
            title="手动更新签证数据"
            open={isModalVisible}
            onOk={triggerManualUpdate}
            onCancel={() => setIsModalVisible(false)}
            confirmLoading={isUpdating}
            okText="开始更新"
            cancelText="取消"
          >
            <p>确定要手动触发签证数据更新吗？此操作将从官方来源下载最新数据并更新数据库。</p>
            <p>这可能需要几分钟时间，具体取决于数据量和网络状况。</p>
            
            {isUpdating && (
              <div className="progress-update">
                <Alert message={currentStep || '处理中...'} type="info" showIcon />
                <Progress percent={progress} status="active" />
              </div>
            )}
            
            {updateStatus && (
              <Alert 
                message={updateStatus}
                type={updateStatus.includes('失败') ? 'error' : 'success'}
                showIcon
              />
            )}
          </Modal>
          
          <Drawer
            title="签证数据处理日志"
            placement="right"
            onClose={() => setIsLogsDrawerOpen(false)}
            open={isLogsDrawerOpen}
            width={600}
            className="logs-drawer"
          >
            {isLogsLoading ? (
              <div className="drawer-loading">
                <Spin /> 加载日志中...
              </div>
            ) : logs.length > 0 ? (
              logs.map((log) => (
                <div 
                  key={log.id} 
                  className={`log-entry ${log.is_error ? 'error' : 'success'}`}
                >
                  <div className="timestamp">{new Date(log.created_at).toLocaleString()}</div>
                  <div className="message">{log.message}</div>
                </div>
              ))
            ) : (
              <Alert message="没有找到日志记录" type="info" showIcon />
            )}
          </Drawer>
        </>
      )}
    </div>
  );
};

export default VisaDataManager;
