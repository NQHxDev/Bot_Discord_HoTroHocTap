import connectionPool from '../configs/connectDatabase.js';

export const getDataStudent = async (userID) => {
   let conn;
   try {
      conn = await connectionPool.getConnection();
      try {
         const [rows] = await conn.execute('SELECT * FROM students WHERE discord_id = ?', [userID]);
         return rows.length > 0 ? rows[0] : null;
      } finally {
         conn.release();
      }
   } catch (err) {
      console.error('Error getting connection for student data:', err.message);
      return null;
   }
};

export const handleAttendanceData = async (userID, currentDuration = 0) => {
   let conn;
   try {
      const toInt = (v) => {
         const n = Number(v);
         if (!Number.isFinite(n) || isNaN(n)) return 0;
         return Math.max(0, Math.floor(n));
      };
      const minutes = toInt(currentDuration);

      conn = await connectionPool.getConnection();
      await conn.beginTransaction();

      const now = new Date();

      // Thêm mới hoặc Cập nhật thông tin học viên
      await updateStudyProgress(conn, userID, minutes, now);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await conn.execute(
         `INSERT INTO attendance_daily (discord_id, attendance_day, duration_minutes, last_update)
            VALUES (?, ?, ?, ?) ON DUPLICATE KEY
            UPDATE duration_minutes = duration_minutes + VALUES(duration_minutes),
         last_update = VALUES(last_update)`,
         [userID, today, minutes, now]
      );

      await conn.commit();
      return true;
   } catch (err) {
      if (conn) {
         try {
            await conn.rollback();
         } catch (e) {
            console.error('Rollback error:', e.message);
         }
      }
      console.error('Error Handle Attendance Student:', err.message);
      throw err;
   } finally {
      if (conn) conn.release();
   }
};

/**
 * Thêm mới học viên nếu chưa tồn tại trong database
 * Cập nhật thời gian học nếu sinh viên đã tồn tại
 * Cập nhật chuỗi ngày học tập liên tục
 */
async function updateStudyProgress(conn, userID, minutes, studyDate) {
   // Lấy thông tin hiện tại
   const [currentStudent] = await conn.execute(
      `SELECT current_streak, longest_streak, last_streak_update
         FROM students WHERE discord_id = ?`,
      [userID]
   );

   let currentStreak = 0;
   let longestStreak = 0;
   let lastStreakDate = null;

   if (currentStudent.length > 0) {
      currentStreak = currentStudent[0].current_streak;
      longestStreak = currentStudent[0].longest_streak;
      lastStreakDate = currentStudent[0].last_streak_update;
   }

   // Tính toán streak mới
   const isConsecutive =
      lastStreakDate &&
      new Date(lastStreakDate).toDateString() ===
         new Date(studyDate.getTime() - 24 * 60 * 60 * 1000).toDateString();

   const isSameDay =
      lastStreakDate &&
      new Date(lastStreakDate).toDateString() === new Date(studyDate).toDateString();

   // Nếu cùng ngày thì giữ nguyên current_streak
   if (isConsecutive) {
      currentStreak += 1;
   } else if (!isSameDay) {
      currentStreak = 1;
   }

   // Cập nhật longest_streak nếu chuỗi hiện tại lớn hơn
   if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
   }

   await conn.execute(
      `INSERT INTO students (
         discord_id,
         total_duration,
         current_streak,
         longest_streak,
         last_streak_update,
         created_at,
         last_update
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
         total_duration = total_duration + VALUES(total_duration),
         current_streak = VALUES(current_streak),
         longest_streak = GREATEST(longest_streak, VALUES(longest_streak)),
         last_streak_update = VALUES(last_streak_update),
         last_update = VALUES(last_update)`,
      [userID, minutes, currentStreak, longestStreak, studyDate, new Date(), new Date()]
   );
}

/**
 * Trả về tổng phút của ngày
 * date có thể là null => mặc định today;
 * hoặc chuỗi/Date có thể parse được.
 */
export const getDurationToday = async (userID, date = null) => {
   let conn;
   try {
      conn = await connectionPool.getConnection();
      try {
         let targetDate;
         if (!date) {
            targetDate = new Date();
         } else {
            targetDate = new Date(date);
            if (isNaN(targetDate.getTime())) return 0;
         }
         targetDate.setHours(0, 0, 0, 0);

         // Lấy dạng YYYY-MM-DD
         const resultDate = new Intl.DateTimeFormat('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
         }).format(targetDate);

         // Chuyển "dd/mm/yyyy" thành "yyyy-mm-dd"
         const [day, month, year] = resultDate.split('/');
         const formattedDate = `${year}-${month}-${day}`;

         const [rows] = await conn.execute(
            'SELECT duration_minutes FROM attendance_daily WHERE discord_id = ? AND attendance_day = ?',
            [userID, formattedDate]
         );

         return rows.length > 0 ? Number(rows[0].duration_minutes) : 0;
      } finally {
         conn.release();
      }
   } catch (err) {
      console.error("Error getting connection for today's duration:", err.message);
      return 0;
   }
};

/**
 * Trả về tổng phút trong tháng
 * month: null => tháng hiện tại;
 * nếu là số nguyên 1-12 => hiểu là tháng của năm hiện tại (nếu tháng > hiện tại -> trả về 0)
 * nếu truyền chuỗi/Date => lấy month & year từ đó.
 */
export const getDurationMonth = async (userID, month = null) => {
   let conn;
   try {
      conn = await connectionPool.getConnection();
      try {
         const now = new Date();
         let year, monthIndex;

         if (month === null || month === undefined) {
            year = now.getFullYear();
            monthIndex = now.getMonth() + 1;
         } else if (typeof month === 'number' && Number.isInteger(month)) {
            if (month < 1 || month > 12) return 0;
            const currentMonthIndex = now.getMonth() + 1;
            if (month > currentMonthIndex) return 0;
            year = now.getFullYear();
            monthIndex = month;
         } else {
            const parsed = new Date(month);
            if (isNaN(parsed.getTime())) return 0;
            year = parsed.getFullYear();
            monthIndex = parsed.getMonth() + 1;
         }

         const [rows] = await conn.execute(
            `SELECT SUM(duration_minutes) AS totalDurationMonth
         FROM attendance_daily
         WHERE discord_id = ? AND MONTH(attendance_day) = ? AND YEAR(attendance_day) = ?`,
            [userID, monthIndex, year]
         );

         return rows?.[0]?.totalDurationMonth ? Number(rows[0].totalDurationMonth) : 0;
      } finally {
         conn.release();
      }
   } catch (err) {
      console.error("Error getting connection for month's duration:", err.message);
      return 0;
   }
};

/**
 * Trả về tổng phút tháng, năm
 * Trung bình số phút học trong tháng hiện tại
 * Trả về chuỗi ngày học dài nhất trong tháng
 * Trả về chuôi hiện tại
 * Trả về kỉ lục chuỗi học dài nhất
 **/
