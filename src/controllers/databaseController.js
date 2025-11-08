import connectionPool from '../configs/connectDatabase.js';

import { getDisplayName } from '../services/discord.js';
import { formatDuration, getYearMonth, formatDateTwoNumber } from '../utils/dateTime.js';

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

      const yearMonth = getYearMonth(month);
      if (!yearMonth) return 0;

      const [rows] = await conn.execute(
         `SELECT SUM(duration_minutes) AS totalDurationMonth
          FROM attendance_daily
          WHERE discord_id = ? AND MONTH(attendance_day) = ? AND YEAR(attendance_day) = ?`,
         [userID, yearMonth.monthIndex, yearMonth.year]
      );

      return rows?.[0]?.totalDurationMonth ? Number(rows[0].totalDurationMonth) : 0;
   } catch (err) {
      console.error("Error getting connection for month's duration:", err.message);
      return 0;
   } finally {
      if (conn) conn.release();
   }
};

/**
 * Trả về tổng phút học tháng
 * Trung bình số phút học trong tháng
 * Trả về số ngày đã học trong tháng
 * Trả về thời gian của ngày học lâu nhất
 * Trả về kỉ lục chuỗi học dài nhất trong tháng
 **/
export const getStudentKPI = async (userID, month = null) => {
   let conn;
   const buildEmpty = () => {
      return {
         totalMinutesMonth: 0,
         avgMinutesPerStudyDay: 0,
         studyDaysCount: 0,
         longestStudyMinutes: 0,
         longestStreakDays: 0,
      };
   };

   try {
      conn = await connectionPool.getConnection();

      const yearMonth = getYearMonth(month);
      if (!yearMonth) return buildEmpty();

      const { year, monthIndex } = yearMonth;

      const [summary] = await conn.execute(
         `SELECT
            COALESCE(SUM(duration_minutes), 0) AS totalMinutesMonth,
            COUNT(*) AS studyDaysCount,
            COALESCE(MAX(duration_minutes), 0) AS longestStudyMinutes
         FROM attendance_daily
         WHERE discord_id = ?
            AND MONTH(attendance_day) = ?
            AND YEAR(attendance_day) = ?
         `,
         [userID, monthIndex, year]
      );

      // Nếu không có bản ghi nào
      if (!summary || summary.length === 0 || summary[0].studyDaysCount === 0) {
         return buildEmpty();
      }

      const { totalMinutesMonth, studyDaysCount, longestStudyMinutes } = summary[0];
      const avgMinutesPerStudyDay =
         studyDaysCount > 0 ? Number((totalMinutesMonth / studyDaysCount).toFixed(2)) : 0;

      const [rows] = await conn.execute(
         `
            SELECT attendance_day
            FROM attendance_daily
            WHERE discord_id = ?
               AND MONTH(attendance_day) = ?
               AND YEAR(attendance_day) = ?
            ORDER BY attendance_day ASC
         `,
         [userID, monthIndex, year]
      );

      let longestStreakDays = 0;
      let currentStreak = 0;
      let prevDate = null;

      for (const row of rows) {
         const date = new Date(row.attendance_day);
         if (prevDate) {
            const diff = (date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
            if (diff === 1) {
               currentStreak++;
            } else {
               longestStreakDays = Math.max(longestStreakDays, currentStreak);
               currentStreak = 1;
            }
         } else {
            currentStreak = 1;
         }
         prevDate = date;
      }
      longestStreakDays = Math.max(longestStreakDays, currentStreak);

      return {
         totalMinutesMonth: Number(totalMinutesMonth),
         avgMinutesPerStudyDay,
         studyDaysCount: Number(studyDaysCount),
         longestStudyMinutes: Number(longestStudyMinutes),
         longestStreakDays,
      };
   } catch (err) {
      console.error('Error in getStudentKPI:', err.message);
      return buildEmpty();
   } finally {
      if (conn) conn.release();
   }
};

/**
 * Nếu month null thì lấy Rank của tháng hiện tại
 * Trả về top 20 người có thời gian Onduty lâu nhất trong tháng (theo total minutes)
 *
 * @param month định dạng dd/MM/yyyy | số tháng (1-12) | null
 * @param {number|string|null} month
 * @returns {Promise<Array<{discord_id: string, total_minutes: number, total_hours: string}>>}
 */
export const getMonthlyUserRank = async (month = null) => {
   // Lấy year và monthIndex từ hàm đã cho
   const yearMonth = getYearMonth(month);
   if (!yearMonth) {
      throw new Error(`Invalid month parameter - ${yearMonth}`);
   }
   const { year, monthIndex } = yearMonth;

   // Tính ngày bắt đầu và kết thúc của month
   const startDate = `${year}-${formatDateTwoNumber(monthIndex)}-01`;
   const lastDay = new Date(year, monthIndex, 0).getDate();
   const endDate = `${year}-${formatDateTwoNumber(monthIndex)}-${formatDateTwoNumber(lastDay)}`;

   /**
    * Tính tổng duration_minutes theo discord_id
    * Lọc theo attendance_day BETWEEN startDate AND endDate
    */
   const query = `
      SELECT
         ad.discord_id,
         SUM(ad.duration_minutes) AS total_minutes
      FROM attendance_daily AS ad
      WHERE ad.attendance_day BETWEEN ? AND ?
      GROUP BY ad.discord_id
      ORDER BY total_minutes DESC
      LIMIT 20;
   `;

   let conn;
   try {
      conn = await connectionPool.getConnection();
      const [rows] = await conn.execute(query, [startDate, endDate]);

      const result = await Promise.all(
         rows.map(async (record) => {
            const totalMinutes = Number(record.total_minutes) || 0;
            const [hour, minute] = formatDuration(totalMinutes);
            const strDuration = `${hour} giờ ${minute} phút`;

            const discordID = String(record.discord_id);

            return {
               discord_id: discordID,
               display_name: await getDisplayName(discordID),
               total_minutes: totalMinutes,
               str_duration: strDuration,
               year,
               month: monthIndex,
            };
         })
      );

      return result;
   } catch (err) {
      throw new Error(`Failed to get monthly user rank: ${err.message}`);
   } finally {
      if (conn) conn.release();
   }
};

/**
 * Hàm trả về Top 10 người có total_duration cao nhất
 *
 * @returns {Promise<Array<{
 *   discord_id: string,
 *   display_name: string,
 *   total_duration: string,
 *   thisRank: number
 * }>>}
 */
export const getRankDuration = async () => {
   const sql = `
      SELECT
         CAST(discord_id AS CHAR) AS discord_id,
         CAST(total_duration AS CHAR) AS total_duration
      FROM students
      WHERE status = 'active'
      ORDER BY CAST(total_duration AS UNSIGNED) DESC
      LIMIT 10;
  `;

   let conn;
   try {
      conn = await connectionPool.getConnection();
      const [rows] = await conn.execute(sql);

      const result = await Promise.all(
         rows.map(async (record, idx) => {
            const discordID = String(record.discord_id);
            const totalDuration = record.total_duration;

            return {
               discord_id: discordID,
               display_name: await getDisplayName(discordID),
               total_duration: totalDuration,
               thisRank: idx + 1,
            };
         })
      );

      return result;
   } catch (err) {
      throw new Error(`Failed to get rank duration: ${err.message}`);
   } finally {
      if (conn) conn.release();
   }
};
