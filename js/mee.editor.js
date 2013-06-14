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

methods.toolbarButtonClick = function ( e, buttonSettings, meeObject ) {
  e.preventDefault();
  mee.editor.focus();

  if($.isFunction(meeCommands[buttonSettings.command])){
    var ss = new meeSelection();
    // Send to command
    meeCommands[buttonSettings.command]( ss, meeObject );
    // Update after command runs
    methods.previewUpdate();
  }else{
    meeCommands.notFound( buttonSettings.id );
  }
}

/******************************************************************************
 * GLOBAL Settings
 */

var settingsGlobal = {
  editorCount           : 0
};

/******************************************************************************
 * INSTANCE Methods/Functions
 */
var meeObject = function ( selector, options ) {
  var self = this;
  self.mee = {
      selector            : selector
    , built               : false
    , wrapper             : {}
    , editorWrapper       : {}
    , editorWrapperInner  : {}
    , editor              : {}
    , toolbar             : {}
    , toolbarGroups       : {}
    , preview             : {}
    , previewIframe       : {}
    , fullscreenActive    : false
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
      self.mee.built = true;
      self.mee.editor = $(this);
      self.editorBuild();
    }
  });
}

meeObject.prototype.editorBuild = function () {
  var self = this;
  settingsGlobal.editorCount++;

  // Setup editor
  self.mee.editor.bind('keyup', self.editorChange).wrap('<div id="mee-wrapper-' + settingsGlobal.editorCount + '" class="mee-wrapper mee-view-' + self.settings.view + ' clearfix"><div class="mee-wrapper-inner"><div class="mee-border well well-small"><div class="mee-inner"><div class="mee-editor"><div class="mee-editor-inner"><div class="mee-textarea-wrapper"></div></div></div></div></div></div></div>');;
  // Store some DOM objects we will use later
  self.mee.wrapper = self.mee.editor.closest('.mee-inner');
  self.mee.editorWrapper = self.mee.editor.closest('.mee-editor');
  self.mee.editorWrapperInner = self.mee.editor.closest('.mee-editor-inner');

  // Build toolbar
  self.toolbarBuild();
}

meeObject.prototype.editorChange = function () {

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
      'label'     : null, // The button text
      'tip'       : null, // The information set in the tooltip
      'key'       : null, // The shortcut key combo
      'group'     : null, // The button group
      'command'   : i,  // By default, the command is the id
      'id'        : i     // The button unique key
    }, self.settings.buttons[i]);

    // If no group set or does not exist, reset to 0
    var group = settings.group ? ( self.mee.toolbarGroups[settings.group] ? settings.group : 0 ) : 0;
    var button = $('<button class="btn btn-mini btn-inverse" title="' + settings.tip + '" id="mee-' + i + '">' + settings.label + '</button>')
      .data('mee',settings)
      .appendTo(self.mee.toolbarGroups[group]);

    // Set tooltips
    if(jQuery.isFunction( button.tooltip ) && settings.tip){
      button.tooltip({placement:'top',delay:500,container:'body'});
    }

    // Set up keybindings if desired
    if(settings.key){
      self.mee.editor.bind('keydown', settings.key, function( e ){
        methods.toolbarButtonClick( e, settings, self );
      });
    }

    button.bind('click', function( e ){
      methods.toolbarButtonClick( e, settings, self );
    });
  }
}

})( jQuery );
