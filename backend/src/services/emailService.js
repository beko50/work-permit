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
        debug: true,
        // Add these options to handle self-signed certificates
        tls: {
          rejectUnauthorized: false, // Allow self-signed certificates
          minVersion: 'TLSv1.2'
        }
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
              <p><strong>Submitted by:</strong> #{createdBy}</p>
              <p><strong>Contract Company:</strong> #{companyName}</p>
              <p><strong>Work is being done for:</strong> #{department} Department</p>
              <p><strong>Location:</strong> #{location}</p>
              <p><strong>Work Description:</strong> #{workDescription}</p>
              <p><strong>Duration:</strong> #{startDate} to #{endDate}</p>
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
              <p><strong>Main Job Permit Documentation:</strong> JP-#{jobPermitId}</p>
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
        subject: 'Permit to Work Updated - PTW-#{permitId}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Permit to Work Update</h2>
            <div style="padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
              <p><strong>Permit to Work ID:</strong> PTW-#{permitId}</p>
              <p><strong>Main Job Permit Documentation:</strong> JP-#{jobPermitId}</p>
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
      permitToWorkCompletionInitiated: {
        subject: 'Permit to Work Completion Initiated - PTW-#{permitId}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Work Completion Initiated</h2>
            <div style="padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
              <p><strong>Permit to Work ID:</strong> PTW-#{permitId}</p>
              <p><strong>Main Job Permit Documentation:</strong> JP-#{jobPermitId}</p>
              <p><strong>Initiated By:</strong> #{initiatedBy} (#{userRole}) of #{departmentName} Department</p>
              <p><strong>Status:</strong> Completion Initiated</p>
              #{remarksSection}
              <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 5px;">
                <p><strong>Next Steps:</strong></p>
                <p>QHSSE Approver review required to complete and close this permit.</p>
              </div>
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
      permitToWorkCompleted: {
        subject: 'Permit to Work Completed - PTW-#{permitId}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">Work Completion Update</h2>
            <div style="padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
              <p><strong>Permit to Work ID:</strong> PTW- #{permitId}</p>
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
      permitToWorkRevocationInitiated: {
        subject: 'Permit to Work Revocation Initiated - PTW-#{permitId}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">Permit Revocation Initiated</h2>
            <div style="padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
              <p><strong>Permit to Work ID:</strong> PTW-#{permitId}</p>
              <p><strong>Main Job Permit Documentation:</strong> JP-#{jobPermitId}</p>
              <p><strong>Status:</strong> <span style="color: #dc3545;">#{status}</span></p>
              <p><strong>Initiated By:</strong> #{initiatedBy} (#{userRole}) of #{departmentName}</p>
              <p><strong>Reason for Revocation:</strong> #{revocationReason}</p>
              <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 5px;">
                <p><strong>Next Steps:</strong></p>
                <p>This revocation request requires QHSSE review and approval. The permit remains active until QHSSE approval.</p>
              </div>
              <div style="margin-top: 20px;">
                <a href="#{frontendUrl}/#{permitUrlPath}/#{permitId}" 
                   style="background-color: #dc3545; color: white; padding: 10px 20px; 
                          text-decoration: none; border-radius: 5px;">
                  View Revocation Details
                </a>
              </div>
            </div>
          </div>
        `
      },
      permitRevoked: {
        subject: '#{permitType} Revoked - PTW-#{permitId}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">Permit Revocation Notice</h2>
            <div style="padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
              <p><strong>Permit ID:</strong> PTW #{permitId}</p>
              <p><strong>Status:</strong> <span style="color: #dc3545;">#{status}</span></p>
              <p><strong>Action By:</strong> #{initiatedBy} (#{userRole}) of #{departmentName}</p>
              <p><strong>Reason for Revocation:</strong> #{revocationReason}</p>
              #{remarksSection}
              <div style="margin-top: 20px;">
                <a href="#{frontendUrl}/#{permitUrlPath}/#{permitId}" 
                   style="background-color: #dc3545; color: white; padding: 10px 20px; 
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

  async getUsersToNotify({ department, permitType, createdByEmail, stage, permitToWorkId }) {
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

      // For completion stages, get permit details to include receiver
      let permitReceiver = null;
      if (stage === 'ISS_COMPLETE' || stage === 'QA_COMPLETE') {
        const permitQuery = `
          SELECT 
            ptw.PermitToWorkID,
            jp.PermitReceiver,
            u.Email as ReceiverEmail,
            u.FirstName + ' ' + u.LastName as ReceiverName,
            u.DepartmentID as ReceiverDepartment
          FROM PermitToWork ptw
          JOIN JobPermits jp ON ptw.JobPermitID = jp.JobPermitID
          LEFT JOIN Users u ON u.FirstName + ' ' + u.LastName = jp.PermitReceiver
          WHERE ptw.PermitToWorkID = @permitToWorkId
        `;

        const permitResult = await transaction.request()
          .input('permitToWorkId', sql.Int, permitToWorkId)
          .query(permitQuery);

        if (permitResult.recordset.length > 0) {
          permitReceiver = permitResult.recordset[0];
          createdByEmail = permitResult.recordset[0].CreatorEmail; // Update createdByEmail
        }
      }
  
      // Build query to get the right users to notify
      let query = `
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
      `;

      // Handle completion stages
      if (stage === 'ISS_COMPLETE') {
        // First get the permit details to know which department's HOD to notify
        const permitQuery = `
          SELECT 
            ptw.PermitToWorkID,
            jp.Department,
            jp.JobPermitID
          FROM PermitToWork ptw
          JOIN JobPermits jp ON ptw.JobPermitID = jp.JobPermitID
          WHERE ptw.PermitToWorkID = @permitToWorkId
        `;
      
        const permitResult = await transaction.request()
          .input('permitToWorkId', sql.Int, permitToWorkId)
          .query(permitQuery);
      
        if (!permitResult.recordset.length) {
          console.error('No permit found for ID:', permitToWorkId);
          return [];
        }
      
        const permitDepartment = permitResult.recordset[0].Department;
      
        // Now get QA users and the department's HOD
        query = `
          SELECT DISTINCT 
            u.Email,
            u.RoleID,
            u.FirstName + ' ' + u.LastName as FullName,
            u.DepartmentID,
            d.DepartmentName,
            'Approver' as UserType
          FROM Users u
          LEFT JOIN Departments d ON u.DepartmentID = d.DepartmentID
          WHERE u.IsActive = 1
          AND (
            u.RoleID = 'QA'
            OR (u.RoleID = 'HOD' AND (
              u.DepartmentID IN (
                SELECT DepartmentID 
                FROM Departments 
                WHERE DepartmentName = @department
              )
            ))
          )
          AND u.Email IS NOT NULL;
        `;
      
        // Execute with proper parameters
        const result = await transaction.request()
          .input('department', sql.VarChar(50), permitDepartment)
          .query(query);
      
        // Add the issuer to the notification list if they have an email
        const issuerQuery = `
          SELECT 
            u.Email,
            u.RoleID,
            u.FirstName + ' ' + u.LastName as FullName,
            u.DepartmentID,
            d.DepartmentName
          FROM PermitToWork ptw
          JOIN Users u ON ptw.IssuerApprovedBy = u.UserID
          LEFT JOIN Departments d ON u.DepartmentID = d.DepartmentID
          WHERE ptw.PermitToWorkID = @permitToWorkId
        `;
      
        const issuerResult = await transaction.request()
          .input('permitToWorkId', sql.Int, permitToWorkId)
          .query(issuerQuery);
      
        if (issuerResult.recordset.length > 0) {
          result.recordset.push({
            ...issuerResult.recordset[0],
            UserType: 'ISS'
          });
        }
      
        // Log the users being notified for debugging
        console.log('Notifying users for ISS_COMPLETE:', result.recordset.map(u => ({
          Email: u.Email,
          Role: u.RoleID,
          Department: u.DepartmentName
        })));
      
        return result.recordset;
      }
      else if (stage === 'QA_COMPLETE') {
        // When QA completes, notify ISS and the permit receiver
        query += `
          (u.RoleID = 'ISS' AND (
            u.DepartmentID = @department OR 
            u.DepartmentID IN (
              SELECT DepartmentID 
              FROM Departments 
              WHERE DepartmentName = @department
            )
          )) OR
        `;
      }

      else if (stage === 'ISS_REVOKE' || stage === 'QA_REVOKE') {
        // First get the permit details to know which department's users to notify
        const permitQuery = `
          SELECT 
            ptw.PermitToWorkID,
            jp.Department,
            jp.JobPermitID,
            jp.PermitReceiver,
            receiver.Email as ReceiverEmail,
            receiver.FirstName + ' ' + receiver.LastName as ReceiverName,
            issuer.Email as IssuerEmail,
            issuer.FirstName + ' ' + issuer.LastName as IssuerName,
            issuer.DepartmentID as IssuerDepartment,
            hod.Email as HODEmail,
            hod.FirstName + ' ' + hod.LastName as HODName
          FROM PermitToWork ptw
          JOIN JobPermits jp ON ptw.JobPermitID = jp.JobPermitID
          LEFT JOIN Users receiver ON receiver.FirstName + ' ' + receiver.LastName = jp.PermitReceiver
          LEFT JOIN Users issuer ON ptw.IssuerApprovedBy = issuer.UserID
          LEFT JOIN Users hod ON ptw.HODApprovedBy = hod.UserID
          WHERE ptw.PermitToWorkID = @permitToWorkId
        `;
      
        const permitResult = await transaction.request()
          .input('permitToWorkId', sql.Int, permitToWorkId)
          .query(permitQuery);
      
        if (!permitResult.recordset.length) {
          console.error('No permit found for ID:', permitToWorkId);
          return [];
        }
      
        const permitInfo = permitResult.recordset[0];
      
        // For ISS initiated revocation, notify QA users and department HOD
        if (stage === 'ISS_REVOKE') {
          query = `
            SELECT DISTINCT 
              u.Email,
              u.RoleID,
              u.FirstName + ' ' + u.LastName as FullName,
              u.DepartmentID,
              d.DepartmentName,
              'Approver' as UserType
            FROM Users u
            LEFT JOIN Departments d ON u.DepartmentID = d.DepartmentID
            WHERE u.IsActive = 1
            AND (
              (u.RoleID = 'QA')
              OR (u.RoleID = 'HOD' AND u.DepartmentID IN (
                SELECT DepartmentID 
                FROM Departments 
                WHERE DepartmentName = @department
              ))
            )
            AND u.Email IS NOT NULL
          `;
      
          const result = await transaction.request()
            .input('department', sql.VarChar(50), permitInfo.Department)
            .query(query);
      
          // Add the issuer to the notification list if they have an email
          if (permitInfo.IssuerEmail) {
            result.recordset.push({
              Email: permitInfo.IssuerEmail,
              RoleID: 'ISS',
              FullName: permitInfo.IssuerName,
              DepartmentID: permitInfo.IssuerDepartment,
              DepartmentName: this.getDepartmentFullName(permitInfo.IssuerDepartment),
              UserType: 'Issuer'
            });
          }
      
          return result.recordset;
        }
        // For QA initiated revocation (immediate revocation)
        else if (stage === 'QA_REVOKE') {
          query = `
            SELECT DISTINCT 
              u.Email,
              u.RoleID,
              u.FirstName + ' ' + u.LastName as FullName,
              u.DepartmentID,
              d.DepartmentName,
              'Notified' as UserType
            FROM Users u
            LEFT JOIN Departments d ON u.DepartmentID = d.DepartmentID
            WHERE u.IsActive = 1
            AND (
              (u.RoleID = 'ISS' AND u.DepartmentID IN (
                SELECT DepartmentID 
                FROM Departments 
                WHERE DepartmentName = @department
              ))
              OR (u.RoleID = 'HOD' AND u.DepartmentID IN (
                SELECT DepartmentID 
                FROM Departments 
                WHERE DepartmentName = @department
              ))
            )
            AND u.Email IS NOT NULL
          `;
      
          const result = await transaction.request()
            .input('department', sql.VarChar(50), permitInfo.Department)
            .query(query);
      
          let usersToNotify = result.recordset;
      
          // Add permit receiver if available
          if (permitInfo.ReceiverEmail) {
            usersToNotify.push({
              Email: permitInfo.ReceiverEmail,
              RoleID: 'RCV',
              FullName: permitInfo.ReceiverName,
              DepartmentID: permitInfo.Department,
              DepartmentName: this.getDepartmentFullName(permitInfo.Department),
              UserType: 'Receiver'
            });
          }
      
          // Add the issuer if not already included
          if (permitInfo.IssuerEmail && !usersToNotify.some(u => u.Email === permitInfo.IssuerEmail)) {
            usersToNotify.push({
              Email: permitInfo.IssuerEmail,
              RoleID: 'ISS',
              FullName: permitInfo.IssuerName,
              DepartmentID: permitInfo.IssuerDepartment,
              DepartmentName: this.getDepartmentFullName(permitInfo.IssuerDepartment),
              UserType: 'Issuer'
            });
          }
      
          return usersToNotify;
        }
      }
  
      // For initial creation, notify department issuers
      if (!stage) {
        // Special handling for QHSSE department
        if (department === 'QHSSE') {
          query += `
            (u.DepartmentID = 'QHSSE' AND u.RoleID = 'ISS') OR
          `;
        } 
        // For other departments (ASM, OPS, IT), notify their ISS users
        else {
          query += `
            (u.RoleID = 'ISS' AND (
              u.DepartmentID = @department OR 
              u.DepartmentID IN (
                SELECT DepartmentID 
                FROM Departments 
                WHERE DepartmentName = @department
              )
            )) OR
          `;
        }
      }
      // For ISS approval, notify HODs and the ISS approvers
      else if (stage === 'ISS') {
        query += `
          (u.RoleID = 'HOD' AND (
            u.DepartmentID = @department OR 
            u.DepartmentID IN (
              SELECT DepartmentID 
              FROM Departments 
              WHERE DepartmentName = @department
            )
          )) OR
          (u.RoleID = 'ISS' AND (
            u.DepartmentID = @department OR 
            u.DepartmentID IN (
              SELECT DepartmentID 
              FROM Departments 
              WHERE DepartmentName = @department
            )
          )) OR
        `;
      } 
      // For HOD approval, notify QAs, ISS and HOD approvers
      else if (stage === 'HOD') {
        query += `
          (u.RoleID = 'QA') OR
          (u.RoleID = 'HOD' AND (
            u.DepartmentID = @department OR 
            u.DepartmentID IN (
              SELECT DepartmentID 
              FROM Departments 
              WHERE DepartmentName = @department
            )
          )) OR
          (u.RoleID = 'ISS' AND (
            u.DepartmentID = @department OR 
            u.DepartmentID IN (
              SELECT DepartmentID 
              FROM Departments 
              WHERE DepartmentName = @department
            )
          )) OR
        `;
      }
      // For QA approval, notify all previous approvers
      else if (stage === 'QA') {
        query += `
          (u.RoleID = 'QA') OR
          (u.RoleID = 'HOD' AND (
            u.DepartmentID = @department OR 
            u.DepartmentID IN (
              SELECT DepartmentID 
              FROM Departments 
              WHERE DepartmentName = @department
            )
          )) OR
          (u.RoleID = 'ISS' AND (
            u.DepartmentID = @department OR 
            u.DepartmentID IN (
              SELECT DepartmentID 
              FROM Departments 
              WHERE DepartmentName = @department
            )
          )) OR
        `;
      }
  
      // Always include the creator
      query += `
          (u.Email = @createdByEmail)
        )
        AND u.Email IS NOT NULL
      `;
  
      const result = await transaction.request()
        .input('department', sql.VarChar(50), department)
        .input('createdByEmail', sql.VarChar(100), createdByEmail)
        .query(query);
  
      await transaction.commit();
  
      // Process users and add permit receiver for completion stages
      let users = result.recordset.map(user => ({
        ...user,
        DepartmentName: this.getDepartmentFullName(user.DepartmentID)
      }));

      // Add permit receiver for QA completion if available
      if (stage === 'QA_COMPLETE' && permitReceiver?.ReceiverEmail) {
        users.push({
          Email: permitReceiver.ReceiverEmail,
          RoleID: 'RECEIVER',
          FullName: permitReceiver.ReceiverName,
          DepartmentID: permitReceiver.ReceiverDepartment,
          DepartmentName: this.getDepartmentFullName(permitReceiver.ReceiverDepartment),
          UserType: 'Receiver'
        });
      }

      // Remove duplicates based on email
      return [...new Map(users.map(user => [user.Email, user])).values()];

    } catch (error) {
      console.error('Error getting users to notify:', error);
      return [];
    }
  }

  async getPermitApprovalUsers(permitId) {
    try {
      // Get permit details including creator and approvers
      const pool = await poolPromise;
      const permitQuery = `
        SELECT 
          jp.*,
          creatorUser.Email as CreatorEmail,
          creatorUser.UserID as CreatorID,
          issUser.Email as IssuerEmail,
          issUser.UserID as IssuerID,
          hodUser.Email as HodEmail,
          hodUser.UserID as HodID,
          qaUser.Email as QaEmail,
          qaUser.UserID as QaID,
          d.DepartmentID
        FROM JobPermits jp
        LEFT JOIN Users creatorUser ON jp.Creator = creatorUser.UserID
        LEFT JOIN Users issUser ON jp.IssuerApprovedBy = issUser.UserID
        LEFT JOIN Users hodUser ON jp.HODApprovedBy = hodUser.UserID
        LEFT JOIN Users qaUser ON jp.QHSSEApprovedBy = qaUser.UserID
        LEFT JOIN Departments d ON jp.Department = d.DepartmentName
        WHERE jp.JobPermitID = @permitId
      `;
      
      const permitResult = await pool.request()
        .input('permitId', sql.Int, permitId)
        .query(permitQuery);
      
      if (!permitResult.recordset || permitResult.recordset.length === 0) {
        console.error('Cannot find permit data for ID:', permitId);
        return [];
      }
      
      const permitData = permitResult.recordset[0];
      
      // Get all relevant users in a single query
      const usersQuery = `
        SELECT DISTINCT 
          u.Email,
          u.RoleID,
          u.FirstName + ' ' + u.LastName as FullName,
          u.DepartmentID,
          d.DepartmentName,
          CASE 
            WHEN u.UserID = @creatorId THEN 'Creator'
            WHEN u.UserID = @issuerId THEN 'Issuer'
            WHEN u.UserID = @hodId THEN 'HOD'
            WHEN u.UserID = @qaId THEN 'QA'
            ELSE u.RoleID
          END as UserType
        FROM Users u
        LEFT JOIN Departments d ON u.DepartmentID = d.DepartmentID
        WHERE 
          (
            -- Always include the creator/permit receiver
            (u.UserID = @creatorId)
            
            -- Include the ISS approver if present
            OR (u.UserID = @issuerId AND @issuerId IS NOT NULL)
            
            -- Include the HOD approver if present  
            OR (u.UserID = @hodId AND @hodId IS NOT NULL)
            
            -- Include the QA/QHSSE approver if present
            OR (u.UserID = @qaId AND @qaId IS NOT NULL)
          )
          AND u.Email IS NOT NULL
      `;
      
      const usersResult = await pool.request()
        .input('creatorId', sql.Int, permitData.CreatorID)
        .input('issuerId', sql.Int, permitData.IssuerID)
        .input('hodId', sql.Int, permitData.HodID)
        .input('qaId', sql.Int, permitData.QaID)
        .query(usersQuery);
      
      // Process department names
      return usersResult.recordset.map(user => ({
        ...user,
        DepartmentName: this.getDepartmentFullName(user.DepartmentID)
      }));
    } catch (error) {
      console.error('Error getting permit approval users:', error);
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
    
    // Also get the permit data to get the creator's email
    const permitQuery = `
      SELECT 
        jp.*,
        u.Email as CreatorEmail
      FROM JobPermits jp
      LEFT JOIN Users u ON jp.Creator = u.UserID
      WHERE jp.JobPermitID = @permitId
    `;
    
    const permitResult = await pool.request()
      .input('permitId', sql.Int, permitId)
      .query(permitQuery);
    
    const permitData = permitResult.recordset[0];
    const creatorEmail = permitData?.CreatorEmail;

    if (!userDetails) {
      // Fallback to provided user data if database lookup fails
      return {
        permitId,
        status,
        updatedBy: user.name || 'Unknown User',
        userRole: user.role,
        departmentName: this.getDepartmentFullName(user.departmentId),
        comments,
        assignedTo: user.role,
        stage: user.role, // Add the stage information
        creatorEmail // Add the creator email
      };
    }

    return {
      permitId,
      status,
      updatedBy: userDetails.FullName,
      userRole: userDetails.RoleID,
      departmentName: this.getDepartmentFullName(userDetails.DepartmentID),
      comments,
      assignedTo: userDetails.RoleID,
      stage: userDetails.RoleID, // Add the stage information
      creatorEmail // Add the creator email
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
      assignedTo: user.role,
      stage: user.role // Add the stage information
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
        return `<p style="color: #28a745;"><strong>Next Stage:</strong> Job Permit Documentation fully approved - Permit Receiver can proceed to request a Permit to Work</p>`;
      } else if (assignedTo === 'ISS') {
        return `<p><strong>Next Stage:</strong> Awaiting HOD Review of Job Permit Documentation</p>`;
      } else if (assignedTo === 'HOD') {
        return `<p><strong>Next Stage:</strong> Awaiting QHSSE Approver</p>`;
      }
    } else {
      // Permit to Work specific messages
      if (assignedTo === 'QA') {
        return `<p style="color: #28a745;"><strong>Next Stage:</strong> Permit to Work fully approved - Permit Receiver can commence Work</p>`;
      } else if (assignedTo === 'ISS') {
        return `<p><strong>Next Stage:</strong> Awaiting HOD Review of Permit to Work</p>`;
      } else if (assignedTo === 'HOD') {
        return `<p><strong>Next Stage:</strong> Awaiting QHSSE Approver</p>`;
      }
    }
  }
  return '';
}

getNextStepsMessage(status, stage, isJobPermit = true) {
  if (status === 'Approved') {
    const permitType = isJobPermit ? 'Job Permit Documentation' : 'Permit to Work';
    
    if (stage === 'QA') {
      return isJobPermit
        ? `<p style="color: #28a745;"><strong>Next Stage:</strong> Job Permit Documentation fully approved - Permit Receiver can proceed to request a Permit to Work</p>`
        : `<p style="color: #28a745;"><strong>Next Stage:</strong> Permit to Work fully approved - Permit Receiver can commence work</p>`;
    } else if (stage === 'ISS') {
      return `<p>Your ${permitType} is now under review by HOD (Head of Department). You will be notified once they complete their review.</p>`;
    } else if (stage === 'HOD') {
      return `<p>Your ${permitType} is now under review by QHSSE. You will be notified once they complete their review.</p>`;
    }
  } else if (status === 'Rejected') {
    const permitType = isJobPermit ? 'Job Permit Documentation' : 'Permit to Work';
    return `<p>Your ${permitType} requires revision. Please review the comments above and make the necessary corrections before resubmitting.</p>`;
  }
  
  const permitType = isJobPermit ? 'Job Permit Documentation' : 'Permit to Work';
  return `Your ${permitType} is pending review. You will be notified of any updates.`;
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
  
    // Handle role display names
    if (data.assignedTo) {
      const roleMap = {
        'ISS': 'Issuer',
        'HOD': 'Head of Department',
        'QA': 'QHSSE'
      };
      data.assignedToDisplay = roleMap[data.assignedTo] || data.assignedTo;
      
      // Replace the assignedTo placeholder with the display name
      processed = processed.replace(/#{assignedTo}/g, data.assignedToDisplay);
    }
  
    // Replace all other placeholders
    for (const [key, value] of Object.entries(data)) {
      if (key !== 'assignedTo') { // Skip this since we handled it specially above
        processed = processed.replace(new RegExp(`#{${key}}`, 'g'), value || '');
      }
    }
    
    return processed;
  }

  async sendNotification(recipients, templateName, data) {
    try {
      // Extensive logging for debugging
      console.log('------- SEND NOTIFICATION START -------');
      console.log('Template Name:', templateName);
      console.log('Recipients (before processing):', recipients);
      
      // If recipients is an array of objects, extract just the emails
      const emailAddresses = Array.isArray(recipients) && typeof recipients[0] === 'object' 
        ? recipients.map(r => r.Email).filter(email => email) 
        : recipients;
      
      console.log('Processed Email Addresses:', emailAddresses);
      
      if (!emailAddresses || emailAddresses.length === 0) {
        console.error('NO VALID RECIPIENTS FOUND');
        return;
      }
      
      // Get the template
      const template = this.templates[templateName];
      if (!template) {
        console.error('EMAIL TEMPLATE NOT FOUND:', templateName);
        return;
      }
      
      // Detailed data logging (be careful with sensitive information)
      console.log('Notification Data:', JSON.stringify({
        ...data,
        // Redact sensitive fields if needed
        comments: data.comments ? '[REDACTED]' : undefined
      }, null, 2));
      
      // Process template variables
      let subject = template.subject;
      let html = template.html;
      
      // Add display status with color
      const statusColorMap = {
        'Approved': '#28a745',
        'Rejected': '#dc3545',
        'Pending': '#ffc107'
      };
      
      const data_with_defaults = {
        // Default values
        statusColor: statusColorMap[data.status] || '#6c757d',
        displayStatus: data.status || 'Pending',
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        
        /// Update this line to ensure isJobPermit is correctly determined
      nextStepsMessage: this.getNextStepsMessage(
        data.status, 
        data.stage || data.currentApproverRole,
        data.permitType !== 'PermitToWork' // true for Job Permit, false for Permit to Work
      ),
        
        // For permit status updates
        nextStageInfo: '',
        actionButton: `
          <a href="${process.env.FRONTEND_URL}" 
             style="background-color: #007bff; color: white; padding: 10px 20px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            View Permit Details
          </a>
        `,
        
        // Merge with provided data
        ...data
      };
      
      // Update next stage info if status is approved
      if (data.status === 'Approved') {
        const stageMap = {
          'ISS': 'HOD',
          'HOD': 'QHSSE Approver',
          'QA': 'Complete'
        };
        const currentStage = data.stage || data.currentApproverRole;
        const nextStage = stageMap[currentStage] || 'Unknown';
        
        if (nextStage !== 'Complete') {
          data_with_defaults.nextStageInfo = `
            <p><strong>Next Stage:</strong> Awaiting ${nextStage} Review </p>
          `;
        } else {
          data_with_defaults.nextStageInfo = `
            <p><strong>Status:</strong> <span style="color: #28a745;">Approval process complete</span></p>
          `;
        }
      } else if (data.status === 'Rejected') {
        data_with_defaults.nextStageInfo = `
          <p><strong>Status:</strong> <span style="color: #dc3545;">Rejected - Please review comments</span></p>
        `;
      }
      
      // Replace all template placeholders with actual values
      Object.keys(data_with_defaults).forEach(key => {
        const value = data_with_defaults[key] !== undefined ? data_with_defaults[key] : '';
        const placeholder = new RegExp(`#{${key}}`, 'g');
        subject = subject.replace(placeholder, value);
        html = html.replace(placeholder, value);
      });
      
      // Send the email
      const mailOptions = {
        from: `"MPS Permit System" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`,
        to: Array.isArray(emailAddresses) ? emailAddresses.join(',') : emailAddresses,
        subject: subject,
        html: html
      };
      
      console.log('Mail Options (Sender/Recipient):', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });
      
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected
      });
      
      console.log('------- SEND NOTIFICATION END -------');
      
      return info;
    } catch (error) {
      console.error('------- EMAIL SENDING ERROR -------');
      console.error('Detailed Error:', error);
      
      // Log specific error details
      if (error.responseCode) {
        console.error('SMTP Response Code:', error.responseCode);
      }
      if (error.response) {
        console.error('SMTP Full Response:', error.response);
      }
      
      throw error;
    }
  }

  async handlePermitCreated(permitData, transaction = null) {
    try {
      console.log('Handling permit created notification for permit ID:', permitData.permitId);
  
      // Get users to notify - for a new permit, we don't pass a stage
      const usersToNotify = await this.getUsersToNotify({
        department: permitData.department,
        permitType: permitData.permitType || 'JobPermit',
        createdByEmail: permitData.createdByEmail
        // No stage parameter for initial creation
      });
      
      if (usersToNotify.length === 0) {
        console.log('No users to notify for permit creation');
        return;
      }
  
      // Log who we're notifying for debugging
      console.log('Users to notify:', usersToNotify.map(u => `${u.FullName} (${u.RoleID})`));
      
      // Get just the email addresses
      const emailAddresses = usersToNotify.map(user => user.Email);
      console.log('Sending notifications to:', emailAddresses);
      
      // Determine the current assignee - for a new permit, it's the first approver (ISS)
      const assignedTo = 'ISS'; // For a new permit, always assigned to ISS first
      
      // Get company name from permit data or use a default
      const companyName = permitData.contractCompanyName || 'Meridian Port Services Ltd';
      
      // Send notifications to relevant users
      await this.sendNotification(
        emailAddresses,
        'permitCreated',
        {
          permitId: permitData.permitId,
          createdBy: permitData.createdBy || 'System User',
          companyName: companyName,
          department: this.getDepartmentFullName(permitData.department),
          location: permitData.location,
          workDescription: permitData.workDescription,
          startDate: this.formatDate(permitData.startDate),
          endDate: this.formatDate(permitData.endDate),
          assignedTo: assignedTo // Set the current assignee
        }
      );
    } catch (error) {
      console.error('Error handling permit creation notification:', error);
      // Don't throw error to prevent blocking permit creation
    }
  }

  async handlePermitStatusUpdate(permitData) {
    try {
      console.log('Handling permit status update notification for permit ID:', permitData.permitId);
      
      // Determine if this is a Job Permit or Permit to Work based on the ID format
      const isJobPermit = !permitData.permitId.toString().startsWith('PTW-');

      // Get users to notify based on the current stage
      const usersToNotify = await this.getUsersToNotify({
        department: permitData.department,
        permitType: permitData.permitType || 'JobPermit',
        createdByEmail: permitData.createdByEmail,
        stage: permitData.currentApproverRole // Pass the current stage to determine next approvers
      });
      
      if (usersToNotify.length === 0) {
        console.log('No users to notify for permit status update');
        return;
      }
  
      // Determine next assignee based on current approver
      let nextAssignedTo = 'QA'; // Default to final approver
      if (permitData.currentApproverRole === 'ISS') {
        nextAssignedTo = 'HOD';
      } else if (permitData.currentApproverRole === 'HOD') {
        nextAssignedTo = 'QA';
      }
      
      // Get just the email addresses
      const emailAddresses = usersToNotify.map(user => user.Email);
      console.log('Sending status update notifications to:', emailAddresses);
      
      // Send notifications to relevant users
      await this.sendNotification(
        emailAddresses,
        isJobPermit ? 'permitStatusUpdate' : 'permitToWorkStatusUpdate',
        {
          permitId: permitData.permitId,
          jobPermitId: permitData.jobPermitId,
          status: permitData.status,
          updatedBy: permitData.updatedBy,
          userRole: permitData.userRole,
          departmentName: this.getDepartmentFullName(permitData.department),
          comments: permitData.comments,
          stage: permitData.currentApproverRole,
          isJobPermit: isJobPermit,
          permitType: isJobPermit ? 'JobPermit' : 'PermitToWork' // Make sure this is set correctly
        }
      );
    } catch (error) {
      console.error('Error handling permit status update notification:', error);
    }
  }

  async handlePermitToWorkCreated(permitData) {
    try {
      // First get the JobPermit details to get the correct department
      const pool = await poolPromise;
      const permitQuery = `
        SELECT 
          p.*,
          jp.PermitReceiver,
          jp.JobPermitID,
          jp.JobLocation,
          jp.SubLocation,
          jp.Department as JobPermitDepartment,  /* Get the department from JobPermit */
          u.Email as ReceiverEmail,
          jp.Creator as CreatorID,
          creator.Email as CreatorEmail
        FROM PermitToWork p
        JOIN JobPermits jp ON p.JobPermitID = jp.JobPermitID
        LEFT JOIN Users u ON u.FirstName + ' ' + u.LastName = jp.PermitReceiver
        LEFT JOIN Users creator ON jp.Creator = creator.UserID
        WHERE p.PermitToWorkID = @permitId
      `;
  
      let permitDetails = null;
      let jobPermitDepartment = null;
      let receiverEmail = null;
      let creatorEmail = null;
      let jobPermitId = null;
      
      try {
        const permitResult = await pool.request()
          .input('permitId', sql.Int, permitData.permitId)
          .query(permitQuery);
  
        permitDetails = permitResult.recordset[0];
        jobPermitDepartment = permitDetails?.JobPermitDepartment || permitData.department;
        receiverEmail = permitDetails?.ReceiverEmail;
        creatorEmail = permitDetails?.CreatorEmail;
        // Fix for the duplicated JobPermitID
        jobPermitId = permitDetails?.JobPermitID;
        if (Array.isArray(jobPermitId)) {
          jobPermitId = jobPermitId[0]; // Take only the first value if it's an array
        }
        
        console.log('Retrieved JobPermit department for PTW:', jobPermitDepartment);
        console.log('Retrieved Receiver Email:', receiverEmail);
        console.log('Retrieved Creator Email:', creatorEmail);
        console.log('Cleaned JobPermitID:', jobPermitId);
      } catch (dbError) {
        console.error('Database error fetching permit details:', dbError);
      }
  
      // Now get users to notify using the JobPermit department
      const usersToNotify = await this.getUsersToNotify({
        department: jobPermitDepartment, // Use the department from the JobPermit
        permitType: 'PermitToWork',
        createdByEmail: permitData.createdByEmail
      });
  
      // Add receiver to notification list if not already included
      if (receiverEmail && !usersToNotify.some(u => u.Email === receiverEmail)) {
        console.log('Adding receiver with email to notifications:', receiverEmail);
        usersToNotify.push({
          Email: receiverEmail,
          RoleID: 'RCV',
          FullName: permitDetails?.PermitReceiver || 'Permit Receiver',
          UserType: 'Receiver'
        });
      } else if (permitDetails?.PermitReceiver) {
        console.log('Receiver has no email in system, trying to find by name:', permitDetails.PermitReceiver);
        // If we can't find receiver by email directly, try to find by name
        try {
          const userQuery = `
            SELECT Email, FirstName + ' ' + LastName as FullName 
            FROM Users 
            WHERE FirstName + ' ' + LastName LIKE @receiverName
          `;
          
          const userResult = await pool.request()
            .input('receiverName', sql.NVarChar, `%${permitDetails.PermitReceiver}%`)
            .query(userQuery);
            
          if (userResult.recordset.length > 0) {
            const user = userResult.recordset[0];
            console.log('Found user by name:', user);
            usersToNotify.push({
              Email: user.Email,
              RoleID: 'RCV',
              FullName: user.FullName,
              UserType: 'Receiver'
            });
          }
        } catch (userError) {
          console.error('Error trying to find receiver by name:', userError);
        }
      }
  
      // Always make sure creator/requester is included
      if (creatorEmail && !usersToNotify.some(u => u.Email === creatorEmail)) {
        console.log('Adding creator with email to notifications:', creatorEmail);
        usersToNotify.push({
          Email: creatorEmail,
          RoleID: 'REQ',
          FullName: 'Job Permit Creator',
          UserType: 'Creator'
        });
      }
  
      // Always include the person who created the permit to work
      if (permitData.createdByEmail && !usersToNotify.some(u => u.Email === permitData.createdByEmail)) {
        console.log('Adding PTW submitter to notifications:', permitData.createdByEmail);
        usersToNotify.push({
          Email: permitData.createdByEmail,
          RoleID: 'SUB',
          FullName: permitData.createdBy || 'PTW Submitter',
          UserType: 'Submitter'
        });
      }
  
      console.log('Final users to notify for PTW:', usersToNotify.map(u => `${u.FullName} (${u.Email})`));
  
      // Format dates for display
      const formattedStartDate = new Date(permitData.startDate).toLocaleDateString();
      const formattedEndDate = new Date(permitData.endDate).toLocaleDateString();
  
      // Prepare notification data with correct JobPermitID and department
      const notificationData = {
        permitId: permitData.permitId,
        jobPermitId: jobPermitId, // Use the cleaned job permit ID
        createdBy: permitData.createdBy || 'System User',
        permitReceiver: permitDetails?.PermitReceiver || 'Not specified',
        department: jobPermitDepartment, // Use the JobPermit department
        location: permitDetails 
          ? `${permitDetails.JobLocation || ''} ${permitDetails.SubLocation ? `- ${permitDetails.SubLocation}` : ''}`
          : permitData.location || 'Not specified',
        workDuration: permitData.workDuration,
        formattedStartDate: formattedStartDate,
        formattedEndDate: formattedEndDate,
        assignedTo: 'ISS',
        permitType: 'PermitToWork'
      };
  
      // Check if we actually have users to notify
      if (usersToNotify.length === 0) {
        console.warn('No users to notify for PTW, including default department recipients');
        // Fallback: Get all issuers from the department
        const fallbackQuery = `
          SELECT Email, FirstName + ' ' + LastName as FullName, RoleID
          FROM Users 
          WHERE DepartmentID = @dept AND RoleID = 'ISS'
        `;
        
        try {
          const fallbackResult = await pool.request()
            .input('dept', sql.VarChar, jobPermitDepartment)
            .query(fallbackQuery);
            
          if (fallbackResult.recordset.length > 0) {
            usersToNotify.push(...fallbackResult.recordset);
          }
        } catch (fallbackError) {
          console.error('Error getting fallback recipients:', fallbackError);
        }
      }
  
      await this.sendNotification(
        usersToNotify,
        'permitToWorkCreated',
        notificationData
      );
  
    } catch (error) {
      console.error('Error handling permit to work creation notification:', error);
      console.error('Permit data:', permitData);
      throw error;
    }
  }

  async sendTestEmail(to, subject = 'Test Email', text = 'This is a test email') {
    try {
      console.log('Sending test email to:', to);
      
      const info = await this.transporter.sendMail({
        from: `"MPS Permit System" <${process.env.MAIL_FROM || process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        text: text,
        html: `<p>${text}</p>`
      });
  
      console.log('Test Email sent successfully:', {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected
      });
  
      return info;
    } catch (error) {
      console.error('Test Email Sending Error:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();