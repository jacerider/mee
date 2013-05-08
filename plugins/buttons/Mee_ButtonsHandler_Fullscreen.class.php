<?php

class Mee_ButtonsHandler_Fullscreen extends Mee_ButtonsHandler_Abstract {

  // public function getIcon(){
  //   return 'italic';
  // }

  public function getTip(){
    return 'Fullscreen Mode - Ctrl+F';
  }

  public function getKey(){
    return 'ctrl+f';
  }

  public function getGroup(){
    return 'right';
  }

}
