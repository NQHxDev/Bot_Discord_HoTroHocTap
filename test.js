export const handleMessageRankings = async (message) => {
   const rankingData = await getMonthlyUserRank();

   if (!rankingData || rankingData.length === 0) {
      return message.channel.send('❌ Không có dữ liệu xếp hạng trong tháng này.');
   }

   const top20 = rankingData.slice(0, 20);

   const header = `**SỐ GIỜ ON DUTY - KHOA CẤP CỨU THƯƠNG 4**\n`;
   const lines = top20.map((user, index) => {
      const rank = index + 1;
      const emoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `🔹`;
      return `${rank}. ${emoji} ${user.display_name} ⏳ ${user.str_duration}`;
   });

   const footer = `\nBan Quản Lý EMS - Cập nhật mỗi thứ 4 • Hôm nay lúc ${formatDateTime(
      new Date()
   )}`;

   const messageContent = [header, ...lines, footer].join('\n');

   await message.channel.send(messageContent);
};

export const handleMessageRanking = async (message) => {
   const rankingData = await getMonthlyUserRank();

   if (!rankingData || rankingData.length === 0) {
      return message.channel.send('Hiện trong danh sách chưa có dữ liệu!');
   }

   // Lấy top 20
   const top20 = rankingData.slice(0, 20);

   const header = `**🏅 Bảng Xếp Hạng Onduty Tháng** ${rankingData[0].month}/${rankingData[0].year}\n`;
   const lines = top20.map((user, index) => {
      const rank = index + 1;
      const emoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `🎖️`;
      return `${rank}. ${emoji} ${user.display_name} ⏳ ${user.str_duration}`;
   });

   const footer = `📌 Ranking System • Update at: ${formatDateTime(new Date())}`;

   const messageContent = [header, ...lines, footer].join('\n');

   await message.channel.send(messageContent);
};
