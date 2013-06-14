(function($) {

Drupal.behaviors.mee_admin = {
  attach: function (context, settings) {

    var self = this;
    $('#mee-toolbar-editor').once(function(){
      $( ".btn-group", this ).sortable({
        connectWith: ".mee-sortable",
        placeholder: "mee-placeholder",
        update: self.update
      }).disableSelection();
    });

  },

  update: function (event, ui) {
    var id = $( ui.item ).attr('id').replace('mee-','');
    var group = $( ui.item ).parent().attr('id').replace('mee-group-','');
    console.log(id);
    console.log(group);

    if(group == 'disabled'){
      Drupal.behaviors.mee_admin.disable( id );
      return;
    }
    //$( ui.item ).hide();
    //console.log(ui);
    $('input[name="instance[settings][mee][settings][toolbar][buttons][' + id + '][status]"]').val(1);
    $('input[name="instance[settings][mee][settings][toolbar][buttons][' + id + '][group]"]').val(group);
    Drupal.behaviors.mee_admin.weight( group );
    //instance[settings][mee][settings][toolbar][buttons][blockquote][group]
  },

  weight: function ( group ) {
    $('li', '#mee-group-' + group).each(function( i ){
      var id = $( this ).attr('id').replace('mee-','');
      var weight = (i - 10);
      $('input[name="instance[settings][mee][settings][toolbar][buttons][' + id + '][weight]"]').val( weight );
    });
  },

  disable: function ( id ) {
    $('input[name="instance[settings][mee][settings][toolbar][buttons][' + id + '][status]"]').val(0);
  }
}

})(jQuery);
