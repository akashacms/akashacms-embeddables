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

# Custom Tags


TODO - Have not written this yet.  Study the source code for clues.
