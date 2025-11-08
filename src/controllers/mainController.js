import dotenv from 'dotenv';
import { EmbedBuilder } from 'discord.js';
import handlingMessagesAttendance from './controls/attendance.js';
import handlingMessagesProfileUser from './controls/profileUser.js';
import handlingMessagesLearningSupport from './controls/learningSupport.js';

import { testConnection } from '../configs/connectDatabase.js';

dotenv.config();

export const handleNotification = async (clientServer, redisClient, startTime) => {
   if (!clientServer?.user) return;

   const endTime = new Date();
   const duration = (endTime - startTime) / 1000;

   const dbStatus = (await testConnection()) ? 'SQL Connected!' : 'SQL Failed...';
   const cacheStatus = redisClient?.isReady ? 'Redis Connected!' : 'Redis Failed...';

   const embed = new EmbedBuilder()
      .setColor(0x00ff99)
      .setTitle('🚀 Server Startup Notification')
      .setDescription('Hệ thống đã khởi động thành công!')
      .addFields(
         { name: '📦 Database', value: `*➜* ${dbStatus}`, inline: true },
         { name: '🗄️ Cache', value: `*➜* ${cacheStatus}`, inline: true },
         {
            name: `🌐 Web Port: ${String(process.env.PORT || 3000)}`,
            value: '',
            inline: false,
         },
         { name: '⏱️ Startup Time', value: `*➜* ${duration.toFixed(2)}s`, inline: true },
         { name: '🕒 Started At', value: startTime.toLocaleString(), inline: false }
      )
      .setFooter({ text: `Bot: ${clientServer.user.tag}` })
      .setTimestamp();

   const channelId = process.env.NOTIFY_BOT_CHANNEL_ID;
   if (channelId) {
      try {
         const channel = await clientServer.channels.fetch(channelId);
         if (channel) {
            await channel.send({ embeds: [embed] });
         }
      } catch (err) {
         console.error('❌ Failed to send notification to Discord:', err);
      }
   }
};

export const handleMessageServer = (message) => {
   switch (message.channel.id) {
      case '1374497118978572464': // ID kênh Operating Room
         break;
      case '1435205773146980392': // ID kênh: điểm danh
         handlingMessagesAttendance(message);
         break;
      case '1436271317400686612': // ID kênh Dev
      case '1435206051237597245': // ID kênh: check time học
         handlingMessagesProfileUser(message);
         break;
      case '1435185622771040446': // ID kênh: hỗ trợ học tập
         handlingMessagesLearningSupport(message);
         break;
      default:
         handlingMessagesTest(message);
         break;
   }
};

export const handlingMessagesTest = (message) => {
   if (message.content === '!ping') {
      message.channel.send('🏓 Pong!');
   }

   if (message.content === '!hello') {
      message.channel.send(`👋 Xin chào ${message.author.username}!`);
   }
};
