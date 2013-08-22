(function($) {

Drupal.behaviors.mee_inline_entity_form = {
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
      var $wrapper = $this.closest('.fieldset-wrapper');
      var parents = $('.parents',$wrapper).val();
      $('input[name="'+parents+'][entity_id]"]',$wrapper).val('Asset ('+id+')');
      $('input.ief-entity-submit',$wrapper).trigger('mousedown');
    }else{
      Drupal.behaviors.mee_asset.assetInsert(id);
    }
  }
}

})(jQuery);
