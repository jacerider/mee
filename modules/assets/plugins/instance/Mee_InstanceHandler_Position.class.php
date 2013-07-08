<?php

class Mee_InstanceHandler_Position extends Mee_InstanceHandler_Abstract {

  public function instance_form(&$form, &$form_state, $settings) {
    $form['position'] = array(
      '#type' => 'select',
      '#title' => t('Position'),
      '#required' => TRUE,
      '#options' => array(
        'center' => t('Center'),
        'left' => t('Left'),
        'right' => t('Right'),
      ),
      '#default_value' => 'center',
      '#ajax' => array(
        'callback' => 'mee_asset_instance_form_preview_ajax',
        'wrapper' => 'asset-instance-form',
        'method' => 'replace',
        'effect' => 'none',
      ),
    );
  }

  public function instance_render(&$element, $settings) {
  }

  public function preview( &$element, $values ){
    switch($values['position']){
      case 'left':
        $element['placeholder']['#attributes']['style'] .= 'float:left;margin:0 15px 5px 0;';
        break;
      case 'right':
        $element['placeholder']['#attributes']['style'] .= 'float:right;margin:0 0 5px 15px;';
        break;
      case 'center':
        $element['placeholder']['#attributes']['style'] .= 'text-align:center;';
        break;
    }
  }

}
