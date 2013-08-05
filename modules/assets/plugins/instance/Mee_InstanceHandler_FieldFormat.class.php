<?php

class Mee_InstanceHandler_FieldFormat extends Mee_InstanceHandler_Abstract {

  public function settings_form(&$form, &$form_state, $defaults) {
    // Field to be formatted.
    $entity_type = 'mee_asset';
    $bundle = $form_state['mee_asset_type']->type;
    $info = field_info_instances($entity_type, $bundle);
    if(!empty($info)){
      foreach($info as $field){

        $formatted_field = field_read_field($field['field_name']);
        // Field instance to be formatted.
        $formatted_instance = field_read_instance($entity_type, $field['field_name'], $bundle);

        // Fetch formatter options, excluding the "from_field" formatter.
        module_load_include('inc', 'field_ui', 'field_ui.admin');
        $formatter_options = field_ui_formatter_options($formatted_field['type']);
        unset($formatter_options['from_field']);
        $form['field_formats'] = array('#tree' => TRUE, '#prefix' => '<strong>Selectable formats for File</strong><hr style="margin:5px 0" />');
        foreach($formatter_options as $option => $label){

          $form['field_formats'][$field['field_name']][$option]['enabled'] = array(
            '#type' => 'checkbox',
            '#title' => $label,
            '#default_value' => !empty($defaults['field_formats'][$field['field_name']][$option]['enabled']) ? $defaults['field_formats'][$field['field_name'][$option]['enabled']] : NULL
          );

          $form['field_formats'][$field['field_name']][$option]['preview'] = array(
            '#type' => 'checkbox',
            '#title' => t('Use preview display when in edit mode.'),
            '#attributes' => array('style' => 'margin-left:20px;'),
            '#default_value' => !empty($defaults['field_formats'][$field['field_name']][$option]['enabled']) ? $defaults['field_formats'][$field['field_name'][$option]['enabled']] : NULL
          );

          $form['field_formats'][$field['field_name']][$option]['preview']['#states'] = array(
            'visible' => array(
              ':input[name="data[instances][field_format_settings][field_formats]['.$field['field_name'].']['.$option.'][enabled]"]' => array('checked' => TRUE),
            ),
          );

        }

      }
    }

  }

  public function instance_form(&$form, &$form_state, $settings) {
    //dsm($settings);
    $entity_type = 'mee_asset';
    $bundle = $form_state['mee_asset']->type;
    $form['field_formats'] = array('#tree' => TRUE);
    if(!empty($settings['field_formats'])){
      foreach($settings['field_formats'] as $field_name => $data){
        $formatter_enabled_options = array();
        foreach($data as $display_name => $d){
          if($d['enabled']){
            $formatter_enabled_options[$display_name] = $display_name;
          }
        }

        $field = field_info_instance($entity_type, $field_name, $bundle);
        $formatted_field = field_read_field($field['field_name']);
        // Field instance to be formatted.
        $formatted_instance = field_read_instance($entity_type, $field['field_name'], $bundle);

        // Fetch formatter options, excluding the "from_field" formatter.
        module_load_include('inc', 'field_ui', 'field_ui.admin');
        $formatter_options = field_ui_formatter_options($formatted_field['type']);
        $formatter_options = array_intersect_key($formatter_options, array_filter($formatter_enabled_options));

        $defaults = empty($form_state['values']['data']['field_formats'][$field_name]) ? array() : $form_state['values']['data']['field_formats'][$field_name];

        // Populate $items from $form_state values if available.  This is necessary
        // for the #ajax functionality.
        if (!empty($form_state['values'])) {
          $path = array($field['field_name'], $langcode);
          $items = drupal_array_get_nested_value($form_state, $path);
        }

        if (!empty($defaults['settings']) && is_string($defaults['settings'])) {
          $defaults['settings'] = unserialize($defaults['settings']);
        }

        //$form['#element_validate'] = array('mee_instance_fieldformat_validate');
        $wrapper_id = 'formatter-field-settings-form--'. $field['field_name'];

        $form['field_formats'][$field_name]['type'] = array(
          '#type' => 'select',
          '#title' => t('Formatter for @title', array('@title' => $formatted_instance['label'])),
          '#options' => $formatter_options,
          '#default_value' => isset($defaults['type']) ? $defaults['type'] : '',
          '#ajax' => array(
            'callback' => 'mee_instance_fieldformat_submit_ajax',
            'wrapper' => $wrapper_id,
            'effect' => 'fade',
          ),
        );

        $settings_form = array();

        // Retrieve the settings form segment, if $defaults is available.
        if (!empty($defaults)) {

          if(!empty($data[$defaults['type']]['preview'])){
            $form['field_formats'][$field_name]['preview'] = array(
              '#type' => 'hidden',
              '#value' => 1,
            );
          }

          // Prepare $formatted_instance to be passed to hook_field_formatter_settings_form().
          // Display settings are stored in the _custom_display view mode.
          $formatter = field_info_formatter_types($defaults['type']);
          $view_mode = '_custom_display';
          $formatted_instance['display'][$view_mode] = $defaults + array(
            'module' => $formatter['module'],
          );

          $function = $formatter['module'] . '_field_formatter_settings_form';
          if (function_exists($function)) {
            $settings_form = $function($formatted_field, $formatted_instance, $view_mode, $form, $form_state);
          }
        }

        $form['field_formats'][$field_name]['settings'] = $settings_form + array(
          '#type' => 'container',
          '#prefix' => '<div id="'. $wrapper_id .'">',
          '#suffix' => '</div>',
          '#tree' => 1,
        );


      }
    }
  }

  public function instance_render(&$element, $settings) {
    if(!empty($settings['field_formats'])){
      $entity = $element['asset']['#entity'];
      $entity_type = 'mee_asset';
      $bundle = $entity->type;
      foreach($settings['field_formats'] as $field_name => $data){
        if(!empty($element['asset'][$field_name])){
          $field = field_info_instance($entity_type, $field_name, $bundle);
          $display = $data + $field['display']['default'];
          if(!empty($element['#preview']) && !empty($data['preview'])){
            $type = mee_asset_type_load($bundle);
            $element['asset'][$field_name] = array(
              '#markup' => '<div class="mee-preview-temp"><i class="icon-'.$type->data['icon'].'"></i><span>'.$type->label.'</span></div>',
            );
          }
          else{
            $element['asset'][$field_name] = field_view_field($entity_type, $entity, $field_name, $display);
          }
        }
      }
    }
  }
}

/**
 * #element_validate callback for formatter_field_field_widget_form().
 *
 * Serialize the settings before saving.
 */
function mee_instance_fieldformat_validate($element, &$form_state) {
  $values = drupal_array_get_nested_value($form_state['values'], $element['#parents']);
  if (!isset($values['settings'])) {
    $values['settings'] = array();
  }
  $values['settings'] = serialize($values['settings']);
  form_set_value($element, $values, $form_state);
}

/**
 * #ajax callback for formatter_field_field_widget_form().
 */
function mee_instance_fieldformat_submit_ajax($form, &$form_state) {
  $trigger = $form_state['triggering_element'];
  $path = $trigger['#parents'];
  array_pop($path);
  $path[] = 'settings';
  return drupal_array_get_nested_value($form, $path);
}
