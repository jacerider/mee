(function($) {

Drupal.behaviors.mee_admin = {
  attach: function (context, settings) {

    var self = this;
    $('#mee-toolbar-editor').once(function(){
      $( ".btn-group", this ).sortable({
        connectWith: ".mee-sortable",
        placeholder: "mee-placeholder",
        update: self.update,
        containment: '#mee-toolbar-editor',
        cursor: "move",
        tolerance: "pointer"
      }).disableSelection();
    });

  },

  update: function (event, ui) {
    var id = $( ui.item ).attr('id').replace('mee-','');
    var group = $( ui.item ).parent().attr('id').replace('mee-group-','');

    if(group == 'disabled'){
      Drupal.behaviors.mee_admin.disable( id );
      return;
    }

    $('input[name$="[toolbar][buttons][' + id + '][status]"]').val(1);
    $('input[name$="[toolbar][buttons][' + id + '][group]"]').val(group);
    Drupal.behaviors.mee_admin.weight( group );
    //instance[settings][mee][settings][toolbar][buttons][blockquote][group]
  },

  weight: function ( group ) {
    $('li', '#mee-group-' + group).each(function( i ){
      var id = $( this ).attr('id').replace('mee-','');
      var weight = (i - 10);
      $('input[name$="[toolbar][buttons][' + id + '][weight]"]').val( weight );
    });
  },

  disable: function ( id ) {
    $('input[name$="[toolbar][buttons][' + id + '][status]"]').val(0);
  }
}

})(jQuery);
