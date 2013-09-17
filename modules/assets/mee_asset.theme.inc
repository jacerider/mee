<?php

/**
 * Theme in individual instance of an asset
 */
function theme_mee_asset_instance($element){
  if(!empty($element['#preview']) && !empty($element['#asset_type']->data['placeholder'])){
    $element['asset'] = array(
      '#type' => 'markup',
      '#markup' => '<div class="mee-preview-temp"><i class="icon-'.$element['#asset_type']->data['icon'].'"></i><span>'.$element['#asset_type']->label.'</span></div>',
    );
  }
  else{
    $asset = $element['asset']['#entity'];
    if(!empty($asset->asset_instance)){
      $bundle = $element['#asset_type'];
      if($active = array_filter($bundle->data['instances'])){
        foreach($active as $instance_type => $settings){
          $handler = _mee_get_handler('instance', $instance_type);
          $asset->asset_instance->data['instance'] = $settings;
          $handler->instance_render($element, $asset->asset_instance->data);
        }
      }
    }
  }
  return $element;
}
