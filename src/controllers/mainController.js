import handlingMessagesAttendance from './controls/attendance.js';
import handlingMessagesProfileUser from './controls/profileUser.js';
import handlingMessagesLearningSupport from './controls/learningSupport.js';

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
