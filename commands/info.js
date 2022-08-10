const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

let ParsedItemDatas = {}
const jsonData = require('../ItemData.json')

const ModuleOrder = ["Weapon", "Defense", "Engine", "Reactor", "Subsystem"]
const TurretOrder = ["Small", "Medium", "Point", "Fixed"]

for (let type in jsonData) {
    for (let itemclass in jsonData[type]) {
        let itemClassObject = jsonData[type][itemclass]
        for (let item in itemClassObject) {
            let itemObject = itemClassObject[item]
            ParsedItemDatas[`${type} | ${itemObject[0]}`] = [itemObject, type, itemclass]
        }
    }
}

function CreateText(textObject, inBetween, FieldInfo, AddToEnd) {
    if (!AddToEnd) { AddToEnd = "" }
    let Text = ``
    let ObjectKeys = Object.keys(textObject)
    for (let index in ObjectKeys) {
        TextName = ObjectKeys[index]
        TextValue = textObject[TextName]
        Text += `**${TextName}${inBetween}** ${TextValue}${AddToEnd}`
        if (index != ObjectKeys.length - 1) {
            Text += `\n`
        }
    }
    if (FieldInfo[0]) {
        let embed = FieldInfo[1]
        let title = FieldInfo[2]

        embed.addFields({ name: title, value: Text, inline: true })
    }
    return Text
}

function LoopThrough(StatsObject, Order) {
    let itemField = {}
    for (let index in Order) {
        const itemName = Order[index]
        const itemAmount = StatsObject[itemName]
        if (itemAmount != 0 && itemAmount) {
            itemField[itemName] = itemAmount
        }
    }
    return itemField
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Retrieve the info about a item.')
        .addStringOption(option =>
            option.setName('item')
                .setDescription('The name of the item that you want to retrieve info about.')
                .setAutocomplete(true)),
    async execute(interaction) {
        let InfoEmbed = undefined;
        let text = interaction.options.get('item').value
        const filtered = Object.keys(ParsedItemDatas).filter(choice => choice.toLowerCase().includes(text.toLowerCase()));
        text = filtered[0]
        let itemData = ParsedItemDatas[text]

        let itemStats = itemData[0]
        let type = itemData[1]
        if (!itemStats) return

        InfoEmbed = new EmbedBuilder()
            .setTitle(itemStats[0])

        if (type === "Ship") {
            let hull = itemStats[1]
            let shield = itemStats[2]
            let turrets = itemStats[3]
            let mobility = itemStats[4]
            let modules = itemStats[5]
            let energy = itemStats[6]
            let bonuses = itemStats[7]
            let stealth = itemStats[9]
            let cargo = itemStats[10]
            let limit = itemStats[11]
            let bullet = itemStats[12]

            let TurretField
            let ModuleField
            let BulletField
            let LimitField
            let BonusField = ``

            TurretField = LoopThrough(turrets, TurretOrder)
            ModuleField = LoopThrough(modules, ModuleOrder)
            BulletField = LoopThrough(bullet, ["Damage", "Speed", "Rate", "Yield"])
            LimitField = LoopThrough(limit, ["Combat", "Mining"])

            for (let bonus in bonuses) {
                const bonusAmount = bonuses[bonus]
                const text = `**${bonus}:** ${bonusAmount}x\n`
                BonusField += text
            }

            InfoEmbed.setFooter({ text: `${type} Type > ${itemData[2]} Class > ${itemStats[8]} Size` })

            CreateText({ "Base": hull['Base'], "Armor": hull['Armor'], "Regen": hull['Regen'] }, ":", [true, InfoEmbed, "> **Hull**"])
            CreateText({ "Base": shield['Base'], "Deflection": shield['Armor'], "Regen": shield['Regen'] }, ":", [true, InfoEmbed, "> **Shield**"])
            CreateText({ "Total Base": shield['Base'] + hull['Base'], "Total Resistance": shield['Armor'] + hull['Armor'], "Total Regen": shield['Regen'] + hull['Regen'] }, ":", [true, InfoEmbed, "> **Total HP**"])
            CreateText({ "Max Speed": mobility['Base'] * 2, "Acceleration": mobility['Acceleration'] * 2, "Agility": mobility['Agility'] }, ":", [true, InfoEmbed, "> **Mobility**"])
            CreateText({ "Warp Charge": mobility['Warp Charge Time'], "Warp Speed": mobility['Warp Speed'] / 100, "Vertical Speed": mobility['Vertical'] }, ":", [true, InfoEmbed, "**-**"])
            CreateText({ "Signal Range": stealth[1], "Sensor Strength": stealth[0] }, ":", [true, InfoEmbed, "> **Stealth**"])
            CreateText({ "Base": energy['Base'].toString().substring(0, 5), "Regen": energy['Regen'].toString().substring(0, 5) }, ":", [true, InfoEmbed, "> **Energy**"])
            if (Object.keys(BulletField).length >= 1) { CreateText(BulletField, ":", [true, InfoEmbed, "> **Bullet**"], "x") }
            if (Object.keys(LimitField).length >= 1) { CreateText(LimitField, ":", [true, InfoEmbed, "> **Turret Limit**"]) }
            if (BonusField.length >= 1) { InfoEmbed.addFields({ name: `> **Role Bonuses**`, value: BonusField, inline: true }) }
            if (Object.keys(TurretField).length >= 1) { CreateText(TurretField, ":", [true, InfoEmbed, "> **Turrets**"]) }
            if (cargo >= 1) { CreateText({ "Cargo Capacity": cargo }, ":", [true, InfoEmbed, "> **Cargo**"]) }
            CreateText(ModuleField, ":", [true, InfoEmbed, "> **Modules**"])
        } else if (type === "Turret") {
            let size = itemStats[1]
            let fireType = itemStats[2]

            let stats = itemStats[3]
            let range = stats['Range'] * 2
            let speed = stats['Speed'] * 2
            let rate = stats['Rate']
            let damage = stats['Damage']
            let turning = stats['Turning']
            let accuracy = stats['Accuracy']
            let miningYield = stats['Yield']
            let precision = stats['Precision']
            let charge = stats['Charge']
            let iceYield = stats['IceYield']
            let fallOff = stats['Falloff']

            let DamageText = ``
            let MiningText = ``
            let MobilityText = ``
            let MobilityText2 = ``

            let DamagePerSecond = (rate * damage) / 60
            if (charge) {
                let x = (60 / rate)
                let y = 60/(x+charge)
                DamagePerSecond = y * (damage/60)
            }

            if (damage) { DamageText += `**Bullet Damage:** ${damage}\n` }
            if (rate) { DamageText += `**Fire Rate:** ${rate}\n` }
            if (DamagePerSecond >= 1) { DamageText += `**Damage Per Second:** ${DamagePerSecond.toString().substring(0, 5)}` }
            
            if (miningYield) { MiningText += `**Yield:** ${miningYield} / Minute\n` }
            if (precision) { MiningText += `**Precision:** ${precision}%\n` }
            if (iceYield) { MiningText += `**Ice Yield:** ${(iceYield * 100).toString().substring(0, 5)}%` }

            if (range) { MobilityText += `**Bullet Range:** ${range}\n` }
            if (speed) { MobilityText += `**Bullet Speed:** ${speed} / Second\n` }
            if (fallOff) { MobilityText += `**Bullet Falloff:** ${fallOff}x` }

            if (turning) { MobilityText2 += `**Turning Rate:** ${turning}\n` }
            if (charge) { MobilityText2 += `**Charge Time:** ${charge}\n` }
            if (accuracy) { MobilityText2 += `**Accuracy:** ${accuracy}` }

            if (DamageText.length >= 1) { InfoEmbed.addFields({ name: "> **Damage**", value: DamageText, inline: true }) }
            if (MiningText.length >= 1) { InfoEmbed.addFields({ name: "> **Mining**", value: MiningText, inline: true }) }
            if (MobilityText.length >= 1) { InfoEmbed.addFields({ name: "> **Range**", value: MobilityText, inline: true }) }
            if (MobilityText2.length >= 1) { InfoEmbed.addFields({ name: "> **Mobility**", value: MobilityText2, inline: true }) }

            InfoEmbed.setFooter({ text: `${type} Type > ${fireType} Class > ${size} Size` })
        } else if (type = "Module") {

        }

        interaction.reply({ embeds: [InfoEmbed] })
    }
}