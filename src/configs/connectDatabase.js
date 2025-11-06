import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();
let connectInstance;

const config = {
   host: process.env.HOST_DB,
   user: process.env.USER_DB,
   password: process.env.PASS_DB,
   database: process.env.NAME_DB,
   port: process.env.PORT_DB,
};

export const connectionPool = mysql.createPool(config);

const connection = new MongoClient(process.env.MONGO_URI, {
   serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
   },
});

export const getDB = async () => {
   if (!connection.isConnected?.() && !connectInstance) {
      await connection.connect();
      connectInstance = connection.db(process.env.NAME_DATABASE);
   }
   return connectInstance;
};

export const closeDB = async () => {
   await connection.close();
   connectInstance = null;
};
