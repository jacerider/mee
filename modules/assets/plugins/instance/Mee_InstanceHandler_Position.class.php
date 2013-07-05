<?php

class Mee_InstanceHandler_Position extends Mee_InstanceHandler_Abstract {

  public function instance_form(&$form, &$form_state, $settings) {
    $form['position'] = array(
      '#type' => 'select',
      '#title' => t('Position'),
      '#required' => TRUE,
      '#options' => array(
        'left' => t('Left'),
        'right' => t('Right'),
        'center' => t('Center'),
      ),
      '#ajax' => array(
        'callback' => 'mee_asset_instance_form_preview_ajax',
        'wrapper' => 'asset-instance-form',
        'method' => 'replace',
        'effect' => 'none',
      ),
    );
  }

  public function instance_render(&$element, $settings) {
    if(!empty($settings['position'])){
      $element['#attributes']['class'][] = 'asset-position-'.$settings['position'];
    }
  }

}
