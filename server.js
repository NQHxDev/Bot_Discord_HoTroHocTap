import dotenv from 'dotenv';
import express from 'express';
import { Client, GatewayIntentBits } from 'discord.js';

import {
   handlingMessagesAttendance,
   handlingMessagesCheckTime,
   handlingMessagesLearningSupport,
   handlingMessagesTest,
} from './src/controllers/mainController.js';

dotenv.config();

const app = express();
app.get('/', (req, res) => res.send('Discord Bot is running...'));
app.listen(process.env.PORT || 3000, () => {
   console.log('🌐 Web server running...');
});

const client = new Client({
   intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
   ],
});

client.once('ready', () => {
   const [botName, botID] = client.user.tag.split('#');
   console.log(`🤖 Logged in as ${botName} #${botID}`);
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
