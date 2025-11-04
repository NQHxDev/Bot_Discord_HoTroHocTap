const attendanceSystem = {
   records: new Map(),

   pushRecords(userID, userName, timeStart) {
      this.records.set(userID, {
         name: userName,
         timeOnDuty: timeStart,
      });
   },

   popRecords(userID) {
      this.records.delete(userID);
   },

   findRecords(userID) {
      return this.records.get(userID);
   },

   // Method xem thống kê
   getStats() {
      return {
         total: this.records.size,
         present: Array.from(this.records.values()).length,
      };
   },

   resetData() {
      this.records.clear();
      console.log('{/} Đã xóa toàn bộ dữ liệu điểm danh hàng ngày!');
   },
};

export default attendanceSystem;
