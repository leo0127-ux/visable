import supabase from './supabaseClient';

const insertJobs = async (jobs) => {
  try {
    const { data, error } = await supabase.from('jobs').upsert(jobs, {
      onConflict: 'job_id', // 防止重複插入相同的 job_id
    });

    if (error) {
      console.error('Error inserting jobs:', error);
    } else {
      console.log('Jobs inserted successfully:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
};

export default insertJobs;
