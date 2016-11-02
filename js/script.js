/* It’s not elegant nor uber optimized but it was erratically designed in the span of a few weeks and gets the job done. Please feel free to improve. Thanks. */

r(function() {
	// VARIABLES
	
	var form = document.getElementsByTagName('form')[0],
			details = document.getElementsByClassName('details'),
			checkAll = document.getElementsByClassName('checkAll'),
			boxes = document.querySelectorAll('input[type="checkbox"]'),
			
			howTo = document.createElement('section'),
			helper = document.createElement('button'),
			help = document.createElement('div'),
			
			bar = document.getElementById('progress-inner'),
			count = boxes.length,
			checked = 0,
			progress = 0;
	
	// POLYFILLS
	
	if (!Element.prototype.matches) {
		Element.prototype.matches = 
			Element.prototype.matchesSelector || 
			Element.prototype.mozMatchesSelector ||
			Element.prototype.msMatchesSelector || 
			Element.prototype.oMatchesSelector || 
			Element.prototype.webkitMatchesSelector ||
			function(s) {
      	var matches = (this.document || this.ownerDocument).querySelectorAll(s),
				i = matches.length;
				while (--i >= 0 && matches.item(i) !== this) {}
					return i > -1;            
			};
	}
	
	// FUNCTIONS

	// localStorage with cookie fallback
	var storage = (function() {
		// Checking if localStorage is supported
		var _hasLocalStorage = (function() {
			var test = 'test';
			try {
				localStorage.setItem(test, test);
				localStorage.removeItem(test);
				return true;
			} catch(e) {
				return false;
			}
		})();

		// Functions for cookies (read, write and clear)
		var _readCookie = function(name) {
			var nameEQ = name + "=";
			var ca = document.cookie.split(';');
			for (var i = 0; i < ca.length; i++) {
				var c = ca[i];
				while (c.charAt(0) == ' ') c = c.substring(1, c.length);
				if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
			}
			return null;
		};

		var _writeCookie = function(name, value, days) {
			var expiration = (function() {
				if (days) {
					var date = new Date();
					date.setTime(date.getTime() + (days*24*60*60*1000));
					return "; expires=" + date.toGMTString();
				} else {
					return "";
				}
			})();
			document.cookie = name + "=" + value + expiration + "; path=/";
		};
  	
		var _clearCookie = function() {
			var ca = document.cookie.split(";");
			for (var i = 0; i < ca.length; i++){
				var c = ca[i];
				var posEQ = c.indexOf("=");
				var name = posEQ > -1 ? c.substr(0, posEQ) : c;
				document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";                              
			}
		};

		return {
			// storage.set(name, value, days) -> if localStorage setItem else write cookie
			set: function(name, value, days) {
				_hasLocalStorage ? localStorage.setItem(name, value) : _writeCookie(name, value, days);
			},

			// storage.get(name) -> read from localStorage or from cookie
			get: function(name) {
				return _hasLocalStorage ? localStorage.getItem(name) : _readCookie(name);
			},

			// storage.remove(name) -> removeItem or set cookie yesterday
			remove: function(name) {
				_hasLocalStorage ? localStorage.removeItem(name) : this.set(name, "", -1);
			},
    	
			// storage.clear() -> clear localStorage or cookie
			clear: function() {
				_hasLocalStorage ? localStorage.clear() : _clearCookie();
			}
		};
	})();
  
  // Count number of checked inputs
	function updateProgress() {
	  // Check number of checked inputs
		checked = document.querySelectorAll('input[type="checkbox"]:checked').length;
		// Compute percentage for the progress bar
		progress = parseInt(((checked / count) * 100), 10);
		// Update progress bar
		bar.style.width = progress + "%";
	};
  
	// Scroll to + Top
	function scrollTo(element, to, duration) {
		if (duration <= 0) return;
		var difference = to - element.scrollTop;
		var perTick = difference / duration * 10;
		setTimeout(function() {
			element.scrollTop = element.scrollTop + perTick;
			if (element.scrollTop == to) return;
			scrollTo(element, to, duration - 10);
		}, 10);
	};
	// Shortcut for body
	function scrollTop() {
	  if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
     scrollTo(document.getElementsByTagName('html')[0], 0, 600);	// If firefox -> html (WTF?!?)
		} else {
			scrollTo(document.body, 0, 600);
		}
	};

	// Store input when checked
	function initCheckbox(box) {
		// storageID = name
		var storageId = "blitzOptim_" + box.getAttribute("value");
		// We check if an value is already stored
		var oldVal = storage.get(storageId);
		// check if old value stored
		box.checked = oldVal === "true" ? true : false;
		box.addEventListener("change", function() {
			updateProgress();
			storage.set('blitzOptim_barWidth', progress);
			storage.set(storageId, this.checked); 
		});
	};
	
	// Reset form
	function resetChecklist() {
		// clear storage
		storage.clear();
		//set width of progress bar to 0
		bar.style.width = "0";
		// scroll to top
		scrollTop();
		// reenable buttons for SVG, JS and anims
		var enable = document.querySelectorAll('button[disabled]');
		for (var i = 0; i < enable.length; i++) {
			enable[i].disabled = false;
		}
		var uncheck = document.querySelectorAll('input[type="checkbox"]:checked');
		for (var i = 0; i < uncheck.length; i++) {
			uncheck[i].checked = false;
		}
	};
	
	function toggleAria(elt) {
		elt.getAttribute('aria-hidden') === 'true' ? elt.setAttribute('aria-hidden', 'false') : elt.setAttribute('aria-hidden', 'true');
	}
	
	// Toggle details
	function toggleDetails(elt) {
		elt.classList.toggle('open');
		// toggle class hidden + aria for details = nextElementSibling
		elt.nextElementSibling.classList.toggle('hidden');		
		toggleAria(elt.nextElementSibling);
	};
	
	function toggleHelp(e) {
		e.preventDefault();
		help.classList.toggle('hidden');
		toggleAria(help);
	};
	
	// Check all inputs for SVG, JS and anims
	function checkChildren(elt) {
		// check if SVG, JS or anim
		var checkScope = elt.getAttribute('id');
		// get all inputs in the scope
		var toCheck = document.querySelectorAll('input[name="'+checkScope+'"]');
		for (var j = 0; j < toCheck.length; j++) {
			var checkMe = toCheck[j];
			// check
			checkMe.checked = true;
			// update progress bar
			updateProgress();
			// store values of inputs
			storage.set("blitzOptim_" + checkMe.getAttribute("value"), "true");
			storage.set('blitzOptim_barWidth', progress);
		}
		// disable button
		elt.setAttribute('disabled', 'disabled');
		// store value of button
		storage.set("blitzOptim_" + elt.getAttribute("id") + "_button", "true");
		// Maybe remove eventListener and re-add when reset?
	}

	// INIT (run on doc Ready)
		
	// Adding js-enabled to body (for details)
	document.getElementsByTagName('body')[0].classList.add('js-enabled');
		
	// Hide details
	for (var i = 0; i < details.length; i++) {
		details[i].classList.add('hidden');
		details[i].setAttribute('aria-hidden', 'true');
		details[i].setAttribute('aria-live', 'polite');
	};

	// Get previous state and update progress bar
	var retrievedProgress = storage.get('blitzOptim_barWidth');
	if (retrievedProgress) {
		bar.style.width = retrievedProgress + "%";
	} else {
	  // Doesn’t work AS-IS
		updateProgress();
	};

  // Init checkboxes -> retrive stored value and check
	for (var i = 0; i < count; i++) {
		var box = boxes[i];
		if (box.hasAttribute("value")) {
			initCheckbox(box);			
		}
	};

	// Disable checkAll buttons from previous session
	for (var i = 0; i < checkAll.length; i++) {
		var button = checkAll[i];
		var disabled = storage.get("blitzOptim_" + button.getAttribute("id") + "_button");
		if (disabled) {
			button.setAttribute('disabled', 'disabled');
		}
	};
	
	// Inject help
	howTo.id = 'how-to';
	helper.type = 'button';
	helper.className = 'helper';
	helper.id = 'helper';
	helper.innerText = 'Help';
	howTo.appendChild(helper);
	help.classList.add('help-content', 'hidden');
	help.id = 'help';
	help.setAttribute('aria-hidden', 'true');
	help.setAttribute('aria-live', 'assertive');
	help.innerHTML = '<div class="wrapper">'
		+ '<p>If you’re using a mouse:</p>'
  	+ '<li>click the checkbox to check</li>'
  	+ '<li>click the label to display details</li>'
  	+ '<li>click the “Thanks button” if you don’t need SVG, JS or animations</li>'
  	+ '<li>click reset to… reset the checklist</li>'
  	+ '</ul>'
  	+ '<p>If you’re using a keyboard:</p>'
  	+ '<ul>'
  	+ '<li>press “tab” to navigate items</li>'
  	+ '<li>press “enter” to check</li>'
  	+ '<li>press “space” to display details</li>'
  	+ '<li>press “backspace” to reset the checklist</li>'
  	+ '</ul>'
  	+ '<p>Don’t worry, your checklist is autosaved: you can close this website, your current checklist will be retrieved when reopened.</p>'	
  	+ '<p>Finally, you can install this web-app on iOS and Android. And if you’re using Chrome, Firefox or Opera, it will also be available offline.</p>'
  	+ '</div>';
	howTo.appendChild(help);
	document.body.insertBefore(howTo, document.getElementsByTagName('main')[0]);
	
	// Event Listeners 
	
	helper.addEventListener('click', toggleHelp, false);
	
	form.addEventListener('click', function(e) {
		var elt = e.target;
		if (elt.classList.contains('summary')) {
			e.preventDefault();
			toggleDetails(elt);
		} else if (elt.matches('.summary > *')) {
			e.preventDefault();
			toggleDetails(elt.parentElement);
		} else if (elt.classList.contains('checkAll')) {
			checkChildren(elt);
		} else if (elt.type === 'reset') {
			resetChecklist();
		} else if (elt.classList.contains('details-para')) {
			e.preventDefault();
		} else {
			return;
		}
	});
	
	document.addEventListener('keydown', function(e) {
		var active = document.activeElement;
		var isCheckbox = (active.type === 'checkbox');
		var isBackspace = (e.key === 'Backspace' || e.keyCode === 8);
		var isEnter = (e.key === 'Enter' || e.keyCode === 13);
		var isSpacebar = (e.key === 'Spacebar' || e.keyCode === 32);
		
		if (isBackspace) {
			resetChecklist();
			active.blur();
		} else if (isCheckbox && isEnter) {
			e.preventDefault();
			var updateChange = new Event('change');
		  if (active.checked) {
		  	active.checked = false;
		  } else {
		  	active.checked = true;
		  };
		  active.dispatchEvent(updateChange);
		} else if (isCheckbox && isSpacebar) {
			e.preventDefault();
			var pushActive = active.parentElement.getElementsByClassName('summary')[0];			
			toggleDetails(pushActive);
		} else {
			return;
		}
	});

});
function r(f){/in/.test(document.readyState)?setTimeout('r('+f+')',9):f()}																	