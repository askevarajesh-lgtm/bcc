const axios = require('axios');
async function test() {
  try {
    const res = await axios.post('http://127.0.0.1:5500/api/expenses', {
      expenseType: 'fixed',
      category: 'rent',
      amount: 150,
      date: '2026-07-29'
    }, {
      headers: {
        'x-workspace-id': '60d0fe4f5311236168a10000',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MGQwZmU0ZjUzMTEyMzYxNjhhMjAwMDAiLCJyb2xlIjoiYWdlbmN5X21hbmFnZXIiLCJhZ2VuY3lJZCI6IjYwZDBmZTRmNTMxMTIzNjE2OGExMDAwMCIsImlhdCI6MTc4NTMyNTQ0M30.EILlICr-vLcjBlzQzxGZKdiiTCVT6RdbyTLi4YCDvCc'
      }
    });
    console.log(res.data);
  } catch (err) {
    if (err.response) {
      console.log(err.response.data);
    } else {
      console.error(err);
    }
  }
}
test();
