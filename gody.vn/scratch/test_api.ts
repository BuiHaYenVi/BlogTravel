import axios from 'axios';

const testApi = async () => {
  const baseURL = 'http://localhost:90/Project_DuLichMXH/public/api';
  console.log('Testing connection to:', baseURL);
  
  try {
    const res = await axios.get(`${baseURL}/locations`);
    console.log('SUCCESS: Connected to API!');
    console.log('Locations count:', res.data.data.length);
    console.log('First location:', res.data.data[0]?.name);
  } catch (error: any) {
    console.error('FAILED: Could not connect to API.');
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
};

testApi();
