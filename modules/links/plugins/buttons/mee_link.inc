<?php

$plugin = array(
  'title' => t('Enhanced Link'),
  'weight' => 0,
  'icon' => 'link',
  'tip' => 'Link - Ctrl+L',
  'shortcut' => 'ctrl+l',
  'group' => 'other',
  'script' => 'mee_link.js',
  // We need to know what type was clicked to pass in additional data.
  'data' => array(
    'label'=>'Link',
  )
);
