
// This is a tool for ad-hoc testing of different oEmbed libraries.
// There are modules referenced here that are not installed
// via package.json.  To run this script you must
// therefore run:  npm install ...modules... --no-save

const program   = require('commander');
const Plugin    = require('../index.js');
// const { extract } = require('oembed-parser');
const { unfurl } = require('unfurl.js');
const fetch    = require('node-fetch');

process.title = 'embeddables';
program.version('0.7.2');

program
    .command('fetch <URL>')
    .description('Fetch embed codes for the URL')
    .action(async (URL) => {
        try {
            let plugin = new Plugin("embeddables");
            let embeds = await plugin.fetchEmbedData(URL);
            console.log(embeds);
        } catch (e) {
            console.error(`fetch command ERRORED ${e.stack}`);
        }

    });

program
    .command('resource <URL>')
    .description('Fetch embed codes for the URL')
    .action(async (URL) => {
        try {
            let plugin = new Plugin("embeddables");
            let embeds = await plugin.resource({ 
                href: URL
            });
            console.log(embeds);
        } catch (e) {
            console.error(`resource command ERRORED ${e.stack}`);
        }

    });

program
    .command('facebook <URL>')
    .description('Fetch Facebook embed codes for the URL')
    .action(async (URL) => {
        try {
            let plugin = new Plugin("embeddables");
            let embeds = await plugin.fetchFacebookEmbed(URL);
            console.log(embeds);
        } catch (e) {
            console.error(`facebook command ERRORED ${e.stack}`);
        }

    });


program
    .command('parser <URL>')
    .description('Fetch embed codes for the URL')
    .action(async (URL) => {
        try {
            let embeds = await extract(URL);
            console.log(embeds);
        } catch (e) {
            console.error(`parser command ERRORED ${e.stack}`);
        }

    });


program
    .command('unfurl <URL>')
    .description('Fetch embed codes for the URL')
    .action(async (URL) => {
        try {
            let embeds = await unfurl(URL);
            console.log(embeds);
            console.log(embeds.open_graph);
            console.log(embeds.oEmbed);
        } catch (e) {
            console.error(`unfurl command ERRORED ${e.stack}`);
        }

    });

program
    .command('twfetch <URL>')
    .description('Fetch Twitter data for the URL')
    .action(async (URL) => {
        try {

            // It's a Twitter URL, and no HTML code
            // For some reason oembetter has stopped working with Tweets
            // The Twitter documentation offers this.
            // See: https://developer.twitter.com/en/docs/twitter-for-websites/embedded-tweets/overview
            let ret = {};
            let twdata = await fetch(`https://publish.twitter.com/oembed?url=${URL}`);
            let twjson = await twdata.json();
            if (twjson.html) {
                ret.url = twjson.url;
                ret.author_name = twjson.author_name;
                ret.author_url = twjson.author_url;
                ret.width = twjson.width;
                ret.height = twjson.height;
                ret.provider_name = twjson.provider_name;
                ret.provider_url = twjson.provider_url;
                ret.html = twjson.html;
            }
            console.log(twjson);
            console.log(ret);
        } catch (e) {
            console.error(`unfurl command ERRORED ${e.stack}`);
        }

    });



program.parse(process.argv);
