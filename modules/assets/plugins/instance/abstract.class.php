<?php

/**
 * @file
 * Abstraction of the selection logic of a Mee instance.
 *
 * Implementations that wish to provide an implementation of this should
 * register it using CTools' plugin system.
 */
interface Mee_InstanceHandler {

  public function __construct($type, $args = NULL);

  public function instance_form(&$form, &$form_state, $settings);

}

/**
 * An abstract implementation of ButtonsReference_LinksHandler.
 */
abstract class Mee_InstanceHandler_Abstract implements Mee_InstanceHandler {

  /**
   * The name of the button plugin.
   */
  protected $type;

  /**
   * The plugin definition.
   */
  protected $plugin;

  /**
   * Constructor for the links.
   *
   * @param $type
   * The name of the links plugin.
   */
  public function __construct($type, $args = NULL) {
    $this->type = $type;
    ctools_include('plugins');
    $plugin = ctools_get_plugins('mee', 'instance', $type);
    $this->plugin = $plugin;
  }

  public function settings_form(&$form, &$form_state, $defaults) {}

  public function instance_form(&$form, &$form_state, $settings) {}

  public function instance_render(&$element, $settings) {}

}

/**
 * A null implementation of Mee_LinksHandler.
 */
class Mee_InstanceHandler_Broken extends Mee_InstanceHandler_Abstract {

}
