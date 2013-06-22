(function($) {

$.fn.meeCommands.example = function () {
  var ss = $.fn.meeActive.meeSelection;
  // Text that will be displayed before the selected text
  ss.before = ss.before + "----------\n## ";
  // This text will be automatically selected
  ss.text = 'THIS IS AN EXAMPLE [mee-example-before-1] [mee-example-after-1]';
  // Text that will be displayed after the selected text
  ss.after = " ##\n----------" + ss.after;
  // Update the textarea with the new content
  ss.selectionSet();
}

/******************************************************************************
 * Token Replacment -- Runs BEFORE conversion to markup
 */
$.fn.meeReplace.before.example = function ( text ) {
  var regex = new RegExp("(\\[mee-example-before-[0-9]+\\])","g");
  if(text.match(regex)){
    text = text.replace(regex, '[This has been replace by the great **Cyle of Abogua**]');
  }
  return text;
}

/******************************************************************************
 * Token Replacment -- Runs AFTER conversion to markup
 */
$.fn.meeReplace.after.example = function ( text ) {
  var regex = new RegExp("(\\[mee-example-after-[0-9]+\\])","g");
  if(text.match(regex)){
    text = text.replace(regex, '[This has been replace by the great **Cyle of Abogua**]');
  }
  return text;
}

})(jQuery);
