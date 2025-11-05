export const gerRankingLearn = (totalDuration) => {
   const ranks = [
      { name: 'Nhà trẻ', duration: 0 },
      { name: 'Mẫu giáo', duration: 30 * 60 },
      { name: 'Tiểu học', duration: 90 * 60 },
      { name: 'Trung học cơ sở', duration: 180 * 60 },
      { name: 'Trung học phổ thông', duration: 300 * 60 },
      { name: 'Sơ cấp nghề', duration: 450 * 60 },
      { name: 'Trung cấp nghề', duration: 630 * 60 },
      { name: 'Cao đẳng nghề', duration: 840 * 60 },
      { name: 'Tú tài', duration: 1080 * 60 },
      { name: 'Cử nhân', duration: 1350 * 60 },
      { name: 'Thạc sĩ', duration: 1650 * 60 },
      { name: 'Tiến sĩ', duration: 1980 * 60 },
      { name: 'Chuyên gia', duration: 2340 * 60 },
      { name: 'Trạng nguyên', duration: 2730 * 60 },
      { name: 'Tư tưởng gia', duration: 3150 * 60 },
      { name: 'Hiền triết', duration: 3600 * 60 },
      { name: 'Đại hiền nhân', duration: 4050 * 60 },
      { name: 'Học giả vũ trụ', duration: 4500 * 60 },
      { name: 'Người khai sáng', duration: 5500 * 60 },
   ];

   // Tính tổng thời gian tích lũy cho mỗi rank
   let cumulativeDuration = 0;
   const ranksWithCumulative = ranks.map((rank) => {
      cumulativeDuration += rank.duration;
      return {
         ...rank,
         cumulativeDuration: cumulativeDuration,
      };
   });

   const currentIndex = ranksWithCumulative.findLastIndex(
      (rank) => totalDuration >= rank.cumulativeDuration
   );

   // Tìm rank hiện tại dựa trên totalDuration
   const currentRank = ranksWithCumulative[currentIndex];
   const nextRank = ranksWithCumulative[currentIndex + 1] || null;

   const progressToNextRank = nextRank
      ? parseFloat(
           Math.min(
              ((totalDuration - currentRank.cumulativeDuration) /
                 (nextRank.cumulativeDuration - currentRank.cumulativeDuration)) *
                 100,
              100
           ).toFixed(2)
        )
      : 0;

   return {
      currentRank: currentRank.name,
      nextRank: nextRank?.name || null,
      progressToNextRank,
      totalDuration,
      requiredDurationForNext: nextRank ? nextRank.cumulativeDuration - totalDuration : 0,
   };
};

// Ví dụ sử dụng:
// console.log(gerRankingLearn(35850));
