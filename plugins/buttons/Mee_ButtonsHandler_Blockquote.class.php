<?php

class Mee_ButtonsHandler_Blockquote extends Mee_ButtonsHandler_Abstract {

  public function getIcon(){
    return 'quote';
  }

  public function getTip(){
    return 'Blockquote - Ctrl+Q';
  }

  public function getKey(){
    return 'ctrl+q';
  }

  public function getGroup(){
    return 'other';
  }

}
