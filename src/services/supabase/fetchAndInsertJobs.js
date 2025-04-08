import insertJobs from './insertJobs';

const fetchAndInsertJobs = async () => {
  try {
    const response = await fetch(
      'https://api.scrapingdog.com/linkedinjobs?api_key=67f3f2a0e495cdffb22ae91b&field=linkedin&geoid=103051080&page=1&sortBy=week&jobType=full_time&expLevel=entry_level&workType=hybrid&filterByCompany='
    );
    const jobs = await response.json();

    // 格式化資料以匹配 Supabase 的 jobs 表結構
    const formattedJobs = jobs.map((job) => ({
      job_id: job.job_id,
      job_position: job.job_position,
      job_link: job.job_link,
      company_name: job.company_name,
      company_profile: job.company_profile,
      job_location: job.job_location,
      job_posting_date: job.job_posting_date,
      company_logo_url: job.company_logo_url,
    }));

    // 插入到 Supabase
    await insertJobs(formattedJobs);
  } catch (err) {
    console.error('Error fetching or inserting jobs:', err);
  }
};

// 定時任務：每 1 小時執行一次
setInterval(fetchAndInsertJobs, 60 * 60 * 1000); // 60 分鐘 * 60 秒 * 1000 毫秒

export default fetchAndInsertJobs;
