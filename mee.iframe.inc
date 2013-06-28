<?php

function mee_iframe_page(){
  //drupal_add_css(drupal_get_path('module', 'mee').'/css/mee.scss');
  drupal_add_css(drupal_get_path('module', 'mee').'/css/application.css');
  $options = array();
  return theme('mee_iframe', array('iframe' => $options));
}

function mee_deliver_html_page($page) {
  // Render the page so that we get all the JS and CSS
  drupal_render_page($page);
  $empty_page = '<html><head><title></title>' . drupal_get_css() . '</head><body class="mee-iframe">'.$page.'</body></html>';
  print $empty_page;
  drupal_exit();
}
