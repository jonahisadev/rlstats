const fs = require('fs');
const discord = require('discord.js');
const scraper = require('./scraper');
const User = require('./user.db');

const client = new discord.Client();
const tokens = JSON.parse(fs.readFileSync('config.json'));

client.once('ready', () => {
    console.log("Here we go!");
    client.user.setActivity('with balls ⚽');
});

client.on('guildCreate', (guild) => {
    guild.channels.create('rlstats');
});

client.on('message', async (message) => {
    const args = message.content.split(' ');
    if (args[0] == '!rls') {

        if (message.channel.name != 'rlstats') {
            message.member.send('Please use my commands in the #stats channel');
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
                    // message.channel.send('Please provide a link!');
                    message.reply('Please provide a link');
                    return;
                }

                // TODO: regex match the url

                const discord_id = message.member.id;
                User.findOne({ discord_id: discord_id }).then(user => {
                    if (user != null) {
                        message.reply('You\'ve already signed up');
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
                    message.reply('What do you want to do with the session?');
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

                            for (var key in new_stats) {
                                if (key == 'Tracker Score' ||
                                    key == 'Goal/Shot %' ||
                                    key == 'MVP/Win %') {
                                    continue;
                                }

                                new_stats[key] -= old_stats[key];
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
        }

    }
});

client.login(tokens.client_id);