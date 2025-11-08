let discordClient = null;

export const setDiscordClient = (client) => {
   discordClient = client;
};

export const getDiscordClient = () => discordClient;
