
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var e=function(e,r){(null==r||r>e.length)&&(r=e.length);for(var t=0,n=new Array(r);t<r;t++)n[t]=e[t];return n};var r=function(r){if(Array.isArray(r))return e(r)};var t$1=function(e){if("undefined"!=typeof Symbol&&Symbol.iterator in Object(e))return Array.from(e)};var n$1=function(r,t){if(r){if("string"==typeof r)return e(r,t);var n=Object.prototype.toString.call(r).slice(8,-1);return "Object"===n&&r.constructor&&(n=r.constructor.name),"Map"===n||"Set"===n?Array.from(r):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?e(r,t):void 0}};var o=function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")};var i=function(e){return r(e)||t$1(e)||n$1(e)||o()};var a=function(e,r){if(!(e instanceof r))throw new TypeError("Cannot call a class as a function")};function u(e,r){for(var t=0;t<r.length;t++){var n=r[t];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n);}}var l=function(e,r,t){return r&&u(e.prototype,r),t&&u(e,t),e};var c=function(e,r,t){return r in e?Object.defineProperty(e,r,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[r]=t,e},f=function(e){return 1===(null==e?void 0:e.nodeType)};function s(e,r){var t;if("undefined"==typeof Symbol||null==e[Symbol.iterator]){if(Array.isArray(e)||(t=function(e,r){if(!e)return;if("string"==typeof e)return d(e,r);var t=Object.prototype.toString.call(e).slice(8,-1);"Object"===t&&e.constructor&&(t=e.constructor.name);if("Map"===t||"Set"===t)return Array.from(e);if("Arguments"===t||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t))return d(e,r)}(e))||r&&e&&"number"==typeof e.length){t&&(e=t);var n=0,o=function(){};return {s:o,n:function(){return n>=e.length?{done:!0}:{done:!1,value:e[n++]}},e:function(e){throw e},f:o}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var i,a=!0,u=!1;return {s:function(){t=e[Symbol.iterator]();},n:function(){var e=t.next();return a=e.done,e},e:function(e){u=!0,i=e;},f:function(){try{a||null==t.return||t.return();}finally{if(u)throw i}}}}function d(e,r){(null==r||r>e.length)&&(r=e.length);for(var t=0,n=new Array(r);t<r;t++)n[t]=e[t];return n}var v=function(){function e(){a(this,e),c(this,"_observer",null);}return l(e,[{key:"wait",value:function(r){var t=this,n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null,o=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{},a=o.events,u=void 0===a?e.EVENTS:a,l=o.timeout,c=void 0===l?0:l,d=o.attributeFilter,v=void 0===d?void 0:d,b=o.onError,m=void 0===b?void 0:b;return this.clear(),new Promise((function(o,a){var l=f(r)?r:document.querySelector(r);l&&u.includes(e.EXIST)&&(n?n(l,e.EXIST):o({node:l,event:e.EXIST})),c>0&&(t._timeout=setTimeout((function(){t.clear();var e=new Error("[TIMEOUT]: Element ".concat(r," cannot be found after ").concat(c,"ms"));n?null==m||m(e):a(e);}),c)),t._observer=new MutationObserver((function(t){t.forEach((function(t){var a,l=t.type,c=t.target,d=t.addedNodes,v=t.removedNodes,b=t.attributeName,m=t.oldValue;if("childList"===l&&(u.includes(e.ADD)||u.includes(e.REMOVE))){var y,E=s([].concat(i(u.includes(e.ADD)?Array.from(d):[]),i(u.includes(e.REMOVE)?Array.from(v):[])));try{for(E.s();!(y=E.n()).done;){var h,A=y.value;(A===r||!f(r)&&null!==(h=A.matches)&&void 0!==h&&h.call(A,r))&&(n?n(A,Array.from(d).includes(A)?e.ADD:e.REMOVE):o({node:A,event:Array.from(d).includes(A)?e.ADD:e.REMOVE}));}}catch(e){E.e(e);}finally{E.f();}}"attributes"===l&&u.includes(e.CHANGE)&&((c===r||!f(r)&&null!==(a=c.matches)&&void 0!==a&&a.call(c,r))&&(n?n(c,e.CHANGE,{attributeName:b,oldValue:m}):o({node:c,event:e.CHANGE,options:{attributeName:b,oldValue:m}})));}));})),t._observer.observe(document.documentElement,{subtree:!0,childList:u.includes(e.ADD)||u.includes(e.REMOVE),attributes:u.includes(e.CHANGE),attributeOldValue:u.includes(e.CHANGE),attributeFilter:v});}))}},{key:"clear",value:function(){var e;null===(e=this._observer)||void 0===e||e.disconnect(),clearTimeout(this._timeout);}}]),e}();c(v,"EXIST","DOMObserver_exist"),c(v,"ADD","DOMObserver_add"),c(v,"REMOVE","DOMObserver_remove"),c(v,"CHANGE","DOMObserver_change"),c(v,"EVENTS",[v.EXIST,v.ADD,v.REMOVE,v.CHANGE]);

    var t=function(t){return "string"==typeof t||"[object String]"===Object.prototype.toString.call(t)};

    var n=function(n){return 1===(null==n?void 0:n.nodeType)};

    const resolveDragImage = (source) => {
    	if (!!source) {
    		if (n(source)) {
    			return source
    		} else if (source.src || t(source)) {
    			const image = new Image();
    			image.src = source.src || source;
    			source.width && (image.width = source.width);
    			source.height && (image.height = source.height);
    			return image
    		}
    	}
    	return null
    };

    const getCSSDeclaration = (className, returnText = false) => {
    	if (!!className) {
    		className = className.startsWith('.') ? className : `.${className}`;

    		if (!!document.styleSheets?.length) {
    			for (let { cssRules } of document.styleSheets) {
    				for (let { selectorText, style } of cssRules) {
    					if (selectorText === className && !!style) {
    						return returnText ? style.cssText : style
    					}
    				}
    			}
    		}
    	}

    	return null
    };

    const doElementsOverlap = (element1, element2) => {
    	const { left: left1, right: right1, top: top1, bottom: bottom1 } = element1.getBoundingClientRect();
    	const { left: left2, right: right2, top: top2, bottom: bottom2 } = element2.getBoundingClientRect();

    	return !(top1 > bottom2 || right1 < left2 || bottom1 < top2 || left1 > right2)
    };

    class DragAndDrop {
    	static instances = []

    	#target = null
    	#dragImage = null
    	#animate = null
    	#dragClassName = null
    	#animateOptions = null
    	#onDropOutside = null
    	#onDropInside = null
    	#onDragCancel = null

    	#observer = null
    	#area = null
    	#drag = null
    	#holdX = 0
    	#holdY = 0
    	#dragWidth = 0
    	#dragHeight = 0

    	#boundMouseOverHandler = null
    	#boundMouseOutHandler = null
    	#boundMouseDownHandler = null
    	#boundMouseMoveHandler = null
    	#boundMouseUpHandler = null

    	static destroy() {
    		DragAndDrop.instances.forEach((instance) => {
    			instance.destroy();
    		});
    		DragAndDrop.instances = [];
    	}

    	constructor(
    		target,
    		areaSelector,
    		dragImage,
    		dragClassName,
    		animate,
    		animateOptions,
    		onDropOutside,
    		onDropInside,
    		onDragCancel
    	) {
    		this.#target = target;
    		this.#dragImage = dragImage;
    		this.#dragClassName = dragClassName;
    		this.#animate = animate || false;
    		this.#animateOptions = { duration: 0.2, timingFunction: 'ease', ...(animateOptions || {}) };
    		this.#onDropOutside = onDropOutside;
    		this.#onDropInside = onDropInside;
    		this.#onDragCancel = onDragCancel;

    		this.#area = document.querySelector(areaSelector);

    		this.#drag = this.#dragImage ? resolveDragImage(this.#dragImage) : this.#target.cloneNode(true);
    		this.#drag.setAttribute('draggable', false);
    		this.#drag.setAttribute('id', 'drag');
    		this.#drag.setAttribute('role', 'presentation');
    		this.#drag.classList.add('__drag');
    		if (!!this.#dragClassName) {
    			const cssText = getCSSDeclaration(this.#dragClassName, true);
    			if (!!cssText) {
    				this.#drag.style.cssText = cssText;
    			}
    		}

    		this.#observer = new v();
    		this.#observer.wait(this.#drag, null, { events: [v.ADD] }).then(() => {
    			const { width, height } = this.#drag.getBoundingClientRect();
    			this.#dragWidth = width;
    			this.#dragHeight = height;
    		});

    		this.#boundMouseOverHandler = this.#onMouseOver.bind(this);
    		this.#boundMouseOutHandler = this.#onMouseOut.bind(this);
    		this.#boundMouseDownHandler = this.#onMouseDown.bind(this);

    		this.#target.addEventListener('mouseover', this.#boundMouseOverHandler, false);
    		this.#target.addEventListener('mouseout', this.#boundMouseOutHandler, false);
    		this.#target.addEventListener('mousedown', this.#boundMouseDownHandler, false);
    		this.#target.addEventListener('touchstart', this.#boundMouseDownHandler, false);

    		DragAndDrop.instances.push(this);
    	}

    	destroy() {
    		this.#target.removeEventListener('mouseover', this.#boundMouseOverHandler);
    		this.#target.removeEventListener('mouseout', this.#boundMouseOutHandler);
    		this.#target.removeEventListener('mousedown', this.#boundMouseDownHandler);
    		this.#target.removeEventListener('touchstart', this.#boundMouseDownHandler);

    		this.#boundMouseOverHandler = null;
    		this.#boundMouseOutHandler = null;
    		this.#boundMouseDownHandler = null;

    		this.#observer?.clear();
    		this.#observer = null;
    	}

    	#animateBack(callback) {
    		if (this.#animate) {
    			this.#drag.style.setProperty('--origin-x', this.#target.getBoundingClientRect().left + 'px');
    			this.#drag.style.setProperty('--origin-y', this.#target.getBoundingClientRect().top + 'px');
    			this.#drag.style.animation = `move ${this.#animateOptions.duration}s ${this.#animateOptions.timingFunction}`;
    			this.#drag.addEventListener(
    				'animationend',
    				() => {
    					this.#drag.style.animation = 'none';
    					this.#drag.remove();
    					callback?.(this.#target, this.#area);
    				},
    				false
    			);
    		} else {
    			this.#drag.remove();
    			callback?.(this.#target, this.#area);
    		}
    	}

    	#onMouseOver(e) {
    		e.target.style.cursor = 'grab';
    	}

    	#onMouseOut(e) {
    		e.target.style.cursor = 'default';
    	}

    	#onMouseMove(e) {
    		if (this.#drag.style.visibility === 'hidden') {
    			this.#drag.style.visibility = 'visible';
    		}

    		const pageX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
    		const pageY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;

    		this.#drag.style.left = pageX - (this.#dragImage ? this.#dragWidth >> 1 : this.#holdX) + 'px';
    		this.#drag.style.top = pageY - (this.#dragImage ? this.#dragHeight >> 1 : this.#holdY) + 'px';
    	}

    	#onMouseDown(e) {
    		const clientX = e.type === 'touchstart' ? e.targetTouches[0].clientX : e.clientX;
    		const clientY = e.type === 'touchstart' ? e.targetTouches[0].clientY : e.clientY;
    		this.#holdX = clientX - this.#target.getBoundingClientRect().left;
    		this.#holdY = clientY - this.#target.getBoundingClientRect().top;

    		this.#drag.style.visibility = 'hidden';
    		this.#drag.style.cursor = 'grabbing';

    		this.#boundMouseMoveHandler = this.#onMouseMove.bind(this);
    		this.#boundMouseUpHandler = this.#onMouseUp.bind(this);

    		document.addEventListener('mousemove', this.#boundMouseMoveHandler, false);
    		document.addEventListener('mouseup', this.#boundMouseUpHandler, false);
    		document.addEventListener('touchmove', this.#boundMouseMoveHandler, false);
    		document.addEventListener('keydown', this.#boundMouseUpHandler);
    		this.#target.addEventListener('touchend', this.#boundMouseUpHandler, false);
    		this.#target.addEventListener('touchcancel', this.#boundMouseUpHandler, false);

    		this.#target.parentNode.appendChild(this.#drag);
    	}

    	#onMouseUp(e) {
    		if (e.type.startsWith('key') && e.key !== 'Escape') {
    			return
    		}

    		document.removeEventListener('mousemove', this.#boundMouseMoveHandler);
    		document.removeEventListener('mouseup', this.#boundMouseUpHandler);
    		document.removeEventListener('touchmove', this.#boundMouseMoveHandler);
    		document.removeEventListener('keydown', this.#boundMouseUpHandler);
    		this.#target.removeEventListener('touchend', this.#boundMouseUpHandler);
    		this.#target.removeEventListener('touchcancel', this.#boundMouseUpHandler);

    		this.#boundMouseMoveHandler = null;
    		this.#boundMouseUpHandler = null;

    		const doOverlap = doElementsOverlap(this.#area, this.#drag);

    		if (e.type.startsWith('key')) {
    			this.#animateBack(this.#onDragCancel);
    		} else if (doOverlap) {
    			this.#animateBack(this.#onDropInside);
    		} else {
    			this.#drag.remove();
    			this.#onDropOutside?.(this.#target, this.#area);
    		}
    	}
    }

    const useDropOutside = (
    	node,
    	{ areaSelector, dragImage, dragClassName, animate, animateOptions, onDropOutside, onDropInside, onDragCancel }
    ) => {
    	const instance = new DragAndDrop(
    		node,
    		areaSelector,
    		dragImage,
    		dragClassName,
    		animate,
    		animateOptions,
    		onDropOutside,
    		onDropInside,
    		onDragCancel
    	);

    	return {
    		destroy: () => instance.destroy(),
    	}
    };

    /* src\App.svelte generated by Svelte v3.44.0 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (44:8) {#each colors as color, index}
    function create_each_block(ctx) {
    	let li;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			attr_dev(li, "style", `background-color: ${/*color*/ ctx[4]}`);
    			attr_dev(li, "class", "slot svelte-xc2x4a");
    			add_location(li, file, 44, 10, 852);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);

    			if (!mounted) {
    				dispose = action_destroyer(useDropOutside.call(null, li, {
    					areaSelector: '.area',
    					animate: true,
    					animateOptions: {
    						timingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    					},
    					onDropOutside: /*_onDropOutside*/ ctx[1],
    					onDropInside: /*_onDropInside*/ ctx[2],
    					onDragCancel: /*_onDragCancel*/ ctx[3]
    				}));

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(44:8) {#each colors as color, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div1;
    	let p;
    	let t1;
    	let div0;
    	let ul;
    	let each_value = /*colors*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			div1 = element("div");
    			p = element("p");
    			p.textContent = "Drop the color slots outside the white area to delete them";
    			t1 = space();
    			div0 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(p, "class", "instruction svelte-xc2x4a");
    			add_location(p, file, 40, 4, 653);
    			attr_dev(ul, "class", "slot-list svelte-xc2x4a");
    			add_location(ul, file, 42, 6, 778);
    			attr_dev(div0, "id", "area");
    			attr_dev(div0, "class", "area svelte-xc2x4a");
    			add_location(div0, file, 41, 2, 742);
    			attr_dev(div1, "class", "container svelte-xc2x4a");
    			add_location(div1, file, 39, 1, 624);
    			attr_dev(main, "class", "svelte-xc2x4a");
    			add_location(main, file, 38, 0, 615);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div1);
    			append_dev(div1, p);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*colors, _onDropOutside, _onDropInside, _onDragCancel*/ 15) {
    				each_value = /*colors*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	const colors = [
    		'#865C54',
    		'#8F5447',
    		'#A65846',
    		'#A9715E',
    		'#AD8C72',
    		'#C2B091',
    		'#172B41',
    		'#32465C',
    		'#617899',
    		'#9BA2BC',
    		'#847999',
    		'#50526A',
    		'#8B8C6B',
    		'#97A847',
    		'#5B652C',
    		'#6A6A40',
    		'#F2D9BF',
    		'#F5BAAE',
    		'#F1A191'
    	];

    	const _onDropOutside = (node, area) => {
    		node.remove();
    	};

    	const _onDropInside = () => {
    		console.log('Dropped inside!');
    	};

    	const _onDragCancel = () => {
    		console.log('Drag cancelled!');
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		useDropOutside,
    		colors,
    		_onDropOutside,
    		_onDropInside,
    		_onDragCancel
    	});

    	return [colors, _onDropOutside, _onDropInside, _onDragCancel];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
