(function( $ ){

  var MeeSanitize = function ( e ) {

    $(e).on("meePostConversion", this.sanitizeHtml);
    $(e).on("meePostConversion", this.balanceTags);

    return this;
  }

  MeeSanitize.prototype.sanitizeHtml = function ( e, html ) {
    var options = $(e.currentTarget).data('mee');
    return html.replace(/<[^>]*>?/gi, function( tag ){
      if (tag.match(options.basic_tag_whitelist) || tag.match(options.a_white) || tag.match(options.img_white) || tag.match(options.pre_white)) return tag;
      else return "";
    });
  }

  MeeSanitize.prototype.balaceTags = function ( e, html ) {

    if (html == "") return "";
    var re = /<\/?\w+[^>]*(\s|$|>)/g;
    // convert everything to lower case; this makes
    // our case insensitive comparisons easier
    var tags = html.toLowerCase().match(re);
    // no HTML tags present? nothing to do; exit now
    var tagcount = (tags || []).length;
    if (tagcount == 0) return html;
    var tagname, tag;
    var ignoredtags = "<p><img><br><li><hr>";
    var match;
    var tagpaired = [];
    var tagremove = [];
    var needsRemoval = false;
    // loop through matched tags in forward order
    for (var ctag = 0; ctag < tagcount; ctag++) {
      tagname = tags[ctag].replace(/<\/?(\w+).*/, "$1");
      // skip any already paired tags
      // and skip tags in our ignore list; assume they're self-closed
      if (tagpaired[ctag] || ignoredtags.search("<" + tagname + ">") > -1) continue;
      tag = tags[ctag];
      match = -1;
      if (!/^<\//.test(tag)) {
        // this is an opening tag
        // search forwards (next tags), look for closing tags
        for (var ntag = ctag + 1; ntag < tagcount; ntag++) {
          if (!tagpaired[ntag] && tags[ntag] == "</" + tagname + ">") {
            match = ntag;
            break;
          }
        }
      }
      if (match == -1) needsRemoval = tagremove[ctag] = true; // mark for removal
      else tagpaired[match] = true; // mark paired
    }
    if (!needsRemoval) return html;
    // delete all orphaned tags from the string
    var ctag = 0;
    html = html.replace(re, function (match) {
      var res = tagremove[ctag] ? "" : match;
      ctag++;
      return res;
    });

    return 'hi';
    return html;
  }

  window.MeeSanitize = MeeSanitize;

})( jQuery );
