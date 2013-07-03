<?php

/**
 * @file
 * Contains a Views field handler to take care of displaying links to entities
 * as fields.
 */

class mee_asset_handler_asset_select_field extends views_handler_field {
  function construct() {
    parent::construct();

    $this->additional_fields['id'] = 'id';
    $this->additional_fields['type'] = 'type';
  }

  function option_definition() {
    $options = parent::option_definition();

    //$options['text'] = array('default' => '', 'translatable' => TRUE);

    return $options;
  }

  function options_form(&$form, &$form_state) {
    parent::options_form($form, $form_state);

    // $form['text'] = array(
    //   '#type' => 'textfield',
    //   '#title' => t('Text to display'),
    //   '#default_value' => $this->options['text'],
    // );
  }

  function query() {
    $this->ensure_my_table();
    $this->add_additional_fields();
  }

  function render($values) {
    $output = '<a class="asset-select" href="#" data-id="'.$values->id.'">Select</a>';
    if(mee_asset_access('update', $values->mee_asset_type)){
      $output .= l('<i class="icon-mee-pencil"></i>', 'admin/content/asset/'.$values->id.'/edit/nojs', array('html'=>true, 'attributes'=>array('class'=>array('asset-edit', 'use-ajax', 'btn','btn-mini','btn-info'))));
    }
    if(mee_asset_access('delete', $values->mee_asset_type)){
      $output .= l('×', 'asset/delete/'.$values->id.'/nojs', array('attributes'=>array('class'=>array('asset-delete', 'use-ajax', 'btn','btn-mini','btn-danger'))));
    }
    return $output;
  }
}
