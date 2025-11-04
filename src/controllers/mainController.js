import { handleMessageOnDuty, handleMessageOffDuty } from './handleAttendance.js';

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
   if (message.content === '!checktime') {
      message.channel.send('Check time is already!');
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
