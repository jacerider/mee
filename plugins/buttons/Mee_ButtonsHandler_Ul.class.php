<?php

class Mee_ButtonsHandler_Ul extends Mee_ButtonsHandler_Abstract {

  public function getIcon(){
    return 'mee-ul';
  }

  public function getTip(){
    return 'Bulleted List - Ctrl+U';
  }

  public function getKey(){
    return 'ctrl+u';
  }

  public function getGroup(){
    return 'list';
  }

}
