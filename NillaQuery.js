// nillaQuery is a lightweight vanilla js library which use the wonderful jQuery syntax without jQuery
// Credits to and inspiration from:
// - jQuery (https://github.com/jquery/jquery)
// - Zepto.js (https://github.com/madrobby/zepto)
// - jquery.alt.ie9.js (https://gist.github.com/jstrangfeld/dbec548b93597d7a1fb1)

//---------------------------
//Copyright TeamVenturePlant and other contributors

//Permission is hereby granted, free of charge, to any person obtaining
//a copy of this software and associated documentation files(the
//"Software"), to deal in the Software without restriction, including
//without limitation the rights to use, copy, modify, merge, publish,
//distribute, sublicense, and / or sell copies of the Software, and to
//permit persons to whom the Software is furnished to do so, subject to
//the following conditions:

//The above copyright notice and this permission notice shall be
//included in all copies or substantial portions of the Software.

//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
//EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
//MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
//NONINFRINGEMENT.IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
//LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
//OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
//WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//---------------------------

var nillaQuery = (function () {
    var class2type = {};

    function ElementList(dom, selector) {
        var i, len = dom ? dom.length : 0;
        for (i = 0; i < len; i++) this[i] = dom[i];
        this.length = len;
        this.selector = selector || '';
    }

    function isFormData(data) {
        if (data === undefined) {
            return false;
        }

        if (data instanceof FormData) {
            return true;
        } else {
            return false;
        }
    }

    function isHtml(selector) {
        if (selector.indexOf('<') === 0) {
            return true;
        } else {
            return false;
        }
    }

    function isJson(data) {
        if (data === undefined) {
            return false;
        }

        if (data instanceof FormData) {
            return false;
        }

        if (typeof data !== 'string')
            data = JSON.stringify(data);

        try {
            JSON.parse(data);
            return true;
        } catch (e) {
            return false;
        }
    }

    function type(obj) {
        return obj === null ? String(obj) :
            class2type[toString.call(obj)] || "object"
    }

    function isFunction(value) { return type(value) === "function" }
    
    function funcArg(context, arg, idx, payload) {
        return isFunction(arg) ? arg.call(context, idx, payload) : arg;
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


        opts.headers && Object.keys(opts.headers).forEach(function (el) {
            request.setRequestHeader(el, opts.headers[el]);
        })

        request.onreadystatechange = function () {
            if (this.readyState === 4) {
                if (this.status >= 200 && this.status < 400) {
                    if (isJson(this.responseText)) {
                        opts.success && opts.success.call(this, JSON.parse(this.responseText), this.status, this);
                    } else {
                        opts.success && opts.success.call(this, this.responseText, this.status, this);
                    }
                } else {
                    opts.error && opts.error.call(this);
                }
            }
        }

        request.onerror = function (errorMessage) {
            opts.error && opts.error.call(errorMessage);
        }

        if (!isFormData(opts.data)) {
            request.setRequestHeader('Content-Type', opts.contentType || 'application/x-www-form-urlencoded; charset=UTF-8');
        }

        if (isJson(opts.data)) {
            request.send($.param(opts.data) || null);
        }
        else {
            request.send(opts.data || null);
        }

        request = null;
    }

    $.each = function (elements, callback) {
        var i;
        var key;

        //for (i = 0; i < elements.length; i++)
        //    if (callback.call(elements[i], i, elements[i]) === false) return elements;

        for (key in elements)
            if (callback.call(elements[key], key, elements[key]) === false) return elements

        return elements
    }

    $.param = function (data) {
        if (typeof data === 'string')
            data = JSON.parse(data);

        return Object.keys(data).map(function (el) {
            return encodeURIComponent(el) + '=' + encodeURIComponent(data[el])
        }).filter(function (n) { return n !== undefined }).join('&')
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
                el = new ElementList($.parseHTML(el), el);
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
                    if (this.children[i].nodeType !== 8)
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
        data: function (prop, value) {
            if (arguments.length === 0) {
                return this.length ? this.first().data || {} : ''
            }
            if (arguments.length === 2) {
                this.each(function () {
                    if (!this.hasOwnProperty('data')) {
                        this.data = {}
                    }
                    this.data[prop] = value
                })
                return this
            }
            else {
                if (this.length && this.first().data) {
                    return this.first().data[prop];
                } else {
                    return '';
                }
            }
        },
        each: function (callback) {
            [].every.call(this, function (el, idx) {
                return callback.call(el, idx, el) !== false;
            });
            return this;
        },
        find: function (selector) {
            return this.length ? new ElementList(this.first().querySelectorAll(selector), this.selector) : this;
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
        height: function () {
            return this[0].offsetHeight || 0;
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
        matches: function (selector) {
            var el = this.first(),
                _matches = (el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector)
            return _matches ?
                _matches.call(el, selector) :
                [].some.call(this.parent().find(selector), function (n) {
                    return n === el
                })
        },
        on: function (eventName, eventHandler) {
            this.each(function () {
                this.addEventListener ?
                    this.addEventListener(eventName, eventHandler) :
                    this.attachEvent('on' + eventName, function () {
                        eventHandler.call(this)
                    })
            })
            return this;
        },
        parent: function () {
            return new ElementList(this.length ? [this.first().parentNode] : [], this.selector);
        },
        prop: function (attribute, value) {
            if (attribute === "checked") {
                if (value === true) {
                    this[0].checked = true;
                } else {
                    this[0].checked = false;
                }

                return this;
            } else {
                return this.attr(attribute, value)
            }
        },
        ready: function (fn) {
            if (document.readyState !== 'loading') {
                fn();
            } else if (document.addEventListener) {
                document.addEventListener('DOMContentLoaded', fn);
            } else {
                document.attachEvent('onreadystatechange', function () {
                    if (document.readyState !== 'loading')
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
        serialize: function () {
            return this.find('input[name], textarea[name], button[name], select[name]').map(function (el) {
                if (el.type === 'checkbox' || el.type === 'radio') {
                    return el.checked ? el.name + '=' + encodeURIComponent(el.value) : undefined
                }
                else {
                    return el.name + '=' + encodeURIComponent(el.value)
                }
            }).filter(function (n) { return n !== undefined }).join('&')
        },
        serializeJson: function () {
            var jsonData = {};

            this.find('input[name], textarea[name], button[name], select[name]').map(function (el) {

                var inputValue = undefined;
                if (el.type === 'checkbox' || el.type === 'radio') {
                    if (el.checked) {
                        inputValue = el.value;
                    }
                }
                else {
                    inputValue = el.value;
                }

                if (inputValue !== undefined) {
                    if (jsonData[el.name] != null) {
                        if (!jsonData[el.name].push) {
                            jsonData[el.name] = [jsonData[el.name]];
                        }

                        jsonData[el.name].push(inputValue);
                    } else {
                        jsonData[el.name] = inputValue;
                    }
                }
            });

            return jsonData;
        },
        show: function (fn) {
            return this.css("display", "");
        },
        slice: function () {
            return $(slice.apply(this, arguments))
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
                if (value === null) value = ""
                return this.each(function (idx) {
                    this.value = funcArg(this, value, idx, this.value);
                });
            } else {
                return this[0] && (this[0].multiple ?
                    $(this[0]).find('option').filter(function () { return this.selected }).pluck('value') :
                    this[0].value);
            }
        },
        width: function () {
            return this[0].offsetWidth || 0;
        }
    }

    if (typeof nillaQueryCustomMethods === 'function') {
        nillaQueryCustomMethods($);
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

window.nillaQuery = nillaQuery;
window["$"] === undefined && (window["$"] = nillaQuery);
