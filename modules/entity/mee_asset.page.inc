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
}

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

}
