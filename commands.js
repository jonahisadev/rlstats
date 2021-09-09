const scraper = require('./scraper');
const bot = require('./bot');
const User = require('./user.db');
const discord = require('discord.js');
const BallChasing = require('./bc');

module.exports.alltime = async function(message)
{
    User.findOne({ discord_id: message.member.id }).then(async user => {
        if (user == null) {
            message.reply('You\'re not registered! Register with \`!rls register <link>\`');
            return;
        }

        const stats = await scraper.go(user.url);
        var fields = [];

        for (var key in stats) {
            if (key == 'Score' ||
                key == 'Goal Shot Ratio') {
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
}

module.exports.register = async function(message, args)
{
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
        
        // Extract profile elements
        let start = args[2].substr(args[2].indexOf('/profile/') + 9);
        let url = start.match(/(.*)\//)[1];

        // Create new user
        const new_user = new User({
            discord_id: discord_id,
            url: url,
            in_session: false,
            session_stats: {}
        });

        // Store user
        new_user.save({}).then(user => {
            message.reply('Welcome to Rocket League Stats!');
        })
        .catch(err => {
            message.reply(`DOh! ${err}`);
        });
    });
}

async function bc_session_stop(message, key, date)
{
    // This might take a while
    message.react("⏱️");

    // Bring in preliminary data
    const api = new BallChasing(key);
    const [id, name] = await api.getPlayerID();
    const replays = await api.getReplaysAfter(id, new Date(date).toISOString());

    // Exit if no replays
    if (replays.length === 0) {
        message.reply('no stats in this session!');
        return;
    }

    // Calculated
    let total_stats = {};
    for (var i = 0; i < replays.length; i++) {
        // Replay
        const replay = replays[i];

        // Get stats
        const start = process.hrtime();
        const stats = await api.getStatsFromReplay(name, replay);
        ['Wins', 'Goals', 'Saves', 'Shots', 'MVP', 'Demos', 'Assists'].forEach(stat => {
            if (total_stats[stat] === undefined)
                total_stats[stat] = 0;
            total_stats[stat] += stats[stat];
        });

        // Waste time
        let now = process.hrtime();
        while (now[1] - start[1] >= 500000000)
            now = process.hrtime();
    }

    // Customize fields
    total_stats['Wins'] = total_stats['Wins'] + '/' + replays.length;

    // Format fields
    let fields = [];
    for (const prop in total_stats) {
        fields.push({
            name: prop,
            value: total_stats[prop],
            inline: true
        });
    }

    // Send message
    message.reactions.removeAll();
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
}

module.exports.session = async function(message, args)
{
    if (args.length < 3) {
        bot.help(message.member);
        return;
    }

    switch (args[2]) {
        case 'start': {
            User.findOne({ discord_id: message.member.id }).then(async user => {
                if (user == null) {
                    message.reply('you\'re not registered! Register with \`!rls register <link>\`');
                    return;
                }

                if (user.in_session) {
                    message.reply('you\'re already in a session!');
                    return;
                }

                // Different things if BallChasing
                if (user.bc_key) {
                    user.bc_session_start = Date.now();
                } else {
                    user.session_stats = await scraper.go(user.url);
                }

                // Save more stuff
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
                    message.reply('you\'re not registered! Register with \`!rls register <link>\`');
                    return;
                }

                if (!user.in_session) {
                    message.reply('you\'re not in a session!');
                    return;
                }

                if (user.bc_key) {
                    bc_session_stop(message, user.bc_key, user.bc_session_start);
                    user.in_session = false;
                    user.save({}).then(_ => {
                        console.log("BallChasing pull finished");
                    });
                    return;
                }

                const old_stats = user.session_stats;
                const new_stats = await scraper.go(user.url);
                user.in_session = false;
                var fields = [];

                for (var key in new_stats) {
                    if (key == 'Score' ||
                        key == 'Goal Shot Ratio') {
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

module.exports.bc_register = async function(message, key) {
    User.findOne({ discord_id: message.author.id }).then(doc => {
        if (!doc) {
            message.reply('You\'re not registered! Register with \`!rls register <link>\`')
            return;
        }

        const api = new BallChasing(key);
        if (!api.getPlayerID()) {
            message.reply('That\'s not a valid BallChasing key! Please try again');
            return;
        }

        doc.bc_key = key;
        doc.save({}).then(_ => {
            console.log("Saved API key");
            message.react('👍');
        });
    });
}