import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const isDev = process.env.NODE_ENV === process.env.NODE_DEV;
const prefix = isDev ? '_DEV' : '';

const config = {
   host: process.env[`HOST_DB${prefix}`],
   user: process.env[`USER_DB${prefix}`],
   password: process.env[`PASS_DB${prefix}`],
   database: process.env[`NAME_DB${prefix}`],
   port: process.env[`PORT_DB${prefix}`],

   supportBigNumbers: true,
   bigNumberStrings: true,

   waitForConnections: true,
   connectionLimit: 10,
   queueLimit: 0,
};

export const testConnection = async () => {
   let connection;
   try {
      connection = await connectionPool.getConnection();
      return true;
   } catch (error) {
      console.error('>> ❌ Database connection: FAILED', error.message);
      return false;
   } finally {
      if (connection) connection.release();
   }
};

const connectionPool = mysql.createPool(config);
export default connectionPool;
