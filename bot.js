const discord = require('discord.js');

module.exports.help = function(dest)
{
    dest.send({
        "content": "Here are my commands",
        "embed": {
            "color": 3447003,
            "fields": [
                {
                    "name": "!rls help",
                    "value": "I'll DM you this message!"
                },
                {
                    "name": "!rls register <link>",
                    "value": "Register your discord account with me. The <link> should be a link to your Rocket League [tracker](rocketleague.tracker.network) profile."
                },
                {
                    "name": "!rls session start",
                    "value": "Start a stats tracking session. I'll give you a thumbs up when I'm ready!"
                },
                {
                    "name": "!rls session stop",
                    "value": "Stop and review your stats tracking session."
                },
                {
                    "name": "!rls alltime",
                    "value": "View your all time Rocket League stats."
                },
                {
                    "name": "(Send this to me in a DM) !rls bc key <api_key>",
                    "value": "Link your BallChasing.com account (helpful for sessions!)"
                }
            ],
            "footer": {
                "text": "Bleep bloop, a robot generated this"
            }
        }
    });
}