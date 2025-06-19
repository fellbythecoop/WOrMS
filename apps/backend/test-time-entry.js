const axios = require('axios');

async function testTimeEntryEndpoint() {
  try {
    // First, get a list of work orders to get a valid ID
    console.log('Testing work orders endpoint...');
    const workOrdersResponse = await axios.get('http://localhost:3001/api/work-orders');
    console.log('Work orders response status:', workOrdersResponse.status);
    
    // Get users to see available technician IDs
    console.log('\nGetting users...');
    const usersResponse = await axios.get('http://localhost:3001/api/users');
    console.log('Users response status:', usersResponse.status);
    console.log('Available users:');
    usersResponse.data.forEach(user => {
      console.log(`- ID: ${user.id}, Name: ${user.firstName} ${user.lastName}, Role: ${user.role}, Email: ${user.email}`);
    });
    
    // Get customers and check their rates
    console.log('\nGetting customers...');
    const customersResponse = await axios.get('http://localhost:3001/api/customers');
    console.log('Customers response status:', customersResponse.status);
    console.log('Available customers:');
    customersResponse.data.forEach(customer => {
      console.log(`- ID: ${customer.id}, Name: ${customer.name}, Rates: Travel=${customer.travelTimeRate}, Straight=${customer.straightTimeRate}, Overtime=${customer.overtimeRate}, Double=${customer.doubleTimeRate}`);
    });
    
    // Seed a customer with proper rates if none exist
    if (customersResponse.data.length === 0) {
      console.log('\nSeeding customers...');
      await axios.post('http://localhost:3001/api/customers/seed');
      console.log('Customers seeded successfully');
    }
    
    // Update the first customer with proper rates if they don't have them
    if (customersResponse.data.length > 0) {
      const firstCustomer = customersResponse.data[0];
      if (!firstCustomer.straightTimeRate || firstCustomer.straightTimeRate === 0) {
        console.log('\nUpdating customer rates...');
        await axios.put(`http://localhost:3001/api/customers/${firstCustomer.id}`, {
          ...firstCustomer,
          travelTimeRate: 25.00,
          straightTimeRate: 50.00,
          overtimeRate: 75.00,
          doubleTimeRate: 100.00,
        });
        console.log('Customer rates updated successfully');
      }
    }
    
    if (workOrdersResponse.data && workOrdersResponse.data.length > 0) {
      const workOrderId = workOrdersResponse.data[0].id;
      console.log('\nUsing work order ID:', workOrderId);
      
      // Find a technician user
      const technician = usersResponse.data.find(user => user.role === 'technician');
      if (!technician) {
        console.log('No technician found in users list');
        return;
      }
      
      console.log('Using technician ID:', technician.id);
      
      // Test the time entries GET endpoint
      console.log('\nTesting GET time entries endpoint...');
      const getTimeEntriesResponse = await axios.get(`http://localhost:3001/api/work-orders/${workOrderId}/time-entries`);
      console.log('GET time entries response status:', getTimeEntriesResponse.status);
      console.log('Time entries:', getTimeEntriesResponse.data);
      
      // Test the time entries POST endpoint
      console.log('\nTesting POST time entries endpoint...');
      const postTimeEntryResponse = await axios.post(`http://localhost:3001/api/work-orders/${workOrderId}/time-entries`, {
        timeEntryType: 'straight_time',
        hours: 2.5,
        description: 'Test time entry',
        date: new Date().toISOString(),
        technicianId: technician.id, // Use the actual technician ID
      });
      console.log('POST time entry response status:', postTimeEntryResponse.status);
      console.log('Created time entry:', postTimeEntryResponse.data);
      
    } else {
      console.log('No work orders found');
    }
    
  } catch (error) {
    console.error('Error details:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Data:', error.response.data);
      console.error('URL:', error.config.url);
      console.error('Method:', error.config.method);
      console.error('Headers:', error.config.headers);
    } else if (error.request) {
      console.error('Request error:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
  }
}

testTimeEntryEndpoint(); 