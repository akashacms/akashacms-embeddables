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
const url      = require('url');
const co       = require('co');
const async    = require('async');
const request  = require('request');
const akasha   = require('akasharender');
const mahabhuta = require('mahabhuta');

const CachemanFile = require('cacheman-file');
const cache = new CachemanFile({
    tmpDir: "embeddables-cache"
});

const extract = require('meta-extractor');
const oembetter = require('oembetter')();

const doExtract = (url) => {
    return new Promise((resolve, reject) => {
        extract({ uri: url }, (err, res) => {
            if (err) { reject(err); }
            else { resolve(res); }
        });
    })
};

oembetter.addAfter((url, options, response, callback) => {
    doExtract(url)
    .then(result => {
        response.metadata = result;
        callback();
    })
    .catch(err => { callback(); });
});

oembetter.addFallback(function(url, options, callback) {
    doExtract(url)
    .then(result => {
        callback(undefined, {
            metadata: result
        });
    })
    .catch(err => { callback(err); });
});

const log     = require('debug')('akasha:embeddables-plugin');
const error   = require('debug')('akasha:error-embeddables-plugin');

const pluginName = "akashacms-embeddables";

module.exports = class EmbeddablesPlugin extends akasha.Plugin {
	constructor() {
		super(pluginName);
	}

	configure(config) {
		this._config = config;
		config.addPartialsDir(path.join(__dirname, 'partials'));
		config.addAssetsDir(path.join(__dirname, 'assets'));
		config.addMahabhuta(module.exports.mahabhuta);
	}

	set youtubeKey(key) {
        throw new Error('DEPRECATED');
		if (!this._config.embeddables) this._config.embeddables = {};
		this._config.embeddables.youtubeKey = key;
		youtube.setKey(key);
	}

	get youtubeKey() {
        throw new Error('DEPRECATED');
		if (!this._config.embeddables) this._config.embeddables = {};
		return this._config.embeddables.youtubeKey;
	}

    fetchEmbedData(embedurl) {
        /* return co(function* () {
            var data = yield new Promise((resolve, reject) => {
                cache.get(embedurl, (err, data) => {
                    if (err) return reject(err);
                    if (data) return resolve(data);
                });
            });
            if (data) return data;
            data = yield new Promise((resolve, reject) => {
                oembetter.fetch(embedurl, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
            return yield new Promise((resolve, reject) => {
                cache.set(embedurl, 10*24*60*60, data, (err, value) => {
                    if (err) reject(err);
                    else resolve(data);
                });
            });
        }); */
        /* * /
        return new Promise((resolve, reject) => {
            cache.get(embedurl, (err, data) => {
                if (err) return reject(err);
                if (data) return resolve(data);

                oembetter.fetch(embedurl, (err, result) => {
                    if (err) return reject(err);
                    cache.set(embedurl, 10*24*60*60, result, (err, value) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });
            });
        });/ * */

        /* */
        var data = akasha.cache.get(pluginName+':fetchEmbedData', embedurl);
        if (data) {
            return Promise.resolve(data);
        }
        return new Promise((resolve, reject) => {
            oembetter.fetch(embedurl, (err, result) => {
                if (err) reject(err);
                else {
                    akasha.cache.set(pluginName+':fetchEmbedData', embedurl, result);
                    resolve(result);
                }
            });
        }); /* */
    }
};

module.exports.mahabhuta = new mahabhuta.MahafuncArray(pluginName, {});

class EmbedResourceContent extends mahabhuta.CustomElement {
    get elementName() { return "embed-resource"; }
    process($element, metadata, dirty) {
        dirty();
        var href = $element.attr("href");
        if (!href) throw new Error("URL required for embed-resource");
        var template = $element.attr('template');
        if (!template) template = "embed-resource.html.ejs";
        var width  = $element.attr('width') ? $element.attr('width') : undefined;
        // var height = $element.attr('height') ? $element.attr('height') : undefined;
        var _class = $element.attr('class') ? $element.attr('class') : undefined;
        var style  = $element.attr('style') ? $element.attr('style') : undefined;
        var align  = $element.attr('align') ? $element.attr('align') : undefined;
        var title  = $element.attr('title') ? $element.attr('title') : undefined;

        // TODO capture the body text, making it available to the template

        /* var enableResponsive = $element.attr('enable-responsive') ? $element.attr('enable-responsive') : undefined;

        if (enableResponsive && enableResponsive === "yes") {
            enableResponsive = "embed-responsive embed-responsive-16by9";
        } */

        return metadata.config.plugin(pluginName).fetchEmbedData(href)
        .then(data => {
            var mdata = {
                embedData: data,
                embedCode: data.html,
                title: data.metadata && data.metadata.title ? data.metadata.title : "",
                embedUrl: data.author_url ? data.author_url : href,
                embedSource: data.author_name ? data.author_name : data.author_url,
                embedClass: _class,
                width, style, align
                // , enableResponsive
            };
            if (data.metadata && data.metadata.ogDescription) {
                mdata.description = data.metadata.ogDescription;
            } else if (data.metadata && data.metadata.description) {
                mdata.description = data.metadata.description;
            } else if (data.metadata && data.metadata.twitterDescription) {
                mdata.description = data.metadata.twitterDescription;
            } else {
                mdata.description = "";
            }
            if (data.metadata && data.metadata.ogImage) {
                mdata.imageUrl = data.metadata.ogImage;
            } else if (data.metadata && data.metadata.twitterImage) {
                mdata.imageUrl = data.metadata.twitterImage;
            } else if (data.thumbnail_url) {
                mdata.imageUrl = data.thumbnail_url;
            }
            return akasha.partial(metadata.config, template, mdata);
        });
    }
}
module.exports.mahabhuta.addMahafunc(new EmbedResourceContent());

class EmbedThumbnailContent extends mahabhuta.CustomElement {
    get elementName() { return "embed-thumbnail"; }
    process($element, metadata, dirty) {
        return Promise.reject(new Error("embed-thumbnail DEPRECATED"));
    }
}
module.exports.mahabhuta.addMahafunc(new EmbedThumbnailContent());

module.exports.mahabhuta.addMahafunc(function($, metadata, dirty, done) {
		// <youtube-metadata id="" href=".."/>
		var elemsYT = [];
		$('youtube-metadata').each(function(i, elem) { elemsYT[i] = elem; });
        if (elemsYT.length > 0) return done(new Error("DEPRECATED youtube-metadata"));
        else done();
	});

module.exports.mahabhuta.addMahafunc(
	function($, metadata, dirty, done) {
		var elements = [];
		$('framed-embed').each((i, elem) => { elements.push(elem); });
		$('simple-embed').each((i, elem) => { elements.push(elem); });
		// console.log(`framed/simple-embed ${elements.length}`);
        if (elements.length > 0) return done(new Error("DEPRECATED framed/simple-embed"));
        else done();
	});

module.exports.mahabhuta.addMahafunc(
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
	});

module.exports.mahabhuta.addMahafunc(
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
	});

module.exports.mahabhuta.addMahafunc(
	function($, metadata, dirty, done) {
		// <slideshare-embed href=".."
		var elements = [];
		$('slideshare-embed').each(function(i, elem) { elements.push(elem); });
		$('slideshare-metadata').each(function(i, elem) { elements.push(elem); });
        if (elements.length > 0) return done(new Error("DEPRECATED slideshare-embed/etc"));
        else done();
	});

module.exports.mahabhuta.addMahafunc(
	function($, metadata, dirty, done) {
		// <twitter-embed href=".."
		var elements = [];
		$('twitter-embed').each(function(i, elem) { elements.push(elem); });
        if (elements.length > 0) return done(new Error("DEPRECATED twitter-embed/etc"));
        else done();
	});

module.exports.mahabhuta.addMahafunc(
	function($, metadata, dirty, done) {
		// <oembed href="..." optional: template="..."/>
		var elemsOE = [];
		$('oembed').each(function(i, elem) { elemsOE[i] = elem; });
        if (elemsOE.length > 0) return done(new Error("DEPRECATED oembed/etc"));
        else done();
	});
