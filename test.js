import { format, parse } from 'date-fns';

export const parseDateTime = (input) => {
   const [timePart, datePart] = input.split(' ');
   const [hour, minute] = timePart.split(':').map(Number);
   const [day, month, year] = datePart.split('/').map(Number);

   return new Date(year, month - 1, day, hour, minute);
};

export const formatDateTime = (date) => {
   return format(date, 'dd/MM/yyyy - HH:mm');
};

export const timeDifference = (inputDate) => {
   const now = new Date();

   const diffMs = Math.abs(now - inputDate);
   const diffMinutes = Math.floor(diffMs / (1000 * 60));
   const totalHours = Math.floor(diffMinutes / 60);
   const remainingMinutes = diffMinutes % 60;

   return `${totalHours} giờ ${remainingMinutes} phút`;
};

let now = new Date();
console.log(now);
console.log(timeDifference(now));
