/**
 *
 * Copyright 2013 David Herron
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

/**
 * Add ourselves to the config data.
 **/
module.exports.config = function(akasha, config) {
    config.root_partials.push(path.join(__dirname, 'partials'));
    config.root_assets.unshift(path.join(__dirname, 'assets'));
    config.funcs.viewerJS = function(arg, callback) {
        if (!arg.documentUrl)  { callback(new Error("No 'documentUrl' given ")); }
        var val = akasha.partialSync(config, "viewerjs-viewer.html.ejs", {
            docViewerUrl: "/vendor/Viewer.js/#" + arg.documentUrl
        });
        if (callback) callback(undefined, val);
        return val;
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
                arg.anchorText = arg.documentAnchorText
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
    }
}

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
