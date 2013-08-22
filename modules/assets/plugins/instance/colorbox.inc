<?php

if(module_exists('colorbox')){
  $plugin = array(
    'title' => t('Colorbox'),
    'description' => t('Provides the ability to view an image asset in a colorbox.'),
    'class' => 'Mee_InstanceHandler_Colorbox',
    'weight' => 5,
  );
}
