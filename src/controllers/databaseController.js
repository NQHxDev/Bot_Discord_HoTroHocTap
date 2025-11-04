import { getDB, closeDB } from '../configs/connectDatabase.js';

const findAttendanceDaily = async (userID) => {
   try {
      const db = await getDB();

      // Lấy ngày hôm nay
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Tìm bản ghi trong ngày hôm nay
      const result = await db.collection('attendancesDaily').findOne({
         userId: userID,
         createdAt: {
            $gte: today,
            $lt: tomorrow,
         },
      });
      return result;
   } catch (error) {
      console.log('Error find Attendance Daily:', error.message);
      return null;
   } finally {
      await closeDB();
   }
};

export const handleAttendanceDaily = async (userID, additionalDuration) => {
   let db;
   try {
      const existingRecord = await findAttendanceDaily(userID);

      if (existingRecord) {
         const newDuration = existingRecord.duration + additionalDuration;

         db = await getDB();
         const result = await db.collection('attendancesDaily').updateOne(
            {
               _id: existingRecord._id,
            },
            {
               $set: {
                  duration: newDuration,
                  updatedAt: new Date(),
               },
            }
         );
      } else {
         // Tạo mới bản ghi cho ngày hôm nay
         const attendancesDaily = {
            userId: userID,
            duration: additionalDuration,
            createdAt: new Date(),
            updatedAt: null,
         };

         db = await getDB();
         await db.collection('attendancesDaily').insertOne(attendancesDaily);
         console.log(`✅ Đã tạo bản ghi mới: ${additionalDuration} phút`);
      }

      // Cập nhật thống kê tháng
      await updateAttendancesMonthly(userID);
   } catch (error) {
      console.log('Error handle Attendance Daily:', error.message);
   } finally {
      if (db) {
         await closeDB();
      }
   }
};

const updateAttendancesMonthly = async (userID = null) => {
   let db;
   try {
      db = await getDB();

      const currentDate = new Date();
      const currentMonth = currentDate.toISOString().substring(0, 7);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const startOfNextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

      const matchCondition = {
         createdAt: { $gte: startOfMonth, $lt: startOfNextMonth },
      };

      if (userID) matchCondition.userId = userID;

      const monthlyStats = await db
         .collection('attendancesDaily')
         .aggregate([
            { $match: matchCondition },
            {
               $addFields: {
                  durationNumber: {
                     $cond: [{ $ifNull: ['$duration', false] }, { $toDouble: '$duration' }, 0],
                  },
               },
            },
            {
               $group: {
                  _id: '$userId',
                  totalDurationMonth: { $sum: '$durationNumber' },
                  studyDays: { $sum: 1 },
                  averageDaily: { $avg: '$durationNumber' },
                  firstStudy: { $min: '$createdAt' },
                  lastStudy: { $max: '$updatedAt' },
                  maxDaily: { $max: '$durationNumber' },
               },
            },
         ])
         .toArray();

      if (monthlyStats.length > 0) {
         const bulkOps = monthlyStats.map((stats) => ({
            updateOne: {
               filter: { userId: stats._id, month: currentMonth },
               update: {
                  $set: {
                     totalDurationMonth: Math.round(stats.totalDurationMonth),
                     studyDays: stats.studyDays,
                     averageDaily: Math.round(stats.averageDaily),
                     maxDaily: stats.maxDaily,
                     lastStudy: stats.lastStudy || new Date(),
                     updatedAt: new Date(),
                  },
                  $setOnInsert: {
                     userId: stats._id,
                     month: currentMonth,
                     firstStudy: stats.firstStudy,
                     createdAt: new Date(),
                  },
               },
               upsert: true,
            },
         }));

         await db.collection('attendancesMonthly').bulkWrite(bulkOps);
      } else if (userID) {
         await db.collection('attendancesMonthly').updateOne(
            { userId: userID, month: currentMonth },
            {
               $set: {
                  totalDurationMonth: 0,
                  studyDays: 0,
                  averageDaily: 0,
                  maxDaily: 0,
                  updatedAt: new Date(),
               },
               $setOnInsert: {
                  createdAt: new Date(),
                  firstStudy: new Date(),
                  userId: userID,
                  month: currentMonth,
               },
            },
            { upsert: true }
         );
      }
   } catch (error) {
      console.error('Error update monthly attendance:', error.message);
   } finally {
      if (db) await closeDB();
   }
};

export const getDurationToday = async (userID) => {
   try {
      const db = await getDB();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayRecord = await db.collection('attendancesDaily').findOne({
         userId: userID,
         createdAt: {
            $gte: today,
            $lt: tomorrow,
         },
      });

      await closeDB();

      if (todayRecord) {
         return {
            dailyHours: Math.floor(todayRecord.duration / 60),
            dailyMinutes: todayRecord.duration % 60,
         };
      }
      return {
         dailyHours: 0,
         dailyMinutes: 0,
      };
   } catch (error) {
      console.log('Error get duration today:', error.message);
      await closeDB();
      return {
         dailyHours: 0,
         dailyMinutes: 0,
      };
   }
};

export const getDurationMonth = async (userID) => {
   let db;
   try {
      db = await getDB();

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const monthlyStats = await db
         .collection('attendancesDaily')
         .aggregate([
            {
               $match: {
                  userId: userID,
                  createdAt: { $gte: startOfMonth, $lt: startOfNextMonth },
               },
            },
            {
               $addFields: {
                  durationNum: {
                     $cond: [{ $isNumber: '$duration' }, '$duration', { $toDouble: '$duration' }],
                  },
               },
            },
            {
               $group: {
                  _id: null,
                  totalDuration: { $sum: '$durationNum' },
                  studyDays: { $sum: 1 },
               },
            },
         ])
         .toArray();

      if (monthlyStats.length === 0) {
         return { totalDuration: 0, studyDays: 0, averageDaily: 0 };
      }

      const { totalDuration, studyDays } = monthlyStats[0];
      const averageDaily = Math.round(totalDuration / studyDays);

      return {
         totalDuration: Math.round(totalDuration),
         studyDays,
         averageDaily: isNaN(averageDaily) ? 0 : averageDaily,
      };
   } catch (error) {
      console.error('❌ Error getDurationMonth:', error);
      return { totalDuration: 0, studyDays: 0, averageDaily: 0 };
   } finally {
      await closeDB();
   }
};
