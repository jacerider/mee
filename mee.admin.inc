<?php

/**
 * Menu callback for settings form.
 */
function mee_settings($form, $form_state) {

  module_load_include('inc', 'mee', 'mee.field.inc');
  $temp_form = $temp_state = array();
  $temp_form['#instance']['settings']['mee']['settings'] = variable_get('mee_defaults');
  mee_form_field_form($temp_form, $temp_state);
  $form['mee_defaults'] = $temp_form['instance']['settings']['mee']['settings'];
  unset($form['mee_defaults']['mee_load'], $form['mee_defaults']['default']);
  $form['mee_defaults']['#title'] = 'Editor default settings';
  $form['mee_defaults']['#tree'] = TRUE;
  $form['#submit'][] = 'mee_settings_submit';

  return system_settings_form($form);
}

function mee_settings_submit($form, &$form_state){
  if($usage = mee_instance_usage(TRUE)){
    if(@is_array($usage['Default'])){
      foreach($usage['Default'] as $load_from => $name){
        list($entity_type, $field_name, $bundle_name) = explode('|',$load_from);
        $instance = field_info_instance($entity_type, $field_name, $bundle_name);
        $instance['settings']['mee']['settings'] = $form_state['values']['mee_defaults'];
        // Make sure default gets set again as we remove that field from the settings form
        $instance['settings']['mee']['settings']['default'] = 1;
        field_update_instance($instance);
      }
    }
  }
}
