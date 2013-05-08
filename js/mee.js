(function($) {

Drupal.behaviors.mee = {
  attach: function (context, settings) {

    // We can't find any MEEs! OH NO!
    if(!settings.mee) return;

    var self = this;
    for (i in settings.mee){
      var meeSettings = settings.mee[i];
      $(meeSettings.selector).once('mee').each(function(){
        self.editorInit(this, meeSettings);
      });
    }
  },

  editorInit: function (selector, settings) {
    $(selector).mee(settings);
  }
}

})(jQuery);
