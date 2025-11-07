import { format, parse } from 'date-fns';

function parseArrayValue(inputMonth) {
   if (inputMonth == null) return null;

   let value = String(inputMonth);

   if (value.includes('/')) {
      return value;
   } else {
      return Number(value);
   }
}

export const parseDateTime = (input) => {
   const [timePart, datePart] = input.split(' ');
   const [hour, minute] = timePart.split(':').map(Number);
   const [day, month, year] = datePart.split('/').map(Number);

   return new Date(year, month - 1, day, hour, minute);
};

export const formatDateTwoNumber = (numberDate) => {
   return numberDate < 10 ? `0${numberDate}` : `${numberDate}`;
};

export const formatDateTime = (date) => {
   return format(date, 'dd/MM/yyyy - HH:mm');
};

export const formatVietnameseDate = (date) => {
   const localDate = new Date(date);

   const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
   const dayName = dayNames[localDate.getDay()];

   const day = localDate.getDate().toString().padStart(2, '0');
   const month = (localDate.getMonth() + 1).toString().padStart(2, '0');
   const year = localDate.getFullYear();
   const hours = localDate.getHours().toString().padStart(2, '0');
   const minutes = localDate.getMinutes().toString().padStart(2, '0');

   return `${dayName}, ${day}/${month}/${year} - ${hours}:${minutes}`;
};

export const timeDifference = (inputDate) => {
   const now = new Date();
   const parsed = new Date(inputDate);

   if (isNaN(parsed.getTime())) {
      console.error('Invalid date format:', inputDate);
      return 'Ngày không hợp lệ';
   }

   const diffMs = Math.abs(now - parsed);
   const diffMinutes = Math.floor(diffMs / (1000 * 60));
   const totalHours = Math.floor(diffMinutes / 60);
   const remainingMinutes = diffMinutes % 60;

   return `${totalHours} giờ ${remainingMinutes} phút`;
};

export const totalMinutes = (input) => {
   const hourMatch = input.match(/(\d+)\s*giờ/);
   const minuteMatch = input.match(/(\d+)\s*phút/);

   const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
   const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;

   return hours * 60 + minutes;
};

export const formatDuration = (totalMinutes) => {
   if (totalMinutes <= 0) return [0, 0];

   const hours = Math.floor(totalMinutes / 60);
   const minutes = totalMinutes % 60;
   return [hours, minutes];
};

/**
 * Hàm xác định year và monthIndex từ tham số month
 * @param {number|string|null} month - Tháng cần xử lý
 * @returns {Object|null} { year, monthIndex } hoặc null nếu không hợp lệ
 */
export const getYearMonth = (month = null) => {
   const now = new Date();
   let year, monthIndex;

   const valueMonth = parseArrayValue(month);

   if (valueMonth === null || valueMonth === undefined) {
      year = now.getFullYear();
      monthIndex = now.getMonth() + 1;
   } else if (typeof valueMonth === 'number' && Number.isInteger(valueMonth)) {
      if (valueMonth < 1 || valueMonth > 12) return null;
      year = now.getFullYear();
      monthIndex = valueMonth;
   } else {
      const strMonth = String(valueMonth);
      if (strMonth.includes('/')) {
         const parts = strMonth.split('/');

         if (parts.length === 3) {
            // Nếu là chuỗi có dạng dd/MM/yyyy
            const [day, monthStr, yearStr] = parts;
            const d = parseInt(day, 10);
            const m = parseInt(monthStr, 10);
            const y = parseInt(yearStr, 10);

            if (isNaN(d) || isNaN(m) || isNaN(y) || m < 1 || m > 12) return null;
            year = y;
            monthIndex = m;
         } else if (parts.length === 2) {
            // Nếu là chuỗi có dạng dd/MM
            monthIndex = parseInt(parts[0], 10);
            year = parseInt(parts[1], 10);
         } else return null;
      } else {
         // Nếu là chuỗi ISO (yyyy-MM-dd hoặc tương đương)
         const parsed = new Date(valueMonth);
         if (isNaN(parsed.getTime())) return null;
         year = parsed.getFullYear();
         monthIndex = parsed.getMonth() + 1;
      }
   }
   if (isNaN(monthIndex) || isNaN(year) || monthIndex < 1 || monthIndex > 12) return null;

   return { year, monthIndex };
};
