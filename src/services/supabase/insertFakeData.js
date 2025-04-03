import supabase from './supabaseClient';

const insertFakeJobs = async () => {
  const { data, error } = await supabase.from('jobs').insert([
    {
      title: 'Full Stack Developer',
      company: 'Ubisoft',
      location: 'Remote',
      salary_min: 90000,
      salary_max: 130000,
      url: 'https://example.com/job7',
    },
    {
      title: 'Game Designer',
      company: 'Ubisoft',
      location: 'Montreal',
      salary_min: 75000,
      salary_max: 115000,
      url: 'https://example.com/job8',
    },
  ]);

  if (error) {
    console.error('Error inserting fake jobs:', error);
  } else {
    console.log('Fake jobs inserted:', data);
  }
};

insertFakeJobs();
