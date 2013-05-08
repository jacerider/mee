<?php

/**
 * Return a list of allowed elements.
 * @TODO: Make this a hook.
 */
function mee_allowed_elements() {
  $allowed_elements = array(
    'textarea',
  );
  drupal_alter('mee_allowed_elements', $allowed_elements);
  return $allowed_elements;
}

/**
 * Return a list of allowed field types.
 * @TODO: Make this a hook.
 */
function mee_allowed_field_types() {
  $allowed_field_types = array(
    'text_long',
  );
  drupal_alter('mee_allowed_field_types', $allowed_field_types);
  return $allowed_field_types;
}

/**
 * Return a list of allowed widget types.
 * @TODO: Make this a hook.
 */
function mee_allowed_widget_types() {
  $allowed_widget_types = array(
    'text_textarea',
  );
  drupal_alter('mee_allowed_widget_types', $allowed_widget_types);
  return $allowed_widget_types;
}

function mee_button_groups(){
  $groups = array(
    'font' => t('Font Style'),
    'list' => t('List'),
    'insert' => t('Insert Items'),
    'other' => t('Other'),
    'right' => t('Right'),
  );
  drupal_alter('mee_button_groups', $groups);
  return $groups;
}

/**
 * Implements hook_form_FIELD_UI_FIELD_EDIT_FORM_alter().
 */
function mee_form_field_ui_field_edit_form_alter(&$form, &$form_state) {
  $instance = $form['#instance'];

  // Get allowed field and widget types.
  $allowed_field_types = mee_allowed_field_types();
  $allowed_field = in_array($form['#field']['type'], $allowed_field_types);
  $allowed_widget_types = mee_allowed_widget_types();
  $allowed_widget = in_array($form['instance']['widget']['type']['#value'], $allowed_widget_types);

  // Add the mee settings to the field instance form.
  if ($allowed_field  && $allowed_widget) {
  // dsm($form);
  // dsm($form_state);
    $default_values = $instance['settings']['mee']['settings'];

    // Fieldset for mee settings on this field instance.
    $form['instance']['settings']['mee'] = array(
      '#type' => 'fieldset',
      '#title' => t('Mee Editor'),
      '#collapsible' => FALSE,
      '#collapsed' => FALSE,
    );
    $mee = &$form['instance']['settings']['mee'];

    // Enable mee on this field instance.
    $mee['enable'] = array(
      '#type' => 'checkbox',
      '#title' => t('Enable Mee support.'),
      '#default_value' => isset($instance['settings']['mee']['enable']) ? $instance['settings']['mee']['enable'] : 0,
    );

    $mee['settings'] = array(
      '#type' => 'fieldset',
      '#title' => t('Settings'),
      '#collapsible' => FALSE,
      '#collapsed' => FALSE,
      '#states' => array(
        'invisible' => array(
          'input[name="instance[settings][mee][enable]"]' => array('checked' => FALSE),
        ),
        // 'required' => array(
        //   'input[name="instance[settings][mee][enable]"]' => array('checked' => TRUE),
        // ),
      ),
    );

    $mee['settings']['autogrow'] = array(
      '#type' => 'checkbox',
      '#title' => t('Autogrow'),
      '#default_value' => isset($default_values['autogrow']) ? $default_values['autogrow'] : 0,
      '#description' => t('Automatically grow the field as it is filled with more text.'),
    );

    $mee['settings']['view'] = array(
      '#type' => 'select',
      '#title' => t('View Mode'),
      '#options' => array('default' => 'Default','split'=>'Split'),
      '#default_value' => isset($default_values['view']) ? $default_values['view'] : 0,
      '#description' => t('The display style of the editor.'),
    );

    $mee['settings']['buttons'] = array(
      '#type' => 'container',
      '#tree' => TRUE,
      '#theme' => 'mee_config_form_buttons',
    );
    $buttons = &$mee['settings']['buttons'];

    mee_settings_buttons_order($default_values);

    foreach(mee_button_groups() as $k => $label){
      $key = 'group-'.$k;
      $buttons[$key]['#weight'] = isset($default_values['buttons'][$key]['weight']) ? $default_values['buttons'][$key]['weight'] : 0;
      $buttons[$key]['status'] = array(
        '#type' => 'textfield',
        '#default_value' => isset($default_values['buttons'][$key]['status']) ? $default_values['buttons'][$key]['status'] : $label,
      );
      $buttons[$key]['id'] = array(
        '#type' => 'hidden',
        '#value' => $key,
        '#attributes' => array('class' => array('mee-button-id')),
      );
      $buttons[$key]['weight'] = array(
        '#type' => 'weight',
        '#default_value' => isset($default_values['buttons'][$key]['weight']) ? $default_values['buttons'][$key]['weight'] : 0,
        '#size' => 3,
        '#attributes' => array('class' => array('mee-button-weight')),
        '#title-display' => 'invisible'
      );
      $buttons[$key]['pid'] = array(
        '#type' => 'textfield',
        '#default_value' => isset($default_values['buttons'][$key]['pid']) ? $default_values['buttons'][$key]['pid'] : 0,
        '#size' => 3,
        '#attributes' => array('class' => array('mee-button-pid')),
      );
    }

    $plugins = mee_get_plugin('buttons');
    foreach($plugins as $name => $p){
      $handler = _mee_get_handler('buttons', $name);
      $label = $p['title'];
      if(!empty($p['mee']['icon'])) $label = '<i class="icon-'.$p['mee']['icon'].'"></i> '.$label;

      $buttons[$name]['#weight'] = isset($default_values['buttons'][$name]['weight']) ? $default_values['buttons'][$name]['weight'] : 0;

      $buttons[$name]['status'] = array(
        '#type' => 'checkbox',
        '#title' => $handler->getLabel(true),
        '#default_value' => isset($default_values['buttons'][$name]['status']) ? $default_values['buttons'][$name]['status'] : 0,
      );
      $buttons[$name]['id'] = array(
        '#type' => 'hidden',
        '#value' => $name,
        '#attributes' => array('class' => array('mee-button-id')),
      );
      $buttons[$name]['weight'] = array(
        '#type' => 'weight',
        '#default_value' => isset($default_values['buttons'][$name]['weight']) ? $default_values['buttons'][$name]['weight'] : 0,
        '#size' => 3,
        '#attributes' => array('class' => array('mee-button-weight')),
        '#title-display' => 'invisible'
      );
      $buttons[$name]['pid'] = array(
        '#type' => 'textfield',
        '#default_value' => isset($default_values['buttons'][$name]['pid']) ? $default_values['buttons'][$name]['pid'] : 0,
        '#size' => 3,
        '#attributes' => array('class' => array('mee-button-pid')),
      );
    }

  }
}

function mee_settings_buttons_order(&$settings){
  $ordered = array();
  $weight = 0;
  foreach($settings['buttons'] as $key => $data){
    $type = substr($key, 0, 5);
    if($type == 'group'){
      $data['weight'] = $weight++;
      $ordered[$key] = $data;
      foreach($settings['buttons'] as $child_key => $child_data){
        $child_type = substr($child_key, 0, 5);
        if($child_type != 'group'){
          if($key == $child_data['pid']){
            $child_data['weight'] = $weight++;
            $ordered[$child_key] = $child_data;
          }
        }
      }
    }
  }
  $settings['buttons'] = $ordered;
}
