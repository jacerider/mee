<?php

/**
 * Asset browser.
 *
 * @author JaceRider
 *
 * @param  $type
 *   The bundled asset to load a browser for.
 */
function mee_asset_browser( $type, $category_tid = NULL, $js = FALSE, $return_commands = FALSE ) {

  $output = array();
  $output['#prefix'] = '<div class="asset-browser-inner clearfix">';
  $output['#suffix'] = '</div>';

  $output['taxonomy'] = array(
    '#markup' => mee_asset_categories($type, $category_tid),
    '#weight' => -5,
  );

  $view = views_get_view('mee_assets_browser_' . $type);
  if(!empty($category_tid)) $view->set_arguments(array($category_tid));
  $output['view']['#markup'] = $view->preview('default');
  $view->destroy();

  $output['status'] = array(
    '#markup' => theme('status_messages'),
    '#weight' => -10,
  );

  if( $js != 'ajax'){
    return $output;
  }

  $commands = array();
  $commands[] = ajax_command_html('#asset-browser', drupal_render($output));
  $commands[] = ajax_command_invoke('#mee-widget', 'removeClass', array('mee-widget-expanded'));
  if($return_commands){
    return $commands;
  }
  $page = array('#type' => 'ajax', '#commands' => $commands);
  ajax_deliver($page);
  exit;
}

/**
 * Render an asset
 *
 * @author JaceRider
 *
 * @param  $asset_id
 *   The asset ID.
 * @param  $id
 *   The instance ID. Will be 0 if no instance is used.
 * @param  $js
 *   Boolean if is a javascript request.
 */
function mee_asset_preview( $asset_id, $instance_id, $js = FALSE ){

  $output = mee_asset_view($asset_id, $instance_id, TRUE);

  if( $js != 'ajax'){
    return $output;
  }

  $commands = array();
  $commands[] = mee_asset_ajax_command_asset_preview_insert($asset_id, $instance_id, drupal_render($output));
  $page = array('#type' => 'ajax', '#commands' => $commands);
  ajax_deliver($page);
  exit;
}

/**
 * Instace settings for an asset
 *
 * @author JaceRider
 *
 * @param  $id
 *   The entity ID.
 * @param  $js
 *   Boolean if is a javascript request.
 */
function mee_asset_instance( $id, $js = FALSE ){
  $output = array();
  $asset = mee_asset_load( $id );

  $output['view'] = array(
    '#markup' => '<h3>' . t('Settings') . ' for <strong>' . $asset->name . '</strong></h3>',
    '#weight' => -9,
  );
  $output['form'] = drupal_get_form('mee_asset_instance_form', $asset);

  $output['status'] = array(
    '#markup' => theme('status_messages'),
    '#weight' => -10,
  );

  if( $js != 'ajax'){
    return $output;
  }

  $commands = array();
  $commands[] = ajax_command_html('#asset-browser', drupal_render($output));
  $page = array('#type' => 'ajax', '#commands' => $commands);
  ajax_deliver($page);
  exit;
}

function mee_asset_instance_form($form, &$form_state, $asset){
  module_load_include('inc', 'mee_asset', 'mee_asset.page');

  $form_state['mee_asset'] = $asset;
  $form['#id'] = 'asset-instance-form';

  $bundle = mee_asset_type_load($asset->type);
  $form_state['bundle'] = $bundle;
  if($active = array_filter($bundle->data['instances'])){
    $instances = mee_get_plugin('instance');
    foreach($active as $instance_type => $settings){
      $handler = _mee_get_handler('instance', $instance_type);
      $form['data']['#tree'] = TRUE;
      $instance = $instances[$instance_type];
      if(!empty($instance['css_admin'])){
        $form['data']['#attached']['css'][] = drupal_get_path('module', $instance['module']) . '/' . $instance['css_admin'];
      }
      $handler->instance_form($form['data'], $form_state, $settings);
    }
  }

  $form['actions'] = array('#type' => 'actions');
  $form['actions']['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Insert'),
    '#attributes' => array('class'=>array('btn', 'btn-success')),
    //'#submit' => array('mee_asset_instance_form_submit'),
  );
  $form['actions']['submit']['#ajax'] = array(
    'callback' => 'mee_asset_instance_form_submit_ajax',
    'wrapper' => 'asset-instance-form',
    'method' => 'replace',
    'effect' => 'fade',
  );
  $form['actions']['cancel'] = array(
    '#markup' => l('Cancel', 'asset/browser/'.$asset->type.'/all/nojs', array('attributes'=>array('class'=>array('use-ajax', 'btn', 'btn-link')))),
  );

  return $form;
}

/**
 * Form API AJAX submit callback for the asset instance form.
 */
function mee_asset_instance_form_preview_ajax($form, &$form_state){
  return $form;
}

/**
 * Form API AJAX submit callback for the asset instance form.
 */
function mee_asset_instance_form_submit_ajax($form, &$form_state){
  $asset = $form_state['mee_asset'];
  if(!form_get_errors()){
    $commands = array();
    $commands[] = mee_asset_ajax_command_asset_insert($asset->id, $form_state['instance_id']);
    $page = array('#type' => 'ajax', '#commands' => $commands);
    ajax_deliver($page);
    exit;
  }else{
    return $form;
  }
}

/**
 * Form API submit callback for the asset instance form.
 */
function mee_asset_instance_form_submit(&$form, &$form_state){
  if(!empty($form_state['values']['data'])){
    // Save the asset instance settings
    $form_state['instance_id'] = mee_asset_instance_save($form_state['values']['data']);
  }
}

/**
 * Remove an asset
 *
 * @author JaceRider
 *
 * @param  $id
 *   The entity ID.
 * @param  $js
 *   Boolean if is a javascript request.
 */
function mee_asset_remove( $id, $js = FALSE ){

  $output = array();

  $asset = mee_asset_load( $id );

  $output['view'] = array(
    '#markup' => '<h3>' . t('Delete') . ' <strong>' . $asset->name . '</strong></h3>',
    '#weight' => -9,
  );
  $output['message'] = array(
    '#markup' => '<div class="lead">' . t('Are you sure you want to delete this asset?') . '</div>',
    '#weight' => -8,
  );
  if($usage = mee_asset_usage_list( $asset->id )){
    $output['usage'] = array(
      '#markup' => '<div class="alert alert-error"><h4>Warning!</h4>' . $usage . '</div>',
      '#weight' => -7,
    );
  }else{
    $output['usage'] = array(
      '#markup' => '<div class="alert alert-info"><h4>No Worries</h4>' . t('This asset is not used anywhere on your site.') . ' <strong> ' . t('Feel at peace as you delete it.') . '</strong> ' . t('This action cannot be undone.') . '</div>',
      '#weight' => -7,
    );
  }
  $output['form'] = drupal_get_form('mee_asset_remove_form', $asset);

  $output['status'] = array(
    '#markup' => theme('status_messages'),
    '#weight' => -10,
  );

  if( $js != 'ajax'){
    return $output;
  }

  $commands = array();
  $commands[] = ajax_command_html('#asset-browser', drupal_render($output));
  $page = array('#type' => 'ajax', '#commands' => $commands);
  ajax_deliver($page);
  exit;
}

function mee_asset_remove_form($form, &$form_state, $asset){

  $form_state['mee_asset'] = $asset;
  $form['#id'] = 'asset-remove-form';

  $form['actions'] = array('#type' => 'actions');
  $form['actions']['delete'] = array(
    '#type' => 'button',
    '#value' => t('Delete'),
    '#attributes' => array('class'=>array('btn', 'btn-danger')),
  );
  $form['actions']['delete']['#ajax'] = array(
    'callback' => 'mee_asset_remove_form_submit_ajax',
    'wrapper' => 'asset-remove-form',
    'method' => 'replace',
    'effect' => 'fade',
  );
  $form['actions']['cancel'] = array(
    '#markup' => l('Cancel', 'asset/browser/'.$asset->type.'/all/nojs', array('attributes'=>array('class'=>array('use-ajax', 'btn', 'btn-link')))),
  );

  return $form;
}

function mee_asset_remove_form_submit_ajax($form, &$form_state){
  $asset = $form_state['mee_asset'];
  mee_asset_delete( $asset );
  return mee_asset_browser( $asset->type, NULL, TRUE );
}

/**
 * Category toolbar display.
 */
function mee_asset_categories($type, $category_tid){
  $output = '';

  $taxonomy = taxonomy_vocabulary_machine_name_load('asset_category');
  $terms = taxonomy_get_tree($taxonomy->vid);
  $current_name = 'All';
  $current_id = 'all';

  $options = array();
  foreach($terms as $term){
    $count = db_query("SELECT COUNT(entity_id) FROM {field_data_field_asset_category} WHERE field_asset_category_tid = :tid AND bundle = :bundle", array(':tid' => $term->tid, ':bundle' => $type) )->fetchField();
    if($category_tid == $term->tid){
      $current_name = $term->name;
      $current_id = $term->tid;
    }
    if(!empty($count)){
      $options[$term->tid] = l('<i class="icon-folder-close"></i> '.$term->name,'asset/browser/'.$type.'/' . $term->tid . '/nojs', array('html'=>true, 'attributes'=>array('class'=>array('use-ajax'))));
    }
  }
  $output .= '<div class="asset-category-info btn-group">';
  $output .=  '<span class="btn btn-mini disabled">Showing</span>';
  $output .=  l($current_name,'asset/browser/'.$type.'/'.$current_id.'/nojs', array('attributes'=>array('class'=>array('btn', 'btn-mini', 'asset-category-change', 'btn-info'))));
  $output .=  l('<i class="icon-edit"></i>','asset/categories/'.$type.'/nojs', array('html'=>true, 'attributes'=>array('class'=>array('btn', 'btn-mini', 'use-ajax'))));
  $output .= '</div>';
  if(!empty($options)){
    array_unshift($options, l('<i class="icon-folder-close"></i> All','asset/browser/'.$type.'/all/nojs', array('html'=>true, 'attributes'=>array('class'=>array('use-ajax')))));
    $output .=  theme('item_list', array('items'=>$options, 'attributes'=>array('class'=>array('asset-category-list'))));
  }

  return $output;
}

/**
 * Remove an asset
 *
 * @author JaceRider
 *
 * @param  $id
 *   The entity ID.
 * @param  $js
 *   Boolean if is a javascript request.
 */
function mee_asset_categories_manage( $type, $js = FALSE ){

  $output = array();

  $output['view'] = array(
    '#markup' => '<h3>' . t('Manage') . ' <strong> ' . t('Categories') . '</strong></h3>',
    '#weight' => -9,
  );

  $output['form'] = drupal_get_form('mee_asset_categories_manage_form', $type);

  $output['status'] = array(
    '#markup' => theme('status_messages'),
    '#weight' => -10,
  );

  if( $js != 'ajax'){
    return $output;
  }

  $commands = array();
  $commands[] = ajax_command_html('#asset-browser', drupal_render($output));
  $page = array('#type' => 'ajax', '#commands' => $commands);
  ajax_deliver($page);
  exit;
}

function mee_asset_categories_manage_form($form, &$form_state, $type){

  $form['#id'] = 'asset-categories-form';
  $form_state['asset_type'] = $type;

  $taxonomy = taxonomy_vocabulary_machine_name_load('asset_category');
  $terms = taxonomy_get_tree($taxonomy->vid);
  $options = array('' => '-- None --');
  foreach($terms as $term){
    $options[$term->tid] = $term->name;
  }

  $form['create'] = array(
    '#type' => 'textfield',
    '#title' => '<i class="icon-plus text-success"></i> ' . t('Create a new category'),
    '#description' => t('To create a new category, simply give it a name and click submit. You will then be able to add any assets to this category.'),
    '#suffix' => '<hr />',
  );

  $form['remove'] = array(
    '#type' => 'select',
    '#title' => '<i class="icon-remove text-error"></i> ' . t('Remove an existing category'),
    '#options' => $options,
    '#description' => t('Selecting a category and clicking submit will cause the selected category to be deleted. None of the assets inside the category will be lost and will still be available in the "all" category.'),
  );

  $form['actions'] = array('#type' => 'actions');
  $form['actions']['submit'] = array(
    '#type' => 'button',
    '#value' => t('Submit'),
    '#attributes' => array('class'=>array('btn', 'btn-primary')),
  );
  $form['actions']['submit']['#ajax'] = array(
    'callback' => 'mee_asset_categories_manage_form_submit_ajax',
    'wrapper' => 'asset-categories-form',
    'method' => 'replace',
    'effect' => 'fade',
  );
  $form['actions']['cancel'] = array(
    '#markup' => l('Cancel', 'asset/browser/'.$type.'/all/nojs', array('attributes'=>array('class'=>array('use-ajax', 'btn', 'btn-link')))),
  );

  return $form;
}

function mee_asset_categories_manage_form_submit_ajax($form, &$form_state){
  $type = $form_state['asset_type'];
  $values = $form_state['values'];
  $message = array();
  if(!empty($values['create'])){
    $taxonomy = taxonomy_vocabulary_machine_name_load('asset_category');
    $term = new stdClass();
    $term->name = $values['create'];
    $term->vid = $taxonomy->vid;
    taxonomy_term_save($term);
    $message[] = t('category "%name" has been created', array('%name'=>$term->name));
  }
  if(!empty($values['remove'])){
    $term = taxonomy_term_load($values['remove']);
    if(!empty($term)){
      taxonomy_term_delete($values['remove']);
      $message[] = t('category "%name" has been removed', array('%name'=>$term->name));
    }
  }
  if(!empty($message)){
    drupal_set_message(ucfirst(implode(' and ', $message)) . '.');
  }
  return mee_asset_browser( $type, NULL, TRUE );
}
