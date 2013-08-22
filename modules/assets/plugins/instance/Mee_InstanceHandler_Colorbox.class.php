<?php

class Mee_InstanceHandler_Colorbox extends Mee_InstanceHandler_Abstract {

  public function settings_form(&$form, &$form_state, $defaults) {
    $styles = image_styles();
    $form['colorbox_style'] = array(
      '#type' => 'radios',
      '#title' => t('Full size'),
      '#options' => drupal_map_assoc(array_keys($styles)),
      '#default_value' => empty($defaults['colorbox_style']) ? '' : $defaults['colorbox_style'],
    );
  }

  public function instance_form(&$form, &$form_state, $settings) {
    $form['colorbox'] = array(
      '#type' => 'checkbox',
      '#title' => t('Use lightbox'),
      '#weight' => 5,
    );
  }

  public function instance_render(&$element, $settings) {
    if(empty($settings['colorbox'])) return;
    _colorbox_active();
    foreach (element_children($element['asset']) as $key) {
      foreach (element_children($element['asset'][$key]) as $delta) {
        $field = $element['asset'][$key][$delta];
        // Remove original image
        $element['asset'][$key][$delta] = array();
        $options = array(
          'html' => TRUE,
          'attributes' => array(
            'class' => 'colorbox',
          )
        );
        $element['asset'][$key]['#items']['colorbox'] = TRUE;
        $element['asset'][$key]['colorbox'] = array(
          '#theme' => 'link',
          '#text' => drupal_render($field),
          '#path' => image_style_url($settings['instance']['colorbox_style'], $field['#item']['uri']),
          '#options' => $options,
        );
      }
    }
  }

}
