const { Client, GatewayIntentBits } = require('discord.js')
require('dotenv').config()

const client = new Client({
    intents: [
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent
    ]
})

client.on('ready', () => {
    console.log(`Bot logado ${client.user.tag}`);
})

client.login(process.env.TOKEN);