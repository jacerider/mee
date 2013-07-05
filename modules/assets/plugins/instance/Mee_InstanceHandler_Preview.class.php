<?php

class Mee_InstanceHandler_Preview extends Mee_InstanceHandler_Abstract {

  public function instance_form(&$form, &$form_state, $settings) {
    dsm($form_state);
    $form['preview'] = array(
      '#type' => 'markup',
      '#markup' => '<i class="icon-' . $form_state['bundle']->data['icon'] . '"></i> Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent gravida neque massa, ac dictum leo interdum eget. Duis laoreet tempus eros, quis adipiscing massa volutpat vel.',
    );
  }

  public function instance_render(&$element, $settings) {
    if(!empty($settings['position'])){
      $element['#attributes']['class'][] = 'asset-position-'.$settings['position'];
    }
  }

}
