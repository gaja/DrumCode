// Title: tigra slider control
// Description: See the demo at url
// URL: http://www.softcomplex.com/products/tigra_slider_control/
// Version: 1.0 (commented source)
// Date: 02/15/2006
// Tech. Support: http://www.softcomplex.com/forum/
// Notes: This script is free. Visit official site for further details.

/*
 * Modifications by Christian Becker, MES
 * 
 * Usage terms - from http://www.softcomplex.com/products/tigra_slider_control/download.html:
 *
 * Is this script really free?
 * 	Yes, it's free for any kind of applications including commercial use. It's not time limited and it doesn't contain any hidden functionality.
 *
 * Am I allowed to modify it?
 * 	Yes, feel free to modify the script for your needs. Leave the comments with the product information unchanged. You can add your version information below that.
 */
 
var sliderSetMouseMoved = false;
var sliderSetMouseUp = false;

function slider (a_init, a_tpl) {

	this.f_setValue  = f_sliderSetValue;
	this.f_getPos    = f_sliderGetPos;
	this.f_show = f_sliderShow;
	this.isActive = f_isActive;
	this.lastMouseUp = undefined;
	this.clearActivityTimeout = f_sliderClearActivityTimeout;
	
	// register in the global collection	
	if (!window.A_SLIDERS)
		window.A_SLIDERS = [];
	this.n_id = window.A_SLIDERS.length;
	window.A_SLIDERS[this.n_id] = this;

	// save config parameters in the slider object
	var s_key;
	if (a_tpl)
		for (s_key in a_tpl)
			this[s_key] = a_tpl[s_key];
	for (s_key in a_init)
		this[s_key] = a_init[s_key];

	this.n_pix2value = this.n_pathLength / (this.n_maxValue - this.n_minValue);
	if (this.n_value == null)
		this.n_value = this.n_minValue;

	// generate the control's HTML
	document.write(
		'<div class="slider" style="width:' + this.n_controlWidth + 'px;height:' + this.n_controlHeight + 'px; visibility: hidden;" id="sl' + this.n_id + 'base" onmousedown="controldown(' + this.n_id + ', event);">' +
		'<div class="sliderbutton" onclick="return false;" style="width: ' + this.n_sliderWidth + 'px; height: ' + this.n_sliderHeight + 'px; border: 0; position:relative;left:' + this.n_pathLeft + 'px;top:' + this.n_pathTop + 'px;z-index:' + this.n_zIndex + ';visibility:hidden;" name="sl' + this.n_id + 'slider" id="sl' + this.n_id + 'slider" onmousedown="return f_sliderMouseDown(' + this.n_id + ')"></div></div>'
	);
	this.e_base   = get_element('sl' + this.n_id + 'base');
	this.e_slider = get_element('sl' + this.n_id + 'slider');
	
	// safely hook document/window events
	if (!sliderSetMouseMoved) {
		window.f_savedMouseMove = document.onmousemove;
		document.onmousemove = f_sliderMouseMove;
		sliderSetMouseMoved = true;
	}
	if (!sliderSetMouseUp) {
		window.f_savedMouseUp = document.onmouseup;
		document.onmouseup = f_sliderMouseUp;
		sliderSetMouseUp = true;
	}
	
	// preset to the value in the input box if available
	/*var e_input = this.s_form == null
		? get_element(this.s_name)
		: document.forms[this.s_form]
			? document.forms[this.s_form].elements[this.s_name]
			: null;
	this.f_setValue(e_input && e_input.value != '' ? e_input.value : null, 1);*/
	
	// Initialwert übernehmen
	this.f_setValue(this.n_value, false, true /* non-user generated */);
	return this;
}

function f_sliderShow () {
	this.e_base.style.visibility = 'visible';
	this.e_slider.style.visibility = 'visible';
}


function f_sliderSetValue (n_value, b_noInputCheck, b_nonUser) {
	// Nicht aktualisieren, wenn User gerade damit arbeitet
	if (b_nonUser && window.n_activeSliderId != null)
		return;
	if (n_value == null)
		n_value = this.n_value == null ? this.n_minValue : this.n_value;
	if (isNaN(n_value))
		return false;
	// round to closest multiple if step is specified
	if (this.n_step)
		n_value = Math.round((n_value - this.n_minValue) / this.n_step) * this.n_step + this.n_minValue;
	// smooth out the result
	if (n_value % 1)
		n_value = Math.round(n_value * 1e5) / 1e5;

	if (n_value < this.n_minValue)
		n_value = this.n_minValue;
	if (n_value > this.n_maxValue)
		n_value = this.n_maxValue;

	this.n_value = n_value;

	// move the slider
	if (this.b_vertical)
		this.e_slider.style.top  = (this.n_pathTop + this.n_pathLength - Math.round((n_value - this.n_minValue) * this.n_pix2value)) + 'px';
	else
		this.e_slider.style.left = (this.n_pathLeft + Math.round((n_value - this.n_minValue) * this.n_pix2value)) + 'px';
		
	if (!b_nonUser && this.onSetValue != undefined)
	  this.onSetValue(this.n_value);
}

// get absolute position of the element in the document
function f_sliderGetPos (b_vertical, b_base) {
	var n_pos = 0,
		s_coord = (b_vertical ? 'Top' : 'Left');
	var o_elem = o_elem2 = b_base ? this.e_base : this.e_slider;
	
	while (o_elem) {
		n_pos += o_elem["offset" + s_coord];
		o_elem = o_elem.offsetParent;
	}
	o_elem = o_elem2;

	var n_offset;
	while (o_elem.tagName != "BODY") {
		n_offset = o_elem["scroll" + s_coord];
		if (n_offset)
			n_pos -= o_elem["scroll" + s_coord];
		o_elem = o_elem.parentNode;
	}
	return n_pos;
}

function f_sliderMouseDown (n_id) {
	window.n_activeSliderId = n_id;
	return false;
}

function f_isActive() {
	var activityTolerance = 8;

	return window.n_activeSliderId == this.n_id ||
		(this.lastMouseUp && (new Date()).getTime() < this.lastMouseUp.getTime() + activityTolerance * 1000);
}

function isIE() {
  return (-1 != navigator.userAgent.indexOf("MSIE"));
}

function controldown(n_id, e_event) {
	var o_slider = window.A_SLIDERS[n_id];
	window.n_mouseX = e_event.clientX + f_scrollLeft();
	window.n_mouseY = e_event.clientY + f_scrollTop();
	
	/* horizontal slider */
	var n_sliderLeft = window.n_mouseX - o_slider.n_sliderWidth / 2 - o_slider.f_getPos(0, 1) - (isIE() ? 3 : 0);
	// limit the slider movement
	if (n_sliderLeft < o_slider.n_pathLeft)
		n_sliderLeft = o_slider.n_pathLeft;
	var n_pxMax = o_slider.n_pathLeft + o_slider.n_pathLength;
	if (n_sliderLeft > n_pxMax)
		n_sliderLeft = n_pxMax;
	o_slider.e_slider.style.left = n_sliderLeft + 'px';
	n_pxOffset = n_sliderLeft - o_slider.n_pathLeft;
	return f_sliderMouseDown(n_id);
}

function f_sliderMouseUp (e_event, b_watching) {
	if (window.n_activeSliderId != null) {
		var o_slider = window.A_SLIDERS[window.n_activeSliderId];
		o_slider.f_setValue(o_slider.n_minValue + (o_slider.b_vertical
			? (o_slider.n_pathLength - parseInt(o_slider.e_slider.style.top) + o_slider.n_pathTop)
			: (parseInt(o_slider.e_slider.style.left) - o_slider.n_pathLeft)) / o_slider.n_pix2value);
		o_slider.lastMouseUp = new Date();
		if (b_watching)	return;
		window.n_activeSliderId = null;
	}
	if (window.f_savedMouseUp)
		return window.f_savedMouseUp(e_event);
}

function f_sliderMouseMove (e_event) {

	if (!e_event && window.event) e_event = window.event;

	// save mouse coordinates
	if (e_event) {
		window.n_mouseX = e_event.clientX + f_scrollLeft();
		window.n_mouseY = e_event.clientY + f_scrollTop();
	}

	// check if in drag mode
	if (window.n_activeSliderId != null) {
		var o_slider = window.A_SLIDERS[window.n_activeSliderId];

		var n_pxOffset;
		if (o_slider.b_vertical) {
			var n_sliderTop = window.n_mouseY - o_slider.n_sliderHeight / 2 - o_slider.f_getPos(1, 1) - (isIE() ? 3 : 0);
			// limit the slider movement
			if (n_sliderTop < o_slider.n_pathTop)
				n_sliderTop = o_slider.n_pathTop;
			var n_pxMax = o_slider.n_pathTop + o_slider.n_pathLength;
			if (n_sliderTop > n_pxMax)
				n_sliderTop = n_pxMax;
			o_slider.e_slider.style.top = n_sliderTop + 'px';
			n_pxOffset = o_slider.n_pathLength - n_sliderTop + o_slider.n_pathTop;
		}
		else {
			var n_sliderLeft = window.n_mouseX - o_slider.n_sliderWidth / 2 - o_slider.f_getPos(0, 1) - (isIE() ? 3 : 0);
			// limit the slider movement
			if (n_sliderLeft < o_slider.n_pathLeft)
				n_sliderLeft = o_slider.n_pathLeft;
			var n_pxMax = o_slider.n_pathLeft + o_slider.n_pathLength;
			if (n_sliderLeft > n_pxMax)
				n_sliderLeft = n_pxMax;
			o_slider.e_slider.style.left = n_sliderLeft + 'px';
			n_pxOffset = n_sliderLeft - o_slider.n_pathLeft;
		}
		if (o_slider.b_watch)
			 f_sliderMouseUp(e_event, 1);

		return false;
	}
	
	if (window.f_savedMouseMove)
		return window.f_savedMouseMove(e_event);
}

// get the scroller positions of the page
function f_scrollLeft() {
	return f_filterResults (
		window.pageXOffset ? window.pageXOffset : 0,
		document.documentElement ? document.documentElement.scrollLeft : 0,
		document.body ? document.body.scrollLeft : 0
	);
}
function f_scrollTop() {
	return f_filterResults (
		window.pageYOffset ? window.pageYOffset : 0,
		document.documentElement ? document.documentElement.scrollTop : 0,
		document.body ? document.body.scrollTop : 0
	);
}
function f_filterResults(n_win, n_docel, n_body) {
	var n_result = n_win ? n_win : 0;
	if (n_docel && (!n_result || (n_result > n_docel)))
		n_result = n_docel;
	return n_body && (!n_result || (n_result > n_body)) ? n_body : n_result;
}

function f_sliderError (n_id, s_message) {
	alert("Slider #" + n_id + " Error:\n" + s_message);
	window.n_activeSliderId = null;
}

function f_sliderClearActivityTimeout() {
	this.lastMouseUp = undefined;
}


get_element = document.all ?
	function (s_id) { return document.all[s_id] } :
	function (s_id) { return document.getElementById(s_id) };
