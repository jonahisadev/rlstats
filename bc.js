const axios = require('axios');

class BallChasing 
{

    constructor(key)
    {
        this.key = key;
    }

    async getPlayerID()
    {
        return axios.get('https://ballchasing.com/api', {
            headers: {
                'Authorization': this.key
            }
        }).then(res => {
            if (res.status !== 200)
                return false;

            const json = res.data;
            return [json.steam_id, json.name];
        });
    }

    async getReplaysAfter(id, date)
    {
        let replays = [];
        let url = 'https://ballchasing.com/api/replays?created-after=' + encodeURIComponent(date) +
            '&player-id=steam:' + id;

        while (true) {
            const json = await axios.get(url, {
                headers: {
                    'Authorization': this.key
                }
            }).then(res => {
                return res.data;
            });

            for (var i = 0; i < json.list.length; i++) {
                let replay = json.list[i];
                replays.push(replay.link);
            }

            // Deal with pagination
            if (!json.next)
                break;
            url = json.next;
        }

        return replays;
    }

    async getStatsFromReplay(name, url)
    {
        return axios.get(url, {
            headers: {
                'Authorization': this.key
            }
        }).then(res => {
            // Grab data
            const json = res.data;
            if (json.status == 'pending') {
                return [];
            }

            // Find you and your team
            let team = "";
            let player = {};
            for (var i = 0; i < json.blue.players.length; i++) {
                if (json.blue.players[i].name == name) {
                    player = json.blue.players[i];
                    team = "blue";
                    break;
                }
            }
            for (var i = 0; i < json.orange.players.length; i++) {
                if (json.orange.players[i].name == name) {
                    player = json.orange.players[i];
                    team = "orange";
                    break;
                }
            }

            // Determine winner
            let winner = json.orange.stats.core.goals > json.blue.stats.core.goals ? 'orange' : 'blue';

            // Get stats
            return {
                goals: player['stats']['core']['goals'],
                shots: player['stats']['core']['shots'],
                saves: player['stats']['core']['saves'],
                mvp:   player['stats']['core']['mvp'] ? 1 : 0,
                demos: player['stats']['demo']['inflicted'],
                assists: player['stats']['core']['assists'],
                wins:   (winner == team) ? 1 : 0,
            }
        })
    }

};

module.exports = BallChasing;