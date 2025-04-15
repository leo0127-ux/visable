import { fetchAllData, isUpdateTime } from './fetchVisaData.js';

// Function for serverless function or cron job
export async function handler(event, context) {
  // Check if it's update time or if we're forcing an update
  const forceUpdate = event?.queryStringParameters?.force === 'true';
  
  if (forceUpdate || isUpdateTime()) {
    try {
      const success = await fetchAllData();
      
      return {
        statusCode: success ? 200 : 500,
        body: JSON.stringify({
          message: success ? 'Visa data updated successfully' : 'Visa data update failed'
        })
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: `Error updating visa data: ${error.message}`
        })
      };
    }
  } else {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Not update time, skipping data fetch'
      })
    };
  }
}

// For local testing
if (require.main === module) {
  handler({ queryStringParameters: { force: 'true' } }, {})
    .then(response => {
      console.log(JSON.stringify(response, null, 2));
    })
    .catch(error => {
      console.error('Error:', error);
    });
}
