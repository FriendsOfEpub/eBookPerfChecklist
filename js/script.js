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
	
			controls = document.getElementById('controls'),
			barWrap = document.createElement('div'),
			bar = document.createElement('div'),
			textProgress = document.createElement('span'),
			
			count = boxes.length,
			checked = 0,
			progress = 0;
			
	var isFirefox = false;

	// POLYFILLS
	
	// matches 
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
  
	// FUNCTIONS
	
  // closest "à la jQuery"
  
  var getClosest = function (elem, tag) {
    for (; elem && elem !== document && elem.nodeType === 1; elem = elem.parentNode) {
    	if (elem.tagName.toLowerCase() === tag) {
      	return elem;
      }
    }
		return null;
	};

	// barHandler = set width and data-width for progress bar
	function barHandler(widthPer) {
		bar.style.width = widthPer + "%";
		bar.dataset.width = widthPer + "%";
	}
	
  // Update Progress Bar
	function updateProgress() {
	  // Check number of checked inputs
		checked = document.querySelectorAll('input[type="checkbox"]:checked').length;
		// Compute percentage for the progress bar
		progress = parseInt(((checked / count) * 100), 10);
		// Update progress bar
		barHandler(progress);
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
	  if (isFirefox) {
    	scrollTo(document.getElementsByTagName('html')[0], 0, 600);	// If firefox -> html (WTF?!?)
		} else {
			scrollTo(document.body, 0, 600);
		}
	};

	// Init input when checked
	function initCheckbox(box) {
		// storageID = name
		var storageId = "blitzOptim_" + box.getAttribute("value");
		// We check if an value is already stored
		var oldVal = storage.get(storageId);
		// add true/false for checked attribute
		box.checked = oldVal === "true" ? true : false;
		
		// add eventListener change for each checkbox
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
		barHandler(0);
		// scroll to top
		scrollTop();
		// reenable buttons for SVG, JS and anims
		var enable = document.querySelectorAll('button[disabled]');
		for (var i = 0; i < enable.length; i++) {
			enable[i].disabled = false;
		}
		// force uncheck because iOS WebView
		var uncheck = document.querySelectorAll('input[type="checkbox"]:checked');
		for (var i = 0; i < uncheck.length; i++) {
			uncheck[i].checked = false;
		}
	};
	
	function toggleAria(el) {
		if (el.getAttribute('aria-hidden') === 'true') {
			el.setAttribute('aria-hidden', 'false');
		} else {
			el.setAttribute('aria-hidden', 'true');
		}
	};
	
	// Toggle details
	function toggleDetails(trigger) {
		var detail = trigger.nextElementSibling;
		trigger.classList.toggle('open');
		detail.classList.toggle('hidden');		
		toggleAria(detail);
	};
	
	function toggleHelp() {
		help.classList.toggle('hidden');
		toggleAria(help);
	};
	
	function focusNoScroll(el) {
		var x = window.scrollX, y = window.scrollY;
		el.focus();
		window.scrollTo(x, y);
	}
	
	// Check all inputs for SVG, JS and anims
	function checkChildren(trigger) {
		// check if SVG, JS or anim
		var checkScope = trigger.getAttribute('id');
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
		trigger.setAttribute('disabled', 'disabled');
		// store value of button
		storage.set("blitzOptim_" + trigger.getAttribute("id") + "_button", "true");
		
		// scroll to next section
		var currentSection = getClosest(trigger, 'section');
		var nextSection = currentSection.nextElementSibling;		
		var nextButton = nextSection.querySelector('.checkAll');
		var nextInput = nextSection.getElementsByTagName('input')[0];
		if (nextButton) {
			focusNoScroll(nextButton);
		} else {
			focusNoScroll(nextInput);
		}
		if (isFirefox) {
			scrollTo(document.getElementsByTagName('html')[0], nextSection.offsetTop, 600);
		} else {
			scrollTo(document.body, nextSection.offsetTop, 600);
		}
	};

	// INIT (run on doc Ready)
	
	if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
		isFirefox = true;
	}
	
	// Adding js-enabled to body (for details)
	document.getElementsByTagName('body')[0].classList.add('js-enabled');
		
	// Hide details
	for (var i = 0; i < details.length; i++) {
		var detail = details[i];
		detail.classList.add('hidden');
		detail.setAttribute('aria-hidden', 'true');
		detail.setAttribute('aria-live', 'polite');
	};
	
	// Create Progress bar
	barWrap.id = 'progress';
	bar.id = 'progress-inner';
	barWrap.appendChild(bar);
	controls.insertBefore(barWrap, controls.firstChild);

	// Get previous state and update progress bar
	var retrievedProgress = storage.get('blitzOptim_barWidth');
	if (retrievedProgress) {
		barHandler(retrievedProgress);
	} else {
	  // Won’t work without setTimeout
	  setTimeout(function() {
			updateProgress();
			storage.set('blitzOptim_barWidth', progress);
		}, 50);
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
	
		// config button then add in section
		helper.type = 'button';
		helper.className = 'helper';
		helper.id = 'helper';
		helper.innerHTML = 'Help';
		howTo.appendChild(helper);
		
		// config help div then add in section
		help.classList.add('help-content', 'hidden');
		help.id = 'help';
		help.setAttribute('aria-hidden', 'true');
		help.setAttribute('aria-live', 'assertive');
		help.innerHTML = '<div class="wrapper">'
			+ '<p>If you’re using a mouse:</p>'
			+ '<ul>'
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

	// add section before main
	document.body.insertBefore(howTo, document.getElementsByTagName('main')[0]);
	
	// Event Listeners 
	
	helper.addEventListener('click', toggleHelp, false);
	
	form.addEventListener('click', function(e) {
		var elt = e.target;
		var isSummary = elt.classList.contains('summary');
		var isSummaryNested = elt.matches('.summary > *');
		var isDetailsPara = elt.classList.contains('details-para');
		var isCheckAllButton = elt.classList.contains('checkAll');
		var isReset = (elt.type === 'reset');
		
		if (isSummary) {
			e.preventDefault();
			toggleDetails(elt);
		} else if (isSummaryNested) {
			e.preventDefault();
			toggleDetails(elt.parentElement);
		} else if (isCheckAllButton) {
			checkChildren(elt);
		} else if (isReset) {
			resetChecklist();
		} else if (isDetailsPara) {
			e.preventDefault();
		} else {
			return;
		}
	});
	
	// Must use keyup as keydown won’t work in firefox for spacebar
	document.addEventListener('keyup', function(e) {
		var active = document.activeElement;
		var isCheckbox = (active.type === 'checkbox');
		var pressBackspace = (e.key === 'Backspace' || e.keyCode === 8);
		var pressEnter = (e.key === 'Enter' || e.keyCode === 13);
		var pressSpacebar = (e.key === 'Spacebar' || e.keyCode === 32);
		
		if (pressBackspace) {
			resetChecklist();
			active.blur();
		} else if (isCheckbox && pressEnter) {
			e.preventDefault();
			var updateChange = new Event('change');
		  if (active.checked) {
		  	active.checked = false;
		  } else {
		  	active.checked = true;
		  };
		  active.dispatchEvent(updateChange);
		} else if (isCheckbox && pressSpacebar) {
			e.preventDefault();
			var pushActive = active.parentElement.getElementsByClassName('summary')[0];			
			toggleDetails(pushActive);
		} else {
			return;
		}
	});

});
function r(f){/in/.test(document.readyState)?setTimeout('r('+f+')',9):f()}																	