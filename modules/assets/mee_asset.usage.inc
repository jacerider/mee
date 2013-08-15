<?php

/**
 * Implements hook_mee_editor_element_alter.
 *
 * @author JaceRider
 */
function mee_asset_mee_editor_element_alter(&$element){
  $element['#element_validate'][] = 'mee_asset_usage_validate';
}

/**
 * Process new input and send on for usage check.
 *
 * @author JaceRider
 */
function mee_asset_usage_validate($element, &$form_state, $form){
  $value = $element['#value'];
  $entity_id = 0;
  $entity_type = '';
  if(!empty($form['#entity'])){
    $entity_type = $form['#entity_type'];
    $keys = entity_extract_ids($entity_type, $form['#entity']);
    $entity_id = $keys[0];
    mee_asset_usage_check($value, $entity_type, $entity_id);
    // Clean up orphan assets
    // @TODO Maybe this would be better done via cron
    mee_asset_instance_clean();
  }
}

/**
 * Will check asset usage and add/remove/keep as needed.
 *
 * @author JaceRider
 */
function mee_asset_usage_check($text, $entity_type, $entity_id){
  $currents = mee_asset_matches( $text );
  $pasts = array();
  foreach(mee_asset_usage_load_by_entity($entity_type, $entity_id) as $past){
    $key = $past->asset_id;
    if(!empty($past->instance_id)) $key .= '-' . $past->instance_id;
    $pasts[$key] = $past;
  }
  $remove = array();
  $add = array();
  $keep = array();
  // Get removed assets
  foreach($pasts as $past){
    $key = $past->asset_id;
    if(!empty($past->instance_id)) $key .= '-' . $past->instance_id;
    if(!isset($currents[$key])){
      // $remove[] = $past;
      mee_asset_usage_delete($past->id);
    }
  }
  // Get new assets
  foreach($currents as $current){
    // If empty, this is a deleted asset
    if(empty($current)){
      continue;
    }
    $key = $current->id;
    $instance_id = !empty($current->instance_id) ? $current->instance_id : NULL;
    if($instance_id) $key .= '-' . $instance_id;
    if(!isset($pasts[$key])){
      // $add[] = $current;
      mee_asset_usage_save($current->id, $entity_type, $entity_id, $instance_id);
    }else{
      // $keep[] = $current;
    }
  }
  // dsm($currents);
  // dsm($pasts);
  // dsm('Remove:');
  // dsm($remove);
  // dsm('Add:');
  // dsm($add);
  // dsm('Keep:');
  // dsm($keep);

}

function mee_asset_usage_list($asset_id){
  if($assets = mee_asset_usage_load_by_asset_id( $asset_id )){
    // Remove references to same content item
    $existing = array();
    foreach($assets as $key => $asset){
      if(!empty($existing[$asset->entity_id])) unset($assets[$key]);
      $existing[$asset->entity_id] = $asset->entity_id;
    }
    $output = t('This asset is also used in the following content items:');
    $count = 0;
    $display = 0;
    foreach($assets as $asset){
      if($count < 5){
        $entity = entity_load($asset->entity_type, array($asset->entity_id));
        $entity = $entity[key($entity)];
        $info = entity_get_info($asset->entity_type);
        $uri_callback = $info['uri callback'];
        $access_callback = $info['access callback'];
        $path = $uri_callback($entity);
        if($path && $access_callback('view', $entity)){
          $output .= ' '.l($entity->title, $path['path'], array('attributes'=>array('target'=>'_blank')));
        }else{
          $output .= ' '.$entity->title;
        }
        $display++;
      }
      $count++;
      if($count < 5 && $count + 1 == count($assets)){
        $output .= ' &';
      }
      else if($count < 5 && $count != count($assets)){
        $output .= ',';
      }
      if($count == count($assets)){
        if($display < count($assets)){
          $output .= ' and ' . ( count($assets) - $display ) . ' other places';
        }
        $output .= '. <strong>' . t('Deleting this asset will also remove it from all other content items.') . '</strong>' . t('This action cannot be undone.');
      }
    }
    return $output;
  }
}

/**
 * Usage save
 */
function mee_asset_usage_save($asset_id, $entity_type, $entity_id, $instance_id = NULL){
  $record = array(
    'asset_id' => $asset_id,
    'entity_type' => $entity_type,
    'entity_id' => $entity_id,
    'instance_id' => $instance_id,
  );
  drupal_write_record('mee_asset_usage', $record);
}

/**
 * Usage delete
 */
function mee_asset_usage_delete($id){
    db_delete('mee_asset_usage')
      ->condition('id', $id)
      ->execute();
}

/**
 * Loads usage records by asset_id.
 */
function mee_asset_usage_load_by_asset_id($asset_id) {
  return db_select('mee_asset_usage', 'u')
    ->fields('u')
    ->condition('asset_id', $asset_id)
    ->execute()
    ->fetchAll();
}

/**
 * Loads usage records by asset_id.
 */
function mee_asset_usage_load_by_entity($entity_type, $entity_id, $limit = FALSE) {
  $query = db_select('mee_asset_usage', 'u')
    ->fields('u')
    ->condition('entity_type', $entity_type)
    ->condition('entity_id', $entity_id);

  if($limit){
    $query->range(0,1);
  }

  return $query->execute()
    ->fetchAll();
}

/**
 * Does an exact usage match already exist.
 */
function mee_asset_usage_exists($asset_id, $entity_type, $entity_id, $instance_id = NULL){
  $query = db_select('mee_asset_usage', 'u')
    ->fields('u')
    ->condition('asset_id', $asset_id)
    ->condition('entity_type', $entity_type)
    ->condition('entity_id', $entity_id);

  if($instance_id){
    $query->condition('instance_id', $instance_id);
  }else{
    $query->isNull('instance_id');
  }

  $results = $query->execute()->fetchAll();
  dsm($results);

  return !empty($results) ? $results[key($results)]->id : false;
}
