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

    $defaults = array(
      'autogrow' => 1,
      'view' => 'default',
      'labels_show' => 1,
      'toolbar' => array(),
    );
    $default_values = !empty($instance['settings']['mee']['settings']) ? $instance['settings']['mee']['settings'] : $defaults;

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
        '#default_value' => !empty($default_values['toolbar']['buttons'][$name]['status']) ? $default_values['toolbar']['buttons'][$name]['status'] : 0,
      );
      $buttons[$name]['group'] = array(
        '#type' => 'hidden',
        '#default_value' => !empty($default_values['toolbar']['buttons'][$name]['group']) ? $default_values['toolbar']['buttons'][$name]['group'] : 'disabled',
      );
      $buttons[$name]['weight'] = array(
        '#type' => 'hidden',
        '#default_value' => !empty($default_values['toolbar']['buttons'][$name]['weight']) ? $default_values['toolbar']['buttons'][$name]['weight'] : 0,
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
    $output .= '          <i class="icon-'.$p['icon'].'"></i>';
    $output .= '        </li>';
  }
  $output .= '      </ul>';
  $output .= '    </div>';
  $output .= '  </div>';
  $output .= '</div>';

  // Toolbar
  $output .= '<div class="mee-wrapper">';
  $output .= '  <div class="mee-toolbar btn-toolbar clearfix">';
  foreach(mee_button_groups() as $k => $label){
    $pull = $k == 'right' ? 'pull-right' : 'pull-left';
    $output .= '    <div class="mee-group '.$pull.'">';
    $output .=        drupal_render($element['groups'][$k]);
    //$output .= '      <label>'.$label.'</label>';
    $output .= '      <ul id="mee-group-' . $k . '" class="btn-group mee-sortable">';
    foreach($setup[$k] as $name => $weight){
      $p = $buttons[$name];
      $output .= '        <li id="mee-'.$name.'" class="btn btn-mini btn-inverse" title="'.$p['tip'].'">';
      $output .= '          <i class="icon-'.$p['icon'].'"></i>';
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
