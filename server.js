import dotenv from 'dotenv';
import express from 'express';
import { Client, GatewayIntentBits } from 'discord.js';

import appRouter from './src/routes/mainRoute.js';
import redisClient from './src/cache/redisClient.js';
import './src/library/rankSystem.js';

import connectionPool from './src/configs/connectDatabase.js';

import {
   handlingMessagesAttendance,
   handlingMessagesCheckTime,
   handlingMessagesLearningSupport,
   handlingMessagesTest,
} from './src/controllers/mainController.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', appRouter);

app.listen(process.env.PORT || 3000, () => {
   if (connectionPool) {
      console.log('🚀 Connected to Database!');
   }
   if (redisClient.isReady) {
      console.log('🚀 Connected to Redis Cloud!');
   }
   console.log('🌐 Web server running...');
});

const client = new Client({
   intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
   ],
});

client.once('clientReady', () => {
   const [botName] = client.user.tag.split('#');
   console.log(`🤖 Bot Discord: ${botName} running...`);
});

client.on('messageCreate', async (message) => {
   if (message.author.bot) return;

   if (message.channel.parentId === '1435205452945166426') {
      switch (message.channel.id) {
         case '1435205773146980392': // ID kênh: điểm danh
            handlingMessagesAttendance(message);
            break;
         case '1435206051237597245': // ID kênh: check time học
            handlingMessagesCheckTime(message);
            break;
         case '1435185622771040446': // ID kênh: hỗ trợ học tập
            handlingMessagesLearningSupport(message);
            break;
         default:
            handlingMessages(message);
            break;
      }
   }
});

client.login(process.env.TOKEN);
