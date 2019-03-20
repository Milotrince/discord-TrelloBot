const Discord = require('discord.js')

module.exports = {
    alias: ['status'],
    args: ['(Board ID)'],
    help: "Show info about client",
    permissions: [],
    func: (Client, message, args, db) => {

        if (args.length > 0) {
            db.all(`SELECT * FROM boards WHERE guildID =${message.channel.guild.id}`, [], (err, boards) => {
                if (err) return Client.log(err.message)
                
                let board = boards.find((b) => {return b.boardID == args[0]})
                if (!board) return message.channel.send("Invalid board.")

                let embed = new Discord.RichEmbed({
                    author: {
                        name: Client.bot.user.username,
                        icon_url: Client.bot.user.displayAvatarURL,
                    },
                    title: `Board Information`,
                    fields: [
                        {
                            name: `Board ID`,
                            value: board.boardID,
                            inline: true
                        },
                        {
                            name: `Discord Channel`,
                            value: message.guild.channels.get(board.channelID).name,
                            inline: true
                        },
                        {
                            name: `Linked Users`,
                            value: board.users.length > 0 ?
                            board.users.split(',').join(', ') : "None",
                            inline: true
                        },
                        {
                            name: `Posts Suppressed?`,
                            value: board.suppressEvents ?
                                `Yes (Reactivate using ${Client.config.prefix}enable)` :
                                `No (Temporarily suppress using ` +
                                    `${Client.config.prefix}disable)`,
                            inline: true
                        },
                        {
                            name: `Enabled Events`,
                            value: Client.limitLength(
                                board.enabledEvents.split(',').join(', '), 1024),
                            inline: true
                        }
                    ],
                    color: 0x026aa7
                })
                message.channel.send('', {embed:embed
                }).catch(err => console.error(err))
            })

        } else {
            db.serialize(() => {
                db.run(`CREATE TABLE IF NOT EXISTS boards(boardID TEXT, guildID TEXT,
                    channelID TEXT, users TEXT, prefix TEXT, enabledEvents TEXT,
                    suppressEvents BOOLEAN)`, [], (err) => {
                        if (err) Client.log(err.message)}
                )
        
                db.all(`SELECT * FROM boards WHERE guildID =${message.channel.guild.id}`, [], (err, boards) => {
                    if (err) return Client.log(err.message)
                    
                    let boardIDs = [];
                    for (i = 0; i < boards.length; i++) {
                        if (!boardIDs.includes(boards[i].boardID))
                            boardIDs.push(boards[i].boardID)
                    }
                    
                    let embed = new Discord.RichEmbed({
                        author: {
                            name: Client.bot.user.username,
                            icon_url: Client.bot.user.displayAvatarURL,
                        },
                        title: `Client Information`,
                        fields: [
                            {
                                name: `Discord Servers`,
                                value: Client.bot.guilds.size,
                                inline: true
                            },
                            {
                                name: `Trello Boards in ${message.channel.guild}`,
                                value: boardIDs.length > 0 ?
                                    boardIDs.join(", ") : "None",
                                inline: true
                            },
                            {
                                name: `Prefix`,
                                value: Client.config.prefix,
                                inline: true
                            },
                            {
                                name: `Poll Interval`,
                                value: Math.round(Client.config.pollInterval / 100) / 10 +
                                    ` seconds`,
                                inline: true
                            }
                        ],
                        color: 0x026aa7
                    })
                    message.channel.send('', {embed:embed
                    }).catch(err => console.error(err))

                })
            })
        }

    }
}