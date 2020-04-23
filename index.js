console.log(`                                                                         
._____        _ _     _____     _   
|_   _|__ ___| | |___| __  |___| |_ 
  | ||  _| -_| | | . | __ -| . |  _|
  |_||_| |___|_|_|___|_____|___|_|  
                                    
`)

const Discord = require('discord.js')
const Trello = require('trello-events')
const fs = require('fs')
const sqlite = require('sqlite3')
const db = new sqlite.Database('./data.db', (err) => {
    if (err) return Client.log(err.message)
    Client.log('Opened database...')
})

const Client = {
    bot: new Discord.Client(),
    trello: new Trello(),
    config: require('./botconfig.json'),
    commands: {},
    log: (msg) => {
        let time = (new Date).toLocaleString('en-US') + '\t'
        if (msg.toString().toLowerCase().includes('error')) console.error(time + msg)
        else console.log(time + msg)
        if (Client.bot.channels.resolve(Client.config.testChannelID))
            Client.bot.channels.resolve(Client.config.testChannelID).send(msg)
    },
    load: (cmd) => {
        let command_files = fs.readdirSync('./commands/')
        if (cmd && command_files.includes(`${cmd}.js`)) {
            delete require.cache[require.resolve(`./commands/${cmd}.js`)]
            Client.commands[cmd] = require(`./commands/${cmd}.js`)
        } else {
            for (i = 0; i < command_files.length; i++) {
                let item = command_files[i]
                // delete the cache of the require, (for reloading)
                delete require.cache[require.resolve(`./commands/${item}`)]
                // Client.commands[cmd] = file
                Client.commands[item.slice(0, -3)] = require(`./commands/${item}`) 
            
                if (i == command_files.length-1)
                    Client.log(`Loaded ${i+1} commands...`)
            }
        }
    },
    loadBoards: () => {
        let boardIDs = []

        db.all(`SELECT * FROM boards`, [], (err, boards) => {
            if (err) return Client.log(err.message)
    
            for (i = 0; i < boards.length; i++) {
                if (!boardIDs.includes(boards[i].boardID)) {
                    boardIDs.push(boards[i].boardID)
                }
            }
            console.log(`Loaded ${boardIDs.length} boards.`)
            
            Client.trello = new Trello({
                pollFrequency: Client.config.pollInterval, // milliseconds
                minId: latestActivityID, // auto-created and auto-updated
                start: true,
                trello: {
                    boards: boardIDs, // array of Trello board IDs 
                    key: Client.config.trelloKey, // public Trello API key
                    token: Client.config.trelloToken // private Trello token for Trellobot
                } 
            })

            loadTrelloListeners()
            Client.trello.start()

        })
    },
    limitLength: (string, limit) => {
        if (string.length > limit) {
            return string.trim().slice(0, limit - 4) + `...`
        } else if (string.length < 1) {
            return '!!!'
        } else {
            return string
        }
    }
}
Client.bot.guilds.resolve()
let latestActivityID = fs.existsSync('.latestActivityID') ?
    fs.readFileSync('.latestActivityID') : 0


// ========== DISCORD ==========

Client.load()
Client.bot.login(Client.config.discordToken)

Client.bot.on('ready', () => {
    console.log(`Loading data...`)
    
    db.run(`CREATE TABLE IF NOT EXISTS boards(boardID TEXT, guildID TEXT,
        channelID TEXT, users TEXT, prefix TEXT, enabledEvents TEXT,
        suppressEvents BOOLEAN)`, [], (err) => {
            if (err) Client.log(err.message)}
    )
    Client.loadBoards();

    console.log(`${Client.bot.user.username} is online!`)
    Client.bot.user.setActivity('with sticky notes', {type: 'PLAYING'})
})

Client.bot.on('message', async (message) => {
    // Command handler

    if (message.author.bot ||
        !message.content.startsWith(Client.config.prefix)) return
    
    let command = message.content.split(' ')[0].toLowerCase()
        .slice(Client.config.prefix.length)
    let args = message.content.split(' ').slice(1)

    let valid_command = false
    if (command in Client.commands) valid_command = Client.commands[command]
    else {
        // check for aliases
        for (i = 0; i < Object.keys(Client.commands).length; i++) {
            let cmd = Client.commands[Object.keys(Client.commands)[i]]
            if (cmd.alias.includes(command)) valid_command = cmd
        }
    }
    if (!valid_command) return
    
    if (valid_command.permissions) {
        let has_permission = true
        for (var i = 0; i < valid_command.permissions.length; i++) {
            let perm = valid_command.permissions[i]
            if (!message.member.permissions.has(Discord.Permissions.FLAGS[perm.toUpperCase()])) {
                message.channel.send(`You must have ${perm.toLowerCase()} permission to do that.`)
                has_permission = false
                break
            }
        }
        if (has_permission) valid_command.func(Client, message, args, db)
    }
    else valid_command.func(Client, message, args, db)

})



// ========== TRELLO ==========
function loadTrelloListeners() {

    // Fired when a card is created
    Client.trello.on('createCard', (event, board) => {
        let embed = generateEmbed(event)

            .setTitle(`New card created`)
            .setDescription(
                `New ${formatCard(event.data.card)} in ` +
                `${formatList(event.data.list)}`)
        send('cardCreated', board, embed)
    })

    // Fired when a card is updated (description, due date, position,
    // associated list, name, and archive status)
    Client.trello.on('updateCard', (event, board) => {
        let embed = generateEmbed(event)

        if (event.data.old.hasOwnProperty("desc")) {
            embed
                .setTitle(`Card description changed`)
                .addField(`New Description`,
                    typeof event.data.card.desc === "string" && event.data.card.desc.length > 0 ?
                    event.data.card.desc : `[No description]`, true)
                .addField(`Old Description`,
                    typeof event.data.old.desc === "string" && event.data.old.desc.length > 0 ?
                    event.data.old.desc : `[No description]`, true)
            send('cardDescriptionChanged', board, embed)
            
        } else if (event.data.old.hasOwnProperty("due")) {
            embed
                .setTitle(`Card due date changed`)
                .addField(`New Due Date`,
                    event.data.card.due ? new Date(event.data.card.due)
                    .toUTCString() : `[No due date]`, true)
                .addField(`Old Due Date`,
                    event.data.old.due ? new Date(event.data.old.due)
                    .toUTCString() : `[No due date]`, true)
            send('cardDueDateChanged', board, embed)
            
        } else if (event.data.old.hasOwnProperty("pos")) {
            embed
                .setTitle(`Card position changed`)
                .setDescription(
                    `${formatCard(event.data.card)} ` +
                    `in ${formatList(event.data.list)}`)
            send('cardPositionChanged', board, embed)

        } else if (event.data.old.hasOwnProperty("idList")) {
            embed
                .setTitle(`Card list changed`)
                .setDescription(
                    `${formatCard(event.data.card)} moved to ` +
                    `${formatList(event.data.listAfter)} ` +
                    `from ${formatList(event.data.listBefore)}`)
            send('cardListChanged', board, embed)

        } else if (event.data.old.hasOwnProperty("name")) {
            embed
                .setTitle(`Card name changed`)
                .addField(`New Name`, formatCard(event.data.card), true)
                .addField(`Old Name`, event.data.old.name ? event.data.old.name : '?', true)
            send('cardNameChanged', board, embed)

        } else if (event.data.old.hasOwnProperty("closed")) {
            if (event.data.old.closed) {
                embed
                    .setTitle(`Card unarchived`)
                    .setDescription(
                        `${formatCard(event.data.card)} unarchived, ` +
                        `returned to ${formatList(event.data.list)}`)
                send('cardUnarchived', board, embed)
            } else {
                embed
                    .setTitle(`Card archived`)
                    .setDescription(
                        `${formatCard(event.data.card)} archived ` +
                        `from ${formatList(event.data.list)}`)
                send('cardArchived', board, embed)
            }
        }
    })

    // Fired when a card is deleted
    Client.trello.on('deleteCard', (event, board) => {

        let embed = generateEmbed(event)
            .setTitle(`Card deleted`)
            .setDescription(
                `${formatCard(event.data.card)} deleted ` +
                `from ${formatList(event.data.list)}`)
        send('cardDeleted', board, embed)
    })

    // Fired when a comment is posted, or edited
    Client.trello.on('commentCard', (event, board) => {
        let embed = generateEmbed(event)

        if (event.data.hasOwnProperty("textData")) {
            embed
                .setTitle(`Comment edited on card`)
                .addField(`Comment on ${formatCard(event.data.card)}`,
                    event.data.text, true)
                .setTimestamp(event.data.dateLastEdited)
            send('commentEdited', board, embed)

        } else {
            embed
        .setTitle(`Comment added on card`)
            .addField(`New comment on ${formatCard(event.data.card)}`,
                event.data.text, true)
            send('commentAdded', board, embed)
        }
    })

    // Fired when a member is added to a card
    Client.trello.on('addMemberToCard', (event, board) => {
        let embed = generateEmbed(event)
            .setTitle(`Member added to card`)
            .setDescription(
                `Added member __[${getUserName(event.member)}]` +
                    `(https://trello.com/${event.member.username})__ ` +
                `onto ${formatCard(event.data.card)}`)
        send('memberAddedToCard', board, embed)
    })

    // Fired when a member is removed from a card
    Client.trello.on('removeMemberFromCard', (event, board) => {
        let embed = generateEmbed(event)
            .setTitle(`Member removed from card`)
            .setDescription(
                `Removed member __[${getUserName(event.member)}]` +
                    `(https://trello.com/${event.member.username})__ ` +
                `from ${formatCard(event.data.card)}`)
        send('memberAddedToCard', embed)
    })

    // Fired when a list is created
    Client.trello.on('createList', (event, board) => {

        let embed = generateEmbed(event)
            .setTitle(`New list created`)
            .setDescription(`New ${formatList(event.data.list)}`)
        send('listCreated', embed)
    })


    // Fired when a list is renamed, moved, archived, or unarchived
    Client.trello.on('updateList', (event, board) => {
        let embed = generateEmbed(event)

        if (event.data.old.hasOwnProperty("pos")) {
            embed
                .setTitle(`List position changed`)
                .setDescription(`${formatList(event.data.list)} ` +
                    `changed position on board`)
            send('listPositionChanged', embed)

        } else if (event.data.old.hasOwnProperty("name")) {
            embed
                .setTitle(`List name changed`)
                .setDescription(
                    `**(New)** ${formatList(event.data.list)}` + `\n` +
                    `(Old) __${event.data.old.name}__`)
            send('listNameChanged', embed)

        } else if (event.data.old.hasOwnProperty("closed")) {
            if (event.data.old.closed) {
                embed
                    .setTitle(`List unarchived`)
                    .setDescription(`${formatList(event.data.list)} unarchived`)
                send('listUnarchived', embed)
            } else {
                embed
                    .setTitle(`List archived`)
                    .setDescription(`${formatList(event.data.list)} archived`)
                send('listArchived', embed)
            }
        }
    })

    // Fired when an attachment is added to a card
    Client.trello.on('addAttachmentToCard', (event, board) => {

        let embed = generateEmbed(event)
            .setTitle(`Attachment added to card`)
            .setDescription(
                formatAttachment(event.data.attachment) +
                ` to ${formatCard(event.data.card)}`)
            .setThumbnail(event.data.attachment.url)
        send('attachmentAddedToCard', embed)
    })

    // Fired when an attachment is removed from a card
    Client.trello.on('deleteAttachmentFromCard', (event, board) => {

        let embed = generateEmbed(event)
            .setTitle(`Attachment removed from card`)
            .setDescription(
                formatAttachment(event.data.attachment) +
                ` from ${formatCard(event.data.card)}`)
        send('attachmentRemovedFromCard', embed)
    })

    // Fired when a checklist is added to a card (same thing as created)
    Client.trello.on('addChecklistToCard', (event, board) => {

        let embed = generateEmbed(event)
            .setTitle(`Checklist added to card`)
            .setDescription(
                `${formatList(event.data.checklist)} ` +
                `to ${formatCard(event.data.card)}`)
        send('checklistAddedToCard', embed)
    })

    // Fired when a checklist is removed from a card (same thing as deleted)
    Client.trello.on('removeChecklistFromCard', (event, board) => {

        let embed = generateEmbed(event)
            .setTitle(`Checklist removed from card`)
            .setDescription(
                `${formatList(event.data.checklist)} ` +
                `from ${formatCard(event.data.card)}`)
        send('checklistRemovedFromCard', embed)
    })

    // Fired when a checklist item's completion status is toggled
    Client.trello.on('updateCheckItemStateOnCard', (event, board) => {

        if (event.data.checkItem.state === "complete") {

            let embed = generateEmbed(event)
                .setTitle(`Checklist item marked complete`)
                .setDescription(
                    `Item ${event.data.checkItem.name} ` +
                    `under ${formatList(event.data.checklist)} on ` +
                        `${formatCard(event.data.card)}`)
            send('checklistItemMarkedComplete', embed)

        } else if (event.data.checkItem.state === "incomplete") {

            let embed = generateEmbed(event)
                .setTitle(`Checklist item marked incomplete`)
                .setDescription(
                    `Item ${event.data.checkItem.name}` +
                    `under ${formatList(event.data.checklist)} on ` +
                        `${formatCard(event.data.card)}`)
            send('checklistItemMarkedIncomplete', embed)
        }
    })

}


/*
** =======================
** Miscellaneous functions
** =======================
*/
Client.trello.on('maxId', (id) => {
    if (latestActivityID == id) return
    latestActivityID = id
    fs.writeFileSync('.latestActivityID', id)
})

function generateEmbed(event) {
    // let link = event.data.hasOwnProperty(`card`) ?
    //     `\n[Link to card __${event.data.card.name}](https://trello.com/c/` +
    //     `${event.data.card.shortLink})__` : ``

    return new Discord.MessageEmbed()
        .setAuthor( 
            event.data.board.name,
            Client.bot.user.displayAvatarURL,
            `https://trello.com/b/${event.data.board.shortLink}`)
        .setTitle(
            event.type // convert camelCase to Normal Text
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, (str) => str.toUpperCase()) )
        .setFooter(
            `by ${getUserName(event.memberCreator)}`,
            getUserIcon(event.memberCreator) )
        .setTimestamp( event.hasOwnProperty(`date`) ? event.date : Date.now() )
        .setColor('#026AA7')
}

function formatCard(eventCard) {
    return eventCard != null ?
        `(Card) [**${eventCard.name}**](https://trello.com/c/` +
            `${eventCard.shortLink})` : `Card`
}

function formatList(eventList) {
    return eventList != null ?
        `(List) **${eventList.name}**` : `List`
}

function formatAttachment(eventAttachment) {
    return eventAttachment != null ?
        `(Attachment) [**${eventAttachment.name}**](${eventAttachment.url})` :
        `Attachment`
}

function send(eventType, boardID, embed, content = ``) {
    // Ensure fields do not go over limit
    if (embed && embed.fields) {
        for (var i = 0; i < embed.fields.length; i++) {
            embed.fields[i].name = Client.limitLength(embed.fields[i].name, 256)
            embed.fields[i].value = Client.limitLength(embed.fields[i].value, 1024)
        }
    }

    db.all(`SELECT * FROM boards`, [], (err, boards) => {
        if (err) return Client.log(err.message)

        for (let board of boards) {

            if (board.enabledEvents.includes(eventType) &&
                board.boardID == boardID && !board.suppressEvents) {

                Client.bot.guilds.resolve(board.guildID).channels.resolve(board.channelID)
                    .send(content, {embed:embed}).catch(err => Client.log(err))
            }
        }
    })
}

function getUserName(trelloMember) {
    // let trelloName = trelloMember.username
    // return Client.config.userIDs[trelloName] &&
    //     Client.config.guild.members.get(Client.config.userIDs[trelloName]) ?
    //     Client.config.guild.members.get(Client.config.userIDs[trelloName])
    //         .user.username : trelloName
    return trelloMember.username
}

function getUserIcon(trelloMember) {
    // let trelloName = trelloMember.username
    // return Client.config.userIDs[trelloName] &&
    //     Client.config.guild.members.get(Client.config.userIDs[trelloName]) ?
    //     Client.config.guild.members.get(Client.config.userIDs[trelloName])
    //         .user.avatarURL : (trelloMember.avatarUrl != null ?
    //             trelloMember.avatarURL :
    //             "https://cdn.discordapp.com/embed/avatars/0.png")
    return "https://cdn.discordapp.com/embed/avatars/0.png"
}