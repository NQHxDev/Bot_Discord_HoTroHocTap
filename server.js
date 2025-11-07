import dotenv from 'dotenv';
import express from 'express';
import { Client, GatewayIntentBits } from 'discord.js';

import appRouter from './src/routes/mainRoute.js';
import redisClient from './src/cache/redisClient.js';
import './src/library/rankSystem.js';

import connectionPool from './src/configs/connectDatabase.js';

import { handleMessageServer } from './src/controllers/mainController.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', appRouter);

app.listen(process.env.PORT || 3000, () => {
   if (connectionPool) {
      console.log('🚀 Connected to Database!');
   }
   if (redisClient.isReady) {
      console.log('🚀 Connected to Redis Cloud!');
   }
   console.log('🌐 Web server running...');
});

// Khởi tạo Client Discord Server
const clientServer = new Client({
   intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
   ],
});

clientServer.once('clientReady', () => {
   const [botName] = clientServer.user.tag.split('#');
   console.log(`🤖 Bot Discord: ${botName} running...`);
});

clientServer.on('messageCreate', async (message) => {
   if (message.author.bot) return;
   handleMessageServer(message);
});

clientServer.login(process.env.TOKEN);

export default clientServer;
