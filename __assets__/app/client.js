
// node_modules/imba/src/imba/utils.imba
var \u03A8__initor__ = Symbol.for("#__initor__");
var \u03A8__inited__ = Symbol.for("#__inited__");
var \u03A8type = Symbol.for("#type");
var \u03A8__listeners__ = Symbol.for("#__listeners__");
function parseTime(value) {
  let typ = typeof value;
  if (typ == "number") {
    return value;
  }
  ;
  if (typ == "string") {
    if (/^\d+fps$/.test(value)) {
      return 1e3 / parseFloat(value);
    } else if (/^([-+]?[\d\.]+)s$/.test(value)) {
      return parseFloat(value) * 1e3;
    } else if (/^([-+]?[\d\.]+)ms$/.test(value)) {
      return parseFloat(value);
    }
    ;
  }
  ;
  return null;
}
function getDeepPropertyDescriptor(item, key, stop) {
  if (!item) {
    return void 0;
  }
  ;
  let desc = Object.getOwnPropertyDescriptor(item, key);
  if (desc || item == stop) {
    return desc || void 0;
  }
  ;
  return getDeepPropertyDescriptor(Reflect.getPrototypeOf(item), key, stop);
}
var emit__ = function(event, args, node) {
  let prev;
  let cb;
  let ret;
  while ((prev = node) && (node = node.next)) {
    if (cb = node.listener) {
      if (node.path && cb[node.path]) {
        ret = args ? cb[node.path].apply(cb, args) : cb[node.path]();
      } else {
        ret = args ? cb.apply(node, args) : cb.call(node);
      }
      ;
    }
    ;
    if (node.times && --node.times <= 0) {
      prev.next = node.next;
      node.listener = null;
    }
    ;
  }
  ;
  return;
};
function listen(obj, event, listener, path) {
  var \u03C65;
  let cbs;
  let list;
  let tail;
  cbs = obj[\u03A8__listeners__] || (obj[\u03A8__listeners__] = {});
  list = cbs[event] || (cbs[event] = {});
  tail = list.tail || (list.tail = list.next = {});
  tail.listener = listener;
  tail.path = path;
  list.tail = tail.next = {};
  return tail;
}
function once(obj, event, listener) {
  let tail = listen(obj, event, listener);
  tail.times = 1;
  return tail;
}
function unlisten(obj, event, cb, meth) {
  let node;
  let prev;
  let meta = obj[\u03A8__listeners__];
  if (!meta) {
    return;
  }
  ;
  if (node = meta[event]) {
    while ((prev = node) && (node = node.next)) {
      if (node == cb || node.listener == cb) {
        prev.next = node.next;
        node.listener = null;
        break;
      }
      ;
    }
    ;
  }
  ;
  return;
}
function emit(obj, event, params) {
  let cb;
  if (cb = obj[\u03A8__listeners__]) {
    if (cb[event]) {
      emit__(event, params, cb[event]);
    }
    ;
    if (cb.all) {
      emit__(event, [event, params], cb.all);
    }
    ;
  }
  ;
  return;
}

// node_modules/imba/src/imba/scheduler.imba
function iter$__(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
var \u03A8__init__ = Symbol.for("#__init__");
var \u03A8__initor__2 = Symbol.for("#__initor__");
var \u03A8__inited__2 = Symbol.for("#__inited__");
var \u03A8schedule = Symbol.for("#schedule");
var \u03A8frames = Symbol.for("#frames");
var \u03A8interval = Symbol.for("#interval");
var \u03A8stage = Symbol.for("#stage");
var \u03A8scheduled = Symbol.for("#scheduled");
var \u03A8fps = Symbol.for("#fps");
var \u03A8ticker = Symbol.for("#ticker");
var rAF = globalThis.requestAnimationFrame || function(blk) {
  return setTimeout1(blk, 1e3 / 60);
};
var SPF = 1 / 60;
var Scheduled = class {
  constructor($$ = null) {
    this[\u03A8__init__]($$);
  }
  [\u03A8__init__]($$ = null) {
    var v\u03C6;
    this.owner = $$ && (v\u03C6 = $$.owner) !== void 0 ? v\u03C6 : null;
    this.target = $$ && (v\u03C6 = $$.target) !== void 0 ? v\u03C6 : null;
    this.active = $$ && (v\u03C6 = $$.active) !== void 0 ? v\u03C6 : false;
    this.value = $$ && (v\u03C6 = $$.value) !== void 0 ? v\u03C6 : void 0;
    this.skip = $$ && (v\u03C6 = $$.skip) !== void 0 ? v\u03C6 : 0;
    this.last = $$ && (v\u03C6 = $$.last) !== void 0 ? v\u03C6 : 0;
  }
  tick(scheduler2, source) {
    this.last = this.owner[\u03A8frames];
    this.target.tick(this, source);
    return 1;
  }
  update(o, activate\u03A6) {
    let on = this.active;
    let val = o.value;
    let changed = this.value != val;
    if (changed) {
      this.deactivate();
      this.value = val;
    }
    ;
    if (this.value || on || activate\u03A6) {
      this.activate();
    }
    ;
    return this;
  }
  queue() {
    this.owner.add(this);
    return;
  }
  activate() {
    if (this.value === true) {
      this.owner.on("commit", this);
    } else if (this.value === false) {
      true;
    } else if (typeof this.value == "number") {
      let tock = this.value / (1e3 / 60);
      if (tock <= 2) {
        this.owner.on("raf", this);
      } else {
        this[\u03A8interval] = globalThis.setInterval(this.queue.bind(this), this.value);
      }
      ;
    }
    ;
    this.active = true;
    return this;
  }
  deactivate() {
    if (this.value === true) {
      this.owner.un("commit", this);
    }
    ;
    this.owner.un("raf", this);
    if (this[\u03A8interval]) {
      globalThis.clearInterval(this[\u03A8interval]);
      this[\u03A8interval] = null;
    }
    ;
    this.active = false;
    return this;
  }
};
var Scheduler = class {
  constructor() {
    var self = this;
    this.id = Symbol();
    this.queue = [];
    this.stage = -1;
    this[\u03A8stage] = -1;
    this[\u03A8frames] = 0;
    this[\u03A8scheduled] = false;
    this.listeners = {};
    this.intervals = {};
    self.commit = function() {
      self.add("commit");
      return self;
    };
    this[\u03A8fps] = 0;
    self.$promise = null;
    self.$resolve = null;
    this[\u03A8ticker] = function(e) {
      self[\u03A8scheduled] = false;
      return self.tick(e);
    };
    self;
  }
  add(item, force) {
    if (force || this.queue.indexOf(item) == -1) {
      this.queue.push(item);
    }
    ;
    if (!this[\u03A8scheduled]) {
      this[\u03A8schedule]();
    }
    ;
    return this;
  }
  get committing\u03A6() {
    return this.queue.indexOf("commit") >= 0;
  }
  listen(ns, item) {
    let set = this.listeners[ns];
    let first = !set;
    set || (set = this.listeners[ns] = new Set());
    set.add(item);
    if (ns == "raf" && first) {
      this.add("raf");
    }
    ;
    return this;
  }
  unlisten(ns, item) {
    var \u03C64;
    let set = this.listeners[ns];
    set && set.delete(item);
    if (ns == "raf" && set && set.size == 0) {
      \u03C64 = this.listeners.raf, delete this.listeners.raf, \u03C64;
    }
    ;
    return this;
  }
  on(ns, item) {
    return this.listen(ns, item);
  }
  un(ns, item) {
    return this.unlisten(ns, item);
  }
  get promise() {
    var self = this;
    return self.$promise || (self.$promise = new Promise(function(resolve) {
      return self.$resolve = resolve;
    }));
  }
  tick(timestamp) {
    var self = this;
    let items = this.queue;
    let frame = this[\u03A8frames]++;
    if (!this.ts) {
      this.ts = timestamp;
    }
    ;
    this.dt = timestamp - this.ts;
    this.ts = timestamp;
    this.queue = [];
    this[\u03A8stage] = 1;
    if (items.length) {
      for (let i = 0, items\u03C6 = iter$__(items), len\u03C6 = items\u03C6.length; i < len\u03C6; i++) {
        let item = items\u03C6[i];
        if (typeof item === "string" && this.listeners[item]) {
          self.listeners[item].forEach(function(listener) {
            if (listener.tick instanceof Function) {
              return listener.tick(self, item);
            } else if (listener instanceof Function) {
              return listener(self, item);
            }
            ;
          });
        } else if (item instanceof Function) {
          item(self.dt, self);
        } else if (item.tick) {
          item.tick(self.dt, self);
        }
        ;
      }
      ;
    }
    ;
    this[\u03A8stage] = this[\u03A8scheduled] ? 0 : -1;
    if (self.$promise) {
      self.$resolve(self);
      self.$promise = self.$resolve = null;
    }
    ;
    if (self.listeners.raf && true) {
      self.add("raf");
    }
    ;
    return self;
  }
  [\u03A8schedule]() {
    if (!this[\u03A8scheduled]) {
      this[\u03A8scheduled] = true;
      if (this[\u03A8stage] == -1) {
        this[\u03A8stage] = 0;
      }
      ;
      rAF(this[\u03A8ticker]);
    }
    ;
    return this;
  }
  schedule(item, o) {
    var \u03C622, \u03C632;
    o || (o = item[\u03C622 = this.id] || (item[\u03C622] = {value: true}));
    let state = o[\u03C632 = this.id] || (o[\u03C632] = new Scheduled({owner: this, target: item}));
    return state.update(o, true);
  }
  unschedule(item, o = {}) {
    o || (o = item[this.id]);
    let state = o && o[this.id];
    if (state && state.active) {
      state.deactivate();
    }
    ;
    return this;
  }
};
var scheduler = new Scheduler();
function commit() {
  return scheduler.add("commit").promise;
}
function setTimeout2(fn, ms) {
  return globalThis.setTimeout(function() {
    fn();
    commit();
    return;
  }, ms);
}
function setInterval2(fn, ms) {
  return globalThis.setInterval(function() {
    fn();
    commit();
    return;
  }, ms);
}
var clearInterval2 = globalThis.clearInterval;
var clearTimeout2 = globalThis.clearTimeout;
var instance = globalThis.imba || (globalThis.imba = {});
instance.commit = commit;
instance.setTimeout = setTimeout2;
instance.setInterval = setInterval2;
instance.clearInterval = clearInterval2;
instance.clearTimeout = clearTimeout2;

// node_modules/imba/src/imba/dom/flags.imba
var \u03A8toStringDeopt = Symbol.for("#toStringDeopt");
var \u03A8__initor__3 = Symbol.for("#__initor__");
var \u03A8__inited__3 = Symbol.for("#__inited__");
var \u03A8symbols = Symbol.for("#symbols");
var \u03A8batches = Symbol.for("#batches");
var \u03A8extras = Symbol.for("#extras");
var \u03A8stacks = Symbol.for("#stacks");
var Flags = class {
  constructor(dom) {
    this.dom = dom;
    this.string = "";
  }
  contains(ref) {
    return this.dom.classList.contains(ref);
  }
  add(ref) {
    if (this.contains(ref)) {
      return this;
    }
    ;
    this.string += (this.string ? " " : "") + ref;
    this.dom.classList.add(ref);
    return this;
  }
  remove(ref) {
    if (!this.contains(ref)) {
      return this;
    }
    ;
    let regex = new RegExp("(^|\\s)*" + ref + "(\\s|$)*", "g");
    this.string = this.string.replace(regex, "");
    this.dom.classList.remove(ref);
    return this;
  }
  toggle(ref, bool) {
    if (bool === void 0) {
      bool = !this.contains(ref);
    }
    ;
    return bool ? this.add(ref) : this.remove(ref);
  }
  incr(ref) {
    let m = this.stacks;
    let c = m[ref] || 0;
    if (c < 1) {
      this.add(ref);
    }
    ;
    return m[ref] = Math.max(c, 0) + 1;
  }
  decr(ref) {
    let m = this.stacks;
    let c = m[ref] || 0;
    if (c == 1) {
      this.remove(ref);
    }
    ;
    return m[ref] = Math.max(c, 1) - 1;
  }
  reconcile(sym, str) {
    let syms = this[\u03A8symbols];
    let vals = this[\u03A8batches];
    let dirty = true;
    if (!syms) {
      syms = this[\u03A8symbols] = [sym];
      vals = this[\u03A8batches] = [str || ""];
      this.toString = this.valueOf = this[\u03A8toStringDeopt];
    } else {
      let idx = syms.indexOf(sym);
      let val = str || "";
      if (idx == -1) {
        syms.push(sym);
        vals.push(val);
      } else if (vals[idx] != val) {
        vals[idx] = val;
      } else {
        dirty = false;
      }
      ;
    }
    ;
    if (dirty) {
      this[\u03A8extras] = " " + vals.join(" ");
      this.sync();
    }
    ;
    return;
  }
  valueOf() {
    return this.string;
  }
  toString() {
    return this.string;
  }
  [\u03A8toStringDeopt]() {
    return this.string + (this[\u03A8extras] || "");
  }
  sync() {
    return this.dom.flagSync$();
  }
  get stacks() {
    return this[\u03A8stacks] || (this[\u03A8stacks] = {});
  }
};

// node_modules/imba/src/imba/dom/context.imba
var \u03A8__init__2 = Symbol.for("#__init__");
var \u03A8__initor__4 = Symbol.for("#__initor__");
var \u03A8__inited__4 = Symbol.for("#__inited__");
var \u03A8getRenderContext = Symbol.for("#getRenderContext");
var \u03A8getDynamicContext = Symbol.for("#getDynamicContext");
var \u03C6 = Symbol();
var renderContext = {
  context: null
};
var Renderer = class {
  constructor($$ = null) {
    this[\u03A8__init__2]($$);
  }
  [\u03A8__init__2]($$ = null) {
    var v\u03C6;
    this.stack = $$ && (v\u03C6 = $$.stack) !== void 0 ? v\u03C6 : [];
  }
  push(el) {
    return this.stack.push(el);
  }
  pop(el) {
    return this.stack.pop();
  }
};
var renderer = new Renderer();
var RenderContext = class extends Map {
  static [\u03A8__init__2]() {
    this.prototype[\u03A8__initor__4] = \u03C6;
    return this;
  }
  constructor(parent, sym = null) {
    super();
    this._ = parent;
    this.sym = sym;
    this[\u03A8__initor__4] === \u03C6 && this[\u03A8__inited__4] && this[\u03A8__inited__4]();
  }
  pop() {
    return renderContext.context = null;
  }
  [\u03A8getRenderContext](sym) {
    let out = this.get(sym);
    out || this.set(sym, out = new RenderContext(this._, sym));
    return renderContext.context = out;
  }
  [\u03A8getDynamicContext](sym, key) {
    return this[\u03A8getRenderContext](sym)[\u03A8getRenderContext](key);
  }
  run(value) {
    this.value = value;
    if (renderContext.context == this) {
      renderContext.context = null;
    }
    ;
    return this.get(value);
  }
  cache(val) {
    this.set(this.value, val);
    return val;
  }
};
RenderContext[\u03A8__init__2]();
function createRenderContext(cache2, key = Symbol(), up = cache2) {
  return renderContext.context = cache2[key] || (cache2[key] = new RenderContext(up, key));
}
function getRenderContext() {
  let ctx = renderContext.context;
  let res = ctx || new RenderContext(null);
  if (true) {
    if (!ctx && renderer.stack.length > 0) {
      console.warn("detected unmemoized nodes in", renderer.stack, "see https://imba.io", res);
    }
    ;
  }
  ;
  if (ctx) {
    renderContext.context = null;
  }
  ;
  return res;
}

// node_modules/imba/src/imba/dom/core.web.imba
function extend$__(target, ext) {
  const descriptors = Object.getOwnPropertyDescriptors(ext);
  delete descriptors.constructor;
  Object.defineProperties(target, descriptors);
  return target;
}
function iter$__2(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
var \u03A8parent = Symbol.for("#parent");
var \u03A8context = Symbol.for("#context");
var \u03A8__init__3 = Symbol.for("#__init__");
var \u03A8getRenderContext2 = Symbol.for("#getRenderContext");
var \u03A8getDynamicContext2 = Symbol.for("#getDynamicContext");
var \u03A8insertChild = Symbol.for("#insertChild");
var \u03A8appendChild = Symbol.for("#appendChild");
var \u03A8replaceChild = Symbol.for("#replaceChild");
var \u03A8removeChild = Symbol.for("#removeChild");
var \u03A8insertInto = Symbol.for("#insertInto");
var \u03A8insertIntoDeopt = Symbol.for("#insertIntoDeopt");
var \u03A8removeFrom = Symbol.for("#removeFrom");
var \u03A8removeFromDeopt = Symbol.for("#removeFromDeopt");
var \u03A8replaceWith = Symbol.for("#replaceWith");
var \u03A8replaceWithDeopt = Symbol.for("#replaceWithDeopt");
var \u03A8placeholderNode = Symbol.for("#placeholderNode");
var \u03A8attachToParent = Symbol.for("#attachToParent");
var \u03A8detachFromParent = Symbol.for("#detachFromParent");
var \u03A8placeChild = Symbol.for("#placeChild");
var \u03A8beforeReconcile = Symbol.for("#beforeReconcile");
var \u03A8afterReconcile = Symbol.for("#afterReconcile");
var \u03A8afterVisit = Symbol.for("#afterVisit");
var \u03A8__initor__5 = Symbol.for("#__initor__");
var \u03A8__inited__5 = Symbol.for("#__inited__");
var \u03A8\u03A8parent = Symbol.for("##parent");
var \u03A8\u03A8up = Symbol.for("##up");
var \u03A8\u03A8context = Symbol.for("##context");
var \u03A8domNode = Symbol.for("#domNode");
var \u03A8\u03A8placeholderNode = Symbol.for("##placeholderNode");
var \u03A8domDeopt = Symbol.for("#domDeopt");
var \u03A8isRichElement = Symbol.for("#isRichElement");
var \u03A8src = Symbol.for("#src");
var \u03A8htmlNodeName = Symbol.for("#htmlNodeName");
var \u03A8getSlot = Symbol.for("#getSlot");
var \u03A8ImbaElement = Symbol.for("#ImbaElement");
var \u03A8cssns = Symbol.for("#cssns");
var \u03A8cssid = Symbol.for("#cssid");
var \u03C62 = Symbol();
var {
  Event,
  UIEvent,
  MouseEvent,
  PointerEvent,
  KeyboardEvent,
  CustomEvent,
  Node,
  Comment,
  Text,
  Element,
  HTMLElement,
  HTMLHtmlElement,
  HTMLSelectElement,
  HTMLInputElement,
  HTMLTextAreaElement,
  HTMLButtonElement,
  HTMLOptionElement,
  HTMLScriptElement,
  SVGElement,
  DocumentFragment,
  ShadowRoot,
  Document,
  Window,
  customElements
} = globalThis.window;
var descriptorCache = {};
function getDescriptor(item, key, cache2) {
  if (!item) {
    return cache2[key] = null;
  }
  ;
  if (cache2[key] !== void 0) {
    return cache2[key];
  }
  ;
  let desc = Object.getOwnPropertyDescriptor(item, key);
  if (desc !== void 0 || item == SVGElement) {
    return cache2[key] = desc || null;
  }
  ;
  return getDescriptor(Reflect.getPrototypeOf(item), key, cache2);
}
var CustomTagConstructors = {};
var CustomTagToElementNames = {};
var TYPES = {};
var CUSTOM_TYPES = {};
var contextHandler = {
  get(target, name) {
    let ctx = target;
    let val = void 0;
    while (ctx && val == void 0) {
      if (ctx = ctx[\u03A8parent]) {
        val = ctx[name];
      }
      ;
    }
    ;
    return val;
  },
  set(target, name, value) {
    let ctx = target;
    let val = void 0;
    while (ctx && val == void 0) {
      let desc = getDeepPropertyDescriptor(ctx, name, Element);
      if (desc) {
        ctx[name] = value;
        return true;
      } else {
        ctx = ctx[\u03A8parent];
      }
      ;
    }
    ;
    return true;
  }
};
var Extend$Document$af = class {
  get flags() {
    return this.documentElement.flags;
  }
};
extend$__(Document.prototype, Extend$Document$af.prototype);
var Extend$Node$ag = class {
  get [\u03A8parent]() {
    return this[\u03A8\u03A8parent] || this.parentNode || this[\u03A8\u03A8up];
  }
  get [\u03A8context]() {
    return this[\u03A8\u03A8context] || (this[\u03A8\u03A8context] = new Proxy(this, contextHandler));
  }
  [\u03A8__init__3]() {
    return this;
  }
  [\u03A8getRenderContext2](sym) {
    return createRenderContext(this, sym);
  }
  [\u03A8getDynamicContext2](sym, key) {
    return this[\u03A8getRenderContext2](sym)[\u03A8getRenderContext2](key);
  }
  [\u03A8insertChild](newnode, refnode) {
    return newnode[\u03A8insertInto](this, refnode);
  }
  [\u03A8appendChild](newnode) {
    return newnode[\u03A8insertInto](this, null);
  }
  [\u03A8replaceChild](newnode, oldnode) {
    let res = this[\u03A8insertChild](newnode, oldnode);
    this[\u03A8removeChild](oldnode);
    return res;
  }
  [\u03A8removeChild](node) {
    return node[\u03A8removeFrom](this);
  }
  [\u03A8insertInto](parent, before = null) {
    if (before) {
      parent.insertBefore(this, before);
    } else {
      parent.appendChild(this);
    }
    ;
    return this;
  }
  [\u03A8insertIntoDeopt](parent, before) {
    if (before) {
      parent.insertBefore(this[\u03A8domNode] || this, before);
    } else {
      parent.appendChild(this[\u03A8domNode] || this);
    }
    ;
    return this;
  }
  [\u03A8removeFrom](parent) {
    return parent.removeChild(this);
  }
  [\u03A8removeFromDeopt](parent) {
    return parent.removeChild(this[\u03A8domNode] || this);
  }
  [\u03A8replaceWith](other, parent) {
    return parent[\u03A8replaceChild](other, this);
  }
  [\u03A8replaceWithDeopt](other, parent) {
    return parent[\u03A8replaceChild](other, this[\u03A8domNode] || this);
  }
  get [\u03A8placeholderNode]() {
    return this[\u03A8\u03A8placeholderNode] || (this[\u03A8\u03A8placeholderNode] = globalThis.document.createComment("placeholder"));
  }
  set [\u03A8placeholderNode](value) {
    let prev = this[\u03A8\u03A8placeholderNode];
    this[\u03A8\u03A8placeholderNode] = value;
    if (prev && prev != value && prev.parentNode) {
      prev[\u03A8replaceWith](value);
    }
    ;
  }
  [\u03A8attachToParent]() {
    let ph = this[\u03A8domNode];
    let par = ph && ph.parentNode;
    if (ph && par && ph != this) {
      this[\u03A8domNode] = null;
      this[\u03A8insertInto](par, ph);
      ph[\u03A8removeFrom](par);
    }
    ;
    return this;
  }
  [\u03A8detachFromParent]() {
    if (this[\u03A8domDeopt] != true ? (this[\u03A8domDeopt] = true, true) : false) {
      this[\u03A8replaceWith] = this[\u03A8replaceWithDeopt];
      this[\u03A8removeFrom] = this[\u03A8removeFromDeopt];
      this[\u03A8insertInto] = this[\u03A8insertIntoDeopt];
    }
    ;
    let ph = this[\u03A8placeholderNode];
    if (this.parentNode && ph != this) {
      ph[\u03A8insertInto](this.parentNode, this);
      this[\u03A8removeFrom](this.parentNode);
    }
    ;
    this[\u03A8domNode] = ph;
    return this;
  }
  [\u03A8placeChild](item, f, prev) {
    let type = typeof item;
    if (type === "undefined" || item === null) {
      if (prev && prev instanceof Comment) {
        return prev;
      }
      ;
      let el = globalThis.document.createComment("");
      return prev ? prev[\u03A8replaceWith](el, this) : el[\u03A8insertInto](this, null);
    }
    ;
    if (item === prev) {
      return item;
    } else if (type !== "object") {
      let res;
      let txt = item;
      if (f & 128 && f & 256 && false) {
        this.textContent = txt;
        return;
      }
      ;
      if (prev) {
        if (prev instanceof Text) {
          prev.textContent = txt;
          return prev;
        } else {
          res = globalThis.document.createTextNode(txt);
          prev[\u03A8replaceWith](res, this);
          return res;
        }
        ;
      } else {
        this.appendChild(res = globalThis.document.createTextNode(txt));
        return res;
      }
      ;
    } else {
      if (true) {
        if (!item[\u03A8insertInto]) {
          console.warn("Tried to insert", item, "into", this);
          throw new TypeError("Only DOM Nodes can be inserted into DOM");
        }
        ;
      }
      ;
      return prev ? prev[\u03A8replaceWith](item, this) : item[\u03A8insertInto](this, null);
    }
    ;
    return;
  }
};
extend$__(Node.prototype, Extend$Node$ag.prototype);
var Extend$Element$ah = class {
  log(...params) {
    console.log(...params);
    return this;
  }
  emit(name, detail, o = {bubbles: true, cancelable: true}) {
    if (detail != void 0) {
      o.detail = detail;
    }
    ;
    let event = new CustomEvent(name, o);
    let res = this.dispatchEvent(event);
    return event;
  }
  text$(item) {
    this.textContent = item;
    return this;
  }
  [\u03A8beforeReconcile]() {
    return this;
  }
  [\u03A8afterReconcile]() {
    return this;
  }
  [\u03A8afterVisit]() {
    if (this.render) {
      this.render();
    }
    ;
    return;
  }
  get flags() {
    if (!this.$flags) {
      this.$flags = new Flags(this);
      if (this.flag$ == Element.prototype.flag$) {
        this.flags$ext = this.className;
      }
      ;
      this.flagDeopt$();
    }
    ;
    return this.$flags;
  }
  flag$(str) {
    let ns = this.flags$ns;
    this.className = ns ? ns + (this.flags$ext = str) : this.flags$ext = str;
    return;
  }
  flagDeopt$() {
    var self = this;
    this.flag$ = this.flagExt$;
    self.flagSelf$ = function(str) {
      return self.flagSync$(self.flags$own = str);
    };
    return;
  }
  flagExt$(str) {
    return this.flagSync$(this.flags$ext = str);
  }
  flagSelf$(str) {
    this.flagDeopt$();
    return this.flagSelf$(str);
  }
  flagSync$() {
    return this.className = (this.flags$ns || "") + (this.flags$ext || "") + " " + (this.flags$own || "") + " " + (this.$flags || "");
  }
  set$(key, value) {
    let desc = getDeepPropertyDescriptor(this, key, Element);
    if (!desc || !desc.set) {
      this.setAttribute(key, value);
    } else {
      this[key] = value;
    }
    ;
    return;
  }
  get richValue() {
    return this.value;
  }
  set richValue(value) {
    this.value = value;
  }
};
extend$__(Element.prototype, Extend$Element$ah.prototype);
Element.prototype.setns$ = Element.prototype.setAttributeNS;
Element.prototype[\u03A8isRichElement] = true;
function createElement(name, parent, flags, text) {
  let el = globalThis.document.createElement(name);
  if (flags) {
    el.className = flags;
  }
  ;
  if (text !== null) {
    el.text$(text);
  }
  ;
  if (parent && parent[\u03A8appendChild]) {
    parent[\u03A8appendChild](el);
  }
  ;
  return el;
}
var Extend$SVGElement$ai = class {
  set$(key, value) {
    var \u03C622;
    let cache2 = descriptorCache[\u03C622 = this.nodeName] || (descriptorCache[\u03C622] = {});
    let desc = getDescriptor(this, key, cache2);
    if (!desc || !desc.set) {
      this.setAttribute(key, value);
    } else {
      this[key] = value;
    }
    ;
    return;
  }
  flag$(str) {
    let ns = this.flags$ns;
    this.setAttribute("class", ns ? ns + (this.flags$ext = str) : this.flags$ext = str);
    return;
  }
  flagSelf$(str) {
    var self = this;
    self.flag$ = function(str2) {
      return self.flagSync$(self.flags$ext = str2);
    };
    self.flagSelf$ = function(str2) {
      return self.flagSync$(self.flags$own = str2);
    };
    return self.flagSelf$(str);
  }
  flagSync$() {
    return this.setAttribute("class", (this.flags$ns || "") + (this.flags$ext || "") + " " + (this.flags$own || "") + " " + (this.$flags || ""));
  }
};
extend$__(SVGElement.prototype, Extend$SVGElement$ai.prototype);
var Extend$SVGSVGElement$aj = class {
  set src(value) {
    if (this[\u03A8src] != value ? (this[\u03A8src] = value, true) : false) {
      if (value) {
        if (value.adoptNode) {
          value.adoptNode(this);
        } else if (value.content) {
          for (let o\u03C6 = value.attributes, i\u03C6 = 0, keys\u03C6 = Object.keys(o\u03C6), l\u03C6 = keys\u03C6.length, k, v; i\u03C6 < l\u03C6; i\u03C6++) {
            k = keys\u03C6[i\u03C6];
            v = o\u03C6[k];
            this.setAttribute(k, v);
          }
          ;
          this.innerHTML = value.content;
        }
        ;
      }
      ;
    }
    ;
    return;
  }
};
extend$__(SVGSVGElement.prototype, Extend$SVGSVGElement$aj.prototype);
var navigator2 = globalThis.navigator;
var vendor = navigator2 && navigator2.vendor || "";
var ua = navigator2 && navigator2.userAgent || "";
var isSafari = vendor.indexOf("Apple") > -1 || ua.indexOf("CriOS") >= 0 || ua.indexOf("FxiOS") >= 0;
var supportsCustomizedBuiltInElements = !isSafari;
var CustomDescriptorCache = new Map();
var CustomHook = class extends HTMLElement {
  connectedCallback() {
    if (supportsCustomizedBuiltInElements) {
      return this.parentNode.removeChild(this);
    } else {
      return this.parentNode.connectedCallback();
    }
    ;
  }
  disconnectedCallback() {
    if (!supportsCustomizedBuiltInElements) {
      return this.parentNode.disconnectedCallback();
    }
    ;
  }
};
window.customElements.define("i-hook", CustomHook);
function getCustomDescriptors(el, klass) {
  let props = CustomDescriptorCache.get(klass);
  if (!props) {
    props = {};
    let proto = klass.prototype;
    let protos = [proto];
    while (proto = proto && Object.getPrototypeOf(proto)) {
      if (proto.constructor == el.constructor) {
        break;
      }
      ;
      protos.unshift(proto);
    }
    ;
    for (let i\u03C62 = 0, items\u03C6 = iter$__2(protos), len\u03C6 = items\u03C6.length; i\u03C62 < len\u03C6; i\u03C62++) {
      let item = items\u03C6[i\u03C62];
      let desc = Object.getOwnPropertyDescriptors(item);
      Object.assign(props, desc);
    }
    ;
    CustomDescriptorCache.set(klass, props);
  }
  ;
  return props;
}
function createComponent(name, parent, flags, text, ctx) {
  let el;
  if (typeof name != "string") {
    if (name && name.nodeName) {
      name = name.nodeName;
    }
    ;
  }
  ;
  let cmpname = CustomTagToElementNames[name] || name;
  if (CustomTagConstructors[name]) {
    let cls = CustomTagConstructors[name];
    let typ = cls.prototype[\u03A8htmlNodeName];
    if (typ && supportsCustomizedBuiltInElements) {
      el = globalThis.document.createElement(typ, {is: name});
    } else if (cls.create$ && typ) {
      el = globalThis.document.createElement(typ);
      el.setAttribute("is", cmpname);
      let props = getCustomDescriptors(el, cls);
      Object.defineProperties(el, props);
      el.__slots = {};
      el.appendChild(globalThis.document.createElement("i-hook"));
    } else if (cls.create$) {
      el = cls.create$(el);
      el.__slots = {};
    } else {
      console.warn("could not create tag " + name);
    }
    ;
  } else {
    el = globalThis.document.createElement(CustomTagToElementNames[name] || name);
  }
  ;
  el[\u03A8\u03A8parent] = parent;
  el[\u03A8__init__3]();
  if (text !== null) {
    el[\u03A8getSlot]("__").text$(text);
  }
  ;
  if (flags || el.flags$ns) {
    el.flag$(flags || "");
  }
  ;
  return el;
}
function defineTag(name, klass, options = {}) {
  TYPES[name] = CUSTOM_TYPES[name] = klass;
  klass.nodeName = name;
  let componentName = name;
  let proto = klass.prototype;
  if (name.indexOf("-") == -1) {
    componentName = "" + name + "-tag";
    CustomTagToElementNames[name] = componentName;
  }
  ;
  if (options.cssns) {
    let ns = (proto._ns_ || proto[\u03A8cssns] || "") + " " + (options.cssns || "");
    proto._ns_ = ns.trim() + " ";
    proto[\u03A8cssns] = options.cssns;
  }
  ;
  if (options.cssid) {
    let ids = (proto.flags$ns || "") + " " + options.cssid;
    proto[\u03A8cssid] = options.cssid;
    proto.flags$ns = ids.trim() + " ";
  }
  ;
  if (proto[\u03A8htmlNodeName] && !options.extends) {
    options.extends = proto[\u03A8htmlNodeName];
  }
  ;
  if (options.extends) {
    proto[\u03A8htmlNodeName] = options.extends;
    CustomTagConstructors[name] = klass;
    if (supportsCustomizedBuiltInElements) {
      window.customElements.define(componentName, klass, {extends: options.extends});
    }
    ;
  } else {
    window.customElements.define(componentName, klass);
  }
  ;
  return klass;
}
var instance2 = globalThis.imba || (globalThis.imba = {});
instance2.document = globalThis.document;

// node_modules/imba/src/imba/dom/component.imba
function iter$__3(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
var \u03A8__init__4 = Symbol.for("#__init__");
var \u03A8__initor__6 = Symbol.for("#__initor__");
var \u03A8__inited__6 = Symbol.for("#__inited__");
var \u03A8afterVisit2 = Symbol.for("#afterVisit");
var \u03A8beforeReconcile2 = Symbol.for("#beforeReconcile");
var \u03A8afterReconcile2 = Symbol.for("#afterReconcile");
var \u03A8count = Symbol.for("#count");
var \u03A8autorender = Symbol.for("#autorender");
var \u03C63 = Symbol();
var hydrator = new class {
  constructor($$ = null) {
    this[\u03A8__init__4]($$);
  }
  [\u03A8__init__4]($$ = null) {
    var v\u03C6;
    this.items = $$ && (v\u03C6 = $$.items) !== void 0 ? v\u03C6 : [];
    this.current = $$ && (v\u03C6 = $$.current) !== void 0 ? v\u03C6 : null;
    this.lastQueued = $$ && (v\u03C6 = $$.lastQueued) !== void 0 ? v\u03C6 : null;
    this.tests = $$ && (v\u03C6 = $$.tests) !== void 0 ? v\u03C6 : 0;
  }
  flush() {
    let item = null;
    if (false) {
    }
    ;
    while (item = this.items.shift()) {
      if (!item.parentNode || item.hydrated\u03A6) {
        continue;
      }
      ;
      let prev = this.current;
      this.current = item;
      item.__F |= 1024;
      item.connectedCallback();
      this.current = prev;
    }
    ;
    return;
  }
  queue(item) {
    var self = this;
    let len = this.items.length;
    let idx = 0;
    let prev = this.lastQueued;
    this.lastQueued = item;
    let BEFORE = Node.DOCUMENT_POSITION_PRECEDING;
    let AFTER = Node.DOCUMENT_POSITION_FOLLOWING;
    if (len) {
      let prevIndex = this.items.indexOf(prev);
      let index = prevIndex;
      let compare = function(a, b) {
        self.tests++;
        return a.compareDocumentPosition(b);
      };
      if (prevIndex == -1 || prev.nodeName != item.nodeName) {
        index = prevIndex = 0;
      }
      ;
      let curr = self.items[index];
      while (curr && compare(curr, item) & AFTER) {
        curr = self.items[++index];
      }
      ;
      if (index != prevIndex) {
        curr ? self.items.splice(index, 0, item) : self.items.push(item);
      } else {
        while (curr && compare(curr, item) & BEFORE) {
          curr = self.items[--index];
        }
        ;
        if (index != prevIndex) {
          curr ? self.items.splice(index + 1, 0, item) : self.items.unshift(item);
        }
        ;
      }
      ;
    } else {
      self.items.push(item);
      if (!self.current) {
        globalThis.queueMicrotask(self.flush.bind(self));
      }
      ;
    }
    ;
    return;
  }
  run(item) {
    var \u03C632, \u03C622;
    if (this.active) {
      return;
    }
    ;
    this.active = true;
    let all = globalThis.document.querySelectorAll(".__ssr");
    console.log("running hydrator", item, all.length, Array.from(all));
    for (let i\u03C6 = 0, items\u03C6 = iter$__3(all), len\u03C6 = items\u03C6.length; i\u03C6 < len\u03C6; i\u03C6++) {
      let item2 = items\u03C6[i\u03C6];
      item2[\u03A8count] || (item2[\u03A8count] = 1);
      item2[\u03A8count]++;
      let name = item2.nodeName;
      let typ = (\u03C622 = this.map)[name] || (\u03C622[name] = globalThis.window.customElements.get(name.toLowerCase()) || HTMLElement);
      console.log("item type", name, typ, !!CUSTOM_TYPES[name.toLowerCase()]);
      if (!item2.connectedCallback || !item2.parentNode || item2.hydrated\u03A6) {
        continue;
      }
      ;
      console.log("hydrate", item2);
    }
    ;
    return this.active = false;
  }
}();
var Component = class extends HTMLElement {
  static [\u03A8__init__4]() {
    this.prototype[\u03A8__initor__6] = \u03C63;
    return this;
  }
  constructor() {
    super();
    if (this.flags$ns) {
      this.flag$ = this.flagExt$;
    }
    ;
    this.setup$();
    this.build();
    this[\u03A8__initor__6] === \u03C63 && this[\u03A8__inited__6] && this[\u03A8__inited__6]();
  }
  setup$() {
    this.__slots = {};
    return this.__F = 0;
  }
  [\u03A8__init__4]() {
    this.__F |= 1 | 2;
    return this;
  }
  flag$(str) {
    this.className = this.flags$ext = str;
    return;
  }
  build() {
    return this;
  }
  awaken() {
    return this;
  }
  mount() {
    return this;
  }
  unmount() {
    return this;
  }
  rendered() {
    return this;
  }
  dehydrate() {
    return this;
  }
  hydrate() {
    this.autoschedule = true;
    return this;
  }
  tick() {
    return this.commit();
  }
  visit() {
    return this.commit();
  }
  commit() {
    if (!this.render\u03A6) {
      this.__F |= 8192;
      return this;
    }
    ;
    this.__F |= 256;
    this.render && this.render();
    this.rendered();
    return this.__F = (this.__F | 512) & ~256 & ~8192;
  }
  get autoschedule() {
    return (this.__F & 64) != 0;
  }
  set autoschedule(value) {
    value ? this.__F |= 64 : this.__F &= ~64;
  }
  set autorender(value) {
    let o = this[\u03A8autorender] || (this[\u03A8autorender] = {});
    o.value = value;
    if (this.mounted\u03A6) {
      scheduler.schedule(this, o);
    }
    ;
    return;
  }
  get render\u03A6() {
    return !this.suspended\u03A6;
  }
  get mounting\u03A6() {
    return (this.__F & 16) != 0;
  }
  get mounted\u03A6() {
    return (this.__F & 32) != 0;
  }
  get awakened\u03A6() {
    return (this.__F & 8) != 0;
  }
  get rendered\u03A6() {
    return (this.__F & 512) != 0;
  }
  get suspended\u03A6() {
    return (this.__F & 4096) != 0;
  }
  get rendering\u03A6() {
    return (this.__F & 256) != 0;
  }
  get scheduled\u03A6() {
    return (this.__F & 128) != 0;
  }
  get hydrated\u03A6() {
    return (this.__F & 2) != 0;
  }
  get ssr\u03A6() {
    return (this.__F & 1024) != 0;
  }
  schedule() {
    scheduler.on("commit", this);
    this.__F |= 128;
    return this;
  }
  unschedule() {
    scheduler.un("commit", this);
    this.__F &= ~128;
    return this;
  }
  async suspend(cb = null) {
    let val = this.flags.incr("_suspended_");
    this.__F |= 4096;
    if (cb instanceof Function) {
      await cb();
      this.unsuspend();
    }
    ;
    return this;
  }
  unsuspend() {
    let val = this.flags.decr("_suspended_");
    if (val == 0) {
      this.__F &= ~4096;
      this.commit();
      ;
    }
    ;
    return this;
  }
  [\u03A8afterVisit2]() {
    return this.visit();
  }
  [\u03A8beforeReconcile2]() {
    if (this.__F & 1024) {
      this.__F = this.__F & ~1024;
      this.classList.remove("_ssr_");
      if (this.flags$ext && this.flags$ext.indexOf("_ssr_") == 0) {
        this.flags$ext = this.flags$ext.slice(5);
      }
      ;
      if (!(this.__F & 512)) {
        this.innerHTML = "";
      }
      ;
    }
    ;
    if (true) {
      renderer.push(this);
    }
    ;
    return this;
  }
  [\u03A8afterReconcile2]() {
    if (true) {
      renderer.pop(this);
    }
    ;
    return this;
  }
  connectedCallback() {
    let flags = this.__F;
    let inited = flags & 1;
    let awakened = flags & 8;
    if (!inited && !(flags & 1024)) {
      hydrator.queue(this);
      return;
    }
    ;
    if (flags & (16 | 32)) {
      return;
    }
    ;
    this.__F |= 16;
    if (!inited) {
      this[\u03A8__init__4]();
    }
    ;
    if (!(flags & 2)) {
      this.flags$ext = this.className;
      this.__F |= 2;
      this.hydrate();
      this.commit();
    }
    ;
    if (!awakened) {
      this.awaken();
      this.__F |= 8;
    }
    ;
    let res = this.mount();
    if (res && res.then instanceof Function) {
      res.then(scheduler.commit);
    }
    ;
    flags = this.__F = (this.__F | 32) & ~16;
    if (flags & 64) {
      this.schedule();
    }
    ;
    if (this[\u03A8autorender]) {
      scheduler.schedule(this, this[\u03A8autorender]);
    }
    ;
    return this;
  }
  disconnectedCallback() {
    this.__F = this.__F & (~32 & ~16);
    if (this.__F & 128) {
      this.unschedule();
    }
    ;
    this.unmount();
    if (this[\u03A8autorender]) {
      return scheduler.unschedule(this, this[\u03A8autorender]);
    }
    ;
  }
};
Component[\u03A8__init__4]();

// node_modules/imba/src/imba/dom/mount.imba
var \u03A8insertInto2 = Symbol.for("#insertInto");
var \u03A8removeFrom2 = Symbol.for("#removeFrom");
function mount(mountable, into) {
  if (false) {
  }
  ;
  let parent = into || globalThis.document.body;
  let element = mountable;
  if (mountable instanceof Function) {
    let ctx = new RenderContext(parent, null);
    let tick = function() {
      let prev = renderContext.context;
      renderContext.context = ctx;
      let res = mountable(ctx);
      if (renderContext.context == ctx) {
        renderContext.context = prev;
      }
      ;
      return res;
    };
    element = tick();
    scheduler.listen("commit", tick);
  } else {
    element.__F |= 64;
  }
  ;
  element[\u03A8insertInto2](parent);
  return element;
}
function unmount(el) {
  if (el && el[\u03A8removeFrom2]) {
    el[\u03A8removeFrom2](el.parentNode);
  }
  ;
  return el;
}
var instance3 = globalThis.imba || (globalThis.imba = {});
instance3.mount = mount;
instance3.unmount = unmount;

// node_modules/imba/src/imba/events/keyboard.imba
function extend$__2(target, ext) {
  const descriptors = Object.getOwnPropertyDescriptors(ext);
  delete descriptors.constructor;
  Object.defineProperties(target, descriptors);
  return target;
}
function use_events_keyboard() {
  return true;
}
var Extend$KeyboardEvent$af = class {
  \u03B1esc() {
    return this.keyCode == 27;
  }
  \u03B1tab() {
    return this.keyCode == 9;
  }
  \u03B1enter() {
    return this.keyCode == 13;
  }
  \u03B1space() {
    return this.keyCode == 32;
  }
  \u03B1up() {
    return this.keyCode == 38;
  }
  \u03B1down() {
    return this.keyCode == 40;
  }
  \u03B1left() {
    return this.keyCode == 37;
  }
  \u03B1right() {
    return this.keyCode == 39;
  }
  \u03B1del() {
    return this.keyCode == 8 || this.keyCode == 46;
  }
  \u03B1key(code) {
    if (typeof code == "string") {
      return this.key == code;
    } else if (typeof code == "number") {
      return this.keyCode == code;
    }
    ;
  }
};
extend$__2(KeyboardEvent.prototype, Extend$KeyboardEvent$af.prototype);

// node_modules/imba/src/imba/events/mouse.imba
function extend$__3(target, ext) {
  const descriptors = Object.getOwnPropertyDescriptors(ext);
  delete descriptors.constructor;
  Object.defineProperties(target, descriptors);
  return target;
}
function use_events_mouse() {
  return true;
}
var Extend$MouseEvent$af = class {
  \u03B1left() {
    return this.button == 0;
  }
  \u03B1middle() {
    return this.button == 1;
  }
  \u03B1right() {
    return this.button == 2;
  }
  \u03B1shift() {
    return !!this.shiftKey;
  }
  \u03B1alt() {
    return !!this.altKey;
  }
  \u03B1ctrl() {
    return !!this.ctrlKey;
  }
  \u03B1meta() {
    return !!this.metaKey;
  }
  \u03B1mod() {
    let nav = globalThis.navigator.platform;
    return /^(Mac|iPhone|iPad|iPod)/.test(nav || "") ? !!this.metaKey : !!this.ctrlKey;
  }
};
extend$__3(MouseEvent.prototype, Extend$MouseEvent$af.prototype);

// node_modules/imba/src/imba/events/core.imba
function extend$__4(target, ext) {
  const descriptors = Object.getOwnPropertyDescriptors(ext);
  delete descriptors.constructor;
  Object.defineProperties(target, descriptors);
  return target;
}
function iter$__4(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
var \u03A8extendType = Symbol.for("#extendType");
var \u03A8modifierState = Symbol.for("#modifierState");
var \u03A8sharedModifierState = Symbol.for("#sharedModifierState");
var \u03A8onceHandlerEnd = Symbol.for("#onceHandlerEnd");
var \u03A8__initor__7 = Symbol.for("#__initor__");
var \u03A8__inited__7 = Symbol.for("#__inited__");
var \u03A8extendDescriptors = Symbol.for("#extendDescriptors");
var \u03A8context2 = Symbol.for("#context");
var \u03A8self = Symbol.for("#self");
var \u03A8target = Symbol.for("#target");
var \u03A8stopPropagation = Symbol.for("#stopPropagation");
var \u03A8defaultPrevented = Symbol.for("#defaultPrevented");
use_events_keyboard();
use_events_mouse();
var Extend$CustomEvent$af = class {
  [\u03A8extendType](kls) {
    var \u03C622, desc, \u03C64;
    let ext = kls[\u03A8extendDescriptors] || (kls[\u03A8extendDescriptors] = (desc = Object.getOwnPropertyDescriptors(kls.prototype), \u03C64 = desc.constructor, delete desc.constructor, \u03C64, desc));
    return Object.defineProperties(this, ext);
  }
};
extend$__4(CustomEvent.prototype, Extend$CustomEvent$af.prototype);
var Extend$Event$ag = class {
  get [\u03A8modifierState]() {
    var \u03C64, \u03C632;
    return (\u03C64 = this[\u03A8context2])[\u03C632 = this[\u03A8context2].step] || (\u03C64[\u03C632] = {});
  }
  get [\u03A8sharedModifierState]() {
    var \u03C66, \u03C65;
    return (\u03C66 = this[\u03A8context2].handler)[\u03C65 = this[\u03A8context2].step] || (\u03C66[\u03C65] = {});
  }
  [\u03A8onceHandlerEnd](cb) {
    return once(this[\u03A8context2], "end", cb);
  }
  \u03B1sel(selector) {
    return !!this.target.matches(String(selector));
  }
  \u03B1closest(selector) {
    return !!this.target.closest(String(selector));
  }
  \u03B1log(...params) {
    console.info(...params);
    return true;
  }
  \u03B1trusted() {
    return !!this.isTrusted;
  }
  \u03B1if(expr) {
    return !!expr;
  }
  \u03B1wait(time = 250) {
    return new Promise(function(_0) {
      return setTimeout(_0, parseTime(time));
    });
  }
  \u03B1self() {
    return this.target == this[\u03A8context2].element;
  }
  \u03B1cooldown(time = 250) {
    let o = this[\u03A8sharedModifierState];
    if (o.active) {
      return false;
    }
    ;
    o.active = true;
    o.target = this[\u03A8context2].element;
    o.target.flags.incr("cooldown");
    this[\u03A8onceHandlerEnd](function() {
      return setTimeout(function() {
        o.target.flags.decr("cooldown");
        return o.active = false;
      }, parseTime(time));
    });
    return true;
  }
  \u03B1throttle(time = 250) {
    let o = this[\u03A8sharedModifierState];
    if (o.active) {
      if (o.next) {
        o.next(false);
      }
      ;
      return new Promise(function(r) {
        return o.next = function(val) {
          o.next = null;
          return r(val);
        };
      });
    }
    ;
    o.active = true;
    o.el || (o.el = this[\u03A8context2].element);
    o.el.flags.incr("throttled");
    once(this[\u03A8context2], "end", function() {
      let delay = parseTime(time);
      return o.interval = setInterval(function() {
        if (o.next) {
          o.next(true);
        } else {
          clearInterval(o.interval);
          o.el.flags.decr("throttled");
          o.active = false;
        }
        ;
        return;
      }, delay);
    });
    return true;
  }
  \u03B1debounce(time = 250) {
    let o = this[\u03A8sharedModifierState];
    let e = this;
    o.queue || (o.queue = []);
    o.queue.push(o.last = e);
    return new Promise(function(resolve) {
      return setTimeout(function() {
        if (o.last == e) {
          e.debounced = o.queue;
          o.last = null;
          o.queue = [];
          return resolve(true);
        } else {
          return resolve(false);
        }
        ;
      }, parseTime(time));
    });
  }
  \u03B1flag(name, sel) {
    const {element, step, state, id, current} = this[\u03A8context2];
    let el = sel instanceof Element ? sel : sel ? element.closest(sel) : element;
    if (!el) {
      return true;
    }
    ;
    this[\u03A8context2].commit = true;
    state[step] = id;
    el.flags.incr(name);
    let ts = Date.now();
    once(current, "end", function() {
      let elapsed = Date.now() - ts;
      let delay = Math.max(250 - elapsed, 0);
      return setTimeout(function() {
        return el.flags.decr(name);
      }, delay);
    });
    return true;
  }
  \u03B1busy(sel) {
    return this["\u03B1flag"]("busy", sel);
  }
  \u03B1mod(name) {
    return this["\u03B1flag"]("mod-" + name, globalThis.document.documentElement);
  }
  \u03B1outside() {
    const {handler} = this[\u03A8context2];
    if (handler && handler[\u03A8self]) {
      return !handler[\u03A8self].parentNode.contains(this.target);
    }
    ;
  }
};
extend$__4(Event.prototype, Extend$Event$ag.prototype);
function use_events() {
  return true;
}
var EventHandler = class {
  constructor(params, closure) {
    this.params = params;
    this.closure = closure;
  }
  getHandlerForMethod(el, name) {
    if (!el) {
      return null;
    }
    ;
    return el[name] ? el : this.getHandlerForMethod(el.parentNode, name);
  }
  emit(name, ...params) {
    return emit(this, name, params);
  }
  on(name, ...params) {
    return listen(this, name, ...params);
  }
  once(name, ...params) {
    return once(this, name, ...params);
  }
  un(name, ...params) {
    return unlisten(this, name, ...params);
  }
  get passive\u03A6() {
    return this.params.passive;
  }
  get capture\u03A6() {
    return this.params.capture;
  }
  get silent\u03A6() {
    return this.params.silent;
  }
  get global\u03A6() {
    return this.params.global;
  }
  async handleEvent(event) {
    let element = this[\u03A8target] || event.currentTarget;
    let mods = this.params;
    let error = null;
    let silence = mods.silence || mods.silent;
    this.count || (this.count = 0);
    this.state || (this.state = {});
    let state = {
      element,
      event,
      modifiers: mods,
      handler: this,
      id: ++this.count,
      step: -1,
      state: this.state,
      commit: null,
      current: null
    };
    state.current = state;
    if (event.handle$mod) {
      if (event.handle$mod.apply(state, mods.options || []) == false) {
        return;
      }
      ;
    }
    ;
    let guard = Event[this.type + "$handle"] || Event[event.type + "$handle"] || event.handle$mod;
    if (guard && guard.apply(state, mods.options || []) == false) {
      return;
    }
    ;
    this.currentEvents || (this.currentEvents = new Set());
    this.currentEvents.add(event);
    for (let i\u03C6 = 0, keys\u03C6 = Object.keys(mods), l\u03C6 = keys\u03C6.length, handler, val; i\u03C6 < l\u03C6; i\u03C6++) {
      handler = keys\u03C6[i\u03C6];
      val = mods[handler];
      state.step++;
      if (handler[0] == "_") {
        continue;
      }
      ;
      if (handler.indexOf("~") > 0) {
        handler = handler.split("~")[0];
      }
      ;
      let modargs = null;
      let args = [event, state];
      let res = void 0;
      let context = null;
      let m;
      let negated = false;
      let isstring = typeof handler == "string";
      if (handler[0] == "$" && handler[1] == "_" && val[0] instanceof Function) {
        handler = val[0];
        if (!handler.passive) {
          state.commit = true;
        }
        ;
        args = [event, state].concat(val.slice(1));
        context = element;
      } else if (val instanceof Array) {
        args = val.slice();
        modargs = args;
        for (let i = 0, items\u03C6 = iter$__4(args), len\u03C62 = items\u03C6.length; i < len\u03C62; i++) {
          let par = items\u03C6[i];
          if (typeof par == "string" && par[0] == "~" && par[1] == "$") {
            let name = par.slice(2);
            let chain = name.split(".");
            let value = state[chain.shift()] || event;
            for (let i2 = 0, items\u03C62 = iter$__4(chain), len\u03C6 = items\u03C62.length; i2 < len\u03C6; i2++) {
              let part = items\u03C62[i2];
              value = value ? value[part] : void 0;
            }
            ;
            args[i] = value;
          }
          ;
        }
        ;
      }
      ;
      if (typeof handler == "string" && (m = handler.match(/^(emit|flag|mod|moved|pin|fit|refit|map|remap|css)-(.+)$/))) {
        if (!modargs) {
          modargs = args = [];
        }
        ;
        args.unshift(m[2]);
        handler = m[1];
      }
      ;
      if (handler == "trap") {
        event[\u03A8stopPropagation] = true;
        event.stopImmediatePropagation();
        event[\u03A8defaultPrevented] = true;
        event.preventDefault();
      } else if (handler == "stop") {
        event[\u03A8stopPropagation] = true;
        event.stopImmediatePropagation();
      } else if (handler == "prevent") {
        event[\u03A8defaultPrevented] = true;
        event.preventDefault();
      } else if (handler == "commit") {
        state.commit = true;
      } else if (handler == "once") {
        element.removeEventListener(event.type, this);
      } else if (handler == "options" || handler == "silence" || handler == "silent") {
        continue;
      } else if (handler == "emit") {
        let name = args[0];
        let detail = args[1];
        let e = new CustomEvent(name, {bubbles: true, detail});
        e.originalEvent = event;
        let customRes = element.dispatchEvent(e);
      } else if (typeof handler == "string") {
        if (handler[0] == "!") {
          negated = true;
          handler = handler.slice(1);
        }
        ;
        let path = "\u03B1" + handler;
        let fn = event[path];
        fn || (fn = this.type && Event[this.type + "$" + handler + "$mod"]);
        fn || (fn = event[handler + "$mod"] || Event[event.type + "$" + handler] || Event[handler + "$mod"]);
        if (fn instanceof Function) {
          handler = fn;
          context = state;
          args = modargs || [];
          if (event[path]) {
            context = event;
            event[\u03A8context2] = state;
          }
          ;
        } else if (handler[0] == "_") {
          handler = handler.slice(1);
          context = this.closure;
        } else {
          context = this.getHandlerForMethod(element, handler);
        }
        ;
      }
      ;
      try {
        if (handler instanceof Function) {
          res = handler.apply(context || element, args);
        } else if (context) {
          res = context[handler].apply(context, args);
        }
        ;
        if (res && res.then instanceof Function && res != scheduler.$promise) {
          if (state.commit && !silence) {
            scheduler.commit();
          }
          ;
          res = await res;
        }
        ;
      } catch (e) {
        error = e;
        break;
      }
      ;
      if (negated && res === true) {
        break;
      }
      ;
      if (!negated && res === false) {
        break;
      }
      ;
      state.value = res;
    }
    ;
    emit(state, "end", state);
    if (state.commit && !silence) {
      scheduler.commit();
    }
    ;
    this.currentEvents.delete(event);
    if (this.currentEvents.size == 0) {
      this.emit("idle");
    }
    ;
    if (error) {
      throw error;
    }
    ;
    return;
  }
};
var Extend$Element$ah2 = class {
  on$(type, mods, scope) {
    let check = "on$" + type;
    let handler;
    handler = new EventHandler(mods, scope);
    let capture = mods.capture || false;
    let passive = mods.passive;
    let o = capture;
    if (passive) {
      o = {passive, capture};
    }
    ;
    if (this[check] instanceof Function) {
      handler = this[check](mods, scope, handler, o);
    } else {
      this.addEventListener(type, handler, o);
    }
    ;
    return handler;
  }
};
extend$__4(Element.prototype, Extend$Element$ah2.prototype);

// node_modules/imba/src/imba/events/hotkey.shared.imba
var \u03A8string = Symbol.for("#string");
var \u03A8html = Symbol.for("#html");
var labels = {
  esc: {mac: "\u238B"},
  enter: {mac: "\u21A9"},
  shift: {mac: "\u21E7"},
  command: "\u2318",
  mod: {mac: "\u2318", win: "ctrl"},
  ctrl: {mac: "\u2303"},
  meta: {mac: "\u2318", win: "win"},
  option: {mac: "\u2325", win: "alt"},
  alt: {mac: "\u2325", win: "alt"},
  del: "\u2326",
  backspace: "\u232B",
  left: {mac: "\u2192"},
  up: {mac: "\u2191"},
  down: {mac: "\u2193"},
  right: {mac: "\u2190"},
  plus: {mac: "+"},
  tab: {mac: "\u21E5"}
};
var cfg = {
  win: {
    sep: "+",
    order: ["meta", "ctrl", "mod", "alt", "option", "shift"].reverse()
  },
  mac: {
    sep: "",
    order: ["ctrl", "alt", "option", "shift", "mod", "command"].reverse()
  }
};
cfg.auto = cfg.win;
if ((globalThis.navigator.platform || "").match(/iPhone|iPod|iPad|Mac/)) {
  cfg.auto = cfg.mac;
}
var cache = {};
function format(combo, platform = "auto") {
  let key = "" + combo + ":" + platform;
  if (cache[key]) {
    return cache[key];
  }
  ;
  let o = cfg[platform] || cfg.win;
  let combos = combo.split(" ").map(function(_0) {
    let keys = _0.split("+");
    let items = keys.sort(function(_02, _1) {
      return o.order.indexOf(_1) - o.order.indexOf(_02);
    });
    let strings = items.map(function(_02) {
      let lbl = labels[_02] || _02;
      lbl = typeof lbl == "string" ? lbl : lbl[platform] || _02;
      return lbl = lbl[0].toUpperCase() + (lbl.slice(1) || "");
    });
    return strings;
  });
  return cache[key] = combos;
}
function humanize(combo, platform) {
  var \u03C64;
  let arr = format(combo, platform);
  let o = cfg[platform] || cfg.win;
  return arr[\u03A8string] || (arr[\u03A8string] = arr.map(function(_0) {
    return _0.join(o.sep);
  }).join(" "));
}
function htmlify(combo, platform) {
  var \u03C622;
  let arr = format(combo, platform);
  let o = cfg[platform] || cfg.win;
  return arr[\u03A8html] || (arr[\u03A8html] = arr.map(function(_0) {
    return "<kbd>" + _0.map(function(_02) {
      return "<kbd>" + _02 + "</kbd>";
    }).join("") + "</kbd>";
  }).join(" "));
}

// node_modules/imba/src/imba/events/mousetrap.mjs
var _MAP = {
  8: "backspace",
  9: "tab",
  13: "enter",
  16: "shift",
  17: "ctrl",
  18: "alt",
  20: "capslock",
  27: "esc",
  32: "space",
  33: "pageup",
  34: "pagedown",
  35: "end",
  36: "home",
  37: "left",
  38: "up",
  39: "right",
  40: "down",
  45: "ins",
  46: "del",
  91: "meta",
  93: "meta",
  224: "meta"
};
var _KEYCODE_MAP = {
  106: "*",
  107: "+",
  109: "-",
  110: ".",
  111: "/",
  186: ";",
  187: "=",
  188: ",",
  189: "-",
  190: ".",
  191: "/",
  192: "`",
  219: "[",
  220: "\\",
  221: "]",
  222: "'"
};
var _SHIFT_MAP = {
  "~": "`",
  "!": "1",
  "@": "2",
  "#": "3",
  $: "4",
  "%": "5",
  "^": "6",
  "&": "7",
  "*": "8",
  "(": "9",
  ")": "0",
  _: "-",
  "+": "=",
  ":": ";",
  '"': "'",
  "<": ",",
  ">": ".",
  "?": "/",
  "|": "\\"
};
var _SPECIAL_ALIASES = {
  option: "alt",
  command: "meta",
  return: "enter",
  escape: "esc",
  plus: "+",
  mod: /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? "meta" : "ctrl"
};
var _REVERSE_MAP;
for (var i = 1; i < 20; ++i) {
  _MAP[111 + i] = "f" + i;
}
for (i = 0; i <= 9; ++i) {
  _MAP[i + 96] = i.toString();
}
function _addEvent(object, type, callback) {
  if (object.addEventListener) {
    object.addEventListener(type, callback, false);
    return;
  }
  object.attachEvent("on" + type, callback);
}
function _removeEvent(object, type, callback) {
  if (object.removeEventListener) {
    object.removeEventListener(type, callback, false);
    return;
  }
  object.detachEvent("on" + type, callback);
}
function _characterFromEvent(e) {
  if (e.type == "keypress") {
    var character = String.fromCharCode(e.which);
    if (!e.shiftKey) {
      character = character.toLowerCase();
    }
    return character;
  }
  if (_MAP[e.which]) {
    return _MAP[e.which];
  }
  if (_KEYCODE_MAP[e.which]) {
    return _KEYCODE_MAP[e.which];
  }
  return String.fromCharCode(e.which).toLowerCase();
}
function _modifiersMatch(modifiers1, modifiers2) {
  return modifiers1.sort().join(",") === modifiers2.sort().join(",");
}
function _eventModifiers(e) {
  var modifiers = [];
  if (e.shiftKey) {
    modifiers.push("shift");
  }
  if (e.altKey) {
    modifiers.push("alt");
  }
  if (e.ctrlKey) {
    modifiers.push("ctrl");
  }
  if (e.metaKey) {
    modifiers.push("meta");
  }
  return modifiers;
}
function _preventDefault(e) {
  if (e.preventDefault) {
    e.preventDefault();
    return;
  }
  e.returnValue = false;
}
function _stopPropagation(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
    return;
  }
  e.cancelBubble = true;
}
function _isModifier(key) {
  return key == "shift" || key == "ctrl" || key == "alt" || key == "meta";
}
function _getReverseMap() {
  if (!_REVERSE_MAP) {
    _REVERSE_MAP = {};
    for (var key in _MAP) {
      if (key > 95 && key < 112) {
        continue;
      }
      if (_MAP.hasOwnProperty(key)) {
        _REVERSE_MAP[_MAP[key]] = key;
      }
    }
  }
  return _REVERSE_MAP;
}
function _pickBestAction(key, modifiers, action) {
  if (!action) {
    action = _getReverseMap()[key] ? "keydown" : "keypress";
  }
  if (action == "keypress" && modifiers.length) {
    action = "keydown";
  }
  return action;
}
function _keysFromString(combination) {
  if (combination === "+") {
    return ["+"];
  }
  combination = combination.replace(/\+{2}/g, "+plus");
  return combination.split("+");
}
function _getKeyInfo(combination, action) {
  var keys;
  var key;
  var i;
  var modifiers = [];
  keys = _keysFromString(combination);
  for (i = 0; i < keys.length; ++i) {
    key = keys[i];
    if (_SPECIAL_ALIASES[key]) {
      key = _SPECIAL_ALIASES[key];
    }
    if (action && action != "keypress" && _SHIFT_MAP[key]) {
      key = _SHIFT_MAP[key];
      modifiers.push("shift");
    }
    if (_isModifier(key)) {
      modifiers.push(key);
    }
  }
  action = _pickBestAction(key, modifiers, action);
  return {
    key,
    modifiers,
    action
  };
}
function _belongsTo(element, ancestor) {
  if (element === null || element === document) {
    return false;
  }
  if (element === ancestor) {
    return true;
  }
  return _belongsTo(element.parentNode, ancestor);
}
function Mousetrap(targetElement) {
  var self = this;
  targetElement = targetElement || document;
  if (!(self instanceof Mousetrap)) {
    return new Mousetrap(targetElement);
  }
  self.target = targetElement;
  self._callbacks = {};
  self._directMap = {};
  var _sequenceLevels = {};
  var _resetTimer;
  var _ignoreNextKeyup = false;
  var _ignoreNextKeypress = false;
  var _nextExpectedAction = false;
  function _resetSequences(doNotReset) {
    doNotReset = doNotReset || {};
    var activeSequences = false, key;
    for (key in _sequenceLevels) {
      if (doNotReset[key]) {
        activeSequences = true;
        continue;
      }
      _sequenceLevels[key] = 0;
    }
    if (!activeSequences) {
      _nextExpectedAction = false;
    }
  }
  function _getMatches(character, modifiers, e, sequenceName, combination, level) {
    var i;
    var callback;
    var matches = [];
    var action = e.type;
    if (!self._callbacks[character]) {
      return [];
    }
    if (action == "keyup" && _isModifier(character)) {
      modifiers = [character];
    }
    for (i = 0; i < self._callbacks[character].length; ++i) {
      callback = self._callbacks[character][i];
      if (!sequenceName && callback.seq && _sequenceLevels[callback.seq] != callback.level) {
        continue;
      }
      if (action != callback.action) {
        continue;
      }
      if (action == "keypress" && !e.metaKey && !e.ctrlKey || _modifiersMatch(modifiers, callback.modifiers)) {
        var deleteCombo = !sequenceName && callback.combo == combination;
        var deleteSequence = sequenceName && callback.seq == sequenceName && callback.level == level;
        if (deleteCombo || deleteSequence) {
          self._callbacks[character].splice(i, 1);
        }
        matches.push(callback);
      }
    }
    return matches;
  }
  function _fireCallback(callback, e, combo, sequence) {
    if (self.stopCallback(e, e.target || e.srcElement, combo, sequence)) {
      return;
    }
    if (callback(e, combo) === false) {
      _preventDefault(e);
      _stopPropagation(e);
    }
  }
  self._handleKey = function(character, modifiers, e) {
    var callbacks = _getMatches(character, modifiers, e);
    var i;
    var doNotReset = {};
    var maxLevel = 0;
    var processedSequenceCallback = false;
    for (i = 0; i < callbacks.length; ++i) {
      if (callbacks[i].seq) {
        maxLevel = Math.max(maxLevel, callbacks[i].level);
      }
    }
    for (i = 0; i < callbacks.length; ++i) {
      if (callbacks[i].seq) {
        if (callbacks[i].level != maxLevel) {
          continue;
        }
        processedSequenceCallback = true;
        doNotReset[callbacks[i].seq] = 1;
        _fireCallback(callbacks[i].callback, e, callbacks[i].combo, callbacks[i].seq);
        continue;
      }
      if (!processedSequenceCallback) {
        _fireCallback(callbacks[i].callback, e, callbacks[i].combo);
      }
    }
    var ignoreThisKeypress = e.type == "keypress" && _ignoreNextKeypress;
    if (e.type == _nextExpectedAction && !_isModifier(character) && !ignoreThisKeypress) {
      _resetSequences(doNotReset);
    }
    _ignoreNextKeypress = processedSequenceCallback && e.type == "keydown";
  };
  function _handleKeyEvent(e) {
    if (typeof e.which !== "number") {
      e.which = e.keyCode;
    }
    var character = _characterFromEvent(e);
    if (!character) {
      return;
    }
    if (e.type == "keyup" && _ignoreNextKeyup === character) {
      _ignoreNextKeyup = false;
      return;
    }
    self.handleKey(character, _eventModifiers(e), e);
  }
  function _resetSequenceTimer() {
    clearTimeout(_resetTimer);
    _resetTimer = setTimeout(_resetSequences, 1e3);
  }
  function _bindSequence(combo, keys, callback, action) {
    _sequenceLevels[combo] = 0;
    function _increaseSequence(nextAction) {
      return function() {
        _nextExpectedAction = nextAction;
        ++_sequenceLevels[combo];
        _resetSequenceTimer();
      };
    }
    function _callbackAndReset(e) {
      _fireCallback(callback, e, combo);
      if (action !== "keyup") {
        _ignoreNextKeyup = _characterFromEvent(e);
      }
      setTimeout(_resetSequences, 10);
    }
    for (var i = 0; i < keys.length; ++i) {
      var isFinal = i + 1 === keys.length;
      var wrappedCallback = isFinal ? _callbackAndReset : _increaseSequence(action || _getKeyInfo(keys[i + 1]).action);
      _bindSingle(keys[i], wrappedCallback, action, combo, i);
    }
  }
  function _bindSingle(combination, callback, action, sequenceName, level) {
    self._directMap[combination + ":" + action] = callback;
    combination = combination.replace(/\s+/g, " ");
    var sequence = combination.split(" ");
    var info;
    if (sequence.length > 1) {
      _bindSequence(combination, sequence, callback, action);
      return;
    }
    info = _getKeyInfo(combination, action);
    self._callbacks[info.key] = self._callbacks[info.key] || [];
    _getMatches(info.key, info.modifiers, {type: info.action}, sequenceName, combination, level);
    self._callbacks[info.key][sequenceName ? "unshift" : "push"]({
      callback,
      modifiers: info.modifiers,
      action: info.action,
      seq: sequenceName,
      level,
      combo: combination
    });
  }
  self._bindMultiple = function(combinations, callback, action) {
    for (var i = 0; i < combinations.length; ++i) {
      _bindSingle(combinations[i], callback, action);
    }
  };
  self.enable = function() {
    _addEvent(targetElement, "keypress", _handleKeyEvent);
    _addEvent(targetElement, "keydown", _handleKeyEvent);
    _addEvent(targetElement, "keyup", _handleKeyEvent);
  };
  self.disable = function() {
    _removeEvent(targetElement, "keypress", _handleKeyEvent);
    _removeEvent(targetElement, "keydown", _handleKeyEvent);
    _removeEvent(targetElement, "keyup", _handleKeyEvent);
  };
  self.enable();
}
Mousetrap.prototype.bind = function(keys, callback, action) {
  var self = this;
  keys = keys instanceof Array ? keys : [keys];
  self._bindMultiple.call(self, keys, callback, action);
  return self;
};
Mousetrap.prototype.unbind = function(keys, action) {
  var self = this;
  return self.bind.call(self, keys, function() {
  }, action);
};
Mousetrap.prototype.trigger = function(keys, action) {
  var self = this;
  if (self._directMap[keys + ":" + action]) {
    self._directMap[keys + ":" + action]({}, keys);
  }
  return self;
};
Mousetrap.prototype.reset = function() {
  var self = this;
  self._callbacks = {};
  self._directMap = {};
  return self;
};
Mousetrap.prototype.stopCallback = function(e, element) {
  var self = this;
  if ((" " + element.className + " ").indexOf(" mousetrap ") > -1) {
    return false;
  }
  if (_belongsTo(element, self.target)) {
    return false;
  }
  return element.tagName == "INPUT" || element.tagName == "SELECT" || element.tagName == "TEXTAREA" || element.isContentEditable;
};
Mousetrap.prototype.handleKey = function() {
  var self = this;
  return self._handleKey.apply(self, arguments);
};
Mousetrap.addKeycodes = function(object) {
  for (var key in object) {
    if (object.hasOwnProperty(key)) {
      _MAP[key] = object[key];
    }
  }
  _REVERSE_MAP = null;
};
Mousetrap.init = function() {
  var documentMousetrap = Mousetrap(document);
  for (var method in documentMousetrap) {
    if (method.charAt(0) !== "_") {
      Mousetrap[method] = function(method2) {
        return function() {
          return documentMousetrap[method2].apply(documentMousetrap, arguments);
        };
      }(method);
    }
  }
};

// node_modules/imba/src/imba/events/hotkey.imba
function iter$__5(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
function extend$__5(target, ext) {
  const descriptors = Object.getOwnPropertyDescriptors(ext);
  delete descriptors.constructor;
  Object.defineProperties(target, descriptors);
  return target;
}
var \u03A8__initor__8 = Symbol.for("#__initor__");
var \u03A8__inited__8 = Symbol.for("#__inited__");
var \u03A8updateHotKeys = Symbol.for("#updateHotKeys");
var \u03A8inInput = Symbol.for("#inInput");
var \u03A8inEditable = Symbol.for("#inEditable");
var \u03A8hotkeyTarget = Symbol.for("#hotkeyTarget");
var \u03A8hotkeyCombos = Symbol.for("#hotkeyCombos");
var \u03A8extendType2 = Symbol.for("#extendType");
var \u03A8combos = Symbol.for("#combos");
var \u03A8target2 = Symbol.for("#target");
var \u03A8hotkeyHandlers = Symbol.for("#hotkeyHandlers");
var \u03A8defaultPrevented2 = Symbol.for("#defaultPrevented");
var \u03A8visit = Symbol.for("#visit");
var \u03A8key = Symbol.for("#key");
var isApple;
try {
  isApple = (globalThis.navigator.platform || "").match(/iPhone|iPod|iPad|Mac/);
} catch (e) {
}
function use_events_hotkey() {
  return true;
}
var Globals = {esc: true};
var HotkeyEvent = class extends CustomEvent {
  \u03B1focus(expr) {
    let el = this.target;
    let doc = el.ownerDocument;
    if (expr) {
      el = el.querySelector(expr) || el.closest(expr) || doc.querySelector(expr);
    }
    ;
    if (el == doc.body) {
      if (doc.activeElement != doc.body) {
        doc.activeElement.blur();
      }
      ;
    } else {
      el.focus();
    }
    ;
    return true;
  }
  \u03B1repeat() {
    return true;
  }
};
var stopCallback = function(e, el, combo) {
  if (el.tagName == "INPUT" && (combo == "down" || combo == "up")) {
    return false;
  }
  ;
  if (el.tagName == "INPUT" || el.tagName == "SELECT" || el.tagName == "TEXTAREA") {
    if (Globals[combo]) {
      e[\u03A8inInput] = true;
      e[\u03A8inEditable] = true;
      return false;
    }
    ;
    return true;
  }
  ;
  if (el.contentEditable && (el.contentEditable == "true" || el.contentEditable == "plaintext-only")) {
    if (Globals[combo]) {
      e[\u03A8inEditable] = true;
      return false;
    }
    ;
    return true;
  }
  ;
  return false;
};
var hotkeys = new class HotKeyManager {
  constructor() {
    this.combos = {"*": {}};
    this.identifiers = {};
    this.labels = {};
    this.handler = this.handle.bind(this);
    this.mousetrap = null;
    this.hothandler = this.handle.bind(this);
  }
  trigger(combo) {
    var _a, _b;
    return (_b = (_a = this.mousetrap) == null ? void 0 : _a.trigger) == null ? void 0 : _b.call(_a, combo);
  }
  register(key, mods = {}) {
    if (!this.mousetrap) {
      this.mousetrap = Mousetrap(globalThis.document);
      this.mousetrap.stopCallback = stopCallback;
    }
    ;
    if (!this.combos[key]) {
      this.combos[key] = true;
      this.mousetrap.bind(key, this.handler);
    }
    ;
    if (mods.capture || mods.force) {
      Globals[key] = true;
    }
    ;
    return this;
  }
  comboIdentifier(combo) {
    var \u03C64;
    return (\u03C64 = this.identifiers)[combo] || (\u03C64[combo] = combo.replace(/\+/g, "_").replace(/\ /g, "-").replace(/\*/g, "all").replace(/\|/g, " "));
  }
  humanize(combo, platform = "auto") {
    return humanize(combo, platform);
  }
  htmlify(combo, platform = "auto") {
    return htmlify(combo, platform);
  }
  matchCombo(str) {
    return true;
  }
  handle(e, combo) {
    var _a;
    let source = e.target && e.target[\u03A8hotkeyTarget] || e.target || globalThis.document.body;
    let targets = Array.from(globalThis.document.querySelectorAll("[data-hotkey]"));
    let root = source.ownerDocument;
    let group = source;
    while (group && group != root) {
      if (group.hotkeys === true) {
        break;
      }
      ;
      group = group.parentNode;
    }
    ;
    targets = targets.reverse().filter(function(el) {
      if (!(el[\u03A8hotkeyCombos] && el[\u03A8hotkeyCombos][combo])) {
        return false;
      }
      ;
      let par = el;
      while (par && par != root) {
        if (par.hotkeys === false) {
          return false;
        }
        ;
        par = par.parentNode;
      }
      ;
      return true;
    });
    if (!targets.length) {
      return;
    }
    ;
    let detail = {combo, originalEvent: e, targets};
    let event = new CustomEvent("hotkey", {bubbles: true, detail});
    event[\u03A8extendType2](HotkeyEvent);
    event.originalEvent = e;
    event.hotkey = combo;
    source.dispatchEvent(event);
    let handlers = [];
    for (let i\u03C6 = 0, items\u03C6 = iter$__5(targets), len\u03C62 = items\u03C6.length; i\u03C6 < len\u03C62; i\u03C6++) {
      let receiver = items\u03C6[i\u03C6];
      for (let i\u03C62 = 0, items\u03C62 = iter$__5(receiver[\u03A8hotkeyHandlers]), len\u03C6 = items\u03C62.length; i\u03C62 < len\u03C6; i\u03C62++) {
        let handler = items\u03C62[i\u03C62];
        if (handler[\u03A8combos][combo]) {
          if (!e[\u03A8inEditable] || (handler.capture\u03A6 || handler.params.force)) {
            let el = handler[\u03A8target2];
            if (group.contains(el) || el.contains(group) || handler.global\u03A6) {
              handlers.push(handler);
            }
            ;
          }
          ;
        }
        ;
      }
      ;
    }
    ;
    for (let i = 0, items\u03C63 = iter$__5(handlers), len\u03C63 = items\u03C63.length; i < len\u03C63; i++) {
      let handler = items\u03C63[i];
      if (!e.repeat || handler.params.repeat) {
        handler.handleEvent(event);
      }
      ;
      if (!handler.passive\u03A6 || event[\u03A8defaultPrevented2]) {
        (_a = e == null ? void 0 : e.preventDefault) == null ? void 0 : _a.call(e);
      }
      ;
      if (!handler.passive\u03A6) {
        break;
      }
      ;
    }
    ;
    return this;
  }
}();
var DefaultHandler = function(e, state) {
  let el = state.element;
  if (el instanceof Element) {
    if (el.matches("input,textarea,select,option")) {
      el.focus();
    } else {
      el.click();
    }
    ;
  }
  ;
  return;
};
DefaultHandler.passive = true;
var Extend$Element$af = class {
  on$hotkey(mods, scope, handler, o) {
    var self = this;
    this[\u03A8hotkeyHandlers] || (this[\u03A8hotkeyHandlers] = []);
    this[\u03A8hotkeyHandlers].push(handler);
    handler[\u03A8target2] = this;
    mods.$_ || (mods.$_ = [DefaultHandler]);
    mods[\u03A8visit] = function() {
      return self[\u03A8updateHotKeys]();
    };
    this[\u03A8updateHotKeys]();
    return handler;
  }
  [\u03A8updateHotKeys]() {
    let all = {};
    let isApple2 = (globalThis.navigator.platform || "").match(/iPhone|iPod|iPad|Mac/);
    for (let i\u03C63 = 0, items\u03C64 = iter$__5(this[\u03A8hotkeyHandlers]), len\u03C65 = items\u03C64.length; i\u03C63 < len\u03C65; i\u03C63++) {
      let handler = items\u03C64[i\u03C63];
      let mods = handler.params;
      let key = mods.options[0];
      let prev = handler[\u03A8key];
      if (handler[\u03A8key] != key ? (handler[\u03A8key] = key, true) : false) {
        handler[\u03A8combos] = {};
        let combos = key.replace(/\bmod\b/g, isApple2 ? "command" : "ctrl");
        for (let i\u03C64 = 0, items\u03C65 = iter$__5(combos.split("|")), len\u03C64 = items\u03C65.length; i\u03C64 < len\u03C64; i\u03C64++) {
          let combo = items\u03C65[i\u03C64];
          hotkeys.register(combo, mods);
          handler[\u03A8combos][combo] = true;
        }
        ;
      }
      ;
      Object.assign(all, handler[\u03A8combos]);
    }
    ;
    this[\u03A8hotkeyCombos] = all;
    this.dataset.hotkey = Object.keys(all).join(" ");
    return this;
  }
};
extend$__5(Element.prototype, Extend$Element$af.prototype);

// app/client.imba
var \u03A8beforeReconcile3 = Symbol.for("#beforeReconcile");
var \u03A8placeChild2 = Symbol.for("#placeChild");
var \u03A8afterReconcile3 = Symbol.for("#afterReconcile");
var \u03A8\u03A8up2 = Symbol.for("##up");
var \u03A8afterVisit3 = Symbol.for("#afterVisit");
var \u03B5SELF = Symbol();
var \u03B5T = Symbol();
var an\u03C6 = Symbol();
var \u03B5T2 = Symbol();
var \u03B5i = Symbol();
var \u03B5 = Symbol();
var \u03C4T7;
var \u03F2\u03C4 = getRenderContext();
var \u03B5T3 = Symbol();
var \u03B9T2;
var \u0394T2;
use_events(), use_events_keyboard(), use_events_hotkey();
var p = console.log;
var last_pressed = "None";
var AppComponent = class extends Component {
  handle_keypress(e) {
    p(e);
    if (e.shiftKey) {
      return last_pressed = "Shift + " + e.key;
    } else {
      return last_pressed = e.key;
    }
    ;
  }
  handle_shift_space() {
    return last_pressed = "Mousetrap Shift Space";
  }
  render() {
    var self = this, \u03C4SELF, \u03B9SELF, \u0394SELF, \u03C64 = this._ns_ || "", \u03C4T, \u03C4T2, \u03C4T3, \u03C4T4, \u03C4T5, \u03B9T, \u0394T, \u03B8T, \u03C4T6, \u03C5T;
    \u03C4SELF = this;
    \u03C4SELF[\u03A8beforeReconcile3]();
    (\u03B9SELF = \u0394SELF = 1, \u03C4SELF[\u03B5SELF] === 1) || (\u03B9SELF = \u0394SELF = 0, \u03C4SELF[\u03B5SELF] = 1);
    (!\u03B9SELF || \u0394SELF & 2) && \u03C4SELF.flagSelf$("cf-af");
    \u03B9SELF || (\u03C4T = createElement("div", \u03C4SELF, `left cf_af ${\u03C64}`, null)), \u03B9SELF || (\u03C4T2 = createElement("p", \u03C4T, `cf_af ${\u03C64}`, "Keypress")), \u03B9SELF || (\u03C4T3 = createElement("input", \u03C4T, `cf_af ${\u03C64}`, null)), \u03B9SELF || \u03C4T3.on$(`keypress`, {$_: [function(e, $$) {
      return self.handle_keypress(e);
    }]}, this), \u03B9SELF || (\u03C4T4 = createElement("p", \u03C4T, `cf_af ${\u03C64}`, "Mousetrap")), (() => {
      (\u03B9T = \u0394T = 1, \u03C4T5 = \u03C4SELF[\u03B5T]) || (\u03B9T = \u0394T = 0, \u03C4SELF[\u03B5T] = \u03C4T5 = createElement("input", \u03C4T, `cf_af ${\u03C64}`, null));
      \u03B8T = \u03C4SELF[an\u03C6] || (\u03C4SELF[an\u03C6] = {options: ["shift+space"], capture: true, $_: [function(e, $$, _2) {
        return _2.handle_shift_space(e);
      }, null]});
      \u03B8T.$_[1] = self;
      \u03B9T || \u03C4T5.on$(`hotkey`, \u03B8T, this);
      ;
    })();
    (\u03C4T6 = \u03C4SELF[\u03B5T2]) || (\u03C4SELF[\u03B5T2] = \u03C4T6 = createElement("div", \u03C4SELF, `right cf_af ${\u03C64}`, null));
    \u03C5T = last_pressed, \u03C5T === \u03C4SELF[\u03B5] && \u03B9SELF || (\u03C4SELF[\u03B5i] = \u03C4T6[\u03A8placeChild2](\u03C4SELF[\u03B5] = \u03C5T, 384, \u03C4SELF[\u03B5i]));
    ;
    \u03C4SELF[\u03A8afterReconcile3](\u0394SELF);
    return \u03C4SELF;
  }
};
defineTag("app", AppComponent, {});
mount(((\u03B9T2 = \u0394T2 = 1, \u03C4T7 = \u03F2\u03C4[\u03B5T3]) || (\u03B9T2 = \u0394T2 = 0, \u03C4T7 = \u03F2\u03C4[\u03B5T3] = \u03C4T7 = createComponent("app", null, null, null)), \u03B9T2 || (\u03C4T7[\u03A8\u03A8up2] = \u03F2\u03C4._), \u03B9T2 || \u03F2\u03C4.sym || !\u03C4T7.setup || \u03C4T7.setup(\u0394T2), \u03F2\u03C4.sym || \u03C4T7[\u03A8afterVisit3](\u0394T2), \u03C4T7));
//__FOOT__
