import dotenv from 'dotenv';

import { getCachedMemberInfo, saveCacheMember } from '../cache/redisCache.js';
import { getDiscordClient } from '../library/discordClient.js';

dotenv.config();

const guild_id = process.env.GUILD_ID;

const isValidDiscordID = (id) => {
   // Kiểm tra xem ID có phải là số và có độ dài hợp lệ không
   return /^\d+$/.test(id) && id.length >= 17;
};

export const getDisplayName = async (discord_id) => {
   const clientDiscord = getDiscordClient();

   // Kiểm tra đầu vào
   if (!discord_id || !isValidDiscordID(discord_id) || clientDiscord == null) {
      return 'Unknown!';
   }

   // Thử lấy từ cache trước
   const memberNameCached = await getCachedMemberInfo(discord_id, guild_id);
   if (memberNameCached) {
      return memberNameCached.displayName;
   }

   try {
      const guild = await clientDiscord.guilds.fetch(guild_id);
      const member = await guild.members.fetch(discord_id);
      const displayName = member.displayName;

      // Lưu vào cache thông tin Member
      await saveCacheMember(discord_id, guild_id, {
         displayName,
      });

      return displayName;
   } catch (error) {
      console.warn(`Could not fetch member ${discord_id}:`, error.message);
      return 'Unknown!';
   }
};
