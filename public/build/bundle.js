
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
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
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
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
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
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
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
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

    var e=function(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,r=new Array(t);n<t;n++)r[n]=e[n];return r},t=function(t){if(Array.isArray(t))return e(t)},n=function(t,n){if(t){if("string"==typeof t)return e(t,n);var r=Object.prototype.toString.call(t).slice(8,-1);return "Object"===r&&t.constructor&&(r=t.constructor.name),"Map"===r||"Set"===r?Array.from(t):"Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)?e(t,n):void 0}},r=function(e){return t(e)||function(e){if("undefined"!=typeof Symbol&&Symbol.iterator in Object(e))return Array.from(e)}(e)||n(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()};function o(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}var i=function(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e},s=function(e){return 1===(null==e?void 0:e.nodeType)};function a(e,t){var n;if("undefined"==typeof Symbol||null==e[Symbol.iterator]){if(Array.isArray(e)||(n=function(e,t){if(e){if("string"==typeof e)return d(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);return "Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n?Array.from(e):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?d(e,t):void 0}}(e))||t&&e&&"number"==typeof e.length){n&&(e=n);var r=0,o=function(){};return {s:o,n:function(){return r>=e.length?{done:!0}:{done:!1,value:e[r++]}},e:function(e){throw e},f:o}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var i,s=!0,a=!1;return {s:function(){n=e[Symbol.iterator]();},n:function(){var e=n.next();return s=e.done,e},e:function(e){a=!0,i=e;},f:function(){try{s||null==n.return||n.return();}finally{if(a)throw i}}}}function d(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,r=new Array(t);n<t;n++)r[n]=e[n];return r}var u=function(){function e(){((function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}))(this,e),i(this,"_observer",null);}return function(e,t,n){t&&o(e.prototype,t),n&&o(e,n);}(e,[{key:"wait",value:function(t){var n=this,o=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null,i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{},d=i.events,u=void 0===d?e.EVENTS:d,l=i.timeout,h=void 0===l?0:l,c=i.attributeFilter,g=void 0===c?void 0:c,m=i.onError,v=void 0===m?void 0:m;return this.clear(),new Promise((function(i,d){var l=s(t)?t:document.querySelector(t);l&&u.includes(e.EXIST)&&(o?o(l,e.EXIST):i({node:l,event:e.EXIST})),h>0&&(n._timeout=setTimeout((function(){n.clear();var e=new Error("[TIMEOUT]: Element ".concat(t," cannot be found after ").concat(h,"ms"));o?null==v||v(e):d(e);}),h)),n._observer=new MutationObserver((function(n){n.forEach((function(n){var d,l=n.type,h=n.target,c=n.addedNodes,g=n.removedNodes,m=n.attributeName,v=n.oldValue;if("childList"===l&&(u.includes(e.ADD)||u.includes(e.REMOVE))){var b,p=a([].concat(r(u.includes(e.ADD)?Array.from(c):[]),r(u.includes(e.REMOVE)?Array.from(g):[])));try{for(p.s();!(b=p.n()).done;){var f,y=b.value;(y===t||!s(t)&&null!==(f=y.matches)&&void 0!==f&&f.call(y,t))&&(o?o(y,Array.from(c).includes(y)?e.ADD:e.REMOVE):i({node:y,event:Array.from(c).includes(y)?e.ADD:e.REMOVE}));}}catch(e){p.e(e);}finally{p.f();}}"attributes"===l&&u.includes(e.CHANGE)&&(h===t||!s(t)&&null!==(d=h.matches)&&void 0!==d&&d.call(h,t))&&(o?o(h,e.CHANGE,{attributeName:m,oldValue:v}):i({node:h,event:e.CHANGE,options:{attributeName:m,oldValue:v}}));}));})),n._observer.observe(document.documentElement,{subtree:!0,childList:u.includes(e.ADD)||u.includes(e.REMOVE),attributes:u.includes(e.CHANGE),attributeOldValue:u.includes(e.CHANGE),attributeFilter:g});}))}},{key:"clear",value:function(){var e;null===(e=this._observer)||void 0===e||e.disconnect(),clearTimeout(this._timeout);}}]),e}();i(u,"EXIST","DOMObserver_exist"),i(u,"ADD","DOMObserver_add"),i(u,"REMOVE","DOMObserver_remove"),i(u,"CHANGE","DOMObserver_change"),i(u,"EVENTS",[u.EXIST,u.ADD,u.REMOVE,u.CHANGE]);const l=e=>{if(e){if(function(e){return 1===(null==e?void 0:e.nodeType)}(e))return e;if(e.src||function(e){return "string"==typeof e||"[object String]"===Object.prototype.toString.call(e)}(e)){const t=new Image;return t.src=e.src||e,e.width&&(t.width=e.width),e.height&&(t.height=e.height),t}}return null};!function(e,t){void 0===t&&(t={});var n=t.insertAt;if(e&&"undefined"!=typeof document){var r=document.head||document.getElementsByTagName("head")[0],o=document.createElement("style");o.type="text/css","top"===n&&r.firstChild?r.insertBefore(o,r.firstChild):r.appendChild(o),o.styleSheet?o.styleSheet.cssText=e:o.appendChild(document.createTextNode(e));}}(".__drag {\n    position: absolute;\n    z-index: 999;\n    user-select: none;\n    opacity: .7;\n\n    --origin-x: 0px;\n    --origin-y: 0px;\n}\n\n@keyframes move {\n    100% {\n        left: var(--origin-x);\n        top: var(--origin-y);\n    }\n}");class h{static instances=[];#e=null;#t=null;#n=null;#r=!1;#o=null;#i=!1;#s=null;#a=null;#d=null;#u=null;#l=null;#h=null;#c=0;#g=0;#m=0;#v=0;#b=null;#p=null;#f=null;#y=null;#M=null;static destroy(){h.instances.forEach((e=>{e.destroy();})),h.instances=[];}constructor(e,t,n,r,o,i,s,a,d,u){this.#e=e,this.#t=n,this.#n=r,this.#r=o||!1,this.#o={duration:.2,timingFunction:"ease",...i||{}},this.#i=s||!1,this.#s=a,this.#a=d,this.#d=u,this.#l=document.querySelector(t),this.#h=this.#E(),this.#b=this.#H.bind(this),this.#p=this.#O.bind(this),this.#f=this.#D.bind(this),this.#e.addEventListener("mouseover",this.#b,!1),this.#e.addEventListener("mouseout",this.#p,!1),this.#e.addEventListener("mousedown",this.#f,!1),this.#e.addEventListener("touchstart",this.#f,!1),h.instances.push(this);}update(e,t,n,r,o,i,s,a,d){this.#t=t,this.#n=n,this.#r=r||!1,this.#o={duration:.2,timingFunction:"ease",...o||{}},this.#i=i||!1,this.#s=s,this.#a=a,this.#d=d,this.#l=document.querySelector(e),this.#h=this.#E();}destroy(){this.#e.removeEventListener("mouseover",this.#b),this.#e.removeEventListener("mouseout",this.#p),this.#e.removeEventListener("mousedown",this.#f),this.#e.removeEventListener("touchstart",this.#f),this.#b=null,this.#p=null,this.#f=null,this.#u?.clear(),this.#u=null;}#E(){const e=this.#t?l(this.#t):this.#e.cloneNode(!0);if(e.setAttribute("draggable",!1),e.setAttribute("id","drag"),e.setAttribute("role","presentation"),e.classList.add("__drag"),this.#n){const t=((e,t=!1)=>{if(e&&(e=e.startsWith(".")?e:`.${e}`,document.styleSheets?.length))for(let{cssRules:n}of document.styleSheets)for(let{selectorText:r,style:o}of n)if(r===e&&o)return t?o.cssText:o;return null})(this.#n,!0);t&&(e.style.cssText=t);}return this.#u=new u,this.#u.wait(e,null,{events:[u.ADD]}).then((()=>{const{width:t,height:n}=e.getBoundingClientRect();this.#m=t,this.#v=n;})),e}#C(e){if(this.#r){const{width:t,height:n,left:r,top:o}=this.#e.getBoundingClientRect();this.#h.style.setProperty("--origin-x",r-(this.#i?this.#m-t>>1:0)+"px"),this.#h.style.setProperty("--origin-y",o-(this.#i?this.#v-n>>1:0)+"px"),this.#h.style.animation=`move ${this.#o.duration}s ${this.#o.timingFunction}`,this.#h.addEventListener("animationend",(()=>{this.#h.style.animation="none",this.#h.remove(),e?.(this.#e,this.#l);}),!1);}else this.#h.remove(),e?.(this.#e,this.#l);}#H(e){e.target.style.cursor="grab";}#O(e){e.target.style.cursor="default";}#w(e){"hidden"===this.#h.style.visibility&&(this.#h.style.visibility="visible");const t="touchmove"===e.type?e.targetTouches[0].pageX:e.pageX,n="touchmove"===e.type?e.targetTouches[0].pageY:e.pageY;this.#h.style.left=t-(this.#i?this.#m>>1:this.#c)+"px",this.#h.style.top=n-(this.#i?this.#v>>1:this.#g)+"px";}#D(e){const t="touchstart"===e.type?e.targetTouches[0].clientX:e.clientX,n="touchstart"===e.type?e.targetTouches[0].clientY:e.clientY;this.#c=t-this.#e.getBoundingClientRect().left,this.#g=n-this.#e.getBoundingClientRect().top,this.#h.style.visibility="hidden",this.#h.style.cursor="grabbing",this.#y=this.#w.bind(this),this.#M=this.#A.bind(this),document.addEventListener("mousemove",this.#y,!1),document.addEventListener("mouseup",this.#M,!1),document.addEventListener("touchmove",this.#y,!1),document.addEventListener("keydown",this.#M),this.#e.addEventListener("touchend",this.#M,!1),this.#e.addEventListener("touchcancel",this.#M,!1),this.#e.parentNode.appendChild(this.#h);}#A(e){if(e.type.startsWith("key")&&"Escape"!==e.key)return;document.removeEventListener("mousemove",this.#y),document.removeEventListener("mouseup",this.#M),document.removeEventListener("touchmove",this.#y),document.removeEventListener("keydown",this.#M),this.#e.removeEventListener("touchend",this.#M),this.#e.removeEventListener("touchcancel",this.#M),this.#y=null,this.#M=null;const t=((e,t)=>{const{left:n,right:r,top:o,bottom:i}=e.getBoundingClientRect(),{left:s,right:a,top:d,bottom:u}=t.getBoundingClientRect();return !(o>u||r<s||i<d||n>a)})(this.#l,this.#h);e.type.startsWith("key")?this.#C(this.#d):t?this.#C(this.#a):(this.#h.remove(),this.#s?.(this.#e,this.#l));}}const c=(e,{areaSelector:t,dragImage:n,dragClassName:r,animate:o,animateOptions:i,dragHandleCentered:s,onDropOutside:a,onDropInside:d,onDragCancel:u})=>{const l=new h(e,t,n,r,o,i,s,a,d,u);return {update:({areaSelector:e,dragImage:t,dragClassName:n,animate:r,animateOptions:o,dragHandleCentered:i,onDropOutside:s,onDropInside:a,onDragCancel:d})=>l.update(e,t,n,r,o,i,s,a,d),destroy:()=>l.destroy()}};

    /* src\SettingsIcon.svelte generated by Svelte v3.49.0 */

    const file$2 = "src\\SettingsIcon.svelte";

    function create_fragment$2(ctx) {
    	let svg;
    	let g;
    	let path0;
    	let path1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			g = svg_element("g");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(path0, "d", "M343.45,71.8c-14.4-8.2-29.7-14.6-45.7-19V36.5c0-20.1-16.4-36.5-36.5-36.5h-32.5c-20.1,0-36.5,16.4-36.5,36.5v16.3 c-16,4.4-31.3,10.7-45.7,19l-11.6-11.5c-6.9-6.9-16.1-10.7-25.8-10.7s-18.9,3.8-25.8,10.7l-23,23c-6.9,6.9-10.7,16.1-10.7,25.8 s3.8,18.9,10.7,25.8l11.5,11.5c-8.2,14.4-14.6,29.7-19,45.7h-16.3c-20.1,0-36.5,16.4-36.5,36.5v32.5c0,20.1,16.4,36.5,36.5,36.5 h16.3c4.4,16,10.7,31.3,19,45.7l-11.5,11.6c-14.2,14.2-14.2,37.4,0,51.6l23,23c6.9,6.9,16.1,10.7,25.8,10.7s18.9-3.8,25.8-10.7 l11.5-11.5c14.4,8.2,29.7,14.6,45.7,19v16.3c0,20.1,16.4,36.5,36.5,36.5h32.5c20.1,0,36.5-16.4,36.5-36.5V437 c16-4.4,31.3-10.7,45.7-19l11.5,11.5c6.9,6.9,16.1,10.7,25.8,10.7s18.9-3.8,25.8-10.7l23-23c14.2-14.2,14.2-37.4,0-51.6 l-11.5-11.5c8.2-14.4,14.6-29.7,19-45.7h16.3c20.1,0,36.5-16.4,36.5-36.5v-32.5c0-20.1-16.4-36.5-36.5-36.5h-16.3 c-4.4-16-10.7-31.3-19-45.7l11.5-11.5c14.2-14.2,14.2-37.4,0-51.6l-23-23c-6.9-6.9-16.1-10.7-25.8-10.7s-18.9,3.8-25.8,10.7 L343.45,71.8z M379.25,84.5c0.9-0.9,2.2-0.9,3.1,0l23,23c0.9,0.9,0.9,2.2,0,3.1l-21.1,21.1c-5.8,5.8-6.7,14.9-2.1,21.7 c12.1,18,20.3,38,24.5,59.2c1.6,8,8.6,13.8,16.8,13.8h29.9c1.2,0,2.2,1,2.2,2.2v32.5c0,1.2-1,2.2-2.2,2.2h-29.9 c-8.2,0-15.2,5.8-16.8,13.8c-4.2,21.3-12.5,41.2-24.5,59.2c-4.6,6.8-3.7,15.9,2.1,21.7l21.1,21.1c0.9,0.9,0.9,2.2,0,3.1l-23,23 c-0.8,0.9-2.2,0.8-3.1,0l-21.1-21.1c-5.8-5.8-14.9-6.7-21.7-2.1c-18.1,12.1-38,20.3-59.2,24.5c-8,1.6-13.8,8.6-13.8,16.8v29.9 c0,1.2-1,2.2-2.2,2.2h-32.5c-1.2,0-2.2-1-2.2-2.2v-29.9c0-8.2-5.8-15.2-13.8-16.8c-21.2-4.2-41.2-12.5-59.2-24.5 c-2.9-1.9-6.2-2.9-9.5-2.9c-4.4,0-8.8,1.7-12.1,5l-21.1,21.1c-0.9,0.9-2.2,0.9-3.1,0l-23-23c-0.9-0.9-0.9-2.2,0-3.1l21.1-21.1 c5.8-5.8,6.7-14.9,2.1-21.7c-12.1-18.1-20.3-38-24.5-59.2c-1.6-8-8.6-13.8-16.8-13.8h-30.1c-1.2,0-2.2-1-2.2-2.2v-32.5 c0-1.2,1-2.2,2.2-2.2h29.9c8.2,0,15.2-5.8,16.8-13.8c4.2-21.2,12.5-41.2,24.5-59.2c4.5-6.8,3.7-15.9-2.1-21.7l-21.1-21.1 c-0.4-0.4-0.6-0.9-0.6-1.6c0-0.6,0.2-1.1,0.6-1.5l23-23c0.9-0.9,2.2-0.9,3.1,0l21.1,21.1c5.8,5.8,14.9,6.7,21.7,2.1 c18.1-12.1,38-20.3,59.2-24.5c8-1.6,13.8-8.6,13.8-16.8V36.5c0-1.2,1-2.2,2.2-2.2h32.5c1.2,0,2.2,1,2.2,2.2v29.9 c0,8.2,5.8,15.2,13.8,16.8c21.2,4.2,41.2,12.5,59.2,24.5c6.8,4.5,15.9,3.7,21.7-2.1L379.25,84.5z");
    			attr_dev(path0, "fill", /*color*/ ctx[0]);
    			add_location(path0, file$2, 6, 2, 195);
    			attr_dev(path1, "d", "M244.95,145.3c-54.9,0-99.6,44.7-99.6,99.6s44.7,99.6,99.6,99.6s99.6-44.7,99.6-99.6S299.85,145.3,244.95,145.3z M244.95,310.2c-36,0-65.3-29.3-65.3-65.3s29.3-65.3,65.3-65.3s65.3,29.3,65.3,65.3S280.95,310.2,244.95,310.2z");
    			attr_dev(path1, "fill", /*color*/ ctx[0]);
    			add_location(path1, file$2, 9, 2, 2412);
    			attr_dev(g, "transform", "matrix(0.049005, 0, 0, 0.049005, 0, 0)");
    			add_location(g, file$2, 5, 1, 137);
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$2, 4, 0, 51);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, g);
    			append_dev(g, path0);
    			append_dev(g, path1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*color*/ 1) {
    				attr_dev(path0, "fill", /*color*/ ctx[0]);
    			}

    			if (dirty & /*color*/ 1) {
    				attr_dev(path1, "fill", /*color*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SettingsIcon', slots, []);
    	let { color = '#FFF' } = $$props;
    	const writable_props = ['color'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SettingsIcon> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    	};

    	$$self.$capture_state = () => ({ color });

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color];
    }

    class SettingsIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { color: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SettingsIcon",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get color() {
    		throw new Error("<SettingsIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<SettingsIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\CloseIcon.svelte generated by Svelte v3.49.0 */

    const file$1 = "src\\CloseIcon.svelte";

    function create_fragment$1(ctx) {
    	let svg;
    	let g;
    	let path0;
    	let path1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			g = svg_element("g");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(path0, "d", "M207,182.8c-6.7-6.7-17.6-6.7-24.3,0s-6.7,17.6,0,24.3l38,38l-38,38c-6.7,6.7-6.7,17.6,0,24.3c3.3,3.3,7.7,5,12.1,5 c4.4,0,8.8-1.7,12.1-5l38-38l38,38c3.3,3.3,7.7,5,12.1,5s8.8-1.7,12.1-5c6.7-6.7,6.7-17.6,0-24.3l-38-38l38-38 c6.7-6.7,6.7-17.6,0-24.3s-17.6-6.7-24.3,0l-38,38L207,182.8z");
    			attr_dev(path0, "fill", /*color*/ ctx[0]);
    			add_location(path0, file$1, 6, 2, 193);
    			attr_dev(path1, "d", "M0,245c0,135.1,109.9,245,245,245s245-109.9,245-245S380.1,0,245,0S0,109.9,0,245z M455.7,245 c0,116.2-94.5,210.7-210.7,210.7S34.3,361.2,34.3,245S128.8,34.3,245,34.3S455.7,128.8,455.7,245z");
    			attr_dev(path1, "fill", /*color*/ ctx[0]);
    			add_location(path1, file$1, 9, 2, 509);
    			attr_dev(g, "transform", "matrix(0.04898, 0, 0, 0.04898, 0, 0)");
    			add_location(g, file$1, 5, 1, 137);
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$1, 4, 0, 51);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, g);
    			append_dev(g, path0);
    			append_dev(g, path1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*color*/ 1) {
    				attr_dev(path0, "fill", /*color*/ ctx[0]);
    			}

    			if (dirty & /*color*/ 1) {
    				attr_dev(path1, "fill", /*color*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CloseIcon', slots, []);
    	let { color = '#FFF' } = $$props;
    	const writable_props = ['color'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CloseIcon> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    	};

    	$$self.$capture_state = () => ({ color });

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color];
    }

    class CloseIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { color: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CloseIcon",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get color() {
    		throw new Error("<CloseIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<CloseIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.49.0 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	child_ctx[17] = i;
    	return child_ctx;
    }

    // (158:1) {#if showSettings}
    function create_if_block(ctx) {
    	let div;
    	let button;
    	let closeicon;
    	let t0;
    	let form;
    	let h1;
    	let t2;
    	let fieldset0;
    	let label0;
    	let t4;
    	let input0;
    	let t5;
    	let fieldset1;
    	let label1;
    	let t7;
    	let input1;
    	let t8;
    	let fieldset2;
    	let label2;
    	let t10;
    	let input2;
    	let t11;
    	let fieldset3;
    	let label3;
    	let t13;
    	let input3;
    	let current;
    	let mounted;
    	let dispose;
    	closeicon = new CloseIcon({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			create_component(closeicon.$$.fragment);
    			t0 = space();
    			form = element("form");
    			h1 = element("h1");
    			h1.textContent = "Settings";
    			t2 = space();
    			fieldset0 = element("fieldset");
    			label0 = element("label");
    			label0.textContent = "Animate Drag Back:";
    			t4 = space();
    			input0 = element("input");
    			t5 = space();
    			fieldset1 = element("fieldset");
    			label1 = element("label");
    			label1.textContent = "Use Drag Class:";
    			t7 = space();
    			input1 = element("input");
    			t8 = space();
    			fieldset2 = element("fieldset");
    			label2 = element("label");
    			label2.textContent = "Use Drag Image:";
    			t10 = space();
    			input2 = element("input");
    			t11 = space();
    			fieldset3 = element("fieldset");
    			label3 = element("label");
    			label3.textContent = "Center Handle:";
    			t13 = space();
    			input3 = element("input");
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "toggle__button svelte-inkldk");
    			add_location(button, file, 159, 3, 2580);
    			add_location(h1, file, 163, 4, 2742);
    			attr_dev(label0, "for", "animate");
    			add_location(label0, file, 165, 5, 2799);
    			attr_dev(input0, "id", "animate");
    			attr_dev(input0, "type", "checkbox");
    			attr_dev(input0, "class", "svelte-inkldk");
    			add_location(input0, file, 166, 5, 2854);
    			attr_dev(fieldset0, "class", "horizontal svelte-inkldk");
    			add_location(fieldset0, file, 164, 4, 2764);
    			attr_dev(label1, "for", "useDragCustomClass");
    			add_location(label1, file, 169, 5, 2971);
    			attr_dev(input1, "id", "useDragCustomClass");
    			attr_dev(input1, "type", "checkbox");
    			attr_dev(input1, "class", "svelte-inkldk");
    			add_location(input1, file, 170, 5, 3034);
    			attr_dev(fieldset1, "class", "horizontal svelte-inkldk");
    			add_location(fieldset1, file, 168, 4, 2936);
    			attr_dev(label2, "for", "useDragImage");
    			add_location(label2, file, 173, 5, 3167);
    			attr_dev(input2, "id", "useDragImage");
    			attr_dev(input2, "type", "checkbox");
    			attr_dev(input2, "class", "svelte-inkldk");
    			add_location(input2, file, 174, 5, 3224);
    			attr_dev(fieldset2, "class", "horizontal svelte-inkldk");
    			add_location(fieldset2, file, 172, 4, 3132);
    			attr_dev(label3, "for", "isHandleCentered");
    			add_location(label3, file, 177, 5, 3351);
    			attr_dev(input3, "id", "isHandleCentered");
    			attr_dev(input3, "type", "checkbox");
    			attr_dev(input3, "class", "svelte-inkldk");
    			add_location(input3, file, 178, 5, 3411);
    			attr_dev(fieldset3, "class", "horizontal svelte-inkldk");
    			add_location(fieldset3, file, 176, 4, 3316);
    			attr_dev(form, "class", "settings__form svelte-inkldk");
    			add_location(form, file, 162, 3, 2708);
    			attr_dev(div, "class", "settings__container svelte-inkldk");
    			add_location(div, file, 158, 2, 2543);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			mount_component(closeicon, button, null);
    			append_dev(div, t0);
    			append_dev(div, form);
    			append_dev(form, h1);
    			append_dev(form, t2);
    			append_dev(form, fieldset0);
    			append_dev(fieldset0, label0);
    			append_dev(fieldset0, t4);
    			append_dev(fieldset0, input0);
    			input0.checked = /*animate*/ ctx[1];
    			append_dev(form, t5);
    			append_dev(form, fieldset1);
    			append_dev(fieldset1, label1);
    			append_dev(fieldset1, t7);
    			append_dev(fieldset1, input1);
    			input1.checked = /*useDragClass*/ ctx[2];
    			append_dev(form, t8);
    			append_dev(form, fieldset2);
    			append_dev(fieldset2, label2);
    			append_dev(fieldset2, t10);
    			append_dev(fieldset2, input2);
    			input2.checked = /*useDragImage*/ ctx[3];
    			append_dev(form, t11);
    			append_dev(form, fieldset3);
    			append_dev(fieldset3, label3);
    			append_dev(fieldset3, t13);
    			append_dev(fieldset3, input3);
    			input3.checked = /*isHandleCentered*/ ctx[4];
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*click_handler*/ ctx[9], false, false, false),
    					listen_dev(input0, "change", /*input0_change_handler*/ ctx[10]),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[11]),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[12]),
    					listen_dev(input3, "change", /*input3_change_handler*/ ctx[13])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*animate*/ 2) {
    				input0.checked = /*animate*/ ctx[1];
    			}

    			if (dirty & /*useDragClass*/ 4) {
    				input1.checked = /*useDragClass*/ ctx[2];
    			}

    			if (dirty & /*useDragImage*/ 8) {
    				input2.checked = /*useDragImage*/ ctx[3];
    			}

    			if (dirty & /*isHandleCentered*/ 16) {
    				input3.checked = /*isHandleCentered*/ ctx[4];
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(closeicon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(closeicon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(closeicon);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(158:1) {#if showSettings}",
    		ctx
    	});

    	return block;
    }

    // (191:4) {#each colors as color, index}
    function create_each_block(ctx) {
    	let li;
    	let useDropOutside_action;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			attr_dev(li, "style", `background-color: ${/*color*/ ctx[15]}`);
    			attr_dev(li, "class", "slot svelte-inkldk");
    			add_location(li, file, 191, 5, 3785);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);

    			if (!mounted) {
    				dispose = action_destroyer(useDropOutside_action = c.call(null, li, {
    					areaSelector: '.area',
    					animate: /*animate*/ ctx[1],
    					animateOptions: {
    						timingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    					},
    					dragImage: /*useDragImage*/ ctx[3]
    					? {
    							src: 'https://www.123-stickers.com/7345-thickbox/autocollant-bebe-winnie-l-ourson.jpg',
    							height: 70
    						}
    					: null,
    					dragClassName: /*useDragClass*/ ctx[2] ? 'drag' : null,
    					dragHandleCentered: /*isHandleCentered*/ ctx[4],
    					onDropOutside: /*_onDropOutside*/ ctx[6],
    					onDropInside: /*_onDropInside*/ ctx[7],
    					onDragCancel: /*_onDragCancel*/ ctx[8]
    				}));

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (useDropOutside_action && is_function(useDropOutside_action.update) && dirty & /*animate, useDragImage, useDragClass, isHandleCentered*/ 30) useDropOutside_action.update.call(null, {
    				areaSelector: '.area',
    				animate: /*animate*/ ctx[1],
    				animateOptions: {
    					timingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    				},
    				dragImage: /*useDragImage*/ ctx[3]
    				? {
    						src: 'https://www.123-stickers.com/7345-thickbox/autocollant-bebe-winnie-l-ourson.jpg',
    						height: 70
    					}
    				: null,
    				dragClassName: /*useDragClass*/ ctx[2] ? 'drag' : null,
    				dragHandleCentered: /*isHandleCentered*/ ctx[4],
    				onDropOutside: /*_onDropOutside*/ ctx[6],
    				onDropInside: /*_onDropInside*/ ctx[7],
    				onDragCancel: /*_onDragCancel*/ ctx[8]
    			});
    		},
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
    		source: "(191:4) {#each colors as color, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let t0;
    	let div1;
    	let button;
    	let settingsicon;
    	let t1;
    	let div0;
    	let ul;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*showSettings*/ ctx[0] && create_if_block(ctx);
    	settingsicon = new SettingsIcon({ $$inline: true });
    	let each_value = /*colors*/ ctx[5];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block) if_block.c();
    			t0 = space();
    			div1 = element("div");
    			button = element("button");
    			create_component(settingsicon.$$.fragment);
    			t1 = space();
    			div0 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "toggle__button svelte-inkldk");
    			add_location(button, file, 185, 2, 3562);
    			attr_dev(ul, "class", "slot-list svelte-inkldk");
    			add_location(ul, file, 189, 3, 3722);
    			attr_dev(div0, "id", "area");
    			attr_dev(div0, "class", "area svelte-inkldk");
    			add_location(div0, file, 188, 2, 3690);
    			attr_dev(div1, "class", "container svelte-inkldk");
    			add_location(div1, file, 184, 1, 3536);
    			attr_dev(main, "class", "svelte-inkldk");
    			add_location(main, file, 156, 0, 2514);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if (if_block) if_block.m(main, null);
    			append_dev(main, t0);
    			append_dev(main, div1);
    			append_dev(div1, button);
    			mount_component(settingsicon, button, null);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[14], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*showSettings*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*showSettings*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(main, t0);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*colors, animate, useDragImage, useDragClass, isHandleCentered, _onDropOutside, _onDropInside, _onDragCancel*/ 510) {
    				each_value = /*colors*/ ctx[5];
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
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(settingsicon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(settingsicon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
    			destroy_component(settingsicon);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
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

    	let showSettings = false;
    	let animate = false;
    	let useDragClass = false;
    	let useDragImage = false;
    	let isHandleCentered = false;

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

    	const click_handler = () => $$invalidate(0, showSettings = !showSettings);

    	function input0_change_handler() {
    		animate = this.checked;
    		$$invalidate(1, animate);
    	}

    	function input1_change_handler() {
    		useDragClass = this.checked;
    		$$invalidate(2, useDragClass);
    	}

    	function input2_change_handler() {
    		useDragImage = this.checked;
    		$$invalidate(3, useDragImage);
    	}

    	function input3_change_handler() {
    		isHandleCentered = this.checked;
    		$$invalidate(4, isHandleCentered);
    	}

    	const click_handler_1 = () => $$invalidate(0, showSettings = !showSettings);

    	$$self.$capture_state = () => ({
    		useDropOutside: c,
    		SettingsIcon,
    		CloseIcon,
    		colors,
    		showSettings,
    		animate,
    		useDragClass,
    		useDragImage,
    		isHandleCentered,
    		_onDropOutside,
    		_onDropInside,
    		_onDragCancel
    	});

    	$$self.$inject_state = $$props => {
    		if ('showSettings' in $$props) $$invalidate(0, showSettings = $$props.showSettings);
    		if ('animate' in $$props) $$invalidate(1, animate = $$props.animate);
    		if ('useDragClass' in $$props) $$invalidate(2, useDragClass = $$props.useDragClass);
    		if ('useDragImage' in $$props) $$invalidate(3, useDragImage = $$props.useDragImage);
    		if ('isHandleCentered' in $$props) $$invalidate(4, isHandleCentered = $$props.isHandleCentered);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		showSettings,
    		animate,
    		useDragClass,
    		useDragImage,
    		isHandleCentered,
    		colors,
    		_onDropOutside,
    		_onDropInside,
    		_onDragCancel,
    		click_handler,
    		input0_change_handler,
    		input1_change_handler,
    		input2_change_handler,
    		input3_change_handler,
    		click_handler_1
    	];
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
