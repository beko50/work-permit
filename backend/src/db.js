const sql = require('mssql/msnodesqlv8');
const dbConfig = require('./config/db.config');

const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then(pool => {
    console.log('Connected to MSSQL database');
    return pool;
  })
  .catch(err => {
    console.error('Database connection failed:', err);
    throw err;
  });

module.exports = { poolPromise, sql };