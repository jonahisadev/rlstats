const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

//
// OLD CODE BEFORE THE WEBSITE GOT DYNAMIC
//
// module.exports.go = async function(url) {
//     return axios.get(url).then(res => {
//         // const html = fs.readFileSync('test.html');
//         const html = res.data;
//         const $ = cheerio.load(html);

//         var map = {}
//         $('div.stats').children('.stat').each((i, el) => {
//             const numbers = $($(el).find('.wrapper')).find('.numbers');
//             const name = $($(numbers).children('.name')[0]).text().trim();
//             const value = $($(numbers).children('.value')[0]).text().trim().replace(/,/gi, '');

//             console.log(name + ", " + value);

//             map[name] = value;
//         });

//         return map;
//     })
//     .catch(err => {
//         console.error(err);
//     });

//     return {};
// }

module.exports.go = async function(url) {
    return axios.get('https://api.tracker.gg/api/v2/rocket-league/standard/profile/' + url).then(res => {
        const lifetime = res.data.data.segments[0];
        let map = {};

        for (const stat_name in lifetime.stats) {
            const stat = lifetime.stats[stat_name];

            // Skip pointless stats
            if (stat.displayName == "TRN Score" ||
                stat.displayName == "Season Reward Level" ||
                stat.displayName == "Season Reward Wins" ||
                stat.displayName == "TRN Rating")
            {
                continue;
            }

            map[stat.displayName] = stat.value;
        }

        return map;
    });

}