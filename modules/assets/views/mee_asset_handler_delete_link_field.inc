<?php

/**
 * @file
 * Contains a Views field handler to take care of displaying deletes links
 * as fields
 */


class mee_asset_handler_delete_link_field extends mee_asset_handler_link_field {
  function construct() {
    parent::construct();
    $this->additional_fields['type'] = 'type';
  }


  function render($values) {
    $type = $values->{$this->aliases['type']};

    //Creating a dummy mee_asset to check access against
    $dummy_mee_asset = (object) array('type' => $type);
    if (!mee_asset_access('edit', $dummy_mee_asset)) {
      return;
    }

    $text = !empty($this->options['text']) ? $this->options['text'] : t('delete');
    $id = $values->{$this->aliases['id']};

    return l($text, 'admin/content/asset/' . $id . '/delete');
  }
}
