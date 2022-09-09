
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
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
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
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
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
        seen_callbacks.clear();
        set_current_component(saved_component);
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.49.0' }, detail), { bubbles: true }));
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

    var e=function(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,r=new Array(t);n<t;n++)r[n]=e[n];return r},t=function(t){if(Array.isArray(t))return e(t)},n=function(t,n){if(t){if("string"==typeof t)return e(t,n);var r=Object.prototype.toString.call(t).slice(8,-1);return "Object"===r&&t.constructor&&(r=t.constructor.name),"Map"===r||"Set"===r?Array.from(t):"Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)?e(t,n):void 0}},r=function(e){return t(e)||function(e){if("undefined"!=typeof Symbol&&Symbol.iterator in Object(e))return Array.from(e)}(e)||n(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()};function o(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}var i=function(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e},s=function(e){return 1===(null==e?void 0:e.nodeType)};function a(e,t){var n;if("undefined"==typeof Symbol||null==e[Symbol.iterator]){if(Array.isArray(e)||(n=function(e,t){if(e){if("string"==typeof e)return u(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);return "Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n?Array.from(e):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?u(e,t):void 0}}(e))||t&&e&&"number"==typeof e.length){n&&(e=n);var r=0,o=function(){};return {s:o,n:function(){return r>=e.length?{done:!0}:{done:!1,value:e[r++]}},e:function(e){throw e},f:o}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var i,s=!0,a=!1;return {s:function(){n=e[Symbol.iterator]();},n:function(){var e=n.next();return s=e.done,e},e:function(e){a=!0,i=e;},f:function(){try{s||null==n.return||n.return();}finally{if(a)throw i}}}}function u(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,r=new Array(t);n<t;n++)r[n]=e[n];return r}var d=function(){function e(){((function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}))(this,e),i(this,"_observer",null);}return function(e,t,n){t&&o(e.prototype,t),n&&o(e,n);}(e,[{key:"wait",value:function(t){var n=this,o=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null,i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{},u=i.events,d=void 0===u?e.EVENTS:u,l=i.timeout,h=void 0===l?0:l,c=i.attributeFilter,g=void 0===c?void 0:c,v=i.onError,m=void 0===v?void 0:v;return this.clear(),new Promise((function(i,u){var l=s(t)?t:document.querySelector(t);l&&d.includes(e.EXIST)&&(o?o(l,e.EXIST):i({node:l,event:e.EXIST})),h>0&&(n._timeout=setTimeout((function(){n.clear();var e=new Error("[TIMEOUT]: Element ".concat(t," cannot be found after ").concat(h,"ms"));o?null==m||m(e):u(e);}),h)),n._observer=new MutationObserver((function(n){n.forEach((function(n){var u,l=n.type,h=n.target,c=n.addedNodes,g=n.removedNodes,v=n.attributeName,m=n.oldValue;if("childList"===l&&(d.includes(e.ADD)||d.includes(e.REMOVE))){var b,f=a([].concat(r(d.includes(e.ADD)?Array.from(c):[]),r(d.includes(e.REMOVE)?Array.from(g):[])));try{for(f.s();!(b=f.n()).done;){var y,p=b.value;(p===t||!s(t)&&null!==(y=p.matches)&&void 0!==y&&y.call(p,t))&&(o?o(p,Array.from(c).includes(p)?e.ADD:e.REMOVE):i({node:p,event:Array.from(c).includes(p)?e.ADD:e.REMOVE}));}}catch(e){f.e(e);}finally{f.f();}}"attributes"===l&&d.includes(e.CHANGE)&&(h===t||!s(t)&&null!==(u=h.matches)&&void 0!==u&&u.call(h,t))&&(o?o(h,e.CHANGE,{attributeName:v,oldValue:m}):i({node:h,event:e.CHANGE,options:{attributeName:v,oldValue:m}}));}));})),n._observer.observe(document.documentElement,{subtree:!0,childList:d.includes(e.ADD)||d.includes(e.REMOVE),attributes:d.includes(e.CHANGE),attributeOldValue:d.includes(e.CHANGE),attributeFilter:g});}))}},{key:"clear",value:function(){var e;null===(e=this._observer)||void 0===e||e.disconnect(),clearTimeout(this._timeout);}}]),e}();i(d,"EXIST","DOMObserver_exist"),i(d,"ADD","DOMObserver_add"),i(d,"REMOVE","DOMObserver_remove"),i(d,"CHANGE","DOMObserver_change"),i(d,"EVENTS",[d.EXIST,d.ADD,d.REMOVE,d.CHANGE]);const l=e=>{if(e){if(function(e){return 1===(null==e?void 0:e.nodeType)}(e))return e;if(e.src||function(e){return "string"==typeof e||"[object String]"===Object.prototype.toString.call(e)}(e)){const t=new Image;return t.src=e.src||e,e.width&&(t.width=e.width),e.height&&(t.height=e.height),t}}return null};!function(e,t){void 0===t&&(t={});var n=t.insertAt;if(e&&"undefined"!=typeof document){var r=document.head||document.getElementsByTagName("head")[0],o=document.createElement("style");o.type="text/css","top"===n&&r.firstChild?r.insertBefore(o,r.firstChild):r.appendChild(o),o.styleSheet?o.styleSheet.cssText=e:o.appendChild(document.createTextNode(e));}}(".__drag {\n    position: absolute;\n    z-index: 999;\n    user-select: none;\n    opacity: .7;\n\n    --origin-x: 0px;\n    --origin-y: 0px;\n}\n\n@keyframes move {\n    100% {\n        left: var(--origin-x);\n        top: var(--origin-y);\n    }\n}");class h{static instances=[];#e=null;#t=null;#n=null;#r=null;#o=null;#i=null;#s=null;#a=null;#u=null;#d=null;#l=null;#h=0;#c=0;#g=0;#v=0;#m=null;#b=null;#f=null;#y=null;#p=null;static destroy(){h.instances.forEach((e=>{e.destroy();})),h.instances=[];}constructor(e,t,n,r,o,i,s,a,u){if(this.#e=e,this.#t=n,this.#r=r,this.#n=o||!1,this.#o={duration:.2,timingFunction:"ease",...i||{}},this.#i=s,this.#s=a,this.#a=u,this.#d=document.querySelector(t),this.#l=this.#t?l(this.#t):this.#e.cloneNode(!0),this.#l.setAttribute("draggable",!1),this.#l.setAttribute("id","drag"),this.#l.setAttribute("role","presentation"),this.#l.classList.add("__drag"),this.#r){const e=((e,t=!1)=>{if(e&&(e=e.startsWith(".")?e:`.${e}`,document.styleSheets?.length))for(let{cssRules:n}of document.styleSheets)for(let{selectorText:r,style:o}of n)if(r===e&&o)return t?o.cssText:o;return null})(this.#r,!0);e&&(this.#l.style.cssText=e);}this.#u=new d,this.#u.wait(this.#l,null,{events:[d.ADD]}).then((()=>{const{width:e,height:t}=this.#l.getBoundingClientRect();this.#g=e,this.#v=t;})),this.#m=this.#M.bind(this),this.#b=this.#E.bind(this),this.#f=this.#O.bind(this),this.#e.addEventListener("mouseover",this.#m,!1),this.#e.addEventListener("mouseout",this.#b,!1),this.#e.addEventListener("mousedown",this.#f,!1),this.#e.addEventListener("touchstart",this.#f,!1),h.instances.push(this);}destroy(){this.#e.removeEventListener("mouseover",this.#m),this.#e.removeEventListener("mouseout",this.#b),this.#e.removeEventListener("mousedown",this.#f),this.#e.removeEventListener("touchstart",this.#f),this.#m=null,this.#b=null,this.#f=null,this.#u?.clear(),this.#u=null;}#H(e){this.#n?(this.#l.style.setProperty("--origin-x",this.#e.getBoundingClientRect().left+"px"),this.#l.style.setProperty("--origin-y",this.#e.getBoundingClientRect().top+"px"),this.#l.style.animation=`move ${this.#o.duration}s ${this.#o.timingFunction}`,this.#l.addEventListener("animationend",(()=>{this.#l.style.animation="none",this.#l.remove(),e?.(this.#e,this.#d);}),!1)):(this.#l.remove(),e?.(this.#e,this.#d));}#M(e){e.target.style.cursor="grab";}#E(e){e.target.style.cursor="default";}#D(e){"hidden"===this.#l.style.visibility&&(this.#l.style.visibility="visible");const t="touchmove"===e.type?e.targetTouches[0].pageX:e.pageX,n="touchmove"===e.type?e.targetTouches[0].pageY:e.pageY;this.#l.style.left=t-(this.#t?this.#g>>1:this.#h)+"px",this.#l.style.top=n-(this.#t?this.#v>>1:this.#c)+"px";}#O(e){const t="touchstart"===e.type?e.targetTouches[0].clientX:e.clientX,n="touchstart"===e.type?e.targetTouches[0].clientY:e.clientY;this.#h=t-this.#e.getBoundingClientRect().left,this.#c=n-this.#e.getBoundingClientRect().top,this.#l.style.visibility="hidden",this.#l.style.cursor="grabbing",this.#y=this.#D.bind(this),this.#p=this.#w.bind(this),document.addEventListener("mousemove",this.#y,!1),document.addEventListener("mouseup",this.#p,!1),document.addEventListener("touchmove",this.#y,!1),document.addEventListener("keydown",this.#p),this.#e.addEventListener("touchend",this.#p,!1),this.#e.addEventListener("touchcancel",this.#p,!1),this.#e.parentNode.appendChild(this.#l);}#w(e){if(e.type.startsWith("key")&&"Escape"!==e.key)return;document.removeEventListener("mousemove",this.#y),document.removeEventListener("mouseup",this.#p),document.removeEventListener("touchmove",this.#y),document.removeEventListener("keydown",this.#p),this.#e.removeEventListener("touchend",this.#p),this.#e.removeEventListener("touchcancel",this.#p),this.#y=null,this.#p=null;const t=((e,t)=>{const{left:n,right:r,top:o,bottom:i}=e.getBoundingClientRect(),{left:s,right:a,top:u,bottom:d}=t.getBoundingClientRect();return !(o>d||r<s||i<u||n>a)})(this.#d,this.#l);e.type.startsWith("key")?this.#H(this.#a):t?this.#H(this.#s):(this.#l.remove(),this.#i?.(this.#e,this.#d));}}const c=(e,{areaSelector:t,dragImage:n,dragClassName:r,animate:o,animateOptions:i,onDropOutside:s,onDropInside:a,onDragCancel:u})=>{const d=new h(e,t,n,r,o,i,s,a,u);return {destroy:()=>d.destroy()}};

    /* src\App.svelte generated by Svelte v3.49.0 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (101:4) {#each colors as color, index}
    function create_each_block(ctx) {
    	let li;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			attr_dev(li, "style", `background-color: ${/*color*/ ctx[4]}`);
    			attr_dev(li, "class", "slot svelte-i69o");
    			add_location(li, file, 101, 5, 1657);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);

    			if (!mounted) {
    				dispose = action_destroyer(c.call(null, li, {
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
    		source: "(101:4) {#each colors as color, index}",
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
    			p.textContent = "Drop the color slots outside the white area";
    			t1 = space();
    			div0 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(p, "class", "instruction svelte-i69o");
    			add_location(p, file, 97, 2, 1489);
    			attr_dev(ul, "class", "slot-list svelte-i69o");
    			add_location(ul, file, 99, 3, 1594);
    			attr_dev(div0, "id", "area");
    			attr_dev(div0, "class", "area svelte-i69o");
    			add_location(div0, file, 98, 2, 1562);
    			attr_dev(div1, "class", "container svelte-i69o");
    			add_location(div1, file, 96, 1, 1463);
    			attr_dev(main, "class", "svelte-i69o");
    			add_location(main, file, 95, 0, 1455);
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
    		useDropOutside: c,
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