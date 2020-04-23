const Discord = require('discord.js')

module.exports = {
    alias: ['commands', 'cmds', 'command', 'cmd'],
    args: ['(command)'],
    help: "show command(s) and a short description",
    permissions: [],
    func: (Client, message, args) => {

        let embed = new Discord.MessageEmbed({
            color: 0x026aa7
        })

        // If we have an arg (lookup for a specific command)
        if (args.length > 0) {

            let valid_c = false
            let aliases = ''

            // Find if arg is valid command
            if (args[0] in Client.commands) {
                valid_c = Client.commands[args[0]]
            } else {
                // Search aliases
                for (i = 0; i < Object.keys(Client.commands).length; i++) {
                    let c = Client.commands[Object.keys(Client.commands)[i]]
                    if (c.alias.includes(args[0]))
                        valid_c = c
                }
            }

            // If we do have a valid command, set embed
            if (valid_c) {
                embed
                    .setTitle(`__${args[0].toLowerCase().replace(/^./,
                        (str) =>str.toUpperCase())}__`)
                    .setDescription(valid_c.help)
                    .addField(`Arguments`, valid_c.args.join(' '), true)
                    .addField(`Aliases`, valid_c.alias.join(', '), true)
                    .addField(`Permissions`, valid_c.permissions.length > 0 ?
                        valid_c.permissions.join(', ') : `None`, true)
            }
            else return message.channel.send(`"${args[0]}" is not a valid command.`)

        // If no args (list all commands)
        } else {
            embed
                .setTitle(`${Client.bot.user.username} Commands`)
                .setDescription(Object.keys(Client.commands).join('\n'))
        }

        message.channel.send(embed)

    }
}