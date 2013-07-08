<?php

class Mee_InstanceHandler_Preview extends Mee_InstanceHandler_Abstract {

  public function instance_form(&$form, &$form_state, $settings) {
    $form['preview'] = array(
      '#type' => 'container',
      '#attributes' => array(
        'class' => array('asset-preview'),
        'style' => '',
      ),
    );
    $form['preview']['placeholder'] = array(
      '#type' => 'container',
      '#attributes' => array(
        'class' => array('asset-placeholder'),
      ),
    );
    $form['preview']['placeholder']['icon'] = array(
      '#markup' => '<i class="icon-' . $form_state['bundle']->data['icon'] . '"></i>'
    );
    $form['preview']['content'] = array(
      '#markup' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent gravida neque massa, ac dictum leo interdum eget. Duis laoreet tempus eros, quis adipiscing massa volutpat vel. Maecenas malesuada porta pharetra.'
    );
    if($active = array_filter($form_state['bundle']->data['instances'])){
      foreach($active as $instance_type => $settings){
        $handler = _mee_get_handler('instance', $instance_type);
        if(method_exists($handler, 'preview')){
          $handler->preview( $form['preview'], $form_state['values']['data'],  $form_state['bundle']->data['instances'][$instance_type]);
        }
      }
    }
    // $instances = mee_get_plugin('instance');
    // foreach($instances as $instance){
    //   if($instance['name'] == 'preview') continue;
    //   dsm($instance);
    // }
  }

  public function instance_render(&$element, $settings) {
    if(!empty($settings['position'])){
      $element['#attributes']['class'][] = 'asset-position-'.$settings['position'];
    }
  }

}
