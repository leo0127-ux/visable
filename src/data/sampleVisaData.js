/**
 * 示例簽證數據 - 用於展示目的
 */

export const sampleVisaData = {
  h1b_approvals: [
    {
      id: "1",
      employer_name: "Google LLC",
      job_title: "軟件工程師",
      worksite_location: "Mountain View, CA",
      fiscal_year: "2023",
      wage: 150000,
      case_status: "Approved",
      created_at: "2023-05-10T12:00:00Z"
    },
    {
      id: "2",
      employer_name: "Microsoft Corporation",
      job_title: "高級軟件工程師",
      worksite_location: "Redmond, WA",
      fiscal_year: "2023",
      wage: 160000,
      case_status: "Approved",
      created_at: "2023-05-11T12:00:00Z"
    },
    {
      id: "3",
      employer_name: "Amazon.com Services LLC",
      job_title: "數據科學家",
      worksite_location: "Seattle, WA",
      fiscal_year: "2023",
      wage: 155000,
      case_status: "Approved",
      created_at: "2023-05-12T12:00:00Z"
    },
    {
      id: "4",
      employer_name: "Apple Inc.",
      job_title: "機器學習工程師",
      worksite_location: "Cupertino, CA",
      fiscal_year: "2023",
      wage: 180000,
      case_status: "Approved",
      created_at: "2023-05-13T12:00:00Z"
    },
    {
      id: "5",
      employer_name: "Facebook Inc.",
      job_title: "產品經理",
      worksite_location: "Menlo Park, CA",
      fiscal_year: "2023",
      wage: 170000,
      case_status: "Approved",
      created_at: "2023-05-14T12:00:00Z"
    },
    {
      id: "6",
      employer_name: "Intel Corporation",
      job_title: "硬件工程師",
      worksite_location: "Santa Clara, CA",
      fiscal_year: "2023",
      wage: 145000,
      case_status: "Approved",
      created_at: "2023-05-15T12:00:00Z"
    },
    {
      id: "7",
      employer_name: "IBM Corporation",
      job_title: "雲計算架構師",
      worksite_location: "Armonk, NY",
      fiscal_year: "2023",
      wage: 155000,
      case_status: "Approved",
      created_at: "2023-05-16T12:00:00Z"
    },
    {
      id: "8",
      employer_name: "Salesforce.com Inc",
      job_title: "技術顧問",
      worksite_location: "San Francisco, CA",
      fiscal_year: "2023",
      wage: 140000,
      case_status: "Approved",
      created_at: "2023-05-17T12:00:00Z"
    },
    {
      id: "9",
      employer_name: "Adobe Inc.",
      job_title: "UX 設計師",
      worksite_location: "San Jose, CA",
      fiscal_year: "2023",
      wage: 135000,
      case_status: "Approved",
      created_at: "2023-05-18T12:00:00Z"
    },
    {
      id: "10",
      employer_name: "Oracle Corporation",
      job_title: "數據庫管理員",
      worksite_location: "Redwood City, CA",
      fiscal_year: "2023",
      wage: 138000,
      case_status: "Approved",
      created_at: "2023-05-19T12:00:00Z"
    }
  ],

  h1b_denials: [
    {
      id: "1",
      employer_name: "Google LLC",
      job_title: "軟件開發人員",
      worksite_location: "Tampa, FL",
      fiscal_year: "2023",
      denial_reason: "Position does not meet specialty occupation criteria",
      case_status: "Denied",
      created_at: "2023-05-10T12:00:00Z"
    },
    {
      id: "2",
      employer_name: "Microsoft Corporation",
      job_title: "市場分析師",
      worksite_location: "Charlotte, NC",
      fiscal_year: "2023",
      denial_reason: "Employer failed to establish employer-employee relationship",
      case_status: "Denied",
      created_at: "2023-05-11T12:00:00Z"
    },
    {
      id: "3",
      employer_name: "Amazon.com Services LLC",
      job_title: "IT 顧問",
      worksite_location: "Raleigh, NC",
      fiscal_year: "2023",
      denial_reason: "Beneficiary lacks required degree in specialized field",
      case_status: "Denied",
      created_at: "2023-05-12T12:00:00Z"
    },
    {
      id: "4",
      employer_name: "Facebook Inc.",
      job_title: "營運經理",
      worksite_location: "Chicago, IL",
      fiscal_year: "2023",
      denial_reason: "Position does not normally require bachelor's degree",
      case_status: "Denied",
      created_at: "2023-05-13T12:00:00Z"
    },
    {
      id: "5",
      employer_name: "Apple Inc.",
      job_title: "健康服務經理",
      worksite_location: "Houston, TX",
      fiscal_year: "2023",
      denial_reason: "Insufficient evidence of specialty occupation",
      case_status: "Denied",
      created_at: "2023-05-14T12:00:00Z"
    }
  ],

  h1b_lca: [
    {
      id: "1",
      case_number: "I-123456789",
      employer_name: "Google LLC",
      job_title: "軟件工程師",
      worksite_location: "Mountain View, CA",
      wage: 145000,
      wage_unit: "year",
      submission_date: "2023-01-15",
      start_date: "2023-06-01",
      end_date: "2026-05-31",
      status: "Certified",
      created_at: "2023-02-01T12:00:00Z"
    },
    {
      id: "2",
      case_number: "I-987654321",
      employer_name: "Microsoft Corporation",
      job_title: "產品經理",
      worksite_location: "Redmond, WA",
      wage: 155000,
      wage_unit: "year",
      submission_date: "2023-01-20",
      start_date: "2023-06-15",
      end_date: "2026-06-14",
      status: "Certified",
      created_at: "2023-02-10T12:00:00Z"
    },
    {
      id: "3",
      case_number: "I-456789123",
      employer_name: "Amazon.com Services LLC",
      job_title: "業務智能分析師",
      worksite_location: "Seattle, WA",
      wage: 135000,
      wage_unit: "year",
      submission_date: "2023-01-25",
      start_date: "2023-07-01",
      end_date: "2026-06-30",
      status: "Certified",
      created_at: "2023-02-15T12:00:00Z"
    }
  ],

  perm: [
    {
      id: "1",
      case_number: "P-123456",
      employer_name: "Google LLC",
      job_title: "軟件工程師",
      worksite_location: "Mountain View, CA",
      wage: 145000,
      wage_unit: "year",
      filing_date: "2022-06-15",
      case_status: "Certified",
      decision_date: "2023-01-10",
      created_at: "2023-01-15T12:00:00Z"
    },
    {
      id: "2",
      case_number: "P-234567",
      employer_name: "Microsoft Corporation",
      job_title: "高級軟件工程師",
      worksite_location: "Redmond, WA",
      wage: 160000,
      wage_unit: "year",
      filing_date: "2022-07-01",
      case_status: "Certified",
      decision_date: "2023-01-25",
      created_at: "2023-01-30T12:00:00Z"
    },
    {
      id: "3",
      case_number: "P-345678",
      employer_name: "Amazon.com Services LLC",
      job_title: "數據科學家",
      worksite_location: "Seattle, WA",
      wage: 155000,
      wage_unit: "year",
      filing_date: "2022-07-15",
      case_status: "Certified",
      decision_date: "2023-02-10",
      created_at: "2023-02-15T12:00:00Z"
    }
  ],

  prevailing_wage: [
    {
      id: "1",
      job_title: "軟件工程師",
      area_of_employment: "San Francisco, CA",
      wage_level: "Level 1",
      prevailing_wage: 120000,
      wage_unit: "year",
      effective_date: "2023-01-01",
      expiration_date: "2023-12-31",
      created_at: "2022-12-15T12:00:00Z"
    },
    {
      id: "2",
      job_title: "軟件工程師",
      area_of_employment: "San Francisco, CA",
      wage_level: "Level 2",
      prevailing_wage: 145000,
      wage_unit: "year",
      effective_date: "2023-01-01",
      expiration_date: "2023-12-31",
      created_at: "2022-12-15T12:00:00Z"
    },
    {
      id: "3",
      job_title: "軟件工程師",
      area_of_employment: "San Francisco, CA",
      wage_level: "Level 3",
      prevailing_wage: 170000,
      wage_unit: "year",
      effective_date: "2023-01-01",
      expiration_date: "2023-12-31",
      created_at: "2022-12-15T12:00:00Z"
    }
  ]
};

export const sampleSummary = {
  totalH1BApprovals: 1285,
  totalH1BDenials: 274,
  approvalRate: 82.4,
  avgPrevailingWage: 149500,
  totalGreenCardApprovals: 512
};

export const sampleMetadata = {
  h1b_approvals: "2023-08-10T15:30:00Z",
  h1b_denials: "2023-08-10T15:30:00Z",
  h1b_lca: "2023-08-10T15:30:00Z",
  perm: "2023-08-10T15:30:00Z",
  prevailing_wage: "2023-08-10T15:30:00Z"
};

// 更新示例雇主数据，确保符合实际数据格式
const generateBetterEmployerData = () => {
  // 创建更加真实的雇主数据
  const topTechCompanies = [
    { name: "Google LLC", approved: 9480, denied: 920, total: 10400 },
    { name: "Microsoft Corporation", approved: 8750, denied: 850, total: 9600 },
    { name: "Amazon.com Services LLC", approved: 8200, denied: 1100, total: 9300 },
    { name: "Facebook Inc.", approved: 6200, denied: 580, total: 6780 },
    { name: "Apple Inc.", approved: 5800, denied: 420, total: 6220 },
    { name: "Intel Corporation", approved: 5300, denied: 390, total: 5690 },
    { name: "IBM Corporation", approved: 4800, denied: 700, total: 5500 },
    { name: "Tata Consultancy Services", approved: 3600, denied: 1200, total: 4800 },
    { name: "Wipro Limited", approved: 3450, denied: 1150, total: 4600 },
    { name: "Infosys Limited", approved: 3400, denied: 1100, total: 4500 },
    { name: "Cognizant Technology Solutions", approved: 3350, denied: 950, total: 4300 },
    { name: "Accenture LLP", approved: 3100, denied: 720, total: 3820 },
    { name: "Deloitte Consulting LLP", approved: 2950, denied: 750, total: 3700 },
    { name: "HCL America Inc.", approved: 2700, denied: 900, total: 3600 },
    { name: "Capgemini America Inc.", approved: 2450, denied: 850, total: 3300 },
    { name: "Oracle America Inc.", approved: 2400, denied: 600, total: 3000 },
    { name: "Cisco Systems Inc.", approved: 2300, denied: 500, total: 2800 },
    { name: "Goldman Sachs & Co. LLC", approved: 2050, denied: 350, total: 2400 },
    { name: "Salesforce.com Inc.", approved: 1950, denied: 300, total: 2250 },
    { name: "JPMorgan Chase & Co.", approved: 1900, denied: 320, total: 2220 }
  ];
  
  // 计算批准率
  return topTechCompanies.map(company => ({
    ...company,
    approvalRate: parseFloat(((company.approved / company.total) * 100).toFixed(1))
  }));
};

// 替换现有的示例数据
export const betterTopEmployerData = generateBetterEmployerData();

// 在文件末尾添加这个导出
export { betterTopEmployerData as topEmployerData };
