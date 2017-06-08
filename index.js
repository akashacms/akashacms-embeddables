/**
 *
 * Copyright 2013-2015 David Herron
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
const Metaphor = require('metaphor');
const urlEmbed = require('url-embed');

const YouTube = require('youtube-node');
const youtube = new YouTube();

const engine  = new Metaphor.Engine();

let EmbedEngine = urlEmbed.EmbedEngine;
let Embed =  urlEmbed.Embed;
let urlEngine = new EmbedEngine({
  timeoutMs: 20000,
  referrer: '7gen.com'
});
urlEngine.registerDefaultProviders();

const log     = require('debug')('akasha:embeddables-plugin');
const error   = require('debug')('akasha:error-embeddables-plugin');

module.exports = class EmbeddablesPlugin extends akasha.Plugin {
	constructor() {
		super("akashacms-embeddables");
	}

	configure(config) {
		this._config = config;
		config.addPartialsDir(path.join(__dirname, 'partials'));
		config.addAssetsDir(path.join(__dirname, 'assets'));
		config.addMahabhuta(module.exports.mahabhuta);
	}

	set youtubeKey(key) {
		if (!this._config.embeddables) this._config.embeddables = {};
		this._config.embeddables.youtubeKey = key;
		youtube.setKey(key);
	}

	get youtubeKey() {
		if (!this._config.embeddables) this._config.embeddables = {};
		return this._config.embeddables.youtubeKey;
	}
};

var ytVidz = [];
var ytVidInfo = module.exports.youtubeVidInfo = function(config, id, done) {
    if (ytVidz[id]) {
        // util.log('ytVidInfo id='+ id +' '+ util.inspect(ytVidz[id]));
        done(null, ytVidz[id]);
    } else {
		if (config.plugin("akashacms-embeddables").youtubeKey) {
			// If we have a youtubeKey then it's safe to call the youtube API
			youtube.getById(id, function(resultData) {
				// util.log('ytVidInfo id='+ id +' '+ util.inspect(resultData));
				if (!resultData) {
					log("No resultData for id "+ id);
					done(new Error("No resultData for id "+ id));
				} else if (resultData.error) {
					error(resultData.error.message);
					done(new Error(resultData.error.message +' for id '+ id));
				} else {
					ytVidz[id] = resultData;
					done(null, resultData);
				}
			});
		} else {
			// otherwise we call youtube's oEmbed API ... then deal with the limited returned data
			youtubeOEmbedData(url.format({
				protocol: 'https',
				hostname: 'www.youtube.com',
				pathname: '/watch',
				query: {
					v: id
				}
			}), function(err, results) {
				if (err) done(err);
				else {
					// Construct a fake response as if we'd called the youtube API
					done(null, {
						oEmbedData: results,  // include the oEmbed data
						kind: 'youtube#videoListResponse',
						pageInfo: { totalResults: 1, resultsPerPage: 1 },
						items: [ {
							id: id,
							kind: 'youtube#video',
							snippet: {
								title: results.title,
								description: "",
								thumbnails: {
									"default": {
										url: results.thumbnail_url,
										width: results.thumbnail_width,
										height: results.thumbnail_height
									}
								},
								channelTitle: results.author_name,
								publishedAt: ""
							}
						} ]
					});
				}
			});
		}
    }
};

var ytGetUrl = function($, elemYT) {
	var newurl;
	if (typeof elemYT === 'string') {
		// util.log('ytGetUrl elemYT='+ elemYT);
	    return elemYT;
	} else if (elemYT && $(elemYT).attr('href')) {
        newurl =  $(elemYT).attr('href');
		// util.log('ytGetUrl href='+ newurl);
		return newurl;
    } else if (elemYT && $(elemYT).attr('url')) {
        newurl = $(elemYT).attr('url');
		// util.log('ytGetUrl url='+ newurl);
		return newurl;
    } else if (elemYT && $(elemYT).attr('id')) {
        newurl = url.format({
			protocol: 'https',
			hostname: 'www.youtube.com',
			pathname: '/watch',
			query: {
				v: $(elemYT).attr('id')
			}
		});
		// util.log('ytGetUrl newurl='+ newurl);
		return newurl;
    } else {
		// util.log('ytGetUrl NULL');
        return null;
    }
};

var ytGetId = function($, elemYT) {
    var id;
	var idFromUrl = function(href) {
		var yturl = url.parse(href, true);
		// util.log('idFromUrl '+ util.inspect(yturl));
        if (yturl.query && yturl.query.v) {
            // util.log('returning ' +yturl.query.v);
            return yturl.query.v;
        } else {
            // util.log('returning NULL ');
			return null;
		}
	};
	var _yturl;
	if (typeof elemYT === 'string') {
		return idFromUrl(elemYT);
	} else if (elemYT && $(elemYT).attr('id')) {
        id = $(elemYT).attr('id');
    } else if (elemYT && $(elemYT).attr('href')) {
        _yturl = $(elemYT).attr('href');
		// util.log('ytGetId href='+ _yturl);
		return idFromUrl(_yturl);
    } else if (elemYT && $(elemYT).attr('url')) {
        _yturl = $(elemYT).attr('url');
		// util.log('ytGetId url='+ _yturl);
		return idFromUrl(_yturl);
    }
	// util.log('ytGetId id='+ id);
    return id;
};

var ytBestThumbnail = function(thumbs) {
    if (thumbs && thumbs.standard && thumbs.standard.url) {
        return thumbs.standard.url;
    } else if (thumbs && thumbs.high && thumbs.high.url) {
        return thumbs.high.url;
    } else if (thumbs && thumbs.medium && thumbs.medium.url) {
        return thumbs.medium.url;
    } else if (thumbs && thumbs["default"] && thumbs["default"].url) {
        return thumbs["default"].url;
    } else {
        return "";
    }
};


var ytPlayerCode = function($, config, elemYT, id) {

	var width = $(elemYT).attr('width')   ? $(elemYT).attr('width')  : undefined;
	var height = $(elemYT).attr('height') ? $(elemYT).attr('height') : undefined;
	var _class = $(elemYT).attr('class')  ? $(elemYT).attr('class')  : undefined;
	var style = $(elemYT).attr('style')   ? $(elemYT).attr('style')  : undefined;

	if (!width && !height) {
		width = "480";
		height = "270";
	}

	var yturl = {
		protocol: "http",
		hostname: "www.youtube.com",
		pathname: "/embed/"+ id,
		query: []
	};

	/*
	TODO update akashacms.com
	TODO add a page of youtube embed examples

	TODO add new section to akashacms.com - layout examples - first is the youtube layout
	*/

	// These options are explained here: https://developers.google.com/youtube/player_parameters

	if ($(elemYT).attr('autohide')) yturl.query.autohide = $(elemYT).attr('autohide');
	if ($(elemYT).attr('autoplay')) yturl.query.autoplay = $(elemYT).attr('autoplay');
	if ($(elemYT).attr('cc_load_policy')) yturl.query.cc_load_policy = $(elemYT).attr('cc_load_policy');
	if ($(elemYT).attr('color')) 	yturl.query.color = $(elemYT).attr('color');
	if ($(elemYT).attr('controls')) yturl.query.controls = $(elemYT).attr('controls');
	if ($(elemYT).attr('disablekb')) yturl.query.disablekb = $(elemYT).attr('disablekb');
	if ($(elemYT).attr('enablejsapi')) yturl.query.enablejsapi = $(elemYT).attr('enablejsapi');
	if ($(elemYT).attr('end'))      yturl.query.end = $(elemYT).attr('end');
	if ($(elemYT).attr('fs'))       yturl.query.fs = $(elemYT).attr('fs');
	if ($(elemYT).attr('hl'))       yturl.query.hl = $(elemYT).attr('hl');
	if ($(elemYT).attr('iv_load_policy')) yturl.query.iv_load_policy = $(elemYT).attr('iv_load_policy');
	if ($(elemYT).attr('list'))     yturl.query.list = $(elemYT).attr('list');
	if ($(elemYT).attr('listType')) yturl.query.listType = $(elemYT).attr('listType');
	if ($(elemYT).attr('loop'))     yturl.query.loop = $(elemYT).attr('loop');
	if ($(elemYT).attr('modestbranding')) yturl.query.modestbranding = $(elemYT).attr('modestbranding');
	if ($(elemYT).attr('origin'))   yturl.query.origin = $(elemYT).attr('origin');
	if ($(elemYT).attr('playerapiid')) yturl.query.playerapiid = $(elemYT).attr('playerapiid');
	if ($(elemYT).attr('playlist')) yturl.query.playlist = $(elemYT).attr('playlist');
	if ($(elemYT).attr('playsinline')) yturl.query.playsinline = $(elemYT).attr('playsinline');
	if ($(elemYT).attr('rel'))      yturl.query.rel = $(elemYT).attr('rel');
	if ($(elemYT).attr('showinfo')) yturl.query.showinfo = $(elemYT).attr('showinfo');
	if ($(elemYT).attr('start'))    yturl.query.start = $(elemYT).attr('start');
	if ($(elemYT).attr('theme'))    yturl.query.theme = $(elemYT).attr('theme');

	yturl = url.format(yturl);
	var code = akasha.partialSync(config, "youtube-embed-code.html.ejs", {
		idYouTube: id,
		width: width,
		height: height,
		ytclass: _class,
		style: style,
		frameborder: "0",
		yturl
	});
	// log('embedCode for '+ yturl +' = '+ code);
	return code;
};

// http://apiblog.youtube.com/2009/10/oembed-support.html
var youtubeOEmbedCache = [];
var youtubeOEmbedData = module.exports.youtubeOEmbedData = function(url2request, done) {
	if (youtubeOEmbedCache[url2request]) {
		done(undefined, youtubeOEmbedCache[url2request]);
	} else {
		request(url.format({
			protocol: 'http',
			host: 'www.youtube.com',
			pathname: '/oembed',
			query: {
				url: url2request,
				format: "json"
			}
		}),
		function(err, res, body) {
			if (err) { error(err); done(err); }
			else {
				// log('youtubeOEmbedData url= '+ url2request +' result= '+ body);
				try {
					youtubeOEmbedCache[url2request] = JSON.parse(body);
					done(undefined, youtubeOEmbedCache[url2request]);
				} catch (e) {
					done(new Error('FAILURE '+ e +' on URL '+ url2request));
				}
			}
		});
	}
};

var vimeoCache = [];
var vimeoData = module.exports.vimeoData = function(url2request, done) {
	// log('vimeoData '+ url2request);
	if (vimeoCache[url2request]) {
		done(undefined, vimeoCache[url2request]);
	} else {
		request(url.format({
			protocol: 'https',
			host: 'vimeo.com',
			pathname: '/api/oembed.json',
			query: {
				url: url2request
			}
		}),
		function(err, res, body) {
			if (err) { error(err); done(err); }
			else {
				// log(body);
				vimeoCache[url2request] = JSON.parse(body);
				done(undefined, vimeoCache[url2request]);
			}
		});
	}
};

// http://www.slideshare.net/developers/oembed
var slideshareCache = [];
var slideshareData = module.exports.slideshareData = function(url2request, done) {
	if (slideshareCache[url2request]) {
		done(undefined, slideshareCache[url2request]);
	} else {
		request(url.format({
			protocol: 'http',
			host: 'www.slideshare.com',
			pathname:	'/api/oembed/2',
			query: {
				url: url2request,
				format: "json"
			}
		}),
		function(err, res, body) {
			if (err) { error(err); done(err); }
			else {
				// log(body);
				slideshareCache[url2request] = JSON.parse(body);
				done(undefined, slideshareCache[url2request]);
			}
		});
	}
};

var generateGoogleDocViewerUrl = function(documentUrl) {
    return url.format({
        protocol: "http",
        hostname: "docs.google.com",
        pathname: "viewer",
        query: {
            url: documentUrl, embedded: true
        }
    });
};

var generateViewerJSURL = function(docUrl) {
    if (docUrl.indexOf('http://') === 0 || docUrl.indexOf('https://') === 0) {
        return docUrl;
    } else if (docUrl.indexOf('/') === 0) {
        return "../../.."+ docUrl;
    } else {
        return "../../../"+ docUrl;
    }
};

var engineDescribe = co.wrap(function* (url, cb) {
    var description = akasha.cache.get('akashacms-embeddables:describe', url);
    if (description) {
        log('engineDescribe had cache for '+ url);
        return description;
    } else {
        log('engineDescribe no cache for '+ url);
        return yield new Promise((resolve, reject) => {
            try {
                engine.describe(url, description => {
                    akasha.cache.set('akashacms-embeddables:describe', url, description);
                    resolve(description);
                });
            } catch (e) { reject(e); }
        });
    }
});

var urlEngineGetEmbed = co.wrap(function* (metadata, embedurl) {

    var description = akasha.cache.get('akashacms-embeddables:url-embed-data', embedurl);
    if (description) {
        return description;
    }

    let embed = new Embed(embedurl, {});
    embed = yield new Promise((resolve, reject) => {
        try {
            urlEngine.getEmbed(embed, (embed) => {
                if (!embed) {
                    reject(new Error(`url-embed NO DATA for url ${embedurl} in ${metadata.document.path}`));
                } else if (embed.error) {
                    reject(new Error("url-embed failed for url "+ embedurl +" in "+ metadata.document.path +" with error "+ embed.error));
                } else {
                    akasha.cache.set('akashacms-embeddables:url-embed-data', embedurl, embed);
                    resolve(embed);
                }
            });
        } catch (e) { reject(e); }
    });

});



module.exports.mahabhuta = [

	function($, metadata, dirty, done) {
		// <youtube-video href=".."/>  TBD: autoplay, thumbnail+lightbox
		var elemsYT = [];
		$('youtube-video').each(function(i, elem) { elemsYT.push(elem); });
		$('youtube-video-embed').each(function(i, elem) { elemsYT.push(elem); });
		$('youtube-thumbnail').each(function(i, elem) { elemsYT.push(elem); });
		// util.log(util.inspect(elemsYT));
		async.eachSeries(elemsYT, function(elemYT, next) {
			// util.log(util.inspect(elemYT));

            var embedurl = ytGetUrl($, elemYT);
            var template = $(elemYT).attr('template');

            urlEngineGetEmbed(metadata, embedurl)
            .then(embed => {
                if (elemYT.name /* .prop('tagName') */ === 'youtube-video') {
                    akasha.partial(metadata.config, template ? template : "youtube-embed.html.ejs", {
                        title: embed.data.title,
                        html: embed.data.html,
                        author_url: embed.data.author_url,
                        author_name: embed.data.author_name
                    })
                    .then(embed => {
                        $(elemYT).replaceWith(embed);
                        next();
                    })
                    .catch(err => { error(err); next(err); });
                } else if (elemYT.name /* .prop('tagName') */ === 'youtube-video-embed') {
                    $(elemYT).replaceWith(embed.data.html);
                    next();
                } else if (elemYT.name /* .prop('tagName') */ === 'youtube-thumbnail') {
                    var thumbs = item ? item.snippet.thumbnails : undefined;
                    // if (_class === 'embed-yt-video') _class = 'embed-yt-thumb';
                    var align = $(elemYT).attr('align') ? $(elemYT).attr('align') : undefined;
                    var width = $(elemYT).attr('width')	? $(elemYT).attr('width') : "100%";
                    // var height = $(elemYT).attr('height') ? $(elemYT).attr('height') : undefined;
                    var _class = $(elemYT).attr('class')  ? $(elemYT).attr('class')  : undefined;
                    var style = $(elemYT).attr('style')   ? $(elemYT).attr('style')  : undefined;
                    var title = $(elemYT).attr('title')   ? $(elemYT).attr('title')  : undefined;
                    var alt   = $(elemYT).attr('alt')     ? $(elemYT).attr('alt')    : undefined;

                    if (!title) {
                        if (embed.data.title) {
                            title = embed.data.title;
                        }
                    }

                    akasha.partial(metadata.config, template ? template : "youtube-thumb.html.ejs", {
                        imgwidth: width,
                        imgalign: align,
                        imgclass: _class,
                        style, title, alt,
                        imgurl: embed.data.thumbnail_url
                    })
                    .then(thumb => {
                        // log('youtube-thumb '+ thumb);
                        $(elemYT).replaceWith(thumb);
                        dirty();
                        next();
                    })
                    .catch(err => { error(err); next(err); });
                } else next(new Error("didn't match -video or -video-embed or -thumbnail "+ elemYT.name));
            })
            .catch(err => {
                return next(new Error("url-embed failed for url "+ embedurl +" in "+ metadata.document.path +" with error "+ err));
            });

            /*
			log(elemYT.name);
			var yturl = ytGetUrl($, elemYT);
			var id = ytGetId($, yturl);
			if (!id) {
				next(new Error("No Youtube ID"));
			} else {
				ytVidInfo(metadata.config, id, function(err, resultData) {
					if (err) next(err);
					else {
						var result = resultData;
						var item = result.items && result.items.length >= 0 ? result.items[0] : null;
						// var thumbs = item.snippet.thumbnails;

						console.log(elemYT.name +' ytVidInfo id='+ id +' data='+ util.inspect(result));

						var template = $(elemYT).attr('template');
						var player;
                        dirty();

						if (item) {
							if (elemYT.name === 'youtube-video' || elemYT.name === 'youtube-video-embed')
								player = ytPlayerCode($, metadata.config, elemYT, id);

							if (elemYT.name /* .prop('tagName') * / === 'youtube-video') {
								akasha.partial(metadata.config, template ? template : "youtube-embed.html.ejs", {
									title: item ? item.snippet.title : "",
									html: player,
									author_url: item
											? ("http://youtube.com/user/"+ item.snippet.channelTitle +"/videos")
											: "",
									author_name: item ? item.snippet.channelTitle : ""
								})
								.then(embed => {
									$(elemYT).replaceWith(embed);
									next();
								})
								.catch(err => { error(err); next(err); });
							} else if (elemYT.name /* .prop('tagName') * / === 'youtube-video-embed') {
								$(elemYT).replaceWith(player);
								next();
							} else if (elemYT.name /* .prop('tagName') * / === 'youtube-thumbnail') {
								var thumbs = item ? item.snippet.thumbnails : undefined;
								// if (_class === 'embed-yt-video') _class = 'embed-yt-thumb';
								var align = $(elemYT).attr('align') ? $(elemYT).attr('align') : undefined;
								var width = $(elemYT).attr('width')	? $(elemYT).attr('width') : "100%";
								// var height = $(elemYT).attr('height') ? $(elemYT).attr('height') : undefined;
								var _class = $(elemYT).attr('class')  ? $(elemYT).attr('class')  : undefined;
								var style = $(elemYT).attr('style')   ? $(elemYT).attr('style')  : undefined;
								var title = $(elemYT).attr('title')   ? $(elemYT).attr('title')  : undefined;
								var alt   = $(elemYT).attr('alt')     ? $(elemYT).attr('alt')    : undefined;

								if (!title) {
									if (result.oEmbedData.title) {
										title = result.oEmbedData.title;
									}
								}

								akasha.partial(metadata.config, template ? template : "youtube-thumb.html.ejs", {
									imgwidth: width,
									imgalign: align,
									imgclass: _class,
									style, title, alt,
									imgurl: ytBestThumbnail(thumbs)
								})
								.then(thumb => {
									// log('youtube-thumb '+ thumb);
									$(elemYT).replaceWith(thumb);
									dirty();
									next();
								})
								.catch(err => { error(err); next(err); });
							} else next(new Error("didn't match -video or -video-embed or -thumbnail "+ elemYT.name));
						} else next(new Error("No match for youtube id="+ id));
					}
				});
			} */
		}, function(err) {
			if (err) done(err);
			else done();
		});
	},

	function($, metadata, dirty, done) {
		// <youtube-metadata id="" href=".."/>
		var elemsYT = [];
		$('youtube-metadata').each(function(i, elem) { elemsYT[i] = elem; });
		async.eachSeries(elemsYT, function(elemYT, next) {
			log(elemYT.name);
			// util.log($.html());
			var yturl = ytGetUrl($, elemYT);
			var id = ytGetId($, yturl);
			if (!id) {
				next(new Error("No Youtube ID in youtube-metadata")); // + util.inspect(elemYT)));
			} else {
				ytVidInfo(metadata.config, id, function(err, resultData) {
					if (err) next(err);
					else {
						var result = resultData;
						// log('youtube-metadata for '+ id +' '+ util.inspect(result));
						var item = result && result.items && result.items.length >= 0 ? result.items[0] : null;
						var thumbs = item ? item.snippet.thumbnails : undefined;
						if (!item) {
							next(new Error("(youtube-metadata) Youtube didn't get anything for id="+ id));
						} else if ($('head').get(0)) {
							// Only do this substitution if we are on a completely rendered page
							// log('youtube-metadata running w/ head element');
							$('head').append(
								'<meta property="og:image" content="'+ ytBestThumbnail(thumbs) +'"/>\n' +
								'<meta name="twitter:image" content="'+ ytBestThumbnail(thumbs) +'"/>\n'
							);
							$(elemYT).replaceWith('');
							next();
						} else {
							// log('youtube-metadata running before head element');
							next();
						}
					}
				});
			}
		}, function(err) {
			if (err) done(err);
			else done();
		});
	},

	function($, metadata, dirty, done) {
		var elements = [];
		$('embed-thumbnail').each((i, elem) => { elements.push(elem); });
		async.eachSeries(elements, (element, next) => {
			let template = $(element).attr('template');
            if (!template) template = "youtube-thumb.html.ejs";
			const embedurl = $(element).attr('href');
			if (!embedurl) {
				return next(new Error('No embed url in '+ metadata.document.path));
			}
            var width  = $(element).attr('width') ? $(element).attr('width') : undefined;
            // var height = $(element).attr('height') ? $(element).attr('height') : undefined;
            var _class = $(element).attr('class') ? $(element).attr('class') : undefined;
            var style  = $(element).attr('style') ? $(element).attr('style') : undefined;
            var align  = $(element).attr('align') ? $(element).attr('align') : undefined;
			log(element.name +' '+ metadata.document.path +' '+ embedurl);

            urlEngineGetEmbed(metadata, embedurl)
            .then(embed => {
                if (embed.data.thumbnail_url) {
                    akasha.partial(metadata.config, template, {
                        imgwidth: width,
                        imgalign: align,
                        imgclass: _class,
                        style: style,
                        imgurl: embed.data.thumbnail_url
                    })
                    .then(thumb => {
                        // log('vimeo-thumbnail '+ thumb);
                        $(element).replaceWith(thumb);
                        dirty();
                        next();
                    })
                    .catch(err => { error(err); next(err); });
                } else {
                  $(element).replaceWith("<img src='/no-image.gif'/>")
                  next();
                }
                // TODO allow site owner to define substitute image URL
            })
            .catch(err => {
                return next(new Error("url-embed failed for url "+ embedurl +" in "+ metadata.document.path +" with error "+ err));
            });

			/* engineDescribe(embedurl).then(description => {
				if (!description) {
					return next(new Error("No embed data for url "+ embedurl +" in "+ metadata.document.path));
				}
				if (description.thumbnail || description.image) {

					var width  = $(element).attr('width') ? $(element).attr('width') : undefined;
					// var height = $(element).attr('height') ? $(element).attr('height') : undefined;
					var _class = $(element).attr('class') ? $(element).attr('class') : undefined;
					var style  = $(element).attr('style') ? $(element).attr('style') : undefined;
					var align  = $(element).attr('align') ? $(element).attr('align') : undefined;

					akasha.partial(metadata.config, template ? template : "youtube-thumb.html.ejs", {
						imgwidth: width,
						imgalign: align,
						imgclass: _class,
						style: style,
						imgurl: description.thumbnail && description.thumbnail.url ? description.thumbnail.url : description.image.url
					})
					.then(thumb => {
						// log('vimeo-thumbnail '+ thumb);
						$(element).replaceWith(thumb);
						dirty();
						next();
					})
					.catch(err => { error(err); next(err); });
				} else {
					$(element).replaceWith("<img src='/no-image.gif'/>")
					next();
				}
				// TODO allow site owner to define substitute image URL
			}).catch(e => {
    			console.error('embed-thumbnail FAILURE on url '+
                    embedurl +' in '+ metadata.document.path
                    +' because '+ e);
    			next();
            }); */
		}, function(err) {
			if (err) done(err);
			else done();
		});
	},


	function($, metadata, dirty, done) {
		var elements = [];
		$('framed-embed').each((i, elem) => { elements.push(elem); });
		$('simple-embed').each((i, elem) => { elements.push(elem); });
		// console.log(`framed/simple-embed ${elements.length}`);
		async.eachSeries(elements, (element, next) => {
			var template = $(element).attr('template');
			var embedurl = $(element).attr('href');
			var title    = $(element).attr('title');
			if (!template) {
				if (element.name === 'framed-embed') {
					template = 'framed-embed.html.ejs';
				} else if (element.name === 'simple-embed') {
					template = 'simple-embed.html.ejs';
				} else {
					return next(new Error("Incorrect element.name "+ element.name +" SHOULD NOT HAPPEN"));
				}
			}
			if (!embedurl) {
				return next(new Error('No embed url in '+ metadata.document.path));
			}

            urlEngineGetEmbed(metadata, embedurl)
            .then(embed => {
                if (!title && embed.data.title) title = embed.data.title;
                else if (!title && embed.author_name) title = embed.author_name;
                else if (!title) title = "no-title";

                akasha.partial(metadata.config, template, {
                    embedUrl: embedurl,
                    embedSource: embed.data.provider_name,
                    title: title,
                    authorUrl: embed.data.author_url,
                    authorName: embed.data.author_name,
                    // publishedAt: item.snippet.publishedAt,
                    description: "",
                    embedCode: embed.data.html,
                    preview: embed.data.html,
                    fullEmbed: embed
                })
                .then(html => {
                    $(element).replaceWith(html);
                    dirty();
                    next();
                })
                .catch(err => { error(err); next(err); });
                // Embed markup
                // console.log(embed.data.html);
            })
            .catch(err => {
                return next(new Error("url-embed failed for url "+ embedurl +" in "+ metadata.document.path +" with error "+ err));
            });

			// console.log(`${element.name} ${template} ${embedurl} ${title}`);
            /* engineDescribe(embedurl).then(description => {
				// console.log(`${embedurl} ${util.inspect(description)}`);
				if (!description) {
					return next(new Error("No embed data for url "+ embedurl +" in "+ metadata.document.path));
				}
				// console.log(`embedurl = ${embedurl} description = ${util.inspect(description)}`);
				if (description.embed && description.embed.html) {
					// console.log(`saw embed html ${description.embed.html}`);
					akasha.partial(metadata.config, template, {
						embedUrl: embedurl,
						embedSource: description.site_name,
						title: title ? title : description.title,
						// authorUrl: ,
						// authorName: item.snippet.channelTitle,
						// publishedAt: item.snippet.publishedAt,
						description: description.description,
						embedCode: description.embed.html,
                        preview: description.preview,
                        fullEmbed: description
					})
					.then(html => {
						$(element).replaceWith(html);
						dirty();
						next();
					})
					.catch(err => { error(err); next(err); });
				} else if (description.preview) {
					// console.log(`saw preview ${description.preview}`);
					akasha.partial(metadata.config, template, {
						embedUrl: embedurl,
						embedSource: description.site_name,
						title: title ? title : description.site_name,
						// authorUrl: ,
						// authorName: item.snippet.channelTitle,
						// publishedAt: item.snippet.publishedAt,
						description: undefined,
						embedCode: description.preview,
                        fullEmbed: description
					})
					.then(html => {
						$(element).replaceWith(html);
						dirty();
						next();
					})
					.catch(err => { error(err); next(err); });
				} else {
					next(new Error("No embeddable content found for url "+ embedurl +" in "+ metadata.document.path))
				}
			}).catch(e => {
				console.error('framed-embed FAILURE on url '
                    + embedurl +' in '+ metadata.document.path
                    +' because '+ e);
				next();
			}); /* */
		}, function(err) {
			if (err) done(err);
			else done();
		});
	},

	function($, metadata, dirty, done) {
		// <youtube-title id="" href=".."/>
		var elemsYT = [];
		$('youtube-title').each(function(i, elem) { elemsYT.push(elem); });
		$('youtube-author').each(function(i, elem) { elemsYT.push(elem); });
		$('youtube-description').each(function(i, elem) { elemsYT.push(elem); });
		$('youtube-publ-date').each(function(i, elem) { elemsYT.push(elem); });
		$('framed-youtube-player').each(function(i, elem) { elemsYT.push(elem); });
		async.eachSeries(elemsYT, function(elemYT, next) {
			log(elemYT.name);
			var yturl = ytGetUrl($, elemYT);
			var id = ytGetId($, yturl);
			if (!id) {
				next(new Error("No Youtube ID for ")); // + util.inspect(elemYT)));
			} else {
				ytVidInfo(metadata.config, id, function(err, resultData) {
					if (err) next(err);
					else {
						var result = resultData;
						var item = result.items[0];

						// log(util.inspect(item));
                        dirty();

						if (item) {
							if (elemYT.name /* .prop('tagName') */ === 'youtube-title') {
								$(elemYT).replaceWith(item.snippet.title);
								next();
							} else if (elemYT.name /* .prop('tagName') */ === 'youtube-author') {
								$(elemYT).replaceWith(item.snippet.channelTitle);
								next();
							} else if (elemYT.name /* .prop('tagName') */ === 'youtube-description') {
								$(elemYT).replaceWith(item.snippet.description);
								next();
							} else if (elemYT.name /* .prop('tagName') */ === 'youtube-publ-date') {
								// TODO fix this to parse & print nicely
								$(elemYT).replaceWith(item.snippet.publishedAt);
								next();
							}  else if (elemYT.name /* .prop('tagName') */ === 'framed-youtube-player') {
								akasha.partial(metadata.config, 'framed-youtube-player.html.ejs', {
									youtubeUrl: yturl,
									title: item.snippet.title,
									// authorUrl: ,
									authorName: item.snippet.channelTitle,
									publishedAt: item.snippet.publishedAt,
									description: item.snippet.description,
									embedCode: item.html ? item.html : ytPlayerCode($, metadata.config, elemYT, id)
								})
								.then(html => {
									$(elemYT).replaceWith(html);
									dirty();
									next();
								})
								.catch(err => { error(err); next(err); });
							} else next(new Error("failed to match -title or -author or -description "+ $(elemYT).name));
						} else next(new Error("nothing found for youtube id="+ id));
					}
				});
			}
		}, function(err) {
			if (err) done(err);
			else done();
		});
	},

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
		async.eachSeries(elements, function(element, next) {
			log(element.name);
			vimeoData($(element).attr('url'), function(err, vdata) {
				if (err) next(err);
				else {
                    dirty();
					var template = $(element).attr('template');
					if (element.name === 'vimeo-player') {
						$(element).replaceWith(vdata.html);
						next();
					} else if (element.name === 'framed-vimeo-player') {
						akasha.partial(metadata.config, 'framed-vimeo-player.html.ejs', {
							vimeoUrl: $(element).attr('url'),
							title: vdata.title,
							// authorUrl: ,
							authorName: vdata.author_name,
							description: vdata.description,
							embedCode: vdata.html
						})
						.then(html => {
							$(element).replaceWith(html);
							next();
						})
						.catch(err => { error(err); next(err); });
					} else if (element.name === 'vimeo-thumbnail') {

						var width = $(element).attr('width') ? $(element).attr('width') : undefined;
						// var height = $(element).attr('height') ? $(element).attr('height') : undefined;
						var _class = $(element).attr('class') ? $(element).attr('class') : undefined;
						var style = $(element).attr('style') ? $(element).attr('style') : undefined;
						var align = $(element).attr('align') ? $(element).attr('align') : undefined;

						akasha.partial(metadata.config, template ? template : "youtube-thumb.html.ejs", {
							imgwidth: width,
							imgalign: align,
							imgclass: _class,
							style: style,
							imgurl: vdata.thumbnail_url
						})
						.then(thumb => {
							// log('vimeo-thumbnail '+ thumb);
							$(element).replaceWith(thumb);
							next();
						})
						.catch(err => { error(err); next(err); });
					} else if (element.name === 'vimeo-title') {
						$(element).replaceWith(vdata.title);
						next();
					} else if (element.name === 'vimeo-author') {
						$(element).replaceWith(vdata.author_name);
						next();
					} else if (element.name === 'vimeo-description') {
						$(element).replaceWith(vdata.description);
						next();
					} else {
						next();
					}
				}
			});
		},
		function(err) {
			if (err) done(err); else done();
		});
	},

	function($, metadata, dirty, done) {
		// <slideshare-embed href=".."
		var elements = [];
		$('slideshare-embed').each(function(i, elem) { elements.push(elem); });
		$('slideshare-metadata').each(function(i, elem) { elements.push(elem); });
		async.eachSeries(elements, function(element, next) {
			var href = $(element).attr('href');
			slideshareData(href, function(err, result) {
				if (err) next(err);
				else {
					if (element.name === 'slideshare-embed') {
						akasha.partial(metadata.config, 'slideshare-embed.html.ejs', {
							title: result.title,
							author_url: result.author_url,
							author: result.author_name,
							htmlEmbed: result.html,
							slideshare_url: href
						})
						.then(slideshow => {
							$(element).replaceWith(slideshow);
							next();
						})
						.catch(err => { error(err); next(err); });
					} else if (element.name === 'slideshare-metadata') {
						if ($('head').get(0)) {
							// Only do this substitution if we are on a completely rendered page
							$('head').append(
								'<meta property="og:image" content="'+ result.thumbnail +'"/>\n' +
								'<meta name="twitter:image" content="'+ result.thumbnail +'"/>\n'
							);
							$(element).replaceWith('');
							next();
						} else next();
					} else {
						next(new Error('unknown element '+ element.name));
					}
				}
			});
		},
		function(err) {
			if (err) done(err); else done();
		});
	},

	function($, metadata, dirty, done) {
		// <twitter-embed href=".."
		var elements = [];
		$('twitter-embed').each(function(i, elem) { elements.push(elem); });
		async.eachSeries(elements, function(element, next) {
			var href = $(element).attr('href');
			akasha.oEmbedData(href)
			.then(results => {
				akasha.partial(metadata.config, "twitter-embed.html.ejs", results)
				.then(html => {
					$(element).replaceWith(html);
					next();
				})
				.catch(err => { next(err); });
			})
			.catch(err => { next(err); });
		},
		function(err) {
			if (err) done(err); else done();
		});
	},

	function($, metadata, dirty, done) {
		// <oembed href="..." optional: template="..."/>
		var elemsOE = [];
		$('oembed').each(function(i, elem) { elemsOE[i] = elem; });
		// util.log(util.inspect(elemsOE));
		async.eachSeries(elemsOE, function(elemOE, next) {
			// log(util.inspect(elemOE));
			var url = $(elemOE).attr("href");
			var template = $(elemOE).attr('template');
			akasha.oEmbedData(url)
			.then(results => { return akasha.partial(metadata.config, template, results); })
			.then(html => {
				$(elemOE).replaceWith(html);
				next();
			})
			.catch(err => { next(err); });
		}, function(err) {
			if (err) done(err);
			else done();
		});
	},

	function($, metadata, dirty, done) {
		var href, width, height;
		// <googledocs-viewer href="..." />
		$('googledocs-viewer').each(function(i, elem) {
			href = $(this).attr("href");
			if (!href) done(new Error("URL required for googledocs-viewer"));
			else {
				$(this).replaceWith(
					akasha.partialSync(metadata.config, "google-doc-viewer.html.ejs", {
						docViewerUrl: generateGoogleDocViewerUrl(href)
					})
				);
			}
		});
		// <googledocs-view-link href="..." >Anchor Text</googledocs-view-link>
		$('googledocs-view-link').each(function(i, elem) {
			href = $(this).attr("href");
			if (!href) return done(new Error("URL required for googledocs-view-link"));
			var anchorText = $(this).text();
			if (!anchorText) anchorText = "Click Here";
			return $(this).replaceWith(
				akasha.partialSync(metadata.config, "google-doc-viewer-link.html.ejs", {
					docViewerUrl: generateGoogleDocViewerUrl(href),
					anchorText: anchorText
				})
			);
		});
		// <docviewer href="..." width="..." height="..."/>
		$('docviewer').each(function(i, elem) {
			href = $(this).attr("href");
			if (!href) return done(new Error("URL required for docviewer"));
			width = $(this).attr("width");
			if (!width) width = "100%";
			height = $(this).attr("height");
			if (!height) height = "900px";
			// console.log(`docviewer ${href} ${width} ${height}`);
			return $(this).replaceWith(
				akasha.partialSync(metadata.config, "viewerjs-embed.html.ejs", {
					docUrl: generateViewerJSURL(href),
					width: width, height: height
				})
			);
		});
		// <docviewer-link href="..." >Anchor Text</docviewer-link>
		$('docviewer-link').each(function(i, elem) {
			href = $(this).attr("href");
			if (!href) return done(new Error("URL required for docviewer"));
			var anchorText = $(this).text();
			if (!anchorText) anchorText = "Click Here";
			return $(this).replaceWith(
				akasha.partialSync(metadata.config, "viewerjs-link.html.ejs", {
					docUrl: generateViewerJSURL(href),
					anchorText: anchorText
				})
			);
		});
		done();
	}
];
