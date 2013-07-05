<?php

/**
 * Loads instance record by instance_id.
 */
function mee_asset_instance_load($instance_id) {
  $result = db_select('mee_asset_instance', 'i')
    ->fields('i')
    ->condition('id', $instance_id)
    ->execute()
    ->fetchObject();
  if(!empty($result->data)){
    $result->data = unserialize($result->data);
  }
  return $result;
}

/**
 * Usage save
 */
function mee_asset_instance_save($data){
  $record = array(
    'data' => $data,
  );
  if(drupal_write_record('mee_asset_instance', $record)){
    watchdog('mee_asset', t('Asset instance created: @record', array('@record'=>implode(', ', $record))));
    return $record['id'];
  }
  return FALSE;
}

/**
 * Clean out orphaned instance records.
 */
function mee_asset_instance_clean(){
  $count = '(SELECT DISTINCT u.instance_id FROM mee_asset_usage u WHERE u.instance_id IS NOT NULL)';
  $result = db_select('mee_asset_instance', 'i')
    ->fields('i', array('id'))
    ->where('i.id NOT IN(SELECT DISTINCT u.instance_id FROM mee_asset_usage u WHERE u.instance_id IS NOT NULL)')
    ->execute()
    ->fetchAll();
  // We have some orphans. Let's delete them.
  if(!empty($result)){
    $remove = array();
    foreach($result as $r){
      $remove[] = $r->id;
    }
    $num_deleted = db_delete('mee_asset_instance')
      ->condition('id', $remove)
      ->execute();
    watchdog('mee_asset', t('Deleted the following unused instances: @ids', array('@ids'=>implode(', ', $remove))));
  }
}
