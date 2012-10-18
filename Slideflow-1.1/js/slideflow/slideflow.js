/**
 * Slideflow Control, Version 1.0
 * Copyright (c) 2007, MediaEvent Services GmbH & Co. KG, http://mediaeventservices.com
 * Author: Christian Becker, http://christianhbecker.com
 * Based on code by Michael L Perry, http://www.adventuresinsoftware.com/blog/?p=104
 * Released under Creative Commons Attribution 3.0 Unported, License, http://creativecommons.org/licenses/by/3.0/
 */

/**
 * Scrolling speed: Will move (remaining distance / sfStepDivisor) for every step 
 */
var sfStepDivisor = 1.3;

/**
 * Step refresh interval in ms. Slower systems may have trouble handling short refresh intervals.
 */
var sfStepTimeout = 50;

/**
 * Power used while dragging
 */
var sfDragPower = 1.3;

/**
 * Period after user interaction for which we consider him using it (in ms).
 */
var sfActivityTolerance = 8000;

/**
 * Maximum period between two scrolling signals (mouse wheel) to be considered belonging together
 */
var sfScrollTolerance = 1000;

/**
 * Power used while scrolling with the mouse wheel
 */
var sfScrollPower = 1.8;

var sfObject;

/**
 *
 * @param config 	imgWidthNormal		Width of center slide thumbnails
 *					imgWidthTilted		Width of left and right slide thumbnails
 *					imgHeight			Height of slide thumbnails
 *					slideDistance		1 .. 100
 *					onCenterClick		function(slidenumber) to handle user click on the currently centered slide
 *					containerElement	DOM Parent Element
 *					handleSlideMove		function(percentage) receiving movement updates, for instance to synchronize an external slider control. Set to null if unused.
 *					pathLeft			Path to left thumbnails, e.g. "photos/left"
 *					pathCenter			Path to center thumbnails, e.g. "photos/center"
 *					pathRight			Path to right thumbnails, e.g. "photos/right"
 *					transparentImg		Path to transparent 1x1 pixel GIF; used as placeholder, e.g. "images/transparent.gif"
 *					images				Array with thumbnail source files in the pathLeft/Center/Right directories, e.g. ["1.jpg", "2.jpg", ..]
 *					cursorOpenHand		Path to open hand cursor, e.g. "images/openhand.cur"
 *					cursorClosedHand	Path to closed hand cursor, e.g. "images/closedhand.cur"
 */
function Slideflow(config) {

	sfObject = this;
	
	for (s_key in config)
		this[s_key] = config[s_key];

	this.glideToSlide = sfGlideToSlide;
	this.glideToPerc = sfGlideToPerc;
	this.moveToPerc = sfMoveToPerc;
	this.glideTo = sfGlideTo;
	this.moveTo = sfMoveTo;
	this.refresh = sfRefresh;
	this.disableMoveUpdate = sfDisableMoveUpdate;
	this.isActive = sfIsActive;
	this.scroll = sfScroll;
	this.clearActivityTimeout = sfClearActivityTimeout;
	this.prepareImgs = sfPrepareImgs;
	
	this.sfCurrent;
	this.target = 0;
	this.timer = 0;
	this.centerItem = 1;
	this.moveUpdate = true;
	this.didDrag = false;

	this.isMouseDown = false;
	this.lastMouseUp = undefined;
	this.marginwidth = this.imgWidthTilted;
		
	this.prepareImgs();
	
	/* preload images */
	this.imgLeft = new Array();
	this.imgCenter = new Array();
	this.imgRight = new Array();
	
	for (var i=0; i < this.images.length; i++) {
		var imgL = new Image; imgL.src = this.pathLeft + '/' + this.images[i]; this.imgLeft.push(imgL);
		var imgC = new Image; imgC.src = this.pathCenter + '/' + this.images[i]; this.imgCenter.push(imgC);
		var imgR = new Image; imgR.src = this.pathRight + '/' + this.images[i]; this.imgRight.push(imgR);
	}

	/*
	 * Show the first sldide - use the following code to start with the last slide:
	 *		this.current = (this.images.length-1) * (-this.slideDistance);
	 */
	this.current = 0; 
	
	this.refresh();
	
	sfUpdateCursors();
	
	this.savedMouseMove = document.onmousemove;
	document.onmousemove = sfMouseMove;

	this.savedMouseUp = document.onmouseup;
	document.onmouseup = sfMouseUp;

	window.onresize = function() { sfObject.refresh(); }
	
	return this;
}

/**
 * Glides to a specific slide
 *
 * @param	slide
 */
function sfGlideToSlide(slide) {
	this.glideTo((slide-1) * (-this.slideDistance));
}

/**
 * Glides to a percentage
 *
 * œparam	perc
 */
function sfGlideToPerc(perc) {
	this.glideTo(perc * (this.images.length-1) * (-this.slideDistance) / 100);
}

/**
 * Moves to a percentage
 *
 * œparam	perc
 */
function sfMoveToPerc(pos) {
	this.moveTo(perc * (this.images.length-1) * (-this.slideDistance) / 100);
}


/**
 * Handles mouse scrolling, with incrasing power when multiple events are received within sfScrollTolerance
 *
 * @param	delta	Number of scroll units to handle, like -1 or +1
 */
function sfScroll(delta) {
	if (this.scrollStartTime && (new Date()).getTime() < this.scrollStartTime.getTime() + sfScrollTolerance) {
		this.scrollDelta += delta;
	}
	else {
		/* Begin a new scroll operation */
		this.scrollStartTime = new Date();
		this.scrollStartPosition = this.current;
		this.scrollDelta = delta;
	}
	
	var sign = (this.scrollDelta < 0 ? -1 : 1);
	
	var relOffset = sign * (Math.pow(Math.abs(this.scrollDelta), sfScrollPower)) * this.slideDistance;
	var target = this.scrollStartPosition + relOffset;
	this.glideTo(target);
}

/**
 * (Re-)calculate size and prepare placeholders
 */
function sfRefresh() {
	this.size = this.containerElement.clientWidth - this.marginwidth;
	this.moveTo(this.current);
}

/**
 * Updates cursors
 * Cursors are set directly - not using classes for IE6 compatibility
 */
function sfUpdateCursors() {
        try {
                if (sfObject.isMouseDown) {
                        sfObject.containerElement.getElementsBySelector('img').each(function (item) {
										//item.className = '';
										item.setStyle({cursor: ''});
                        });
						
						//sfObject.containerElement.addClassName('closedHand');
                        sfObject.containerElement.setStyle({cursor: 'url(' + sfObject.cursorClosedHand + '), move !important'});
                }
                else {
                        sfObject.containerElement.getElementsBySelector('img').each(function (item) {
                                if (item.number == sfObject.centerItem) {
										// item.addClassName('selectable');
                                        /* required for Safari 3, or pointer won't be accepted */
										item.setStyle({cursor: ''});
										item.setStyle({cursor: 'pointer'});
								} else {
										// item.addClassName('openHand');
                                        item.setStyle({cursor: 'url(' + sfObject.cursorOpenHand + '), default !important'});
								}
                        });
						
                	   // sfObject.containerElement.removeClassName('closedHand');
	                   sfObject.containerElement.setStyle({cursor: ''});
			}
        }
        catch (e) {
        }
}

/**
 * Determines whether the user is currently using the slideflow based on sfActivityTolerance
 */
function sfIsActive() {
	return this.isMouseDown || 
		(this.lastMouseUp && (new Date()).getTime() < this.lastMouseUp.getTime() + sfActivityTolerance);
}

/**
 * Prevents handleSlideMove updates until the glideTo() destination is reached
 */
function sfDisableMoveUpdate() {
	this.moveUpdate = false;
}

/** internal use **/

/**
 * Glides to a position on the path
 *
 * @param	pos
 */
function sfGlideTo(pos) {
	pos = Math.min(0, Math.max(pos, (this.images.length-1) * (-this.slideDistance)));

	this.target = pos;
	if (this.timer == 0) {
		sfStep();
	}
}

/**
 * Moves to a position on the path
 */
function sfMoveTo(pos) {
	var headedLeft = pos < this.current;
	this.current = pos;

	var height = this.containerElement.clientHeight;

	var images = this.containerElement.getElementsByTagName("img");

	var zIndex = images.length;
	for (index = 0; index < images.length; index++) {
		var image = images.item(index);
		/*
		 * The path is a 100-unit hyperbola, where the observer is standing 100 diagonal units away from the origin.
		 * Divide the image height by the perpendicular distance from the observer to simulate vanishing.
		 * Change the zIndex to simulate occlusion.
		 */
		var z = Math.sqrt(10000 + pos * pos) + 0;	// Center: 100
		var xs = (pos / z) * this.size / 2 + this.size / 2;	// -1 ... 1 => convert to 0.. size/2 .. size

		var n = image.number;
		var t = (headedLeft /* this.target < this.current  */ ? 0.35 : 0.65);
		var width;

		if (pos < -this.slideDistance * t) {
			image.src = this.imgLeft[n-1].src;
			width = this.imgWidthTilted;
			zIndex++;
		} else if (pos > this.slideDistance * (1-t)) {
			image.src = this.imgRight[n-1].src;
			width = this.imgWidthTilted;
			zIndex--;
		}
		else {
			image.src = this.imgCenter[n-1].src;
			width = this.imgWidthNormal;
			this.centerItem = n;
			zIndex++;
		}

		image.setStyle({left: (this.marginwidth/2 + xs - width/2) + 'px',
				top: ((this.containerElement.clientHeight/2) - (this.imgHeight / 2)) + 'px',		
				width: width + 'px',
				height: (this.imgHeight) + 'px',
				zIndex: zIndex
				});

		//image.title = "pos/z=" + pos/z + "; i="+index+"; z=" + parseInt(z) + "; pos="+ parseInt(pos) + "; xs=" + parseInt(xs) + "; zIndex=" + zIndex;
		pos += this.slideDistance;
	}
	
	if (this.handleSlideMove && this.moveUpdate) {
		this.handleSlideMove(this.current * 100 / ((this.images.length-1) * (-this.slideDistance)));
	}
}


/**
 * Prepares image placeholders
 */
function sfPrepareImgs() {
	for (var i=1; i<=this.images.length; i++) {
		var newImage = document.createElement("img");
		Element.extend(newImage);
		newImage.number = i;
		newImage.src = this.transparentImg;
		newImage.onclick = function() { return sfClick(this); }
		newImage.onmousedown = function() { return sfMouseDown(this); }
		this.containerElement.appendChild(newImage);
	}
}

/**
 * Progress one step of a glide operation
 */
function sfStep() {
	if (sfObject.target < sfObject.current - 1 || sfObject.target > sfObject.current + 1) {
		sfObject.moveTo(sfObject.current + (sfObject.target - sfObject.current) / sfStepDivisor);
		window.setTimeout(sfStep, sfStepTimeout);
		sfObject.timer = 1;
	} else {
		sfObject.moveTo(sfObject.target);
		sfObject.timer = 0;
		sfObject.moveUpdate = true;
		sfUpdateCursors();
	}
}

function sfClearActivityTimeout() {
	this.lastMouseUp = undefined;
}

/**
 * Handles mouse down on slide
 */
function sfMouseDown (item) {
	sfObject.didDrag = false; /* reset */

	/* Center item: Handled by onClick handler */
	if (item.number == sfObject.centerItem)
		return true;

	/* All others: Start drag */
	sfObject.isMouseDown = true;
	sfUpdateCursors();

	sfObject.dragStartX = window.n_mouseX;
	sfObject.dragStartPos = sfObject.current;

	return false;
}

/**
 * Handles all mouse up events; forwards to previous handler
 */
function sfMouseUp (e_event, b_watching) {
	if (sfObject.isMouseDown) {
		sfObject.lastMouseUp = new Date();
		sfObject.isMouseDown = false;
		sfUpdateCursors();
	}

	if (sfObject.savedMouseUp)
		return sfObject.savedMouseUp(e_event);
	else
		return false;
}

/**
 * Handles all mouse movement; forwards to previous handler
 */
function sfMouseMove (e_event) {
	if (!e_event && window.event) e_event = window.event;

	/* save mouse coordinates */
	if (e_event) {
		window.n_mouseX = e_event.clientX;
		window.n_mouseY = e_event.clientY;
	}

	if (sfObject.isMouseDown) {
		sfObject.didDrag = true;
		var offset = sfObject.dragStartX - window.n_mouseX;
		var containerWidth =  sfObject.images.length * sfObject.imgWidthTilted * 0.5;
		var percOffset = offset / containerWidth;
		
		var sign = (percOffset < 0 ? -1 : 1);
		
		// var relOffset = offset * (sfObject.images.length-1) * (-sfObject.slideDistance) / containerWidth; /* sfObject.size */;
		var relOffset = sign * (Math.pow(Math.abs(percOffset)*100, sfDragPower) / 100) * (sfObject.images.length-1) * (-sfObject.slideDistance);
		var target = sfObject.dragStartPos + relOffset;
		sfObject.glideTo(target);
		
		return false;
	}

	if (sfObject.savedMouseMove)
		return sfObject.savedMouseMove(e_event);
	else
		return false;
}

/**
 * Click handler for slides
 */
function sfClick (item) {
	if (sfObject.didDrag)
		return false;

	if (item.number == sfObject.centerItem)
		sfObject.onCenterClick(item.number);
	else
		sfObject.glideToSlide(item.number);
	
	return false;
}
