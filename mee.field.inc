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
    'text_with_summary',
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
    'text_textarea_with_summary',
  );
  drupal_alter('mee_allowed_widget_types', $allowed_widget_types);
  return $allowed_widget_types;
}

/**
 * Return a list of Mee enabled fields with information on entity|bundle|field
 *
 * $include_default  boolean
 *   Will include those fields that are using the default settings
 */
function mee_instance_usage($include_default = FALSE){
  $allowed_field_types = mee_allowed_field_types();
  $mee_enabled = array();
  foreach(field_info_field_map() as $field_name => $data){
    if(in_array($data['type'], $allowed_field_types)){
      foreach($data['bundles'] as $entity_type => $bundles){
        foreach($bundles as $bundle_name){
          $instance = field_info_instance($entity_type, $field_name, $bundle_name);
          if(!empty($instance['settings']['mee']['enable'])){
            $entity = entity_get_info($entity_type);
            $key = $entity_type.'|'.$field_name.'|'.$bundle_name;
            $label = $entity['label'];
            $value = '[' .$entity['bundles'][$bundle_name]['label'] . '] ' . $instance['label'];
            //$mee_enabled[$entity_type] = empty($mee_enabled[$entity_type]) ? $entity['label'] : $mee_enabled[$entity_type];
            if(!empty($instance['settings']['mee']['settings']['default'])){
              if(!$include_default) continue;
              $label = 'Default';
            }
            $mee_enabled[$label][$key] = $value;
          }
        }
      }
    }
  }
  return $mee_enabled;
}

/**
 * Implements hook_form_FIELD_UI_FIELD_EDIT_FORM_alter().
 */
function mee_form_field_ui_field_edit_form_alter(&$form, &$form_state) {

  // Get allowed field and widget types.
  $allowed_field_types = mee_allowed_field_types();
  $allowed_field = in_array($form['#field']['type'], $allowed_field_types);
  $allowed_widget_types = mee_allowed_widget_types();
  $allowed_widget = in_array($form['instance']['widget']['type']['#value'], $allowed_widget_types);

  // Add the mee settings to the field instance form.
  if ($allowed_field  && $allowed_widget) {
    mee_form_field_form($form, $form_state);
  }
}

/**
 * Mee configuration form.
 */
function mee_form_field_form(&$form, &$form_state){
  $instance = empty($form['#instance']) ? 0 : $form['#instance'];

  $defaults = array(
    'autogrow' => 1,
    'view' => 'default',
    'labels_show' => 1,
    'toolbar' => array(),
  );

  // Get defaults
  $default_values = !empty($instance['settings']['mee']['settings']) ? $instance['settings']['mee']['settings'] : $defaults;
  // Load in defaults from another field
  if(!empty($form_state['values']['instance']['settings']['mee']['settings']['default'])){
    $default_values = variable_get('mee_defaults');
  }
  else if (!empty($form_state['values']['mee_load'])){
    $load_from = $form_state['values']['mee_load'];
    list($entity_type, $field_name, $bundle_name) = explode('|',$load_from);
    $instance = field_info_instance($entity_type, $field_name, $bundle_name);
    $default_values = $instance['settings']['mee']['settings'];
  }

  // Fieldset for mee settings on this field instance.
  $form['instance']['settings']['mee'] = array(
    '#type' => 'fieldset',
    '#title' => t('Mee Editor'),
    '#collapsible' => FALSE,
    '#collapsed' => FALSE,
    '#id' => 'edit-instance-settings-mee',
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
    ),
  );

  $mee['settings']['default'] = array(
    '#type' => 'checkbox',
    '#title' => t('Use default settings'),
    '#default_value' => isset($default_values['default']) ? $default_values['default'] : 0,
    '#description' => t('Use mee system defaults set in the !url.', array('!url' => l('mee global settings','admin/config/mee'))),
    '#ajax' => array(
      'callback' => 'mee_form_field_form_ajax',
      'wrapper' => 'edit-instance-settings-mee',
      'method' => 'replace',
      'effect' => 'none',
    ),
  );

  if($usage = mee_instance_usage()){
    array_unshift($usage, '--');
    $mee['settings']['mee_load'] = array(
      '#type' => 'select',
      '#title' => t('Import Settings'),
      '#options' => $usage,
      '#description' => t('Import settings form another Mee isntance.'),
      '#tree' => FALSE,
      '#ajax' => array(
        'callback' => 'mee_form_field_form_ajax',
        'wrapper' => 'edit-instance-settings-mee',
        'method' => 'replace',
        'effect' => 'none',
      ),
      '#states' => array(
        'invisible' => array(
          'input[name="instance[settings][mee][settings][default]"]' => array('checked' => TRUE),
        ),
      ),
    );
  }

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

  $mee['settings']['labels_show'] = array(
    '#type' => 'checkbox',
    '#title' => t('Show Labels'),
    '#default_value' => isset($default_values['labels_show']) ? $default_values['labels_show'] : 0,
  );

  $options = array(0 => '-- Allow All --');
  foreach(filter_formats() as $format){
    if($format->status) $options[$format->format] = $format->name;
  }
  $mee['settings']['text_format'] = array(
    '#type' => 'select',
    '#title' => t('Text format'),
    '#options' => $options,
    '#default_value' => isset($default_values['text_format']) ? $default_values['text_format'] : 0,
  );

  $mee['settings']['toolbar'] = array(
    '#id' => 'mee-toolbar-editor',
    '#type' => 'container',
    '#tree' => TRUE,
    '#theme' => 'mee_config_form_toolbar',
    '#defaults' => $default_values['toolbar'],
    '#attached' => array(
      'js' => array(drupal_get_path('module', 'mee') . '/js/mee.admin.js'),
      'library' => array(
        array('system', 'ui.sortable'),
      )
    )
  );

  $mee['settings']['toolbar']['groups'] = array(
    '#type' => 'container',
  );
  $groups = &$mee['settings']['toolbar']['groups'];
  foreach(mee_button_groups() as $k => $label){
    $groups[$k] = array(
      '#type' => 'textfield',
      '#default_value' => !empty($default_values['toolbar']['groups'][$k]) ? $default_values['toolbar']['groups'][$k] : $label,
    );
  }

  $mee['settings']['toolbar']['buttons'] = array(
    '#type' => 'container',
  );
  $buttons = &$mee['settings']['toolbar']['buttons'];
  foreach(mee_buttons() as $name => $p){
    $buttons[$name]['status'] = array(
      '#type' => 'hidden',
      '#value' => !empty($default_values['toolbar']['buttons'][$name]['status']) ? $default_values['toolbar']['buttons'][$name]['status'] : 0,
    );
    $buttons[$name]['group'] = array(
      '#type' => 'hidden',
      '#value' => !empty($default_values['toolbar']['buttons'][$name]['group']) ? $default_values['toolbar']['buttons'][$name]['group'] : 'disabled',
    );
    $buttons[$name]['weight'] = array(
      '#type' => 'hidden',
      '#value' => !empty($default_values['toolbar']['buttons'][$name]['weight']) ? $default_values['toolbar']['buttons'][$name]['weight'] : 0,
    );
  }
}

function mee_form_field_form_ajax(&$form, &$form_state){
  return $form['instance']['settings']['mee'];
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

function theme_mee_config_form_toolbar($vars){
  mee_add_js();
  $output = '';
  $element = $vars['element'];
  $buttons = mee_buttons();
  $defaults = !empty($element['#defaults']['buttons']) ? $element['#defaults']['buttons'] : array();
  $setup = array();
  foreach(mee_button_groups() as $k => $label){
    $setup[$k] = array();
  }
  foreach($buttons as $name => $p){
    $key = 'disabled';
    $data = !empty($defaults[$name]) ? $defaults[$name] : array();
    if(!empty($data['status']) && !empty($data['group'])) $key = $data['group'];
    $weight = !empty($data['weight']) ? $data['weight'] : 0 ;
    $setup[$key][$name] = $weight;
    asort($setup[$key]);
  }

  // Disabled
  $output .= '<div class="mee-wrapper">';
  $output .= '  <div class="mee-toolbar btn-toolbar clearfix">';
  $output .= '    <div class="mee-group pull-left">';
  $output .= '      <label>Disabled <span>(drag to toolbar to activate)</span></label>';
  $output .= '      <ul id="mee-group-disabled" class="btn-group mee-sortable">';
  foreach($setup['disabled'] as $name => $weight){
    $p = $buttons[$name];
    $output .= '        <li id="mee-'.$name.'" class="btn btn-mini btn-inverse" title="'.$p['tip'].'">';
    $output .= '          <i class="icon-'.$p['icon'].'"></i> '.$p['title'];
    $output .= '        </li>';
  }
  $output .= '      </ul>';
  $output .= '    </div>';
  $output .= '  </div>';
  $output .= '</div>';

  // Toolbar
  $output .= '<div class="mee-wrapper">';
  $output .= '  <div class="mee-toolbar mee-toolbar-enabled btn-toolbar clearfix">';
  foreach(mee_button_groups() as $k => $label){
    $pull = $k == 'right' ? 'pull-right' : 'pull-left';
    $output .= '    <div class="mee-group '.$pull.'">';
    $output .=        drupal_render($element['groups'][$k]);
    //$output .= '      <label>'.$label.'</label>';
    $output .= '      <ul id="mee-group-' . $k . '" class="btn-group mee-sortable">';
    foreach($setup[$k] as $name => $weight){
      $p = $buttons[$name];
      $output .= '        <li id="mee-'.$name.'" class="btn btn-mini btn-inverse" title="'.$p['tip'].'">';
      $output .= '          <i class="icon-'.$p['icon'].'"></i> '.$p['title'];
      $output .= '        </li>';
    }
    $output .= '      </ul>';
    $output .= '    </div>';
  }

  $output .= '  </div>';
  $output .= '</div>';

  $output .= drupal_render_children($element);
  return $output;
}
