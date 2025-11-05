import { getDB, closeDB } from '../configs/connectDatabase.js';

export const handleAttendanceData = async (
   userID,
   newDailyDuration,
   newMonthDuration,
   currentDuration = 0,
   monthAttendance = null
) => {
   let db;
   try {
      db = await getDB();

      const now = new Date();
      const monthStr =
         monthAttendance || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // --- 1) update / upsert attendancesDaily for today
      const updateDailyRecord = async () => {
         const todayStart = new Date();
         todayStart.setHours(0, 0, 0, 0);
         const tomorrow = new Date(todayStart);
         tomorrow.setDate(tomorrow.getDate() + 1);

         // Tìm xem đã có điểm danh chưa
         const existing = await db.collection('attendancesDaily').findOne({
            userId: userID,
            createdAt: { $gte: todayStart, $lt: tomorrow },
         });

         if (existing) {
            // cập nhật duration + updatedAt
            const result = await db.collection('attendancesDaily').updateOne(
               { _id: existing._id },
               {
                  $set: {
                     duration: newDailyDuration,
                     updatedAt: new Date(),
                  },
               }
            );
         } else {
            // Tạo mới record cho ngày hôm nay
            const doc = {
               userId: userID,
               duration: newDailyDuration,
               createdAt: new Date(),
               updatedAt: new Date(),
            };
            const { insertedId } = await db.collection('attendancesDaily').insertOne(doc);
         }
      };

      // --- 2) update / upsert attendancesMonthly for current month
      const updateMonthlyRecord = async () => {
         // Tìm bản ghi tháng hiện tại
         const existingMonth = await db.collection('attendancesMonthly').findOne({
            userId: userID,
            month: monthStr,
         });

         if (existingMonth) {
            // Cập nhật các field
            const updateFields = {
               totalDurationMonth: newMonthDuration,
               updatedAt: new Date(),
            };
            await db
               .collection('attendancesMonthly')
               .updateOne({ _id: existingMonth._id }, { $set: updateFields });
         } else {
            // Tạo mới bản ghi tháng
            const doc = {
               userId: userID,
               month: monthStr,
               totalDurationMonth: newMonthDuration,
               createdAt: new Date(),
               updatedAt: new Date(),
            };
            const { insertedId } = await db.collection('attendancesMonthly').insertOne(doc);
         }
      };

      // --- 3) update / upsert students
      const updateStudentRecord = async () => {
         if (currentDuration < 0 || typeof currentDuration !== 'number' || isNaN(currentDuration)) {
            currentDuration = 0;
         }

         const query = { userId: userID };

         const update = {
            $inc: { totalDuration: Math.round(currentDuration) },
            $set: { updatedAt: new Date() },
            $setOnInsert: { userId: userID, createdAt: new Date(), updatedAt: new Date() },
         };

         await db.collection('students').updateOne(query, update, { upsert: true });
      };

      await updateDailyRecord();
      await updateMonthlyRecord();
      await updateStudentRecord();
   } catch (error) {
      console.error('Error handleAttendanceDaily:', error.message);
      throw error;
   } finally {
      if (db) await closeDB();
   }
};

export const getDurationToday = async (userID, date = null) => {
   let db;
   try {
      db = await getDB();

      // Nếu không truyền ngày thì lấy ngày hôm nay
      const targetDate = date ? new Date(date) : new Date();
      targetDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(targetDate);
      nextDate.setDate(targetDate.getDate() + 1);

      // Lấy bản ghi điểm danh trong ngày
      const record = await db.collection('attendancesDaily').findOne({
         userId: userID,
         createdAt: { $gte: targetDate, $lt: nextDate },
      });

      await closeDB();

      if (!record) {
         return 0;
      }
      return record.duration || 0;
   } catch (error) {
      console.error('❌ Error getDurationToday:', error.message);
      await closeDB();
      return 0;
   }
};

export const getDurationMonth = async (userID, month = null) => {
   let db;
   try {
      db = await getDB();

      // Nếu không truyền tháng thì mặc định lấy tháng hiện tại
      let targetMonth = month;
      if (!targetMonth) {
         const now = new Date();
         const year = now.getFullYear();
         const monthNum = String(now.getMonth() + 1).padStart(2, '0');
         targetMonth = `${year}-${monthNum}`;
      }

      // Tìm bản ghi trong tháng
      const record = await db.collection('attendancesMonthly').findOne({
         userId: userID,
         month: targetMonth,
      });

      // Nếu không có dữ liệu, trả về giá trị mặc định
      if (!record) {
         return {
            totalDurationMonth: 0,
            studyDays: 0,
            averageDaily: 0,
            maxDaily: 0,
         };
      }

      // Trả về nguyên bản ghi
      return {
         totalDurationMonth: record.totalDurationMonth || 0,
         studyDays: record.studyDays || 0,
         averageDaily: record.averageDaily || 0,
         maxDaily: record.maxDaily || 0,
      };
   } catch (error) {
      console.error('Error getDurationMonth:', error.message);
      return {
         totalDurationMonth: 0,
         studyDays: 0,
         averageDaily: 0,
         maxDaily: 0,
      };
   } finally {
      if (db) await closeDB();
   }
};

export const getDataStudent = async (userID) => {
   let db;
   try {
      db = await getDB();
      const record = await db.collection('students').findOne({ userId: userID });
      if (!record) {
         return null;
      }

      return {
         totalDuration: record.totalDuration,
         startLearn: record.createdAt,
         lastUpdate: record.updatedAt,
      };
   } catch (error) {
      console.error('❌ Error getTotalDurationAllTime:', error.message);
      return 0;
   } finally {
      if (db) await closeDB();
   }
};
