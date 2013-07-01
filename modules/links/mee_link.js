(function($) {


Drupal.behaviors.mee_link = {

  attach: function (context, settings) {
    var self = this;
    $('#mee-web').once(function(){
      $(this).focus();
    });

  }
}

$.fn.meeCommands.mee_link = function () {
  var mee = $.fn.meeActive;
  var placeholder = $('<div id="mee-link-browser"><div class="mee-loader"><div><i class="icon-mee-spinner animate-spin"></i> Loading ' + mee.meeButtonSettings.data.label.toLowerCase() + ' browser...</div></div></div>');
  var submit = $('<a id="link-create" href="#" class="btn btn-primary">Create ' + mee.meeButtonSettings.data.label + '</a>').click(function( e ){
    e.preventDefault();
    var $form = $('#mee-link-form');
    var $input = $('.vertical-tabs-pane:visible .form-text', $form);
    var text = $input.val();
    var title = $('#mee-link-title').val();
    if(text){
      switch($input.attr('data-type')){
        case 'email':
          text = 'mailto:' + text;
          break;
      }
      text = text.replace(/^http:\/\/(https?|ftp):\/\//, '$1://');
      if (/^(\/|mailto)/.test(text)) text = text;
      else if (!/^(?:https?|ftp):\/\//.test(text)) text = 'http://' + text;
      linkEnteredCallback(text, title);
      $.fn.meeActive.meeWidget.hide();
    }
  });

  // The function to be executed when you enter a link and press OK or Cancel.
  // Marks up the link and adds the ref.
  var linkEnteredCallback = function (link, title) {
    if (link !== null) {
      var ss = $.fn.meeActive.meeSelection;
      ss.text = (" " + ss.text).replace(/([^\\](?:\\\\)*)(?=[[\]])/g, "$1\\").substr(1);
      var linkDef = " [999]: " + $.fn.meeCommands.properlyEncoded(link);
      var num = $.fn.meeCommands.addLinkDef( linkDef );
      ss.startTag = "[";
      ss.endTag = "][" + num + "]";
      ss.text = title ? title : "enter link description here";
    }
    ss.selectionSet();
  };

  mee.meeWidget = new $.fn.meeWidget()
  .setTitle( mee.meeButtonSettings.label + ' ' )
  .setTitle( mee.meeButtonSettings.data.label )
  .setContent( placeholder )
  .setFooter( submit )
  .addClose()
  .show();


  $(document).bind('keyup.key13', function(e){
    if (e.keyCode == 13 && !$('#linkit-modal').length){
      e.preventDefault();
      $('#link-create').click();
      $.fn.meeActive.meeWidget.hide();
      $(document).unbind('keyup.key13');
    }
  });

  // Setup AJAX request
  var element_settings = {
      url           : '/admin/mee/link/ajax'
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

})(jQuery);
