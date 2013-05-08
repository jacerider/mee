<?php

class Mee_ButtonsHandler_Link extends Mee_ButtonsHandler_Abstract {

  public function getIcon(){
    return 'link';
  }

  public function getTip(){
    return 'Link - Ctrl+L';
  }

  public function getKey(){
    return 'ctrl+l';
  }

  public function getGroup(){
    return 'other';
  }

}
