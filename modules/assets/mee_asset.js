(function($) {


Drupal.behaviors.mee_asset = {

  cache: {},
  processed: {},

  attach: function (context, settings) {
    var self = this;
    $('.asset-select').once(function(){
      $(this).click( self.assetSelect ).closest('td').wrapInner('<div class="asset" />');
    });

  },

  assetSelect: function ( e ) {
    var self = this;
    e.preventDefault();
    var $this = $(this);
    var id = $this.attr('data-id');
    var instance = $this.attr('data-instance');
    if( instance == 1 ){

      //var placeholder = $('<div id="asset-instance"><div class="mee-loader"><div><i class="icon-mee-spinner animate-spin"></i> Loading asset options...</div></div></div>');
      //$('#asset-browser').html( placeholder );

      // Setup AJAX request
      var element_settings = {
          url           : '/asset/instance/' + id + '/ajax'
        , event       : 'onload'
        , keypress    : false
        , prevent     : false
        , progress    : { 'type' : 'throbber' }
      };

      var base = $this.attr('id');
      Drupal.ajax[base] = new Drupal.ajax(base, $this, element_settings);

      // Trigger AJAX request
      $this.trigger('onload');

    }else{
      Drupal.behaviors.mee_asset.assetInsert(id);
    }
  },

  assetInsert: function (id, instance){
    var self = this;
    var token = '[asset-' + id;
    if(instance) token += '-' + instance;
    token += ']';
    // This text will be automatically selected
    var ss = $.fn.meeActive.meeSelection;
    var widget = $.fn.meeActive.meeWidget;
    ss.before = ss.before + token;
    // Text that will be displayed after the selected text
    ss.selectionSet();
    widget.hide();
  }
}

/******************************************************************************
 *  Asset Button Command
 */
$.fn.meeCommands.asset = function () {

  var mee = $.fn.meeActive;
  var placeholder = $('<div id="asset-browser"><div class="mee-loader"><div><i class="icon-mee-spinner animate-spin"></i> Loading ' + mee.meeButtonSettings.data.label.toLowerCase() + ' browser...</div></div></div>');

  mee.meeWidget = new $.fn.meeWidget()
    .setTitle( mee.meeButtonSettings.label + ' ' )
    .setTitle( mee.meeButtonSettings.data.label )
    .setContent( placeholder );

  mee.meeWidget.submit = $('<a id="asset-create" href="#" class="btn btn-primary">Create New ' + mee.meeButtonSettings.data.label + '</a>');
  // Setup AJAX request
  var element_settings = {
      url           : '/admin/content/asset/add/' + mee.meeButtonSettings.data.type + '/ajax'
    , event       : 'click'
    //, keypress    : false
    , prevent     : false
    , progress    : { 'type' : 'none' }
  };
  var base = mee.meeWidget.submit.attr('id');
  Drupal.ajax[base] = new Drupal.ajax(base, mee.meeWidget.submit, element_settings);

  mee.meeWidget
    .setFooter( mee.meeWidget.submit )
    .addClose()
    .show();

  // Setup AJAX request
  var element_settings = {
      url           : '/asset/browser/' + mee.meeButtonSettings.data.type + '/ajax'
    , event       : 'onload'
    , keypress    : false
    , prevent     : false
    , progress    : { 'type' : 'none' }
  };

  var base = placeholder.attr('id');
  Drupal.ajax[base] = new Drupal.ajax(base, placeholder, element_settings);

  // Trigger AJAX request
  placeholder.trigger('onload');
}

/******************************************************************************
 * Token Replacment -- Runs AFTER conversion to markup
 */
$.fn.meeReplace.after.asset = function ( text ) {
  var regex = new RegExp("(\\[asset-[0-9]+(-[0-9]+)?\\])","g");
  var match;
  text = text.replace(regex, function(match, text){
    regex = new RegExp("\\[asset-([0-9]+)-?([0-9]+)?\\]",["i"]);
    var parts = match.match(regex);
    var id = parts[1];
    var instance = parts[2] ? parts[2] : 0;
    var base = id + '-' + instance;
    return text.replace(regex, '<div class="asset-loader asset-' + base + '" ' + (!instance ? '' : 'data-instance="' + instance + '"')  + ' data-id="' + id + '"><div class="asset-loading"><div><i class="icon-mee-spinner animate-spin"></i> This will be replace by asset with id ' + id + '</div></div></div>');
  });
  return text;
}


/******************************************************************************
 * Called AFTER preview has been updated
 */
$.fn.meeReplace.finish.asset = function ( meeObject ) {
  $('.asset-loader', meeObject.mee.preview).once(function(){
    var $this = $(this);
    var id = $this.attr('data-id');
    var instance = $this.attr('data-instance');
    instance = instance ? instance : 0;
    var base = id + '-' + instance;

    // Setup AJAX request
    var element_settings = {
        url         : '/asset/view/' + id + '/' + instance + '/ajax'
      , event       : 'onload'
      , keypress    : false
      , prevent     : false
      , meeObject   : meeObject
      , asset_id    : id
      , progress    : { 'type' : 'none' }
    };

    // Use cache if asset has already been loaded
    if(Drupal.behaviors.mee_asset.cache[base]){
      var response = {
          method      : 'html'
        , asset_id    : id
        , instance_id : instance
        , data        : Drupal.behaviors.mee_asset.cache[base]
      };
      Drupal.ajax.prototype.commands.assetPreviewInsert(element_settings, response, 1);
    }
    else {
      if(Drupal.behaviors.mee_asset.processed[base]){
        $.fn.meeReplace.finish.asset( meeObject );
      }
      else{
        Drupal.behaviors.mee_asset.processed[base] = true;
        Drupal.ajax[base] = new Drupal.ajax(base, $this, element_settings);
        // Trigger AJAX request
        $this.trigger('onload');
      }
    }
  });
}

/******************************************************************************
 *  Drupal AJAX command for inserting into editor
 */
Drupal.ajax.prototype.commands.assetInsert = function (ajax, response, status) {
  Drupal.behaviors.mee_asset.assetInsert(response.asset_id, response.instance_id);
}

/******************************************************************************
 *  Drupal AJAX command for inserting into iframe
 */
Drupal.ajax.prototype.commands.assetPreviewInsert = function (ajax, response, status) {
  var base = response.asset_id + '-' + response.instance_id;
  var wrapper = $('.asset-' + base, ajax.meeObject.mee.preview);
  var method = response.method || ajax.method;

  var new_content_wrapped = $('<div></div>').html(response.data);
  var new_content = new_content_wrapped.contents();
  Drupal.behaviors.mee_asset.cache[base] = new_content;

  var settings = response.settings || ajax.settings || Drupal.settings;
  Drupal.detachBehaviors(wrapper, settings);

  wrapper[method](new_content);

  // Attach all JavaScript behaviors to the new content, if it was successfully
  // added to the page, this if statement allows #ajax['wrapper'] to be
  // optional.
  //if (new_content.parents('html').length > 0) {
    // Apply any settings from the returned JSON if available.
    var settings = response.settings || ajax.settings || Drupal.settings;
    Drupal.attachBehaviors(new_content, settings);
    ajax.meeObject.previewUpdate();
  //}
}

/******************************************************************************
 *  Drupal AJAX command for inserting into iframe
 */
Drupal.ajax.prototype.commands.assetCacheClear = function (ajax, response, status) {
  var base = response.asset_id;
  for(i in Drupal.behaviors.mee_asset.cache){
    var parts = i.split('-');
    if(base == parts[0]){
      delete Drupal.behaviors.mee_asset.processed[i];
      delete Drupal.behaviors.mee_asset.cache[i];
    }
  }
}

})(jQuery);
