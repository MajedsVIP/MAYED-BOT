const fs = require('node:fs');
const path = require('node:path');
const {
  Client,
  GatewayIntentBits,
  Routes,
  SlashCommandBuilder,
  InteractionType,
  EmbedBuilder,
  Collection,
} = require('discord.js')
const { REST } = require('@discordjs/rest');
const jsonData = require('./ItemData.json')

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
let commandsBody = []
const commandsPath = './commands';
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = commandsPath + `/${file}`
	const command = require(filePath);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
  commandsBody.push(command.data.toJSON());
  console.log(command.data.name + " successfully added")
}

config();

const TOKEN = 'MTAwMjg0NTEwOTA0MzMzMTE0Mw.GudVwe.fLzCb1kQN84KlvXc5Z8vZEEyLwf0iDwTRTt7y8';
const CLIENT_ID = '1002845109043331143';
const GUILD_ID = '986083709792960554';

let ListChoices = []

for (let type in jsonData) {
  let typeObject = jsonData[type]
  ListChoices.push(`Type | ${type}`)
  for (let itemClass in typeObject) {
    ListChoices.push(`${type} | ${itemClass}`)
  }
}

let ItemChoices = []

for (let type in jsonData) {
  for (let itemclass in jsonData[type]) {
    let itemClassObject = jsonData[type][itemclass]
    for (let item in itemClassObject) {
      let itemObject = itemClassObject[item]
      ItemChoices.push(`${type} | ${itemObject[0]}`)
    }
  }
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

client.on('ready', () => console.log(`${client.user.tag} has logged in!`));

client.on('interactionCreate', async interaction => {
  if (interaction.type !== InteractionType.ApplicationCommandAutocomplete) return;

  if (interaction.commandName === 'info') {
    const focusedValue = interaction.options.getFocused()
    const filtered = ItemChoices.filter(choice => choice.toLowerCase().includes(focusedValue.toLowerCase()));
    await interaction.respond(
        filtered.slice(0, 24).map(choice => ({ name: choice, value: choice })),
    );
  }

  if (interaction.commandName === 'list') {
    const focusedValue = interaction.options.getFocused()
    const filtered = ListChoices.filter(choice => choice.toLowerCase().includes(focusedValue.toLowerCase()));
    await interaction.respond(
      filtered.slice(0, 24).map(choice => ({ name: choice, value: choice })),
    );
  }
});

console.log(client.commands)

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;
  
	const command = client.commands.get(interaction.commandName);

	if (!command) return;
  
	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: `something went wrong while executing /${interaction.commandName}.`, ephemeral: true });
	}
});

(async () => {
	try {
		console.log('Started refreshing application (/) commands.');

		await rest.put(
			Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
			{ body: commandsBody },
		);

		console.log('Successfully reloaded application (/) commands.');
    client.login(TOKEN);
	} catch (error) {
		console.error(error);
	}
})();
