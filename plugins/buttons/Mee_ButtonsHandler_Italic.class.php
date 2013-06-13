<?php

class Mee_ButtonsHandler_Italic extends Mee_ButtonsHandler_Abstract {

  public function getIcon(){
    return 'mee-italic';
  }

  public function getTip(){
    return 'Italic - Ctrl+I';
  }

  public function getKey(){
    return 'ctrl+i';
  }

  public function getGroup(){
    return 'font';
  }

}
