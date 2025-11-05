import { handleMessageOnDuty, handleMessageOffDuty } from '../services/handleAttendance.js';

export const handlingMessagesAttendance = (message) => {
   const messageContent = message.content.toLowerCase();
   switch (messageContent) {
      case '!onduty':
         handleMessageOnDuty(message);
         break;
      case '!offduty':
         handleMessageOffDuty(message);
         break;
   }
};

export const handlingMessagesCheckTime = (message) => {
   const messageContent = message.content.toLowerCase();
   switch (messageContent) {
      case '!myinfo':
         message.channel.send('myinfo is already!');
         break;
      case '!kpi':
         message.channel.send('kpi is already!');
         break;
      case '!ranking':
         message.channel.send('ranking is already!');
         break;
   }
};

export const handlingMessagesLearningSupport = (message) => {
   if (message.content === '!helpme') {
      message.channel.send('Learning support is already!');
   }
};

export const handlingMessages = (message) => {
   if (message.content === '!ping') {
      message.channel.send('🏓 Pong!');
   }

   if (message.content === '!hello') {
      message.channel.send(`👋 Xin chào ${message.author.username}!`);
   }
};
