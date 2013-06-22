<?php

$plugin = array();
$entity = entity_get_info('mee_asset');
$bundles = entity_load('mee_asset_type', array_keys($entity['bundles']));
foreach($bundles as $bundle){
  $plugin['buttons']['asset_'.$bundle->type] = array(
    'title' => t('Asset'),
    'icon' => current(array_filter($bundle->data['icon'])),
    'tip' => $bundle->data['tip'],
    'shortcut' => $bundle->data['shortcut'],
    'group' => 'other',
    'script' => 'mee_asset.js',
    // All asset buttons will call the same js command.
    'callback' => 'asset',
    // We need to know what type was clicked to pass in additional data.
    'data' => array(
      'type'=>$bundle->type,
      'label'=>$bundle->label,
    )
  );
}
