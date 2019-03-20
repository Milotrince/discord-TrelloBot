module.exports = {
    alias: ['pong'],
    args: [],
    help: "Get ping",
    permissions: [],
    func: async (Client, message, args) => {
        
        const m = await message.channel.send("🏓 Ping?")
        m.edit([
            `Pong! 🏓`,
            `Latency: ${m.createdTimestamp - message.createdTimestamp}ms`,
            `API Latency: ${Math.round(Client.bot.ping)}ms`
        ].join('\n'))

    }
}