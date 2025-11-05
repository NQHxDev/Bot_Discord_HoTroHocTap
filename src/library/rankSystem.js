class RankSystem {
   constructor() {
      console.log('{/} RankSystem đang khởi tạo...');

      this.ranks = [
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

      this._initializeCache();
      console.log('{/} RankSystem khởi tạo thành công!');
   }

   _initializeCache() {
      let cumulative = 0;
      this.ranksWithCumulative = this.ranks.map((rank) => {
         cumulative += rank.duration;
         return { ...rank, cumulativeDuration: cumulative };
      });

      // Khởi tạo Map
      this.rankMap = new Map();
      this.ranksWithCumulative.forEach((rank, index) => {
         this.rankMap.set(rank.name, { ...rank, index });
      });

      this.maxRank = this.ranksWithCumulative[this.ranksWithCumulative.length - 1];
      this.maxDuration = this.maxRank.cumulativeDuration;
   }

   getCurrentRank(totalDuration) {
      if (totalDuration >= this.maxDuration) {
         return this.maxRank.name;
      }

      let left = 0;
      let right = this.ranksWithCumulative.length - 1;
      let result = this.ranksWithCumulative[0];

      while (left <= right) {
         const mid = Math.floor((left + right) / 2);
         const rank = this.ranksWithCumulative[mid];

         if (totalDuration >= rank.cumulativeDuration) {
            result = rank;
            left = mid + 1;
         } else {
            right = mid - 1;
         }
      }

      return result.name;
   }

   getRankProgress(totalDuration) {
      if (totalDuration >= this.maxDuration) {
         return {
            currentRank: this.maxRank.name,
            nextRank: null,
            progressToNextRank: 100,
            totalDuration,
            requiredDurationForNext: 0,
         };
      }

      const currentIndex = this.ranksWithCumulative.findLastIndex(
         (rank) => totalDuration >= rank.cumulativeDuration
      );

      const currentRank = this.ranksWithCumulative[currentIndex];
      const nextRank = this.ranksWithCumulative[currentIndex + 1];

      const progressToNextRank = nextRank
         ? parseFloat(
              Math.min(
                 ((totalDuration - currentRank.cumulativeDuration) /
                    (nextRank.cumulativeDuration - currentRank.cumulativeDuration)) *
                    100,
                 100
              ).toFixed(2)
           )
         : 100;

      return {
         currentRank: currentRank.name,
         nextRank: nextRank?.name || null,
         progressToNextRank,
         totalDuration,
         requiredDurationForNext: nextRank ? nextRank.cumulativeDuration - totalDuration : 0,
      };
   }

   getRankByName(name) {
      return this.rankMap.get(name);
   }

   getAllRanks() {
      return [...this.ranksWithCumulative];
   }

   getRankCount() {
      return this.ranks.length;
   }
}

let rankSystemInstance = null;

export const getRankSystem = () => {
   if (!rankSystemInstance) {
      rankSystemInstance = new RankSystem();
   }
   return rankSystemInstance;
};

const rankSystem = getRankSystem();

export const getCurrentRank = (totalDuration) => rankSystem.getCurrentRank(totalDuration);
export const getRankProgress = (totalDuration) => rankSystem.getRankProgress(totalDuration);
export default rankSystem;
