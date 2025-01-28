const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js')
require('dotenv').config()

const client = new Client({
    intents: [
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent
    ]
})
client.commands = new Collection()
client.slashCommands = new Collection();

// const pra carrecar os comandos 
const path = require('path')
const fs = require('fs')

const commandFiles = fs.readFileSync(path.join(__dirname, "commands")).filter(file => file.endsWith('.js'))
for(const file of commandFiles){
    const command = require(`./commands/${file}`)
    client.command.set(command.name, command)
}

//carregar os comandos de barra
const slashCommandFiles = fs.readFileSync(path.join(__dirname, 'slashCommands')).filter(file => file.endsWith('.js'))
for(const file of slashCommandFiles){
    const slashCommand = require(`./slashCommands/${file}`)
    client.slashCommand.set(slashCommand.name, slashCommand)
}

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN)

(async () => {
    try {
        console.log('Iniciando o registro de comandos de barra...')
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), {
            body: slashCommandFiles.map(file => require(`./slashCommands/${file}`)),
        });
        console.log('Comandos de barra registrados com sucesso!');
    } catch (error) {
        console.error(error);
    }
})

// evento pra os comandos de barra 
client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand()) {
        const command = client.slashCommands.get(interaction.commandName)
        if (command) {
            try {
                await command.execute(interaction)
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'Houve um erro ao executar esse comando!', ephemeral: true });
            }
        }
    }
})

client.on('ready', () => {
    console.log(`Bot logado ${client.user.tag}`);
})

client.on('messageCreate', async (message) => {
    if(message.author.bot) return;
    const prefix = 'b@';
    if(!message.content.startsWith(prefix)) return

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