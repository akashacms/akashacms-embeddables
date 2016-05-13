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
const async    = require('async');
const request  = require('request');
const akasha   = require('../akasharender');

const YouTube = require('youtube-node');
const youtube = new YouTube();

const log   = require('debug')('akasha:embeddables-plugin');
const error = require('debug')('akasha:error-embeddables-plugin');

module.exports = class EmbeddablesPlugin extends akasha.Plugin {
	constructor() {
		super("akashacms-embeddables");
	}
	
	configure(config) {
		this._config = config;
		config.addPartialsDir(path.join(__dirname, 'partials'));
		config.addAssetsDir(path.join(__dirname, 'assets'));
		config.addMahabhuta(module.exports.mahabhuta);
		
		if (config.embeddables && config.embeddables.youtubeKey) {
			youtube.setKey(config.embeddables.youtubeKey);
		}

	}
}

var ytVidz = [];
var ytVidInfo = module.exports.youtubeVidInfo = function(id, done) {
    if (ytVidz[id]) {
        // util.log('ytVidInfo id='+ id +' '+ util.inspect(ytVidz[id]));
        done(null, ytVidz[id]);
    } else {
		if (module.exports._config.embeddables
		 && module.exports._config.embeddables.youtubeKey) {
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
	if (typeof elemYT === 'string') {
	    return elemYT;
	} else if (elemYT && $(elemYT).attr('href')) {
        return $(elemYT).attr('href');
    } else if (elemYT && $(elemYT).attr('url')) {
        return $(elemYT).attr('url');
    } else if (elemYT && $(elemYT).attr('id')) {
        return url.format({
			protocol: 'https',
			hostname: 'www.youtube.com',
			pathname: '/watch',
			query: {
				v: id
			}
		});
    } else {
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
		return idFromUrl(_yturl);
    } else if (elemYT && $(elemYT).attr('url')) {
        _yturl = $(elemYT).attr('url');
		return idFromUrl(_yturl);
    }
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
	
	var width = $(elemYT).attr('width')
		? $(elemYT).attr('width')
		: undefined;
	var height = $(elemYT).attr('height')
		? $(elemYT).attr('height')
		: undefined;
	var _class = $(elemYT).attr('class')
		? $(elemYT).attr('class')
		: undefined;
	var style = $(elemYT).attr('style')
		? $(elemYT).attr('style')
		: undefined;

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

	if ($(elemYT).attr('autohide'))
		yturl.query['autohide'] = $(elemYT).attr('autohide');
	if ($(elemYT).attr('autoplay'))
		yturl.query['autoplay'] = $(elemYT).attr('autoplay');
	if ($(elemYT).attr('cc_load_policy'))
		yturl.query['cc_load_policy'] = $(elemYT).attr('cc_load_policy');
	if ($(elemYT).attr('color'))
		yturl.query['color'] = $(elemYT).attr('color');
	if ($(elemYT).attr('controls'))
		yturl.query['controls'] = $(elemYT).attr('controls');
	if ($(elemYT).attr('disablekb'))
		yturl.query['disablekb'] = $(elemYT).attr('disablekb');
	if ($(elemYT).attr('enablejsapi'))
		yturl.query['enablejsapi'] = $(elemYT).attr('enablejsapi');
	if ($(elemYT).attr('end'))
		yturl.query['end'] = $(elemYT).attr('end');
	if ($(elemYT).attr('fs'))
		yturl.query['fs'] = $(elemYT).attr('fs');
	if ($(elemYT).attr('hl'))
		yturl.query['hl'] = $(elemYT).attr('hl');
	if ($(elemYT).attr('iv_load_policy'))
		yturl.query['iv_load_policy'] = $(elemYT).attr('iv_load_policy');
	if ($(elemYT).attr('list'))
		yturl.query['list'] = $(elemYT).attr('list');
	if ($(elemYT).attr('listType'))
		yturl.query['listType'] = $(elemYT).attr('listType');
	if ($(elemYT).attr('loop'))
		yturl.query['loop'] = $(elemYT).attr('loop');
	if ($(elemYT).attr('modestbranding'))
		yturl.query['modestbranding'] = $(elemYT).attr('modestbranding');
	if ($(elemYT).attr('origin'))
		yturl.query['origin'] = $(elemYT).attr('origin');
	if ($(elemYT).attr('playerapiid'))
		yturl.query['playerapiid'] = $(elemYT).attr('playerapiid');
	if ($(elemYT).attr('playlist'))
		yturl.query['playlist'] = $(elemYT).attr('playlist');
	if ($(elemYT).attr('playsinline'))
		yturl.query['playsinline'] = $(elemYT).attr('playsinline');
	if ($(elemYT).attr('rel'))
		yturl.query['rel'] = $(elemYT).attr('rel');
	if ($(elemYT).attr('showinfo'))
		yturl.query['showinfo'] = $(elemYT).attr('showinfo');
	if ($(elemYT).attr('start'))
		yturl.query['start'] = $(elemYT).attr('start');
	if ($(elemYT).attr('theme'))
		yturl.query['theme'] = $(elemYT).attr('theme');

	return akasha.partialSync(config, "youtube-embed-code.html.ejs", {
		idYouTube: id,
		width: width,
		height: height,
		ytclass: _class,
		style: style,
		frameborder: "0",
		yturl: url.format(yturl)
	});
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
				// util.log(body);
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
			protocol: 'http',
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
			
			log(elemYT.name);
			var yturl = ytGetUrl($, elemYT);
			var id = ytGetId($, yturl);
			if (!id) {
				next(new Error("No Youtube ID"));
			} else {
				ytVidInfo(id, function(err, resultData) {
					if (err) next(err);
					else {
						var result = resultData;
						var item = result.items && result.items.length >= 0 ? result.items[0] : null;
						// var thumbs = item.snippet.thumbnails;
						
						var template = $(elemYT).attr('template');
						var player;
					
						if (item) {
							if (elemYT.name === 'youtube-video' || elemYT.name === 'youtube-video-embed')
								player = ytPlayerCode($, metadata.config, elemYT, id);
					
							if (elemYT.name /* .prop('tagName') */ === 'youtube-video') {
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
							} else if (elemYT.name /* .prop('tagName') */ === 'youtube-video-embed') {
								$(elemYT).replaceWith(player);
								next();
							} else if (elemYT.name /* .prop('tagName') */ === 'youtube-thumbnail') {
								var thumbs = item ? item.snippet.thumbnails : undefined;
								// if (_class === 'embed-yt-video') _class = 'embed-yt-thumb';
								var align = $(elemYT).attr('align')
									? $(elemYT).attr('align')
									: undefined;
								var width = $(elemYT).attr('width')
									? $(elemYT).attr('width')
									: "100%";
								var height = $(elemYT).attr('height')
									? $(elemYT).attr('height')
									: undefined;
								var _class = $(elemYT).attr('class')
									? $(elemYT).attr('class')
									: undefined;
								var style = $(elemYT).attr('style')
									? $(elemYT).attr('style')
									: undefined;
							
								akasha.partial(metadata.config, template ? template : "youtube-thumb.html.ejs", {
									imgwidth: width,
									imgalign: align,
									imgclass: _class,
									style: style,
									imgurl: ytBestThumbnail(thumbs)
								})
								.then(thumb => {
									// log('youtube-thumb '+ thumb);
									$(elemYT).replaceWith(thumb);
									next();
								})
								.catch(err => { error(err); next(err); });
							} else next(new Error("didn't match -video or -video-embed or -thumbnail "+ elemYT.name));
						} else next(new Error("No match for youtube id="+ id));
					}
				});
			}
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
				ytVidInfo(id, function(err, resultData) {
					if (err) next(err);
					else {
						var result = resultData;
						// util.log(util.inspect(result));
						var item = result && result.items && result.items.length >= 0 ? result.items[0] : null;
						var thumbs = item ? item.snippet.thumbnails : undefined;
						if (!item) {
							next(new Error("(youtube-metadata) Youtube didn't get anything for id="+ id));
						} else if ($('head').get(0)) {
							// Only do this substitution if we are on a completely rendered page
							$('head').append(
								'<meta property="og:image" content="'+ ytBestThumbnail(thumbs) +'"/>\n' +
								'<meta name="twitter:image" content="'+ ytBestThumbnail(thumbs) +'"/>\n'
							);
							$(elemYT).replaceWith('');
							next();
						} else next();
					}
				});
			}
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
				ytVidInfo(id, function(err, resultData) {
					if (err) next(err);
					else {
						var result = resultData;
						var item = result.items[0];
						
						// util.log(util.inspect(item));
					
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
									embedCode: ytPlayerCode($, metadata.config, elemYT, id)
								})
								.then(html => {
									$(elemYT).replaceWith(html);
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
						
						var width = $(element).attr('width')
							? $(element).attr('width')
							: undefined;
						var height = $(element).attr('height')
							? $(element).attr('height')
							: undefined;
						var _class = $(element).attr('class')
							? $(element).attr('class')
							: undefined;
						var style = $(element).attr('style')
							? $(element).attr('style')
							: undefined;
						var align = $(element).attr('align')
							? $(element).attr('align')
							: undefined;
							
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
		var elements = [];
		$('video-embed-code').each(function(i, elem) { elements.push(elem); });
		async.eachSeries(elements, function(element, next) {
			var href = $(element).attr('href');
			if (href.match(/youtube.com/i)) {
				var id = ytGetId(null, href);
				ytVidInfo(id, function(err, result) {
					if (err) {
						next(err);
					} else {
						var item = result.items && result.items.length >= 0 ? result.items[0] : null;
						var thumbs = item ? item.snippet.thumbnails : undefined;
						akasha.partial(metadata.config, 'video-embed-code.html.ejs', {
							imgurl: ytBestThumbnail(thumbs),
							linkurl: metadata.rendered_url,
							linktext: item.snippet.title,
							teaser: metadata.teaser ? metadata.teaser : item.snippet.description
						})
						.then(embedCode => {
							akasha.partial(metadata.config, 'ak-show-embed-code.html.ejs', {
								cols: 40,
								rows: 3,
								code: embedCode
							})
							.then(embedder => {
								$(element).replaceWith(embedder);
								next();
							})
							.catch(err => { next(err); });
						})
						.catch(err => { next(err); });
					}
				});
			} else if (href.match(/vimeo.com/i)) {
				vimeoData(href, function(err, vdata) {
					if (err) {
						next(err);
					} else {
						akasha.partial(metadata.config, 'video-embed-code.html.ejs', {
							imgurl: vdata.thumbnail_url,
							linkurl: metadata.rendered_url,
							linktext: vdata.title,
							teaser: metadata.teaser ? metadata.teaser : vdata.description
						})
						.then(embedCode => {
							akasha.partial(metadata.config, 'ak-show-embed-code.html.ejs', {
								cols: 40,
								rows: 3,
								code: embedCode
							})
							.then(embedder => {
									$(element).replaceWith(embedder);
									next();
							})
							.catch(err2 => { error(err2); next(err2); });
						})
						.catch(err => { error(err); next(err); });
					}
				});
			} else {
				next(new Error('unrecognized video URL '+ href));
			}
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
			.then(results => { return akasha.partial(metadata.config, template, results) })
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