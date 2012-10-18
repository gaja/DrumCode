/**
 * Adds fake hover classes for IE6
 * Adapted from http://annevankesteren.nl/test/phover/
 */
function ieFixHover(element) {
  	  element.onmouseover = function() {
	    this.addClassName('hover');
	   }
	   element.onmouseout  = function() {
	    this.removeClassName('hover');
	   }
}

/* 
 * IE Cursor flickering bugfix
 * see http://www.jamescrooke.co.uk/articles/solving-ie6-flicker-bug/
 */
try {
	document.execCommand("BackgroundImageCache", false, true);
} 
catch(err) {}