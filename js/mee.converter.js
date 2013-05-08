(function( $ ){

  function identity(x) {
    return x;
  }

  function returnFalse(x) {
    return false;
  }

  ////////////////////
  // Register hooks //
  ////////////////////
  var HookCollection = function(){}

  HookCollection.prototype.chain = function (hookname, func) {
    var original = this[hookname];
    if (!original) throw new Error("unknown hook " + hookname);
    if (original === identity) this[hookname] = func;
    else this[hookname] = function (x) {
      return func(original(x, this));
    }
  }

  HookCollection.prototype.set = function (hookname, func) {
    if (!this[hookname]) throw new Error("unknown hook " + hookname);
    this[hookname] = func;
  }

  HookCollection.prototype.addNoop = function (hookname) {
    this[hookname] = identity;
  }

  HookCollection.prototype.addFalse = function (hookname) {
    this[hookname] = returnFalse;
  }

  ///////////////
  // Save Hash //
  ///////////////
  var SaveHash = function(){}

  SaveHash.prototype.set = function (key, value) {
    this["s_" + key] = value;
  }

  SaveHash.prototype.get = function (key) {
    return this["s_" + key];
  }

  /////////////
  // Convert //
  /////////////
  var MeeConverter = function ( e ) {
    this.element = e;

    this.hooks = new HookCollection();
    //this.hooks.addNoop("plainLinkText"); // given a URL that was encountered by itself (without markup), should return the link text that's to be given to this link

    $(e).on("meePlainLinkText", function ( e, html ){ return html; });
    $(e).on("meePreConversion", function ( e, html ){ return html; });
    $(e).on("meePostConversion", function ( e, html ){ return html; });

    // Private variables
    this.g_urls;
    this.g_titles;
    this.g_html_blocks;
    this.g_list_level;

    return this;
  }

  MeeConverter.prototype.convert = function (text) {

    // This will only happen if makeHtml on the same converter instance is
    // called from a plugin hook. THIS IS A NO NO
    if (this.g_urls) throw new Error("Recursive call to converter.makeHtml");

    // Create the private state objects.
    this.g_urls = new SaveHash();
    this.g_titles = new SaveHash();
    this.g_html_blocks = [];
    this.g_list_level = 0;

    // Fire hook
    text = $(this.element).triggerHandler("meePreConversion", text);

    // Replace ~ with ~T
    text = text.replace(/~/g, "~T");
    // Replace $ with ~D
    text = text.replace(/\$/g, "~D");
    // Standardize line endings
    text = text.replace(/\r\n/g, "\n"); // DOS to Unix
    text = text.replace(/\r/g, "\n"); // Mac to Unix
    // Make sure text begins and ends with a couple of newlines:
    text = "\n\n" + text + "\n\n";
    // Convert all tabs to spaces.
    text = this._detab(text);
    // Strip any lines consisting only of spaces and tabs.
    text = text.replace(/^[ \t]+$/mg, "");
    // Turn block-level HTML blocks into hash entries
    text = this._hashHtmlBlocks(text);
    // Strip link definitions, store in hashes.
    text = this._stripLinkDefinitions(text);
    text = this._runBlockGamut(text);
    text = this._unescapeSpecialChars(text);
    // attacklab: Restore dollar signs
    text = text.replace(/~D/g, "$$");
    // attacklab: Restore tildes
    text = text.replace(/~T/g, "~");

    // Fire hook
    text = $(this.element).triggerHandler("meePostConversion", text);

    //text = this.hooks.postConversion(text, this);
    this.g_html_blocks = this.g_titles = this.g_urls = null;
    return text;
  }

  MeeConverter.prototype._detab = function(text) {
    if (!/\t/.test(text)) return text;
    var spaces = ["    ", "   ", "  ", " "],
      skew = 0,
      v;
    return text.replace(/[\n\t]/g, function (match, offset) {
      if (match === "\n") {
        skew = offset + 1;
        return match;
      }
      v = (offset - skew) % 4;
      skew = offset + 1;
      return spaces[v];
    });
  }

  MeeConverter.prototype._hashHtmlBlocks = function(text) {
    // Hashify HTML blocks:
    var block_tags_a = "p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math|ins|del"
    var block_tags_b = "p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math"
    text = text.replace(/^(<(p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math|ins|del)\b[^\r]*?\n<\/\2>[ \t]*(?=\n+))/gm, this._hashElement);
    text = text.replace(/^(<(p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math)\b[^\r]*?.*<\/\2>[ \t]*(?=\n+)\n)/gm, this._hashElement);
    text = text.replace(/\n[ ]{0,3}((<(hr)\b([^<>])*?\/?>)[ \t]*(?=\n{2,}))/g, this._hashElement);
    text = text.replace(/\n\n[ ]{0,3}(<!(--(?:|(?:[^>-]|-[^>])(?:[^-]|-[^-])*)--)>[ \t]*(?=\n{2,}))/g, this._hashElement);
    text = text.replace(/(?:\n\n)([ ]{0,3}(?:<([?%])[^\r]*?\2>)[ \t]*(?=\n{2,}))/g, this._hashElement);
    return text;
  }

  MeeConverter.prototype._hashElement = function(wholeMatch, m1) {
    var blockText = m1;
    // Undo double lines
    blockText = blockText.replace(/^\n+/, "");
    // strip trailing blank lines
    blockText = blockText.replace(/\n+$/g, "");
    // Replace the element text with a marker ("~KxK" where x is its key)
    blockText = "\n\n~K" + (g_html_blocks.push(blockText) - 1) + "K\n\n";
    return blockText;
  }

  MeeConverter.prototype._stripLinkDefinitions = function(text) {
    // Strips link definitions from text, stores the URLs and titles in
    // hash references.
    text = text.replace(/^[ ]{0,3}\[(.+)\]:[ \t]*\n?[ \t]*<?(\S+?)>?(?=\s|$)[ \t]*\n?[ \t]*((\n*)["(](.+?)[")][ \t]*)?(?:\n+)/gm,

    function (wholeMatch, m1, m2, m3, m4, m5) {
      m1 = m1.toLowerCase();
      g_urls.set(m1, _EncodeAmpsAndAngles(m2)); // Link IDs are case-insensitive
      if (m4) {
        // Oops, found blank lines, so it's not a title.
        // Put back the parenthetical statement we stole.
        return m3;
      } else if (m5) {
        g_titles.set(m1, m5.replace(/"/g, "&quot;"));
      }
      // Completely remove the definition from the text
      return "";
    });
    return text;
  }

  MeeConverter.prototype._runBlockGamut = function(text, doNotUnhash) {
    // These are all the transformations that form block-level
    // tags like paragraphs, headers, and list items.
    text = this._doHeaders(text);
    // Do Horizontal Rules:
    var replacement = "<hr />\n";
    text = text.replace(/^[ ]{0,2}([ ]?\*[ ]?){3,}[ \t]*$/gm, replacement);
    text = text.replace(/^[ ]{0,2}([ ]?-[ ]?){3,}[ \t]*$/gm, replacement);
    text = text.replace(/^[ ]{0,2}([ ]?_[ ]?){3,}[ \t]*$/gm, replacement);
    text = this._doLists(text);
    text = this._doCodeBlocks(text);
    text = this._doBlockQuotes(text);
    // We already ran _HashHTMLBlocks() before, in Mee(), but that
    // was to escape raw HTML in the original Mee source. This time,
    // we're escaping the markup we've just created, so that we don't wrap
    // <p> tags around block-level tags.
    text = this._hashHtmlBlocks(text);
    text = this._formParagraphs(text, doNotUnhash);
    return text;
  }

  MeeConverter.prototype._doHeaders = function(text) {
    text = text.replace(/^(.+)[ \t]*\n=+[ \t]*\n+/gm,

    function (wholeMatch, m1) {
      return "<h1>" + _RunSpanGamut(m1) + "</h1>\n\n";
    });
    text = text.replace(/^(.+)[ \t]*\n-+[ \t]*\n+/gm,

    function (matchFound, m1) {
      return "<h2>" + _RunSpanGamut(m1) + "</h2>\n\n";
    });

    text = text.replace(/^(\#{1,6})[ \t]*(.+?)[ \t]*\#*\n+/gm,

    function (wholeMatch, m1, m2) {
      var h_level = m1.length;
      return "<h" + h_level + ">" + _RunSpanGamut(m2) + "</h" + h_level + ">\n\n";
    });
    return text;
  }

  MeeConverter.prototype._doLists = function(text) {
    // Form HTML ordered (numbered) and unordered (bulleted) lists.
    var whole_list = /^(([ ]{0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(~0|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.])[ \t]+)))/gm;
    if (this.g_list_level) {
      text = text.replace(whole_list, function (wholeMatch, m1, m2) {
        var list = m1;
        var list_type = (m2.search(/[*+-]/g) > -1) ? "ul" : "ol";
        var result = _ProcessListItems(list, list_type);
        result = result.replace(/\s+$/, "");
        result = "<" + list_type + ">" + result + "</" + list_type + ">\n";
        return result;
      });
    } else {
      whole_list = /(\n\n|^\n?)(([ ]{0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(~0|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.])[ \t]+)))/g;
      text = text.replace(whole_list, function (wholeMatch, m1, m2, m3) {
        var runup = m1;
        var list = m2;
        var list_type = (m3.search(/[*+-]/g) > -1) ? "ul" : "ol";
        var result = _ProcessListItems(list, list_type);
        result = runup + "<" + list_type + ">\n" + result + "</" + list_type + ">\n";
        return result;
      });
    }
    text = text.replace(/~0/, "");
    return text;
  }

  MeeConverter.prototype._doCodeBlocks = function(text) {
    //  Process Mee `<pre><code>` blocks.ntinel workarounds for lack of \A and \Z, safari\khtml bug
    text += "~0";
    text = text.replace(/(?:\n\n|^)((?:(?:[ ]{4}|\t).*\n+)+)(\n*[ ]{0,3}[^ \t\n]|(?=~0))/g,

    function (wholeMatch, m1, m2) {
      var codeblock = m1;
      var nextChar = m2;
      codeblock = _EncodeCode(_Outdent(codeblock));
      codeblock = _Detab(codeblock);
      codeblock = codeblock.replace(/^\n+/g, ""); // trim leading newlines
      codeblock = codeblock.replace(/\n+$/g, ""); // trim trailing whitespace
      codeblock = '<pre class="prettyprint linenums"><code>' + codeblock + '\n</code></pre>';
      return "\n\n" + codeblock + "\n\n" + nextChar;
    });
    // attacklab: strip sentinel
    text = text.replace(/~0/, "");
    return text;
  }

  MeeConverter.prototype._doBlockQuotes = function(text) {
    text = text.replace(/((^[ \t]*>[ \t]?.+\n(.+\n)*\n*)+)/gm,

    function (wholeMatch, m1) {
      var bq = m1;
      // attacklab: hack around Konqueror 3.5.4 bug:
      // "----------bug".replace(/^-/g,"") == "bug"
      bq = bq.replace(/^[ \t]*>[ \t]?/gm, "~0"); // trim one level of quoting
      // attacklab: clean up hack
      bq = bq.replace(/~0/g, "");
      bq = bq.replace(/^[ \t]+$/gm, ""); // trim whitespace-only lines
      bq = _RunBlockGamut(bq); // recurse
      bq = bq.replace(/(^|\n)/g, "$1  ");
      // These leading spaces screw with <pre> content, so we need to fix that:
      bq = bq.replace(/(\s*<pre>[^\r]+?<\/pre>)/gm,

      function (wholeMatch, m1) {
        var pre = m1;
        // attacklab: hack around Konqueror 3.5.4 bug:
        pre = pre.replace(/^  /mg, "~0");
        pre = pre.replace(/~0/g, "");
        return pre;
      });
      return hashBlock("<blockquote>\n" + bq + "\n</blockquote>");
    });
    return text;
  }

  MeeConverter.prototype._formParagraphs = function(text, doNotUnhash) {
    text = text.replace(/^\n+/g, "");
    text = text.replace(/\n+$/g, "");
    var grafs = text.split(/\n{2,}/g);
    var grafsOut = [];
    var markerRe = /~K(\d+)K/;
    //
    // Wrap <p> tags.
    //
    var end = grafs.length;
    for (var i = 0; i < end; i++) {
      var str = grafs[i];
      // if this is an HTML marker, copy it
      if (markerRe.test(str)) {
        grafsOut.push(str);
      } else if (/\S/.test(str)) {
        str = this._runSpanGamut(str);
        str = str.replace(/^([ \t]*)/g, "<p>");
        str += "</p>"
        grafsOut.push(str);
      }
    }
    //
    // Unhashify HTML blocks
    //
    if (!doNotUnhash) {
      end = grafsOut.length;
      for (var i = 0; i < end; i++) {
        var foundAny = true;
        while (foundAny) { // we may need several runs, since the data may be nested
          foundAny = false;
          grafsOut[i] = grafsOut[i].replace(/~K(\d+)K/g, function (wholeMatch, id) {
            foundAny = true;
            return g_html_blocks[id];
          });
        }
      }
    }
    return grafsOut.join("\n\n");
  }

  MeeConverter.prototype._runSpanGamut = function(text) {
    //
    // These are all the transformations that occur *within* block-level
    // tags like paragraphs, headers, and list items.
    //
    text = this._doCodeSpans(text);
    text = this._escapeSpecialCharsWithinTagAttributes(text);
    text = this._encodeBackslashEscapes(text);
    // Process anchor and image tags. Images must come first,
    // because ![foo][f] looks like an anchor.
    text = this._doImages(text);
    text = this._doAnchors(text);
    // Make links out of things like `<http://example.com/>`
    // Must come after _DoAnchors(), because you can use < and >
    // delimiters in inline links like [this](<url>).
    text = this._doAutoLinks(text);
    text = text.replace(/~P/g, "://"); // put in place to prevent autolinking; reset now
    text = this._encodeAmpsAndAngles(text);
    text = this._doItalicsAndBold(text);
    // Do hard breaks:
    text = text.replace(/  +\n/g, " <br>\n");
    return text;
  }

  MeeConverter.prototype._doCodeSpans = function(text) {
    text = text.replace(/(^|[^\\])(`+)([^\r]*?[^`])\2(?!`)/gm,

    function (wholeMatch, m1, m2, m3, m4) {
      var c = m3;
      c = c.replace(/^([ \t]*)/g, ""); // leading whitespace
      c = c.replace(/[ \t]*$/g, ""); // trailing whitespace
      c = _EncodeCode(c);
      c = c.replace(/:\/\//g, "~P"); // to prevent auto-linking. Not necessary in code *blocks*, but in code spans. Will be converted back after the auto-linker runs.
      return m1 + "<code>" + c + "</code>";
    });
    return text;
  }

  MeeConverter.prototype._escapeSpecialCharsWithinTagAttributes = function(text) {
    var self = this;
    var regex = /(<[a-z\/!$]("[^"]*"|'[^']*'|[^'">])*>|<!(--(?:|(?:[^>-]|-[^>])(?:[^-]|-[^-])*)--)>)/gi;
    text = text.replace(regex, function (wholeMatch) {
      var tag = wholeMatch.replace(/(.)<\/?code>(?=.)/g, "$1`");
      tag = self._escapeCharactersCallback(tag, wholeMatch.charAt(1) == "!" ? "\\`*_/" : "\\`*_"); // also escape slashes in comments to prevent autolinking there -- http://meta.stackoverflow.com/questions/95987
      return tag;
    });
    return text;
  }

  MeeConverter.prototype._encodeBackslashEscapes = function(text) {
    //
    //   Parameter:  String.
    //   Returns:    The string, with after processing the following backslash
    //               escape sequences.
    //
    // attacklab: The polite way to do this is with the new
    // escapeCharacters() function:
    //
    //     text = escapeCharacters(text,"\\",true);
    //     text = escapeCharacters(text,"`*_{}[]()>#+-.!",true);
    //
    // ...but we're sidestepping its use of the (slow) RegExp constructor
    // as an optimization for Firefox.  This function gets called a LOT.
    text = text.replace(/\\(\\)/g, this._escapeCharactersCallback);
    text = text.replace(/\\([`*_{}\[\]()>#+-.!])/g, this._escapeCharactersCallback);
    return text;
  }

  MeeConverter.prototype._doImages = function(text) {
    text = text.replace(/(!\[(.*?)\][ ]?(?:\n[ ]*)?\[(.*?)\])()()()()/g, this._writeImageTag);
    text = text.replace(/(!\[(.*?)\]\s?\([ \t]*()<?(\S+?)>?[ \t]*((['"])(.*?)\6[ \t]*)?\))/g, this._writeImageTag);
    return text;
  }

  MeeConverter.prototype._writeImageTag = function(wholeMatch, m1, m2, m3, m4, m5, m6, m7) {
    var whole_match = m1;
    var alt_text = m2;
    var link_id = m3.toLowerCase();
    var url = m4;
    var title = m7;
    if (!title) title = "";
    if (url == "") {
      if (link_id == "") {
        // lower-case and turn embedded newlines into spaces
        link_id = alt_text.toLowerCase().replace(/ ?\n/g, " ");
      }
      url = "#" + link_id;
      if (g_urls.get(link_id) != undefined) {
        url = g_urls.get(link_id);
        if (g_titles.get(link_id) != undefined) {
          title = g_titles.get(link_id);
        }
      } else {
        return whole_match;
      }
    }
    alt_text = this._escapeCharactersCallback(attributeEncode(alt_text), "*_[]()");
    url = this._escapeCharactersCallback(url, "*_");
    var result = "<img src=\"" + url + "\" alt=\"" + alt_text + "\"";
    // attacklab: Mee.pl adds empty title attributes to images.
    // Replicate this bug.
    //if (title != "") {
    title = attributeEncode(title);
    title = this._escapeCharactersCallback(title, "*_");
    result += " title=\"" + title + "\"";
    //}
    result += " />";
    return result;
  }

  MeeConverter.prototype._doAnchors = function(text) {
    text = text.replace(/(\[((?:\[[^\]]*\]|[^\[\]])*)\][ ]?(?:\n[ ]*)?\[(.*?)\])()()()()/g, this._writeAnchorTag);
    text = text.replace(/(\[((?:\[[^\]]*\]|[^\[\]])*)\]\([ \t]*()<?((?:\([^)]*\)|[^()])*?)>?[ \t]*((['"])(.*?)\6[ \t]*)?\))/g, this._writeAnchorTag);
    text = text.replace(/(\[([^\[\]]+)\])()()()()()/g, this._writeAnchorTag);
    return text;
  }

  MeeConverter.prototype._writeAnchorTag = function(wholeMatch, m1, m2, m3, m4, m5, m6, m7) {
    if (m7 == undefined) m7 = "";
    var whole_match = m1;
    var link_text = m2.replace(/:\/\//g, "~P"); // to prevent auto-linking withing the link. will be converted back after the auto-linker runs
    var link_id = m3.toLowerCase();
    var url = m4;
    var title = m7;
    if (url == "") {
      if (link_id == "") {
        // lower-case and turn embedded newlines into spaces
        link_id = link_text.toLowerCase().replace(/ ?\n/g, " ");
      }
      url = "#" + link_id;
      if (g_urls.get(link_id) != undefined) {
        url = g_urls.get(link_id);
        if (g_titles.get(link_id) != undefined) {
          title = g_titles.get(link_id);
        }
      } else {
        if (whole_match.search(/\(\s*\)$/m) > -1) {
          // Special case for explicit empty url
          url = "";
        } else {
          return whole_match;
        }
      }
    }
    url = MeeConverter.prototype._encodeProblemUrlChars(url);
    url = MeeConverter.prototype._escapeCharactersCallback(url, "*_");
    var result = "<a href=\"" + url + "\"";
    if (title != "") {
      title = MeeConverter.prototype._attributeEncode(title);
      title = MeeConverter.prototype._escapeCharactersCallback(title, "*_");
      result += " title=\"" + title + "\"";
    }
    result += ">" + link_text + "</a>";
    return result;
  }

  MeeConverter.prototype._attributeEncode = function(text) {
    // unconditionally replace angle brackets here -- what ends up in an attribute (e.g. alt or title)
    // never makes sense to have verbatim HTML in it (and the sanitizer would totally break it)
    return text.replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }

  MeeConverter.prototype._encodeProblemUrlChars = function(url) {
    if (!url) return "";
    var len = url.length;
    var _problemUrlChars = /(?:["'*()[\]:]|~D)/g;
    return url.replace(_problemUrlChars, function (match, offset) {
      if (match == "~D") // escape for dollar
      return "%24";
      if (match == ":") {
        if (offset == len - 1 || /[0-9\/]/.test(url.charAt(offset + 1))) return ":";
        if (url.substring(0, 'mailto:'.length) === 'mailto:') return ":";
        if (url.substring(0, 'magnet:'.length) === 'magnet:') return ":";
      }
      return "%" + match.charCodeAt(0).toString(16);
    });
  }

  MeeConverter.prototype._doAutoLinks = function(text) {
    text = text.replace(/(^|\s)(https?|ftp)(:\/\/[-A-Z0-9+&@#\/%?=~_|\[\]\(\)!:,\.;]*[-A-Z0-9+&@#\/%=~_|\[\]])($|\W)/gi, "$1<$2$3>$4");
    var replacer = function (wholematch, m1) {
      return "<a href=\"" + m1 + "\">" + $(this.element).triggerHandler("meePlainLinkText", m1) + "</a>";
    }
    text = text.replace(/<((https?|ftp):[^'">\s]+)>/gi, replacer);
    var email_replacer = function (wholematch, m1) {
      var mailto = 'mailto:'
      var link
      var email
      if (m1.substring(0, mailto.length) != mailto) {
        link = mailto + m1;
        email = m1;
      } else {
        link = m1;
        email = m1.substring(mailto.length, m1.length);
      }
      return "<a href=\"" + link + "\">" + $(this.element).triggerHandler("meePlainLinkText", m1) + "</a>";
    }
    text = text.replace(/<((?:mailto:)?([-.\w]+\@[-a-z0-9]+(\.[-a-z0-9]+)*\.[a-z]+))>/gi, email_replacer);
    return text;
  }

  MeeConverter.prototype._encodeAmpsAndAngles = function(text) {
    text = text.replace(/&(?!#?[xX]?(?:[0-9a-fA-F]+|\w+);)/g, "&amp;");
    text = text.replace(/<(?![a-z\/?\$!])/gi, "&lt;");
    return text;
  }

  MeeConverter.prototype._doItalicsAndBold = function(text) {
    // <strong> must go first:
    text = text.replace(/([\W_]|^)(\*\*|__)(?=\S)([^\r]*?\S[\*_]*)\2([\W_]|$)/g, "$1<strong>$3</strong>$4");
    text = text.replace(/([\W_]|^)(\*|_)(?=\S)([^\r\*_]*?\S)\2([\W_]|$)/g, "$1<em>$3</em>$4");
    return text;
  }

  MeeConverter.prototype._escapeCharactersCallback = function(wholeMatch, m1) {
    var charCodeToEscape = m1.charCodeAt(0);
    return "~E" + charCodeToEscape + "E";
  }

  MeeConverter.prototype._unescapeSpecialChars = function(text) {
    text = text.replace(/~E(\d+)E/g,

    function (wholeMatch, m1) {
      var charCodeToReplace = parseInt(m1);
      return String.fromCharCode(charCodeToReplace);
    });
    return text;
  }

  window.MeeConverter = MeeConverter;

})( jQuery );
