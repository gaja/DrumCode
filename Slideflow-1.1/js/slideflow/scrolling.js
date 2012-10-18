/**
 * JS Scrolling
 * Adapted from http://adomas.org/javascript-mouse-wheel/
 */
 
var scrollHandler;

function ScrollHandler(handleWheel) {
	scrollHandler = this;
	this.handleWheel = handleWheel;
	
	if (window.addEventListener)
		/** DOMMouseScroll is for mozilla. */
		window.addEventListener('DOMMouseScroll', wheelHandler, false);

	/** IE/Opera. */
	window.onmousewheel = document.onmousewheel = wheelHandler;

	return this;
}


/**
 * Event handler for mouse wheel event.
 */
function wheelHandler(event) {
	var delta = 0;
	if (!event) /* For IE. */
		event = window.event;
	if (event.wheelDelta) { /* IE/Opera. */
		delta = event.wheelDelta/120;
		/** In Opera 9, delta differs in sign as compared to IE.
		 */
		 /* removed - not true for 9.23 */
		/* if (window.opera)
			delta = -delta;*/
	} else if (event.detail) { /** Mozilla case. */
		/** In Mozilla, sign of delta is different than in IE.
		 * Also, delta is multiple of 3.
		 */
		delta = -event.detail / 3;
	}
	/** If delta is nonzero, handle it.
	 * Basically, delta is now positive if wheel was scrolled up,
	 * and negative, if wheel was scrolled down.
	 */
	if (delta != 0 && scrollHandler.handleWheel)
		scrollHandler.handleWheel(delta > 0 ? 1 : -1);

	/** Prevent default actions caused by mouse wheel.
	 * That might be ugly, but we handle scrolls somehow
	 * anyway, so don't bother here..
	 */
	if (event.preventDefault)
		event.preventDefault();
	event.returnValue = false;
}