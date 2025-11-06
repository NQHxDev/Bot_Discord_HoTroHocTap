import ms from 'ms';

import redisClient from './redisClient.js';
import { json } from 'express';

const ttlSeconds = 3 * 24 * 60 * 60; // Lưu cache trong 3 ngày

const ATT_HASH = 'attendance';

// getStudent
export async function getStudent(memberID) {
   const raw = await redisClient.hGet(ATT_HASH, String(memberID));
   if (!raw) return null;
   try {
      return JSON.parse(raw);
   } catch {
      return null;
   }
}

export const hasCacheStudent = async (memberID) => {
   return await redisClient.hExists(ATT_HASH, String(memberID));
};

export async function pushStudent({ memberID, totalDurationDaily, totalDurationMonth }) {
   if (!memberID) throw new Error('memberID required');

   // Kiểm tra tồn tại trong hash
   const exists = await redisClient.hExists(ATT_HASH, String(memberID));
   if (exists) {
      const existing = await redisClient.hGet(ATT_HASH, String(memberID));
      return { ok: false, reason: 'exists', existing: JSON.parse(existing) };
   }

   const payload = {
      totalDurationDaily,
      totalDurationMonth,
      createdAt: new Date(),
   };

   // Lưu vào hash
   const pipeline = redisClient.multi();
   pipeline.hSet(ATT_HASH, String(memberID), JSON.stringify(payload));
   pipeline.expire(ATT_HASH, ttlSeconds);
   await pipeline.exec();

   return { ok: true, ttlSeconds, payload };
}

export async function removeStudent(memberID) {
   const pipeline = redisClient.multi();
   pipeline.hDel(ATT_HASH, String(memberID));
   await pipeline.exec();
   return true;
}
