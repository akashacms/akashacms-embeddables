---
layout: plugin-documentation.html.ejs
title: AskashaCMS Embeddables plugin documentation
publicationDate: June 29, 2017
---

All around the Internet are sites allowing their content to be embedded into other websites.  For example, YouTube videos are easy to embed on other sites, just by pasting in a snippet of code.  Embedding this content can add value to your site.  Maybe your story involves tracking a series of tweets, or showing an archive of videos on specific topics, or any of a number of other things.

It can be tedious to manually go to sites to fetch the embed code.  The `akashacms-embeddables` plugin simplifies embedding content from other sites, while retrieving extra data from OpenGraph or Twitter Card tags.

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


# Custom Tags

## `embed-resource`

```
<embed-resource href="URL" template="TEMPLATE" class="CLASS-NAME" style="STYLE" title="TITLE TO OVERRIDE" width="WIDTH">
   Descriptive text if appropriate
</embed-resource>
```

This looks up oEmbed, OpenGraph and Twitter Card data about the page at `URL`.  The data is provided to the named template as are the named attributes.  The default template, `embed-resource.html.ejs`, simply displays the content of `embedCode` (wrapped by a `<div>`).

The `template=` attribute specifies how to handle/display the embedded resource.

The data provided is:

* `embedData` -- The full data retrieved using oEmbed, OpenGraph and Twitter Card (more on this below)
* `embedCode` -- The HTML snippet supplied
* `title` -- The _title_ supplied either in the attributes or from queries
* `embedHref` -- The _href_ supplied in the attributes
* `embedUrl` -- The URL for the author of the embedded resource
* `embedSource` -- The author name for the embedded resource
* `embedClass` -- The `class` name to use on the outermost element of emitted HTML
* `width` -- The `width` attribute to use on that outermost element
* `style` -- The `style` attribute to use on that outermost element
* `align` -- The `align` attribute to use on that outermost element
* `description` -- Any descriptive metadata that can be found
* `imageUrl` -- An image associated with the resource from its metadata

Provided templates are:

* `embed-resource.html.ejs` -- This default template simply emits `embedCode` within a wrapper `<div>`
* `embed-thumbnail.html.ejs` -- Emits an `<img>` for `imageUrl`
* `embed-resource-framed.html.ejs` -- Emits a block of HTML using the _title_, _description_, _embedSource_ and other data
* `embed-resource-promote-images.html.ejs` -- Creates OpenGraph `meta` tags in the header for any images retrieved in the data (`embedData.thumbnail_url`, `embedData.metadata.ogImage` and `embedData.metadata.twitterImage`)

The `embedData` primarily contains oEmbed data (oEmbed spec: http://oembed.com/).  Any additional information is available via OpenGraph or Twitter Cards is available as `embedData.metadata`.

An example of the available data for https://www.youtube.com/watch?v=QweNsLesMrM is:

```
{ version: '1.0',
  thumbnail_url: 'https://i.ytimg.com/vi/QweNsLesMrM/hqdefault.jpg',
  width: 480,
  author_url: 'https://www.youtube.com/user/charlieebrown100',
  html: '<iframe width="480" height="270" src="https://www.youtube.com/embed/QweNsLesMrM?feature=oembed" frameborder="0" allowfullscreen></iframe>',
  provider_name: 'YouTube',
  type: 'video',
  provider_url: 'https://www.youtube.com/',
  thumbnail_width: 480,
  title: 'Tesla Model S: "Gallons of Light" Commercial',
  thumbnail_height: 360,
  height: 270,
  author_name: 'Jordan Bloch',
  metadata:
   { host: 'www.youtube.com',
     path: '/watch?v=QweNsLesMrM',
     title: 'Tesla Model S: "Gallons of Light" Commercial - YouTube',
     description: 'Go behind the scenes at: http://www.gallonsoflight.com On January 3rd, the Knapp family took a road trip in their new Tesla Model S. Using free, solar-powere...',
     keywords: 'elon musk, tesla, tesla model s, solar, solar city, electric car, ev, Electric Vehicle (Industry), Solar Energy (Industry), spacex, tesla motors, jordan bloc...',
     'theme-color': '#e62117',
     ogSiteName: 'YouTube',
     ogUrl: 'https://www.youtube.com/watch?v=QweNsLesMrM',
     ogTitle: 'Tesla Model S: "Gallons of Light" Commercial',
     ogImage: 'https://i.ytimg.com/vi/QweNsLesMrM/maxresdefault.jpg',
     ogDescription: 'Go behind the scenes at: http://www.gallonsoflight.com On January 3rd, the Knapp family took a road trip in their new Tesla Model S. Using free, solar-powere...',
     ogType: 'video',
     ogVideoUrl: 'https://www.youtube.com/embed/QweNsLesMrM',
     ogVideoSecureUrl: 'https://www.youtube.com/embed/QweNsLesMrM',
     ogVideoType: 'text/html',
     ogVideoWidth: '1280',
     ogVideoHeight: '720',
     ogVideoTag: 'elon musk',
     twitterCard: 'player',
     twitterSite: '@youtube',
     twitterUrl: 'https://www.youtube.com/watch?v=QweNsLesMrM',
     twitterTitle: 'Tesla Model S: "Gallons of Light" Commercial',
     twitterDescription: 'Go behind the scenes at: http://www.gallonsoflight.com On January 3rd, the Knapp family took a road trip in their new Tesla Model S. Using free, solar-powere...',
     twitterImage: 'https://i.ytimg.com/vi/QweNsLesMrM/maxresdefault.jpg',
     twitterAppNameIphone: 'YouTube',
     twitterAppIdIphone: '544007664',
     twitterAppNameIpad: 'YouTube',
     twitterAppIdIpad: '544007664',
     twitterAppUrlIphone: 'vnd.youtube://www.youtube.com/watch?v=QweNsLesMrM&feature=applinks',
     twitterAppUrlIpad: 'vnd.youtube://www.youtube.com/watch?v=QweNsLesMrM&feature=applinks',
     twitterAppNameGoogleplay: 'YouTube',
     twitterAppIdGoogleplay: 'com.google.android.youtube',
     twitterAppUrlGoogleplay: 'https://www.youtube.com/watch?v=QweNsLesMrM',
     twitterPlayer: 'https://www.youtube.com/embed/QweNsLesMrM',
     twitterPlayerWidth: '1280',
     twitterPlayerHeight: '720',
     images: Set { 'https://www.youtube.com/yts/img/pixel-vfl3z5WfW.gif' } } }
```

For a Facebook post at https://www.facebook.com/joseph.romm/posts/10153908777222475

```
{ author_name: 'Joseph',
  author_url: 'https://www.facebook.com/joseph.romm',
  provider_url: 'https://www.facebook.com',
  provider_name: 'Facebook',
  success: true,
  height: null,
  html: '<div id="fb-root"></div>\n<script>(function(d, s, id) {\n  var js, fjs = d.getElementsByTagName(s)[0];\n  if (d.getElementById(id)) return;\n  js = d.createElement(s); js.id = id;\n  js.src = "//connect.facebook.net/en_US/sdk.js#xfbml=1&version=v2.3";\n  fjs.parentNode.insertBefore(js, fjs);\n}(document, \'script\', \'facebook-jssdk\'));</script><div class="fb-post" data-href="https://www.facebook.com/joseph.romm/posts/10153908777222475" data-width="552"><blockquote cite="https://www.facebook.com/joseph.romm/posts/10153908777222475" class="fb-xfbml-parse-ignore"><p>Humanity is on very thin ice....\n</p>Posted by <a href="https://www.facebook.com/joseph.romm">Joseph Romm</a> on&nbsp;<a href="https://www.facebook.com/joseph.romm/posts/10153908777222475">Monday, September 12, 2016</a></blockquote></div>',
  type: 'rich',
  version: '1.0',
  url: 'https://www.facebook.com/joseph.romm/posts/10153908777222475',
  width: 552,
  metadata:
   { host: 'www.facebook.com',
     path: '/joseph.romm/posts/10153908777222475',
     title: 'Joseph Romm - Humanity is on very thin ice....| Facebook',
     charset: 'utf-8',
     description: 'Humanity is on very thin ice....\n',
     ogTitle: 'Joseph Romm',
     ogDescription: 'Humanity is on very thin ice....\n',
     ogImage: 'https://external.xx.fbcdn.net/safe_image.php?d=AQA2eSy-YaComhu4&w=400&h=400&url=https%3A%2F%2Fcdn-images-1.medium.com%2Ffocal%2F581%2F306%2F58%2F58%2F1%2Acw5wTIwpPJtbhxPNZgD-qA.jpeg&cfs=1&_nc_hash=AQBKu5au7R1XF53H',
     ogUrl: 'https://www.facebook.com/joseph.romm/posts/10153908777222475',
     images: Set { 'https://cs.atdmt.com/event?t=FB+Public+Story+Page+Visit' } } }
```

And a Slideshare presentation https://www.slideshare.net/technosanity/kia-soul-ev-for-bayleafs-meeting

```
{ html: '<iframe src="https://www.slideshare.net/slideshow/embed_code/key/uWsjJ8e4e6Cemu" width="427" height="356" frameborder="0" marginwidth="0" marginheight="0" scrolling="no" style="border:1px solid #CCC; border-width:1px; margin-bottom:5px; max-width: 100%;" allowfullscreen> </iframe> <div style="margin-bottom:5px"> <strong> <a href="https://www.slideshare.net/technosanity/kia-soul-ev-for-bayleafs-meeting" title="Kia Soul EV for BayLEAF&#x27;s meeting - 2014-11" target="_blank">Kia Soul EV for BayLEAF&#x27;s meeting - 2014-11</a> </strong> from <strong><a target="_blank" href="https://www.slideshare.net/technosanity">David Herron</a></strong> </div>\n\n',
  conversion_version: 2,
  version_no: '1415551458',
  provider_url: 'https://www.slideshare.net/',
  provider_name: 'SlideShare',
  height: 355,
  total_slides: 11,
  slideshow_id: 41326227,
  width: 425,
  version: '1.0',
  thumbnail: '//cdn.slidesharecdn.com/ss_thumbnails/5fl8p5l9rzgj7yqvvmcy-signature-72b6f4e5f6e40e4962df1c5e88b99daeb297c1a67b454cb8b7cc483e28b1e940-poli-141109164136-conversion-gate02-thumbnail.jpg?cb=1415551458',
  slide_image_baseurl: '//image.slidesharecdn.com/5fl8p5l9rzgj7yqvvmcy-signature-72b6f4e5f6e40e4962df1c5e88b99daeb297c1a67b454cb8b7cc483e28b1e940-poli-141109164136-conversion-gate02/95/slide-',
  title: 'Kia Soul EV for BayLEAF\'s meeting - 2014-11',
  type: 'rich',
  author_url: 'https://www.slideshare.net/technosanity',
  thumbnail_url: 'https://cdn.slidesharecdn.com/ss_thumbnails/5fl8p5l9rzgj7yqvvmcy-signature-72b6f4e5f6e40e4962df1c5e88b99daeb297c1a67b454cb8b7cc483e28b1e940-poli-141109164136-conversion-gate02-thumbnail.jpg?cb=1415551458',
  slide_image_baseurl_suffix: '-1024.jpg',
  thumbnail_width: 170,
  thumbnail_height: 128,
  author_name: 'David Herron',
  metadata:
   { host: 'www.slideshare.net',
     path: '/technosanity/kia-soul-ev-for-bayleafs-meeting',
     title: 'Kia Soul EV for BayLEAF\'s meeting - 2014-11',
     charset: 'utf-8',
     description: 'Kia Soul EV overview, comparing against other electric cars.  The Soul EV is brand new to the market, facing entrenched competition from the Nissan Leaf and Te…',
     ogDescription: 'Kia Soul EV overview, comparing against other electric cars.  The Soul EV is brand new to the market, facing entrenched competition from the Nissan Leaf and Te…',
     twitterCard: undefined,
     twitterSite: undefined,
     twitterPlayer: undefined,
     twitterPlayerWidth: undefined,
     twitterPlayerHeight: undefined,
     twitterTitle: undefined,
     twitterImage: undefined,
     twitterAppNameGoogleplay: 'SlideShare Android',
     twitterAppIdGoogleplay: 'net.slideshare.mobile',
     twitterAppUrlGoogleplay: 'https://www.slideshare.net/technosanity/kia-soul-ev-for-bayleafs-meeting',
     twitterAppNameIphone: 'SlideShare iOS',
     twitterAppIdIphone: '917418728',
     twitterAppUrlIphone: 'slideshare-app://ss/41326227',
     twitterAppNameIpad: 'SlideShare iOS',
     twitterAppIdIpad: '917418728',
     twitterAppUrlIpad: 'slideshare-app://ss/41326227',
     images:
      Set {
        'https://public.slidesharecdn.com/b/images/logo/linkedin-ss/SS_Logo_White_Large.png?6d1f7a78a6',
        'https://image.slidesharecdn.com/5fl8p5l9rzgj7yqvvmcy-signature-72b6f4e5f6e40e4962df1c5e88b99daeb297c1a67b454cb8b7cc483e28b1e940-poli-141109164136-conversion-gate02/95/kia-soul-ev-for-bayleafs-meeting-201411-1-638.jpg?cb=1415551458',
        'https://cdn.slidesharecdn.com/profile-photo-technosanity-48x48.jpg?cb=1498276261',
        'https://public.slidesharecdn.com/b/images/user-48x48.png',
        'https://public.slidesharecdn.com/b/images/thumbnail.png',
        'https://www.bizographics.com/collect/?pid=870&fmt=gif' } } }
```

## `embed-youtube`

```
<embed-youtube code="CODE" template="TEMPLATE" class="CLASS" style="STYLE" title="TITLE" id="ID" autoplay="AUTOPLAY" description="DESCRIPTION"></embed-youtube>
```

This does not use any API to retrieve data.  Instead it directly uses the documented `iframe` tag for YouTube to set up a player.  Therefore this renders more quickly, by not requiring a network request.

The `CODE` is the video code in the YouTube URL.  Otherwise the attributes are as described for `embed-resource`.

The default template is `embed-youtube.html.ejs`

For every `embed-youtube` an OpenGraph image is promoted using the `opengraph-image` tag.

## `video-players-from-videourls` and `video-thumbnail-from-videourls`

This allows for an array of embeddable resources to be put in the document frontmatter.  That array is then rendered into the output.

In each case a `template="TEMPLATE"` tag is available to override the default template.

There are two possible arrays: `videoUrls` and `youtubeUrls`.  The first uses `embed-resource` to render the players, while the second uses `embed-youtube`.

The fields in the array entries are:

* `url`: The URL for the embeddable resource
* `code`: For `embed-youtube` the code from the YouTube URL
* `title`: The title string to use in displaying the video
* `description`: The descriptive text to use along with the video

Of course for `videoUrls` the default for title and description is retrieved by querying the corresponding service over the Internet.  For `youtubeUrls` no queries are sent over the Internet, so if you want a title and description you'll have to insert those yourself.

For every entry in `youtubeUrls` an OpenGraph image is promoted using the `opengraph-image` tag.

The default templates are:

* `video-players-from-videourls.html.ejs`
* `video-thumbnail-from-videourls.html.ejs`

For `video-thumbnail-from-videourls`, the tag looks for the first entry in the `videoUrls` array, and then constructs an `embed-resource` tag using the `embed-thumbnail.html.ejs` template.  The effect of this is to promote the thumbnail corresponding to the first video as the thumbnail image for the article.

Example:

```
youtubeUrls:
  - url: https://www.youtube.com/watch?v=3g7cgUm7o9k
    code: 3g7cgUm7o9k
    title: GM EV1 TV Commercial 1

  - url: https://www.youtube.com/watch?v=QaRtNdVx0b4
    code: QaRtNdVx0b4
    title: GM EV1 TV Commercial 2

  - url: https://www.youtube.com/watch?v=aPKxsLlU6Co
    code: aPKxsLlU6Co
    title: GM EV1 TV Commercial 3

  - url: https://www.youtube.com/watch?v=TRB14_OyWGM
    code: TRB14_OyWGM
    title: GM EV1 TV Commercial 4
```

In this case we've used `youtubeUrls`.  For that array, the URL attribute is ignored but by putting it here it's possible to easily switch to `videoUrls` if desired.  As a `title` is specified, the video player will have a header text above it, but as no `description` is supplied there will be no text below the player.