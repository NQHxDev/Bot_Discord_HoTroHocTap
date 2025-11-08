import ms from 'ms';
import redisClient from './redisClient.js';

const cacheConfig = {
   data: Math.floor(ms('30 minutes') / 1000),
   guildMember: Math.floor(ms('1 hour') / 1000),
   sessionUser: Math.floor(ms('3 days') / 1000),
};

const ATT_HASH = 'attendance';
const MEMBER_CACHE_HASH = 'guild_member';

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

   const ttlSeconds = cacheConfig.sessionUser;

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

/**
 * Lấy thông tin member từ cache
 */
export const getCachedMemberInfo = async (discordId, guildId) => {
   const cacheKey = `${guildId}:${discordId}`;
   try {
      const raw = await redisClient.hGet(MEMBER_CACHE_HASH, cacheKey);
      if (!raw) return null;

      const response = JSON.parse(raw);

      // Kiểm tra xem cache còn valid không (theo TTL của hash)
      return response;
   } catch (error) {
      console.warn('Error reading member cache:', error);
      return null;
   }
};

/**
 * Lưu thông tin member vào cache
 */
export const saveCacheMember = async (discordId, guildId, memberInfo) => {
   const cacheKey = `${guildId}:${discordId}`;
   try {
      const pipeline = redisClient.multi();

      console.log(JSON.stringify(memberInfo));

      pipeline.hSet(MEMBER_CACHE_HASH, cacheKey, JSON.stringify(memberInfo));
      pipeline.expire(MEMBER_CACHE_HASH, cacheConfig.guildMember);
      await pipeline.exec();

      return true;
   } catch (error) {
      console.warn('Error caching member info:', error);
      return false;
   }
};

/**
 * Xóa cache của một member cụ thể
 */
export const removeCachedMember = async (discordId, guildId) => {
   const cacheKey = `${guildId}:${discordId}`;
   try {
      await redisClient.hDel(MEMBER_CACHE_HASH, cacheKey);
      return true;
   } catch (error) {
      console.warn('Error removing member cache:', error);
      return false;
   }
};
