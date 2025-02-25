const nodemailer = require('nodemailer');
const { poolPromise, sql } = require('../db');
require('dotenv').config();

class NotificationService {
  constructor() {
    // Debug log for environment variables
    if (!process.env.EMAIL_HOST && !process.env.EMAIL_SERVICE) {
      console.error('EMAIL_HOST or EMAIL_SERVICE environment variable not found. Make sure .env file is loaded.');
    }

    // Log configuration with redaction of sensitive values
    console.log('Email Config:', {
      NODE_ENV: process.env.NODE_ENV,
      EMAIL_SERVICE: process.env.EMAIL_SERVICE,
      EMAIL_HOST: process.env.EMAIL_HOST,
      EMAIL_PORT: process.env.EMAIL_PORT,
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_SECURE: process.env.EMAIL_SECURE === 'true',
      CREDENTIALS_PRESENT: Boolean(process.env.EMAIL_USER && (process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD))
    });

    // Configure transporter based on environment
    if (process.env.NODE_ENV === 'development') {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
        port: parseInt(process.env.EMAIL_PORT, 10) || 2525,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        debug: true
      });
    } else {
      this.transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD
        }
      });
    }

    // Verify transporter immediately
    this.verifyTransporter();

    // Updated color mapping
    this.statusColors = {
      'Approved': '#28a745',  // Green
      'Rejected': '#dc3545',  // Red
      'Pending': '#ffc107',   // Yellow
      'Completed': '#17a2b8'  // Blue
    };

    // Email templates
    this.templates = {
      permitCreated: {
        subject: 'New Job Permit Documentation Submitted - JP-#{permitId}',
        html: `
           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">New Job Permit Documentation Submitted</h2>
            <div style="padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
              <p><strong>Permit ID:</strong> JP-#{permitId}</p>
              <p><strong>Submitted By:</strong> #{createdBy}</p>
              <p><strong>Department:</strong> #{department}</p>
              <p><strong>Location:</strong> #{location}</p>
              <p><strong>Work Description:</strong> #{workDescription}</p>
              <p><strong>Start Date:</strong> #{startDate}</p>
              <p><strong>End Date:</strong> #{endDate}</p>
              <p><strong>Current Stage:</strong> Awaiting #{assignedTo} Review</p>
              <div style="margin-top: 20px;">
                <a href="#{frontendUrl}/permits/#{permitId}" 
                   style="background-color: #007bff; color: white; padding: 10px 20px; 
                          text-decoration: none; border-radius: 5px;">
                  View Documentation Details
                </a>
              </div>
            </div>
          </div>
        `
      },
      permitStatusUpdate: {
        subject: 'Job Permit Documentation Updated - JP-#{permitId}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Job Permit Documentation Update</h2>
            <div style="padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
              <p><strong>Permit ID:</strong> JP-#{permitId}</p>
              <p><strong>Current Status:</strong> <span style="color: #{statusColor};">#{displayStatus}</span></p>
              <p><strong>Last Updated By:</strong> #{updatedBy} (#{userRole}) of #{departmentName} Department</p>
              #{nextStageInfo}
              <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 5px;">
                <p><strong>Next Steps:</strong></p>
                #{nextStepsMessage}
              </div>
              <div style="margin-top: 20px;">
                #{actionButton}
              </div>
            </div>
          </div>
        `
      },
      permitToWorkCreated: {
        subject: 'New Permit to Work Submitted - PTW-#{permitId}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">New Permit to Work Submitted</h2>
            <div style="padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
              <p><strong>Permit to Work ID:</strong> PTW-#{permitId}</p>
              <p><strong>Related Job Permit:</strong> JP-#{jobPermitId}</p>
              <p><strong>Permit Receiver:</strong> #{permitReceiver}</p>
              <p><strong>Location:</strong> #{location}</p>
              <p><strong>Work Duration:</strong> #{workDuration} days (from #{formattedStartDate} to #{formattedEndDate})</p>
              <p><strong>Current Stage:</strong> Awaiting #{assignedTo} Review</p>
              <div style="margin-top: 20px;">
                #{actionButton}
              </div>
            </div>
          </div>
        `
      },
      permitToWorkStatusUpdate: {
        subject: 'Permit to Work Status Updated - PTW-#{permitId}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Permit to Work Status Update</h2>
            <div style="padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
              <p><strong>Permit to Work ID:</strong> PTW-#{permitId}</p>
              <p><strong>Related Job Permit:</strong> JP-#{jobPermitId}</p>
              <p><strong>Current Status:</strong> <span style="color: #{statusColor};">#{displayStatus}</span></p>
              <p><strong>Last Updated By:</strong> #{updatedBy} (#{userRole}) of #{departmentName} Department</p>
              #{nextStageInfo}
              #{commentsSection}
              <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 5px;">
                <p><strong>Next Steps:</strong></p>
                #{nextStepsMessage}
              </div>
              <div style="margin-top: 20px;">
                #{actionButton}
              </div>
            </div>
          </div>
        `
      },
      permitToWorkCompleted: {
        subject: 'Permit to Work Completed - #{permitId}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">Work Completion Update</h2>
            <div style="padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
              <p><strong>Permit to Work ID:</strong> #{permitId}</p>
              <p><strong>Completed By:</strong> #{completedBy} (#{userRole})</p>
              <p><strong>Stage:</strong> #{stage}</p>
              #{remarksSection}
              <div style="margin-top: 20px;">
                <a href="#{frontendUrl}/permits/ptw/#{permitId}" 
                   style="background-color: #007bff; color: white; padding: 10px 20px; 
                          text-decoration: none; border-radius: 5px;">
                  View Completion Details
                </a>
              </div>
            </div>
          </div>
        `
      },
      permitRevoked: {
        subject: 'Permit Revocation #{status} - #{permitId}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">Permit Revocation Notice</h2>
            <div style="padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
              <p><strong>Permit ID:</strong> #{permitId}</p>
              <p><strong>Permit Type:</strong> #{permitType}</p>
              <p><strong>Status:</strong> <span style="color: #dc3545;">#{status}</span></p>
              <p><strong>Approved By:</strong> #{approvedBy} (#{userRole})</p>
              #{commentsSection}
              <div style="margin-top: 20px;">
                <a href="#{frontendUrl}/permits/#{permitUrlPath}/#{permitId}" 
                   style="background-color: #007bff; color: white; padding: 10px 20px; 
                          text-decoration: none; border-radius: 5px;">
                  View Permit Details
                </a>
              </div>
            </div>
          </div>
        `
      }
    };
  }

  async verifyTransporter() {
    try {
      const verification = await this.transporter.verify();
      console.log('Transporter verification successful:', verification);
    } catch (error) {
      console.error('Transporter verification failed:', error);
    }
  }

  async getUsersToNotify({ department, permitType, createdByEmail }) {
  try {
    const pool = await poolPromise;
    const transaction = await pool.transaction();
    await transaction.begin();

    // Get department name for display
    const deptQuery = `
      SELECT DepartmentName 
      FROM Departments 
      WHERE DepartmentID = @department
    `;

    const deptResult = await transaction.request()
      .input('department', sql.VarChar(50), department)
      .query(deptQuery);

    const departmentName = deptResult.recordset[0]?.DepartmentName;

    // Modified query to include both approvers and creator
    const query = `
      SELECT DISTINCT 
        u.Email,
        u.RoleID,
        u.FirstName + ' ' + u.LastName as FullName,
        u.DepartmentID,
        d.DepartmentName,
        CASE 
          WHEN u.Email = @createdByEmail THEN 'Creator'
          ELSE u.RoleID
        END as UserType
      FROM Users u
      LEFT JOIN Departments d ON u.DepartmentID = d.DepartmentID
      WHERE (
        (u.DepartmentID = @department AND u.RoleID IN ('ISS', 'HOD'))
        OR (u.RoleID = 'QA')
        OR (u.Email = @createdByEmail)
      )
      AND u.Email IS NOT NULL
    `;

    const result = await transaction.request()
      .input('department', sql.VarChar(50), department)
      .input('createdByEmail', sql.VarChar(100), createdByEmail)
      .query(query);

    await transaction.commit();

    //// Process department names
    return result.recordset.map(user => ({
      ...user,
      DepartmentName: this.getDepartmentFullName(user.DepartmentID)
    }));
  } catch (error) {
    console.error('Error getting users to notify:', error);
    return [];
  }
}

getDepartmentFullName(deptId) {
  const deptMap = {
    'ASM': 'Asset Maintenance',
    'OPS': 'Operations',
    'IT': 'IT',
    'QHSSE': 'QHSSE'
  };
  return deptMap[deptId] || deptId;
}

async handleStatusUpdate(permitId, status, user, comments) {
  try {
    const pool = await poolPromise;
    
    const userQuery = `
      SELECT 
        u.FirstName + ' ' + u.LastName as FullName,
        u.Email,
        u.RoleID,
        d.DepartmentName,
        d.DepartmentID
      FROM Users u
      LEFT JOIN Departments d ON u.DepartmentID = d.DepartmentID
      WHERE u.UserID = @userId
    `;

    const userResult = await pool.request()
      .input('userId', sql.Int, user.userId)
      .query(userQuery);

    const userDetails = userResult.recordset[0];

    if (!userDetails) {
      // Fallback to provided user data if database lookup fails
      return {
        permitId,
        status,
        updatedBy: user.name || 'Unknown User',
        userRole: user.role,
        departmentName: this.getDepartmentFullName(user.departmentId),
        comments,
        assignedTo: user.role
      };
    }

    return {
      permitId,
      status,
      updatedBy: userDetails.FullName,
      userRole: userDetails.RoleID,
      departmentName: this.getDepartmentFullName(userDetails.DepartmentID),
      comments,
      assignedTo: userDetails.RoleID
    };
  } catch (error) {
    console.error('Error in handleStatusUpdate:', error);
    // Fallback to provided user data if there's an error
    return {
      permitId,
      status,
      updatedBy: user.name || 'Unknown User',
      userRole: user.role,
      departmentName: this.getDepartmentFullName(user.departmentId),
      comments,
      assignedTo: user.role
    };
  }
}

// Add a helper method to format dates
formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
}

getStatusColor(status, assignedTo) {
  // Check if status is Approved but not final approval
  if (status === 'Approved' && assignedTo !== 'QA') {
    return this.statusColors['Pending']; // Return yellow for pending
  }
  return this.statusColors[status] || '#6c757d';
}

getDisplayStatus(status, assignedTo) {
  // For QA approvals, show as Approved instead of Pending
  if (status === 'Approved' && assignedTo === 'QA') {
    return 'Approved';
  }
  if (status === 'Approved' && assignedTo !== 'QA') {
    return 'Pending';
  }
  return status;
}

getNextStageMessage(status, assignedTo, isJobPermit = true) {
  if (status === 'Approved') {
    if (isJobPermit) {
      if (assignedTo === 'QA') {
        return `<p style="color: #28a745;"><strong>Next Stage:</strong> Job Permit Documentation fully approved - Please proceed to request a Permit to Work</p>`;
      } else if (assignedTo === 'ISS') {
        return `<p><strong>Next Stage:</strong> Awaiting HOD Review of Job Permit Documentation</p>`;
      } else if (assignedTo === 'HOD') {
        return `<p><strong>Next Stage:</strong> Awaiting QHSSE Review of Job Permit Documentation</p>`;
      }
    } else {
      // Permit to Work specific messages
      if (assignedTo === 'QA') {
        return `<p style="color: #28a745;"><strong>Next Stage:</strong> Permit to Work fully approved - Work can commence</p>`;
      } else if (assignedTo === 'ISS') {
        return `<p><strong>Next Stage:</strong> Awaiting HOD Review of Permit to Work</p>`;
      } else if (assignedTo === 'HOD') {
        return `<p><strong>Next Stage:</strong> Awaiting QHSSE Review of Permit to Work</p>`;
      }
    }
  }
  return '';
}

getNextStepsMessage(status, assignedTo, isJobPermit = true) {
  if (status === 'Approved') {
    if (isJobPermit) {
      if (assignedTo === 'QA') {
        return `<p>Your Job Permit Documentation has been fully approved by QHSSE. You must now submit a Permit to Work request to begin the work phase.</p>`;
      } else if (assignedTo === 'ISS') {
        return `<p>Your Job Permit Documentation is now under review by HOD (Head of Department). You will be notified once they complete their review.</p>`;
      } else if (assignedTo === 'HOD') {
        return `<p>Your Job Permit Documentation is now under review by QHSSE. You will be notified once they complete their review.</p>`;
      }
    } else {
      if (assignedTo === 'QA') {
        return `<p>Your Permit to Work has been fully approved. Work can now commence following all safety protocols.</p>`;
      } else if (assignedTo === 'ISS') {
        return `<p>Your Permit to Work is now under review by HOD. You will be notified of any updates.</p>`;
      } else if (assignedTo === 'HOD') {
        return `<p>Your Permit to Work is now under review by QHSSE. You will be notified of any updates.</p>`;
      }
    }
  } else if (status === 'Rejected') {
    return isJobPermit
      ? `<p>Your Job Permit Documentation requires revision. Please review the comments above and make the necessary corrections before resubmitting.</p>`
      : `<p>Your Permit to Work requires revision. Please review the comments above and make the necessary corrections before resubmitting.</p>`;
  }
  return '';
}

  getActionButton(status, assignedTo, permitId, isJobPermit = true) {
    if (status === 'Approved' && assignedTo === 'QA' && isJobPermit) {
      return `
        <a href="#{frontendUrl}/permits/ptw/new?jobPermitId=${permitId}" 
           style="background-color: #28a745; color: white; padding: 10px 20px; 
                  text-decoration: none; border-radius: 5px;">
          Request Permit to Work
        </a>
      `;
    }
    return `
      <a href="#{frontendUrl}/permits/${isJobPermit ? '' : 'ptw/'}${permitId}" 
         style="background-color: #007bff; color: white; padding: 10px 20px; 
                text-decoration: none; border-radius: 5px;">
        View Details
      </a>
    `;
  }

  processTemplate(template, data) {
    let processed = template;
    // Special handling for department name
  if (data.departmentName) {
    const deptMap = {
      'ASM': 'Asset Maintenance',
      'OPS': 'Operations',
      'IT': 'IT',
      'QHSSE': 'QHSSE'
    };
    data.departmentName = deptMap[data.departmentName] || data.departmentName;
  }

  for (const [key, value] of Object.entries(data)) {
    processed = processed.replace(new RegExp(`#{${key}}`, 'g'), value || '');
  }
  return processed;
}


  async sendNotification(recipients, template, data) {
    try {
      if (!recipients || (Array.isArray(recipients) && recipients.length === 0)) {
        console.warn('No recipients to send notification to');
        return null;
      }

      const emailAddresses = Array.isArray(recipients) && typeof recipients[0] === 'object' && recipients[0].Email 
        ? recipients.map(user => user.Email) 
        : recipients;

        const commonData = {
          ...data,
          frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
          statusColor: this.getStatusColor(data.status, data.assignedTo),
          displayStatus: this.getDisplayStatus(data.status, data.assignedTo),
          commentsSection: data.comments ? `<p><strong>Comments:</strong> ${data.comments}</p>` : '',
          // Fix 1: Pass correct permitType for Job Permit Documentation
          nextStepsMessage: this.getNextStepsMessage(
            data.status, 
            data.assignedTo, 
            data.permitType === 'JobPermit' || template === 'permitStatusUpdate'
          ),
          nextStageInfo: this.getNextStageMessage(
            data.status, 
            data.assignedTo, 
            data.permitType === 'JobPermit' || template === 'permitStatusUpdate'
          ),
          actionButton: this.getActionButton(
            data.status, 
            data.assignedTo, 
            data.permitId, 
            data.permitType === 'JobPermit' || template === 'permitStatusUpdate'
          )
        };

      const emailContent = {
        subject: this.processTemplate(this.templates[template].subject, { ...data, ...commonData }),
        html: this.processTemplate(this.templates[template].html, { ...data, ...commonData })
      };

      const mailOptions = {
        from: `"Permit System" <${process.env.EMAIL_USER}>`,
        to: Array.isArray(emailAddresses) ? emailAddresses.join(',') : emailAddresses,
        subject: emailContent.subject,
        html: emailContent.html
      };

      console.log('Sending email to:', mailOptions.to);
      console.log('Email subject:', mailOptions.subject);

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Notification sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending notification:', error.message);
      console.error('Error details:', error);
      throw error;
    }
  }

  async handlePermitCreated(permitData, transaction = null) {
    try {
      console.log('Handling permit created notification for permit ID:', permitData.permitId);

      // Get users to notify
      const usersToNotify = await this.getUsersToNotify(permitData, transaction);
      
      if (usersToNotify.length === 0) {
        console.log('No users to notify for permit creation');
        return;
      }

      // Get just the email addresses
      const emailAddresses = usersToNotify.map(user => user.Email);
      console.log('Sending notifications to:', emailAddresses);
      
      // Send notifications to relevant users
      await this.sendNotification(
        emailAddresses,
        'permitCreated',
        {
          permitId: permitData.permitId,
          createdBy: permitData.createdBy || 'System User',
          department: permitData.department,
          location: permitData.location,
          workDescription: permitData.workDescription,
          startDate: permitData.startDate,
          endDate: permitData.endDate
        }
      );
    } catch (error) {
      console.error('Error handling permit creation notification:', error);
      // Don't throw error to prevent blocking permit creation
    }
  }

  async handlePermitToWorkCreated(permitData) {
    try {
      const usersToNotify = await this.getUsersToNotify({
        department: permitData.department,
        permitType: 'PermitToWork',
        createdByEmail: permitData.createdByEmail
      });
  
      if (!usersToNotify.length) {
        console.log('No users to notify for permit to work creation');
        return;
      }
  
      // Get permit details from the database
      const pool = await poolPromise;
      const permitQuery = `
        SELECT 
          p.*,
          jp.PermitReceiver,
          jp.JobLocation,
          jp.SubLocation
        FROM PermitToWork p
        JOIN JobPermits jp ON p.JobPermitID = jp.JobPermitID
        WHERE p.PermitToWorkID = @permitId
      `;
  
      let permitDetails = null;
      try {
        const permitResult = await pool.request()
          .input('permitId', sql.Int, permitData.permitId)
          .query(permitQuery);
  
        permitDetails = permitResult.recordset[0];
      } catch (dbError) {
        console.error('Database error fetching permit details:', dbError);
        // Continue with notification even if we can't get additional details
      }
  
      // Format dates for display
      const formattedStartDate = new Date(permitData.startDate).toLocaleDateString();
      const formattedEndDate = new Date(permitData.endDate).toLocaleDateString();
  
      // Prepare notification data with fallbacks for missing information
      const notificationData = {
        permitId: permitData.permitId,
        jobPermitId: permitData.jobPermitId,
        createdBy: permitData.createdBy || 'System User',
        permitReceiver: permitDetails?.PermitReceiver || 'Not specified',
        department: this.getDepartmentFullName(permitData.department),
        location: permitDetails 
          ? `${permitDetails.JobLocation || ''} ${permitDetails.SubLocation ? `- ${permitDetails.SubLocation}` : ''}`
          : permitData.location || 'Not specified',
        workDuration: permitData.workDuration,
        formattedStartDate: formattedStartDate,
        formattedEndDate: formattedEndDate,
        assignedTo: 'ISS',
        permitType: 'PermitToWork'
      };
  
      await this.sendNotification(
        usersToNotify,
        'permitToWorkCreated',
        notificationData
      );
  
    } catch (error) {
      console.error('Error handling permit to work creation notification:', error);
      // Log detailed error information for debugging
      console.error('Permit data:', permitData);
      throw error; // Re-throw the error to be handled by the caller
    }
  }
}

module.exports = new NotificationService();