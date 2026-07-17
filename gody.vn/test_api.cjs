const axios = require('axios');

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:90/Project_DuLichMXH/public/api/auth/login', {
      email: 'test00002@gmail.com',
      password: '552005a'
    });
    const token = loginRes.data.data.token;
    console.log('Login successful:', token.substring(0, 20) + '...');
    
    // let's try to start chat with user ID 1
    const chatRes = await axios.post('http://localhost:90/Project_DuLichMXH/public/api/chats/start', {
      receiver_id: 1
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Chat start response:', chatRes.data);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

test();
