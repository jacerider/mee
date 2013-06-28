<?php

/**
 * Asset browser.
 *
 * @author JaceRider
 *
 * @param  $type
 *   The bundled asset to load a browser for.
 */
function mee_asset_browser( $type, $js = FALSE ) {

  $output = array();
  $output['#prefix'] = '<div class="asset-browser-inner clearfix">';
  $output['#suffix'] = '</div>';

  $output['status'] = array(
    '#markup' => theme('status_messages')
  );

  $view = views_get_view('mee_assets_browser_' . $type);
  $output['view']['#markup'] = $view->preview('default');
  $view->destroy();

  if( $js != 'ajax'){
    return $output;
  }

  $commands = array();
  $commands[] = ajax_command_html('#asset-browser', drupal_render($output));
  $commands[] = ajax_command_invoke('#mee-widget', 'removeClass', array('mee-widget-expanded'));
  $page = array('#type' => 'ajax', '#commands' => $commands);
  ajax_deliver($page);
  exit;
}

/**
 * Render an asset
 *
 * @author JaceRider
 *
 * @param  $type
 *   The asset entity bundle.
 * @param  $id
 *   The entity ID.
 * @param  $js
 *   Boolean if is a javascript request.
 */
function mee_asset_view( $type, $id, $js = FALSE ){

  $output = array();

  $asset = mee_asset_load( $id );
  $output['view'] = entity_view('mee_asset', array($asset), $view_mode = 'full');

  if( $js != 'ajax'){
    return $output;
  }

  $commands = array();
  $commands[] = mee_asset_ajax_command_asset_insert('.asset-'.$type.'-'.$id, drupal_render($output));
  $page = array('#type' => 'ajax', '#commands' => $commands);
  ajax_deliver($page);
  exit;
}

/**
 * Render an asset
 *
 * @author JaceRider
 *
 * @param  $type
 *   The asset entity bundle.
 * @param  $id
 *   The entity ID.
 * @param  $js
 *   Boolean if is a javascript request.
 */
function mee_asset_remove( $type, $id, $js = FALSE ){

  $output = array();

  $asset = mee_asset_load( $id );

  $output['status'] = array(
    '#markup' => theme('status_messages')
  );
  $output['view'] = array(
    '#markup' => '<h3>' . t('Delete') . ' ' . $asset->name . '</h3>'
  );
  $output['message'] = array(
    '#markup' => '<div class="alert">' . t('Are you sure you want to delete this asset?') . '</div>'
  );
  $output['form'] = drupal_get_form('mee_asset_remove_form', $asset);

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
    '#markup' => l('Cancel', 'asset/browser/'.$asset->type.'/nojs', array('attributes'=>array('class'=>array('use-ajax', 'btn', 'btn-link')))),
  );

  return $form;
}

function mee_asset_remove_form_submit_ajax($form, &$form_state){
  $asset = $form_state['mee_asset'];
  mee_asset_delete( $asset );
  return mee_asset_browser( $asset->type, TRUE );
}
