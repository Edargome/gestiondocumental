const mysql = require('mysql2');
const pool = createPool(process.env.PROD === 'true');
pool.on('connection', (connection) => {
  console.log('Nueva conexión establecida');
});

pool.on('error', (err) => {
  console.error('DB error:', err);
});

function createPool(prod) {
  if (prod) {
    const pool = mysql.createPool({
      host: process.env.DBHOST,
      user: process.env.DBUSER,
      password: process.env.DBPWD,
      database: process.env.DBNAME,
      connectionLimit: 10, // Número máximo de conexiones
    });
    return pool;
  } else {
    const pool = mysql.createPool({
      host: process.env.DBHOSTDEV,
      user: process.env.DBUSERDEV,
      password: process.env.DBPWDDEV,
      database: process.env.DBNAMEDEV,
      connectionLimit: 10, // Número máximo de conexiones
    });
    return pool;
  }
}

module.exports.pool = pool;
