<?php

/**
 * @file
 * Providing extra functionality for the Model UI via views.
 */


/**
 * Implements hook_views_data()
 */
function mee_asset_views_data_alter(&$data) {

  // Browse fields
  $data['mee_asset']['asset_select'] = array(
    'field' => array(
      'title' => t('Asset Select'),
      'help' => t('A selection element for Mee asset browser.'),
      'handler' => 'mee_asset_handler_asset_select_field',
    ),
  );

  // Index Fields
  $data['mee_asset']['link_mee_asset'] = array(
    'field' => array(
      'title' => t('Link'),
      'help' => t('Provide a link to the mee asset.'),
      'handler' => 'mee_asset_handler_link_field',
    ),
  );
  $data['mee_asset']['edit_mee_asset'] = array(
    'field' => array(
      'title' => t('Edit Link'),
      'help' => t('Provide a link to the edit form for the mee asset.'),
      'handler' => 'mee_asset_handler_edit_link_field',
    ),
  );
  $data['mee_asset']['delete_mee_asset'] = array(
    'field' => array(
      'title' => t('Delete Link'),
      'help' => t('Provide a link to delete the mee asset.'),
      'handler' => 'mee_asset_handler_delete_link_field',
    ),
  );
  // This content of this field are decided based on the menu structure that
  // follows mee_assets/mee_asset/%mee_asset_id/op
  $data['mee_asset']['operations'] = array(
    'field' => array(
      'title' => t('Operations links'),
      'help' => t('Display all operations available for this mee asset.'),
      'handler' => 'mee_asset_handler_mee_asset_operations_field',
    ),
  );
}


/**
 * Implements hook_views_default_views().
 */
function mee_asset_views_default_views() {
  $views = array();

  $entity = entity_get_info('mee_asset');
  $bundles = entity_load('mee_asset_type', array_keys($entity['bundles']));
  foreach($bundles as $bundle){
    $views[] = mee_asset_views_default_views_browser( $bundle );
  }

  $views[] = mee_asset_views_default_views_admin_list();
  return $views;

}

/**
 * Mee asset browser
 */
function mee_asset_views_default_views_browser( $bundle ){

  $view = new view;
  $view->name = 'mee_assets_browser_' . $bundle->type;
  $view->description = 'A view used by Mee to list assets of this type.';
  $view->tag = 'default';
  $view->base_table = 'mee_asset';
  $view->human_name = 'Assets | ' . $bundle->label;
  $view->core = 7;
  $view->api_version = '3.0';
  $view->disabled = FALSE; /* Edit this to true to make a default view disabled initially */

  /* Display: Master */
  $handler = $view->new_display('default', 'Master', 'default');
  $handler->display->display_options['use_ajax'] = TRUE;
  $handler->display->display_options['use_more_always'] = FALSE;
  $handler->display->display_options['access']['type'] = 'none';
  $handler->display->display_options['cache']['type'] = 'none';
  $handler->display->display_options['query']['type'] = 'views_query';
  $handler->display->display_options['exposed_form']['type'] = 'basic';
  $handler->display->display_options['pager']['type'] = 'full';
  $handler->display->display_options['pager']['options']['items_per_page'] = '8';
  $handler->display->display_options['pager']['options']['offset'] = '0';
  $handler->display->display_options['pager']['options']['id'] = '0';
  $handler->display->display_options['pager']['options']['quantity'] = '9';
  $handler->display->display_options['style_plugin'] = 'grid';
  $handler->display->display_options['row_plugin'] = 'fields';
  /* Field: Asset: Name */
  $handler->display->display_options['fields']['name']['id'] = 'name';
  $handler->display->display_options['fields']['name']['table'] = 'mee_asset';
  $handler->display->display_options['fields']['name']['field'] = 'name';
  $handler->display->display_options['fields']['name']['label'] = '';
  $handler->display->display_options['fields']['name']['element_label_colon'] = FALSE;
  /* Field: Asset: Asset Select */
  $handler->display->display_options['fields']['asset_select']['id'] = 'asset_select';
  $handler->display->display_options['fields']['asset_select']['table'] = 'mee_asset';
  $handler->display->display_options['fields']['asset_select']['field'] = 'asset_select';
  $handler->display->display_options['fields']['asset_select']['label'] = '';
  $handler->display->display_options['fields']['asset_select']['element_type'] = '0';
  $handler->display->display_options['fields']['asset_select']['element_label_colon'] = FALSE;
  $handler->display->display_options['fields']['asset_select']['element_wrapper_type'] = '0';
  $handler->display->display_options['fields']['asset_select']['element_default_classes'] = FALSE;
  /* Sort criterion: Asset: Created */
  $handler->display->display_options['sorts']['created']['id'] = 'created';
  $handler->display->display_options['sorts']['created']['table'] = 'mee_asset';
  $handler->display->display_options['sorts']['created']['field'] = 'created';
  $handler->display->display_options['sorts']['created']['order'] = 'DESC';
  /* Filter criterion: Asset: Type */
  $handler->display->display_options['filters']['type']['id'] = 'type';
  $handler->display->display_options['filters']['type']['table'] = 'mee_asset';
  $handler->display->display_options['filters']['type']['field'] = 'type';
  $handler->display->display_options['filters']['type']['value'] = array(
    $bundle->type => $bundle->type,
  );
  $handler->display->display_options['filters']['type']['group'] = 1;

  return $view;

}

/**
 * Mee asset admin list
 *
 */
function mee_asset_views_default_views_admin_list() {

  $view = new view;
  $view->name = 'mee_assets_list';
  $view->description = 'A list of all mee assets';
  $view->tag = 'mee';
  $view->base_table = 'mee_asset';
  $view->human_name = 'Assets';
  $view->core = 7;
  $view->api_version = '3.0-alpha1';
  $view->disabled = FALSE; /* Edit this to true to make a default view disabled initially */

  /* Display: Master */
  $handler = $view->new_display('default', 'Master', 'default');
  $handler->display->display_options['title'] = 'Assets';
  $handler->display->display_options['access']['type'] = 'perm';
  $handler->display->display_options['access']['perm'] = 'create any mee asset type';
  $handler->display->display_options['cache']['type'] = 'none';
  $handler->display->display_options['query']['type'] = 'views_query';
  $handler->display->display_options['exposed_form']['type'] = 'basic';
  $handler->display->display_options['pager']['type'] = 'full';
  $handler->display->display_options['pager']['options']['items_per_page'] = '10';
  $handler->display->display_options['style_plugin'] = 'table';
  $handler->display->display_options['style_options']['columns'] = array(
    'name' => 'name',
    'mee_asset_id' => 'mee_asset_id',
  );
  $handler->display->display_options['style_options']['default'] = '-1';
  $handler->display->display_options['style_options']['info'] = array(
    'name' => array(
      'sortable' => 0,
      'default_sort_order' => 'asc',
      'align' => '',
      'separator' => '',
    ),
    'mee_asset_id' => array(
      'sortable' => 0,
      'default_sort_order' => 'asc',
      'align' => '',
      'separator' => '',
    ),
  );
  $handler->display->display_options['style_options']['override'] = 1;
  $handler->display->display_options['style_options']['sticky'] = 0;
  $handler->display->display_options['style_options']['empty_table'] = 0;
  /* No results behavior: Global: Text area */
  $handler->display->display_options['empty']['area']['id'] = 'area';
  $handler->display->display_options['empty']['area']['table'] = 'views';
  $handler->display->display_options['empty']['area']['field'] = 'area';
  $handler->display->display_options['empty']['area']['label'] = 'Empty ';
  $handler->display->display_options['empty']['area']['empty'] = FALSE;
  $handler->display->display_options['empty']['area']['content'] = 'No mee_assets have been created yet';
  /* Field: Model: Model ID */
  $handler->display->display_options['fields']['mee_asset_id']['id'] = 'mee_asset_id';
  $handler->display->display_options['fields']['mee_asset_id']['table'] = 'mee_asset';
  $handler->display->display_options['fields']['mee_asset_id']['field'] = 'mee_asset_id';
  $handler->display->display_options['fields']['mee_asset_id']['alter']['alter_text'] = 0;
  $handler->display->display_options['fields']['mee_asset_id']['alter']['make_link'] = 0;
  $handler->display->display_options['fields']['mee_asset_id']['alter']['absolute'] = 0;
  $handler->display->display_options['fields']['mee_asset_id']['alter']['external'] = 0;
  $handler->display->display_options['fields']['mee_asset_id']['alter']['replace_spaces'] = 0;
  $handler->display->display_options['fields']['mee_asset_id']['alter']['trim'] = 0;
  $handler->display->display_options['fields']['mee_asset_id']['alter']['nl2br'] = 0;
  $handler->display->display_options['fields']['mee_asset_id']['alter']['word_boundary'] = 1;
  $handler->display->display_options['fields']['mee_asset_id']['alter']['ellipsis'] = 1;
  $handler->display->display_options['fields']['mee_asset_id']['alter']['strip_tags'] = 0;
  $handler->display->display_options['fields']['mee_asset_id']['alter']['html'] = 0;
  $handler->display->display_options['fields']['mee_asset_id']['element_label_colon'] = 1;
  $handler->display->display_options['fields']['mee_asset_id']['element_default_classes'] = 1;
  $handler->display->display_options['fields']['mee_asset_id']['hide_empty'] = 0;
  $handler->display->display_options['fields']['mee_asset_id']['empty_zero'] = 0;
  /* Field: Model: Name */
  $handler->display->display_options['fields']['name']['id'] = 'name';
  $handler->display->display_options['fields']['name']['table'] = 'mee_asset';
  $handler->display->display_options['fields']['name']['field'] = 'name';
  $handler->display->display_options['fields']['name']['alter']['alter_text'] = 0;
  $handler->display->display_options['fields']['name']['alter']['make_link'] = 0;
  $handler->display->display_options['fields']['name']['alter']['absolute'] = 0;
  $handler->display->display_options['fields']['name']['alter']['external'] = 0;
  $handler->display->display_options['fields']['name']['alter']['replace_spaces'] = 0;
  $handler->display->display_options['fields']['name']['alter']['trim'] = 0;
  $handler->display->display_options['fields']['name']['alter']['nl2br'] = 0;
  $handler->display->display_options['fields']['name']['alter']['word_boundary'] = 1;
  $handler->display->display_options['fields']['name']['alter']['ellipsis'] = 1;
  $handler->display->display_options['fields']['name']['alter']['strip_tags'] = 0;
  $handler->display->display_options['fields']['name']['alter']['html'] = 0;
  $handler->display->display_options['fields']['name']['element_label_colon'] = 1;
  $handler->display->display_options['fields']['name']['element_default_classes'] = 1;
  $handler->display->display_options['fields']['name']['hide_empty'] = 0;
  $handler->display->display_options['fields']['name']['empty_zero'] = 0;
  /* Field: Model: Link */
  $handler->display->display_options['fields']['link_mee_asset']['id'] = 'link_mee_asset';
  $handler->display->display_options['fields']['link_mee_asset']['table'] = 'mee_asset';
  $handler->display->display_options['fields']['link_mee_asset']['field'] = 'link_mee_asset';
  $handler->display->display_options['fields']['link_mee_asset']['label'] = 'View';
  $handler->display->display_options['fields']['link_mee_asset']['alter']['alter_text'] = 0;
  $handler->display->display_options['fields']['link_mee_asset']['alter']['make_link'] = 0;
  $handler->display->display_options['fields']['link_mee_asset']['alter']['absolute'] = 0;
  $handler->display->display_options['fields']['link_mee_asset']['alter']['external'] = 0;
  $handler->display->display_options['fields']['link_mee_asset']['alter']['replace_spaces'] = 0;
  $handler->display->display_options['fields']['link_mee_asset']['alter']['trim'] = 0;
  $handler->display->display_options['fields']['link_mee_asset']['alter']['nl2br'] = 0;
  $handler->display->display_options['fields']['link_mee_asset']['alter']['word_boundary'] = 1;
  $handler->display->display_options['fields']['link_mee_asset']['alter']['ellipsis'] = 1;
  $handler->display->display_options['fields']['link_mee_asset']['alter']['strip_tags'] = 0;
  $handler->display->display_options['fields']['link_mee_asset']['alter']['html'] = 0;
  $handler->display->display_options['fields']['link_mee_asset']['element_label_colon'] = 1;
  $handler->display->display_options['fields']['link_mee_asset']['element_default_classes'] = 1;
  $handler->display->display_options['fields']['link_mee_asset']['hide_empty'] = 0;
  $handler->display->display_options['fields']['link_mee_asset']['empty_zero'] = 0;
  /* Field: Model: Operations links */
  $handler->display->display_options['fields']['operations']['id'] = 'operations';
  $handler->display->display_options['fields']['operations']['table'] = 'mee_asset';
  $handler->display->display_options['fields']['operations']['field'] = 'operations';
  $handler->display->display_options['fields']['operations']['alter']['alter_text'] = 0;
  $handler->display->display_options['fields']['operations']['alter']['make_link'] = 0;
  $handler->display->display_options['fields']['operations']['alter']['absolute'] = 0;
  $handler->display->display_options['fields']['operations']['alter']['external'] = 0;
  $handler->display->display_options['fields']['operations']['alter']['replace_spaces'] = 0;
  $handler->display->display_options['fields']['operations']['alter']['trim'] = 0;
  $handler->display->display_options['fields']['operations']['alter']['nl2br'] = 0;
  $handler->display->display_options['fields']['operations']['alter']['word_boundary'] = 1;
  $handler->display->display_options['fields']['operations']['alter']['ellipsis'] = 1;
  $handler->display->display_options['fields']['operations']['alter']['strip_tags'] = 0;
  $handler->display->display_options['fields']['operations']['alter']['html'] = 0;
  $handler->display->display_options['fields']['operations']['element_label_colon'] = 1;
  $handler->display->display_options['fields']['operations']['element_default_classes'] = 1;
  $handler->display->display_options['fields']['operations']['hide_empty'] = 0;
  $handler->display->display_options['fields']['operations']['empty_zero'] = 0;

  /* Display: Page */
  $handler = $view->new_display('page', 'Page', 'mee_assets_admin_page');
  $handler->display->display_options['path'] = 'admin/content/asset/list';
  $handler->display->display_options['menu']['type'] = 'default tab';
  $handler->display->display_options['menu']['title'] = 'List';
  $handler->display->display_options['menu']['weight'] = '-10';
  $handler->display->display_options['tab_options']['type'] = 'tab';
  $handler->display->display_options['tab_options']['title'] = 'Assets';
  $handler->display->display_options['tab_options']['description'] = 'Manage mee assets';
  $handler->display->display_options['tab_options']['weight'] = '0';
  $handler->display->display_options['tab_options']['name'] = 'management';
  $translatables['mee_assets'] = array(
    t('Master'),
    t('Assets'),
    t('more'),
    t('Apply'),
    t('Reset'),
    t('Sort by'),
    t('Asc'),
    t('Desc'),
    t('Items per page'),
    t('- All -'),
    t('Offset'),
    t('Empty '),
    t('No mee assets have been created yet'),
    t('Mee ID'),
    t('.'),
    t(','),
    t('Name'),
    t('View'),
    t('Operations links'),
    t('Page'),
  );
  return $view;

}


