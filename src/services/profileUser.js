import path from 'path';
import { AttachmentBuilder, EmbedBuilder } from 'discord.js';

import { getCurrentRank, getRankProgress } from '../library/rankSystem.js';
import { formatVietnameseDate, formatDuration, formatDateTime } from '../utils/dateTime.js';
import {
   getDataStudent,
   getStudentKPI,
   getMonthlyUserRank,
   getRankDuration,
} from '../controllers/databaseController.js';

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

export const userNotRole = async (message) => {
   const embedFail = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle(`🚫 Không có quyền sử dụng lệnh`)
      .setDescription(
         `Rất tiếc, bạn không có quyền sử dụng lệnh này trong hệ thống.\n\n` +
            `📌 Vui lòng liên hệ quản trị viên hoặc đảm bảo bạn đã được phân quyền phù hợp để thực hiện lệnh này.`
      )
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setFooter({
         text: `Thực hiện bởi ${message.member.displayName}`,
         iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

   await message.channel.send({ embeds: [embedFail] });
};

// Message: !help
export const handleMessageHelpCommand = async (message) => {
   message.reply(
      `📘 **Hướng dẫn sử dụng các lệnh Kiểm tra:**\n\n` +
         `🔹 \`!myinfo\` - Xem thông tin cá nhân\n` +
         `🔹 \`!myrank\` - Xem thông tin thành tựu cá nhân\n` +
         `🔹 \`!kpi\` - Xem tiến hộ hoàn thành cá nhân trong tháng\n` +
         `🔹 \`!ranking\` - Xem bảng xếp hạng học viên xuất sắc trong tháng\n` +
         `🔹 \`!top\` - Xem bảng xếp hạng các học viên xuất sắc nhất\n` +
         `🔹 \`!help\` - Hiển thị hướng dẫn này\n\n` +
         `📌 **Lưu ý:** Các lệnh chỉ hoạt động trong kênh Check Time.\n` +
         '> Vui lòng sử dụng đúng kênh để bot phản hồi chính xác.\n' +
         `<@${message.member.id}> - Chúc bạn xem được những thông tin hữu ích.`
   );
};

// Message: !myinfo
export const handleMessageCheckInfo = async (message) => {
   const footerImage = new AttachmentBuilder(
      path.join(process.cwd(), 'src', 'images', 'background.jpg')
   );
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
            `\`\`\`yaml\n> ${getCurrentRank(currentStudent.total_duration)}\`\`\``,
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

// Message: !kpi
export const handleMessageCheckKPI = async (message) => {
   const studentKPI = await getStudentKPI(message.member.id);

   if (!studentKPI) {
      return studentNotFound(message);
   }

   const [totalHours, totalMinutes] = formatDuration(studentKPI.totalMinutesMonth);
   const [longestHours, longestMinutes] = formatDuration(studentKPI.longestStudyMinutes);
   const [avgHours, avgMinutes] = formatDuration(studentKPI.avgMinutesPerStudyDay);

   const embedSuccess = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle(`📊 Thống kê KPI tháng học tập:`)
      .addFields(
         {
            name: '> 👤 Học viên: <@${message.member.id}>',
            value: `^.^`,
            inline: false,
         },
         {
            name: '⏳ Tổng thời gian học trong tháng:',
            value: `\`> ${totalHours} giờ ${totalMinutes} phút\``,
            inline: true,
         },
         {
            name: '📅 Số ngày học trong tháng:',
            value: `\`> ${studentKPI.studyDaysCount} ngày\``,
            inline: true,
         },
         {
            name: '\u200B',
            value: '\u200B',
            inline: true,
         },
         {
            name: '📊 Trung bình mỗi ngày học:',
            value: `\`> ${avgHours} giờ ${avgMinutes} phút\``,
            inline: true,
         },
         {
            name: '🏅 Ngày học lâu nhất:',
            value: `\`> ${longestHours} giờ ${longestMinutes} phút\``,
            inline: true,
         },
         {
            name: '\u200B',
            value: '\u200B',
            inline: true,
         },
         {
            name: '🔥 Chuỗi ngày học dài nhất:',
            value: `\`> ${studentKPI.longestStreakDays} ngày liên tiếp\``,
            inline: true,
         },
         {
            name: '\u200B',
            value: '\u200B',
            inline: true,
         },
         {
            name: '> *💡 Hãy duy trì thói quen học tập đều đặn để đạt kết quả tốt hơn!*',
            value: '',
            inline: false,
         }
      )
      .setTimestamp();

   embedSuccess.setFooter({
      text: `📌 KPI System • Update at: ${formatDateTime(new Date())}`,
   });

   await message.channel.send({ embeds: [embedSuccess] });
};

// Message: !myrank
export const handleMessageMyRank = async (message) => {
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

// Message: !ranking
export const handleMessageRanking = async (message, month = null) => {
   const rankingData = await getMonthlyUserRank(month);

   if (!rankingData || rankingData.length === 0) {
      return message.channel.send('❌ Không có dữ liệu xếp hạng trong tháng này.');
   }
   const topOnDuty = rankingData.slice(0, 20);

   // Tạo danh sách hiển thị
   const rankingList = topOnDuty
      .map((user, index) => {
         const rank = index + 1;
         const emoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `🎖️`;

         return `${emoji} • **${user.display_name}**  *➜*  ⏳ \`${user.str_duration}\``;
      })
      .join('\n');

   const embedRanking = new EmbedBuilder()
      .setColor('#f1c40f')
      .setTitle(
         `🪩  Bảng Xếp Hạng Onduty Tháng ${rankingData[0].month}/${rankingData[0].year}\n> Top 20:`
      )
      .setDescription(rankingList)
      .setFooter({
         text: `📌 Ranking System`,
      })
      .setTimestamp();

   await message.channel.send({ embeds: [embedRanking] });
};

// Message: !top
export const handleMessageTop = async (message) => {
   const topDurationData = await getRankDuration();

   if (!topDurationData || topDurationData.length === 0) {
      return message.channel.send('❌ Không có dữ liệu thời lượng hoạt động.');
   }

   const rankingList = topDurationData
      .map((user, index) => {
         const rank = index + 1;
         const emoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🎖️';
         return `${emoji} • **${user.display_name}**  *➜*  ⏳ \`${user.total_duration} phút\``;
      })
      .join('\n');

   const embedTopDuration = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('📊 Bảng Xếp Hạng Tổng Thời Gian Hoạt Động\n> Top 10:')
      .setDescription(rankingList)
      .setFooter({ text: '📌 Ranking System' })
      .setTimestamp();

   await message.channel.send({ embeds: [embedTopDuration] });
};
