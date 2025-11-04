import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();
let connectInstance;

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
