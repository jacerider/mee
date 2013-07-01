<?php

function mee_link_selector($js = FALSE){
  $output = array();

  $output['form'] = drupal_get_form('mee_link_selector_form');

  if( $js != 'ajax'){
    return $output;
  }

  $commands = array();
  $commands[] = ajax_command_html('#mee-link-browser', drupal_render($output));
  $page = array('#type' => 'ajax', '#commands' => $commands);
  ajax_deliver($page);
  exit;
}

function mee_link_selector_form($form, &$form_state){

  $form['#id'] = 'mee-link-form';

  $form['title'] = array(
    '#type' => 'textfield',
    '#title' => t('Text to display'),
    '#size' => 60,
    '#maxlength' => 128,
    '#attributes' => array('class'=>array('input-block-level')),
    '#id' => 'mee-link-title'
  );


  $form['tabs'] = array(
     '#type' => 'vertical_tabs',
  );

  $form['web'] = array(
    '#type' => 'fieldset',
    '#title' => t('Web address'),
    '#collapsible' => TRUE,
    '#collapsed' => FALSE,
    '#group' => 'tabs',
  );

  $form['web']['url'] = array(
    '#type' => 'textfield',
    '#title' => t('URL for the link'),
    '#size' => 60,
    '#maxlength' => 128,
    '#attributes' => array('class'=>array('input-block-level'),'data-type'=>'raw'),
    '#id' => 'mee-web'
  );

  if(module_exists('linkit')){
    _linkit_add_settings('field');
    ctools_include('plugins');
    // Try to load the insert plugin we have chosen to use.
    $plugin = ctools_get_plugins('linkit', 'linkit_insert', 'raw_url');

    $element = &$form['web']['url'];
    $field_id = $element['#id'];
    // Special treatment for link fields.
    if ($element['#type'] == 'link_field') {
      $field_id = $element['#id'] . '-url';
    }

    $field_js = array(
      'data' => array(
        'linkit' => array(
          'fields' => array(
            $field_id => array(
              'insert_plugin' => 'raw_url',
            ),
          ),
        ),
      ),
      'type' => 'setting',
    );

    // Spcial settings for link fields.
    if ($element['#type'] == 'link_field') {
      $field_js['data']['linkit']['fields'][$field_id]['no_slash'] = TRUE;
      // Link fields can have a title field.
      if (isset($instance['settings']['title']) && in_array($instance['settings']['title'], array('optional', 'required'))) {
        $field_js['data']['linkit']['fields'][$field_id]['title_field'] = $element['#id'] . '-title';
      }
    }

    // Attach js files and settings Linkit needs.
    $element += array(
      '#attached' => array(
        'js' => array(
          $plugin['javascript'],
          $field_js,
        ),
      ),
    );

    $element['#suffix'] = '<a class="btn linkit-field-button linkit-field-' . $field_id . '" href="#">' . t('Search local content') . '</a>';
  }

  $form['email'] = array(
    '#type' => 'fieldset',
    '#title' => t('Email'),
    '#collapsible' => TRUE,
    '#collapsed' => FALSE,
    '#group' => 'tabs',
  );

  $form['email']['url'] = array(
    '#type' => 'textfield',
    '#title' => t('Email address for the link'),
    '#size' => 60,
    '#maxlength' => 128,
    '#attributes' => array('class'=>array('input-block-level'),'data-type'=>'email'),
  );

  return $form;
}
