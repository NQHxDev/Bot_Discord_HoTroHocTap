import clientServer from '../../server.js';

const isValidDiscordID = (id) => {
   // Kiểm tra xem ID có phải là số và có độ dài hợp lệ không
   return /^\d+$/.test(id) && id.length >= 17;
};

export const getDisplayName = async (discord_id) => {
   // Kiểm tra discord_id
   if (!discord_id || !isValidDiscordID(discord_id)) {
      return 'Unknown!';
   }

   const guild = await clientServer.guilds.fetch('1370338529640452136');
   const discordId = String(discord_id).trim();
   let displayName = `User ${discordId}`;

   try {
      const member = await guild.members.fetch(discordId);
      displayName = member.displayName;
      return displayName;
   } catch (error) {
      return `Unknown!`;
   }
};
