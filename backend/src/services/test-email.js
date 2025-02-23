require('dotenv').config();
const notificationService = require('../services/emailService');

async function testNotifications() {
  try {
    console.log('Testing PTW Approval notification...');
    await notificationService.sendNotification(
      'mikebuulu@gmail.com',
      'permitToWorkApproved',
      {
        permitId: 'PTW-001',
        jobPermitId: 'JP-001',
        status: 'Approved',
        updatedBy: 'Test User',
        department: 'IT',
        location: 'Main Office',
        comments: 'Approved after safety inspection'
      }
    );

    console.log('Testing PTW Completion notification...');
    await notificationService.sendNotification(
      'test@example.com',
      'permitToWorkCompleted',
      {
        permitId: 'PTW-001',
        completedBy: 'Test User',
        stage: 'ISS',
        remarks: 'Work completed successfully'
      }
    );

    console.log('Testing Revocation notification...');
    await notificationService.sendNotification(
      'test@example.com',
      'permitRevoked',
      {
        permitId: 'PTW-001',
        permitType: 'Permit to Work',
        status: 'Revoked',
        approvedBy: 'Test User',
        comments: 'Safety concerns identified',
        permitUrlPath: 'permits/ptw'
      }
    );

    console.log('All test notifications sent successfully');
  } catch (error) {
    console.error('Error testing notifications:', error);
  }
}

testNotifications();