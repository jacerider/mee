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
//    '#disabled' => $mee_asset_type->isLocked() && $op != 'clone',
    '#machine_name' => array(
      'exists' => 'mee_asset_get_types',
      'source' => array('label'),
    ),
    '#description' => t('A unique machine-readable name for this mee asset type. It must only contain lowercase letters, numbers, and underscores.'),
  );

  $form['data']['#tree'] = TRUE;
  $form['data']['sample_data'] = array(
    '#type' => 'checkbox',
    '#title' => t('An interesting mee asset switch'),
    '#default_value' => !empty($mee_asset_type->data['sample_data']),
  );

  $options = array();
  foreach(mee_icons() as $icon){
    $options[$icon] = '<i class="icon-'.$icon.'"></i>';
  }
  $form['data']['icon'] = array(
    '#type' => 'checkboxes',
    '#title' => t('Toolbar Icon'),
    '#options' => $options,
    '#required' => TRUE,
    '#default_value' => empty($mee_asset_type->data['icon']) ? array() : $mee_asset_type->data['icon'],
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
