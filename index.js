/**
 *
 * Copyright 2013-2017 David Herron
 *
 * This file is part of AkashaCMS-embeddables (http://akashacms.com/).
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

'use strict';

const path     = require('path');
const util     = require('util');
const fetch    = require('node-fetch');
const akasha   = require('akasharender');
const mahabhuta = akasha.mahabhuta;

const extract = require('meta-extractor');
const oembetter = require('oembetter')();
const { unfurl } = require('unfurl.js');

// oembetter.whitelist([ 'youtube.com', 'facebook.com', 'twitter.com', 'vimeo.com', 'wufoo.com' ]);

oembetter.whitelist(oembetter.suggestedWhitelist);
oembetter.endpoints(oembetter.suggestedEndpoints);

const doExtract = (url) => {
    return new Promise((resolve, reject) => {
        extract({ uri: url }, (err, res) => {
            if (err) { reject(err); }
            else { resolve(res); }
        });
    })
};

oembetter.addAfter(async (url, options, response, callback) => {
    try {
        let result = await doExtract(url);
        response.metadata = result;
    } finally {
        callback();
    }
});

oembetter.addFallback(async function(url, options, callback) {
    try {
        let result = await doExtract(url);
        callback(undefined, {
            metadata: result
        });
    } catch(err) {
        callback(err);
    }
});

const pluginName = "@akashacms/plugins-embeddables";

var leveldb;

const _plugin_config = Symbol('config');
const _plugin_options = Symbol('options');

module.exports = class EmbeddablesPlugin extends akasha.Plugin {
	constructor() {
		super(pluginName);
	}

    configure(config, options) {
        this[_plugin_config] = config;
        this[_plugin_options] = options;
        options.config = config;
        config.addPartialsDir(path.join(__dirname, 'partials'));
        config.addAssetsDir(path.join(__dirname, 'assets'));
        config.addMahabhuta(module.exports.mahabhutaArray(options));
    }

    get config() { return this[_plugin_config]; }
    get options() { return this[_plugin_options]; }

    async fetchOembetter(embedurl) {
        // var data = akasha.cache.retrieve(pluginName+':fetchOembetter', embedurl);
        // if (data) {
        //    return Promise.resolve(data);
        // }

        let cache = (await akasha.cache).getCache(pluginName, { create: true });
        let data = cache.find({
            type: 'fetchOembetter',
            url: embedurl
        });
        if (data) {
            return data;
        }
        let ret = await new Promise((resolve, reject) => {
            oembetter.fetch(embedurl, (err, result) => {
                if (err) {
                    console.error(`${pluginName} fetchOembetter FAIL on ${embedurl} because ${err}`);
                    reject(err);
                } else {
                    try {
                        cache.insert({
                            type: 'fetchOembetter',
                            url: embedurl,
                            result: result
                        });
                        // akasha.cache.persist(pluginName+':fetchOembetter', embedurl, result);
                        // console.log(`${pluginName} fetchOembetter successfully persisted ${embedurl} ==> ${util.inspect(result)}`);
                    } catch (err2) {
                        console.error(`${pluginName} fetchOembetter akasha.cache.persist FAIL on ${embedurl} because ${err} with ${result}`);
                    }
                    resolve(result);
                }
            });
        });
        return ret;
    }

    async fetchUnfurl(embedurl) {
        // console.log(embedurl);
        // var data = akasha.cache.retrieve(pluginName+':fetchUnfurl', embedurl);
        // if (data) {
        //    return Promise.resolve(data);
        // }
        let cache = (await akasha.cache).getCache(pluginName, { create: true });
        let data = cache.find({
            type: 'fetchUnfurl',
            url: embedurl
        });
        // console.log(`fetchUnfurl ${embedurl} len=${data.length}`, data);
        if (data.length >= 1) {
            let ret = data[0];
            if (ret.result) return ret.result;
            else {
                throw new Error(`fetchUnfurl got incorrect data from cache for ${embedurl} ==> ${util.inspect(data)}`);
            }
        }
        let result = await unfurl(embedurl);
        // console.log(`fetchUnfurl ${embedurl} unfurl result `, result);
        try {
            cache.insert({
                type: 'fetchUnfurl',
                url: embedurl,
                result: result
            });
            // akasha.cache.persist(pluginName+':fetchUnfurl', embedurl, result);
            // console.log(`${pluginName} fetchUnfurl successfully persisted ${embedurl} ==> ${util.inspect(result)}`);
        } catch (err2) {
            console.error(`${pluginName} fetchUnfurl akasha.cache.persist FAIL on ${embedurl} because ${err} with ${result}`);
        }
        return result;
    }

    async fetchFacebookEmbed(embedurl) {

        // This is our only solution for now.
        // An option is to implement oembed-parser and to
        // require the user provide Facebook access tokens.

        return {
            html: `<a href="${embedurl}">${embedurl}</a>`,
            metadata: {}
        };

        /*
         * This does not work reliably.  It seems that now Facebook
         * requires an access token.  The only Node.js package I've
         * found which discusses this is https://www.npmjs.com/package/oembed-parser
         *
         * In cli.js there is an example of using that package.
         *
         * WIth Oembetter, we might get a few queries but are quickly
         * shut out from receiving data.  With oembed-parser, we're
         * simply told that an access token is required.
         *
         * That leaves us with one solution, which is to return just
         * the HTML for a link.
         *
        const data = await this.fetchOembetter(embedurl);
        // There's no embed code provided so we must concoct something
        data.html = data.metadata.html = `
        <div class="ak-embeddable ak-embeddable-facebook"
            data-embedurl="${embedurl}"
            >
            <span class="ak-embeddable-title ak-embeddable-facebook-title">
            <strong>
            ${data.metadata.title}
            </strong>
            </span>
            <img src="${data.metadata.ogImage}"
                class="ak-embeddable-img ak-embeddable-facebook-img"
                />
            <span class="ak-embeddable-description ak-embeddable-facebook-description">
            ${data.metadata.description}
            </span>
            <span class="ak-embeddable-author ak-embeddable-facebook-author">
            <a href="${embedurl}">${data.metadata.ogTitle}</a>
            </span>
        </div>
        `;
        return data;
        */
    }

    async fetchTwitterEmbed(embedurl) {

        let ret = {};

        // It's a Twitter URL, and no HTML code
        // For some reason oembetter has stopped working with Tweets
        // The Twitter documentation offers this.
        // See: https://developer.twitter.com/en/docs/twitter-for-websites/embedded-tweets/overview
        let twdata = await fetch(`https://publish.twitter.com/oembed?url=${embedurl}`);
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
        // console.log(`${pluginName} fetchEmbedData fetch ${embedurl} ==> ${util.inspect(twjson)} ${util.inspect(ret)}`);

        return ret;
    }

    async fetchYouTubeEmbed(embedurl) {
        let data = await this.fetchUnfurl(embedurl);
        let ytdata = data; // .result;
        // let ytdata = await this.fetchUnfurl(embedurl);
        let ret = {
            ytdata:        ytdata,
            url:           ytdata.open_graph.url,
            author_name:   ytdata.oEmbed.author_name,
            author_url:    ytdata.oEmbed.author_url,
            width:         ytdata.oEmbed.width,
            heght:         ytdata.oEmbed.height,
            provider_name: ytdata.oEmbed.provider_name,
            provider_url:  ytdata.oEmbed.provider_url,
            description:   ytdata.open_graph.description,
            html:          ytdata.oEmbed.html
        };
        if (ytdata.open_graph.images
         && ytdata.open_graph.images.length >= 1
         && ytdata.open_graph.images[0].url) {
            ret.image_url = ytdata.open_graph.images[0].url;
        }
        return ret;
    }

    async fetchSlideShareEmbed(embedurl) {
        let data = await this.fetchUnfurl(embedurl);
        let ytdata = data; // .result;
        // let ytdata = await this.fetchUnfurl(embedurl);
        let ret = {
            ytdata:        ytdata,
            url:           ytdata.open_graph.url,
            author_name:   ytdata.oEmbed.author_name,
            author_url:    ytdata.oEmbed.author_url,
            width:         ytdata.oEmbed.width,
            heght:         ytdata.oEmbed.height,
            provider_name: ytdata.oEmbed.provider_name,
            provider_url:  ytdata.oEmbed.provider_url,
            description:   ytdata.open_graph.description,
            html:          ytdata.oEmbed.html
        };
        if (ytdata.open_graph.images
         && ytdata.open_graph.images.length >= 1
         && ytdata.open_graph.images[0].url) {
            ret.image_url = ytdata.open_graph.images[0].url;
        }
        return ret;
    }

    // Yes, this function is nearly identical with some of the
    // preceeding functions.  It is possible that those other sites
    // will return specific data through Unfurl that we want to
    // expose.  Hence, the multiple implementations.

    async fetchUnfurlResource(embedurl) {
        // console.log(embedurl);
        let data = await this.fetchUnfurl(embedurl);
        let ytdata = data; // .result;
        // console.log(`fetchUnfurlResource ${embedurl} ${util.inspect(data)}`);
        if (!ytdata) {
            throw new Error(`fetchUnfurlResource No fetchUnfurl data for ${embedurl} ${util.inspect(data)}`);
        }
        if (!ytdata.open_graph) {
            throw new Error(`fetchUnfurlResource No Open Graph data for ${embedurl} ${util.inspect(data)}`);
        }
        if (!ytdata.oEmbed) {
            throw new Error(`fetchUnfurlResource No oEmbed data for ${embedurl} ${util.inspect(data)}`);
        }
        let ret = {
            ytdata:        ytdata,
            url:           ytdata.open_graph.url,
            author_name:   ytdata.oEmbed.author_name,
            author_url:    ytdata.oEmbed.author_url,
            width:         ytdata.oEmbed.width,
            heght:         ytdata.oEmbed.height,
            provider_name: ytdata.oEmbed.provider_name,
            provider_url:  ytdata.oEmbed.provider_url,
            description:   ytdata.open_graph.description,
            html:          ytdata.oEmbed.html
        };
        if (ytdata.open_graph.images
         && ytdata.open_graph.images.length >= 1
         && ytdata.open_graph.images[0].url) {
            ret.image_url = ytdata.open_graph.images[0].url;
        }
        return ret;
    }

    async resource(attrs) {

        // Each of a specific list of sites might require
        // specific treatment for that site.  Hence, we will
        // use multiple fetchXYZZY functions.
        //
        // But in practice it was found that Unfurl provides
        // pretty good information and does a good job of
        // regularizing the data irregardless of which site
        // the data comes from.  So we ended up with one
        // function, fetchUnfurlResource.

        let data;
        if (attrs.href.indexOf('facebook.com') >= 0) {
            data = await this.fetchFacebookEmbed(attrs.href);
        } else if (attrs.href.indexOf('twitter.com') >= 0) {
            // data = await this.fetchTwitterEmbed(attrs.href);
            data = await this.fetchUnfurlResource(attrs.href);
        } else if (attrs.href.indexOf('youtube.com') >= 0) {
            // data = await this.fetchYouTubeEmbed(attrs.href);
            data = await this.fetchUnfurlResource(attrs.href);
        } else if (attrs.href.indexOf('slideshare.com') >= 0) {
            // data = await this.fetchSlideShareEmbed(attrs.href);
            data = await this.fetchUnfurlResource(attrs.href);
        } else {
            data = await this.fetchUnfurlResource(attrs.href);
        }

        let title2use;
        if (attrs.title) title2use = attrs.title;
        else if (data.metadata && data.metadata.title) title2use = data.metadata.title;
        else title2use = "";

        const mdata = {
            embedData: data,
            embedCode: data.html,
            title: title2use,
            embedUrl: data.author_url ? data.author_url : attrs.href,
            embedSource: data.author_name ? data.author_name : data.author_url,
            embedClass: attrs._class,
            embedHref: attrs.href,
            width: attrs.width, style: attrs.style, align: attrs.align, 
            // , enableResponsive
        };
        if (data.description) {
            mdata.description = data.description;
        } else if (data.metadata && data.metadata.ogDescription) {
            mdata.description = data.metadata.ogDescription;
        } else if (data.metadata && data.metadata.description) {
            mdata.description = data.metadata.description;
        } else if (data.metadata && data.metadata.twitterDescription) {
            mdata.description = data.metadata.twitterDescription;
        } else {
            mdata.description = "";
        }
        if (data.image_url) {
            mdata.imageUrl = data.image_url;
        } else if (data.metadata && data.metadata.ogImage) {
            mdata.imageUrl = data.metadata.ogImage;
        } else if (data.metadata && data.metadata.twitterImage) {
            mdata.imageUrl = data.metadata.twitterImage;
        } else if (data.thumbnail_url) {
            mdata.imageUrl = data.thumbnail_url;
        } else {
            mdata.imageUrl = "/no-image.gif";
        }
        return mdata;
    }

};

module.exports.mahabhutaArray = function(options) {
    let ret = new mahabhuta.MahafuncArray(pluginName, options);
    ret.addMahafunc(new EmbedResourceContent());
    ret.addMahafunc(new EmbedYouTube());
    ret.addMahafunc(new VideoPlayersFromVideoURLS());
    ret.addMahafunc(new VideoThumbnailsFromVideoURLS());
    return ret;
};

class EmbedResourceContent extends mahabhuta.CustomElement {
    get elementName() { return "embed-resource"; }
    async process($element, metadata, dirty) {
        dirty();
        const href = $element.attr("href");
        if (!href) throw new Error("URL required for embed-resource");
        const template = $element.attr('template') ? $element.attr('template') :  "embed-resource.html.ejs";
        const width  = $element.attr('width') ? $element.attr('width') : undefined;
        // var height = $element.attr('height') ? $element.attr('height') : undefined;
        const _class = $element.attr('class') ? $element.attr('class') : undefined;
        const style  = $element.attr('style') ? $element.attr('style') : undefined;
        const align  = $element.attr('align') ? $element.attr('align') : undefined;
        const title  = $element.attr('title') ? $element.attr('title') : undefined;

        // TODO capture the body text, making it available to the template

        const mdata = await this.array.options.config.plugin(pluginName).resource({
            href, template, width, _class, style, align, title
        });
        
        if (!mdata.embedCode) {
            throw new Error(`EmbedResourceContent FAIL to retrieve data for ${attrs.href} in ${metadata.document.path} data ${data} mdata ${util.inspect(mdata)}`);
        }

        return akasha.partial(this.array.options.config, template, mdata);
    }
}

class EmbedYouTube extends mahabhuta.CustomElement {
    get elementName() { return "embed-youtube"; }
    async process($element, metadata, dirty) {

        // API documentation - https://developers.google.com/youtube/player_parameters

        const code = $element.attr("code");
        if (!code) throw new Error("code required for embed-youtube");
        const template = $element.attr('template') ? $element.attr('template') : "embed-youtube.html.ejs";
        // var height = $element.attr('height') ? $element.attr('height') : undefined;
        const _class   = $element.attr('class') ? $element.attr('class') : "embed-youtube";
        const style    = $element.attr('style') ? $element.attr('style') : undefined;
        const title    = $element.attr('title') ? $element.attr('title') : undefined;
        const id       = $element.attr('id')    ? $element.attr('id')    : undefined;
        const autoplay = $element.attr('autoplay') ? $element.attr('autoplay')    : undefined;
        dirty();
        const embedURL = new URL("https://www.youtube.com/embed/");
        embedURL.pathname = "/embed/" + code;
        if (autoplay) embedURL.searchParams.set("autoplay", autoplay);
        const description = $element.html() ? $element.html() : (
            $element.attr('description') ? $element.attr('description') : undefined
        );
        const mdata = {
            youtubeCode: code,
            embedURL: embedURL.href,
            embedClass: _class, id,
            title, style, description
        };
        return akasha.partial(this.array.options.config, template, mdata);
    }
}

class VideoPlayersFromVideoURLS extends mahabhuta.CustomElement {
    get elementName() { return "video-players-from-videourls"; }
    async process($element, metadata, dirty) {
        const template = $element.attr('template') 
                ? $element.attr('template') 
                : "video-players-from-videourls.html.ejs";
        dirty();
        return akasha.partial(this.array.options.config, template, metadata);
    }
}

class VideoThumbnailsFromVideoURLS extends mahabhuta.CustomElement {
    get elementName() { return "video-thumbnail-from-videourls"; }
    async process($element, metadata, dirty) {
        const template = $element.attr('template') 
                ? $element.attr('template') 
                : "video-thumbnail-from-videourls.html.ejs";
        dirty();
        return akasha.partial(this.array.options.config, template, metadata);
    }
}

// These are here to throw errors in case old tags are used.

/* class EmbedThumbnailContent extends mahabhuta.CustomElement {
    get elementName() { return "embed-thumbnail"; }
    process($element, metadata, dirty) {
        return Promise.reject(new Error("embed-thumbnail DEPRECATED"));
    }
}
module.exports.mahabhuta.addMahafunc(new EmbedThumbnailContent()); */

/* module.exports.mahabhuta.addMahafunc(function($, metadata, dirty, done) {
		// <youtube-metadata id="" href=".."/>
		var elemsYT = [];
		$('youtube-metadata').each(function(i, elem) { elemsYT[i] = elem; });
        if (elemsYT.length > 0) return done(new Error("DEPRECATED youtube-metadata"));
        else done();
	}); */

/* module.exports.mahabhuta.addMahafunc(
	function($, metadata, dirty, done) {
		var elements = [];
		$('framed-embed').each((i, elem) => { elements.push(elem); });
		$('simple-embed').each((i, elem) => { elements.push(elem); });
		// console.log(`framed/simple-embed ${elements.length}`);
        if (elements.length > 0) return done(new Error("DEPRECATED framed/simple-embed"));
        else done();
	}); */

/* module.exports.mahabhuta.addMahafunc(
	function($, metadata, dirty, done) {
		// <youtube-title id="" href=".."/>
		var elemsYT = [];
		$('youtube-title').each(function(i, elem) { elemsYT.push(elem); });
		$('youtube-author').each(function(i, elem) { elemsYT.push(elem); });
		$('youtube-description').each(function(i, elem) { elemsYT.push(elem); });
		$('youtube-publ-date').each(function(i, elem) { elemsYT.push(elem); });
		$('framed-youtube-player').each(function(i, elem) { elemsYT.push(elem); });
        if (elemsYT.length > 0) return done(new Error("DEPRECATED youtube-title/etc"));
        else done();
	}); */

/* module.exports.mahabhuta.addMahafunc(
	function($, metadata, dirty, done) {
		// <vimeo-player url="..." />
		// <vimeo-thumbnail url="..." />
		// <vimeo-title url="..." />
		// <vimeo-author url="..." />
		// <vimeo-description url="..." />

		var elements = [];
		$('vimeo-player').each(function(i, elem) { elements.push(elem); });
		$('framed-vimeo-player').each(function(i, elem) { elements.push(elem); });
		$('vimeo-thumbnail').each(function(i, elem) { elements.push(elem); });
		$('vimeo-title').each(function(i, elem) { elements.push(elem); });
		$('vimeo-author').each(function(i, elem) { elements.push(elem); });
		$('vimeo-description').each(function(i, elem) { elements.push(elem); });
        if (elements.length > 0) return done(new Error("DEPRECATED vimeo-title/etc"));
        else done();
	}); */

/* module.exports.mahabhuta.addMahafunc(
	function($, metadata, dirty, done) {
		// <slideshare-embed href=".."
		var elements = [];
		$('slideshare-embed').each(function(i, elem) { elements.push(elem); });
		$('slideshare-metadata').each(function(i, elem) { elements.push(elem); });
        if (elements.length > 0) return done(new Error("DEPRECATED slideshare-embed/etc"));
        else done();
	}); */

/* module.exports.mahabhuta.addMahafunc(
	function($, metadata, dirty, done) {
		// <twitter-embed href=".."
		var elements = [];
		$('twitter-embed').each(function(i, elem) { elements.push(elem); });
        if (elements.length > 0) return done(new Error("DEPRECATED twitter-embed/etc"));
        else done();
	}); */

/* module.exports.mahabhuta.addMahafunc(
	function($, metadata, dirty, done) {
		// <oembed href="..." optional: template="..."/>
		var elemsOE = [];
		$('oembed').each(function(i, elem) { elemsOE[i] = elem; });
        if (elemsOE.length > 0) return done(new Error("DEPRECATED oembed/etc"));
        else done();
	}); */
