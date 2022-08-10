const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction, ComponentType } = require("discord.js");

let UsersActive = []

let Systems = require('../Systems.json')
let SystemsColor = require('../SystemsColor.json')

const ColorNames = {
    ['B']: "Blue",
    ['A']: "Light Blue",
    ['F']: "White",
    ['G']: "Yellow",
    ['K']: "Orange",
    ['M']: "Red",
}

function CreateEmbed(Colors, MainColor) {
    let MainColorName = ColorNames[MainColor]
    if (!MainColorName) { MainColorName = "None Set" }
    let Embed = new EmbedBuilder()
        .setTitle("Beacon Solver")
        .setDescription("Use the **buttons** below to fill out the values that wich the bot requires to solve your ancient beacon.\nThe bot will provide you the name of the system or a list of the systems that match with the data that you've provided.\nMake sure you insert *all* of the connection colors. **(IMPORTANT)**")
        .addFields({ name: `**Main System**`, value: `**Color:** ${ColorNames[MainColor]}`, inline: true })
    let ColorText = ``
    Object.keys(Colors).forEach(Color => {
        let ColorAmount = Colors[Color]
        if (ColorAmount != 0) {
            ColorText += `**${ColorNames[Color]}:** ${ColorAmount}\n`
        }
    })
    if (ColorText.length == 0) {
        ColorText = "**None Added**"
    }
    Embed.addFields({ name: `**Connected Systems Colors**`, value: `${ColorText}`, inline: true })
    return Embed
}

function CountObject(ObjectInstance) {
    let num = 0
    Object.keys(ObjectInstance).forEach(key => {
        num += ObjectInstance[key]
    })
    return num
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('beacon')
        .setDescription('solves your beacons using patterns.'),
    async execute(interaction) {
        let UserID = interaction.user.id
        if (UsersActive.filter(element => element == UserID).length >= 1) { interaction.reply({ content: "a instance of this command is already running, please cancel said instance before trying to start a new instance!", ephemeral: true }); return }
        UsersActive.push(UserID)
        let SelectedColors = { ['B']: 0, ['A']: 0, ['F']: 0, ['G']: 0, ['K']: 0, ['M']: 0 }
        let MainColor = "None"
        let BeaconEmbed = CreateEmbed(SelectedColors, MainColor)

        let Selected = 0

        const SelectionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('Main System')
                    .setLabel('Main System')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('Connected Systems')
                    .setLabel('Connected Systems')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('Cancel')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('Submit')
                    .setLabel('Submit')
                    .setStyle(ButtonStyle.Success)
            )
        const ColorRow1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('colorbutton-B')
                    .setEmoji('1004442068170588160')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('colorbutton-A')
                    .setEmoji('1004442072876584961')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('colorbutton-F')
                    .setEmoji('1004442091335733338')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('Clear')
                    .setLabel('Clear')
                    .setStyle(ButtonStyle.Danger)
            )
        const ColorRow2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('colorbutton-G')
                    .setEmoji('1004442096717008978')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('colorbutton-K')
                    .setEmoji('1004442079285493760')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('colorbutton-M')
                    .setEmoji('1004442085396590672')
                    .setStyle(ButtonStyle.Secondary)
            )

        const message = await interaction.reply({
            embeds: [BeaconEmbed],
            components: [SelectionRow, ColorRow1, ColorRow2],
            ephemeral: true
        })

        function UpdateEmbed() { interaction.editReply({ embeds: [CreateEmbed(SelectedColors, MainColor)], }) }
        function UpdateButton() { interaction.editReply({ components: [SelectionRow, ColorRow1, ColorRow2] }) }
        function FailedRemove(Button) {
            Button.deferUpdate()
                .then()
                .catch(console.error);
        }

        const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 10 * 1000 });

        collector.on('collect', buttonInteraction => {
            let customId = buttonInteraction.customId
            if (customId.startsWith("colorbutton")) {
                let Color = buttonInteraction.customId.split('-')[1]
                if (Selected == 1) {
                    SelectedColors[Color] += 1
                } else if (Selected == 0) {
                    MainColor = Color
                }
                FailedRemove(buttonInteraction)
                UpdateEmbed()
            } else if (customId == 'Main System') {
                SelectionRow.components[0].setStyle(ButtonStyle.Primary)
                SelectionRow.components[1].setStyle(ButtonStyle.Secondary)
                Selected = 0
                UpdateButton()
                FailedRemove(buttonInteraction)
                UpdateEmbed()
            } else if (customId == 'Connected Systems') {
                SelectionRow.components[1].setStyle(ButtonStyle.Primary)
                SelectionRow.components[0].setStyle(ButtonStyle.Secondary)
                Selected = 1
                UpdateButton()
                FailedRemove(buttonInteraction)
                UpdateEmbed()
            } else if (customId == 'Submit') {
                FailedRemove(buttonInteraction)
                let connection_count = CountObject(SelectedColors)
                if (MainColor == "None") { interaction.followUp({ content: "Please define a main system color.", ephemeral: true }); return }
                if (connection_count == 0) { interaction.followUp({ content: "Please enter a minimum of one connected system.", ephemeral: true }); return }

                let Results = []
                let ResultsText = ``

                SystemsColor[MainColor].forEach(SystemID => {
                    let SystemStats = Systems[SystemID]
                    let ConnectedSystems = SystemStats['connected_i'].split(',')

                    let CurrentSystemConnectedColors = {
                        ['B']: 0,
                        ['A']: 0,
                        ['F']: 0,
                        ['G']: 0,
                        ['K']: 0,
                        ['M']: 0
                    }
                    let NumberChecker = 0
                    let TargetSystemConnectionColors = SelectedColors
                    ConnectedSystems.forEach(SelectedSystemID => {
                        let SelectedSystemStats = Systems[SelectedSystemID]
                        CurrentSystemConnectedColors[SelectedSystemStats['spectral']] += 1
                    })
                    Object.keys(TargetSystemConnectionColors).forEach(Color => {
                        let ColorAmount = TargetSystemConnectionColors[Color]
                        if (CurrentSystemConnectedColors[Color] >= ColorAmount) {
                            NumberChecker += 1
                        }
                    })

                    if (NumberChecker == 6 && SystemStats['security'] == "Wild") {
                        if (SystemStats["connection_count"] == connection_count) {
                            Results.push(SystemStats['name'])
                        }
                    }

                    collector.stop("Results have been sent and operation has been cancelled.")
                });

                if (Results.length == 0) { Results = `No Systems Found!` }

                Results.sort();
                Results.forEach(result => {
                    ResultsText += `${result}\n`
                })

                let ResultEmbed = new EmbedBuilder()
                    .setTitle("Results")
                    .setDescription(ResultsText)

                interaction.followUp({ embeds: [ResultEmbed], ephemeral: true })
            } else if (customId == 'Cancel') {
                UpdateButton()
                collector.stop('Operation cancelled.')
            } else if (customId == 'Clear') {
                SelectedColors = { ['B']: 0, ['A']: 0, ['F']: 0, ['G']: 0, ['K']: 0, ['M']: 0 }
                FailedRemove(buttonInteraction)
                UpdateEmbed()
            }
        })

        collector.on('end', (c, reason) => {
            UsersActive.pop(UserID)
            if (reason == 'time') {
                interaction.followUp({ content: "You took too long, your `/beacon` Operation has been cancelled.", ephemeral: true })
            } else {
                interaction.followUp({ content: reason, ephemeral: true })
            }
        })
    }
}