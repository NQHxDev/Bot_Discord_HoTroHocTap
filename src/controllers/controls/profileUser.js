import {
   userNotRole,
   handleMessageHelpCommand,
   handleMessageCheckInfo,
   handleMessageCheckKPI,
   handleMessageMyRank,
   handleMessageRanking,
   handleMessageTop,
} from '../../services/profileUser.js';

const handlingMessagesProfileUser = async (message) => {
   const messageContent = message.content.toLowerCase();

   if (messageContent.startsWith('!ranking')) {
      const optionsArray = messageContent.split(' ').slice(1);
      const options = optionsArray.length > 0 ? optionsArray : null;

      if (options != null) {
         const allowedRoleIds = [
            '1416060851919519754',
            '1370338798465978390',
            '1436060501070184621',
         ];
         if (!message.member.roles.cache.some((role) => allowedRoleIds.includes(role.id))) {
            return await userNotRole(message);
         }
      }

      handleMessageRanking(message, options);
   } else {
      switch (messageContent) {
         case '!help':
            handleMessageHelpCommand(message);
            break;
         case '!myinfo':
            handleMessageCheckInfo(message);
            break;
         case '!kpi':
            handleMessageCheckKPI(message);
            break;
         case '!myrank':
            handleMessageMyRank(message);
            break;
         case '!top':
            handleMessageTop(message);
            break;
         default:
            handleMessageNotFound(message);
            break;
      }
   }
};

export const handleMessageNotFound = (message) => {
   message.reply(
      `❌ **<@${message.member.id}> Lệnh không hợp lệ!**\n\n` +
         `> Đây là kênh **Check Time Học** - nơi thống kê thông tin học tập!\n\n` +
         `📌 Vui lòng sử dụng các lệnh sau:\n` +
         `🔹 \`!myinfo\` - Xem thông tin cá nhân\n` +
         `🔹 \`!myrank\` - Xem thông tin thành tựu cá nhân\n\n` +
         `🔹 \`!kpi\` - Xem tiến hộ hoàn thành cá nhân trong tháng\n\n` +
         `📘 Nếu cần trợ giúp, hãy gõ \`!help\` để xem hướng dẫn chi tiết.`
   );
};

export default handlingMessagesProfileUser;
