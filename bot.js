const { Client, GatewayIntentBits, Collection } = require('discord.js')
require('dotenv').config()

const client = new Client({
    intents: [
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent
    ]
})
client.commands = new Collection()

// const pra carrecar os comandos 
const path = require('path')
const fs = require('fs')

const commandFiles = fs.readFileSync(path.join(__dirname, "commands")).filter(file => file.endsWith('.js'))
for(const file of commandFiles){
    const command = require(`./commands/${file}`)
    client.command.set(command.name, command)
}

client.on('ready', () => {
    console.log(`Bot logado ${client.user.tag}`);
})

client.on('messageCreate', async (message) => {
    if(message.author.bot) return;
    if(!message.content.startsWith('b@')) return

    const args = message.content.slice(1).trim().split(/ +/)
    const commandName = args.shift().toLocaleLowerCase()

    const command = client.commands.get(commandName);

    if (command) {
        try {
            await command.execute(message)
        } catch (error) {
            console.error(error);
            await message.reply('Houve um erro ao executar esse comando!')
        }
    }
})

client.login(process.env.TOKEN);