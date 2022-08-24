
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
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

    var e=function(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,r=new Array(t);n<t;n++)r[n]=e[n];return r},t=function(t){if(Array.isArray(t))return e(t)},n=function(t,n){if(t){if("string"==typeof t)return e(t,n);var r=Object.prototype.toString.call(t).slice(8,-1);return "Object"===r&&t.constructor&&(r=t.constructor.name),"Map"===r||"Set"===r?Array.from(t):"Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)?e(t,n):void 0}},r=function(e){return t(e)||function(e){if("undefined"!=typeof Symbol&&Symbol.iterator in Object(e))return Array.from(e)}(e)||n(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()};function o(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}var i=function(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e},u=function(e){return 1===(null==e?void 0:e.nodeType)};function a(e,t){var n;if("undefined"==typeof Symbol||null==e[Symbol.iterator]){if(Array.isArray(e)||(n=function(e,t){if(e){if("string"==typeof e)return c(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);return "Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n?Array.from(e):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?c(e,t):void 0}}(e))||t&&e&&"number"==typeof e.length){n&&(e=n);var r=0,o=function(){};return {s:o,n:function(){return r>=e.length?{done:!0}:{done:!1,value:e[r++]}},e:function(e){throw e},f:o}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var i,u=!0,a=!1;return {s:function(){n=e[Symbol.iterator]();},n:function(){var e=n.next();return u=e.done,e},e:function(e){a=!0,i=e;},f:function(){try{u||null==n.return||n.return();}finally{if(a)throw i}}}}function c(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,r=new Array(t);n<t;n++)r[n]=e[n];return r}var s=function(){function e(){((function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}))(this,e),i(this,"_observer",null);}return function(e,t,n){t&&o(e.prototype,t),n&&o(e,n);}(e,[{key:"wait",value:function(t){var n=this,o=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null,i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{},c=i.events,s=void 0===c?e.EVENTS:c,l=i.timeout,d=void 0===l?0:l,v=i.attributeFilter,m=void 0===v?void 0:v,f=i.onError,y=void 0===f?void 0:f;return this.clear(),new Promise((function(i,c){var l=u(t)?t:document.querySelector(t);l&&s.includes(e.EXIST)&&(o?o(l,e.EXIST):i({node:l,event:e.EXIST})),d>0&&(n._timeout=setTimeout((function(){n.clear();var e=new Error("[TIMEOUT]: Element ".concat(t," cannot be found after ").concat(d,"ms"));o?null==y||y(e):c(e);}),d)),n._observer=new MutationObserver((function(n){n.forEach((function(n){var c,l=n.type,d=n.target,v=n.addedNodes,m=n.removedNodes,f=n.attributeName,y=n.oldValue;if("childList"===l&&(s.includes(e.ADD)||s.includes(e.REMOVE))){var h,p=a([].concat(r(s.includes(e.ADD)?Array.from(v):[]),r(s.includes(e.REMOVE)?Array.from(m):[])));try{for(p.s();!(h=p.n()).done;){var g,E=h.value;(E===t||!u(t)&&null!==(g=E.matches)&&void 0!==g&&g.call(E,t))&&(o?o(E,Array.from(v).includes(E)?e.ADD:e.REMOVE):i({node:E,event:Array.from(v).includes(E)?e.ADD:e.REMOVE}));}}catch(e){p.e(e);}finally{p.f();}}"attributes"===l&&s.includes(e.CHANGE)&&(d===t||!u(t)&&null!==(c=d.matches)&&void 0!==c&&c.call(d,t))&&(o?o(d,e.CHANGE,{attributeName:f,oldValue:y}):i({node:d,event:e.CHANGE,options:{attributeName:f,oldValue:y}}));}));})),n._observer.observe(document.documentElement,{subtree:!0,childList:s.includes(e.ADD)||s.includes(e.REMOVE),attributes:s.includes(e.CHANGE),attributeOldValue:s.includes(e.CHANGE),attributeFilter:m});}))}},{key:"clear",value:function(){var e;null===(e=this._observer)||void 0===e||e.disconnect(),clearTimeout(this._timeout);}}]),e}();i(s,"EXIST","DOMObserver_exist"),i(s,"ADD","DOMObserver_add"),i(s,"REMOVE","DOMObserver_remove"),i(s,"CHANGE","DOMObserver_change"),i(s,"EVENTS",[s.EXIST,s.ADD,s.REMOVE,s.CHANGE]);const l=e=>{if(e){if(function(e){return 1===(null==e?void 0:e.nodeType)}(e))return e;if(e.src||function(e){return "string"==typeof e||"[object String]"===Object.prototype.toString.call(e)}(e)){const t=new Image;return t.src=e.src||e,e.width&&(t.width=e.width),e.height&&(t.height=e.height),t}}return null};!function(e,t){void 0===t&&(t={});var n=t.insertAt;if(e&&"undefined"!=typeof document){var r=document.head||document.getElementsByTagName("head")[0],o=document.createElement("style");o.type="text/css","top"===n&&r.firstChild?r.insertBefore(o,r.firstChild):r.appendChild(o),o.styleSheet?o.styleSheet.cssText=e:o.appendChild(document.createTextNode(e));}}(".__drag {\n    position: absolute;\n    z-index: 999;\n    user-select: none;\n    opacity: .7;\n}");let d=0,v=0,m=null,f=null,y=0,h=0;const p=(e,{areaSelector:t,dragImage:n,dragClassName:r,onDropOutside:o,onDropInside:i,onDragCancel:u})=>{const a=document.querySelector(t),c=e=>{e.target.style.cursor="grab";},p=e=>{e.target.style.cursor="default";},g=t=>{f.parentNode||e.parentNode.appendChild(f);const r="touchmove"===t.type?t.targetTouches[0].pageX:t.pageX,o="touchmove"===t.type?t.targetTouches[0].pageY:t.pageY;f.style.left=r-(n?y>>1:d)+"px",f.style.top=o-(n?h>>1:v)+"px";},E=t=>{const n="touchstart"===t.type?t.targetTouches[0].clientX:t.clientX,r="touchstart"===t.type?t.targetTouches[0].clientY:t.clientY;d=n-e.getBoundingClientRect().left,v=r-e.getBoundingClientRect().top,f.style.cursor="grabbing",document.addEventListener("mousemove",g,!1),document.addEventListener("mouseup",b,!1),document.addEventListener("touchmove",g,!1),document.addEventListener("keydown",b),e.addEventListener("touchend",b,!1),e.addEventListener("touchcancel",b,!1);},b=t=>{if(t.type.startsWith("key")&&"Escape"!==t.key)return;document.removeEventListener("mousemove",g),document.removeEventListener("mouseup",b),document.removeEventListener("touchmove",g),document.removeEventListener("keydown",b),e.removeEventListener("touchend",b),e.removeEventListener("touchcancel",b);const n=((e,t)=>{const{left:n,right:r,top:o,bottom:i}=e.getBoundingClientRect(),{left:u,right:a,top:c,bottom:s}=t.getBoundingClientRect();return !(o>s||r<u||i<c||n>a)})(a,f);f.remove(),setTimeout((()=>{t.type.startsWith("key")?u?.(e,a):n?i?.(e,a):o?.(e,a);}),10);};if(m=new s,f=n?l(n):e.cloneNode(!0),f.draggable=!1,f.id="drag-clone",f.role="presentation",f.classList.add("__drag"),r){const e=((e,t=!1)=>{if(e&&(e=e.startsWith(".")?e:`.${e}`,document.styleSheets?.length))for(let{cssRules:n}of document.styleSheets)for(let{selectorText:r,style:o}of n)if(r===e&&o)return t?o.cssText:o;return null})(r,!0);e&&(f.style.cssText=e);}return m.wait(f,null,{events:[s.ADD]}).then((()=>{const{width:e,height:t}=f.getBoundingClientRect();y=e,h=t;})),e.addEventListener("mouseover",c,!1),e.addEventListener("mouseout",p,!1),e.addEventListener("mousedown",E,!1),e.addEventListener("touchstart",E,!1),{destroy(){m.clear(),e.removeEventListener("mouseover",c),e.removeEventListener("mouseout",p),e.removeEventListener("mousedown",E),e.removeEventListener("touchstart",E);}}};

    /* src\App.svelte generated by Svelte v3.49.0 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let div2;
    	let div1;
    	let div0;
    	let t1;
    	let template;
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "Drag me outside the white area";
    			t1 = space();
    			template = element("template");
    			img = element("img");
    			attr_dev(div0, "id", "target");
    			attr_dev(div0, "class", "target svelte-ki5ror");
    			add_location(div0, file, 19, 3, 463);
    			attr_dev(div1, "class", "area svelte-ki5ror");
    			add_location(div1, file, 18, 2, 440);
    			attr_dev(div2, "class", "container svelte-ki5ror");
    			add_location(div2, file, 17, 1, 413);
    			attr_dev(main, "class", "svelte-ki5ror");
    			add_location(main, file, 16, 0, 404);
    			if (!src_url_equal(img.src, img_src_value = "https://cdn-icons-png.flaticon.com/512/636/636045.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "dragging");
    			attr_dev(img, "width", "48");
    			attr_dev(img, "height", "48");
    			add_location(img, file, 36, 2, 824);
    			attr_dev(template, "id", "drag-image");
    			add_location(template, file, 35, 0, 794);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, template, anchor);
    			append_dev(template.content, img);

    			if (!mounted) {
    				dispose = action_destroyer(p.call(null, div0, {
    					areaSelector: '.area',
    					dragClassName: 'drag-custom',
    					onDropOutside: /*_onDropOutside*/ ctx[0],
    					onDropInside: /*_onDropInside*/ ctx[1],
    					onDragCancel: /*_onDragCancel*/ ctx[2]
    				}));

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(template);
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

    	const _onDropOutside = node => {
    		alert(`You\'ve just dropped #${node.id} outside the area`);
    	};

    	const _onDropInside = node => {
    		alert(`You\'ve just dropped #${node.id} inside the area`);
    	};

    	const _onDragCancel = node => {
    		alert(`You\'ve just cancelled the drag of #${node.id}`);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		useDropOutside: p,
    		_onDropOutside,
    		_onDropInside,
    		_onDragCancel
    	});

    	return [_onDropOutside, _onDropInside, _onDragCancel];
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
