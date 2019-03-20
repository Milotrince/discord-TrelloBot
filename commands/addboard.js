module.exports = {
    alias: ['board', 'add', 'trello', 'new'],
    args: ['boardId (channel)'],
    help: "Add a new board to listen to",
    permissions: ["ADMINISTRATOR"],
    func: (Client, message, args, db) => {
        
        if (args.length < 1) return message.channel.send('Board ID is required.')
        if (args[0].length != 8) return message.channel.send('Board ID should be 8 characters long.')

        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS boards(boardID TEXT, guildID TEXT,
                channelID TEXT, users TEXT, prefix TEXT, enabledEvents TEXT,
                suppressEvents BOOLEAN)`, [], (err) => {
                    if (err) Client.log(err.message)}
            )
    
            db.all(`SELECT * FROM boards WHERE guildID =${message.channel.guild.id}`, [], (err, rows) => {
                if (err) return Client.log(err.message)

                let g = message.guild;
                let c = args.length > 1 && message.guild.channels.find(c => c.name == args[1] || c.id === args[1]) ?
                    message.guild.channels.find(c => c.name == args[1] || c.id === args[1]) : message.channel

                db.run(`INSERT INTO boards(boardID, guildID, channelID, users,
                    prefix, enabledEvents, suppressEvents) VALUES(?,?,?,?,?,?,?)`,
                    [args[0], g.id, c.id, "", Client.config.prefix, Client.config.enabledEvents.join(','), false], (err) => {
                        if (err) Client.log('Error creating board\n' + err.message)
                        else {
                            Client.loadBoards();
                            Client.log(`Created: Board{${args[0]}} in Guild{${g.id}}`)
                            message.channel.send("Board successfully created.")
                        }
                })
            })
        })

    }
}