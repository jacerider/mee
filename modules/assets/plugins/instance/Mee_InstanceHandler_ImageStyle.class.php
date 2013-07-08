<?php

class Mee_InstanceHandler_ImageStyle extends Mee_InstanceHandler_Abstract {

  public function settings_form(&$form, &$form_state, $defaults) {
    $styles = image_styles();
    $form['image_styles'] = array(
      '#type' => 'item',
      '#tree' => TRUE,
      '#title' => t('Enabled styles')
    );
    foreach($styles as $id => $style){
      $form['image_styles'][$id]['#tree'] = TRUE;
      $form['image_styles'][$id]['enabled'] = array(
        '#type' => 'checkbox',
        '#title' => $id,
        '#default_value' => empty($defaults['image_styles'][$id]['enabled']) ? 0 : 1,
      );
      $form['image_styles'][$id]['label'] = array(
        '#type' => 'textfield',
        '#title' => t('Label'),
        '#default_value' => empty($defaults['image_styles'][$id]['label']) ? '' : $defaults['image_styles'][$id]['label'],
      );
      $form['image_styles'][$id]['label']['#states'] = array(
        'visible' => array(
          ':input[name="data[instances][image_style_settings][image_styles]['.$id.'][enabled]"]' => array('checked' => TRUE),
        ),
      );
      $form['image_styles'][$id]['preview'] = array(
        '#type' => 'textfield',
        '#title' => t('Preview style markup'),
        '#default_value' => empty($defaults['image_styles'][$id]['preview']) ? 'font-size:34px;' : $defaults['image_styles'][$id]['preview'],
      );
      $form['image_styles'][$id]['preview']['#states'] = array(
        'visible' => array(
          ':input[name="data[instances][image_style_settings][image_styles]['.$id.'][enabled]"]' => array('checked' => TRUE),
          ':input[name="data[instances][preview]"]' => array('checked' => TRUE),
        ),
      );
    }
  }

  public function instance_form(&$form, &$form_state, $settings) {
    $options = array();
    foreach($settings['image_styles'] as $id => $data){
      if(empty($data['enabled'])) continue;
      $options[$id] = !empty($data['label']) ? t($data['label']) : $id;
    }
    $form['image_style'] = array(
      '#type' => 'select',
      '#title' => t('Image Style'),
      '#options' => $options,
      '#required' => TRUE,
      '#ajax' => array(
        'callback' => 'mee_asset_instance_form_preview_ajax',
        'wrapper' => 'asset-instance-form',
        'method' => 'replace',
        'effect' => 'none',
      ),
    );
  }

  public function instance_render(&$element, $settings) {
    foreach (element_children($element['asset']) as $key) {
      if($element['asset'][$key]['#field_type'] == 'image'){
        foreach (element_children($element['asset'][$key]) as $delta) {
          $field = &$element['asset'][$key][$delta];
          $field['#theme'] = 'image_formatter';
          $field['#image_style'] = $settings['image_style'];
        }
      }
    }
  }

  public function preview( &$element, $values, $settings ){
    if(!empty($values['image_style'])){
      $element['placeholder']['#attributes']['style'] .= $settings['image_styles'][$values['image_style']]['preview'];
    }

  }

}
