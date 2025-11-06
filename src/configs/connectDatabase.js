import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const config = {
   host: process.env.HOST_DB,
   user: process.env.USER_DB,
   password: process.env.PASS_DB,
   database: process.env.NAME_DB,
   port: process.env.PORT_DB,
};

const connectionPool = mysql.createPool(config);
export default connectionPool;
