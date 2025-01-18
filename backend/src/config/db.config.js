require('dotenv').config();

const config = {
  driver: 'msnodesqlv8',
  connectionString: `Driver={SQL Server Native Client 11.0};Server=${process.env.DB_SERVER.replace(/\\/g, '\\')};Database=${process.env.DB_NAME};Trusted_Connection=yes;`,
  options: {
    enableArithAbort: true,
    trustServerCertificate: true,
    encrypt: false
  }
};

// For debugging - remove in production
//console.log('Connection string:', config.connectionString);

module.exports = config;