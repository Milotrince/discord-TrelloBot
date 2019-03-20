module.exports = {
    alias: [],
    args: ['(Board ID)'],
    help: "Temporarily disable notifications from a board",
    permissions: [],
    func: (Client, message, args, db) => {
        
        let boardID = args.length > 0 ? args[0] : "NONE";
        db.all(`SELECT * FROM boards WHERE guildID =${message.channel.guild.id} AND boardID =${boardID}`, [], (err, boards) => {
            //if (err) return Client.log(err.message)
            if (err) Client.log(err.message)

            let board = boards && boards.length > 0 ? boards[0] : null;
            if (!board) {
                db.run(`UPDATE boards SET suppressEvents =${false} WHERE guildID =${message.channel.guild.id}`, [], (err) => {if (err) Client.log(err.message)})
                message.channel.send(`All boards enabled.`)
            } else {
                if (board.suppressEvents) {
                db.run(`UPDATE boards SET suppressEvents =${false} WHERE guildID =${message.channel.guild.id} AND boardID =${boardID}`, [], (err) => {if (err) Client.log(err.message)})
                message.channel.send(`Board enabled. Events will be sent to` +
                    `${message.guild.channles.get(board.channelID)}.`)
                } else
                    message.channel.send(`Board is already enabled.`)
            }
        })

    }
}