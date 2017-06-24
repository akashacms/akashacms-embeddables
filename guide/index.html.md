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
      "akashacms-embeddables": ">=0.6",
      ...
}
```

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

TODO:

```
<embed-resource href="URL" class="CLASS-NAME" style="STYLE" title="TITLE TO OVERRIDE" template="TEMPLATE" width="WIDTH" height="HEIGHT">
   Descriptive text if appropriate
</embed-resource>
```

This would look up the data, selecting the mechanism based on the URL.  For example some sites work great with oEmbed, others with OpenGraph, others with private API's, etc.  

The `template=` attribute specifies how to handle/display the thing being displayed.

Other tags like `<framed-embed>` could build on top of this by using a defined template for the purpose.


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
