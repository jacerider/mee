<?php

/**
 * @file
 * Contains a Views field handler to take care of displaying links to entities
 * as fields.
 */

class mee_asset_handler_asset_select_field extends views_handler_field {
  function construct() {
    parent::construct();

    $this->additional_fields['mee_asset_id'] = 'mee_asset_id';
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
    return '<a class="asset-select" href="#" data-id="'.$values->mee_asset_id.'" data-type="'.$values->mee_asset_type.'">Select</a>';
  }
}
