import { EmbedBuilder } from 'discord.js';

import {
   formatDateTime,
   timeDifference,
   totalMinutes,
   formatDuration,
   getVietNamDateTime,
} from '../utils/dateTime.js';
import { hasCacheStudent } from '../cache/redisCache.js';
import { getStudent, pushStudent, removeStudent } from '../cache/redisCache.js';
import {
   handleAttendanceData,
   getDurationToday,
   getDurationMonth,
} from '../controllers/databaseController.js';

export const handleMessageOnDuty = async (message) => {
   if (await hasCacheStudent(message.member.id)) {
      await message.reply(
         `❌ <@${message.member.id}>, bạn hiện đang *On Duty* rồi!\n` +
            '> Vui lòng gõ lệnh `!offduty` trước khi bật lại chế độ này nhé.'
      );
   } else {
      const [date, time] = formatDateTime(getVietNamDateTime()).split(' - ');

      const embed = new EmbedBuilder()
         .setColor('#2fff20')
         .setTitle(`🌍 ${message.member.displayName} On Duty Successfully`)
         .addFields({
            name: '> ⏳ Đã bắt đầu On Duty:',
            value: [
               `\`\`\`yaml\n🕒 Giờ: ${time}\n📅 Ngày: ${date}\n\`\`\``,
               '**Lưu ý:**',
               '> 💡 **Nhớ gõ lệnh `!offduty` khi bạn không còn tham gia học!**',
               '',
               '*❤️ Cảm ơn bạn đã tham gia!*',
            ].join('\n'),
            inline: false,
         })
         .setFooter({
            text: `Thực hiện bởi ${message.member.displayName}`,
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
         })
         .setTimestamp();

      await message.channel.send({ embeds: [embed] });

      const dailyDuration = await getDurationToday(message.member.id);
      const monthDuration = await getDurationMonth(message.member.id);

      await pushStudent({
         memberID: message.member.id,
         totalDurationDaily: dailyDuration,
         totalDurationMonth: monthDuration,
      });
   }
};

export const handleMessageOffDuty = async (message) => {
   const currentRecord = await getStudent(message.member.id);

   if (!currentRecord) {
      await message.reply(
         `❌ <@${message.member.id}>, bạn hiện chưa *On Duty* rồi!\n` +
            '> Vui lòng gõ lệnh `!onduty` để bắt đầu vào ca học nào.'
      );
   } else {
      const [start, end] = [currentRecord.createdAt, formatDateTime(new Date())];
      const duration = timeDifference(start);

      const currentDuration = totalMinutes(duration);

      let dailyDuration = currentDuration + currentRecord.totalDurationDaily;
      let monthDuration = currentDuration + currentRecord.totalDurationMonth;

      const [dailyHours, dailyMinutes] = formatDuration(dailyDuration);
      const [totalHourMonth, totalMinuteMonth] = formatDuration(monthDuration);

      const embed = new EmbedBuilder()
         .setColor('#ff4b4b')
         .setTitle(`🌖 ${message.member.displayName} Off Duty Successfully`)
         .addFields({
            name: '> 📌 Ca học đã kết thúc:',
            value: [
               `\`\`\`yaml\n🔹Bắt đầu: ${formatDateTime(
                  currentRecord.createdAt
               )}\n🔹Kết thúc: ${end}\`\`\``,
               '> 💼 Tổng thời gian:',
               `\`\`\`yaml\n🔹Thời gian: ${duration}\`\`\``,
               `🗓️ **Tổng hôm nay:** ${dailyHours} giờ ${dailyMinutes} phút`,
               `📆 **Tổng tháng này:** ${totalHourMonth} giờ ${totalMinuteMonth} phút`,
               '',
               '👏 *Cảm ơn bạn đã hoàn thành ca học này!*',
            ].join('\n'),
            inline: false,
         })
         .setFooter({
            text: `Thực hiện bởi ${message.member.displayName}`,
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
         })
         .setTimestamp();

      await message.channel.send({ embeds: [embed] });

      await removeStudent(message.member.id);
      await handleAttendanceData(message.member.id, currentDuration);
   }
};

export const handleMessageStatus = async (message) => {
   const userOnDuty = await getStudent(message.member.id);

   if (!userOnDuty) {
      await message.reply(
         `❌ <@${message.member.id}>, bạn hiện chưa *On Duty* rồi!\n` +
            '> Vui lòng gõ lệnh `!onduty` để bắt đầu vào ca học nào.'
      );
   } else {
      const duration = timeDifference(userOnDuty.createdAt);

      const embed = new EmbedBuilder()
         .setColor('#3498db')
         .setTitle(`📚 Xin chào: ${message.member.displayName}`)
         .addFields({
            name: '> 📌 Hiện tại bạn đang trong ca học của mình!:',
            value: [
               `\`\`\`yaml\n🔹Đã học được: ${duration}\`\`\``,
               `🕒 **Bắt đầu từ:** ${formatDateTime(userOnDuty.createdAt)}`,
               '',
               `👏 *Cảm ơn bạn đã tham gia ca học hôm nay!*`,
            ].join('\n'),
            inline: false,
         })
         .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
         .setFooter({
            text: `Thực hiện bởi ${message.member.displayName}`,
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
         })
         .setTimestamp();

      await message.channel.send({ embeds: [embed] });
   }
};

export const handleHelpCommand = (message) => {
   message.reply(
      `📘 **Hướng dẫn sử dụng lệnh On Off Duty:**\n\n` +
         `🔹 \`!onduty\` - Bắt đầu ca học\n` +
         `🔹 \`!offduty\` - Kết thúc ca học\n` +
         `🔹 \`!status\` - Kiểm tra trạng thái hiện tại\n` +
         `🔹 \`!help\` - Hiển thị hướng dẫn này\n\n` +
         `📌 **Lưu ý:** Các lệnh chỉ hoạt động trong kênh On Off Duty.\n` +
         '> Vui lòng sử dụng đúng kênh để bot phản hồi chính xác.\n' +
         `<@${message.member.id}> - Chúc bạn có một ngày học tập vui vẻ.`
   );
};
