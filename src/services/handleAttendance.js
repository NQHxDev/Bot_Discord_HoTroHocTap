import { EmbedBuilder } from 'discord.js';

import attendanceSystem from '../library/dataAttendance.js';
import { formatDateTime, timeDifference, totalMinutes, formatDuration } from '../utils/dateTime.js';
import {
   handleAttendanceData,
   getDurationToday,
   getDurationMonth,
} from '../controllers/databaseController.js';

export const handleMessageOnDuty = async (message) => {
   if (attendanceSystem.findRecords(message.member.id)) {
      await message.reply(
         `❌ <@${message.member.id}>, bạn hiện đang *On Duty* rồi!\n` +
            '> Vui lòng gõ lệnh `!offduty` trước khi bật lại chế độ này nhé.'
      );
   } else {
      const [date, time] = formatDateTime(new Date()).split(' - ');

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
      attendanceSystem.pushRecords(
         message.member.id,
         message.member.displayName,
         new Date(),
         monthDuration.totalDurationMonth,
         dailyDuration
      );
   }
};

export const handleMessageOffDuty = async (message) => {
   const userOnDuty = attendanceSystem.findRecords(message.member.id);

   if (!userOnDuty) {
      await message.reply(
         `❌ <@${message.member.id}>, bạn hiện chưa *On Duty* rồi!\n` +
            '> Vui lòng gõ lệnh `!onduty` để bắt đầu vào ca học nào.'
      );
   } else {
      const [start, end] = [userOnDuty.timeOnDuty, formatDateTime(new Date())];
      const duration = timeDifference(start);

      const currentDuration = totalMinutes(duration);
      let dailyDuration = currentDuration;
      let monthDuration = currentDuration;

      const currentRecord = attendanceSystem.findRecords(message.member.id);
      if (currentRecord) {
         dailyDuration += currentRecord.dailyDuration;
         monthDuration += currentRecord.monthDuration;
      }

      const [totalHourMonth, totalMinuteMonth] = formatDuration(monthDuration);
      const [dailyHours, dailyMinutes] = formatDuration(dailyDuration);

      const embed = new EmbedBuilder()
         .setColor('#ff4b4b')
         .setTitle(`🌖 ${message.member.displayName} Off Duty Successfully`)
         .addFields({
            name: '> 📌 Ca học đã kết thúc:',
            value: [
               `\`\`\`yaml\n🔹Bắt đầu: ${formatDateTime(start)}\n🔹Kết thúc: ${end}\`\`\``,
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
      attendanceSystem.removeRecords(message.member.id);
      await handleAttendanceData(message.member.id, dailyDuration, monthDuration, currentDuration);
   }
};
