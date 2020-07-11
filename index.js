const fs = require('fs');
const discord = require('discord.js');
const scraper = require('./scraper');
const bot = require('./bot');
const User = require('./user.db');
const cmd = require('./commands');

const client = new discord.Client();
const tokens = JSON.parse(fs.readFileSync('config.json'));

client.once('ready', () => {
    console.log("Here we go!");
    client.user.setActivity('with balls ⚽');
});

// Join commands
client.on('guildCreate', (guild) => {
    guild.channels.create('rlstats', {
        type: 'text',
        topic: 'This is where you should interact with RLS Bot',
        rateLimitPerUser: 10,
        reason: 'Let\'s not clutter the main channel!',
    }).then(channel => {
        if (guild.systemChannel) {
            channel.setParent(guild.systemChannel.parentID);
            guild.systemChannel.send("Hi, I'm RLS Bot! You can talk to me over in #rlstats. See you there!");
        }

        bot.help(channel);
    });
});

client.on('message', async (message) => {
    const args = message.content.split(' ');
    if (args[0] == '!rls') {

        if (message.channel.name != 'rlstats') {
            message.member.send('Please use my commands in the #rlstats channel');
            return;
        }

        switch (args[1])
        {
            case 'alltime': {
                await cmd.alltime(message);
                break;
            }

            case 'register': {
                await cmd.register(message, args);
                break;
            }

            case 'session': {
                await cmd.session(message, args);
                break;
            }

            case 'help': {
                bot.help(message.member);
                break;
            }

            case 'whatasave': {
                message.channel.send(':middle_finger: :angry:');
                break;
            }

            case '__alive': {
                if (message.member.hasPermission("ADMINISTRATOR")) {
                    message.member.send('I am alive');
                }
                break;
            }

            default: {
                bot.help(message.member);
                break;
            }
        }

    }
});

client.login(tokens.client_id);