<?php

function mee_asset_mee_editor_element_alter(&$element){
  $element['#element_validate'][] = 'mee_asset_usage_validate';
}

function mee_asset_usage_validate($element, &$form_state, $form){
  $value = $element['#value'];
  $assets = mee_asset_matches($value);
  dsm($assets);
}

function mee_asset_usage_check(){

}

/**
 * Usage save
 */
function mee_asset_usage_save($asset_id, $entity_id, $bundle){
  $record = array(
    'mee_asset_id' => $asset_id,
    'entity_id' => $entity_id,
    'bundle' => $bundle,
  );
  drupal_write_record ('mee_asset_usage', $record);
}
