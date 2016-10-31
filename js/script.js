/* It’s not elegant nor uber optimized but it was erratically designed in the span of a few weeks and gets the job done. Please feel free to improve. Thanks. */

r(function() {
	// VARIABLES
	
	var summary = document.getElementsByClassName('summary'),
			details = document.getElementsByClassName('details'),
			checkAll = document.getElementsByClassName('checkAll'),
			label = document.getElementsByTagName('label'),
			boxes = document.querySelectorAll('input[type="checkbox"]'),

			reset = document.querySelector('input[type="reset"]'),
			
			helper = document.getElementById('helper'),
			help = document.getElementById('help'),
			
			bar = document.getElementById('progress-inner'),
			count = boxes.length,
			checked = 0,
			progress = 0;
	
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
	function storeCheckbox(box) {
		// storageID = name
		var storageId = "blitzOptim_" + box.getAttribute("value");
		// We check if an value is already stored
		var oldVal = storage.get(storageId);
		
		// check if old value stored
		box.checked = oldVal === "true" ? true : false;

		// add listener change, count # of checked, store name + progress
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
	
	// Toggle details
	function toggleDetails(e) {
		e.preventDefault();
		// toggle class open on summary
		this.classList.toggle('open');
		// toggle class hidden + aria for details = nextElementSibling
		this.nextElementSibling.classList.toggle('hidden');		
		if (this.nextElementSibling.getAttribute("aria-hidden") === "true") {
			this.nextElementSibling.setAttribute('aria-hidden', 'false');
		} else {
			this.nextElementSibling.setAttribute('aria-hidden', 'true');
		}
	};
	
	function toggleHelp(e) {
		e.preventDefault();
		help.classList.toggle('hidden');
		if (help.getAttribute('aria-hidden') === 'true') {
			help.setAttribute('aria-hidden', 'false');
		}	else {
			help.setAttribute('aria-hidden', 'true');
		}
	};
	
	// Check all inputs for SVG, JS and anims
	function checkChildren(e) {
		e.preventDefault();
		// check if SVG, JS or anim
		var checkScope = this.getAttribute('id');
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
		this.setAttribute('disabled', 'disabled');
		// store value of button
		storage.set("blitzOptim_" + this.getAttribute("id") + "_button", "true");
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


	// EVENT LISTENERS

	for (var i = 0; i < count; i++) {
		var box = boxes[i];
		if (box.hasAttribute("value")) {
			storeCheckbox(box);
			
			// Add in storeCheckbox function ?
			box.addEventListener('keydown', function(e) {
		  	if (e.keyCode == 13) {
		  		e.preventDefault();
					var updateChange = new Event('change');
		  		if (this.checked) {
		  			this.checked = false;
		  		} else {
		  			this.checked = true;
		  		};
		  		this.dispatchEvent(updateChange);
		  	} else if (e.keyCode == 32) {
		  		// = toggleDetails() so design a common function
					e.preventDefault();
					var parentEl = this.parentElement;
					var detail = parentEl.getElementsByClassName('details')[0];
					detail.previousElementSibling.classList.toggle('open');
					detail.classList.toggle('hidden');
					if (detail.getAttribute('aria-hidden') === 'true') {
						detail.setAttribute('aria-hidden', 'false');
					} else {
						detail.setAttribute('aria-hidden', 'true');				
					}
				}
			});
		}
	};
	
	reset.addEventListener('touchend', resetChecklist, true);
	reset.addEventListener('click', resetChecklist, true);

	for (var i = 0; i < summary.length; i++) {
		summary[i].addEventListener('click', toggleDetails, false);
	};

	for (var i = 0; i < checkAll.length; i++) {
		var button = checkAll[i];
		var disabled = storage.get("blitzOptim_" + button.getAttribute("id") + "_button");
		if (disabled) {
			button.setAttribute('disabled', 'disabled');
		}
		button.addEventListener('touchend', checkChildren, true);
		button.addEventListener('click', checkChildren, true);
	}
	
	helper.addEventListener('touchend', toggleHelp, false);
	helper.addEventListener('click', toggleHelp, false);
	
	document.onkeydown = function(e) {
		e = e || window.event;
		var isEscape = false;
		if ("key" in e) {
			isEscape = (e.key == "Escape" || e.key == "Esc");
		} else {
			isEscape = (e.keyCode == 27);
		}
		if (isEscape) {
				resetChecklist();
		}
	};

});
function r(f){/in/.test(document.readyState)?setTimeout('r('+f+')',9):f()}																	