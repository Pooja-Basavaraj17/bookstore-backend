// ================= LOAD ENV =================
require("dotenv").config();

// ================= IMPORT MYSQL =================
const mysql = require("mysql2");

// ================= CREATE CONNECTION POOL =================
const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQLHOST,
  user: process.env.DB_USER || process.env.MYSQLUSER,
  password: process.env.DB_PASS || process.env.MYSQLPASSWORD,
  database: process.env.DB_NAME || process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT || 3306,	
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ================= EXPORT PROMISE POOL =================
module.exports = pool.promise();
