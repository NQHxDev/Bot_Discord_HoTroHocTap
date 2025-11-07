import {
   handleMessageOnDuty,
   handleMessageOffDuty,
   handleMessageStatus,
   handleHelpCommand,
} from '../../services/attendance.js';

const handlingMessagesAttendance = (message) => {
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

export const handleMessageNotFound = (message) => {
   message.reply(
      `❌ **<@${message.member.id}> Lệnh không hợp lệ!**\n\n` +
         `> Đây là kênh **On Off Duty** - nơi quản lý thời gian học tập!\n\n` +
         `📌 Vui lòng sử dụng các lệnh sau:\n` +
         `🔹 \`!onduty\` - Bắt đầu ca học\n` +
         `🔹 \`!offduty\` - Kết thúc ca học\n\n` +
         `📘 Nếu cần trợ giúp, hãy gõ \`!help\` để xem hướng dẫn chi tiết.`
   );
};

export default handlingMessagesAttendance;
