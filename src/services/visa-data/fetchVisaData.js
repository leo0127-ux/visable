import axios from 'axios';
import cheerio from 'cheerio';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const DATA_DIR = path.join(__dirname, 'data');
const LOG_DIR = path.join(__dirname, 'logs');
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Log messages to console and file
 */
function logMessage(message, isError = false) {
  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] ${message}`;
  
  console.log(logMsg);
  
  const logFile = path.join(
    LOG_DIR, 
    `visa_data_${new Date().toISOString().split('T')[0]}.log`
  );
  
  fs.appendFileSync(logFile, logMsg + '\n');
  
  if (isError) {
    const errorLogFile = path.join(LOG_DIR, 'errors.log');
    fs.appendFileSync(errorLogFile, logMsg + '\n');
  }
}

/**
 * Retry a function with exponential backoff
 */
async function withRetry(fn, maxRetries = MAX_RETRIES, delay = RETRY_DELAY) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        throw error;
      }
      
      logMessage(`Attempt ${retries} failed, retrying in ${delay / 1000} seconds...`, true);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff
      delay *= 2;
    }
  }
}

/**
 * Download file from URL
 */
async function downloadFile(url, destPath) {
  return withRetry(async () => {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });
    
    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(destPath);
      response.data.pipe(writer);
      
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  });
}

/**
 * Process CSV file and insert data into Supabase
 */
async function processCsvFile(filePath, tableName, mapFunction) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(mapFunction(data)))
      .on('end', async () => {
        try {
          // Process in batches of 1000
          const BATCH_SIZE = 1000;
          const batches = [];
          
          for (let i = 0; i < results.length; i += BATCH_SIZE) {
            batches.push(results.slice(i, i + BATCH_SIZE));
          }
          
          logMessage(`Processing ${results.length} records in ${batches.length} batches for ${tableName}`);
          
          let successCount = 0;
          
          for (let batch of batches) {
            const { error } = await supabase.from(tableName).insert(batch);
            
            if (error) {
              logMessage(`Error inserting batch into ${tableName}: ${error.message}`, true);
              throw error;
            }
            
            successCount += batch.length;
            logMessage(`Inserted ${successCount}/${results.length} records into ${tableName}`);
          }
          
          // Update metadata
          await supabase
            .from('visa_data_metadata')
            .update({
              last_updated: new Date().toISOString(),
              record_count: results.length,
              status: 'success'
            })
            .eq('table_name', tableName);
          
          resolve(results.length);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

/**
 * Update summary statistics
 */
async function updateSummaryStats() {
  try {
    // Get total H1B approvals
    const { data: approvals, error: appError } = await supabase
      .from('visa_h1b_approvals')
      .select('id', { count: 'exact', head: true });
      
    if (appError) throw appError;
    
    // Get total H1B denials
    const { data: denials, error: denError } = await supabase
      .from('visa_h1b_denials')
      .select('id', { count: 'exact', head: true });
      
    if (denError) throw denError;
    
    // Get average prevailing wage
    const { data: wageData, error: wageError } = await supabase
      .rpc('get_avg_prevailing_wage');
      
    if (wageError) throw wageError;
    
    // Get total PERM approvals
    const { data: permApprovals, error: permError } = await supabase
      .from('visa_perm')
      .select('id')
      .eq('case_status', 'Certified')
      .select('id', { count: 'exact', head: true });
      
    if (permError) throw permError;
    
    // Calculate approval rate
    const totalH1B = approvals.count + denials.count;
    const approvalRate = totalH1B > 0 ? (approvals.count / totalH1B) * 100 : 0;
    
    // Update summary table
    await supabase
      .from('visa_data_summary')
      .update({
        total_h1b_approvals: approvals.count,
        total_h1b_denials: denials.count,
        approval_rate: approvalRate,
        avg_prevailing_wage: wageData[0]?.avg_wage || 0,
        total_green_card_approvals: permApprovals.count,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1);
      
    logMessage('Successfully updated summary statistics');
  } catch (error) {
    logMessage(`Error updating summary statistics: ${error.message}`, true);
  }
}

/**
 * Fetch USCIS H1B Approvals data
 */
async function fetchH1BApprovals() {
  const url = 'https://www.uscis.gov/sites/default/files/document/data/h1b_datahubexport.csv';
  const filePath = path.join(DATA_DIR, 'h1b_approvals.csv');
  
  try {
    logMessage('Fetching H1B approvals data from USCIS...');
    
    await downloadFile(url, filePath);
    logMessage('Download complete, processing data...');
    
    // Clear existing data
    await supabase.from('visa_h1b_approvals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    const processedCount = await processCsvFile(filePath, 'visa_h1b_approvals', (data) => ({
      employer_name: data.Employer || 'Unknown',
      job_title: data['Job Title'] || 'Not Specified',
      worksite_location: data['Work Site City'] ? `${data['Work Site City']}, ${data['Work Site State']}` : 'Unknown',
      fiscal_year: data['Fiscal Year'] || null,
      wage: data['Initial Approval Amount'] ? parseFloat(data['Initial Approval Amount'].replace(/[$,]/g, '')) : null,
      case_status: data['Case Status'] || 'Approved'
    }));
    
    logMessage(`Successfully processed ${processedCount} H1B approvals`);
    return processedCount;
  } catch (error) {
    logMessage(`Error fetching H1B approvals: ${error.message}`, true);
    throw error;
  }
}

/**
 * Fetch USCIS H1B Denials data
 */
async function fetchH1BDenials() {
  const url = 'https://www.uscis.gov/sites/default/files/document/data/h1b_denied_datahubexport.csv';
  const filePath = path.join(DATA_DIR, 'h1b_denials.csv');
  
  try {
    logMessage('Fetching H1B denials data from USCIS...');
    
    await downloadFile(url, filePath);
    logMessage('Download complete, processing data...');
    
    // Clear existing data
    await supabase.from('visa_h1b_denials').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    const processedCount = await processCsvFile(filePath, 'visa_h1b_denials', (data) => ({
      employer_name: data.Employer || 'Unknown',
      job_title: data['Job Title'] || 'Not Specified',
      worksite_location: data['Work Site City'] ? `${data['Work Site City']}, ${data['Work Site State']}` : 'Unknown',
      fiscal_year: data['Fiscal Year'] || null,
      denial_reason: data['Denial Reason'] || 'Not Specified',
      case_status: 'Denied'
    }));
    
    logMessage(`Successfully processed ${processedCount} H1B denials`);
    return processedCount;
  } catch (error) {
    logMessage(`Error fetching H1B denials: ${error.message}`, true);
    throw error;
  }
}

/**
 * Fetch DOL H1B LCA data
 */
async function fetchH1BLCA() {
  const url = 'https://www.dol.gov/sites/dolgov/files/ETA/oflc/pdfs/LCA_Disclosure_Data_FY2022_Q4.xlsx';
  const filePath = path.join(DATA_DIR, 'h1b_lca.xlsx');
  
  try {
    logMessage('Fetching H1B LCA data from DOL...');
    
    await downloadFile(url, filePath);
    logMessage('Download complete, converting and processing data...');
    
    // Convert Excel to CSV using XLSX library
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const csvFilePath = path.join(DATA_DIR, 'h1b_lca.csv');
    
    XLSX.writeFile(
      workbook,
      csvFilePath,
      { bookType: 'csv' }
    );
    
    // Clear existing data
    await supabase.from('visa_h1b_lca').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    const processedCount = await processCsvFile(csvFilePath, 'visa_h1b_lca', (data) => ({
      case_number: data['CASE_NUMBER'] || null,
      employer_name: data['EMPLOYER_NAME'] || 'Unknown',
      job_title: data['JOB_TITLE'] || 'Not Specified',
      worksite_location: data['WORKSITE_CITY'] ? `${data['WORKSITE_CITY']}, ${data['WORKSITE_STATE']}` : 'Unknown',
      wage: data['WAGE_RATE'] ? parseFloat(data['WAGE_RATE'].replace(/[$,]/g, '')) : null,
      wage_unit: data['WAGE_UNIT_OF_PAY'] || null,
      submission_date: data['CASE_SUBMITTED'] ? new Date(data['CASE_SUBMITTED']).toISOString() : null,
      start_date: data['EMPLOYMENT_START_DATE'] ? new Date(data['EMPLOYMENT_START_DATE']).toISOString() : null,
      end_date: data['EMPLOYMENT_END_DATE'] ? new Date(data['EMPLOYMENT_END_DATE']).toISOString() : null,
      status: data['CASE_STATUS'] || null
    }));
    
    logMessage(`Successfully processed ${processedCount} H1B LCA records`);
    return processedCount;
  } catch (error) {
    logMessage(`Error fetching H1B LCA data: ${error.message}`, true);
    throw error;
  }
}

/**
 * Fetch DOL Green Card (PERM) data
 */
async function fetchPERM() {
  const url = 'https://www.dol.gov/sites/dolgov/files/ETA/oflc/pdfs/PERM_Disclosure_Data_FY2022_Q4.xlsx';
  const filePath = path.join(DATA_DIR, 'perm.xlsx');
  
  try {
    logMessage('Fetching PERM data from DOL...');
    
    await downloadFile(url, filePath);
    logMessage('Download complete, converting and processing data...');
    
    // Convert Excel to CSV
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const csvFilePath = path.join(DATA_DIR, 'perm.csv');
    
    XLSX.writeFile(
      workbook,
      csvFilePath,
      { bookType: 'csv' }
    );
    
    // Clear existing data
    await supabase.from('visa_perm').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    const processedCount = await processCsvFile(csvFilePath, 'visa_perm', (data) => ({
      case_number: data['CASE_NUMBER'] || null,
      employer_name: data['EMPLOYER_NAME'] || 'Unknown',
      job_title: data['JOB_TITLE'] || 'Not Specified',
      worksite_location: data['EMPLOYER_CITY'] ? `${data['EMPLOYER_CITY']}, ${data['EMPLOYER_STATE']}` : 'Unknown',
      wage: data['WAGE_OFFER'] ? parseFloat(data['WAGE_OFFER'].replace(/[$,]/g, '')) : null,
      wage_unit: data['WAGE_UNIT_OF_PAY'] || null,
      filing_date: data['CASE_RECEIVED_DATE'] ? new Date(data['CASE_RECEIVED_DATE']).toISOString() : null,
      case_status: data['CASE_STATUS'] || null,
      decision_date: data['DECISION_DATE'] ? new Date(data['DECISION_DATE']).toISOString() : null
    }));
    
    logMessage(`Successfully processed ${processedCount} PERM records`);
    return processedCount;
  } catch (error) {
    logMessage(`Error fetching PERM data: ${error.message}`, true);
    throw error;
  }
}

/**
 * Fetch DOL H1B Prevailing Wage data
 */
async function fetchPrevailingWage() {
  const url = 'https://www.flcdatacenter.com/download/H1BWageData.xlsx';
  const filePath = path.join(DATA_DIR, 'prevailing_wage.xlsx');
  
  try {
    logMessage('Fetching H1B Prevailing Wage data from FLCDataCenter...');
    
    await downloadFile(url, filePath);
    logMessage('Download complete, converting and processing data...');
    
    // Convert Excel to CSV
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const csvFilePath = path.join(DATA_DIR, 'prevailing_wage.csv');
    
    XLSX.writeFile(
      workbook,
      csvFilePath,
      { bookType: 'csv' }
    );
    
    // Clear existing data
    await supabase.from('visa_prevailing_wage').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    const processedCount = await processCsvFile(csvFilePath, 'visa_prevailing_wage', (data) => ({
      job_title: data['OCCUPATION_TITLE'] || 'Not Specified',
      area_of_employment: data['AREA_OF_EMPLOYMENT'] || 'Unknown',
      wage_level: data['WAGE_LEVEL'] || null,
      prevailing_wage: data['PREVAILING_WAGE'] ? parseFloat(data['PREVAILING_WAGE'].replace(/[$,]/g, '')) : null,
      wage_unit: data['WAGE_PER'] || null,
      effective_date: data['BEGIN_DATE'] ? new Date(data['BEGIN_DATE']).toISOString() : null,
      expiration_date: data['END_DATE'] ? new Date(data['END_DATE']).toISOString() : null
    }));
    
    logMessage(`Successfully processed ${processedCount} prevailing wage records`);
    return processedCount;
  } catch (error) {
    logMessage(`Error fetching prevailing wage data: ${error.message}`, true);
    throw error;
  }
}

/**
 * Main function to fetch all data
 */
async function fetchAllData() {
  const startTime = new Date();
  logMessage('Starting visa data fetch process...');
  
  try {
    // Fetch H1B Approvals
    await fetchH1BApprovals();
    
    // Fetch H1B Denials
    await fetchH1BDenials();
    
    // Fetch H1B LCA
    await fetchH1BLCA();
    
    // Fetch PERM
    await fetchPERM();
    
    // Fetch Prevailing Wage
    await fetchPrevailingWage();
    
    // Update summary statistics
    await updateSummaryStats();
    
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;
    logMessage(`Visa data fetch process completed successfully in ${duration} seconds`);
    
    return true;
  } catch (error) {
    logMessage(`Visa data fetch process failed: ${error.message}`, true);
    return false;
  }
}

// Create function to check if it's time to update
const isUpdateTime = () => {
  const now = new Date();
  // Update every Monday at 1 AM
  return now.getDay() === 1 && now.getHours() === 1;
};

// Export for serverless function use
export { fetchAllData, isUpdateTime };

// If this file is run directly (not imported)
if (require.main === module) {
  fetchAllData()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logMessage(`Unhandled error in main execution: ${error.message}`, true);
      process.exit(1);
    });
}
