import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

// ⚙️ Tạo client Redis
const redisClient = createClient({
   password: process.env.REDIS_PASSWORD,
   socket: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
   },
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

// 🚀 Kết nối Redis
(async () => {
   try {
      await redisClient.connect();
   } catch (err) {
      console.error('❗ Redis connect failed:', err);
   }
})();

export default redisClient;
