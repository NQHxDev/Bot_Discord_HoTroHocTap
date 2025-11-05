import {
   handleMessageOnDuty,
   handleMessageOffDuty,
   handleMessageStatus,
   handleMessageNotFound,
   handleHelpCommand,
} from '../services/attendance.js';

import {
   handleMessageCheckInfo,
   handleMessageCheckKPI,
   handleMessageCheckRank,
} from '../services/profileUser.js';

export const handlingMessagesAttendance = (message) => {
   const messageContent = message.content.toLowerCase();
   switch (messageContent) {
      case '!onduty':
         handleMessageOnDuty(message);
         break;
      case '!offduty':
         handleMessageOffDuty(message);
         break;
      case '!status':
         handleMessageStatus(message);
         break;
      case '!help':
         handleHelpCommand(message);
         break;
      default:
         handleMessageNotFound(message);
         break;
   }
};

export const handlingMessagesCheckTime = (message) => {
   const messageContent = message.content.toLowerCase();
   switch (messageContent) {
      case '!myinfo':
         handleMessageCheckInfo(message);
         break;
      case '!kpi':
         handleMessageCheckKPI(message);
         break;
      case '!ranking':
         handleMessageCheckRank(message);
         break;
   }
};

export const handlingMessagesLearningSupport = (message) => {
   if (message.content === '!helpme') {
      message.channel.send('Learning support is already!');
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
