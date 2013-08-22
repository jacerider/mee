<?php

/**
 * Theme in individual instance of an asset
 */
function theme_mee_asset_instance($element){
  $element['#type'] = 'container';
  $element['#attributes'] = array();
  $asset = $element['asset']['#entity'];
  //$element['#attributes']['class'][] = 'asset-instance-' . $asset->asset_id;
  if(!empty($asset->asset_instance)){
    $bundle = mee_asset_type_load($asset->type);
    if($active = array_filter($bundle->data['instances'])){
      foreach($active as $instance_type => $settings){
        $handler = _mee_get_handler('instance', $instance_type);
        $asset->asset_instance->data['instance'] = $settings;
        $handler->instance_render($element, $asset->asset_instance->data);
      }
    }
  }
  return $element;
}
