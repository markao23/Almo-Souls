import { Client, GatewayIntentBits, Events, Collection, User } from 'discord.js';
import * as dotenv from 'dotenv';
import { readdir, readFile, writeFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path'
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import path from 'path'

dotenv.config()
const client = new Client({
    intents: [
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences
    ]
});

const dataFilePath = join(__dirname, 'data', 'data.json');
const commands = new Collection<string, any>();

async function ensureDataFileExists() {
    const dir = path.dirname(dataFilePath)
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true }); // Cria o diretório se não existir
    }
    if (!existsSync(dataFilePath)) {
        // Cria o arquivo com conteúdo padrão se não existir
        await writeFile(dataFilePath, JSON.stringify({ userCommandCounts: {} }, null, 2));
    }
}

async function loadCommands() {
    const commandsDirs = [join(__dirname, 'commands'), join(__dirname, 'slashcommands')];
    try {
        for (const commandsDir of commandsDirs) {
            const files = await readdir(commandsDir);
            for (const file of files) {
                if (file.endsWith('.ts') || file.endsWith('.js')) {
                    const commandModule = await import(join(commandsDir, file));
                    const command = commandModule.default || commandModule
                    commands.set(command.name, command)
                }
            }
        }
    } catch (error) {
        console.error('Erro ao carregar comandos:', error);
    }
}

async function registerCommands(commands: { [key: string]: any }) {
    const clientId = process.env.CLIENT_ID!
    const guildId = process.env.GUILD_ID!
    const token = process.env.TOKEN!
    const rest = new REST({ version: '9' }).setToken(token);

    try {
        console.log('Iniciando o registro de comandos de barra...');
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
            body: commands,
        });
        console.log('Comandos registrados com sucesso!');
    } catch (error) {
        console.error('Erro ao registrar comandos:', error);
    }
}

async function readData() {
    await ensureDataFileExists()
    try {
        const data = await readFile(dataFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erro ao ler o arquivo de dados:', error);
        return { userCommandCounts: {} }; // Retorne um objeto padrão se houver erro
    }
}

async function writeData(data: any) {
    try {
       await writeFile(dataFilePath, JSON.stringify(data, null, 2))
    } catch (error) {
        console.error('Erro ao escrever no arquivo de dados:', error);
    }
}

async function updateCommandCount(user: User, commandName: string) {
    const data = await readData()

    if (!data.userCommandCounts) {
        data.userCommandCounts = {};
    }
    if (!data.userCommandCounts[user.id]) {
        data.userCommandCounts[user.id] = {};
    }
    if (!data.userCommandCounts[user.id][commandName]) {
        data.userCommandCounts[user.id][commandName] = 0;
    }

    data.userCommandCounts[user.id][commandName]++;
    console.log(`Atualizando contagem: Usuário: ${user.username}, Comando: ${commandName}, Contagem: ${data.userCommandCounts[user.id][commandName]}`);
    await writeData(data);
}

client.once(Events.ClientReady, async () => {
    console.log(`bot Logado ${client.user?.tag}`);
    await loadCommands();
});
(async () => {
   await registerCommands(commands)
})();
client.on('messageCreate', async (message) => {
    if(message.author.bot) return;

    if(!message.content.startsWith(process.env.PREFIX!)) return;

    const args = message.content.slice(process.env.PREFIX?.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase()
    const command = commands.get(commandName!)
    if (command) {
        await command.execute(message)
        await updateCommandCount(message.author, command.name);
    }
})

client.login(process.env.TOKEN);