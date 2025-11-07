import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const isDev = process.env.NODE_ENV === 'development';
const prefix = isDev ? '_DEV' : '';

const config = {
   host: process.env[`HOST_DB${prefix}`],
   user: process.env[`USER_DB${prefix}`],
   password: process.env[`PASS_DB${prefix}`],
   database: process.env[`NAME_DB${prefix}`],
   port: process.env[`PORT_DB${prefix}`],

   supportBigNumbers: true,
   bigNumberStrings: true,
};

const connectionPool = mysql.createPool(config);
export default connectionPool;
