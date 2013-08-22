<?php

class Mee_InstanceHandler_Link extends Mee_InstanceHandler_Abstract {

  public function instance_form(&$form, &$form_state, $settings) {
    $form['link'] = array(
      '#id' => 'instance-asset-link',
      '#type' => 'textfield',
      '#title' => t('Link URL'),
      '#size' => 60,
      '#maxlength' => 128,
      '#weight' => 1,
    );

    if(module_exists('linkit')){
      _linkit_add_settings('field');
      ctools_include('plugins');
      // Try to load the insert plugin we have chosen to use.
      $plugin = ctools_get_plugins('linkit', 'linkit_insert', 'raw_url');

      $element = &$form['link'];
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
  }

  public function instance_render(&$element, $settings) {
    if(empty($settings['link'])) return;
    foreach (element_children($element['asset']) as $key) {
      foreach (element_children($element['asset'][$key]) as $delta) {
        $field = &$element['asset'][$key][$delta];
        $prefix = '<a href="' . $settings['link'] . '">';
        $suffix = '</a>';
        $field['#prefix'] = $prefix . (!empty($field['#prefix']) ? $field['#prefix'] : '');
        $field['#suffix'] = (!empty($field['#suffix']) ? $field['#suffix'] : '') . $suffix;
      }
    }
  }

}
