<?php

$plugin = array();
$entity = entity_get_info('mee_asset');
if(!empty($entity['bundles'])){
  $bundles = entity_load('mee_asset_type', array_keys($entity['bundles']));
  foreach($bundles as $bundle){
    $plugin['buttons']['asset_'.$bundle->type] = array(
      'title' => t('@label Asset', array('@label' => $bundle->label)),
      'icon' => $bundle->data['icon'],
      'tip' => $bundle->data['tip'],
      'shortcut' => $bundle->data['shortcut'],
      'group' => 'other',
      'script' => 'js/mee_asset.js',
      // All asset buttons will call the same js command.
      'callback' => 'asset',
      // We need to know what type was clicked to pass in additional data.
      'data' => array(
        'type'=>$bundle->type,
        'label'=>$bundle->label,
      )
    );
  }
}
