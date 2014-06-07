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

/**
 * Add ourselves to the config data.
 **/
module.exports.config = function(akasha, config) {
    config.root_partials.push(path.join(__dirname, 'partials'));
    config.root_assets.unshift(path.join(__dirname, 'assets'));
    
    if (config.mahabhuta) {
        config.mahabhuta.push(function(config, $, metadata, done) {
            // <youtube-video href=".."/>  TBD: autoplay, thumbnail+lightbox
            var elemsYT = [];
            $('youtube-video').each(function(i, elem) { elemsYT[i] = elem; });
            // util.log(util.inspect(elemsYT));
            async.forEachSeries(elemsYT, function(elemYT, cb) {
                // util.log(util.inspect(elemYT));
                akasha.oembedRender({
                    template: "youtube-embed.html.ejs",
                    url: $(elemYT).attr("href")
                }, function(err, html) {
                    if (err) cb(err);
                    else { 
                        $(elemYT).replaceWith(html);
                        cb();
                    }
                });
            }, function(err) {
                done(err);
            });
        });
        config.mahabhuta.push(function(config, $, metadata, done) {
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
        config.mahabhuta.push(function(config, $, metadata, done) {
            var href, width, height;
            // <googledocs-viewer href="..." />
            $('googledocs-viewer').each(function(i, elem) {
                href = $(this).attr("href");
                if (!href) done(new Error("URL required for googledocs-viewer"));
                else $(this).replaceWith(
                    akasha.partialSync(config, "google-doc-viewer.html.ejs", {
                        docViewerUrl: generateGoogleDocViewerUrl(href)
                    })
                );
            });
            // <googledocs-view-link href="..." >Anchor Text</googledocs-view-link>
            $('googledocs-view-link').each(function(i, elem) {
                href = $(this).attr("href");
                if (!href) return done(new Error("URL required for googledocs-view-link"));
                var anchorText = $(this).text();
                if (!anchorText) anchorText = "Click Here";
                return $(this).replaceWith(
                    akasha.partialSync(config, "google-doc-viewer-link.html.ejs", {
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
                    akasha.partialSync(config, "viewerjs-embed.html.ejs", {
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
                    akasha.partialSync(config, "viewerjs-link.html.ejs", {
                        docUrl: generateViewerJSURL(arg.docUrl),
                        anchorText: anchorText
                    })
                );
            });
            done();
        });
    }
    config.funcs.googleDocsViewer = function(arg, callback) {
        if (!arg.documentUrl)  { callback(new Error("No 'documentUrl' given ")); }
        var val = akasha.partialSync(config, "google-doc-viewer.html.ejs", {
            docViewerUrl: generateGoogleDocViewerUrl(arg.documentUrl)
        });
        if (callback) callback(undefined, val);
        return val;
    };
    config.funcs.googleDocsViewLink = function(arg, callback) {
        if (!arg.documentUrl)  { callback(new Error("No 'documentUrl' given ")); }
        if (!arg.anchorText)   {
            if (arg.documentAnchorText) {
                arg.anchorText = arg.documentAnchorText;
            } else {
                arg.anchorText = "View";
            }
        }
        var val = akasha.partialSync(config, "google-doc-viewer-link.html.ejs", {
            docViewerUrl: generateGoogleDocViewerUrl(arg.documentUrl),
            anchorText: arg.anchorText
        });
        if (callback) callback(undefined, val);
        return val;
    };
    config.funcs.youtubePlayer = function(arg, callback) {
        if (!callback)       { throw new Error("No callback given"); }
        if (!arg.youtubeUrl) { callback(new Error("No youtubeUrl given")); }
        if (!arg.template)   { arg.template = "youtube-embed.html.ejs"; }
        arg.url = arg.youtubeUrl;
        akasha.oembedRender(arg, callback);
    };
    config.funcs.viewerJSLink = function(arg, callback) {
        if (!arg.docUrl)     { callback(new Error("No docUrl given")); }
        if (!arg.template)   { arg.template = "viewerjs-link.html.ejs"; }
        if (!arg.anchorText) { arg.anchorText = "Click here"; }
        var val = akasha.partialSync(config, arg.template, {
            docUrl: generateViewerJSURL(arg.docUrl),
            anchorText: arg.anchorText
        });
        return val;
    };
    config.funcs.viewerJSViewer = function(arg, callback) {
        if (!arg.docUrl)     { callback(new Error("No docUrl given")); }
        if (!arg.template)   { arg.template = "viewerjs-embed.html.ejs"; }
        if (!arg.width)      { arg.width = "100%"; }
        if (!arg.height)     { arg.height = "900px"; }
        var val = akasha.partialSync(config, arg.template, {
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
