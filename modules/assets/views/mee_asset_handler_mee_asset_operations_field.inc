<?php

/**
 * This field handler aggregates operations that can be done on a mee_asset
 * under a single field providing a more flexible way to present them in a view
 */
class mee_asset_handler_mee_asset_operations_field extends views_handler_field {
  function construct() {
    parent::construct();

    $this->additional_fields['id'] = 'id';
  }

  function query() {
    $this->ensure_my_table();
    $this->add_additional_fields();
  }

  function render($values) {

    $links = menu_contextual_links('mee_asset', 'admin/content/asset', array($this->get_value($values, 'id')));

    if (!empty($links)) {
      return theme('links', array('links' => $links, 'attributes' => array('class' => array('links', 'inline', 'operations'))));
    }
  }
}
