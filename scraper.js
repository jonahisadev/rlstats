const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

module.exports.go = async function(url) {
    return axios.get(url).then(res => {
        // const html = fs.readFileSync('test.html');
        const html = res.data;
        const $ = cheerio.load(html);

        var map = {}
        $('div.stats').children('.stat').each((i, el) => {
            const numbers = $($(el).find('.wrapper')).find('.numbers');
            const name = $($(numbers).children('.name')[0]).text().trim();
            const value = $($(numbers).children('.value')[0]).text().trim().replace(/,/gi, '');

            map[name] = value;
        });

        return map;
    })
    .catch(err => {
        console.error(err);
    });

    return {};
}