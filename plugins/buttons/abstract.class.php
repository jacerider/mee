<?php

/**
 * @file
 * Abstraction of the selection logic of a Mee link group.
 *
 * Implementations that wish to provide an implementation of this should
 * register it using CTools' plugin system.
 */
interface Mee_ButtonsHandler {

  public function __construct($type, $args = NULL);

  public function getName();

  public function getIcon();

}

/**
 * An abstract implementation of ButtonsReference_LinksHandler.
 */
abstract class Mee_ButtonsHandler_Abstract implements Mee_ButtonsHandler {

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
    $plugin = ctools_get_plugins('mee', 'buttons', $type);
    $this->plugin = $plugin;
  }

  public function getName(){
    return $this->plugin['title'];
  }

  public function getIcon(){
    return null;
  }

  public function getTip(){
    return null;
  }

  public function getKey(){
    return null;
  }

  public function getGroup(){
    return 'default';
  }

  public function getLabel($force_name = FALSE){
    if($this->getIcon() && !$force_name){
      return '<i class="icon-' . $this->getIcon() . '"></i>';
    }
    return $this->getName();
  }

}

/**
 * A null implementation of Mee_LinksHandler.
 */
class Mee_ButtonsHandler_Broken extends Mee_ButtonsHandler_Abstract {

}
