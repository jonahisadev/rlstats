const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

module.exports.go = async function(url) {
    return axios.get(url).then(res => {
        // const html = fs.readFileSync('test.html');
        const html = res.data;
        const $ = cheerio.load(html);

        var map = {}
        $('div.stats-large').children('.stat').each((i, el) => {
            const name = $($(el).children('.name')[0]).text().trim();
            const value = $($(el).children('.value')[0]).text().trim();

            map[name] = value;
        });

        return map;
    })
    .catch(err => {
        console.error(err);
    });

    return {};
}