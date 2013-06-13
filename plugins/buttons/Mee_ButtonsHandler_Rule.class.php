<?php

class Mee_ButtonsHandler_Rule extends Mee_ButtonsHandler_Abstract {

  public function getIcon(){
    return 'mee-rule';
  }

  public function getTip(){
    return 'Horizontal Rule - Ctrl+H';
  }

  public function getKey(){
    return 'ctrl+h';
  }

  public function getGroup(){
    return 'other';
  }

}
