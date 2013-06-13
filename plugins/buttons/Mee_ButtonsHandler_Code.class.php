<?php

class Mee_ButtonsHandler_Code extends Mee_ButtonsHandler_Abstract {

  public function getIcon(){
    return 'mee-code';
  }

  public function getTip(){
    return 'Code - Ctrl+K';
  }

  public function getKey(){
    return 'ctrl+k';
  }

  public function getGroup(){
    return 'other';
  }

}
