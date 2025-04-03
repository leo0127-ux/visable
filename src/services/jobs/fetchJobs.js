import supabase from "../supabase/supabaseClient.js";
import dotenv from "dotenv";

// 加載 .env 文件中的環境變量
dotenv.config();

const fetchJobsFromAPI = async () => {
  const url =
    "https://indeed12.p.rapidapi.com/jobs/search?query=manager&location=chicago&page_id=1&locality=us&fromage=1&radius=50&sort=date&job_type=permanent";
  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-key": "d19460ceb3msh610f803a760ca5cp17fb7ejsna8c5636b24e0",
      "x-rapidapi-host": "indeed12.p.rapidapi.com",
    },
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json(); // 確保解析為 JSON
    console.log("Fetched jobs from API:", result);

    // 將職缺數據存儲到 Supabase
    const jobs = result.jobs.map((job) => ({
      title: job.title,
      company: job.company_name,
      location: job.location,
      created_at: new Date(job.posted_date).toISOString(),
      salary_min: job.salary_min || null,
      salary_max: job.salary_max || null,
    }));

    const { data, error } = await supabase.from("jobs").insert(jobs);

    if (error) {
      console.error("Error inserting jobs into Supabase:", error);
    } else {
      console.log("Jobs successfully inserted into Supabase:", data);
    }
  } catch (error) {
    console.error("Error fetching jobs from API:", error);
  }

  console.log("Supabase Key:", process.env.VITE_SUPABASE_KEY);
};

export default fetchJobsFromAPI;