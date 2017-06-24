---
layout: plugin-documentation.html.ejs
title: AskashaCMS Embeddables plugin documentation
---

All around the Internet are sites allowing their content to be embedded into other websites.  For example, YouTube videos are easy to embed on other sites, just by pasting in a snippet of code.  Embedding this content can add value to your site.  Maybe your story involves tracking a series of tweets, or showing an archive of videos on specific topics, or any of a number of other things.

It can be tedious to manually go to sites to fetch the embed code.  The `akashacms-embeddables` plugin simplifies embedding content from other sites.

# Installation

Add the following to `package.json`

```
"dependencies": {
      ...
      "akashacms-embeddables": "akashacms/akashacms-embeddables#akasharender",
      ...
}
```


The AkashaRender version of `akashacms-embeddables` has not been published to `npm` yet, and therefore must be referenced this way.

Once added to `package.json` run: `npm install`

# Configuration

Add the following to `config.js`

```
config
    ...
    .use(require('akashacms-embeddables'))
    ...
```

**Setting your YouTube API key**: This plugin can use the official YouTube API to retrieve information.  Google requires that you register for an API key, which must then be supplied to this plugin.

```
config.plugin('akashacms-embeddables').youtubeKey = "... youtube key string ...";
```



# Custom Tags


TODO - Have not written this yet.  Study the source code for clues.

## Embed Metadata

It's very useful to automatically add metadata to the page header related to the embedded thingy.  For example a preview image can be added as OpenGraph metadata which will assist with making good postings on social media websites.

`<youtube-metadata href="YOUTUBE URL">`  This tag probably needs to go away, in any case it retrieves metadata from YouTube and adds `og:image` and `twitter:image` metadata to the page header.

## Embed thumbnail

```
<embed-thumbnail href="URL" template="TEMPLATE" width="WIDTH" class="CLASS" style="STYLE" align="ALIGN"/>
```

Retrieves any thumbnail using oEmbed or other means.  The default template is `youtube-thumb.html.ejs`

## Embed the thingy

```
<framed-embed href="URL" template="TEMPLATE" title="TITLE"/>
<simple-embed href="URL" template="TEMPLATE" title="TITLE"/>
```

Embeds the referenced thing in the webpage.  The difference between the two is that `framed-embed` gathers additional information and presents a more comprehensive embeddment.
