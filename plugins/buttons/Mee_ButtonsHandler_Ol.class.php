<?php

class Mee_ButtonsHandler_Ol extends Mee_ButtonsHandler_Abstract {

  public function getIcon(){
    return 'list-numbered';
  }

  public function getTip(){
    return 'Numbered List - Ctrl+O';
  }

  public function getKey(){
    return 'ctrl+o';
  }

  public function getGroup(){
    return 'list';
  }

}
