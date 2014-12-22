/**
 *
 * Copyright 2013-2014 David Herron
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

var path     = require('path');
var util     = require('util');
var url      = require('url');
var async    = require('async');

var YouTube = require('youtube-node');
var youtube = new YouTube();

var ytVidz = [];
var ytVidInfo = function(id, done) {
    if (ytVidz[id]) {
        done(ytVidz[id]);
    } else {
        youtube.getById(id, function(resultData) {
            ytVidz[id] = resultData;
            done(resultData);
        });
    }
}

var ytGetId = function($, elemYT) {
    var id;
    if ($(elemYT).attr('id')) {
        id = $(elemYT).attr('id');
    } else if ($(elemYT).attr('href')) {
        var _yturl = $(elemYT).attr('href');
        var yturl = url.parse(_yturl, true);
        if (yturl.query && yturl.query.v) {
            id = yturl.query.v
        }
    }
    return id;
}

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
}

/**
 * Add ourselves to the config data.
 **/
module.exports.config = function(akasha, config) {
    config.root_partials.push(path.join(__dirname, 'partials'));
    config.root_assets.unshift(path.join(__dirname, 'assets'));
    
    if (config.embeddables && config.embeddables.youtubeKey) {
        youtube.setKey(config.embeddables.youtubeKey);
    }
    
    if (config.mahabhuta) {
        config.mahabhuta.push(function($, metadata, dirty, done) {
            // <youtube-video href=".."/>  TBD: autoplay, thumbnail+lightbox
            var elemsYT = [];
            $('youtube-video').each(function(i, elem) { elemsYT.push(elem); });
            $('youtube-video-embed').each(function(i, elem) { elemsYT.push(elem); });
            $('youtube-thumbnail').each(function(i, elem) { elemsYT.push(elem); });
            // util.log(util.inspect(elemsYT));
            async.forEachSeries(elemsYT, function(elemYT, cb) {
                // util.log(util.inspect(elemYT));
                
                var id = ytGetId($, elemYT);
                if (!id) {
                    cb(new Error("No Youtube ID"));
                } else {
                    ytVidInfo(id, function(resultData) {
                        var result = resultData;
                        var item = result.items[0];
                        // var thumbs = item.snippet.thumbnails;
                        
                        if (item) {
                        
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
						
							var player;
							if (elemYT.name === 'youtube-video' || elemYT.name === 'youtube-video-embed') {
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
							
								player = akasha.partialSync("youtube-embed-code.html.ejs", {
									idYouTube: id,
									width: width,
									height: height,
									ytclass: _class,
									style: style,
									frameborder: "0",
									yturl: url.format(yturl)
								});
							}
						
							if (elemYT.name /* .prop('tagName') */ === 'youtube-video') {
								akasha.partial("youtube-embed.html.ejs", {
									title: item ? item.snippet.title : "",
									html: player,
									author_url: item ? ("http://youtube.com/user/"+ item.snippet.channelTitle +"/videos") : "",
									author_name: item ? item.snippet.channelTitle : ""
								}, function(err, embed) {
									if (err) { logger.error(err); cb(err); }
									else {
										$(elemYT).replaceWith(embed);
										cb();
									}
								});
							} else if (elemYT.name /* .prop('tagName') */ === 'youtube-video-embed') {
								$(elemYT).replaceWith(player);
								cb();
							} else if (elemYT.name /* .prop('tagName') */ === 'youtube-thumbnail') {
								var thumbs = item ? item.snippet.thumbnails : undefined;
								// if (_class === 'embed-yt-video') _class = 'embed-yt-thumb';
								var align = $(elemYT).attr('align')
									? $(elemYT).attr('align')
									: undefined;
								if (!width) width = "100%";
								
								akasha.partialSync("youtube-thumb.html.ejs", {
									imgwidth: width,
									imgalign: align,
									imgclass: _class,
									style: style,
									imgurl: ytBestThumbnail(thumbs)
								}, function(err, thumb) {
									if (err) { logger.error(err); cb(err); }
									else {
										$(elemYT).replaceWith(thumb);
										cb();
									}
								});
							} else {
								cb(new Error("didn't match -video or -video-embed or -thumbnail "+ elemYT.name));
							}
                        
                        } else {
                        	cb(new Error("No match for youtube id="+ id));
                        }
                        
                    });
                }
            }, function(err) {
                done(err);
            });
        });
        
        config.mahabhuta.push(function($, metadata, dirty, done) {
            // <youtube-metadata id="" href=".."/>  
            var elemsYT = [];
            $('youtube-metadata').each(function(i, elem) { elemsYT[i] = elem; });
            async.forEachSeries(elemsYT, function(elemYT, cb) {
                var id = ytGetId($, elemYT);
                if (!id) {
                    cb(new Error("No Youtube ID"));
                } else {
                    ytVidInfo(id, function(resultData) {
                        var result = resultData;
                        var item = result.items[0];
                        var thumbs = item ? item.snippet.thumbnails : undefined;
                        if (!item) {
                        	cb(new Error("Youtube didn't get anything for id="+ id));
                        } else if ($('head').get(0)) {
                            // Only do this substitution if we are on a completely rendered page
                            $('head').append(
                                '<meta property="og:image" content="'+ ytBestThumbnail(thumbs) +'"/>\n' +
                                '<meta name="twitter:image" content="'+ ytBestThumbnail(thumbs) +'"/>\n'
                            );
                            $(elemYT).replaceWith('');
                            cb();
                        } else cb();
                    });
                }
            }, function(err) {
                done(err);
            });
        });
        config.mahabhuta.push(function($, metadata, dirty, done) {
            // <youtube-title id="" href=".."/>  
            var elemsYT = [];
            $('youtube-title').each(function(i, elem) { elemsYT.push(elem); });
            $('youtube-author').each(function(i, elem) { elemsYT.push(elem); });
            $('youtube-description').each(function(i, elem) { elemsYT.push(elem); });
            $('youtube-publ-date').each(function(i, elem) { elemsYT.push(elem); });
            async.forEachSeries(elemsYT, function(elemYT, cb) {
                var id = ytGetId($, elemYT);
                if (!id) {
                    cb(new Error("No Youtube ID"));
                } else {
                    ytVidInfo(id, function(resultData) {
                        var result = resultData;
                        var item = result.items[0];
                        
                        if (item) {
							if (elemYT.name /* .prop('tagName') */ === 'youtube-title') {
								$(elemYT).replaceWith(item.snippet.title);
								cb();
							} else if (elemYT.name /* .prop('tagName') */ === 'youtube-author') {
								$(elemYT).replaceWith(item.snippet.channelTitle);
								cb();
							} else if (elemYT.name /* .prop('tagName') */ === 'youtube-description') {
								$(elemYT).replaceWith(item.snippet.description);
								cb();
							} else if (elemYT.name /* .prop('tagName') */ === 'youtube-publ-date') {
								// TODO fix this to parse & print nicely
								$(elemYT).replaceWith(item.snippet.publishedAt);
								cb();
							} else {
								cb(new Error("failed to match -title or -author or -description "+ $(elemYT).name));
							}
						} else {
							cb(new Error("nothing found for youtube id="+ id));
						}
                    });
                }
            }, function(err) {
                done(err);
            });
        });
        config.mahabhuta.push(function($, metadata, dirty, done) {
            // <oembed href="..." optional: template="..."/>
            var elemsOE = [];
            $('oembed').each(function(i, elem) { elemsOE[i] = elem; });
            // util.log(util.inspect(elemsOE));
            async.forEachSeries(elemsOE, function(elemOE, cb) {
                // util.log(util.inspect(elemOE));
                akasha.oembedRender({
                    template: $(elemOE).attr('template'),
                    url: $(elemOE).attr("href")
                }, function(err, html) {
                    if (err) cb(err);
                    else { 
                        $(elemOE).replaceWith(html);
                        cb();
                    }
                });
            }, function(err) {
                done(err);
            });
        });
        config.mahabhuta.push(function($, metadata, dirty, done) {
            var href, width, height;
            // <googledocs-viewer href="..." />
            $('googledocs-viewer').each(function(i, elem) {
                href = $(this).attr("href");
                if (!href) done(new Error("URL required for googledocs-viewer"));
                else {
                	$(this).replaceWith(
						akasha.partialSync("google-doc-viewer.html.ejs", {
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
                    akasha.partialSync("google-doc-viewer-link.html.ejs", {
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
                    akasha.partialSync("viewerjs-embed.html.ejs", {
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
                    akasha.partialSync("viewerjs-link.html.ejs", {
                        docUrl: generateViewerJSURL(href),
                        anchorText: anchorText
                    })
                );
            });
            done();
        });
    }
    config.funcs.googleDocsViewer = function(arg, callback) {
    	throw new Error("Do not use googleDocsViewer");
        if (!arg.documentUrl)  { callback(new Error("No 'documentUrl' given ")); }
        var val = akasha.partialSync("google-doc-viewer.html.ejs", {
            docViewerUrl: generateGoogleDocViewerUrl(arg.documentUrl)
        });
        if (callback) callback(undefined, val);
        return val;
    };
    config.funcs.googleDocsViewLink = function(arg, callback) {
    	throw new Error("Do not use googleDocsViewLink");
        if (!arg.documentUrl)  { callback(new Error("No 'documentUrl' given ")); }
        if (!arg.anchorText)   {
            if (arg.documentAnchorText) {
                arg.anchorText = arg.documentAnchorText;
            } else {
                arg.anchorText = "View";
            }
        }
        var val = akasha.partialSync("google-doc-viewer-link.html.ejs", {
            docViewerUrl: generateGoogleDocViewerUrl(arg.documentUrl),
            anchorText: arg.anchorText
        });
        if (callback) callback(undefined, val);
        return val;
    };
    config.funcs.youtubePlayer = function(arg, callback) {
    	throw new Error("Do not use youtubePlayer");
        if (!callback)       { throw new Error("No callback given"); }
        if (!arg.youtubeUrl) { callback(new Error("No youtubeUrl given")); }
        if (!arg.template)   { arg.template = "youtube-embed.html.ejs"; }
        arg.url = arg.youtubeUrl;
        akasha.oembedRender(arg, callback);
    };
    config.funcs.viewerJSLink = function(arg, callback) {
    	throw new Error("Do not use viewerJSLink");
        if (!arg.docUrl)     { callback(new Error("No docUrl given")); }
        if (!arg.template)   { arg.template = "viewerjs-link.html.ejs"; }
        if (!arg.anchorText) { arg.anchorText = "Click here"; }
        var val = akasha.partialSync(arg.template, {
            docUrl: generateViewerJSURL(arg.docUrl),
            anchorText: arg.anchorText
        });
        return val;
    };
    config.funcs.viewerJSViewer = function(arg, callback) {
    	throw new Error("Do not use viewerJSViewer");
        if (!arg.docUrl)     { callback(new Error("No docUrl given")); }
        if (!arg.template)   { arg.template = "viewerjs-embed.html.ejs"; }
        if (!arg.width)      { arg.width = "100%"; }
        if (!arg.height)     { arg.height = "900px"; }
        var val = akasha.partialSync(arg.template, {
            docUrl: generateViewerJSURL(arg.docUrl),
            width: arg.width,
            height: arg.height
        });
        return val;
    };
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
}

var generateViewerJSURL = function(docUrl) {
    if (docUrl.indexOf('http://') === 0 || docUrl.indexOf('https://') === 0) {
        return docUrl;
    } else if (docUrl.indexOf('/') === 0) {
        return "../../.."+ docUrl;
    } else {
        return "../../../"+ docUrl;
    }
}
