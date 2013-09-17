<?php

/**
 * @file
 * MeeAsset type editing UI.
 */

/**
 * UI controller.
 */
class MeeAssetTypeUIController extends EntityDefaultUIController {

  /**
   * Overrides hook_menu() defaults.
   */
  public function hook_menu() {
    $items = parent::hook_menu();
    $items[$this->path]['description'] = 'Manage mee asset entity types, including adding
    and removing fields and the display of fields.';
    return $items;
  }
}

/**
 * Generates the mee asset type editing form.
 */
function mee_asset_type_form($form, &$form_state, $mee_asset_type, $op = 'edit') {

  if ($op == 'clone') {
    $mee_asset_type->label .= ' (cloned)';
    $mee_asset_type->type = '';
  }

  drupal_add_library('mee', 'mee', FALSE);

  $form['label'] = array(
    '#title' => t('Label'),
    '#type' => 'textfield',
    '#default_value' => $mee_asset_type->label,
    '#description' => t('The human-readable name of this mee asset type.'),
    '#required' => TRUE,
    '#size' => 30,
  );
  // Machine-readable type name.
  $form['type'] = array(
    '#type' => 'machine_name',
    '#default_value' => isset($mee_asset_type->type) ? $mee_asset_type->type : '',
    '#maxlength' => 32,
    //'#disabled' => $mee_asset_type->isLocked() && $op != 'clone',
    '#machine_name' => array(
      'exists' => 'mee_asset_get_types',
      'source' => array('label'),
    ),
    '#description' => t('A unique machine-readable name for this mee asset type. It must only contain lowercase letters, numbers, and underscores.'),
  );

  $form['data']['#tree'] = TRUE;

  $options = array();
  foreach(fawesome_list() as $icon){
    $options[$icon] = '<i class="icon-'.$icon.'"></i>';
  }
  $form['data']['icon'] = array(
    '#type' => 'radios',
    '#title' => t('Toolbar Icon'),
    '#options' => $options,
    '#required' => TRUE,
    '#default_value' => empty($mee_asset_type->data['icon']) ? array() : $mee_asset_type->data['icon'],
    '#attributes' => array('class'=>array('clearfix')),
  );

  $form['data']['tip'] = array(
    '#type' => 'textfield',
    '#title' => t('Tooltip'),
    '#required' => TRUE,
    '#default_value' => empty($mee_asset_type->data['tip']) ? '' : $mee_asset_type->data['tip'],
  );

  $form['data']['shortcut'] = array(
    '#type' => 'textfield',
    '#title' => t('Shortcut'),
    '#description' => t('The keyboard shortcut that can be used to access this button. Example: ctrl+b.'),
    '#default_value' => empty($mee_asset_type->data['shortcut']) ? '' : $mee_asset_type->data['shortcut'],
  );

  $form['data']['placeholder'] = array(
    '#type' => 'checkbox',
    '#title' => t('Use placeholder'),
    '#description' => t('When in preview mode, a placeholder will be used instead of a full render of this content.'),
    '#default_value' => empty($mee_asset_type->data['placeholder']) ? '' : $mee_asset_type->data['placeholder'],
  );

  $instances = mee_get_plugin('instance');
  usort($instances, 'drupal_sort_weight');
  if(!empty($instances)){
    $form['data']['instances'] = array(
      '#tree' => TRUE,
      '#access' => FALSE,
      '#type' => 'fieldset',
      '#title' => t('Instance options'),
      '#description' => t('An asset can have instance settings. These settings allow changes per asset on an individual implementation.') . '<hr /><br />',
    );
  }
  foreach($instances as $instance){
    $handler = _mee_get_handler('instance', $instance['name']);
    $form['data']['instances'][$instance['name']] = array(
      '#type' => 'checkbox',
      '#title' => $instance['title'],
      '#default_value' => empty($mee_asset_type->data['instances'][$instance['name']]) ? 0 : 1,
      '#description' => !empty($instance['description']) ? $instance['description'] : NULL,
    );

    $settings_defaults = !empty($mee_asset_type->data['instances'][$instance['name']]) ? $mee_asset_type->data['instances'][$instance['name']] : array();
    $settings_form = array();
    $handler->settings_form($settings_form, $form_state, $settings_defaults);
    if(!empty($settings_form)){

      $form['data']['instances'][$instance['name'].'_settings'] = array(
        '#tree' => TRUE,
        '#type' => 'fieldset',
        '#title' => $instance['title'] . ' ' . t('Settings'),
      );

      $form['data']['instances'][$instance['name'].'_settings']['#states'] = array(
        'visible' => array(
          ':input[name="data[instances]['.$instance['name'].']"]' => array('checked' => TRUE),
        ),
      );

      $form['data']['instances'][$instance['name'].'_settings'] += $settings_form;

    }

    $form['data']['instances']['#access'] = TRUE;
  }

  $form['actions'] = array('#type' => 'actions');
  $form['actions']['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Save mee asset type'),
    '#weight' => 40,
  );

  //Locking not supported yet
  /*if (!$mee_asset_type->isLocked() && $op != 'add') {
    $form['actions']['delete'] = array(
      '#type' => 'submit',
      '#value' => t('Delete mee_asset type'),
      '#weight' => 45,
      '#limit_validation_errors' => array(),
      '#submit' => array('mee_asset_type_form_submit_delete')
    );
  }*/
  return $form;
}

/**
 * Form API validate callback for the type form.
 */
function mee_asset_type_form_validate(&$form, &$form_state) {
  if(@is_array($form_state['values']['data']['instances'])){
    foreach($form_state['values']['data']['instances'] as $key => &$value){
      if($value === 1){
        // If instance is active, merge settings with primary key.
        if(isset($form_state['values']['data']['instances'][$key . '_settings'])){
          $value = $form_state['values']['data']['instances'][$key . '_settings'];
          unset($form_state['values']['data']['instances'][$key . '_settings']);
        }
      }else{
        // If instance settings aren't active, remove instance.
        unset($form_state['values']['data']['instances'][$key]);
        unset($form_state['values']['data']['instances'][$key . '_settings']);
      }
    }
  }
}

/**
 * Form API submit callback for the type form.
 */
function mee_asset_type_form_submit(&$form, &$form_state) {
  $mee_asset_type = entity_ui_form_submit_build_entity($form, $form_state);
  $mee_asset_type->save();
  $form_state['redirect'] = 'admin/structure/mee';
}

/**
 * Form API submit callback for the delete button.
 */
function mee_asset_type_form_submit_delete(&$form, &$form_state) {
  $form_state['redirect'] = 'admin/structure/mee/manage/' . $form_state['mee_asset_type']->type . '/delete';
}
