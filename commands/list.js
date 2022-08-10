const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const jsonData = require('../ItemData.json')

let ListChoices = []

for (let type in jsonData) {
  let typeObject = jsonData[type]
  ListChoices.push(`Type | ${type}`)
  for (let itemClass in typeObject) {
    ListChoices.push(`${type} | ${itemClass}`)
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('lists all the objects in a type or class.')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('The name of the type or class.')
        .setAutocomplete(true)),
  async execute(interaction) {
    let text = interaction.options.get('name').value
    const filtered = ListChoices.filter(choice => choice.toLowerCase().includes(text.toLowerCase()));
    text = filtered[0]
    let TextArray = text.split(" ")
    let type = TextArray[0]
    let category = TextArray[2]
    let valueText = ``
    let objects
    if (type == "Type") {
      objects = Object.keys(jsonData[category])
      objects.sort();
      objects.forEach(key => {
        valueText += `${category} | ${key}\n`
      })
    } else {
      objects = jsonData[type][category]
      objects.sort();
      objects.forEach(key => {
        valueText += `${key[8] || key[2]} | ${key[0]}\n`
      })
    }
    if (objects) {
      
      valueText += `**--------------------------------**`
      const InfoEListEmbedmbed = new EmbedBuilder()
        .setTitle(`A List Of ${text}s`)
        .setFooter({ text: `all the objects inside ${text}` })
        .addFields({ name: `--------------------------------`, value: valueText })

      interaction.reply({ embeds: [InfoEListEmbedmbed] })
    } else interaction.reply({ content: "That is not a valid option, please choose a valid option."})
  }
}       