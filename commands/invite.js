module.exports = {
    alias: [],
    args: [],
    help: "Get invite link for this bot",
    permissions: [],
    func: (Client, message, args) => {
        
        message.channel.send(`https://discordapp.com/api/oauth2/authorize?` +
        `client_id=${Client.bot.user.id}&permissions=27648&scope=bot`)

    }
}