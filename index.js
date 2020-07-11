const fs = require('fs');
const discord = require('discord.js');
const scraper = require('./scraper');
const bot = require('./bot');
const User = require('./user.db');

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
                User.findOne({discord_id: message.member.id}).then(async user => {
                    if (user == null) {
                        message.reply('You\'re not registered! Register with \`!rls register <link>\`');
                        return;
                    }

                    const stats = await scraper.go(user.url);
                    var fields = [];

                    for (var key in stats) {
                        if (key == 'Tracker Score' ||
                                key == 'Goal/Shot %' ||
                                key == 'MVP/Win %')
                        {
                            continue;
                        }

                        fields.push({
                            name: key,
                            value: stats[key],
                            inline: true
                        });
                    }

                    message.channel.send({
                        content: `Here are ${message.member.toString()}'s stats!`,
                        embed: {
                            color: 3447003,
                            title: "All Time Stats",
                            fields: fields,
                            footer: {
                                text: "Bleep bloop, a robot generated this"
                            }
                        }
                    });
                });
                break;
            }

            case 'register': {
                if (args.length < 3) {
                    bot.help(message.member);
                    return;
                }

                
                const discord_id = message.member.id;
                User.findOne({ discord_id: discord_id }).then(user => {
                    // Check existing user
                    if (user != null) {
                        message.reply('You\'ve already signed up');
                        return;
                    }
                    
                    // Validate URL
                    const regex = /^https:\/\/rocketleague\.tracker\.network\/.*$/g;
                    if (!args[2].match(regex)) {
                        message.reply('Please provide a link to your <https://rocketleague.tracker.network> profile!');
                        return;
                    }

                    const new_user = new User({
                        discord_id: discord_id,
                        url: args[2],
                        in_session: false,
                        session_stats: {}
                    });
                    new_user.save({}).then(user => {
                        message.reply('Welcome to Rocket League Stats!');
                    })
                    .catch(err => {
                        message.reply(`DOh! ${err}`);
                    });
                });
                break;
            }

            case 'session': {
                if (args.length < 3) {
                    bot.help(message.member);
                    return;
                }

                switch (args[2]) {
                    case 'start': {
                        User.findOne({discord_id: message.member.id}).then(async user => {
                            if (user == null) {
                                message.reply('You\'re not registered! Register with \`!rls register <link>\`');
                                return;
                            }

                            if (user.in_session) {
                                message.reply('You\'re already in a session!');
                                return;
                            }

                            user.session_stats = await scraper.go(user.url);
                            user.in_session = true;
                            user.save({}).then(_ => {
                                message.react('👍');
                            });
                        });
                        break;
                    }

                    case 'stop': {
                        User.findOne({ discord_id: message.member.id }).then(async user => {
                            if (user == null) {
                                message.reply('You\'re not registered! Register with \`!rls register <link>\`');
                                return;
                            }

                            if (!user.in_session) {
                                message.reply('You\'re not in a session!');
                                return;
                            }

                            const old_stats = user.session_stats;
                            const new_stats = await scraper.go(user.url);
                            user.in_session = false;
                            var fields = [];
                            
                            console.log("End of session: ");
                            for (var key in new_stats) {
                                if (key == 'Tracker Score' ||
                                    key == 'Goal/Shot %' ||
                                    key == 'MVP/Win %') {
                                    continue;
                                }

                                console.log(`${key} => ${new_stats[key]}`);
                                new_stats[key] -= old_stats[key];
                                console.log(`(d)${key} => ${new_stats[key]}`);
                                fields.push({
                                    name: key,
                                    value: (new_stats[key] != NaN) ? parseInt(new_stats[key]) : 0,
                                    inline: true
                                });
                            }

                            user.save({}).then(_ => {
                                message.react('🤘');
                                message.channel.send({
                                    content: `Here are ${message.member.toString()}'s stats!`,
                                    embed: {
                                        color: 3447003,
                                        title: "This Session's Stats",
                                        fields: fields,
                                        footer: {
                                            text: "Bleep bloop, a robot generated this"
                                        }
                                    }
                                });
                            });
                        });
                        break;
                    }
                }
            }

            case 'help': {
                bot.help(message.member);
                break;
            }

            case 'whatasave': {
                message.channel.send(':middle_finger: :angry:');
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