import dotenv from 'dotenv';
import { Client, GatewayIntentBits } from 'discord.js';

import attendanceSystem from './src/library/dataAttendance.js';
import {
   handlingMessagesAttendance,
   handlingMessagesCheckTime,
   handlingMessagesLearningSupport,
   handlingMessages,
} from './src/controllers/mainController.js';

dotenv.config();

const client = new Client({
   intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
   ],
});

client.once('ready', () => {
   const [botName, botID] = client.user.tag.split('#');
   console.log(`{/} Logged in as ${botName} #${botID}`);
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
