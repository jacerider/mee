<?php

/**
 * @file
 * MeeAsset editing UI.
 *
 * We make very little use of the EntityAPI interface for this - preferring instead to use
 * views. That offers more flexibility to change a UI that will, more often than not,
 * be end-user facing.
 */

/**
 * UI controller.
 */
class MeeAssetUIController extends EntityDefaultUIController {

  /**
   * Overrides hook_menu() defaults. Main reason for doing this is that
   * parent class hook_menu() is optimized for entity type administration.
   */
  public function hook_menu() {

    $items = array();
    $id_count = count(explode('/', $this->path));
    $wildcard = isset($this->entityInfo['admin ui']['menu wildcard']) ? $this->entityInfo['admin ui']['menu wildcard'] : '%' . $this->entityType;

    $items[$this->path] = array(
      'title' => 'Assets',
      'description' => 'Add edit and update mee assets.',
      'page callback' => 'system_admin_menu_block_page',
      'access arguments' => array('access administration pages'),
      'file path' => drupal_get_path('module', 'system'),
      'file' => 'system.admin.inc',
    );

    // Change the overview menu type for the list of mee assets.
    $items[$this->path]['type'] = MENU_LOCAL_TASK;

    // Change the add page menu to multiple types of entities
    $items[$this->path . '/add'] = array(
      'title' => 'Add a mee asset',
      'description' => 'Add a new mee asset',
      'page callback'  => 'mee_asset_add_page',
      'access callback'  => 'mee_asset_access',
      'access arguments' => array('edit'),
      'type' => MENU_NORMAL_ITEM,
      'weight' => 20,
      'file' => 'mee_asset.admin.inc',
      'file path' => drupal_get_path('module', $this->entityInfo['module'])

    );

    // Add menu items to add each different type of entity.
    foreach (mee_asset_get_types() as $type) {
      $items[$this->path . '/add/' . $type->type] = array(
        'title' => 'Add ' . $type->label,
        'page callback' => 'mee_asset_form_wrapper',
        'page arguments' => array(mee_asset_create(array('type' => $type->type))),
        'access callback' => 'mee_asset_access',
        'access arguments' => array('edit', 'edit ' . $type->type),
        'file' => 'mee_asset.admin.inc',
        'file path' => drupal_get_path('module', $this->entityInfo['module'])
      );
    }

    // Loading and editing mee_asset entities
    $items[$this->path . '/' . $wildcard] = array(
      'page callback' => 'mee_asset_form_wrapper',
      'page arguments' => array($id_count),
      'access callback' => 'mee_asset_access',
      'access arguments' => array('edit', $id_count),
      'weight' => 0,
      'context' => MENU_CONTEXT_PAGE | MENU_CONTEXT_INLINE,
      'file' => 'mee_asset.admin.inc',
      'file path' => drupal_get_path('module', $this->entityInfo['module'])
    );
    $items[$this->path . '/' . $wildcard . '/edit'] = array(
      'title' => 'Edit',
      'type' => MENU_DEFAULT_LOCAL_TASK,
      'weight' => -10,
      'context' => MENU_CONTEXT_PAGE | MENU_CONTEXT_INLINE,
    );

    $items[$this->path . '/' . $wildcard . '/delete'] = array(
      'title' => 'Delete',
      'page callback' => 'mee_asset_delete_form_wrapper',
      'page arguments' => array($id_count),
      'access callback' => 'mee_asset_access',
      'access arguments' => array('edit', $id_count),
      'type' => MENU_LOCAL_TASK,
      'context' => MENU_CONTEXT_INLINE,
      'weight' => 10,
      'file' => 'mee_asset.admin.inc',
      'file path' => drupal_get_path('module', $this->entityInfo['module'])
    );

    // Menu item for viewing mee_assets
    $items['asset/' . $wildcard] = array(
      //'title' => 'Title',
      'title callback' => 'mee_asset_page_title',
      'title arguments' => array(1),
      'page callback' => 'mee_asset_page_view',
      'page arguments' => array(1),
      'access callback' => 'mee_asset_access',
      'access arguments' => array('view', 1),
      'type' => MENU_CALLBACK,
    );
    return $items;
  }


  /**
   * Create the markup for the add Mee Asset Entities page within the class
   * so it can easily be extended/overriden.
   */
  public function addPage() {
    $item = menu_get_item();
    $content = system_admin_menu_block($item);

    if (count($content) == 1) {
      $item = array_shift($content);
      drupal_goto($item['href']);
    }

    return theme('mee_asset_add_list', array('content' => $content));
  }

}


/**
 * Form callback wrapper: create or edit a mee asset.
 *
 * @param $mee_asset
 *   The mee_asset object being edited by this form.
 *
 * @see mee_asset_edit_form()
 */
function mee_asset_form_wrapper($mee_asset, $js = FALSE) {
  // Add the breadcrumb for the form's location.
  mee_asset_set_breadcrumb();
  $output = drupal_get_form('mee_asset_edit_form', $mee_asset, $js);

  if( $js != 'ajax'){
    return $output;
  }

  $commands = array();
  $commands[] = ajax_command_html('#asset-browser', drupal_render($output));
  $commands[] = ajax_command_invoke('#mee-widget', 'addClass', array('mee-widget-expanded'));
  $page = array('#type' => 'ajax', '#commands' => $commands);
  ajax_deliver($page);
}


/**
 * Form callback wrapper: delete a mee asset.
 *
 * @param $mee_asset
 *   The mee_asset object being edited by this form.
 *
 * @see mee_asset_edit_form()
 */
function mee_asset_delete_form_wrapper($mee_asset) {
  // Add the breadcrumb for the form's location.
  //mee_asset_set_breadcrumb();
  return drupal_get_form('mee_asset_delete_form', $mee_asset);
}


/**
 * Form callback: create or edit a mee asset.
 *
 * @param $mee_asset
 *   The mee_asset object to edit or for a create form an empty mee asset object
 *     with only a mee asset type defined.
 */
function mee_asset_edit_form($form, &$form_state, $mee_asset, $js) {
  // Add the default field elements.
  $form['name'] = array(
    '#type' => 'textfield',
    '#title' => t('Mee Asset Name'),
    '#default_value' => isset($mee_asset->name) ? $mee_asset->name : '',
    '#maxlength' => 255,
    '#required' => TRUE,
    '#weight' => -5,
  );

  // $form['data']['#tree'] = TRUE;
  // $form['data']['sample_data'] = array(
  //   '#type' => 'checkbox',
  //   '#title' => t('An interesting mee asset switch'),
  //   '#default_value' => isset($mee_asset->data['sample_data']) ? $mee_asset->data['sample_data'] : 1,
  // );

  // Add the field related form elements.
  $form_state['mee_asset'] = $mee_asset;
  field_attach_form('mee_asset', $mee_asset, $form, $form_state);

  $form['actions'] = array(
    '#type' => 'container',
    '#attributes' => array('class' => array('form-actions')),
    '#weight' => 400,
  );

  // We add the form's #submit array to this button along with the actual submit
  // handler to preserve any submit handlers added by a form callback_wrapper.
  $submit = array();

  if (!empty($form['#submit'])) {
    $submit += $form['#submit'];
  }

  $form['actions']['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Save Asset'),
    '#submit' => $submit + array('mee_asset_edit_form_submit'),
    '#attributes' => array('class'=>array('btn','btn-primary')),
  );

  if($js){
    $form_state['js'] = TRUE;
    $form['#id'] = 'asset-create-form';
    $form['actions']['submit']['#ajax'] = array(
      'callback' => 'mee_asset_edit_form_submit_ajax',
      'wrapper' => 'asset-create-form',
      'method' => 'replace',
      'effect' => 'fade',
    );
    $form['actions']['cancel'] = array(
      '#markup' => l('Cancel', 'asset/browser/'.$mee_asset->type.'/nojs', array('attributes'=>array('class'=>array('use-ajax', 'btn', 'btn-link')))),
    );
  }

  if (!empty($mee_asset->name) && !$js) {
    $form['actions']['delete'] = array(
      '#type' => 'submit',
      '#value' => t('Delete Asset'),
      '#suffix' => l(t('Cancel'), 'admin/content/mee'),
      '#submit' => $submit + array('mee_asset_form_submit_delete'),
      '#weight' => 45,
    );
  }

  // We append the validate handler to #validate in case a form callback_wrapper
  // is used to add validate handlers earlier.
  $form['#validate'][] = 'mee_asset_edit_form_validate';
  return $form;
}

function mee_asset_edit_form_submit_ajax($form, $form_state) {
  module_load_include('inc','mee_asset','mee_asset.page');
  $commands = mee_asset_browser( $form_state['mee_asset']->type, TRUE, TRUE );
  // Flush js cache so new element is updated
  if(!empty($form_state['mee_asset']->id)){
    $commands[] = mee_asset_ajax_command_asset_clear_cache($form_state['mee_asset']->id);
  }
  $page = array('#type' => 'ajax', '#commands' => $commands);
  ajax_deliver($page);
  exit;
}


/**
 * Form API validate callback for the mee_asset form
 */
function mee_asset_edit_form_validate(&$form, &$form_state) {
  $mee_asset = $form_state['mee_asset'];
  // Notify field widgets to validate their data.
  field_attach_form_validate('mee_asset', $mee_asset, $form, $form_state);
}


/**
 * Form API submit callback for the mee_asset form.
 *
 * @todo remove hard-coded link
 */
function mee_asset_edit_form_submit(&$form, &$form_state) {
  $mee_asset = entity_ui_controller('mee_asset')->entityFormSubmitBuildEntity($form, $form_state);
  // Save the mee asset and go back to the list of mee assets

  // Add in created and changed times.
  if ($mee_asset->is_new = isset($mee_asset->is_new) ? $mee_asset->is_new : 0){
    $mee_asset->created = time();
  }

  $mee_asset->changed = time();

  $mee_asset->save();

  if($form_state['js']){
    if(empty($mee_asset->id)){
      drupal_set_message('Asset created successfully.');
    }else{
      drupal_set_message('Asset updated successfully.');
    }
    $form_state['rebuild'] = TRUE;
  }else{
    $form_state['redirect'] = 'admin/content/asset';
  }
}

/**
 * Form API submit callback for the delete button.
 *
 * @todo Remove hard-coded path
 */
function mee_asset_form_submit_delete(&$form, &$form_state) {
  $form_state['redirect'] = 'admin/content/asset/' . $form_state['mee_asset']->id . '/delete';
}


/**
 * Form callback: confirmation form for deleting a mee asset.
 *
 * @param $mee_asset
 *   The mee asset to delete
 *
 * @see confirm_form()
 */
function mee_asset_delete_form($form, &$form_state, $mee_asset) {
  $form_state['mee_asset'] = $mee_asset;

  $form['#submit'][] = 'mee_asset_delete_form_submit';

  $form = confirm_form($form,
    t('Are you sure you want to delete mee asset %name?', array('%name' => $mee_asset->name)),
    'admin/content/asset',
    '<p>' . t('This action cannot be undone.') . '</p>',
    t('Delete'),
    t('Cancel'),
    'confirm'
  );

  return $form;
}

/**
 * Submit callback for mee_asset_delete_form
 */
function mee_asset_delete_form_submit($form, &$form_state) {
  $mee_asset = $form_state['mee_asset'];

  mee_asset_delete($mee_asset);

  drupal_set_message(t('The mee asset %name has been deleted.', array('%name' => $mee_asset->name)));
  watchdog('mee_asset', 'Deleted mee asset %name.', array('%name' => $mee_asset->name));

  $form_state['redirect'] = 'admin/content/asset';
}



/**
 * Page to add Mee Asset Entities.
 *
 * @todo Pass this through a proper theme function
 */
function mee_asset_add_page() {
  $controller = entity_ui_controller('mee_asset');
  return $controller->addPage();
}


/**
 * Displays the list of available mee_asset types for mee_asset creation.
 *
 * @ingroup themeable
 */
function theme_mee_asset_add_list($variables) {
  $content = $variables['content'];
  $output = '';
  if ($content) {
    $output = '<dl class="mee-asset-type-list">';
    foreach ($content as $item) {
      $output .= '<dt>' . l($item['title'], $item['href']) . '</dt>';
      $output .= '<dd>' . filter_xss_admin($item['description']) . '</dd>';
    }
    $output .= '</dl>';
  }
  else {
    if (user_access('administer mee asset types')) {
      $output = '<p>' . t('Mee Asset Entities cannot be added because you have not created any mee asset types yet. Go to the <a href="@create-mee-asset-type">mee asset type creation page</a> to add a new mee asset type.', array('@create-mee-asset-type' => url('admin/structure/mee/add'))) . '</p>';
    }
    else {
      $output = '<p>' . t('No mee asset types have been created yet for you to use.') . '</p>';
    }
  }

  return $output;
}

/**
 * Sets the breadcrumb for administrative mee_asset pages.
 */
function mee_asset_set_breadcrumb() {
  $breadcrumb = array(
    l(t('Home'), '<front>'),
    l(t('Administration'), 'admin'),
    l(t('Content'), 'admin/content'),
    l(t('Assets'), 'admin/content/asset'),
  );
  drupal_set_breadcrumb($breadcrumb);
}



