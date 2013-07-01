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
    var type = $this.attr('data-type');
    // This text will be automatically selected
    var ss = $.fn.meeActive.meeSelection;
    var widget = $.fn.meeActive.meeWidget;
    ss.before = ss.before + '[asset-' + type + '-' + id + ']';
    // Text that will be displayed after the selected text
    ss.selectionSet();
    widget.hide();
    //delete ss;
    //delete widget;
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
  var regex = new RegExp("(\\[asset-[a-z]+-[0-9]+\\])","g");
  var match;
  text = text.replace(regex, function(match, text){
    regex = new RegExp("\\[asset-([a-z]+)-([0-9]+)\\]",["i"]);
    var parts = match.match(regex);
    var type = parts[1];
    var id = parts[2];
    return text.replace(regex, '<div class="asset-loader asset-' + type + '-' + id + '" data-type="' + type + '" data-id="' + id + '"><div class="asset-loading"><div><i class="icon-mee-spinner animate-spin"></i> This will be replace by asset type ' + type + ' with id ' + id + '</div></div></div>');
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
    var type = $this.attr('data-type');
    var base = type + '-' + id;

    // Setup AJAX request
    var element_settings = {
        url         : '/asset/view/' + type + '/' + id + '/ajax'
      , event       : 'onload'
      , keypress    : false
      , prevent     : false
      , meeObject   : meeObject
      , asset_id    : id
      , asset_type  : type
      , progress    : { 'type' : 'none' }
    };

    // Use cache if asset has already been loaded
    if(Drupal.behaviors.mee_asset.cache[base]){
      var response = {
          method    : 'html'
        , selector  : '.asset-' + type + '-' + id
        , data      : Drupal.behaviors.mee_asset.cache[base]
      };
      Drupal.ajax.prototype.commands.assetInsert(element_settings, response, 1);
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
 *  Drupal AJAX command for inserting into iframe
 */
Drupal.ajax.prototype.commands.assetInsert = function (ajax, response, status) {
  var wrapper = response.selector ? $(response.selector, ajax.meeObject.mee.preview) : $(ajax.wrapper);
  var method = response.method || ajax.method;
  var base = ajax.asset_type + '-' + ajax.asset_id;

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
  var base = response.type + '-' + response.id;
  delete Drupal.behaviors.mee_asset.processed[base];
  delete Drupal.behaviors.mee_asset.cache[base];
}

})(jQuery);
