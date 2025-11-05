const attendanceSystem = {
   records: new Map(),

   pushRecords(userID, userName, timeStart, monthDuration = 0, dailyDuration = 0) {
      this.records.set(userID, {
         name: userName,
         timeOnDuty: timeStart,
         monthDuration: monthDuration,
         dailyDuration: dailyDuration,
      });
   },

   removeRecords(userID) {
      this.records.delete(userID);
   },

   findRecords(userID) {
      return this.records.get(userID);
   },

   resetData() {
      this.records.clear();
      console.log('{/} Đã xóa toàn bộ dữ liệu điểm danh hàng ngày!');
   },
};

export default attendanceSystem;
