//---------------------------
// NillaQuery is a lightweight alternative to jQuery
// Inspired by:
// - jQuery (https://github.com/jquery/jquery)
// - Zepto.js (https://github.com/madrobby/zepto)
// - jquery.alt.ie9.js (https://gist.github.com/jstrangfeld/dbec548b93597d7a1fb1)
// - vanilla-query.js (https://github.com/makesites/vanilla-query)
//---------------------------

//NillaQueryTag is set per default to use $ as tag but it's possible to customize this by changing the value NillaQueryTag
var NillaQueryTag = "$";

var NillaQuery = (function () {
	function ElementList(dom, selector) {
		var i, len = dom ? dom.length : 0;
		for (i = 0; i < len; i++) this[i] = dom[i];
		this.length = len;
		this.selector = selector || '';
	}

	function isHtml(selector) {
		if (selector.indexOf('<') === 0) {
			return true;
		} else {
			return false;
		}
	}

	function init(selector, context) {
		if (!selector) return new ElementList([]);
		if (typeof selector === 'string') {
			if (isHtml(selector)) {
				return new ElementList($.parseHTML(selector), selector);
			}
			else {
				var parent = context;

				if (typeof context === 'string') {
					parent = document.querySelectorAll(context);
				} else {
					if (typeof context === 'undefined') {
						parent = document;
					} else {
						parent = context;
					}
				}

				if (parent.length > 1) {
					var results = [];
					Array.prototype.slice.call(parent).forEach(function (p) {
						results = results.concat(Array.prototype.slice.call(p.querySelectorAll(selector)));
					})
					return new ElementList(results, selector);
				}
				else {
					if (typeof parent.length === 'undefined') {
						return new ElementList(parent.querySelectorAll(selector), selector);
					} else {
						return new ElementList(parent[0].querySelectorAll(selector), selector);
					}
				}
			}
		}
		else if (typeof selector.nodeType !== 'undefined') {
			return new ElementList([selector], selector);
		}
		else if (typeof selector === 'function') {
			return new ElementList([document], 'document').ready(selector);
		}
	}

	var $ = function (selector, context) {
		return init(selector, context);
	}

	$.ajax = function (opts) {
		var request = new XMLHttpRequest();
		request.open(opts.type || 'GET', opts.url, true);
		request.setRequestHeader('Content-Type', opts.contentType || 'application/x-www-form-urlencoded; charset=UTF-8');

		opts.headers && Object.keys(opts.headers).forEach(function (el) {
			request.setRequestHeader(el, opts.headers[el]);
		})

		request.onreadystatechange = function () {
			if (this.readyState === 4) {
				if (this.status >= 200 && this.status < 400) {
					opts.success && opts.success.call(this, this.responseText, this.status, this);
				} else {
					opts.error && opts.error.call(this);
				}
			}
		}

		request.send(opts.data || null);
		request = null;
	}

	$.fn = {
		constructor: ElementList,
		length: 0,
		addClass: function (className) {
			this.each(function () {
				this.classList ?
					DOMTokenList.prototype.add.apply(this.classList, className.split(' ')) :
					this.className += ' ' + className
			});
			return this
		},
		append: function (el) {
			if (typeof el === 'string') {
				el = new NodeCollection($.parseHTML(el), el);
			}
			if (el.length > 1) {
				var fragment = document.createDocumentFragment();
				el.each(function () {
					fragment.appendChild(this);
				})
				this.each(function () {
					this.appendChild(fragment);
				})
			}
			else {
				this.each(function () {
					this.appendChild(el.first());
				})
			}
			return this;
		},
		attr: function (attribute, value) {
			if (typeof attribute === 'object') {
				this.each(function () {
					var node = this;
					Object.keys(attribute).forEach(function (key) {
						node.setAttribute(key, attribute[key]);
					})
				})
				return this
			}
			else {
				if (typeof value !== 'undefined') {
					this.each(function () {
						this.setAttribute(attribute, value);
					})
					return this;
				}
				else {
					return this.length ? this.first().getAttribute(attribute) : '';
				}
			}
		},
		children: function () {
			var children = [];
			this.each(function () {
				for (var i = this.children.length; i--;) {
					// Skip comment nodes on IE8
					if (this.children[i].nodeType != 8)
						children.unshift(this.children[i]);
				}
			})
			return new ElementList(children, this.selector);
		},
		closest: function (selector) {
			if (!this.length) return new ElementList([], selector);
			var ancestors = [];
			this.each(function () {
				var parent = $(this.parentNode);
				while (!parent.matches(selector)) {
					parent = parent.parent();
				}
				ancestors.push(parent.first());
			})
			return new ElementList(ancestors.filter(function (el) { return typeof el !== 'undefined' }), selector);
		},
		css: function (property, value) {
			return this.each(function () {
				this.style[property] = value;
			});
		},
		each: function (callback) {
			[].every.call(this, function (el, idx) {
				return callback.call(el, idx, el) !== false;
			});
			return this;
		},
		find: function (selector) {
			return this.length ? new NodeCollection(this.first().querySelectorAll(selector), this.selector) : this;
		},
		first: function () {
			return this[0];
		},
		hasClass: function (className) {
			return this.length ?
				this.first().classList ?
					this.first().classList.contains(className) :
					new RegExp('(^| )' + className + '( |$)', 'gi').test(this[0].className) :
				false;
		},
		hide: function (fn) {
			return this.css("display", "none");
		},
		html: function (string) {
			if (typeof string !== 'undefined') {
				this.each(function () {
					this.innerHTML = string;
				});
				return this;
			}
			else {
				return this.length ? this.first().innerHTML : '';
			}
		},
		on: function (eventName, eventHandler) {
			this.each(function () {
				this.addEventListener ?
					this.addEventListener(eventName, eventHandler) :
					this.attachEvent('on' + eventName, function () {
						eventHandler.call(this);
					})
			});
			return this;
		},
		parent: function () {
			return new NodeCollection(this.length ? [this.first().parentNode] : [], this.selector);
		},
		ready: function (fn) {
			if (document.readyState != 'loading') {
				fn();
			} else if (document.addEventListener) {
				document.addEventListener('DOMContentLoaded', fn);
			} else {
				document.attachEvent('onreadystatechange', function () {
					if (document.readyState != 'loading')
						fn();
				});
			}
		},
		removeClass: function (className) {
			this.each(function () {
				this.classList ?
					DOMTokenList.prototype.remove.apply(this.classList, className.split(' ')) :
					this.className = this.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
			})
			return this;
		},
		show: function (fn) {
			return this.css("display", "");
		},
		text: function (string) {
			if (typeof string !== 'undefined') {
				this.each(function () {
					this[typeof this.textContent !== 'undefined' ? 'textContent' : 'innerText'] = string;
				})
				return this;
			}
			else {
				return this.length ? this.first().textContent || this.first().innerText : '';
			}
		},
		toggleClass: function (className) {
			this.each(function () {
				if (this.classList) {
					this.classList.toggle(className);
				}
				else {
					var classes = this.className.split(' '),
						existingIndex = -1
					for (var i = classes.length; i--;) {
						classes[i] === className && (existingIndex = i)
					}
					(existingIndex >= 0) ?
						classes.splice(existingIndex, 1) :
						classes.push(className)
					this.className = classes.join(' ');
				}
			})
			return this
		},
		trigger: function (eventName) {
			this.each(function () {
				this.dispatchEvent(new CustomEvent(eventName));
			})
		},
		val: function (value) {
			if (0 in arguments) {
				if (value == null) value = ""
				return this.each(function (idx) {
					this.value = funcArg(this, value, idx, this.value);
				});
			} else {
				return this[0] && (this[0].multiple ?
					$(this[0]).find('option').filter(function () { return this.selected }).pluck('value') :
					this[0].value);
			}
		}
	}

	function createArrayProto() {
		var arr = [];
		for (var prop in $.fn) {
			arr[prop] = $.fn[prop];
		}
		return arr;
	}

	ElementList.prototype = createArrayProto();

	return $;
}());

window.NillaQuery = NillaQuery;
window[NillaQueryTag] === undefined && (window[NillaQueryTag] = NillaQuery);