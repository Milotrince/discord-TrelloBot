module.exports = {
    alias: ['rl', 'load', 'update'],
    args: ['(command)'],
    help: "reload or update a command",
    permissions: ["ADMINISTRATOR"],
    func: (Client, message, args) => {
        
        if (args.length > 0) {
            Client.load(args[0])
            Client.log(`Reloaded command <${args[0]}>.`)
        }
        else {
            Client.load()
            Client.log(`Reloaded all commands.`)
        }
    }
}