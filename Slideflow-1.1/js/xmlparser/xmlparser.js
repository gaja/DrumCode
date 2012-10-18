/**
 * XML Parser
 * Adapted from http://developer.apple.com/internet/webcontent/xmlhttpreq.html
 */
 
function getHttpReq() {
	var httpReq;
	
	if (window.XMLHttpRequest && !(window.ActiveXObject)) {
		try {
				httpReq = new XMLHttpRequest();
		} catch(e) {
		}
        }

	if (window.ActiveXObject) { // IE 
		try {
			httpReq = new ActiveXObject("Msxml2.XMLHTTP");
		} catch(e) {
			try {
				httpReq = new ActiveXObject("Microsoft.XMLHTTP");
			} catch(e) {
			}
		}
	}
	
	return httpReq;
}

function getXmlDoc(httpReq, filename) {
	var xmlDoc;

	httpReq.open("GET", filename, false /* sync */);
	httpReq.send(null);
	xmlDoc = httpReq.responseXML;
	if (httpReq.status != 404 && httpReq.status!=403)
		return xmlDoc;
	else
		return null;
}