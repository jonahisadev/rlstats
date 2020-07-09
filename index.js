const fs = require('fs');
const discord = require('discord.js');
const scraper = require('./scraper');
const User = require('./user.db');

const client = new discord.Client();
const tokens = JSON.parse(fs.readFileSync('config.json'));

client.once('ready', () => {
    console.log("Here we go!");
});

client.on('message', async (message) => {
    const args = message.content.split(' ');
    if (args[0] == '!rls') {

        if (message.channel.name != 'stats') {
            message.member.send('Please use my commands in the #stats channel');
            return;
        }

        switch (args[1])
        {
            case '__once': {
                if (args.length < 3) {
                    message.reply('Please provide a link');
                    return;
                }

                const stats = await scraper.go(args[2]);
                const it = stats[Symbol.iterator]();
                var str = `Here are all the stats I could find for ${message.author.toString()}:\n`;
                for (let item of it) {
                    str += `  ${item[0]}: ${item[1]}\n`;
                }

                message.channel.send(str);
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
                        url: args[2]
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
        }

    }
});

client.login(tokens.client_id);

// scraper.go('https://rocketleague.tracker.network/profile/steam/76561198216933521');