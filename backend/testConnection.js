const sql = require('mssql/msnodesqlv8');
const config = require('../backend/src/config/db.config');

async function testConnection() {
    try {
        // Try to connect
        console.log('Attempting to connect with configuration:', {
            driver: config.driver,
            server: config.connectionString.match(/Server=(.*?);/)[1],
            database: config.connectionString.match(/Database=(.*?);/)[1]
        });
        
        const pool = await sql.connect(config);
        
        // Test the connection with a simple query
        const result = await pool.request().query('SELECT GETDATE() as currentTime');
        console.log('Connection successful!');
        console.log('Current database time:', result.recordset[0].currentTime);
        
        // Test database access
        const dbName = await pool.request().query('SELECT DB_NAME() as dbName');
        console.log('Connected to database:', dbName.recordset[0].dbName);
        
        // Close the connection
        await pool.close();
        console.log('Connection closed successfully');
    } catch (err) {
        console.error('Database connection error:');
        console.error('Error message:', err.message);
        console.error('Error code:', err.code);
        console.error('Error state:', err.state);
        
        // Additional troubleshooting info
        if (err.originalError) {
            console.error('Original error:', err.originalError);
        }
    }
}

testConnection();