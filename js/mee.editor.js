(function( $ ){

/**
 * Plugin Router
 */
$.fn.mee = function( method ) {
  if ( methods[method] ) {
    return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
  } else if ( typeof method === 'object' || ! method ) {
    return methods.init.apply( this, arguments );
  } else {
    $.error( 'Method ' +  method + ' does not exist on jQuery.tooltip' );
  }
};

/******************************************************************************
 * GLOBAL Methods
 */

var methods = {};

/**
 * Initialize an instance of MEE
 */
methods.init = function ( options ) {
  new meeObject( this, options ).init();
}

methods.toolbarButtonClick = function ( e ) {
  e.preventDefault();

  // Set focus
  meeActive.meeObject.mee.editor.focus();

  // Set active objects
  meeActive.meeButton = $(e.currentTarget);
  meeActive.meeButtonSettings = $(e.currentTarget).data('mee');
  meeActive.meeSelection = new meeSelection();

  if($.isFunction(meeCommands[meeActive.meeButtonSettings.command])){
    // Send to command
    meeCommands[meeActive.meeButtonSettings.command]();
    // Update after command runs
    meeActive.meeObject.previewUpdate();
    // Trigger resize
    if(meeActive.meeObject.settings.autogrow == true) meeActive.meeObject.mee.editor.trigger('autosize');
  }else{
    meeCommands.notFound( buttonSettings.command );
  }
}

methods.markdownConvert = function ( text ) {
  for(i in meeReplace.before){
    text = meeReplace.before[i]( text );
  }
  text = marked(text);
  for(i in meeReplace.after){
    text = meeReplace.after[i]( text );
  }
  return text;
}

/**
 * Extends a regular expression.  Returns a new RegExp
 * using pre + regex + post as the expression.
 * Used in a few functions where we have a base
 * expression and we want to pre- or append some
 * conditions to it (e.g. adding "$" to the end).
 * The flags are unchanged.

 * regex is a RegExp, pre and post are strings.
 */
methods.extendRegExp = function (regex, pre, post) {
  if (pre === null || pre === undefined) {
    pre = "";
  }
  if (post === null || post === undefined) {
    post = "";
  }
  var pattern = regex.toString();
  var flags;
  // Replace the flags with empty space and store them.
  pattern = pattern.replace(/\/([gim]*)$/, function (wholeMatch, flagsPart) {
    flags = flagsPart;
    return "";
  });
  // Remove the slash delimiters on the regular expression.
  pattern = pattern.replace(/(^\/|\/$)/g, "");
  pattern = pre + pattern + post;
  return new settingsGlobal.re(pattern, flags);
}

/**
 * Full screen
 */
methods.fullscreenLaunch = function ( element, meeObject ) {
  var self = this;
  self.meeObject = meeObject;
  if(element.requestFullScreen) {
    element.requestFullScreen();
  } else if(element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if(element.webkitRequestFullScreen) {
    element.webkitRequestFullScreen();
  }
}

methods.fullscreenCancel = function () {
  if(document.cancelFullScreen) {
    document.cancelFullScreen();
  } else if(document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if(document.webkitCancelFullScreen) {
    document.webkitCancelFullScreen();
  }
}

methods.fullscreenToggle = function ( e ) {
  var self = this;
  var element = self.meeObject.mee.editorWrapperInner.closest('.mee-wrapper');
  if(element.hasClass('mee-full')){
    settingsGlobal.fullscreenActive = false;
    meeActive.meeButton.removeClass('btn-danger').addClass('btn-inverse');
    element.removeClass('mee-full');
    // Update preview right when full screen is closed
    self.meeObject.previewUpdate();
  }else{
    settingsGlobal.fullscreenActive = true;
    meeActive.meeButton.removeClass('btn-inverse').addClass('btn-danger');
    element.addClass('mee-full');
  }
}

// Events
document.addEventListener("fullscreenchange", function(e) {
  methods.fullscreenToggle( e );
});
document.addEventListener("mozfullscreenchange", function(e) {
  methods.fullscreenToggle( e );
});
document.addEventListener("webkitfullscreenchange", function(e) {
  methods.fullscreenToggle( e );
});

/******************************************************************************
 * GLOBAL Settings
 */

var settingsGlobal = {
    initialized           : false
  , editorCount           : 0
  , nav                   : window.navigator
  , re                    : window.RegExp
  , doc                   : window.document
  , imageDialogText       : "<p>http://example.com/images/diagram.jpg \"optional title\"</p>"
  , linkDialogText        : "<p>http://example.com/ \"optional title\"</p>"
  , imageDefaultText      : "http://"
  , linkDefaultText       : "http://"
  , lineLength            : 72
  , fullscreenActive      : false
};

/******************************************************************************
 * GLOBAL Active Elements
 */

var meeActive = {
    meeObject           : {}
  , meeSelection        : {}
  , meeButton           : {}
  , meeButtonSettings   : {}
  , meeWidget           : {}
};
$.fn.meeActive = meeActive;

/******************************************************************************
 * INSTANCE Methods/Functions
 */
var meeObject = function ( selector, options ) {
  var self = this;
  self.mee = {
      selector            : selector
    , loading             : false
    , built               : false
    , ready               : 0
    , wrapper             : {}
    , editorWrapper       : {}
    , editorWrapperInner  : {}
    , editor              : {}
    , toolbar             : {}
    , toolbarGroups       : {}
    , preview             : {}
    , previewIframe       : {}
  };

  var defaults = {
      view          : 'default'     // The display style for the editor
    , autogrow      : true          // Should we autogrow the textarea
    , labels_show   : true          // Show button labels in toolbar
    , previewUpdateDelay  : 1000    // Interval between preview refresh in ms
    , transitionSpeed     : 400
    , buttons       : {
          bold          : {label:'<i class="icon-bold"></i>',tip:'Bold - Ctrl+B',key:'ctrl+b',group:'font'}
        , italic        : {label:'<i class="icon-italic"></i>',tip:'Italic - Ctrl+I',key:'ctrl+i',group:'font'}
        , heading       : {label:'Heading',tip:'Heading - Ctrl+H',key:'ctrl+h',group:'font'}
        , ul            : {label:'<i class="icon-list"></i>',tip:'Bulleted List - Ctrl+U',key:'ctrl+u',group:'list'}
        , ol            : {label:'<i class="icon-list-numbered"></i>',tip:'Numbered List - Ctrl+O',key:'ctrl+o',group:'list'}
        , link          : {label:'<i class="icon-link"></i>',tip:'Link - Ctrl+L',key:'ctrl+l',group:'other'}
        , image         : {label:'Image',tip:'Image - Ctrl+G',key:'ctrl+g',group:'other'}
        , blockquote    : {label:'<i class="icon-quote"></i>',tip:'Blockquote - Ctrl+Q',key:'ctrl+q',group:'other'}
        , rule          : {label:'<i class="icon-minus"></i>',tip:'Horizontal Rule - Ctrl+H',key:'ctrl+h',group:'other'}
        , code          : {label:'<i class="icon-code"></i>',tip:'Code - Ctrl+K',key:'ctrl+k',group:'other'}
    }
    , groups        : {
          default       : {label:'',weight:0}
        , font          : {label:'Font Style',weight:1,pos:'left'}
        , list          : {label:'List',weight:2,pos:'left'}
        , other         : {label:'Other',weight:3,pos:'left'}
        , right         : {label:'Right',weight:4,pos:'right'}
    }
  };
  self.settings = $.extend( defaults, options );

  return self;
}

meeObject.prototype.init = function () {
  var self = this;
  return self.mee.selector.filter('textarea').each(function(){
    // Build editor
    if(!self.mee.built){
      self.once();
      self.mee.built = true;
      self.mee.editor = $(this);
      self.loading();
      self.editorBuild();
    }
  });
}

// Will only be run once when a Mee instance is found
meeObject.prototype.once = function () {
  if(settingsGlobal.initialized == true) return;
  settingsGlobal.initialized = true;
}

meeObject.prototype.loading = function () {
  var self = this;
  if(self.mee.loading === false){
    self.mee.loader = $('<div class="mee-loader"><div><i class="icon-mee-spinner animate-spin"></i> Loading editor...</div></div>');
    self.mee.editor.before( self.mee.loader );
    self.mee.loading = true;
  }
  if(self.mee.ready == 2){
    self.ready();
    self.mee.loader.animate({opacity:0,height:self.mee.wrapper.height()}, self.settings.transitionSpeed * 2, function(){
      $(this).remove();
      self.mee.wrapper.css({display:'block',opacity:0}).animate({opacity:1}, self.settings.transitionSpeed);
    });
    clearTimeout(self.loadingTimeout);
    delete self.loadingTimeout;
    delete self.loading;
  }else{
    self.loadingTimeout = setTimeout(function(){
      self.loading();
    }, 100);
  }
}

meeObject.prototype.ready = function () {
  var self = this;
  // Update right away without delay
  self.editorUpdate();
  if(self.settings.autogrow == true){
    // Autosize needs the textfield to be visible, so we show it and hide it
    // again quickly.
    self.mee.wrapper.css({display:'block'});
    self.mee.editor.css({overflow:'hidden'}).autosize({append:"\n"});
    self.mee.wrapper.css({display:'none'});
  }
}

meeObject.prototype.editorBuild = function () {
  var self = this;
  settingsGlobal.editorCount++;

  // Setup editor
  self.mee.editor
    .bind('keyup', function(){
      self.editorUpdateDelay();
    })
    .wrap('<div id="mee-wrapper-' + settingsGlobal.editorCount + '" class="mee-wrapper mee-view-' + self.settings.view + ' clearfix"><div class="mee-wrapper-inner"><div class="mee-border well well-small"><div class="mee-inner"><div class="mee-editor"><div class="mee-editor-inner"><div class="mee-textarea-wrapper"></div></div></div></div></div></div></div>');;

  // Autogrow
  //var callback = function(){ self.previewResize(parseInt(this.style.height.replace('px',''))); }
  //if(self.settings.autogrow == true) self.mee.editor.css({overflow:'hidden'}).autosize({append:"\n",callback:callback});

  // Store some DOM objects we will use later
  self.mee.wrapper = self.mee.editor.closest('.mee-wrapper-inner');
  self.mee.inner = self.mee.editor.closest('.mee-inner');
  self.mee.editorWrapper = self.mee.editor.closest('.mee-editor');
  self.mee.editorWrapperInner = self.mee.editor.closest('.mee-editor-inner');

  self.mee.editor.bind('keyup', 'shift+return', function( e ){
    e.preventDefault();
    meeActive.meeSelection = new meeSelection();
    meeCommands.autoIndent();
  });

  // Build toolbar
  self.toolbarBuild();

  // Build preview
  self.previewBuild();
}

meeObject.prototype.editorUpdateDelay = function ( e ) {
  var self = this;
  if(!self.mee.preview.length) return;
  if(!self.editorUpdateDelayTimeout){
    self.editorUpdateDelayTimeout = setTimeout(function(){
      self.editorUpdate();
      //self.previewResize();
      clearTimeout(self.editorUpdateDelayTimeout);
      delete self.editorUpdateDelayTimeout;
    },self.settings.previewUpdateDelay);
  }
  return this;
}

meeObject.prototype.editorUpdate = function () {
  var self = this;
  var value = methods.markdownConvert( self.mee.editor.val() );
  self.mee.preview.html(value);
  for(i in meeReplace.finish){
    text = meeReplace.finish[i]( self );
  }
  if(self.settings.autogrow == true) self.mee.editor.trigger('autosize');
}

meeObject.prototype.toolbarBuild = function () {
  var self = this;

  // Don't do anything else if we don't have any buttons.
  if(!self.settings.buttons) return;

  var classes = '';
  if(self.settings.labels_show != true) classes += ' labels-hide';
  self.mee.toolbar = $('<div class="mee-toolbar btn-toolbar clearfix' + classes + '" />');
  self.mee.toolbar.prependTo(self.mee.editorWrapperInner);

  // Build button groups
  self.toolbarBuildGroups();
  // Built buttons
  self.toolbarBuildButtons();
  // Toolbar built -- incriment ready status
  self.mee.ready++;
}

meeObject.prototype.toolbarBuildGroups = function () {
  var self = this;
  var groups = {};
  var groupClass = 'btn-group';
  var groupMarkup = '<div class="btn-group" />';
  for(i in self.settings.groups){
    // Don't show unneed groups
    var need = false;
    for(ii in self.settings.buttons){
      if(self.settings.buttons[ii].group == i) need = true;
    }
    if(!need) continue;
    var settings = self.settings.groups[i];
    settings.label = settings.label ? settings.label : '&nbsp;';
    var label = '<label>' + settings.label + '</label>';
    groups[i] = $(groupMarkup).appendTo(self.mee.toolbar).wrap('<div class="mee-group pull-' + settings.pos + '" />').before(label);
  }
  if($.isEmptyObject(groups)) groups[0] = $(groupMarkup).appendTo(self.mee.toolbar);
  self.mee.toolbarGroups = groups;
}

meeObject.prototype.toolbarBuildButtons = function () {
  var self = this;
  for(i in self.settings.buttons){
    // Default button options
    var settings = $.extend( {
        'id'        : i     // The button unique key
      , 'command'   : i     // By default, the command is the id
      , 'label'     : null  // The button text
      , 'tip'       : null  // The information set in the tooltip
      , 'key'       : null  // The shortcut key combo
      , 'group'     : null  // The button group
      , 'data'      : {}    // Any additional information that needs to be passed to the button command
    }, self.settings.buttons[i]);
    // If no group set or does not exist, reset to 0
    var group = settings.group ? ( self.mee.toolbarGroups[settings.group] ? settings.group : 0 ) : 0;
    var button = $('<a class="btn btn-mini btn-inverse" title="' + settings.tip + '" id="mee-' + i + '">' + settings.label + '</a>')
      .data('mee',settings)
      .appendTo(self.mee.toolbarGroups[group]);

    // Set tooltips
    if(jQuery.isFunction( button.tooltip ) && settings.tip){
      button.tooltip({placement:'top',delay:500,container:'body'});
    }

    // Set up keybindings if desired
    if(settings.key){
      self.mee.editor.data(settings.key, button);
      self.mee.editor.bind('keydown', settings.key, function( e ){
        e.currentTarget = $(e.currentTarget).data(e.data);
        meeActive.meeObject = self;
        methods.toolbarButtonClick( e );
      });
    }

    // Set up click event
    button.bind('click', function( e ){
      meeActive.meeObject = self;
      methods.toolbarButtonClick( e );
    });
  }
}

meeObject.prototype.previewBuild = function () {
  var self = this;
  // @TODO
  // Make this non-Drupal specific
  var url = Drupal.settings.basePath + 'mee/iframe';
  //var style = 'display:none;';
  //if(self.settings.autogrow == true) style += 'overflow:hidden;';
  self.mee.previewIframe = $('<iframe src="'+url+'" class="mee-preview">');
  self.mee.previewIframe.appendTo(self.mee.editorWrapperInner).after('<div class="mee-clear" />');
  self.mee.previewIframe.wrap('<div class="mee-preview-wrapper" />');
  self.previewWatch();
}

meeObject.prototype.previewWatch = function() {
  var self = this;
  var preview = self.mee.previewIframe.contents().find('.mee-iframe-content');
  if(preview.length){
    // self.mee.previewIframe.css({display:'block',opacity:0}).animate({opacity:1}, 200, function(){
    //   $(this).css({display:'',opacity:''});
    // });
    self.mee.preview = preview;
    // Cleanup
    clearTimeout(self.previewWatchTimeout);
    delete self.previewWatchTimeout;
    // Preview built -- incriment ready status
    self.mee.ready++;
  }else{
    self.previewWatchTimeout = setTimeout(function(){
      self.previewWatch();
    }, 100);
  }
}

meeObject.prototype.previewUpdate = function () {
  var self = this;
  self.mee.editor.trigger('keyup');
}

meeObject.prototype.previewResize = function ( height ) {
  var self = this;
  if(!self.mee.preview.length || self.settings.autogrow != true || settingsGlobal.fullscreenActive == true) return;
  height = height ? height : 0;
  height = Math.max(self.mee.editor.outerHeight(), Math.max(height, self.mee.preview.outerHeight()));
  self.mee.previewIframe.css('height', height);
  return this;
}



/******************************************************************************
 * GLOBAL Widget
 */

function meeWidget () {
  var self = this;
  self.build();
}
$.fn.meeWidget = meeWidget;

meeWidget.prototype.build = function () {
  var self = this;
  self.widgetCover = $('<div class="mee-widget-cover" />').appendTo( meeActive.meeObject.mee.wrapper );
  self.widget = $('<div id="mee-widget" class="mee-widget"><div class="mee-widget-inner"></div></div>').appendTo( meeActive.meeObject.mee.wrapper );
  self.widgetInner = self.widget.find('.mee-widget-inner');
  self.widgetHeader = $('<div class="mee-widget-header" />').appendTo(self.widgetInner);
  self.widgetClose = $('<a class="close" data-dismiss="widget">&times;</a>').click(function( e ){
    e.preventDefault();
    self.hide();
  }).appendTo(self.widgetHeader);
  self.widgetTitle = $('<div class="mee-widget-title" />').appendTo(self.widgetHeader);
  self.widgetContent = $('<div class="mee-widget-content" />').appendTo(self.widgetInner);
  self.widgetFooter = $('<div class="mee-widget-footer" />').appendTo(self.widgetInner);
  $(document).bind('keyup.key27', function(e){
    if (e.keyCode == 27){
      self.hide();
      $(document).unbind('keyup.key27');
    }
  });
  return self;
}

meeWidget.prototype.show = function () {
  var self = this;
  setTimeout(function(){
    $('html').addClass('mee-widget-active');
    // Trigger callback if set
    if(jQuery.isFunction( self.onShowCallback )) self.onShowCallback( self );
  }, 10);
  return self;
}

meeWidget.prototype.hide = function () {
  var self = this;
  // unbind enter key if used
  $(document).unbind('keyup.key13');

  $('html').bind("transitionend", function(){
    self.widget.remove();
    self.widgetCover.remove();
    //delete meeActive.meeWidget;
  }).removeClass('mee-widget-active');
  // Trigger callback if set
  if(jQuery.isFunction( self.onHideCallback )) self.onHideCallback( this );
  // Refresh preview
  meeActive.meeObject.previewUpdate();
  return self;
}

meeWidget.prototype.setTitle = function ( element ) {
  var self = this;
  if ( element instanceof jQuery ){
    element.appendTo(self.widgetTitle);
  }
  else if (typeof element === 'string'){
    self.widgetTitle.append( element );
  }
  return self;
}

meeWidget.prototype.setContent = function ( element ) {
  var self = this;
  if ( element instanceof jQuery ){
    element.appendTo(self.widgetContent);
  }
  else if (typeof element === 'string'){
    self.widgetContent.append( element );
  }
  return self;
}

meeWidget.prototype.setFooter = function ( element ) {
  var self = this;
  if ( element instanceof jQuery ){
    element.appendTo(self.widgetFooter);
  }
  else if (typeof element === 'string'){
    self.widgetFooter.append( element );
  }
  return self;
}

meeWidget.prototype.addClose = function ( label, callback ){
  var self = this;
  label = label ? label : 'Close';
  self.$close = $('<a href="#" class="btn btn-link">' + label + '</a>').appendTo(self.widgetFooter).click(function( e ){
    e.preventDefault();
    if(jQuery.isFunction(callback)) callback( self );
    self.hide();
  });
  return self;
}

meeWidget.prototype.onShowCallback = function(){}

meeWidget.prototype.onHideCallback = function(){}


/******************************************************************************
 * GLOBAL Token Replacements
 */

var meeReplace = {};
meeReplace.before = {};
meeReplace.after = {};
meeReplace.finish = {};
$.fn.meeReplace = meeReplace;


/******************************************************************************
 * GLOBAL Commands
 */

var meeCommands = {};
$.fn.meeCommands = meeCommands;

meeCommands.notFound = function ( command ) {
  if (window.console && window.console.log) {
    console.log('Command "' + command + '" not found.');
  }
}

meeCommands.bold = function () {
  meeCommands.boldOrItalic( 2, 'strong text' );
}

meeCommands.italic = function () {
  meeCommands.boldOrItalic( 1, 'emphasized text' );
}

meeCommands.link = function () {
  meeCommands.linkOrImage( false );
}

meeCommands.image = function () {
  meeCommands.linkOrImage( true );
}

meeCommands.ul = function () {
  meeCommands.list( false );
}

meeCommands.ol = function () {
  meeCommands.list( true );
}

meeCommands.rule = function () {
  var ss = meeActive.meeSelection;
  ss.startTag = "----------\n";
  ss.text = "";
  ss.skipLines(2, 1, true);
  ss.selectionSet();
}

meeCommands.linkOrImage = function ( isImage ) {
  var ss = meeActive.meeSelection;
  var buttonSettings = meeActive.meeButtonSettings;
  var meeObject = meeActive.meeObject;

  ss.trimWhitespace();
  ss.findTags(/\s*!?\[/, /\][ ]?(?:\n[ ]*)?(\[.*?\])?/);
  var background;
  if (ss.endTag.length > 1 && ss.startTag.length > 0) {
    ss.startTag = ss.startTag.replace(/!?\[/, "");
    ss.endTag = "";
    this.addLinkDef( null );
    ss.selectionSet();
  } else {
    // We're moving start and end tag back into the selection, since (as we're in the else block) we're not
    // *removing* a link, but *adding* one, so whatever findTags() found is now back to being part of the
    // link text. linkEnteredCallback takes care of escaping any brackets.
    ss.text = ss.startTag + ss.text + ss.endTag;
    ss.startTag = ss.endTag = "";
    if (/\n\n/.test(ss.text)) {
      this.addLinkDef( null);
      return;
    }
    var that = this;
    // The function to be executed when you enter a link and press OK or Cancel.
    // Marks up the link and adds the ref.
    var linkEnteredCallback = function (link) {
      if (link !== null) {
        ss.text = (" " + ss.text).replace(/([^\\](?:\\\\)*)(?=[[\]])/g, "$1\\").substr(1);
        var linkDef = " [999]: " + that.properlyEncoded(link);
        var num = that.addLinkDef( linkDef );
        ss.startTag = isImage ? "![" : "[";
        ss.endTag = "][" + num + "]";
        if (!ss.text) {
          if (isImage) {
            ss.text = "enter image description here";
          } else {
            ss.text = "enter link description here";
          }
        }
      }
      ss.selectionSet();
    };

    var title = '';
    if (isImage) {
      title = 'Insert Image';
      info = settingsGlobal.imageDialogText;
      value = settingsGlobal.imageDefaultText;
    }else{
      title = 'Insert Link';
      info = settingsGlobal.linkDialogText;
      value = settingsGlobal.linkDefaultText;
    }

    var widget = meeActive.meeWidget = new meeWidget()
      .setTitle( buttonSettings.label + ' ' )
      .setTitle( title )
      .setContent( info );

    widget.input = $('<input class="" type="text" placeholder="' + value + '">');
    widget.setContent( widget.input );


    $(document).bind('keyup.key13', function(e){
      if (e.keyCode == 13){
        e.preventDefault();
        widget.submit.click();
        widget.hide();
        $(document).unbind('keyup.key13');
      }
    });

    widget.onShowCallback = function( widget ){
      widget.input.focus();
    }

    widget.submit = $('<a href="#" class="btn btn-primary">OK</a>').click(function( e ){
      e.preventDefault();
      var text = widget.input.val();
      if(text){
        text = text.replace(/^http:\/\/(https?|ftp):\/\//, '$1://');
        if (!/^(?:https?|ftp):\/\//.test(text)) text = 'http://' + text;
        linkEnteredCallback(text);
        widget.hide();
      }
    });
    widget.setFooter( widget.submit );

    widget.addClose();

    widget.show();
  }
};

meeCommands.properlyEncoded = function (linkdef) {
  return linkdef.replace(/^\s*(.*?)(?:\s+"(.+)")?\s*$/, function (wholematch, link, title) {
    link = link.replace(/\?.*$/, function (querypart) {
      return querypart.replace(/\+/g, " "); // in the query string, a plus and a space are identical
    });
    link = decodeURIComponent(link); // unencode first, to prevent double encoding
    link = encodeURI(link).replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29');
    link = link.replace(/\?.*$/, function (querypart) {
      return querypart.replace(/\+/g, "%2b"); // since we replaced plus with spaces in the query part, all pluses that now appear where originally encoded
    });
    if (title) {
      title = title.trim ? title.trim() : title.replace(/^\s*/, "").replace(/\s*$/, "");
      title = $.trim(title).replace(/"/g, "quot;").replace(/\(/g, "&#40;").replace(/\)/g, "&#41;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    return title ? link + ' "' + title + '"' : link;
  });
}

meeCommands.addLinkDef = function ( linkDef ) {
  var ss = meeActive.meeSelection;
  var refNumber = 0; // The current reference number
  var defsToAdd = {}; //
  // Start with a clean slate by removing all previous link definitions.
  ss.before = this.stripLinkDefs(ss.before, defsToAdd);
  ss.text = this.stripLinkDefs(ss.text, defsToAdd);
  ss.after = this.stripLinkDefs(ss.after, defsToAdd);
  var defs = "";
  var regex = /(\[)((?:\[[^\]]*\]|[^\[\]])*)(\][ ]?(?:\n[ ]*)?\[)(\d+)(\])/g;
  var addDefNumber = function (def) {
    refNumber++;
    def = def.replace(/^[ ]{0,3}\[(\d+)\]:/, "  [" + refNumber + "]:");
    defs += "\n" + def;
  };
  // note that
  // a) the recursive call to getLink cannot go infinite, because by definition
  //    of regex, inner is always a proper substring of wholeMatch, and
  // b) more than one level of nesting is neither supported by the regex
  //    nor making a lot of sense (the only use case for nesting is a linked image)
  var getLink = function (wholeMatch, before, inner, afterInner, id, end) {
    inner = inner.replace(regex, getLink);
    if (defsToAdd[id]) {
      addDefNumber(defsToAdd[id]);
      return before + inner + afterInner + refNumber + end;
    }
    return wholeMatch;
  };
  ss.before = ss.before.replace(regex, getLink);
  if (linkDef) {
    addDefNumber(linkDef);
  } else {
    ss.text = ss.text.replace(regex, getLink);
  }
  var refOut = refNumber;
  ss.after = ss.after.replace(regex, getLink);
  if (ss.after) {
    ss.after = ss.after.replace(/\n*$/, "");
  }
  if (!ss.after) {
    ss.text = ss.text.replace(/\n*$/, "");
  }
  ss.after += "\n\n" + defs;
  return refOut;
};

meeCommands.stripLinkDefs = function ( text, defsToAdd ) {
  text = text.replace(/^[ ]{0,3}\[(\d+)\]:[ \t]*\n?[ \t]*<?(\S+?)>?[ \t]*\n?[ \t]*(?:(\n*)["(](.+?)[")][ \t]*)?(?:\n+|$)/gm,
  function (totalMatch, id, link, newlines, title) {
    defsToAdd[id] = totalMatch.replace(/\s*$/, "");
    if (newlines) {
      // Strip the title and return that separately.
      defsToAdd[id] = totalMatch.replace(/["(](.+?)[")]$/, "");
      return newlines + title;
    }
    return "";
  });
  return text;
};

/**
 * Combined function to assign single or double *
 *
 * @author JaceRider
 *
 * @param  {object}   ss
 *   The selection object.
 * @param  {integer}  stars
 *   The number of * to use. 1 for italic, 2 for bold.
 * @param  {string}   filler
 *   The text to use if nothing is selected.
 */
meeCommands.boldOrItalic = function ( stars, filler) {
  var ss = meeActive.meeSelection;

  // Get rid of whitespace and fixup newlines.
  ss.trimWhitespace();
  ss.text = ss.text.replace(/\n{2,}/g, "\n");

  // Look for stars before and after.  Is the selection already marked up?
  // note that these regex matches cannot fail
  var starsBefore = /(\**$)/.exec(ss.before)[0];
  var starsAfter = /(^\**)/.exec(ss.after)[0];
  var prevStars = Math.min(starsBefore.length, starsAfter.length);

  // Remove stars if we have to since the button acts as a toggle.
  if ((prevStars >= stars) && (prevStars != 2 || stars != 1)) {
    ss.before = ss.before.replace(settingsGlobal.re("[*]{" + stars + "}$", ""), "");
    ss.after = ss.after.replace(settingsGlobal.re("^[*]{" + stars + "}", ""), "");
  } else if (!ss.text && starsAfter) {
    // It's not really clear why this code is necessary.  It just moves
    // some arbitrary stuff around.
    ss.after = ss.after.replace(/^([*_]*)/, "");
    ss.before = ss.before.replace(/(\s?)$/, "");
    var whitespace = settingsGlobal.re.$1;
    ss.before = ss.before + starsAfter + whitespace;
  } else {
    // In most cases, if you don't have any selected text and click the button
    // you'll get a selected, marked up region with the default text inserted.
    if (!ss.text && !starsAfter) {
      ss.text = filler;
    }
    // Add the true markup.
    var markup = stars <= 1 ? "*" : "**"; // shouldn't the test be = ?
    ss.before = ss.before + markup;
    ss.after = markup + ss.after;
  }

  ss.selectionSet();
}

meeCommands.list = function ( isNumberedList ) {
  var ss = meeActive.meeSelection;
  // These are identical except at the very beginning and end.
  // Should probably use the regex extension function to make this clearer.
  var previousItemsRegex = /(\n|^)(([ ]{0,3}([*+-]|\d+[.])[ \t]+.*)(\n.+|\n{2,}([*+-].*|\d+[.])[ \t]+.*|\n{2,}[ \t]+\S.*)*)\n*$/;
  var nextItemsRegex = /^\n*(([ ]{0,3}([*+-]|\d+[.])[ \t]+.*)(\n.+|\n{2,}([*+-].*|\d+[.])[ \t]+.*|\n{2,}[ \t]+\S.*)*)\n*/;
  // The default bullet is a dash but others are possible.
  // This has nothing to do with the particular HTML bullet,
  // it's just a markdown bullet.
  var bullet = "-";
  // The number in a numbered list.
  var num = 1;
  // Get the item prefix - e.g. " 1. " for a numbered list, " - " for a bulleted list.
  var getItemPrefix = function () {
    var prefix;
    if (isNumberedList) {
      prefix = " " + num + ". ";
      num++;
    } else {
      prefix = " " + bullet + " ";
    }
    return prefix;
  };
  // Fixes the prefixes of the other list items.
  var getPrefixedItem = function (itemText) {
    // The numbering flag is unset when called by autoindent.
    if (isNumberedList === undefined) {
      isNumberedList = /^\s*\d/.test(itemText);
    }
    // Renumber/bullet the list element.
    itemText = itemText.replace(/^[ ]{0,3}([*+-]|\d+[.])\s/gm,

    function (_) {
      return getItemPrefix();
    });
    return itemText;
  };
  ss.findTags(/(\n|^)*[ ]{0,3}([*+-]|\d+[.])\s+/, null);
  if (ss.before && !/\n$/.test(ss.before) && !/^\n/.test(ss.startTag)) {
    ss.before += ss.startTag;
    ss.startTag = "";
  }
  if (ss.startTag) {
    var hasDigits = /\d+[.]/.test(ss.startTag);
    ss.startTag = "";
    ss.text = ss.text.replace(/\n[ ]{4}/g, "\n");
    ss.unwrap();
    ss.skipLines();
    if (hasDigits) {
      // Have to renumber the bullet points if this is a numbered list.
      ss.after = ss.after.replace(nextItemsRegex, getPrefixedItem);
    }
    if (isNumberedList == hasDigits) {
      return;
    }
  }
  var nLinesUp = 1;
  ss.before = ss.before.replace(previousItemsRegex,

  function (itemText) {
    if (/^\s*([*+-])/.test(itemText)) {
      bullet = settingsGlobal.re.$1;
    }
    nLinesUp = /[^\n]\n\n[^\n]/.test(itemText) ? 1 : 0;
    return getPrefixedItem(itemText);
  });
  if (!ss.text) {
    ss.text = "List item";
  }
  var prefix = getItemPrefix();
  var nLinesDown = 1;
  ss.after = ss.after.replace(nextItemsRegex,

  function (itemText) {
    nLinesDown = /[^\n]\n\n[^\n]/.test(itemText) ? 1 : 0;
    return getPrefixedItem(itemText);
  });
  ss.trimWhitespace(true);
  ss.skipLines(nLinesUp, nLinesDown, true);
  ss.startTag = prefix;
  var spaces = prefix.replace(/./g, " ");
  ss.wrap(settingsGlobal.lineLength - spaces.length);
  ss.text = ss.text.replace(/\n/g, "\n" + spaces);

  ss.selectionSet();
};

meeCommands.blockquote = function () {
  var ss = meeActive.meeSelection;
  ss.text = ss.text.replace(/^(\n*)([^\r]+?)(\n*)$/,

  function (totalMatch, newlinesBefore, text, newlinesAfter) {
    ss.before += newlinesBefore;
    ss.after = newlinesAfter + ss.after;
    return text;
  });
  ss.before = ss.before.replace(/(>[ \t]*)$/,

  function (totalMatch, blankLine) {
    ss.text = blankLine + ss.text;
    return "";
  });
  ss.text = ss.text.replace(/^(\s|>)+$/, "");
  ss.text = ss.text || "Blockquote";
  var match = "",
    leftOver = "",
    line;
  if (ss.before) {
    var lines = ss.before.replace(/\n$/, "").split("\n");
    var inChain = false;
    for (var i = 0; i < lines.length; i++) {
      var good = false;
      line = lines[i];
      inChain = inChain && line.length > 0; // c) any non-empty line continues the chain
      if (/^>/.test(line)) { // a)
        good = true;
        if (!inChain && line.length > 1) // c) any line that starts with ">" and has at least one more character starts the chain
          inChain = true;
      } else if (/^[ \t]*$/.test(line)) { // b)
        good = true;
      } else {
        good = inChain; // c) the line is not empty and does not start with ">", so it matches if and only if we're in the chain
      }
      if (good) {
        match += line + "\n";
      } else {
        leftOver += match + line;
        match = "\n";
      }
    }
    if (!/(^|\n)>/.test(match)) { // d)
      leftOver += match;
      match = "";
    }
  }
  ss.startTag = match;
  ss.before = leftOver;
  // end of change
  if (ss.after) {
    ss.after = ss.after.replace(/^\n?/, "\n");
  }
  ss.after = ss.after.replace(/^(((\n|^)(\n[ \t]*)*>(.+\n)*.*)+(\n[ \t]*)*)/,

  function (totalMatch) {
    ss.endTag = totalMatch;
    return "";
  });
  var replaceBlanksInTags = function (useBracket) {
    var replacement = useBracket ? "> " : "";
    if (ss.startTag) {
      ss.startTag = ss.startTag.replace(/\n((>|\s)*)\n$/,

      function (totalMatch, markdown) {
        return "\n" + markdown.replace(/^[ ]{0,3}>?[ \t]*$/gm, replacement) + "\n";
      });
    }
    if (ss.endTag) {
      ss.endTag = ss.endTag.replace(/^\n((>|\s)*)\n/,

      function (totalMatch, markdown) {
        return "\n" + markdown.replace(/^[ ]{0,3}>?[ \t]*$/gm, replacement) + "\n";
      });
    }
  };
  if (/^(?![ ]{0,3}>)/m.test(ss.text)) {
    ss.wrap(settingsGlobal.lineLength - 2);
    ss.text = ss.text.replace(/^/gm, "> ");
    replaceBlanksInTags(true);
    ss.skipLines();
  } else {
    ss.text = ss.text.replace(/^[ ]{0,3}> ?/gm, "");
    ss.unwrap();
    replaceBlanksInTags(false);
    if (!/^(\n|^)[ ]{0,3}>/.test(ss.text) && ss.startTag) {
      ss.startTag = ss.startTag.replace(/\n{0,2}$/, "\n\n");
    }
    if (!/(\n|^)[ ]{0,3}>.*$/.test(ss.text) && ss.endTag) {
      ss.endTag = ss.endTag.replace(/^\n{0,2}/, "\n\n");
    }
  }
  if (!/\n/.test(ss.text)) {
    ss.text = ss.text.replace(/^(> *)/,

    function (wholeMatch, blanks) {
      ss.startTag += blanks;
      return "";
    });
  }

  ss.selectionSet();
};

meeCommands.code = function () {
  var ss = meeActive.meeSelection;
  var hasTextBefore = /\S[ ]*$/.test(ss.before);
  var hasTextAfter = /^[ ]*\S/.test(ss.after);
  // Use 'four space' markdown if the selection is on its own
  // line or is multiline.
  if ((!hasTextAfter && !hasTextBefore) || /\n/.test(ss.text)) {
    ss.before = ss.before.replace(/[ ]{4}$/,

    function (totalMatch) {
      ss.text = totalMatch + ss.text;
      return "";
    });
    var nLinesBack = 1;
    var nLinesForward = 1;
    if (/(\n|^)(\t|[ ]{4,}).*\n$/.test(ss.before)) {
      nLinesBack = 0;
    }
    if (/^\n(\t|[ ]{4,})/.test(ss.after)) {
      nLinesForward = 0;
    }
    ss.skipLines(nLinesBack, nLinesForward);
    if (!ss.text) {
      ss.startTag = "    ";
      ss.text = "enter code here";
    } else {
      if (/^[ ]{0,3}\S/m.test(ss.text)) {
        if (/\n/.test(ss.text)) ss.text = ss.text.replace(/^/gm, "    ");
        else // if it's not multiline, do not select the four added spaces; this is more consistent with the doList behavior
          ss.before += "    ";
      } else {
        ss.text = ss.text.replace(/^[ ]{4}/gm, "");
      }
    }
  } else {
    // Use backticks (`) to delimit the code block.
    ss.trimWhitespace();
    ss.findTags(/`/, /`/);
    if (!ss.startTag && !ss.endTag) {
      ss.startTag = ss.endTag = "`";
      if (!ss.text) {
        ss.text = "enter code here";
      }
    } else if (ss.endTag && !ss.startTag) {
      ss.before += ss.endTag;
      ss.endTag = "";
    } else {
      ss.startTag = ss.endTag = "";
    }
  }

  ss.selectionSet();
};


meeCommands.fullscreen = function () {
  var ss = meeActive.meeSelection;
  var buttonSettings = meeActive.meeButtonSettings;
  var meeObject = meeActive.meeObject;
  var element = document.getElementById( meeObject.mee.editorWrapperInner.closest('.mee-wrapper').attr('id') );
  if(settingsGlobal.fullscreenActive){
    methods.fullscreenCancel();
  }else{
    methods.fullscreenLaunch( element, meeObject );
  }
}


meeCommands.heading = function () {
  var ss = meeActive.meeSelection;
  // Remove leading/trailing whitespace and reduce internal spaces to single spaces.
  ss.text = ss.text.replace(/\s+/g, " ");
  ss.text = ss.text.replace(/(^\s+|\s+$)/g, "");
  // If we clicked the button with no selected text, we just
  // make a level 2 hash header around some default text.
  if (!ss.text) {
    ss.startTag = "## ";
    ss.text = "Heading";
    ss.endTag = " ##";
  }else{
    var headerLevel = 0; // The existing header level of the selected text.
    // Remove any existing hash heading markdown and save the header level.
    ss.findTags(/#+[ ]*/, /[ ]*#+/);
    if (/#+/.test(ss.startTag)) {
      headerLevel = settingsGlobal.re.lastMatch.length;
    }
    ss.startTag = ss.endTag = "";
    // Try to get the current header level by looking for - and = in the line
    // below the selection.
    ss.findTags(null, /\s?(-+|=+)/);
    if (/=+/.test(ss.endTag)) {
      headerLevel = 1;
    }
    if (/-+/.test(ss.endTag)) {
      headerLevel = 2;
    }
    // Skip to the next line so we can create the header markdown.
    ss.startTag = ss.endTag = "";
    ss.skipLines(1, 1);
    // We make a level 2 header if there is no current header.
    // If there is a header level, we substract one from the header level.
    // If it's already a level 1 header, it's removed.
    var headerLevelToCreate = headerLevel == 0 ? 2 : headerLevel - 1;
    if (headerLevelToCreate > 0) {
      // The button only creates level 1 and 2 underline headers.
      // Why not have it iterate over hash header levels?  Wouldn't that be easier and cleaner?
      var headerChar = headerLevelToCreate >= 2 ? "-" : "=";
      var len = ss.text.length;
      if (len > settingsGlobal.lineLength) {
        len = settingsGlobal.lineLength;
      }
      ss.endTag = "\n";
      while (len--) {
        ss.endTag += headerChar;
      }
    }
  }

  ss.selectionSet();
};

/**
 * When making a list, hitting shift-enter will put your cursor on the next line
 * at the current indent level.
 */
meeCommands.autoIndent = function () {
  var ss = meeActive.meeSelection;
  var fakeSelection = false;

  ss.before = ss.before.replace(/(\n|^)[ ]{0,3}([*+-]|\d+[.])[ \t]*\n$/, "\n\n");
  ss.before = ss.before.replace(/(\n|^)[ ]{0,3}>[ \t]*\n$/, "\n\n");
  ss.before = ss.before.replace(/(\n|^)[ \t]+\n$/, "\n\n");
  // There's no selection, end the cursor wasn't at the end of the line:
  // The user wants to split the current list item / code line / blockquote line
  // (for the latter it doesn't really matter) in two. Temporarily select the
  // (rest of the) line to achieve this.
  if (!ss.text && !/^[ \t]*(?:\n|$)/.test(ss.after)) {
    ss.after = ss.after.replace(/^[^\n]*/, function (wholeMatch) {
      ss.text = wholeMatch;
      ss.selectionSet();
      return;
    });
    fakeSelection = true;
  }
  if (/(\n|^)[ ]{0,3}([*+-]|\d+[.])[ \t]+.*\n$/.test(ss.before)) {
    if (meeCommands.list) {
      meeCommands.list();
    }
  }
  if (/(\n|^)[ ]{0,3}>[ \t]+.*\n$/.test(ss.before)) {
    if (meeCommands.blockquote) {
      meeCommands.blockquote();
    }
  }
  if (/(\n|^)(\t|[ ]{4,}).*\n$/.test(ss.before)) {
    if (meeCommands.code) {
      meeCommands.code();
    }
  }
  if (fakeSelection) {
    ss.after = ss.text + ss.after;
    ss.text = "";
    ss.selectionSet();
  }

};



/******************************************************************************
 * GLOBAL Selection
 */

function meeSelection(){
  this.selectionGet();
}

meeSelection.prototype.selectionGet = function () {
  // Get selection
  var ss = meeActive.meeObject.mee.editor.getSelection();
  // Merge with self
  $.extend(this, ss);
  // Current content
  this.content = meeActive.meeObject.mee.editor.val();
  // Set some additional helpful information
  this.before = this.content.slice(0, ss.start);
  this.after = this.content.slice(ss.end);
  this.startTag = "";
  this.endTag = "";

  return;
}

meeSelection.prototype.selectionSet = function () {
  meeActive.meeObject.mee.editor.focus();
  this.before = this.before + this.startTag;
  this.after = this.endTag + this.after;
  this.start = this.before.length;
  this.end = this.before.length + this.text.length;
  this.text = this.before + this.text + this.after;
  // Update editor
  meeActive.meeObject.mee.editor.focus().val(this.text).setSelection(this.start, this.end);
  // Refresh preview
  meeActive.meeObject.previewUpdate();
}

// startRegex: a regular expression to find the start tag
// endRegex: a regular expresssion to find the end tag
meeSelection.prototype.findTags = function (startRegex, endRegex) {
  var ss = this;
  var regex;
  if (startRegex) {
    regex = methods.extendRegExp(startRegex, "", "$");
    this.before = this.before.replace(regex,

    function (match) {
      ss.startTag = ss.startTag + match;
      return "";
    });
    regex = methods.extendRegExp(startRegex, "^", "");
    this.text = this.text.replace(regex,

    function (match) {
      ss.startTag = ss.startTag + match;
      return "";
    });
  }
  if (endRegex) {
    regex = methods.extendRegExp(endRegex, "", "$");
    this.text = this.text.replace(regex,

    function (match) {
      ss.endTag = match + ss.endTag;
      return "";
    });
    regex = methods.extendRegExp(endRegex, "^", "");
    this.after = this.after.replace(regex,

    function (match) {
      ss.endTag = match + ss.endTag;
      return "";
    });
  }
};

meeSelection.prototype.trimWhitespace = function (remove) {
  var beforeReplacer, afterReplacer, that = this;
  if (remove) {
    beforeReplacer = afterReplacer = "";
  } else {
    beforeReplacer = function (s) {
      that.before += s;
      return "";
    }
    afterReplacer = function (s) {
      that.after = s + that.after;
      return "";
    }
  }
  this.text = this.text.replace(/^(\s*)/, beforeReplacer).replace(/(\s*)$/, afterReplacer);
};

meeSelection.prototype.skipLines = function (nLinesBefore, nLinesAfter, findExtraNewlines) {
  if (nLinesBefore === undefined) {
    nLinesBefore = 1;
  }
  if (nLinesAfter === undefined) {
    nLinesAfter = 1;
  }
  nLinesBefore++;
  nLinesAfter++;
  var regexText;
  var replacementText;
  // chrome bug ... documented at: http://meta.stackoverflow.com/questions/63307/blockquote-glitch-in-editor-in-chrome-6-and-7/65985#65985
  if (navigator.userAgent.match(/Chrome/)) {
    "X".match(/()./);
  }
  this.text = this.text.replace(/(^\n*)/, "");
  this.startTag = this.startTag + settingsGlobal.re.$1;
  this.text = this.text.replace(/(\n*$)/, "");
  this.endTag = this.endTag + settingsGlobal.re.$1;
  this.startTag = this.startTag.replace(/(^\n*)/, "");
  this.before = this.before + settingsGlobal.re.$1;
  this.endTag = this.endTag.replace(/(\n*$)/, "");
  this.after = this.after + settingsGlobal.re.$1;
  if (this.before) {
    regexText = replacementText = "";
    while (nLinesBefore--) {
      regexText += "\\n?";
      replacementText += "\n";
    }
    if (findExtraNewlines) {
      regexText = "\\n*";
    }
    this.before = this.before.replace(new settingsGlobal.re(regexText + "$", ""), replacementText);
  }
  if (this.after) {
    regexText = replacementText = "";
    while (nLinesAfter--) {
      regexText += "\\n?";
      replacementText += "\n";
    }
    if (findExtraNewlines) {
      regexText = "\\n*";
    }
    this.after = this.after.replace(new settingsGlobal.re(regexText, ""), replacementText);
  }
};

meeSelection.prototype.unwrap = function (len) {
  var txt = new settingsGlobal.re("([^\\n])\\n(?!(\\n|" + this.prefixes + "))", "g");
  this.text = this.text.replace(txt, "$1 $2");
};

meeSelection.prototype.wrap = function (len) {
  this.unwrap();
  var regex = new settingsGlobal.re("(.{1," + len + "})( +|$\\n?)", "gm"),
    that = this;
  this.text = this.text.replace(regex, function (line, marked) {
    if (new settingsGlobal.re("^" + that.prefixes, "").test(line)) {
      return line;
    }
    return marked + "\n";
  });
  this.text = this.text.replace(/\s+$/, "");
};

/******************************************************************************
 * PLUGIN Rangyinput
 * http://code.google.com/p/rangyinputs/
 */

var UNDEF = "undefined";
var getSelection, setSelection, deleteSelectedText, deleteText, insertText;
var replaceSelectedText, surroundSelectedText, extractSelectedText, collapseSelection;

// Trio of isHost* functions taken from Peter Michaux's article:
// http://peter.michaux.ca/articles/feature-detection-state-of-the-art-browser-scripting
function isHostMethod(object, property) {
  var t = typeof object[property];
  return t === "function" || ( !! (t == "object" && object[property])) || t == "unknown";
}

function isHostProperty(object, property) {
  return typeof (object[property]) != UNDEF;
}

function isHostObject(object, property) {
  return !!(typeof (object[property]) == "object" && object[property]);
}

function fail(reason) {
  if (window.console && window.console.log) {
    window.console.log("TextInputs module for Rangy not supported in your browser. Reason: " + reason);
  }
}

function adjustOffsets(el, start, end) {
  if (start < 0) {
    start += el.value.length;
  }
  if (typeof end == UNDEF) {
    end = start;
  }
  if (end < 0) {
    end += el.value.length;
  }
  return {
    start: start,
    end: end
  };
}

function makeSelection(el, start, end) {
  return {
    start: start,
    end: end,
    length: end - start,
    text: el.value.slice(start, end)
  };
}

function getBody() {
  return isHostObject(document, "body") ? document.body : document.getElementsByTagName("body")[0];
}

$(document).ready(function () {
  var testTextArea = document.createElement("textarea");

  getBody().appendChild(testTextArea);

  if (isHostProperty(testTextArea, "selectionStart") && isHostProperty(testTextArea, "selectionEnd")) {
    getSelection = function (el) {
      var start = el.selectionStart,
        end = el.selectionEnd;
      return makeSelection(el, start, end);
    };

    setSelection = function (el, startOffset, endOffset) {
      var offsets = adjustOffsets(el, startOffset, endOffset);
      el.selectionStart = offsets.start;
      el.selectionEnd = offsets.end;
    };

    collapseSelection = function (el, toStart) {
      if (toStart) {
        el.selectionEnd = el.selectionStart;
      } else {
        el.selectionStart = el.selectionEnd;
      }
    };
  } else if (isHostMethod(testTextArea, "createTextRange") && isHostObject(document, "selection") &&
    isHostMethod(document.selection, "createRange")) {

    getSelection = function (el) {
      var start = 0,
        end = 0,
        normalizedValue, textInputRange, len, endRange;
      var range = document.selection.createRange();

      if (range && range.parentElement() == el) {
        len = el.value.length;

        normalizedValue = el.value.replace(/\r\n/g, "\n");
        textInputRange = el.createTextRange();
        textInputRange.moveToBookmark(range.getBookmark());
        endRange = el.createTextRange();
        endRange.collapse(false);
        if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
          start = end = len;
        } else {
          start = -textInputRange.moveStart("character", -len);
          start += normalizedValue.slice(0, start).split("\n").length - 1;
          if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
            end = len;
          } else {
            end = -textInputRange.moveEnd("character", -len);
            end += normalizedValue.slice(0, end).split("\n").length - 1;
          }
        }
      }

      return makeSelection(el, start, end);
    };

    // Moving across a line break only counts as moving one character in a TextRange, whereas a line break in
    // the textarea value is two characters. This function corrects for that by converting a text offset into a
    // range character offset by subtracting one character for every line break in the textarea prior to the
    // offset
    var offsetToRangeCharacterMove = function (el, offset) {
      return offset - (el.value.slice(0, offset).split("\r\n").length - 1);
    };

    setSelection = function (el, startOffset, endOffset) {
      var offsets = adjustOffsets(el, startOffset, endOffset);
      var range = el.createTextRange();
      var startCharMove = offsetToRangeCharacterMove(el, offsets.start);
      range.collapse(true);
      if (offsets.start == offsets.end) {
        range.move("character", startCharMove);
      } else {
        range.moveEnd("character", offsetToRangeCharacterMove(el, offsets.end));
        range.moveStart("character", startCharMove);
      }
      range.select();
    };

    collapseSelection = function (el, toStart) {
      var range = document.selection.createRange();
      range.collapse(toStart);
      range.select();
    };
  } else {
    getBody().removeChild(testTextArea);
    fail("No means of finding text input caret position");
    return;
  }

  // Clean up
  getBody().removeChild(testTextArea);

  deleteText = function (el, start, end, moveSelection) {
    var val;
    if (start != end) {
      val = el.value;
      el.value = val.slice(0, start) + val.slice(end);
    }
    if (moveSelection) {
      setSelection(el, start, start);
    }
  };

  deleteSelectedText = function (el) {
    var sel = getSelection(el);
    deleteText(el, sel.start, sel.end, true);
  };

  extractSelectedText = function (el) {
    var sel = getSelection(el),
      val;
    if (sel.start != sel.end) {
      val = el.value;
      el.value = val.slice(0, sel.start) + val.slice(sel.end);
    }
    setSelection(el, sel.start, sel.start);
    return sel.text;
  };

  insertText = function (el, text, index, moveSelection) {
    var val = el.value,
      caretIndex;
    el.value = val.slice(0, index) + text + val.slice(index);
    if (moveSelection) {
      caretIndex = index + text.length;
      setSelection(el, caretIndex, caretIndex);
    }
  };

  replaceSelectedText = function (el, text, highlightSelection) {
    var sel = getSelection(el),
      val = el.value;
    el.value = val.slice(0, sel.start) + text + val.slice(sel.end);
    var caretIndex = sel.start + text.length;
    if(highlightSelection){
      setSelection(el, sel.start, caretIndex);
    }else{
      setSelection(el, caretIndex, caretIndex);
    }
  };

  surroundSelectedText = function (el, before, after) {
    var sel = getSelection(el),
      val = el.value;

    el.value = val.slice(0, sel.start) + before + sel.text + after + val.slice(sel.end);
    var startIndex = sel.start + before.length;
    var endIndex = startIndex + sel.length;
    setSelection(el, startIndex, endIndex);
  };

  function jQuerify(func, returnThis) {
    return function () {
      var el = this.jquery ? this[0] : this;
      var nodeName = el.nodeName.toLowerCase();

      if (el.nodeType == 1 && (nodeName == "textarea" || (nodeName == "input" && el.type == "text"))) {
        var args = [el].concat(Array.prototype.slice.call(arguments));
        var result = func.apply(this, args);
        if (!returnThis) {
          return result;
        }
      }
      if (returnThis) {
        return this;
      }
    };
  }

  $.fn.extend({
    getSelection: jQuerify(getSelection, false),
    setSelection: jQuerify(setSelection, true),
    collapseSelection: jQuerify(collapseSelection, true),
    deleteSelectedText: jQuerify(deleteSelectedText, true),
    deleteText: jQuerify(deleteText, true),
    extractSelectedText: jQuerify(extractSelectedText, false),
    insertText: jQuerify(insertText, true),
    replaceSelectedText: jQuerify(replaceSelectedText, true),
    surroundSelectedText: jQuerify(surroundSelectedText, true)
  });
});


/******************************************************************************
 * PLUGIN Auto-growing textareas
 * https://github.com/jackmoore/autosize
 */

var defaults = {
  className: 'mee-autosize',
  append: '',
  callback: false
},
hidden = 'hidden',
  borderBox = 'border-box',
  lineHeight = 'lineHeight',
  // border:0 is unnecessary, but avoids a bug in FireFox on OSX (http://www.jacklmoore.com/autosize#comment-851)
  copy = '<textarea tabindex="-1" style="position:absolute; top:-999px; left:0; right:auto; bottom:auto; border:0; -moz-box-sizing:content-box; -webkit-box-sizing:content-box; box-sizing:content-box; word-wrap:break-word; height:0 !important; min-height:0 !important; overflow:hidden;"/>',
  // line-height is conditionally included because IE7/IE8/old Opera do not return the correct value.
  copyStyle = ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing', 'textTransform', 'wordSpacing', 'textIndent'],
  oninput = 'oninput',
  onpropertychange = 'onpropertychange',
  // to keep track which textarea is being mirrored when adjust() is called.
  mirrored,
  // the mirror element, which is used to calculate what size the mirrored element should be.
  mirror = $(copy).data('autosize', true)[0];
// test that line-height can be accurately copied.
mirror.style.lineHeight = '99px';
if ($(mirror).css(lineHeight) === '99px') {
  copyStyle.push(lineHeight);
}
mirror.style.lineHeight = '';
$.fn.autosize = function (options) {
  options = $.extend({}, defaults, options || {});
  if (mirror.parentNode !== document.body) {
    $(document.body).append(mirror);
  }
  return this.each(function () {
    var ta = this,
      $ta = $(ta),
      preview,
      previewContent,
      minHeight,
      active,
      resize,
      boxOffset = 0,
      callback = $.isFunction(options.callback);
    if ($ta.data('autosize')) {
      // exit if autosize has already been applied, or if the textarea is the mirror element.
      return;
    }
    preview = $ta.closest('.mee-editor').find('.mee-preview');
    previewContent = preview.contents().find('.mee-iframe-content').get(0);
    preview = preview.get(0);
    if ($ta.css('box-sizing') === borderBox || $ta.css('-moz-box-sizing') === borderBox || $ta.css('-webkit-box-sizing') === borderBox) {
      boxOffset = $ta.outerHeight() - $ta.height();
    }
    minHeight = Math.max(parseInt($ta.css('minHeight'), 10) - boxOffset, $ta.height());
    resize = ($ta.css('resize') === 'none' || $ta.css('resize') === 'vertical') ? 'none' : 'horizontal';
    $ta.css({
      overflow: hidden,
      overflowY: hidden,
      wordWrap: 'break-word',
      resize: resize
    }).data('autosize', true);
    function initMirror() {
      mirrored = ta;
      mirror.className = options.className;
      // mirror is a duplicate textarea located off-screen that
      // is automatically updated to contain the same text as the
      // original textarea. mirror always has a height of 0.
      // This gives a cross-browser supported way getting the actual
      // height of the text, through the scrollTop property.
      $.each(copyStyle, function (i, val) {
        mirror.style[val] = $ta.css(val);
      });
    }
    // Using mainly bare JS in this function because it is going
    // to fire very often while typing, and needs to very efficient.
    function adjust() {
      var height, overflow, original, originalPreview;
      if (mirrored !== ta) {
        initMirror();
      }
      // the active flag keeps IE from tripping all over itself. Otherwise
      // actions in the adjust function will cause IE to call adjust again.
      if (!active) {
        active = true;
        mirror.value = ta.value + options.append;
        mirror.style.overflowY = ta.style.overflowY;
        original = parseInt(ta.style.height, 10);
        originalPreview = preview.offsetHeight;
        // Update the width in case the original textarea width has changed
        // A floor of 0 is needed because IE8 returns a negative value for hidden textareas, raising an error.
        mirror.style.width = Math.max($ta.width(), 0) + 'px';
        // The following three lines can be replaced with `height = mirror.scrollHeight` when dropping IE7 support.
        mirror.scrollTop = 0;
        mirror.scrollTop = 9e4;
        height = mirror.scrollTop;

        var maxHeight = parseInt($ta.css('maxHeight'), 10);
        // Opera returns '-1px' when max-height is set to 'none'.
        maxHeight = maxHeight && maxHeight > 0 ? maxHeight : 9e4;
        if (height > maxHeight) {
          height = maxHeight;
          overflow = 'scroll';
        } else if (height < minHeight) {
          height = minHeight;
        }
        height += boxOffset;
        ta.style.overflowY = preview.style.overflowY = overflow || hidden;
        if((previewContent.offsetHeight) > height){
          height = previewContent.offsetHeight;
        }
        if (original !== height) {
          ta.style.height = height + 'px';
          if (callback) {
            options.callback.call(ta);
          }
        }
        if (originalPreview !== height) {
          preview.style.height = height + 'px';
        }
        // This small timeout gives IE a chance to draw it's scrollbar
        // before adjust can be run again (prevents an infinite loop).
        setTimeout(function () {
          active = false;
        }, 1);
      }
    }
    if (onpropertychange in ta) {
      if (oninput in ta) {
        // Detects IE9. IE9 does not fire onpropertychange or oninput for deletions,
        // so binding to onkeyup to catch most of those occassions. There is no way that I
        // know of to detect something like 'cut' in IE9.
        ta[oninput] = ta.onkeyup = adjust;
      } else {
        // IE7 / IE8
        ta[onpropertychange] = adjust;
      }
    } else {
      // Modern Browsers
      ta[oninput] = adjust;
    }
    $(window).resize(function () {
      active = false;
      adjust();
    });
    // Allow for manual triggering if needed.
    $ta.bind('autosize', function () {
      active = false;
      adjust();
    });
    // Call adjust in case the textarea already contains text.
    adjust();
  });
};


/******************************************************************************
 * PLUGIN Hotkeys
 * https://github.com/jeresig/jquery.hotkeys
 */

jQuery.hotkeys = {
  version: "0.8",

  specialKeys: {
    8: "backspace", 9: "tab", 13: "return", 16: "shift", 17: "ctrl", 18: "alt", 19: "pause",
    20: "capslock", 27: "esc", 32: "space", 33: "pageup", 34: "pagedown", 35: "end", 36: "home",
    37: "left", 38: "up", 39: "right", 40: "down", 45: "insert", 46: "del",
    96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7",
    104: "8", 105: "9", 106: "*", 107: "+", 109: "-", 110: ".", 111 : "/",
    112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6", 118: "f7", 119: "f8",
    120: "f9", 121: "f10", 122: "f11", 123: "f12", 144: "numlock", 145: "scroll", 191: "/", 224: "meta"
  },

  shiftNums: {
    "`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&",
    "8": "*", "9": "(", "0": ")", "-": "_", "=": "+", ";": ": ", "'": "\"", ",": "<",
    ".": ">",  "/": "?",  "\\": "|"
  }
};

function keyHandler( handleObj ) {
  // Only care when a possible input has been specified
  if ( typeof handleObj.data !== "string" ) {
    return;
  }

  var origHandler = handleObj.handler,
    keys = handleObj.data.toLowerCase().split(" ");

  handleObj.handler = function( event ) {
    // Don't fire in text-accepting inputs that we didn't directly bind to
    if ( this !== event.target && (/textarea|select/i.test( event.target.nodeName ) ||
       event.target.type === "text") ) {
      return;
    }

    // Keypress represents characters, not special keys
    var special = event.type !== "keypress" && jQuery.hotkeys.specialKeys[ event.which ],
      character = String.fromCharCode( event.which ).toLowerCase(),
      key, modif = "", possible = {};

    // check combinations (alt|ctrl|shift+anything)
    if ( event.altKey && special !== "alt" ) {
      modif += "alt+";
    }

    if ( event.ctrlKey && special !== "ctrl" ) {
      modif += "ctrl+";
    }

    // TODO: Need to make sure this works consistently across platforms
    if ( event.metaKey && !event.ctrlKey && special !== "meta" ) {
      modif += "meta+";
    }

    if ( event.shiftKey && special !== "shift" ) {
      modif += "shift+";
    }

    if ( special ) {
      possible[ modif + special ] = true;

    } else {
      possible[ modif + character ] = true;
      possible[ modif + jQuery.hotkeys.shiftNums[ character ] ] = true;

      // "$" can be triggered as "Shift+4" or "Shift+$" or just "$"
      if ( modif === "shift+" ) {
        possible[ jQuery.hotkeys.shiftNums[ character ] ] = true;
      }
    }

    for ( var i = 0, l = keys.length; i < l; i++ ) {
      if ( possible[ keys[i] ] ) {
        return origHandler.apply( this, arguments );
      }
    }
  };
}

jQuery.each([ "keydown", "keyup", "keypress" ], function() {
  jQuery.event.special[ this ] = { add: keyHandler };
});

})( jQuery );
