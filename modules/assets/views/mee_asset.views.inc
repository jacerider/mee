<?php

/**
 * @file
 * Providing extra functionality for the Model UI via views.
 */


/**
 * Implements hook_views_data()
 */
function mee_asset_views_data_alter(&$data) {

  // Browse fields
  $data['mee_asset']['asset_select'] = array(
    'field' => array(
      'title' => t('Asset Select'),
      'help' => t('A selection element for Mee asset browser.'),
      'handler' => 'mee_asset_handler_asset_select_field',
    ),
  );

  // Index Fields
  $data['mee_asset']['link_mee_asset'] = array(
    'field' => array(
      'title' => t('Link'),
      'help' => t('Provide a link to the mee asset.'),
      'handler' => 'mee_asset_handler_link_field',
    ),
  );
  $data['mee_asset']['edit_mee_asset'] = array(
    'field' => array(
      'title' => t('Edit Link'),
      'help' => t('Provide a link to the edit form for the mee asset.'),
      'handler' => 'mee_asset_handler_edit_link_field',
    ),
  );
  $data['mee_asset']['delete_mee_asset'] = array(
    'field' => array(
      'title' => t('Delete Link'),
      'help' => t('Provide a link to delete the mee asset.'),
      'handler' => 'mee_asset_handler_delete_link_field',
    ),
  );
  // This content of this field are decided based on the menu structure that
  // follows mee_assets/mee_asset/%id/op
  $data['mee_asset']['operations'] = array(
    'field' => array(
      'title' => t('Operations links'),
      'help' => t('Display all operations available for this mee asset.'),
      'handler' => 'mee_asset_handler_mee_asset_operations_field',
    ),
  );
}
