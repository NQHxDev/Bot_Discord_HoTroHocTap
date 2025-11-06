import path from 'path';
import { AttachmentBuilder, EmbedBuilder } from 'discord.js';

import { getCurrentRank, getRankProgress } from '../library/rankSystem.js';
import { formatVietnameseDate, formatDuration, formatDateTime } from '../utils/dateTime.js';
import { getDataStudent } from '../controllers/databaseController.js';

export const handleMessageCheckInfo = async (message) => {
   const footerImage = new AttachmentBuilder(path.resolve('src/images/background.jpg'));
   const currentStudent = await getDataStudent(message.member.id);

   if (!currentStudent) {
      return studentNotFound(message);
   }

   const [totalHours, totalMinutes] = formatDuration(currentStudent.total_duration);

   const embedSuccess = new EmbedBuilder()
      .setColor('#00b894')
      .setTitle(`📋 Thông tin học tập:`)
      .addFields({
         name: '> 📌 Tổng hợp hoạt động và kinh nghiệm tích lũy của bạn!\n\u200B',
         value: [
            '👤 Tên Học Viên:',
            `\`\`\`yaml\n${message.member.displayName}\`\`\``,
            '🎖️ Học Vị:',
            `\`\`\`yaml\n> ${getCurrentRank(currentStudent.totalDuration)}\`\`\``,
            '🛎️ Ngày Bắt Đầu:',
            `\`\`\`yaml\n🔹${formatVietnameseDate(currentStudent.created_at)}\`\`\``,
            '⏳ Kinh Nghiệm Tích Lũy:',
            `\`\`\`yaml\n🔹${totalHours} giờ ${totalMinutes} phút\`\`\`\n`,
         ].join('\n'),
         inline: false,
      })
      .setImage('attachment://background.jpg')
      .setFooter({
         text: '❤️ Cảm ơn những đóng góp của bạn!',
      })
      .setTimestamp();

   await message.channel.send({ embeds: [embedSuccess], files: [footerImage] });
};

export const handleMessageCheckKPI = async (message) => {};

export const handleMessageCheckRank = async (message) => {
   const currentStudent = await getDataStudent(message.member.id);

   if (!currentStudent) {
      return studentNotFound(message);
   }

   const rankProgress = getRankProgress(currentStudent.total_duration);
   const [totalHours, totalMinutes] = formatDuration(currentStudent.total_duration);
   const [hoursRequired, minutesRequired] = formatDuration(rankProgress.requiredDurationForNext);

   const embedSuccess = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle(`🏆 Hệ thống Học Vị:`)
      .addFields(
         {
            name: '> 📌 Cấp bậc nói lên trình độ học vấn của bạn!\n\u200B',
            value: [`👤 **Học Viên:** <@${message.member.id}>`, '^_^'].join('\n'),
            inline: false,
         },
         {
            name: '🎖️ Học vị hiện tại:',
            value: `\`> ${getCurrentRank(currentStudent.total_duration)} - [ ${
               rankProgress.progressToNextRank
            } % ]\``,
            inline: true,
         },
         {
            name: '🔰 Cấp bậc tiếp theo:',
            value: `\`> ${rankProgress.nextRank}\``,
            inline: true,
         },
         {
            name: '\u200B',
            value: '\u200B',
            inline: true,
         },
         {
            name: '⏳ Tổng giờ học:',
            value: `\`> ${totalHours} giờ ${totalMinutes} phút\``,
            inline: true,
         },
         {
            name: '⏳ Thời gian còn thiếu:',
            value: `\`> ${hoursRequired} giờ ${minutesRequired} phút\`\n\n`,
            inline: true,
         },
         {
            name: '\u200B',
            value: '\u200B',
            inline: true,
         },
         {
            name: '📅  Chuỗi ngày học liên tục:',
            value: [
               `\`> Dài nhất: ${currentStudent.longest_streak} buổi\``,
               `\`> Hiện tại: ${currentStudent.current_streak} buổi\``,
            ].join('\n'),
            inline: true,
         },
         {
            name: '\u200B',
            value: '\u200B',
            inline: true,
         },
         {
            name: '> *🍀 Chúc bạn sớm đạt được cấp bậc tiếp theo!*',
            value: '',
            inline: false,
         }
      )
      .setTimestamp();

   embedSuccess
      .setFooter({
         text: `🧩 Rank System! • Update at: ${formatDateTime(currentStudent.last_update)}`,
      })
      .setTimestamp();

   await message.channel.send({ embeds: [embedSuccess] });
};

const studentNotFound = async (message) => {
   const embedFail = new EmbedBuilder()
      .setColor('#d63031')
      .setTitle(`⚠️ Không tìm thấy dữ liệu học tập`)
      .setDescription(
         `Hiện tại chưa có thông tin học tập nào được ghi nhận cho <@${message.member.id}>.\n\n` +
            `📌 Hãy bắt đầu ca học bằng lệnh \`!onduty\` để hệ thống ghi nhận thời gian học của bạn.`
      )
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setFooter({
         text: `Thực hiện bởi ${message.member.displayName}`,
         iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

   await message.channel.send({ embeds: [embedFail] });
};
