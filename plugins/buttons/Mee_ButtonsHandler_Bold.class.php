<?php

class Mee_ButtonsHandler_Bold extends Mee_ButtonsHandler_Abstract {

  public function getIcon(){
    return 'mee-bold';
  }

  public function getTip(){
    return 'Bold - Ctrl+B';
  }

  public function getKey(){
    return 'ctrl+b';
  }

  public function getGroup(){
    return 'font';
  }

}
