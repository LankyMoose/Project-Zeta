var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// node_modules/.pnpm/cinnabun@0.1.50/node_modules/cinnabun/src/signal.ts
var LOG_NUM_SUBS = false;
var Signal = class {
  _val;
  _subscribers = /* @__PURE__ */ new Set();
  _name;
  constructor(value, name) {
    this._val = value;
    this._name = name;
  }
  get value() {
    return this._val;
  }
  set value(newVal) {
    this._val = newVal;
    this.notify();
  }
  notify() {
    for (const subscribeFunc of this._subscribers) {
      subscribeFunc(this._val);
    }
  }
  subscribe(func) {
    this._subscribers.add(func);
    this.logSubscriberCount();
    func(this._val);
    return () => this.unsubscribe(func);
  }
  unsubscribe(func) {
    this._subscribers.delete(func);
    this.logSubscriberCount();
  }
  serialize() {
    return JSON.stringify(this.value);
  }
  logSubscriberCount() {
    if (LOG_NUM_SUBS)
      console.debug(this._name + " subscribers:", this._subscribers.size);
  }
};
function computed(signal, func) {
  const _signal = new Signal(null);
  _signal.value = func();
  signal.subscribe(() => {
    _signal.value = func();
  });
  return _signal;
}
function createSignal(initialValue) {
  return new Signal(initialValue);
}

// node_modules/.pnpm/cinnabun@0.1.50/node_modules/cinnabun/src/utils.ts
var jsPropToHtmlProp = (prop) => {
  switch (prop) {
    case "className":
      return "class";
    default:
      return prop;
  }
};
var validHtmlProps = (props) => {
  const validProps = {};
  Object.keys(props).forEach((k) => {
    if (k.includes(":"))
      return;
    if (k === "innerText")
      return;
    if (k === "children")
      return;
    if (k === "promise")
      return;
    if (k === "className") {
      validProps.class = props[k];
      return;
    }
    if (props[k] instanceof Signal) {
      validProps[k] = props[k].value;
      return;
    }
    validProps[k] = props[k];
  });
  return validProps;
};
var generateUUID = () => {
  var d = (/* @__PURE__ */ new Date()).getTime();
  var d2 = typeof performance !== "undefined" && performance.now && performance.now() * 1e3 || 0;
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = Math.random() * 16;
    if (d > 0) {
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : r & 3 | 8).toString(16);
  });
};

// node_modules/.pnpm/cinnabun@0.1.50/node_modules/cinnabun/src/domInterop.ts
var DomInterop = class {
  static updateElement(component) {
    if (!component.element)
      return;
    const {
      htmlFor,
      children,
      onMounted,
      subscription,
      visible,
      style,
      promise,
      ...rest
    } = component.props;
    const isSVG = component.isSVG();
    if (style) {
      if (typeof style === "object") {
        Object.assign(component.element.style, style);
      } else {
        component.element.setAttribute("style", style);
      }
    }
    if (htmlFor && "htmlFor" in component.element) {
      component.element.htmlFor = htmlFor;
    }
    if (Object.keys(rest).length) {
      for (const [k, v] of Object.entries(rest)) {
        if (k.includes(":"))
          continue;
        if (k === "hydrating")
          continue;
        if (k.startsWith("on")) {
          Object.assign(component.element, { [k]: v });
          continue;
        }
        if (isSVG) {
          component.element.setAttribute(
            jsPropToHtmlProp(k),
            component.getPrimitive(v, () => DomInterop.updateElement(component))
          );
        } else {
          Object.assign(component.element, {
            [k]: component.getPrimitive(
              v,
              () => DomInterop.updateElement(component)
            )
          });
        }
      }
    }
  }
  static getRenderedChildren(component) {
    return component.children.map(
      (c, i) => DomInterop.renderChild(component, c, i)
    );
  }
  static renderChildren(component) {
    if (!component.props.visible)
      return;
    if (!component.element)
      return;
    DomInterop.removeFuncComponents(component);
    component.element.replaceChildren(
      ...DomInterop.getRenderedChildren(component)
    );
  }
  static renderChild(component, child, idx) {
    if (child instanceof Signal) {
      component.subscribeTo(
        (_, __) => child.subscribe(() => {
          const { element } = component.element ? { element: component.element } : DomInterop.getMountLocation(component);
          if (!element) {
            console.error(
              "Failed to get component mount element",
              component,
              child
            );
            return;
          }
          const c = element.childNodes[idx];
          if (c)
            c.nodeValue = child.value.toString();
        })
      );
      return child.value.toString();
    }
    if (child instanceof Component) {
      if (!child.props.visible || child.isStatic)
        return "";
      child.parent = component;
      return DomInterop.render(child);
    }
    if (typeof child === "function") {
      let c = child(...component.childArgs);
      if (Array.isArray(c))
        c = new FragmentComponent(c);
      const res = DomInterop.renderChild(component, c, idx);
      if (c instanceof Component) {
        if (!c.props.visible || c.isStatic)
          return "";
        c.parent = component;
        component.funcComponents.push(c);
      }
      return res;
    }
    return child?.toString() ?? "";
  }
  static removeFuncComponents(component) {
    if (component.funcComponents.length > 0) {
      for (const fc of component.funcComponents) {
        DomInterop.unRender(fc);
        Cinnabun.removeComponentReferences(fc);
      }
      component.funcComponents = [];
    }
  }
  static unRender(component, forceSync = false) {
    try {
      if (!forceSync && component.props.onBeforeUnmounted) {
        const res = component.props.onBeforeUnmounted(component);
        if (res instanceof Promise) {
          res.then((res2) => {
            if (res2 && component.mounted)
              DomInterop.unRender(component, true);
          });
          return;
        } else if (res === false) {
          return;
        }
      }
      DomInterop.removeFuncComponents(component);
      if (component.element) {
        component.unMount();
        return component.element.remove();
      }
      for (const c of component.children) {
        if (c instanceof Component) {
          DomInterop.unRender(c);
        } else if (c instanceof Node) {
          c.parentNode?.removeChild(c);
        }
      }
    } catch (error) {
      console.error("failed to unrender", component, error);
      debugger;
    }
  }
  static reRender(component) {
    if (!component.shouldRender())
      return;
    const el = component.element ?? DomInterop.render(component, true);
    if (component.element)
      DomInterop.renderChildren(component);
    if (el.isConnected)
      return;
    const { element, idx } = DomInterop.getMountLocation(component);
    if (!element) {
      debugger;
      console.error("Failed to get component mount element", component, el);
      return;
    }
    const prevChild = element.childNodes[idx - 1];
    if (prevChild) {
      element.insertBefore(el, prevChild);
    } else {
      element.appendChild(el);
    }
    component.mounted = true;
  }
  static render(component, isRerender = false) {
    const { children, subscription, promise } = component.props;
    Cinnabun.removeComponentReferences(component);
    if (!component.tag) {
      const f = document.createDocumentFragment();
      if (subscription)
        component.subscribeTo(subscription);
      f.append(...DomInterop.getRenderedChildren(component));
      component.mounted = true;
      if (!isRerender && "setPromise" in component && typeof component.setPromise === "function") {
        component.setPromise(promise);
      }
      return f;
    }
    if (component.tag.toLowerCase() === "svg")
      return DomInterop.svg(component);
    if (!component.element) {
      component.element = document.createElement(component.tag);
    }
    if (children)
      component.replaceChildren(children);
    DomInterop.renderChildren(component);
    DomInterop.updateElement(component);
    if (subscription)
      component.subscribeTo(subscription);
    component.mounted = true;
    return component.element;
  }
  static diffCheckChildren(children, newChildren) {
    const childKeys = children.map((c) => c.props.key);
    const newChildKeys = newChildren.map((c) => c.props.key);
    const addedKeys = newChildren.filter((c) => !childKeys.includes(c.props.key)).map((c) => c.props.key);
    const removedKeys = children.filter((c) => !newChildKeys.includes(c.props.key)).map((c) => c.props.key);
    const changedKeys = newChildren.filter(
      (c) => !addedKeys.includes(c.props.key) && !removedKeys.includes(c.props.key)
    ).filter((nc) => {
      const oldChild = children.find((oc) => oc.props.key === nc.props.key);
      return JSON.stringify(oldChild.props) !== JSON.stringify(nc.props);
    }).map((c) => c.props.key);
    const unchangedKeys = children.filter(
      (c) => !addedKeys.includes(c.props.key) && !removedKeys.includes(c.props.key) && !changedKeys.includes(c.props.key)
    ).map((c) => c.props.key);
    return [
      ...addedKeys.map((k) => {
        return {
          result: 2 /* ADDED */,
          key: k,
          node: newChildren.find((c) => c.props.key === k).element
        };
      }),
      ...removedKeys.map((k) => {
        return {
          result: 3 /* REMOVED */,
          key: k,
          node: children.find((c) => c.props.key === k).element
        };
      }),
      ...changedKeys.map((k) => {
        return {
          result: 1 /* CHANGED */,
          key: k,
          node: children.find((c) => c.props.key === k).element
        };
      }),
      ...unchangedKeys.map((k) => {
        return {
          result: 0 /* NONE */,
          key: k,
          node: children.find((c) => c.props.key === k).element
        };
      })
    ];
  }
  static diffMergeChildren(parent, newChildren) {
    const oldChildren = parent.children;
    try {
      const diffs = DomInterop.diffCheckChildren(oldChildren, newChildren);
      for (let i = 0; i < diffs.length; i++) {
        const diff = diffs[i];
        switch (diff.result) {
          case 2 /* ADDED */: {
            const newC = newChildren.find((c) => c.props.key === diff.key);
            parent.insertChildren(newChildren.indexOf(newC), newC);
            break;
          }
          case 3 /* REMOVED */: {
            const oldC = parent.children.find(
              (c) => c?.props.key === diff.key
            );
            parent.removeChildren(oldC);
            break;
          }
          case 1 /* CHANGED */: {
            const oldC = parent.children.find(
              (c) => c?.props.key === diff.key
            );
            const newC = newChildren.find((c) => c.props.key === diff.key);
            Cinnabun.removeComponentReferences(newC);
            Object.assign(oldC.props, newC.props);
            DomInterop.updateElement(oldC);
            break;
          }
          case 0 /* NONE */:
          default:
            {
              const oldC = parent.children.find(
                (c) => c instanceof Component && c.props.key === diff.key
              );
              const newC = newChildren.find(
                (c) => c instanceof Component && c.props.key === diff.key
              );
              if (newC)
                Cinnabun.removeComponentReferences(newC);
              if (oldC && newC) {
                DomInterop.diffMergeChildren(
                  oldC,
                  newC.children.filter(
                    (c) => c instanceof Component
                  )
                );
              }
            }
            break;
        }
      }
    } catch (error) {
      console.error("failed to diff merge children", parent, newChildren, error);
    }
    parent.children = parent.children.filter((c) => c !== null);
  }
  static svg(component) {
    const el = document.createElementNS(
      "http://www.w3.org/2000/svg",
      component.tag
    );
    const { visible, ...props } = component.props;
    const validProps = Object.entries(validHtmlProps(props));
    for (const [k, v] of validProps) {
      if (k.includes("bind:"))
        continue;
      const _k2 = k === "className" ? "class" : k;
      el.setAttribute(_k2, v.toString());
    }
    for (const c of component.children) {
      if (typeof c === "string" || typeof c === "number") {
        el.append(c.toString());
      } else {
        if (typeof c === "function") {
          const val = c();
          if (typeof val === "string" || typeof val === "number") {
            el.append(val.toString());
          } else {
            el.append(DomInterop.svg(val));
          }
        } else {
          if (c)
            el.append(DomInterop.svg(c));
        }
      }
    }
    return el;
  }
  static getMountLocation(component, start = 0) {
    if (!component.parent)
      return { element: null, idx: -1 };
    for (let i = 0; i < component.parent.children.length; i++) {
      const c = component.parent.children[i];
      if (c === component)
        break;
      start += DomInterop.getRenderedNodeCount(c);
    }
    if (component.parent.element)
      return { element: component.parent.element, idx: start + 1 };
    return DomInterop.getMountLocation(component.parent, start);
  }
  static getRenderedNodeCount(child) {
    let count = 0;
    if (child instanceof Component) {
      if (!child.props.visible)
        return 0;
      if (child.tag)
        return 1;
      for (const c of child.children) {
        count += DomInterop.getRenderedNodeCount(c);
      }
      for (const c of child.funcComponents) {
        count += DomInterop.getRenderedNodeCount(c);
      }
    } else if (child instanceof Signal) {
      count++;
    } else if (typeof child === "string" || typeof child === "number") {
      count++;
    }
    return count;
  }
};

// node_modules/.pnpm/cinnabun@0.1.50/node_modules/cinnabun/src/component.ts
var Component = class {
  constructor(tag, props = {}) {
    this.tag = tag;
    if (!("visible" in props))
      props.visible = true;
    this.props = props;
  }
  parent = null;
  children = [];
  funcComponents = [];
  element;
  cbInstance;
  isStatic = false;
  _mounted = false;
  get mounted() {
    return this._mounted;
  }
  set mounted(val) {
    const changed = this._mounted !== val;
    this._mounted = val;
    if (changed && val && this._props.onMounted) {
      setTimeout(() => {
        this._props.onMounted(this);
      }, 0);
    } else if (changed && !val && this._props.onUnmounted) {
      this._props.onUnmounted(this);
    }
    if (changed && this._props.ref) {
      this._props.ref.value = this.mounted && this.element ? this.element : null;
    }
  }
  subscription;
  _props = {};
  get props() {
    return this._props;
  }
  set props(props) {
    const { children, watch, ...rest } = props;
    Object.assign(this._props, rest);
    if (children)
      this.replaceChildren(children);
    if (Cinnabun.isClient && watch) {
      this._props.watch = watch;
      const signals = "length" in watch ? watch : [watch];
      for (const s of signals) {
        const unsub = s.subscribe(this.applyBindProps.bind(this));
        Cinnabun.addComponentReference({
          component: this,
          onDestroyed: () => unsub()
        });
      }
    }
  }
  get childArgs() {
    return [];
  }
  applyBindProps() {
    const bindFns = Object.entries(this.props).filter(
      ([k]) => k.startsWith("bind:")
    );
    for (const [k, v] of bindFns) {
      const propName = k.substring(k.indexOf(":") + 1);
      const val = this.getPrimitive(v, () => DomInterop.reRender(this));
      const oldVal = this._props[propName];
      this._props[propName] = propName === "children" && val === true ? oldVal : val;
      if (propName === "visible" && Cinnabun.isClient) {
        if (val !== oldVal) {
          if (val && this.parent?._props.visible) {
            DomInterop.reRender(this);
          } else {
            if (this.mounted)
              DomInterop.unRender(this);
          }
        }
      } else if (propName === "children") {
        if (this._props.children)
          this.replaceChildren(this._props.children);
        if (Cinnabun.isClient)
          DomInterop.renderChildren(this);
      } else if (this.element) {
        Object.assign(this.element, { [propName]: this._props[propName] });
      }
    }
  }
  getPrimitive(prop, signalCallback) {
    if (prop instanceof Signal) {
      if (signalCallback)
        this.subscribeTo((_, __) => prop.subscribe(signalCallback.bind(this)));
      return prop.value;
    }
    if (typeof prop === "function")
      return this.getPrimitive(prop(this), signalCallback);
    return prop;
  }
  subscribeTo(subscription) {
    if (this.subscription)
      return;
    this.subscription = subscription;
    const setProps = (props) => {
      this.props = Object.assign(this.props, props);
    };
    const unsubscriber = this.subscription(setProps, this);
    Cinnabun.addComponentReference({
      component: this,
      onDestroyed: () => unsubscriber()
    });
  }
  removeChildren(...children) {
    for (const child of children) {
      const idx = this.children.indexOf(child);
      if (child instanceof Component) {
        this.destroyComponentRefs(child);
        child.parent = null;
        DomInterop.unRender(child);
      }
      this.children[idx] = null;
    }
  }
  insertChildren(index, ...children) {
    this.children.splice(index, 0, ...children);
    for (const child of children) {
      if (child instanceof Component) {
        child.parent = this;
        DomInterop.reRender(child);
      }
    }
  }
  appendChildren(...children) {
    this.children.push(...children);
    for (const child of children) {
      if (child instanceof Component) {
        child.parent = this;
        DomInterop.reRender(child);
      }
    }
  }
  prependChildren(...children) {
    this.children.unshift(...children);
    for (const child of children) {
      if (child instanceof Component) {
        child.parent = this;
        DomInterop.reRender(child);
      }
    }
  }
  replaceChild(child, newChild) {
    DomInterop.unRender(child);
    this.destroyComponentRefs(child);
    const idx = this.children.indexOf(child);
    this.children[idx] = newChild;
    newChild.parent = this;
    DomInterop.reRender(newChild);
  }
  replaceChildren(newChildren) {
    this.destroyChildComponentRefs(this);
    this.children = newChildren.map(
      (c) => Array.isArray(c) ? new FragmentComponent(c) : c
    );
    this.linkChildren();
  }
  linkChildren() {
    for (let i = 0; i < this.children.length; i++) {
      const c = this.children[i];
      if (c instanceof Component) {
        c.parent = this;
        c.cbInstance = this.cbInstance;
        c.linkChildren();
      }
    }
  }
  destroyChildComponentRefs(el) {
    for (const c of el.children) {
      if (typeof c === "string" || typeof c === "number")
        continue;
      if (typeof c === "function")
        continue;
      if (!c)
        continue;
      this.destroyComponentRefs(c);
    }
  }
  shouldRender() {
    if (!this._props.visible)
      return false;
    if (this.parent)
      return this.parent.shouldRender();
    return true;
  }
  destroyComponentRefs(el) {
    this.destroyChildComponentRefs(el);
    const subs = Cinnabun.getComponentReferences(el).filter(
      (s) => s.component === el
    );
    while (subs.length) {
      subs.pop().onDestroyed();
    }
    Cinnabun.removeComponentReferences(el);
  }
  onDestroy() {
    if (this.props.onDestroyed)
      this.props.onDestroyed(this);
  }
  getParentOfType(classRef) {
    if (!this.parent)
      return void 0;
    if (this.parent instanceof classRef)
      return this.parent;
    return this.parent.getParentOfType(classRef);
  }
  unMount() {
    for (const c of this.children) {
      if (c instanceof Component)
        c.unMount();
    }
    this.mounted = false;
  }
  recursiveCall(func) {
    func(this);
    for (const c of this.children) {
      if (c instanceof Component)
        c.recursiveCall(func);
    }
  }
  isSVG() {
    try {
      return this.tag.toLowerCase() === "svg" || !!this.element?.closest("svg");
    } catch (error) {
      console.error("isSVG ERROR", this.element);
      return false;
    }
  }
  useRequestData(requestDataPath, fallback) {
    return Cinnabun.isClient ? fallback : this.cbInstance?.getServerRequestData(requestDataPath);
  }
};
var FragmentComponent = class extends Component {
  constructor(children = []) {
    super("", { children });
  }
};
var ForComponent = class extends Component {
  constructor(items, mapPredicate) {
    const reactiveItems = items instanceof Signal ? items : new Signal(items);
    super("", {
      subscription: (_, self) => reactiveItems.subscribe((newItems) => {
        const newChildren = newItems.map(mapPredicate);
        let uniqueKeys = true;
        for (const child of newChildren) {
          if (newChildren.filter((c) => c.props.key === child.props.key).length > 1) {
            uniqueKeys = false;
            console.error("non-unique key found in <For/>", child.props.key);
            console.error(
              "Children of <For/> must have unique keys, and they should not be index-based - expect bugs!"
            );
            break;
          }
        }
        if (!Cinnabun.isClient)
          return self.replaceChildren(newChildren);
        if (uniqueKeys && !self.props.hydrating)
          return DomInterop.diffMergeChildren(self, newChildren);
        DomInterop.unRender(self);
        self.replaceChildren(newChildren);
        DomInterop.reRender(self);
      })
    });
  }
};
function For({ each, template }, templateChild) {
  return new ForComponent(each, template ?? templateChild[0]);
}
var SuspenseComponent = class extends Component {
  constructor(tag, props) {
    super(tag, props);
    this.tag = tag;
  }
  promiseFunc;
  promiseInstance;
  promiseCache;
  promiseLoading = true;
  get childArgs() {
    return [this.promiseLoading, this.promiseCache];
  }
  resetPromise() {
    this.promiseLoading = true;
    this.promiseFunc = void 0;
    this.promiseCache = void 0;
  }
  handlePromise(onfulfilled, onrejected) {
    this.promiseLoading = false;
    if (onrejected) {
      console.error("handlePromise() - unhandle case 'onrejected'");
      debugger;
      return;
    }
    this.promiseCache = onfulfilled;
    if (Cinnabun.isClient) {
      DomInterop.unRender(this);
      DomInterop.reRender(this);
    }
  }
  setPromise(promise) {
    if (!this.promiseFunc && promise) {
      this.promiseLoading = true;
      this.promiseFunc = promise;
      this.promiseInstance = this.promiseFunc();
      this.promiseInstance.then(this.handlePromise.bind(this));
    } else if (this.promiseFunc && !this.props.cache) {
      this.promiseLoading = true;
      this.promiseInstance = this.promiseFunc();
      this.promiseInstance.then(this.handlePromise.bind(this));
    }
  }
};
var Suspense = ({ promise, cache, ...rest }, children) => {
  return new SuspenseComponent("", { promise, cache, children, ...rest });
};

// node_modules/.pnpm/cinnabun@0.1.50/node_modules/cinnabun/src/portal.ts
var portalRoots = {};
var createPortal = (children, rootId) => {
  if (!Cinnabun.isClient)
    return new FragmentComponent();
  if (portalRoots[rootId]) {
    for (const c of children) {
      if (!c)
        continue;
      portalRoots[rootId].appendChildren(c);
    }
    return portalRoots[rootId];
  }
  const element = document.getElementById(rootId);
  if (!element)
    throw new Error(`Element with id ${rootId} not found`);
  const res = Object.assign(new Component(element.tagName, { children }), {
    element,
    isStatic: true
  });
  portalRoots[rootId] = res;
  return res;
};

// node_modules/.pnpm/cinnabun@0.1.50/node_modules/cinnabun/src/index.ts
var h = (tag, props, ...children) => {
  if (typeof tag === "function") {
    return tag({ ...props, children }, children);
  }
  let p = props ? props : {};
  p.children = children;
  return new Component(tag, p);
};
function fragment(_, children) {
  return new FragmentComponent(children);
}

// node_modules/.pnpm/cinnabun@0.1.50/node_modules/cinnabun/src/cinnabun.ts
var _Cinnabun = class {
  //ssr instance
  serverComponentReferences = [];
  serverRequest = {
    path: "/",
    data: {}
  };
  setServerRequestData(data) {
    this.serverRequest = data;
  }
  getServerRequestData(keysPath) {
    const props = keysPath.split(".");
    let value = { ...this.serverRequest };
    for (let i = 0; i < props.length; i++) {
      value = value[props[i]];
      if (value === void 0) {
        return void 0;
      }
    }
    return value;
  }
  static bake(app, root) {
    const tray = new Component(root.tagName, {
      children: [app]
    });
    tray.element = root;
    DomInterop.render(tray);
  }
  static getComponentReferences(component) {
    return _Cinnabun.isClient ? _Cinnabun.componentReferences : component.cbInstance.serverComponentReferences;
  }
  static removeComponentReferences(component) {
    _Cinnabun.removeComponentChildReferences(component);
    if (_Cinnabun.isClient) {
      _Cinnabun.componentReferences = _Cinnabun.componentReferences.filter(
        (c) => c.component !== component
      );
    } else {
      component.cbInstance.serverComponentReferences = component.cbInstance.serverComponentReferences.filter(
        (c) => c.component !== component
      );
    }
    if (_Cinnabun.DEBUG_COMPONENT_REFCOUNT)
      _Cinnabun.logComponentRefCount(component);
  }
  static removeComponentChildReferences(component) {
    for (const c of component.children) {
      if (c instanceof Component)
        _Cinnabun.removeComponentReferences(c);
    }
  }
  static logComponentRefCount(component) {
    console.debug(
      "~~ CB REF COUNT",
      _Cinnabun.isClient ? _Cinnabun.componentReferences.length : component.cbInstance.serverComponentReferences.length,
      performance.now()
    );
  }
  static registerRuntimeServices(...services) {
    _Cinnabun.runtimeServices.push(...services);
  }
  static getRuntimeService(classRef) {
    return _Cinnabun.runtimeServices.find((s) => {
      return s instanceof classRef;
    });
  }
};
var Cinnabun = _Cinnabun;
__publicField(Cinnabun, "DEBUG_COMPONENT_REFCOUNT", false);
__publicField(Cinnabun, "isClient", "window" in globalThis);
//client singleton
__publicField(Cinnabun, "rootMap", /* @__PURE__ */ new Map());
__publicField(Cinnabun, "componentReferences", []);
__publicField(Cinnabun, "runtimeServices", []);
__publicField(Cinnabun, "addComponentReference", (ref) => {
  if (_Cinnabun.isClient) {
    _Cinnabun.componentReferences.push(ref);
  } else {
    ref.component.cbInstance.serverComponentReferences.push(ref);
  }
  if (_Cinnabun.DEBUG_COMPONENT_REFCOUNT)
    _Cinnabun.logComponentRefCount(ref.component);
});

// node_modules/.pnpm/cinnabun@0.1.50/node_modules/cinnabun/src/ssr.ts
var _SSR = class {
  static async serverBake(app, config) {
    let startTime = 0;
    if (true)
      startTime = performance.now();
    const accumulator = {
      promiseQueue: [],
      html: ""
    };
    const serialized = await _SSR.serialize(accumulator, app, config);
    if (true) {
      const renderTime = Number(performance.now() - startTime).toFixed(3);
      console.log(
        `${config.cinnabunInstance.getServerRequestData("path")} | render time: ${renderTime}ms`
      );
    }
    _SSR.render(
      `<script id="server-props">window.__cbData={root:document.documentElement,component:${JSON.stringify(
        { children: [serialized], props: {} }
      )}}<\/script><script src="/static/index.js" type="module"><\/script>`,
      config,
      accumulator
    );
    if (accumulator.promiseQueue.length) {
      await Promise.allSettled(
        accumulator.promiseQueue.map(async (item) => {
          const data = await item.promise;
          return item.callback(data);
        })
      );
    }
    return {
      componentTree: { children: [serialized], props: {} },
      html: accumulator.html
    };
  }
  static serializePropName(val) {
    switch (val) {
      case "className":
        return "class";
      default:
        return val;
    }
  }
  static serializeProps(component) {
    return validHtmlProps(component.props);
  }
  static async serialize(accumulator, component, config) {
    component.cbInstance = config.cinnabunInstance;
    component.applyBindProps();
    const res = {
      props: _SSR.serializeProps(component),
      children: []
    };
    const {
      children,
      onMounted,
      onBeforeUnmounted,
      onBeforeServerRendered,
      subscription,
      promise,
      prefetch,
      visible,
      watch,
      ...rest
    } = component.props;
    const shouldRender = component.shouldRender();
    if (shouldRender && subscription)
      component.subscribeTo(subscription);
    if (shouldRender && onBeforeServerRendered) {
      await onBeforeServerRendered(component);
    }
    if (!shouldRender || !component.tag) {
      if (shouldRender) {
        const children2 = await _SSR.serializeChildren(
          accumulator,
          component,
          shouldRender,
          config
        );
        return {
          props: _SSR.serializeProps(component),
          children: children2
        };
      }
      return res;
    }
    res.tag = component.tag;
    const renderClosingTag = ["br", "hr", "img", "input", "link", "meta"].indexOf(
      component.tag.toLowerCase()
    ) === -1;
    const html = `<${component.tag}${Object.entries(rest ?? {}).filter(([k, v]) => {
      if (k === "style" && typeof v !== "string")
        return false;
      return !k.startsWith("bind:") && !k.startsWith("on");
    }).map(
      ([k, v]) => ` ${_SSR.serializePropName(k)}="${component.getPrimitive(v)}"`
    ).join("")}${renderClosingTag ? "" : "/"}>`;
    _SSR.render(html, config, accumulator);
    res.children = await _SSR.serializeChildren(
      accumulator,
      component,
      shouldRender,
      config
    );
    if (renderClosingTag) {
      _SSR.render(`</${component.tag}>`, config, accumulator);
    }
    return res;
  }
  static render(content, config, accumulator) {
    if (!config.stream) {
      accumulator.html += content;
      return;
    }
    config.stream.write(content);
  }
  static async serializeChildren(accumulator, component, shouldRender, config) {
    const res = [];
    if (shouldRender) {
      const promise = component.props.promise;
      if (component.props.prefetch && "promiseCache" in component) {
        component.promiseCache = await promise();
        component.props.promiseCache = component.promiseCache;
        if ("promiseLoading" in component)
          component.promiseLoading = false;
      } else if (component.props["prefetch:defer"] && "promiseCache" in component) {
        if (!component.promiseCache) {
          component.props["cb-deferralId"] = generateUUID();
          _SSR.render(
            `<!--${_SSR.deferredLoaderPrefix}:${component.props["cb-deferralId"]}-->`,
            config,
            accumulator
          );
          accumulator.promiseQueue.push({
            promise: promise(),
            callback: async (data) => {
              component.promiseCache = data;
              const deferralId = component.props["cb-deferralId"];
              _SSR.render(
                `<script type="module" id="${_SSR.deferralScriptIdPrefix}${deferralId}">document.dispatchEvent(new CustomEvent("${_SSR.deferralEvtName}",{
            bubbles:true,
            detail: {
              deferralId: "${deferralId}",
              data: ${JSON.stringify(data)}
            }
          }))
          <\/script>`,
                config,
                accumulator
              );
            }
          });
        }
      }
    }
    for await (const c of component.children) {
      if (typeof c === "string" || typeof c === "number") {
        if (shouldRender)
          _SSR.render(c.toString(), config, accumulator);
        res.push(c.toString());
        continue;
      }
      if (c instanceof Signal) {
        if (shouldRender)
          _SSR.render(c.value.toString(), config, accumulator);
        res.push(c.value.toString());
        continue;
      }
      if (typeof c === "object" && !(c instanceof Component)) {
        const stringified = JSON.stringify(c);
        if (shouldRender)
          _SSR.render(stringified, config, accumulator);
        res.push(stringified);
        continue;
      }
      if (typeof c === "function") {
        try {
          let val = c(...component.childArgs);
          if (Array.isArray(val))
            val = new FragmentComponent(val);
          if (val instanceof Component) {
            val.parent = component;
            const sc2 = await _SSR.serialize(accumulator, val, config);
            res.push(sc2);
            continue;
          } else if (typeof val === "string" || typeof val === "number") {
            if (shouldRender)
              _SSR.render(val.toString(), config, accumulator);
            res.push(val.toString());
            continue;
          }
        } catch (error) {
          console.error(error);
        }
        continue;
      }
      const sc = await _SSR.serialize(accumulator, c, config);
      res.push(sc);
    }
    return res;
  }
};
var SSR = _SSR;
__publicField(SSR, "deferredLoaderPrefix", "cb-deferred-loader");
__publicField(SSR, "deferralEvtName", "deferral-complete");
__publicField(SSR, "deferralScriptIdPrefix", "deferral-");

// node_modules/.pnpm/cinnabun@0.1.50/node_modules/cinnabun/src/hydration.ts
var Hydration = class {
  static validate(component) {
    if (component.tag && component.shouldRender()) {
      const hasElement = component.element;
      const elementMatchesTag = hasElement && component.element?.tagName.toLowerCase() === component.tag.toLowerCase();
      if (!elementMatchesTag)
        console.error("component hydration failed", component);
    }
    for (const c of component.children) {
      if (c instanceof Component)
        Hydration.validate(c);
    }
  }
  static hydrate(app, ssrProps) {
    console.log("hydrating", ssrProps);
    console.time("hydration time");
    const tray = new Component(ssrProps.root.tagName);
    tray.element = ssrProps.root;
    tray.children = [app];
    Hydration.hydrateComponent(
      tray,
      app,
      ssrProps.component.children[0],
      ssrProps.root
    );
    console.timeEnd("hydration time");
    console.log("hydrated", tray);
    Hydration.validate(tray);
  }
  static async lazyHydrate(suspenseWrapper, modulePromise, props) {
    const module = await modulePromise;
    const component = module.default(props);
    component.parent = suspenseWrapper;
    const { element } = DomInterop.getMountLocation(component);
    if (!element)
      return;
    suspenseWrapper.funcComponents.push(component);
    Hydration.hydrateComponent(
      suspenseWrapper,
      component,
      {},
      element
    );
    DomInterop.reRender(component);
  }
  static hydrateComponent(parent, c, sc, parentElement) {
    if (!c)
      return;
    if (typeof c === "string" || typeof c === "number" || c instanceof Signal) {
      Hydration.updateParentOffset(parentElement, 1);
      return;
    }
    if (typeof c === "function") {
      const usePromiseCache = "promiseCache" in parent.props && (parent.props.prefetch || parent.props["prefetch:defer"]);
      let val = usePromiseCache ? c(...[false, parent.props.promiseCache]) : c(...parent.childArgs);
      if (Array.isArray(val))
        val = new FragmentComponent(val);
      if (val instanceof Component) {
        if (!val.shouldRender())
          return;
        DomInterop.removeFuncComponents(parent);
        Hydration.hydrateComponent(parent, val, sc, parentElement);
        parent.funcComponents.push(val);
      }
      return;
    }
    c.props.hydrating = true;
    c.parent = parent;
    if (sc?.props && Object.keys(sc.props).length) {
      for (const [k, v] of Object.entries(sc.props)) {
        const curProp = c.props[k];
        if (curProp instanceof Signal)
          continue;
        c.props[k] = v;
      }
    }
    if (sc?.children && sc.children.length > 0 && c.children.length === 0) {
      const serializedChildrenWithKeys = sc.children.filter(
        (c2) => typeof c2 === "object" && c2.props.key
      );
      for (let i = 0; i < serializedChildrenWithKeys.length; i++) {
        const sChild = serializedChildrenWithKeys[i];
        if (!c.children.find(
          (child) => child instanceof Component && child.props.key === sChild.props.key
        )) {
          const newChild = Hydration.createKeyNodeChild(
            sChild,
            parentElement
          );
          if (!newChild)
            continue;
          newChild.parent = c;
          c.children.push(newChild);
        }
      }
    }
    if (!c.shouldRender())
      return;
    if (c.tag && !c.element) {
      const offset = Hydration.getParentOffset(parentElement);
      let node = parentElement.childNodes[offset];
      try {
        if (!node) {
          DomInterop.reRender(c);
          return;
        }
        if (node.nodeType === Node.COMMENT_NODE && node.nodeValue?.includes(SSR.deferredLoaderPrefix)) {
          const comment = node;
          node = node.nextSibling;
          comment.parentNode?.removeChild(comment);
          Hydration.handleDeferral(parent, node);
        }
      } catch (error) {
        console.error(error, node);
        debugger;
      }
      c.element = node;
      Hydration.updateParentOffset(parentElement, 1);
      DomInterop.updateElement(c);
    }
    if (c.props.subscription)
      c.subscribeTo(c.props.subscription);
    if (c.props.promise && "setPromise" in c && typeof c.setPromise === "function" && !c.props.prefetch && !c.props["prefetch:defer"])
      c.setPromise(c.props.promise);
    for (let i = 0; i < c.children.length; i++) {
      const child = c.children[i];
      const sChild = sc?.children ? sc.children[i] : {};
      if (child instanceof Signal) {
        DomInterop.renderChild(c, child, i);
      }
      if (typeof sChild === "string" || typeof sChild === "number") {
        const el = c.element ?? parentElement;
        Hydration.updateParentOffset(el, 1);
        continue;
      }
      Hydration.hydrateComponent(c, child, sChild, c.element ?? parentElement);
    }
    c.mounted = true;
    c.props.hydrating = false;
  }
  static handleDeferral(parent, node) {
    const handleDeferredContentArrival = (evt) => {
      const { deferralId, data } = evt.detail;
      if (deferralId === parent.props["cb-deferralId"]) {
        const evtScript = document.getElementById(
          `${SSR.deferralScriptIdPrefix}${deferralId}`
        );
        if (evtScript) {
          const parentEl = node.parentElement;
          evtScript.parentNode?.removeChild(evtScript);
          Hydration.updateParentOffset(parentEl, -1);
          parentEl.removeChild(node);
          if ("promiseCache" in parent) {
            parent.promiseCache = data;
            if ("promiseLoading" in parent)
              parent.promiseLoading = false;
          }
          DomInterop.reRender(parent);
        }
      }
      window.removeEventListener(
        SSR.deferralEvtName,
        handleDeferredContentArrival
      );
    };
    window.addEventListener(SSR.deferralEvtName, handleDeferredContentArrival);
  }
  static updateParentOffset(parentElement, n) {
    Cinnabun.rootMap.set(
      parentElement,
      Hydration.getParentOffset(parentElement) + n
    );
  }
  static getParentOffset(parentElement) {
    return Cinnabun.rootMap.get(parentElement) ?? 0;
  }
  static createComponentChild(sc, parentElement) {
    if (typeof sc === "string" || typeof sc === "number") {
      return sc;
    }
    const newComponent = new Component(sc.tag ?? "", { ...sc.props });
    let element;
    if (newComponent.tag) {
      const offset = Hydration.getParentOffset(parentElement) ?? 0;
      element = parentElement.childNodes[offset];
    }
    if (element) {
      newComponent.element = element;
      Hydration.updateParentOffset(parentElement, 1);
    }
    for (const c of sc.children) {
      const child = Hydration.createComponentChild(c, element ?? parentElement);
      if (child)
        newComponent.children.push(child);
    }
    return newComponent;
  }
  static createKeyNodeChild(sc, parentElement) {
    if (typeof sc === "string" || typeof sc === "number") {
      return sc;
    }
    const newComponent = new Component(sc.tag ?? "", { ...sc.props });
    if (newComponent.tag) {
      const element = Array.from(parentElement.childNodes).find(
        (cn) => cn instanceof HTMLElement && cn.tagName.toLowerCase() === sc.tag?.toLowerCase() && cn.getAttribute("key").toString() === sc.props.key.toString()
      );
      if (element) {
        newComponent.element = element;
      } else {
        console.error("failed to acquire element for", sc);
        return void 0;
      }
    }
    return newComponent;
  }
};

// src/Document.tsx
var Document = (App2) => {
  return /* @__PURE__ */ h(fragment, null, /* @__PURE__ */ h("head", null, /* @__PURE__ */ h("meta", { charset: "utf-8" }), /* @__PURE__ */ h("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }), /* @__PURE__ */ h("title", null, "SSR App"), /* @__PURE__ */ h("link", { rel: "stylesheet", href: "/static/index.css" })), /* @__PURE__ */ h("body", null, /* @__PURE__ */ h("div", { id: "app" }, /* @__PURE__ */ h(App2, null)), /* @__PURE__ */ h("div", { id: "portal-root" })));
};

// node_modules/.pnpm/cinnabun@0.1.50/node_modules/cinnabun/src/router/router.ts
var RouteComponent = class extends Component {
  constructor(path, component) {
    super("", {
      path,
      pathDepth: path.split("").filter((chr) => chr === "/").length,
      children: [component],
      visible: false
    });
  }
  get childArgs() {
    return [{ params: this.props.params, query: this.props.query }];
  }
};
var RouterComponent = class extends Component {
  constructor(store, children) {
    if (children.some((c) => !(c instanceof RouteComponent)))
      throw new Error("Must provide Route as child of Router");
    if (Cinnabun.isClient) {
      window.addEventListener("popstate", (e) => {
        store.value = e.target?.location.pathname ?? "/";
      });
    }
    children.sort((a, b) => {
      return b.props.pathDepth - a.props.pathDepth;
    });
    const subscription = (_, self) => {
      return store.subscribe((val) => {
        for (const c of self.children) {
          if (Cinnabun.isClient && c.props.visible)
            DomInterop.unRender(c);
          c.props.visible = false;
          c.props.params = {};
        }
        let nextRoute = void 0;
        for (let i = 0; i < self.children.length; i++) {
          const c = self.children[i];
          const matchRes = self.matchRoute(
            c,
            this.useRequestData("path", val)
          );
          if (matchRes.routeMatch) {
            nextRoute = c;
            c.props.visible = !!matchRes.routeMatch;
            c.props.params = matchRes.params ?? {};
            c.props.query = matchRes.query ?? {};
            break;
          }
        }
        if (Cinnabun.isClient && self.mounted && nextRoute)
          DomInterop.reRender(nextRoute);
      });
    };
    super("", { subscription, children });
  }
  getParentPath() {
    let parentPath = "";
    let parentRoute = this.getParentOfType(RouteComponent);
    while (parentRoute) {
      parentPath = parentRoute.props.path + parentPath;
      parentRoute = parentRoute.getParentOfType(RouteComponent);
    }
    return parentPath;
  }
  matchRoute(c, path) {
    const cPath = this.getParentPath() + c.props.path;
    return matchPath(path, cPath);
  }
};
var Route = ({ path, component }) => {
  return new RouteComponent(path, component);
};
var Router = ({ store }, children) => {
  return new RouterComponent(store, children);
};

// node_modules/.pnpm/cinnabun@0.1.50/node_modules/cinnabun/src/router/link.ts
var setHash = (store, newHash) => {
  if (store.value === newHash)
    return;
  window.location.hash = newHash;
  store.value = newHash;
};
var setPath = (store, newPath, replace = false) => {
  if (window.location.pathname === newPath)
    return;
  if (replace) {
    window.history.replaceState({}, "", newPath);
  } else {
    window.history.pushState({}, "", newPath);
  }
  store.value = newPath;
};
var Link = (props, children) => {
  const {
    to,
    store,
    className,
    activeClass,
    useHash,
    onBeforeNavigate: onBeforeNavigate2,
    ...rest
  } = props;
  const onclick = (e) => {
    e.preventDefault();
    if (onBeforeNavigate2 && !onBeforeNavigate2())
      return;
    if (useHash)
      return setHash(store, to);
    setPath(store, to);
  };
  return new Component("a", {
    watch: store,
    ["bind:className"]: (self) => {
      const curPath = Cinnabun.isClient ? store.value : self.cbInstance?.getServerRequestData("path");
      const pathMatches = !!matchPath(curPath ?? "/", to).routeMatch;
      return className ?? " " + (pathMatches ? activeClass ?? "active" : "");
    },
    href: to,
    onclick,
    children,
    ...rest
  });
};

// node_modules/.pnpm/cinnabun@0.1.50/node_modules/cinnabun/src/router/index.ts
function matchPath(path, location2) {
  let paramNames = [];
  let query = {};
  const cPath = location2;
  let regexPath = cPath.replace(/([:*])(\w+)/g, (_full, _colon, name) => {
    paramNames.push(name);
    return "([^/]+)";
  }) + "(?:/|$)";
  const queryMatch = path.match(/\?(.*)/);
  if (queryMatch) {
    query = queryMatch[1].split("&").reduce((str, value) => {
      if (str === null)
        query = {};
      const [key, val] = value.split("=");
      query[key] = val;
      return query;
    }, null);
  }
  let params = {};
  let routeMatch = path.match(new RegExp(regexPath));
  if (routeMatch !== null) {
    params = routeMatch.slice(1).reduce((str, value, index) => {
      if (str === null)
        params = {};
      params[paramNames[index]] = value.split("?")[0];
      return params;
    }, null);
  }
  return { params, query, routeMatch };
}

// src/state/global.ts
var isClient = Cinnabun.isClient;
var pathStore = createSignal(isClient ? window.location.pathname : "/");
var decodeCookie = (str) => str.split(";").map((v) => v.split("=")).reduce((acc, v) => {
  acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
  return acc;
}, {});
var getUserDataFromCookie = () => {
  if (!window.document.cookie)
    return null;
  const { user } = decodeCookie(window.document.cookie);
  if (!user)
    return null;
  const parsed = JSON.parse(user);
  return parsed ?? null;
};
var userStore = createSignal(isClient ? getUserDataFromCookie() : null);
var getUser = (self) => self.useRequestData("data.user", userStore.value);
var isAuthenticated = (self) => !!getUser(self);
var isNotAuthenticated = (self) => !getUser(self);
var authModalOpen = createSignal(false);
var authModalState = createSignal({
  title: "",
  message: "",
  callbackAction: void 0
});
var sidebarOpen = createSignal(false);
var userDropdownOpen = createSignal(false);

// src/components/icons/UserIcon.tsx
var UserIcon = (props) => {
  return /* @__PURE__ */ h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "1rem",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      ...props
    },
    /* @__PURE__ */ h("path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }),
    /* @__PURE__ */ h("circle", { cx: "12", cy: "7", r: "4" })
  );
};

// node_modules/.pnpm/cinnabun-transitions@1.0.6/node_modules/cinnabun-transitions/src/useTransition.ts
var useTransition = (props) => {
  const fromStyle = () => {
    return props.properties.map((p) => `${p.name}: ${p.from}`).join(";");
  };
  const toStyle = () => {
    return props.properties.map((p) => `${p.name}: ${p.to}`).join(";");
  };
  const minTransitionTime = Math.max(
    ...props.properties.map((p) => p.ms ?? 300)
  );
  const handleMount = (self) => {
    if (!self.element || !Cinnabun.isClient)
      return;
    self.element.setAttribute("style", `${transitionProps()};${toStyle()}`);
  };
  const handleBeforeUnmount = (self) => {
    if (!self.element || !Cinnabun.isClient)
      return false;
    self.element.setAttribute("style", `${transitionProps()};${fromStyle()}`);
    return new Promise((res) => {
      setTimeout(() => {
        if (props.cancelExit && props.cancelExit()) {
          handleMount(self);
          return res(false);
        }
        return res(true);
      }, minTransitionTime);
    });
  };
  const transitionProps = () => {
    return `transition: ${props.properties.map((p) => `${p.name} ${p.ms ?? 300}ms`).join(",")}`;
  };
  return {
    onMounted: handleMount,
    onBeforeUnmounted: handleBeforeUnmount,
    initialStyle: `${transitionProps()};${fromStyle()}`
  };
};

// node_modules/.pnpm/cinnabun-transitions@1.0.6/node_modules/cinnabun-transitions/src/Transition.tsx
var Transition = ({
  tag = "div",
  children,
  properties,
  cancelExit,
  ...rest
}) => {
  const { onMounted, onBeforeUnmounted, initialStyle } = useTransition({
    properties,
    cancelExit
  });
  return new Component(tag, {
    children,
    style: initialStyle,
    onMounted,
    onBeforeUnmounted,
    ...rest
  });
};

// node_modules/.pnpm/cinnabun-transitions@1.0.6/node_modules/cinnabun-transitions/src/FadeInOut.tsx
var FadeInOut = ({
  properties = [],
  ...rest
}) => {
  properties.push({
    name: "opacity",
    from: "0",
    to: "1"
  });
  return Transition({ ...rest, properties });
};

// node_modules/.pnpm/cinnabun-transitions@1.0.6/node_modules/cinnabun-transitions/src/SlideInOut.tsx
var SlideInOut = ({
  settings,
  properties = [],
  unit = "%",
  ...rest
}) => {
  properties.push({
    name: "translate",
    from: settings.from === "bottom" ? `0 100${unit}` : settings.from === "top" ? `0 -100${unit}` : settings.from === "left" ? `-100${unit}` : `100${unit}`,
    to: "0",
    ms: settings.duration ?? 300
  });
  return Transition({ ...rest, properties });
};

// src/components/UserDropdown.tsx
var UserDropdown = () => {
  return /* @__PURE__ */ h("div", { className: "user-dropdown-wrapper" }, /* @__PURE__ */ h(
    SlideInOut,
    {
      watch: userDropdownOpen,
      "bind:visible": () => userDropdownOpen.value,
      settings: { from: "top" },
      className: "user-dropdown"
    },
    /* @__PURE__ */ h("div", { className: "user-dropdown-item" }, /* @__PURE__ */ h(Link, { to: "/users/me", store: pathStore }, "Profile")),
    /* @__PURE__ */ h("div", { className: "user-dropdown-item" }, /* @__PURE__ */ h(Link, { to: "/settings", store: pathStore }, "Settings")),
    /* @__PURE__ */ h("div", { className: "user-dropdown-item" }, /* @__PURE__ */ h("a", { href: "/logout" }, "Log out"))
  ));
};

// src/components/UserAvatar.tsx
var UserAvatar = () => {
  const handleLoginClick = () => {
    if (userStore.value) {
      userDropdownOpen.value = !userDropdownOpen.value;
      return;
    }
    authModalState.value = {
      title: "Log in",
      message: `Welcome (back?) to Zetabase - a place for
       people, apache helicopters and anyone (or anything) 
       else that's looking for someplace better.

        Try not to be a ****! Unless, of course, you
        join one of the various '****' communities.`,
      callbackAction: void 0
    };
    authModalOpen.value = true;
  };
  return /* @__PURE__ */ h("div", { className: "user-area flex" }, /* @__PURE__ */ h(
    "button",
    {
      type: "button",
      className: "avatar-wrapper sm rounded-full border-none p-0 bg-primary-darkest",
      onclick: handleLoginClick
    },
    /* @__PURE__ */ h(UserIcon, { className: "avatar", watch: userStore, "bind:visible": isNotAuthenticated }),
    /* @__PURE__ */ h(
      "img",
      {
        watch: userStore,
        "bind:visible": isAuthenticated,
        "bind:src": (self) => getUser(self)?.picture,
        className: "avatar",
        alt: "avatar"
      }
    )
  ), /* @__PURE__ */ h(UserDropdown, null));
};

// src/components/Portal.tsx
var Portal = ({ children }) => {
  const rootId = "portal-root";
  return createPortal(children ?? [], rootId);
};

// src/utils.ts
var generateUUID2 = () => {
  var d = (/* @__PURE__ */ new Date()).getTime();
  var d2 = typeof performance !== "undefined" && performance.now && performance.now() * 1e3 || 0;
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = Math.random() * 16;
    if (d > 0) {
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : r & 3 | 8).toString(16);
  });
};
var truncateText = (text, limit) => {
  return text.substring(0, limit) + (text.length > limit ? "..." : "");
};
var formatUTCDate = (date) => {
  return new Date(date).toLocaleString();
};

// src/components/Notifications.tsx
var notificationStore = {};
var addNotification = ({
  text,
  type = "info",
  duration = 3e3
}) => {
  const id = generateUUID2();
  const notification = {
    id,
    text,
    type,
    duration
  };
  notification.component = new NotificationComponent(id, type, text);
  const iNotif = notification;
  notificationStore[iNotif.id] = iNotif;
};
var NotificationComponent = class extends Component {
  constructor(id, type, text) {
    const { onMounted, onBeforeUnmounted, initialStyle } = useTransition({
      properties: [
        {
          name: "opacity",
          from: "0",
          to: "1"
        },
        {
          name: "translate",
          from: "100%",
          to: "0%"
        }
      ]
    });
    super("div", {
      ["data-id"]: id,
      className: `notification ${type}`,
      children: [text],
      style: initialStyle,
      onMounted,
      onBeforeUnmounted
    });
  }
};
var NotificationTrayComponent = class extends Component {
  constructor(animationDuration) {
    super("div", { className: "notification-tray" });
    this.animationDuration = animationDuration;
    const addNotification2 = (notification) => {
      const child = notification.component;
      this.prependChildren(child);
      const element = child.element;
      element?.addEventListener("mouseenter", function handler() {
        child.props.hovered = true;
      });
      element?.addEventListener("mouseleave", function handler() {
        child.props.hovered = false;
      });
    };
    const removeNotification = (notification) => {
      const child = notification.component;
      child.element?.removeEventListener("mouseenter", function handler() {
        child.props.hovered = true;
      });
      child.element?.removeEventListener("mouseleave", function handler() {
        child.props.hovered = false;
      });
      DomInterop.unRender(child);
      delete notificationStore[notification.id];
    };
    if (Cinnabun.isClient) {
      const tickRateMs = 33;
      setInterval(() => {
        const children = this.children;
        for (const [k, notification] of Object.entries(notificationStore)) {
          const c = children.find((child) => child.props["data-id"] === k);
          if (!c) {
            addNotification2(notification);
          }
        }
        const deleteList = [];
        children.forEach((c) => {
          if (c.props.hovered)
            return;
          const notifId = c.props["data-id"];
          const notification = notificationStore[notifId];
          if (!notification)
            throw new Error("failed to get notification");
          notification.duration -= tickRateMs;
          if (notification.duration <= 0) {
            removeNotification(notification);
            deleteList.push(notifId);
          } else if (notification.duration < this.animationDuration) {
            if (!c.props.hidden) {
              c.props.hidden = true;
            }
          }
        });
        if (deleteList.length) {
          const children2 = this.children;
          this.children = children2.filter(
            (c) => !deleteList.includes(c.props["data-id"])
          );
          for (const id of deleteList) {
            delete notificationStore[id];
          }
        }
      }, tickRateMs);
    }
  }
};
var NotificationTray = ({
  animationDuration = 500
}) => new NotificationTrayComponent(animationDuration);

// src/constants.tsx
var API_URL = "/api";

// src/client/actions/communities.ts
var getCommunitySearch = async (title) => {
  try {
    const response = await fetch(`${API_URL}/communities/search?title=${title}`);
    const data = await response.json();
    if (!response.ok)
      throw new Error(data?.message ?? response.statusText);
    return data;
  } catch (error) {
    addNotification({
      type: "error",
      text: error.message
    });
  }
};
var getCommunities = async (page = 0) => {
  try {
    const response = await fetch(`${API_URL}/communities?page=${page}`);
    const data = await response.json();
    if (!response.ok)
      throw new Error(data?.message ?? response.statusText);
    return data;
  } catch (error) {
    addNotification({
      type: "error",
      text: error.message
    });
  }
};
var getCommunity = async (id) => {
  try {
    const response = await fetch(`${API_URL}/communities/${id}`);
    return await response.json();
  } catch (error) {
    return new Error(error.message);
  }
};
var getLatestPostsCommunities = async (page = 0) => {
  try {
    const response = await fetch(`${API_URL}/communities/latest?page=${page}`);
    const data = await response.json();
    if (!response.ok)
      throw new Error(data?.message ?? response.statusText);
    return data;
  } catch (error) {
    addNotification({
      type: "error",
      text: error.message
    });
  }
};
var getCommunityJoinRequests = async (id) => {
  try {
    const response = await fetch(`${API_URL}/communities/${id}/join-requests`);
    const data = await response.json();
    if (!response.ok)
      throw new Error(data?.message ?? response.statusText);
    return data;
  } catch (error) {
    addNotification({
      type: "error",
      text: error.message
    });
  }
};
var respondToCommunityJoinRequest = async (communityId, requestId, accepted) => {
  try {
    const response = await fetch(`${API_URL}/communities/${communityId}/join-requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ requestId, accepted })
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data?.message ?? response.statusText);
    return data;
  } catch (error) {
    addNotification({
      type: "error",
      text: error.message
    });
  }
};
var createCommunity = async (community) => {
  try {
    const response = await fetch(`${API_URL}/communities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(community)
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data?.message ?? response.statusText);
    return data;
  } catch (error) {
    addNotification({
      type: "error",
      text: error.message
    });
  }
};
var updateCommunity = async (community) => {
  try {
    const response = await fetch(`${API_URL}/communities/${community.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(community)
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data?.message ?? response.statusText);
    return data;
  } catch (error) {
    addNotification({
      type: "error",
      text: error.message
    });
  }
};
var joinCommunity = async (url_title) => {
  try {
    const response = await fetch(`${API_URL}/communities/${url_title}/join`, {
      method: "POST"
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data?.message ?? response.statusText);
    return data;
  } catch (error) {
    addNotification({
      type: "error",
      text: error.message
    });
  }
};
var leaveCommunity = async (id) => {
  try {
    const response = await fetch(`${API_URL}/communities/${id}/leave`, {
      method: "POST"
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data?.message ?? response.statusText);
    return data;
  } catch (error) {
    addNotification({
      type: "error",
      text: error.message
    });
  }
};
var deleteCommunity = async (id) => {
  try {
    const response = await fetch(`${API_URL}/communities/${id}`, {
      method: "DELETE"
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data?.message ?? response.statusText);
    return true;
  } catch (error) {
    addNotification({
      type: "error",
      text: error.message
    });
    return false;
  }
};
var updateCommunityMemberType = async (communityId, userId, memberType) => {
  try {
    const response = await fetch(`${API_URL}/communities/${communityId}/members`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userId, memberType })
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data?.message ?? response.statusText);
    return data;
  } catch (error) {
    addNotification({
      type: "error",
      text: error.message
    });
  }
};

// src/state/community.ts
var postCreatorModalOpen = createSignal(false);
var communityCreatorModalOpen = createSignal(false);
var communityEditorModalOpen = createSignal(false);
var communityJoinModalOpen = createSignal(false);
var communityLeaveModalOpen = createSignal(false);
var communityDeleteModalOpen = createSignal(false);
var communityOwnershipTransferModalOpen = createSignal(false);
var selectedCommunity = createSignal(null);
var selectedCommunityPost = createSignal(null);
var pendingCommunityJoinRequests = createSignal([]);
var communityDrawerOpen = createSignal(false);
var communityDrawerState = createSignal({
  title: "",
  componentFunc: null
});
var communityHasMembers = () => {
  if (!selectedCommunity.value)
    return false;
  console.log(selectedCommunity.value);
  return (selectedCommunity.value.members ?? []).length > 0 || (selectedCommunity.value.moderators ?? []).length > 0;
};
var isCommunityMember = () => {
  if (!selectedCommunity.value)
    return true;
  return selectedCommunity.value.memberType !== "guest";
};
var isCommunityOwner = () => {
  return selectedCommunity.value?.memberType === "owner";
};
var isCommunityModerator = () => {
  return selectedCommunity.value?.memberType === "moderator";
};
var isCommunityAdmin = () => {
  return isCommunityModerator() || isCommunityOwner();
};

// src/components/loaders/Default.tsx
var DefaultLoader = (props) => {
  return /* @__PURE__ */ h("div", { className: "lds-default", ...props }, /* @__PURE__ */ h("div", null), /* @__PURE__ */ h("div", null), /* @__PURE__ */ h("div", null), /* @__PURE__ */ h("div", null), /* @__PURE__ */ h("div", null), /* @__PURE__ */ h("div", null), /* @__PURE__ */ h("div", null), /* @__PURE__ */ h("div", null), /* @__PURE__ */ h("div", null), /* @__PURE__ */ h("div", null), /* @__PURE__ */ h("div", null), /* @__PURE__ */ h("div", null));
};

// src/components/AuthorTag.tsx
var AuthorTag = ({
  user,
  date
}) => {
  return /* @__PURE__ */ h("small", { className: "author text-muted" }, /* @__PURE__ */ h("div", { className: "flex flex-column" }, /* @__PURE__ */ h(Link, { to: `/users/${user.id}`, store: pathStore }, user.name), date ? /* @__PURE__ */ h("span", { className: "created-at" }, formatUTCDate(date.toString())) : /* @__PURE__ */ h(fragment, null)), /* @__PURE__ */ h("div", { className: "avatar-wrapper sm" }, /* @__PURE__ */ h("img", { src: user.avatarUrl, className: "avatar", alt: user.name })));
};

// src/pages/Home.tsx
var PostCard = ({ post, community, user }) => {
  return /* @__PURE__ */ h("div", { className: "card", key: post.id }, /* @__PURE__ */ h("div", { className: "card-title flex justify-content-between" }, post.title, /* @__PURE__ */ h(
    Link,
    {
      onBeforeNavigate: () => {
        selectedCommunity.value = { ...community };
        return true;
      },
      store: pathStore,
      to: `/communities/${community.url_title}`,
      className: "text-primary"
    },
    community.title
  )), /* @__PURE__ */ h("div", { className: "card-body" }, post.content), /* @__PURE__ */ h("div", { className: "flex justify-content-between" }, /* @__PURE__ */ h("div", null), /* @__PURE__ */ h("div", { className: "flex flex-column align-items-end" }, /* @__PURE__ */ h(AuthorTag, { user, date: post.createdAt.toString() }))));
};
function Home() {
  return /* @__PURE__ */ h("div", { className: "flex gap flex-wrap" }, /* @__PURE__ */ h("section", null, /* @__PURE__ */ h("div", { className: "section-header" }, /* @__PURE__ */ h("h2", null, "Latest posts")), /* @__PURE__ */ h(Suspense, { promise: getLatestPostsCommunities, cache: true }, (loading2, data) => {
    if (loading2)
      return /* @__PURE__ */ h(DefaultLoader, null);
    if (!data)
      return /* @__PURE__ */ h("div", { className: "text-muted" }, "No posts yet.");
    return /* @__PURE__ */ h(For, { each: data, template: (item) => /* @__PURE__ */ h(PostCard, { ...item }) });
  })));
}

// src/components/communities/CommunityListCard.tsx
var CommunityListCard = (props) => {
  const { members, community } = props;
  const nMembers = parseInt(members.toString());
  return /* @__PURE__ */ h("div", { className: "card community-card", key: community.id }, /* @__PURE__ */ h("div", { className: "card-title flex justify-content-between" }, /* @__PURE__ */ h("div", { className: "flex gap align-items-center" }, /* @__PURE__ */ h("h2", { className: "m-0" }, /* @__PURE__ */ h(
    "a",
    {
      href: `/communities/${community.url_title}`,
      onclick: (e) => {
        e.preventDefault();
        selectedCommunity.value = {
          id: community.id,
          title: community.title,
          url_title: community.url_title,
          description: community.description,
          private: !!community.private,
          disabled: !!community.disabled
        };
        setPath(pathStore, `/communities/${community.url_title}`);
      }
    },
    community.title
  ), community.private ? /* @__PURE__ */ h("span", { className: "badge text-light ml-2" }, "Private") : /* @__PURE__ */ h(fragment, null))), /* @__PURE__ */ h("small", { className: "text-muted nowrap" }, nMembers, " ", nMembers > 1 ? "members" : "member")), /* @__PURE__ */ h("p", { className: "card-description text-muted" }, truncateText(community.description, 128)));
};

// src/components/communities/CommunityList.tsx
var CommunityList = ({ communities }) => {
  return /* @__PURE__ */ h("ul", { className: "card-list w-100" }, /* @__PURE__ */ h(For, { each: communities, template: (community) => /* @__PURE__ */ h(CommunityListCard, { ...community }) }));
};

// src/components/Button.tsx
var Button = (props, children) => {
  return /* @__PURE__ */ h("button", { ...props }, /* @__PURE__ */ h("span", { className: "flex align-items-center gap-sm" }, children));
};

// src/pages/Communities.tsx
function Communities() {
  const handleCreateCommunityClick = () => {
    if (!userStore.value) {
      authModalState.value = {
        title: "Log in to create a Community",
        message: "You must be logged in to create a Community.",
        callbackAction: "create-community" /* CreateCommunity */
      };
      authModalOpen.value = true;
      return;
    }
    communityCreatorModalOpen.value = true;
  };
  return /* @__PURE__ */ h(fragment, null, /* @__PURE__ */ h("div", { className: "page-title flex align-items-center justify-content-between gap flex-wrap" }, /* @__PURE__ */ h("h1", null, "Communities"), /* @__PURE__ */ h(
    Button,
    {
      className: "btn btn-primary hover-animate sm_btn-sm md_btn-md lg_btn-lg",
      onclick: handleCreateCommunityClick
    },
    "Create a Community"
  )), /* @__PURE__ */ h("div", { className: "page-body" }, /* @__PURE__ */ h(Suspense, { promise: getCommunities, cache: true }, (loading2, res) => {
    if (loading2)
      return /* @__PURE__ */ h(DefaultLoader, null);
    if (!res)
      return /* @__PURE__ */ h("div", null, /* @__PURE__ */ h("span", { className: "text-danger" }, "Oops! Something went wrong \u{1F622}"));
    if (res.length === 0)
      return /* @__PURE__ */ h("div", null, /* @__PURE__ */ h("span", { className: "text-muted" }, "There are no communities to show... Why not create one?"));
    return /* @__PURE__ */ h(CommunityList, { communities: res });
  })));
}

// src/components/IconButton.tsx
var IconButton = ({ children, ...rest }) => {
  const { className, ...others } = rest;
  const _className = "icon-button " + (rest.className ?? "");
  return /* @__PURE__ */ h("button", { className: _className, ...others }, children);
};

// src/components/icons/ThumbsUpIcon.tsx
var ThumbsUpIcon = (props) => {
  const { color = "#000000", ...rest } = props;
  const hoverColor = props["color:hover"] ?? color;
  return /* @__PURE__ */ h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "1em",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: color,
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      style: `--hover-stroke: ${hoverColor}`,
      className: "stroke",
      ...rest
    },
    /* @__PURE__ */ h("path", { d: "M7 10v12" }),
    /* @__PURE__ */ h("path", { d: "M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" })
  );
};

// src/components/icons/ThumbsDownIcon.tsx
var ThumbsDownIcon = (props) => {
  const { color = "#000000", ...rest } = props;
  const hoverColor = props["color:hover"] ?? color;
  return /* @__PURE__ */ h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "1em",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: color,
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      className: "stroke",
      style: `--hover-stroke: ${hoverColor}`,
      ...rest
    },
    /* @__PURE__ */ h("path", { d: "M17 14V2" }),
    /* @__PURE__ */ h("path", { d: "M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" })
  );
};

// src/client/actions/posts.ts
var addPostComment = async (postId, comment) => {
  try {
    const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ comment })
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data?.message ?? response.statusText);
    return data;
  } catch (error) {
    addNotification({
      type: "error",
      text: error.message
    });
  }
};
var addPostReaction = async (postId, reaction) => {
  try {
    const response = await fetch(`${API_URL}/posts/${postId}/reactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ reaction })
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data?.message ?? response.statusText);
    return data;
  } catch (error) {
    addNotification({
      type: "error",
      text: error.message
    });
  }
};
var addPost = async (post) => {
  try {
    const response = await fetch(`${API_URL}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(post)
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data?.message ?? response.statusText);
    return data;
  } catch (error) {
    console.error(error);
    addNotification({
      type: "error",
      text: error.message
    });
  }
};

// src/components/loaders/Ellipsis.tsx
var EllipsisLoader = (props) => {
  const { className, ...rest } = props;
  return /* @__PURE__ */ h("div", { className: `lds-ellipsis ${className}`, ...rest }, /* @__PURE__ */ h("div", null), /* @__PURE__ */ h("div", null), /* @__PURE__ */ h("div", null), /* @__PURE__ */ h("div", null));
};

// src/db/validation.ts
var communityValidation = {
  minCommunityNameLength: 6,
  maxCommunityNameLength: 128,
  minCommunityDescLength: 0,
  maxCommunityDescLength: 255,
  isCommunityNameValid: (name) => {
    if (!name)
      return false;
    if (name.length < communityValidation.minCommunityNameLength || name.length > communityValidation.maxCommunityNameLength) {
      return false;
    }
    if (!/^[a-zA-Z0-9-_ ()]*$/.test(name)) {
      return false;
    }
    return true;
  },
  isCommunityValid: (name, desc) => {
    if (!desc)
      return false;
    if (!communityValidation.isCommunityNameValid(name))
      return false;
    if (desc.length < communityValidation.minCommunityDescLength || desc.length > communityValidation.maxCommunityDescLength) {
      return false;
    }
    return true;
  }
};
var postValidation = {
  minPostTitleLength: 1,
  maxPostTitleLength: 128,
  minPostContentLength: 1,
  maxPostContentLength: 2048,
  isPostValid: (title, content) => {
    if (title.length < postValidation.minPostTitleLength || title.length > postValidation.maxPostTitleLength) {
      return false;
    }
    if (content.length < postValidation.minPostContentLength || content.length > postValidation.maxPostContentLength) {
      return false;
    }
    return true;
  }
};
var commentValidation = {
  minCommentContentLength: 1,
  maxCommentContentLength: 255,
  isCommentValid: (content) => {
    if (content.length < commentValidation.minCommentContentLength || content.length > commentValidation.maxCommentContentLength) {
      return false;
    }
    return true;
  }
};

// src/components/community/PostCardComments.tsx
var CommentItem = ({ comment }) => {
  return /* @__PURE__ */ h("div", { className: "comment-item flex align-items-center gap", key: comment.id }, /* @__PURE__ */ h("div", { className: "avatar-wrapper sm" }, /* @__PURE__ */ h("img", { className: "avatar", src: comment.user.avatarUrl, alt: comment.user.name })), /* @__PURE__ */ h("div", { className: "flex flex-column gap-sm flex-grow text-sm" }, /* @__PURE__ */ h("div", { className: "text-muted flex align-items-center gap justify-content-between" }, /* @__PURE__ */ h(Link, { to: `/users/${comment.user.id}`, store: pathStore, className: "author" }, comment.user.name), /* @__PURE__ */ h("span", null, formatUTCDate(comment.createdAt.toString()))), /* @__PURE__ */ h("p", { className: "m-0 comment" }, comment.content)));
};
var CommentsList = ({ comments }) => {
  return /* @__PURE__ */ h("div", { className: "comments-list" }, /* @__PURE__ */ h(
    "p",
    {
      className: "text-muted m-0",
      watch: comments,
      "bind:visible": () => comments.value.length === 0
    },
    /* @__PURE__ */ h("small", null, /* @__PURE__ */ h("i", null, "No comments yet."))
  ), /* @__PURE__ */ h(For, { each: comments, template: (comment) => /* @__PURE__ */ h(CommentItem, { comment }) }));
};
var PostCardComments = ({ post }) => {
  const comments = computed(post, () => post.value.comments);
  return /* @__PURE__ */ h("div", { className: "post-card-comments flex flex-column gap" }, /* @__PURE__ */ h(CommentsList, { comments }), /* @__PURE__ */ h(NewCommentForm, { post }));
};
var NewCommentForm = ({ post }) => {
  const newComment = createSignal("");
  const loading2 = createSignal(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userStore.value) {
      if (!userStore.value) {
        authModalState.value = {
          title: "Log in to interact with this post",
          message: "You must be logged in to interact with community posts.",
          callbackAction: "view-community" /* ViewCommunity */
        };
        authModalOpen.value = true;
        return;
      }
      return;
    }
    if (!isCommunityMember()) {
      communityJoinModalOpen.value = true;
      return;
    }
    e.preventDefault();
    loading2.value = true;
    const res = await addPostComment(post.value.id, newComment.value);
    if (res) {
      post.value.comments.push(res);
      post.notify();
      newComment.value = "";
    }
    loading2.value = false;
  };
  const handleInput = (e) => {
    e.preventDefault();
    newComment.value = e.target.value;
  };
  return /* @__PURE__ */ h(
    "form",
    {
      className: "flex align-items-center gap flex-wrap justify-content-end",
      onsubmit: handleSubmit
    },
    /* @__PURE__ */ h("div", { className: "flex align-items-center gap flex-wrap flex-grow" }, /* @__PURE__ */ h("div", { className: "avatar-wrapper sm" }, /* @__PURE__ */ h("img", { className: "avatar", src: userStore.value?.picture, alt: userStore.value?.name })), /* @__PURE__ */ h("div", { className: "flex-grow" }, /* @__PURE__ */ h(
      "textarea",
      {
        className: "form-control",
        placeholder: "Write a comment...",
        watch: newComment,
        "bind:value": () => newComment.value,
        oninput: handleInput
      }
    ))),
    /* @__PURE__ */ h(
      Button,
      {
        watch: [loading2, newComment],
        "bind:disabled": () => loading2.value || !commentValidation.isCommentValid(newComment.value),
        type: "submit",
        className: "btn btn-primary hover-animate"
      },
      "Add Comment",
      /* @__PURE__ */ h(EllipsisLoader, { watch: loading2, "bind:visible": () => loading2.value })
    )
  );
};

// src/components/community/PostCard.tsx
var PostCard2 = ({ post }) => {
  const state = createSignal(post);
  const reacting = createSignal(false);
  const userReaction = computed(state, () => {
    if (!userStore.value)
      return void 0;
    return state.value.reactions.find((r) => r.ownerId === userStore.value?.userId);
  });
  const addReaction = async (reaction) => {
    if (reacting.value)
      return;
    if (!userStore.value) {
      authModalState.value = {
        title: "Log in to interact with this post",
        message: "You must be logged in to interact with community posts.",
        callbackAction: "view-community" /* ViewCommunity */
      };
      authModalOpen.value = true;
      return;
    }
    if (userReaction.value?.reaction === reaction)
      return;
    if (!isCommunityMember()) {
      communityJoinModalOpen.value = true;
      return;
    }
    reacting.value = true;
    const res = await addPostReaction(post.id, reaction);
    if (res) {
      const prevReaction = state.value.reactions.find((r) => r.ownerId === userStore?.value?.userId);
      if (prevReaction) {
        state.value.reactions.splice(state.value.reactions.indexOf(prevReaction), 1);
      }
      state.value.reactions.push(res);
      state.notify();
    }
    reacting.value = false;
  };
  const totalReactions = computed(state, () => {
    return state.value.reactions.reduce(
      (acc, reaction) => {
        if (reaction.reaction) {
          acc.positive++;
        } else {
          acc.negative++;
        }
        return acc;
      },
      { positive: 0, negative: 0 }
    );
  });
  return /* @__PURE__ */ h("div", { className: "card post-card flex flex-column", key: post.id }, /* @__PURE__ */ h("div", { className: "flex justify-content-between gap" }, /* @__PURE__ */ h("h4", { className: "m-0 title" }, /* @__PURE__ */ h(
    "a",
    {
      href: `/communities/${selectedCommunity.value?.url_title}/${post.id}`,
      onclick: (e) => {
        e.preventDefault();
        setPath(pathStore, `/communities/${selectedCommunity.value?.url_title}/${post.id}`);
      }
    },
    post.title
  )), /* @__PURE__ */ h(AuthorTag, { user: post.user, date: post.createdAt.toString() })), /* @__PURE__ */ h("p", { className: "post-card-content" }, truncateText(post.content, 256)), /* @__PURE__ */ h("div", { className: "flex gap post-reactions" }, /* @__PURE__ */ h(
    IconButton,
    {
      onclick: () => addReaction(true),
      "bind:className": () => `icon-button flex align-items-center gap-sm ${userReaction.value?.reaction === true ? "selected" : ""}`,
      watch: [userStore, reacting, userReaction],
      "bind:disabled": () => reacting.value
    },
    /* @__PURE__ */ h(
      ThumbsUpIcon,
      {
        color: "var(--primary)",
        "color:hover": "var(--primary-light)",
        className: "text-rg"
      }
    ),
    /* @__PURE__ */ h("small", { className: "text-muted", watch: totalReactions, "bind:children": true }, () => totalReactions.value.positive)
  ), /* @__PURE__ */ h(
    IconButton,
    {
      onclick: () => addReaction(false),
      "bind:className": () => `icon-button flex align-items-center gap-sm ${userReaction.value?.reaction === false ? "selected" : ""}`,
      watch: [userStore, reacting, userReaction],
      "bind:disabled": () => reacting.value
    },
    /* @__PURE__ */ h(
      ThumbsDownIcon,
      {
        color: "var(--primary)",
        "color:hover": "var(--primary-light)",
        className: "text-rg"
      }
    ),
    /* @__PURE__ */ h("small", { className: "text-muted", watch: totalReactions, "bind:children": true }, () => totalReactions.value.negative)
  )), /* @__PURE__ */ h(PostCardComments, { post: state }));
};

// src/components/community/CommunityPosts.tsx
var CommunityPosts = ({ posts }) => {
  return /* @__PURE__ */ h("div", { className: "flex flex-column" }, posts.length ? /* @__PURE__ */ h("div", { className: "flex flex-column" }, /* @__PURE__ */ h(For, { each: posts, template: (post) => /* @__PURE__ */ h(PostCard2, { post }) })) : /* @__PURE__ */ h("div", null, /* @__PURE__ */ h("i", { className: "text-muted" }, "No posts yet \u{1F622}")));
};

// src/components/community/CommunityMemberCard.tsx
var CommunityMemberCard = ({ member }) => {
  return /* @__PURE__ */ h("div", { className: "card flex flex-column", key: member.id }, /* @__PURE__ */ h("div", { className: "flex justify-content-between gap align-items-start" }, /* @__PURE__ */ h("div", { className: "avatar-wrapper sm" }, /* @__PURE__ */ h("img", { crossOrigim: true, className: "avatar", src: member.user.avatarUrl, alt: member.user.name })), /* @__PURE__ */ h("h4", { className: "m-0 w-100 nowrap" }, member.user.name), /* @__PURE__ */ h("small", { className: "member-since text-muted" }, "Since ", new Date(member.createdAt).toLocaleString().split(",")[0])));
};

// src/components/icons/EditIcon.tsx
var EditIcon = (props) => {
  const { color = "#000000", ...rest } = props;
  const hoverColor = props["color:hover"] ?? color;
  return /* @__PURE__ */ h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "1rem",
      viewBox: "0 0 24 24",
      fill: "none",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      stroke: color,
      style: `--hover-stroke: ${hoverColor}`,
      className: "stroke",
      ...rest
    },
    /* @__PURE__ */ h("path", { d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" }),
    /* @__PURE__ */ h("path", { d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" })
  );
};

// src/components/icons/MenuIcon.tsx
var MenuIcon = () => {
  return /* @__PURE__ */ h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "1rem",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    },
    /* @__PURE__ */ h("line", { x1: "4", x2: "20", y1: "12", y2: "12" }),
    /* @__PURE__ */ h("line", { x1: "4", x2: "20", y1: "6", y2: "6" }),
    /* @__PURE__ */ h("line", { x1: "4", x2: "20", y1: "18", y2: "18" })
  );
};

// src/components/icons/MoreIcon.tsx
var MoreIcon = () => {
  return /* @__PURE__ */ h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "1rem",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      class: "lucide lucide-more-horizontal"
    },
    /* @__PURE__ */ h("circle", { cx: "12", cy: "12", r: "1" }),
    /* @__PURE__ */ h("circle", { cx: "19", cy: "12", r: "1" }),
    /* @__PURE__ */ h("circle", { cx: "5", cy: "12", r: "1" })
  );
};

// src/components/community/AddPostButton.tsx
var AddPostButton = () => {
  const handleAddNewPost = () => {
    if (!userStore.value) {
      authModalState.value = {
        title: "Log in to create a Post",
        message: "You must be logged in to create a Post.",
        callbackAction: "create-post" /* CreatePost */
      };
      authModalOpen.value = true;
      return;
    }
    if (!isCommunityMember()) {
      communityJoinModalOpen.value = true;
      return;
    }
    postCreatorModalOpen.value = true;
  };
  return /* @__PURE__ */ h(Button, { className: "btn btn-primary hover-animate", onclick: handleAddNewPost, watch: userStore }, "Create post");
};

// src/components/community/CommunityFixedHeader.tsx
var CommunityFixedHeader = () => {
  const hasScrolled = createSignal(false);
  const onScroll = () => {
    if (hasScrolled.value && window.scrollY > 100)
      return;
    hasScrolled.value = window.scrollY > 100;
  };
  const onMounted = () => {
    window.addEventListener("scroll", onScroll);
  };
  const onUnmounted = () => {
    window.removeEventListener("scroll", onScroll);
  };
  return /* @__PURE__ */ h("div", { onMounted, onUnmounted }, /* @__PURE__ */ h(
    SlideInOut,
    {
      className: "community-page-fixed-title flex justify-content-between align-items-center",
      settings: { from: "top" },
      watch: hasScrolled,
      "bind:visible": () => hasScrolled.value,
      cancelExit: () => hasScrolled.value
    },
    /* @__PURE__ */ h("div", { className: "flex gap align-items-center" }, /* @__PURE__ */ h("h2", { className: "m-0 text-light" }, () => selectedCommunity.value?.title), isCommunityOwner() ? /* @__PURE__ */ h(IconButton, { onclick: () => communityEditorModalOpen.value = true }, /* @__PURE__ */ h(EditIcon, { color: "var(--light)" })) : /* @__PURE__ */ h(fragment, null)),
    /* @__PURE__ */ h(AddPostButton, null)
  ));
};

// src/components/community/PendingJoinRequests.tsx
var JoinRequestCard = (joinReq) => {
  const { id, communityId } = joinReq;
  const loading2 = createSignal(false);
  const respondToRequest = async (communityId2, joinRequestId, accept) => {
    loading2.value = true;
    const res = await respondToCommunityJoinRequest(communityId2, joinRequestId, accept);
    if (!res) {
      loading2.value = false;
      return;
    }
    const idx = pendingCommunityJoinRequests.value.findIndex((j) => j.id === joinRequestId);
    pendingCommunityJoinRequests.value.splice(idx, 1);
    pendingCommunityJoinRequests.notify();
    loading2.value = false;
    addNotification({
      text: `You ${accept ? "accepted" : "rejected"} ${joinReq.user.name}'s join request`,
      type: "success"
    });
    if (pendingCommunityJoinRequests.value.length === 0) {
      communityDrawerOpen.value = false;
    }
  };
  return /* @__PURE__ */ h("div", { key: id, className: "card flex-row align-items-center" }, /* @__PURE__ */ h("div", { className: "avatar-wrapper sm rounded-full border-none p-0 bg-primary-darkest" }, /* @__PURE__ */ h("img", { className: "avatar", src: joinReq.user.avatarUrl, alt: "avatar" })), /* @__PURE__ */ h("small", null, joinReq.user.name), /* @__PURE__ */ h("div", { className: "flex flex-wrap gap align-items-center justify-content-end" }, /* @__PURE__ */ h(
    "button",
    {
      type: "button",
      className: "btn btn-primary",
      watch: loading2,
      "bind:disabled": () => loading2.value,
      onclick: () => respondToRequest(communityId, id, true)
    },
    "Accept"
  ), /* @__PURE__ */ h(
    "button",
    {
      type: "button",
      className: "btn btn-danger",
      watch: loading2,
      "bind:disabled": () => loading2.value,
      onclick: () => respondToRequest(communityId, id, false)
    },
    "Reject"
  )));
};
var PendingJoinRequests = () => {
  return /* @__PURE__ */ h("div", null, /* @__PURE__ */ h(For, { each: pendingCommunityJoinRequests, template: JoinRequestCard }));
};

// src/components/community/CommunityMemberManager.tsx
var MemberCard = ({ member }) => {
  const loading2 = createSignal(false);
  const demoteToMember = async () => {
    loading2.value = true;
    const res = await updateCommunityMemberType(
      selectedCommunity.value.id,
      member.user.id,
      "member"
    );
    loading2.value = false;
    if (!res)
      return;
    if ("type" in res)
      return;
    addNotification({
      type: "success",
      text: `${res.user.name} is now a member`
    });
    selectedCommunity.value.members = [...selectedCommunity.value?.members ?? [], res];
    selectedCommunity.value.moderators = (selectedCommunity.value?.moderators ?? []).filter(
      (mod) => mod.user.id !== res.user.id
    );
    selectedCommunity.notify();
  };
  const promoteToModerator = async () => {
    loading2.value = true;
    const res = await updateCommunityMemberType(
      selectedCommunity.value.id,
      member.user.id,
      "moderator"
    );
    loading2.value = false;
    if (!res)
      return;
    if ("type" in res)
      return;
    addNotification({
      type: "success",
      text: `${res.user.name} is now a moderator`
    });
    selectedCommunity.value.moderators = [...selectedCommunity.value?.moderators ?? [], res];
    selectedCommunity.value.members = (selectedCommunity.value?.members ?? []).filter(
      (member2) => member2.user.id !== res.user.id
    );
    selectedCommunity.notify();
  };
  const revokeMembership = async () => {
    loading2.value = true;
    const res = await updateCommunityMemberType(
      selectedCommunity.value.id,
      member.user.id,
      "none"
    );
    loading2.value = false;
    if (!res)
      return;
    if ("type" in res && res.type === "removed") {
      addNotification({
        type: "success",
        text: `${member.user.name} has been removed from the community`
      });
      selectedCommunity.value.moderators = (selectedCommunity.value?.moderators ?? []).filter(
        (mod) => mod.user.id !== member.user.id
      );
      selectedCommunity.value.members = (selectedCommunity.value?.members ?? []).filter(
        (member2) => member2.user.id !== member2.user.id
      );
      selectedCommunity.notify();
    }
  };
  return /* @__PURE__ */ h("div", { className: "card" }, /* @__PURE__ */ h("div", { className: "card-title flex gap justify-content-between" }, /* @__PURE__ */ h("span", null, member.user.name), /* @__PURE__ */ h("div", { className: "flex flex-wrap flex-column gap-sm" }, member.memberType === "moderator" ? /* @__PURE__ */ h(
    Button,
    {
      className: "btn btn-danger hover-animate btn-sm",
      watch: loading2,
      "bind:disabled": () => loading2.value,
      onclick: demoteToMember
    },
    "Demote to member"
  ) : /* @__PURE__ */ h(Button, { className: "btn btn-secondary hover-animate btn-sm", onclick: promoteToModerator }, "Promote to moderator"), /* @__PURE__ */ h(
    Button,
    {
      className: "btn btn-danger hover-animate btn-sm",
      watch: loading2,
      "bind:disabled": () => loading2.value,
      onclick: revokeMembership
    },
    "Revoke membership"
  ))));
};
var MemberList = ({ members, title }) => {
  return /* @__PURE__ */ h("section", null, /* @__PURE__ */ h("h3", null, title), /* @__PURE__ */ h(For, { each: members, template: (member) => /* @__PURE__ */ h(MemberCard, { member }) }));
};
var CommunityMemberManager = () => {
  return /* @__PURE__ */ h("div", { watch: selectedCommunity, "bind:children": true }, () => isCommunityOwner() ? /* @__PURE__ */ h(MemberList, { title: "Moderators", members: selectedCommunity.value?.moderators ?? [] }) : /* @__PURE__ */ h(fragment, null), () => /* @__PURE__ */ h(MemberList, { title: "Members", members: selectedCommunity.value?.members ?? [] }));
};

// src/components/community/AdminMenu/AdminMenu.tsx
var loadRequests = async () => {
  const res = !!selectedCommunity.value?.id ? await getCommunityJoinRequests(selectedCommunity.value.id) : [];
  pendingCommunityJoinRequests.value = res ?? [];
};
var handlePendingRequestsClick = () => {
  communityDrawerState.value = {
    title: "Join Requests",
    componentFunc: PendingJoinRequests
  };
  communityDrawerOpen.value = true;
};
var handleManageMembersClick = () => {
  communityDrawerState.value = {
    title: "Manage Members",
    componentFunc: CommunityMemberManager
  };
  communityDrawerOpen.value = true;
};
var AdminMenu = () => {
  const showMenu = createSignal(false);
  const loadingRequests = createSignal(false);
  const totalNotifications = () => pendingCommunityJoinRequests.value.length;
  return /* @__PURE__ */ h("div", { className: "ml-auto", onMounted: loadRequests }, /* @__PURE__ */ h(
    IconButton,
    {
      watch: [showMenu, pendingCommunityJoinRequests, loadingRequests],
      "bind:className": () => `icon-button admin-menu-button ${showMenu.value ? "selected" : ""}`,
      onclick: () => showMenu.value = !showMenu.value,
      "bind:children": true
    },
    /* @__PURE__ */ h(MoreIcon, null),
    () => loadingRequests.value ? /* @__PURE__ */ h(EllipsisLoader, { style: "color:var(--text-color); font-size: .75rem;" }) : totalNotifications() > 0 ? /* @__PURE__ */ h("span", { className: "badge " }, totalNotifications()) : /* @__PURE__ */ h(fragment, null)
  ), /* @__PURE__ */ h("div", { style: "position:relative" }, /* @__PURE__ */ h("div", { className: "admin-menu-wrapper" }, /* @__PURE__ */ h(
    SlideInOut,
    {
      className: "admin-menu",
      watch: showMenu,
      settings: { from: "top" },
      properties: [{ name: "opacity", from: 0, to: 1 }],
      "bind:visible": () => showMenu.value
    },
    /* @__PURE__ */ h("ul", null, /* @__PURE__ */ h("li", null, /* @__PURE__ */ h("a", { onclick: handleManageMembersClick, href: "javascript:void(0)" }, /* @__PURE__ */ h("small", null, "Manage members"))), selectedCommunity.value?.private ? /* @__PURE__ */ h("li", null, /* @__PURE__ */ h(
      "a",
      {
        href: "javascript:void(0)",
        onclick: handlePendingRequestsClick,
        watch: [pendingCommunityJoinRequests, loadingRequests],
        "bind:children": true
      },
      /* @__PURE__ */ h("small", null, "Join Requests"),
      () => loadingRequests.value ? /* @__PURE__ */ h(EllipsisLoader, { style: "color:var(--text-color); font-size: .75rem;" }) : /* @__PURE__ */ h("span", { className: "badge " }, () => pendingCommunityJoinRequests.value.length)
    )) : /* @__PURE__ */ h(fragment, null))
  ))));
};

// src/pages/Community/Page.tsx
function CommunityPage({ params }) {
  if (!params?.url_title)
    return setPath(pathStore, "/communities");
  const showLoginPrompt = () => {
    authModalState.value = {
      title: "Log in to view this community",
      message: "This community is private and you must be a member of the community to view its content.",
      callbackAction: "view-community" /* ViewCommunity */
    };
    authModalOpen.value = true;
  };
  const loadCommunity = async () => {
    const res = await getCommunity(params.url_title);
    if ("message" in res) {
      addNotification({
        type: "error",
        text: res.message
      });
      setPath(pathStore, "/communities");
      return res;
    }
    if (!canViewCommunityData(res)) {
      if (userStore.value) {
        communityJoinModalOpen.value = true;
      } else {
        showLoginPrompt();
      }
    }
    selectedCommunity.value = {
      id: res.id,
      title: res.title,
      url_title: params.url_title,
      description: res.description,
      disabled: res.disabled,
      private: res.private,
      createdAt: res.createdAt,
      memberType: res.memberType,
      members: res.members,
      owners: res.owners,
      posts: res.posts,
      moderators: res.moderators
    };
    return res;
  };
  const canViewCommunityData = (data) => {
    return !data.private || data.memberType && data.memberType !== "guest";
  };
  return /* @__PURE__ */ h("div", null, /* @__PURE__ */ h(Suspense, { promise: loadCommunity, cache: true }, (loading2, data) => {
    if (data && "message" in data)
      return data.message;
    return /* @__PURE__ */ h("div", { className: "page-wrapper" }, /* @__PURE__ */ h("div", { className: "page-title" }, /* @__PURE__ */ h("div", { className: "flex gap align-items-center" }, /* @__PURE__ */ h("h1", { watch: selectedCommunity, "bind:children": true }, () => selectedCommunity.value?.title), isCommunityOwner() ? /* @__PURE__ */ h(IconButton, { onclick: () => communityEditorModalOpen.value = true }, /* @__PURE__ */ h(EditIcon, { color: "var(--primary)" })) : /* @__PURE__ */ h(fragment, null), isCommunityAdmin() ? /* @__PURE__ */ h(AdminMenu, null) : /* @__PURE__ */ h(fragment, null)), /* @__PURE__ */ h("p", { watch: selectedCommunity, "bind:children": true, className: "page-description" }, () => selectedCommunity.value?.description ?? "")), loading2 ? /* @__PURE__ */ h("div", { className: "page-body" }, /* @__PURE__ */ h(DefaultLoader, null)) : canViewCommunityData(data) ? /* @__PURE__ */ h(fragment, null, /* @__PURE__ */ h(CommunityFixedHeader, null), isCommunityOwner() ? /* @__PURE__ */ h(fragment, null, /* @__PURE__ */ h("div", { className: "flex gap" }, /* @__PURE__ */ h(
      Button,
      {
        className: "btn btn-danger hover-animate btn-sm",
        onclick: () => communityDeleteModalOpen.value = true
      },
      "Delete this community"
    ), /* @__PURE__ */ h(
      Button,
      {
        className: "btn btn-primary hover-animate btn-sm",
        onclick: () => communityLeaveModalOpen.value = true
      },
      "Transfer ownership"
    )), /* @__PURE__ */ h("br", null)) : isCommunityMember() ? /* @__PURE__ */ h(fragment, null, /* @__PURE__ */ h("div", null, /* @__PURE__ */ h(
      Button,
      {
        className: "btn btn-danger hover-animate btn-sm",
        onclick: () => communityLeaveModalOpen.value = true
      },
      "Leave this community"
    )), /* @__PURE__ */ h("br", null)) : /* @__PURE__ */ h(fragment, null, " "), /* @__PURE__ */ h("div", { className: "page-body" }, /* @__PURE__ */ h("div", { className: "community-page-inner" }, /* @__PURE__ */ h("section", { className: "flex flex-column community-page-posts" }, /* @__PURE__ */ h("div", { className: "section-title" }, /* @__PURE__ */ h("h3", null, "Posts"), /* @__PURE__ */ h(AddPostButton, null)), /* @__PURE__ */ h(CommunityPosts, { posts: selectedCommunity.value?.posts ?? [] })), /* @__PURE__ */ h(
      "section",
      {
        watch: selectedCommunity,
        "bind:children": true,
        className: "flex flex-column community-page-members"
      },
      () => selectedCommunity.value?.owners && selectedCommunity.value.owners[0] ? /* @__PURE__ */ h(fragment, null, /* @__PURE__ */ h("div", { className: "section-title" }, /* @__PURE__ */ h("h3", null, "Owner")), /* @__PURE__ */ h("div", { className: "flex flex-column mb-3" }, /* @__PURE__ */ h(CommunityMemberCard, { member: selectedCommunity.value.owners[0] }))) : /* @__PURE__ */ h(fragment, null),
      () => selectedCommunity.value?.moderators ? /* @__PURE__ */ h(fragment, null, /* @__PURE__ */ h("div", { className: "section-title" }, /* @__PURE__ */ h("h3", null, "Moderators")), /* @__PURE__ */ h("div", { className: "flex flex-column" }, selectedCommunity.value.moderators.map((member) => /* @__PURE__ */ h(CommunityMemberCard, { member })))) : /* @__PURE__ */ h(fragment, null),
      () => selectedCommunity.value?.members ? /* @__PURE__ */ h(fragment, null, /* @__PURE__ */ h("div", { className: "section-title" }, /* @__PURE__ */ h("h3", null, "Members")), /* @__PURE__ */ h("div", { className: "flex flex-column" }, selectedCommunity.value.members.map((member) => /* @__PURE__ */ h(CommunityMemberCard, { member })))) : /* @__PURE__ */ h(fragment, null)
    )))) : userStore.value ? /* @__PURE__ */ h(
      Button,
      {
        className: "btn btn-primary hover-animate btn-lg",
        onclick: () => communityJoinModalOpen.value = true
      },
      "Join to view this community"
    ) : /* @__PURE__ */ h(Button, { className: "btn btn-primary hover-animate btn-lg", onclick: showLoginPrompt }, "Log in to view this community"));
  }));
}

// src/client/actions/me.ts
var getMyCommunities = async () => {
  try {
    const response = await fetch(`${API_URL}/me/communities`);
    const data = await response.json();
    if (!response.ok)
      throw new Error(data?.message ?? response.statusText);
    return data;
  } catch (error) {
    addNotification({
      type: "error",
      text: error.message
    });
  }
};

// src/components/user/MyCommunities.tsx
var CommunityTypeList = ({
  title,
  communities
}) => {
  return /* @__PURE__ */ h("section", null, /* @__PURE__ */ h("h3", null, title), /* @__PURE__ */ h(CommunityList, { communities }));
};
var MyCommunities = () => {
  return /* @__PURE__ */ h(fragment, null, /* @__PURE__ */ h("h2", null, "My Communities"), /* @__PURE__ */ h(Suspense, { promise: getMyCommunities, cache: true }, (loading2, data) => {
    if (loading2)
      return /* @__PURE__ */ h(DefaultLoader, null);
    if (!data)
      return /* @__PURE__ */ h(fragment, null);
    return /* @__PURE__ */ h(fragment, null, /* @__PURE__ */ h(CommunityTypeList, { title: "Joined", communities: data.member }), /* @__PURE__ */ h(CommunityTypeList, { title: "Owned", communities: data.owned }), /* @__PURE__ */ h(CommunityTypeList, { title: "Moderating", communities: data.moderated }));
  }));
};

// src/client/actions/users.ts
var getUser2 = async (id) => {
  try {
    const res = await fetch(`${API_URL}/users/${id}`);
    if (!res.ok)
      throw new Error("Failed to fetch user");
    return await res.json();
  } catch (error) {
    console.error(error);
  }
};

// src/pages/User/Page.tsx
function UserPage({ params }) {
  if (!params?.userId)
    return setPath(pathStore, "/users");
  if (!Cinnabun.isClient)
    return /* @__PURE__ */ h(fragment, null);
  const isSelfView = () => {
    return params.userId?.toLowerCase() === "me";
  };
  const handleMount = () => {
    if (!userStore.value && isSelfView())
      setPath(pathStore, `/`);
  };
  const loadUser = () => {
    if (isSelfView() && userStore.value) {
      return Promise.resolve({
        user: userStore.value
      });
    } else if (isSelfView()) {
      return Promise.resolve({});
    }
    return getUser2(params.userId);
  };
  return /* @__PURE__ */ h("div", { onMounted: handleMount }, /* @__PURE__ */ h(Suspense, { promise: loadUser }, (loading2, data) => {
    if (loading2)
      return /* @__PURE__ */ h(DefaultLoader, null);
    if (!data?.user)
      return /* @__PURE__ */ h(fragment, null);
    return /* @__PURE__ */ h("h1", null, data?.user.name);
  }), /* @__PURE__ */ h(
    "div",
    {
      watch: userStore,
      "bind:visible": () => !Cinnabun.isClient || params?.userId?.toLowerCase() === "me"
    },
    /* @__PURE__ */ h(MyCommunities, null)
  ));
}

// node_modules/.pnpm/cinnabun@0.1.50/node_modules/cinnabun/src/listeners/KeyboardListener.ts
var KeyboardListener = (props, children) => {
  const { keys, requireAll, onCapture } = props;
  let currentKeys = [];
  let self;
  const triggerCallback = (e) => {
    if (!self || self.children.length === 0) {
      onCapture(currentKeys, e);
      currentKeys = [];
      return;
    }
    for (const c of self.children) {
      if (componentIsTarget(c, e)) {
        onCapture(currentKeys, e);
        currentKeys = [];
        return;
      }
    }
    for (const fc of self.funcComponents) {
      if (componentIsTarget(fc, e)) {
        onCapture(currentKeys, e);
        currentKeys = [];
        return;
      }
    }
  };
  function componentIsTarget(c, e) {
    if (c instanceof Component) {
      if (e.target === c.element)
        return true;
      const childIsTarget = c.children.some(
        (child) => componentIsTarget(child, e)
      );
      if (childIsTarget)
        return true;
      const fChildIsTarget = c.funcComponents.some(
        (child) => componentIsTarget(child, e)
      );
      if (fChildIsTarget)
        return true;
    }
    return false;
  }
  const handleKeyDown = (e) => {
    const { key } = e;
    if (keys.includes(key)) {
      currentKeys.push(key);
      if (!requireAll) {
        return triggerCallback(e);
      }
      if (currentKeys.length === keys.length)
        triggerCallback(e);
    }
  };
  const handleKeyUp = (e) => {
    const { key } = e;
    if (keys.includes(key)) {
      currentKeys.splice(currentKeys.indexOf(key), 1);
    }
  };
  return new Component("", {
    children,
    onMounted(c) {
      self = c;
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
    },
    onUnmounted() {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    }
  });
};

// node_modules/.pnpm/cinnabun@0.1.50/node_modules/cinnabun/src/listeners/NavigationListener.ts
var NavigationListener = (props) => {
  return new Component("", {
    onMounted() {
      if (!Cinnabun.isClient)
        return;
      window.addEventListener("popstate", props.onCapture);
    },
    onUnmounted() {
      if (!Cinnabun.isClient)
        return;
      window.removeEventListener("popstate", props.onCapture);
    }
  });
};

// src/components/modal/Modal.tsx
var defaultGestures = {
  closeOnNavigate: true,
  closeOnClickOutside: true,
  closeOnEscape: true
};
var Modal = ({ visible, toggle, onclose, gestures = {} }, children) => {
  const _gestures = { ...defaultGestures, ...gestures };
  const { closeOnNavigate, closeOnClickOutside, closeOnEscape } = _gestures;
  return /* @__PURE__ */ h(
    FadeInOut,
    {
      properties: [{ name: "opacity", from: 0, to: 1, ms: 350 }],
      className: "modal-outer",
      tabIndex: -1,
      watch: visible,
      "bind:visible": () => {
        if (!visible.value && onclose)
          onclose();
        return visible.value;
      },
      onmouseup: (e) => {
        if (!visible.value || !closeOnClickOutside)
          return;
        const el = e.target;
        if (el.className === "modal-outer")
          toggle();
      }
    },
    /* @__PURE__ */ h(
      Transition,
      {
        className: "modal",
        properties: [{ name: "translate", from: "0 -5rem", to: "0 0", ms: 350 }],
        watch: visible,
        "bind:visible": () => visible.value
      },
      /* @__PURE__ */ h(NavigationListener, { onCapture: () => closeOnNavigate && toggle() }),
      /* @__PURE__ */ h(KeyboardListener, { keys: ["Escape"], onCapture: () => closeOnEscape && toggle() }),
      children
    )
  );
};
var ModalHeader = (props, children) => {
  return /* @__PURE__ */ h("div", { className: "modal-header", ...props }, children);
};
var ModalBody = (props, children) => {
  return /* @__PURE__ */ h("div", { className: "modal-body", ...props }, children);
};
var ModalFooter = (props, children) => {
  return /* @__PURE__ */ h("div", { className: "modal-footer", ...props }, children);
};

// src/components/communities/CommunityCreator.tsx
var CommunityCreator = () => {
  const loading2 = createSignal(false);
  const state = createSignal({
    title: "",
    description: ""
  });
  const resetState = () => {
    state.value = {
      title: "",
      description: ""
    };
  };
  const onModalClose = () => {
    resetState();
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    loading2.value = true;
    const res = await createCommunity(state.value);
    loading2.value = false;
    if (!res)
      return;
    resetState();
    communityCreatorModalOpen.value = false;
    setPath(pathStore, `/communities/${res.id}`);
  };
  const handleChange = (e) => {
    const target = e.target;
    state.value[target.id] = target.value;
    state.notify();
  };
  return /* @__PURE__ */ h(
    Modal,
    {
      onclose: onModalClose,
      visible: communityCreatorModalOpen,
      toggle: () => communityCreatorModalOpen.value = !communityCreatorModalOpen.value
    },
    /* @__PURE__ */ h(ModalHeader, null, /* @__PURE__ */ h("h2", null, "Create Community")),
    /* @__PURE__ */ h(ModalBody, null, /* @__PURE__ */ h("form", { onsubmit: handleSubmit }, /* @__PURE__ */ h("div", { className: "form-group" }, /* @__PURE__ */ h("label", { htmlFor: "title" }, "Name"), /* @__PURE__ */ h(
      "input",
      {
        type: "text",
        id: "title",
        oninput: handleChange,
        watch: state,
        "bind:value": () => state.value.title
      }
    )), /* @__PURE__ */ h("div", { className: "form-group" }, /* @__PURE__ */ h("label", { htmlFor: "description" }, "Description"), /* @__PURE__ */ h(
      "textarea",
      {
        id: "description",
        oninput: handleChange,
        watch: state,
        "bind:value": () => state.value.description
      }
    )), /* @__PURE__ */ h("div", { className: "form-group" }, /* @__PURE__ */ h(
      Button,
      {
        type: "submit",
        className: "btn btn-primary hover-animate",
        watch: [loading2, state],
        "bind:disabled": () => loading2.value || !communityValidation.isCommunityValid(state.value.title, state.value.description)
      },
      "Create",
      /* @__PURE__ */ h(EllipsisLoader, { watch: loading2, "bind:visible": () => loading2.value })
    ))))
  );
};

// src/components/community/PostCreator.tsx
var PostCreator = () => {
  const loading2 = createSignal(false);
  const state = createSignal({
    title: "",
    content: ""
  });
  const createPost = async () => {
    const { title, content } = state.value;
    const { userId } = userStore.value ?? {};
    if (!userId)
      return addNotification({
        type: "error",
        text: "You must be logged in to create a post"
      });
    if (!selectedCommunity.value) {
      return addNotification({
        type: "error",
        text: "No community selected"
      });
    }
    loading2.value = true;
    console.log("Create post", state.value, selectedCommunity, userId);
    const res = await addPost({
      title,
      content,
      communityId: selectedCommunity.value.id,
      ownerId: userId
    });
    if (res.message) {
      loading2.value = false;
      addNotification({
        type: "error",
        text: res.message
      });
      return;
    }
    addNotification({
      type: "success",
      text: "Post created"
    });
    setTimeout(() => {
      window.location.reload();
    }, 1e3);
  };
  const handleChange = (e) => {
    const target = e.target;
    state.value[target.id] = target.value;
    state.notify();
  };
  return /* @__PURE__ */ h(fragment, null, /* @__PURE__ */ h(Modal, { visible: postCreatorModalOpen, toggle: () => postCreatorModalOpen.value = false }, /* @__PURE__ */ h(ModalHeader, null, /* @__PURE__ */ h("h2", null, "Create post")), /* @__PURE__ */ h(ModalBody, null, /* @__PURE__ */ h("div", { className: "form-group" }, /* @__PURE__ */ h("label", { htmlFor: "title" }, "Title"), /* @__PURE__ */ h(
    "input",
    {
      id: "title",
      type: "text",
      "bind:value": () => state.value.title,
      oninput: handleChange
    }
  )), /* @__PURE__ */ h("div", { className: "form-group" }, /* @__PURE__ */ h("label", { htmlFor: "content" }, "Content"), /* @__PURE__ */ h("textarea", { id: "content", "bind:value": () => state.value.content, oninput: handleChange }))), /* @__PURE__ */ h(ModalFooter, null, /* @__PURE__ */ h(
    Button,
    {
      className: "btn btn-secondary hover-animate",
      watch: loading2,
      "bind:disabled": () => loading2.value,
      onclick: () => postCreatorModalOpen.value = false
    },
    "Cancel"
  ), /* @__PURE__ */ h(
    Button,
    {
      className: "btn btn-primary hover-animate",
      watch: [loading2, state],
      "bind:disabled": () => loading2.value || !postValidation.isPostValid(state.value.title, state.value.content),
      onclick: createPost
    },
    "Create post"
  ))));
};

// src/components/community/CommunityEditor.tsx
var CommunityEditor = () => {
  const loading2 = createSignal(false);
  const state = computed(selectedCommunity, () => {
    return {
      title: selectedCommunity.value?.title ?? "",
      description: selectedCommunity.value?.description ?? "",
      private: selectedCommunity.value?.private ?? false
    };
  });
  const saveCommunity = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedCommunity.value)
      return;
    loading2.value = true;
    const res = await updateCommunity({
      ...state.value,
      id: selectedCommunity.value.id
    });
    loading2.value = false;
    if (res) {
      const titleChanged = state.value.title !== selectedCommunity.value.title;
      if (titleChanged) {
        setTimeout(() => {
          window.location.pathname = `/communities/${res.url_title}`;
        }, 1500);
      }
      addNotification({
        text: "Community updated" + (titleChanged ? " - redirecting..." : ""),
        type: "success"
      });
      Object.assign(selectedCommunity.value, res);
      communityEditorModalOpen.value = false;
    }
  };
  const reset = () => {
    state.value = {
      title: selectedCommunity.value?.title ?? "",
      description: selectedCommunity.value?.description ?? "",
      private: selectedCommunity.value?.private ?? false
    };
  };
  const hasChanged = () => {
    return state.value?.title !== selectedCommunity.value?.title || state.value?.description !== selectedCommunity.value?.description || state.value?.private !== selectedCommunity.value?.private;
  };
  const handleChange = (e) => {
    const target = e.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    state.value[target.id] = value;
    state.notify();
  };
  return /* @__PURE__ */ h(
    Modal,
    {
      visible: communityEditorModalOpen,
      toggle: () => communityEditorModalOpen.value = false,
      onclose: reset
    },
    /* @__PURE__ */ h("form", { onsubmit: saveCommunity }, /* @__PURE__ */ h(ModalHeader, null, /* @__PURE__ */ h("h2", null, "Edit Community")), /* @__PURE__ */ h(ModalBody, null, /* @__PURE__ */ h("div", { className: "form-group" }, /* @__PURE__ */ h("label", { htmlFor: "title" }, "Title"), /* @__PURE__ */ h(
      "input",
      {
        id: "title",
        type: "text",
        className: "form-control",
        watch: state,
        "bind:value": () => state.value?.title ?? "",
        oninput: handleChange
      }
    )), /* @__PURE__ */ h("div", { className: "form-group" }, /* @__PURE__ */ h("label", { htmlFor: "desc" }, "Description"), /* @__PURE__ */ h(
      "textarea",
      {
        id: "description",
        className: "form-control",
        watch: state,
        "bind:value": () => state.value?.description ?? "",
        oninput: handleChange
      }
    )), /* @__PURE__ */ h("div", { className: "form-group flex-row" }, /* @__PURE__ */ h("label", { htmlFor: "private" }, "Private"), /* @__PURE__ */ h(
      "input",
      {
        id: "private",
        type: "checkbox",
        className: "form-control",
        watch: state,
        "bind:checked": () => state.value?.private ?? false,
        oninput: handleChange
      }
    ))), /* @__PURE__ */ h(ModalFooter, null, /* @__PURE__ */ h(
      Button,
      {
        type: "button",
        className: "btn btn-secondary hover-animate",
        watch: loading2,
        "bind:disabled": () => loading2.value,
        onclick: () => communityEditorModalOpen.value = false
      },
      "Cancel"
    ), /* @__PURE__ */ h(
      Button,
      {
        watch: [loading2, state],
        "bind:disabled": () => loading2.value || !communityValidation.isCommunityValid(
          state.value?.title ?? "",
          state.value?.description ?? ""
        ) || !hasChanged(),
        className: "btn btn-primary hover-animate"
      },
      "Save",
      /* @__PURE__ */ h(EllipsisLoader, { watch: loading2, "bind:visible": () => loading2.value })
    )))
  );
};

// src/components/community/CommunityJoinPrompt.tsx
var CommunityJoinPrompt = () => {
  const loading2 = createSignal(false);
  const isPrivate = () => selectedCommunity.value?.private ?? false;
  const reloadCommmunity = () => {
    const communityTitle = selectedCommunity.value?.url_title;
    window.history.pushState({}, "", `/communities/${communityTitle}`);
    pathStore.value = `/communities/${communityTitle}`;
    communityJoinModalOpen.value = false;
  };
  const join = async () => {
    const communityTitle = selectedCommunity.value?.url_title;
    if (!communityTitle)
      return addNotification({ type: "error", text: "No community selected." });
    loading2.value = true;
    const res = await joinCommunity(communityTitle);
    loading2.value = false;
    if (!res)
      return;
    switch (res.type) {
      case 2 /* AlreadyJoined */:
        addNotification({ type: "error", text: "You are already a member of this community." });
        reloadCommmunity();
        break;
      case 3 /* Error */:
        addNotification({ type: "error", text: "An error occurred while joining the community." });
        break;
      case 0 /* Success */:
        addNotification({ type: "success", text: "You have joined the community." });
        reloadCommmunity();
        break;
      case 4 /* Banned */:
        addNotification({ type: "error", text: "You are banned from this community." });
        break;
      case 1 /* Pending */:
        addNotification({
          type: "success",
          text: "You have requested to join the community. Sit tight!"
        });
        break;
      default:
        break;
    }
  };
  return /* @__PURE__ */ h(Modal, { toggle: () => communityJoinModalOpen.value = false, visible: communityJoinModalOpen }, /* @__PURE__ */ h(ModalHeader, null, /* @__PURE__ */ h("h2", null, "Join Community")), /* @__PURE__ */ h(ModalBody, null, /* @__PURE__ */ h("div", { className: "flex flex-column gap" }, /* @__PURE__ */ h("p", { className: "text-muted m-0" }, /* @__PURE__ */ h("small", { watch: selectedCommunity, "bind:children": true }, () => isPrivate() ? /* @__PURE__ */ h("i", null, "This private community requires membership to view information.") : /* @__PURE__ */ h("i", null, "Joining this community will allow you to post and comment."))), /* @__PURE__ */ h("div", { className: "flex gap justify-content-between" }, /* @__PURE__ */ h(
    Button,
    {
      watch: loading2,
      "bind:disabled": () => loading2.value,
      onclick: () => communityJoinModalOpen.value = false,
      className: "btn btn-secondary hover-animate"
    },
    "Cancel"
  ), /* @__PURE__ */ h(
    Button,
    {
      watch: loading2,
      "bind:disabled": () => loading2.value,
      onclick: join,
      className: "btn btn-primary hover-animate"
    },
    "Join",
    /* @__PURE__ */ h(EllipsisLoader, { watch: loading2, "bind:visible": () => loading2.value })
  )))));
};

// src/components/icons/auth/GoogleIcon.tsx
var GoogleIcon = () => {
  return /* @__PURE__ */ h("svg", { width: "1rem", viewBox: "0 0 16 16", xmlns: "http://www.w3.org/2000/svg", fill: "none" }, /* @__PURE__ */ h(
    "path",
    {
      fill: "#4285F4",
      d: "M14.9 8.161c0-.476-.039-.954-.121-1.422h-6.64v2.695h3.802a3.24 3.24 0 01-1.407 2.127v1.75h2.269c1.332-1.22 2.097-3.02 2.097-5.15z"
    }
  ), /* @__PURE__ */ h(
    "path",
    {
      fill: "#34A853",
      d: "M8.14 15c1.898 0 3.499-.62 4.665-1.69l-2.268-1.749c-.631.427-1.446.669-2.395.669-1.836 0-3.393-1.232-3.952-2.888H1.85v1.803A7.044 7.044 0 008.14 15z"
    }
  ), /* @__PURE__ */ h(
    "path",
    {
      fill: "#FBBC04",
      d: "M4.187 9.342a4.17 4.17 0 010-2.68V4.859H1.849a6.97 6.97 0 000 6.286l2.338-1.803z"
    }
  ), /* @__PURE__ */ h(
    "path",
    {
      fill: "#EA4335",
      d: "M8.14 3.77a3.837 3.837 0 012.7 1.05l2.01-1.999a6.786 6.786 0 00-4.71-1.82 7.042 7.042 0 00-6.29 3.858L4.186 6.66c.556-1.658 2.116-2.89 3.952-2.89z"
    }
  ));
};

// src/components/icons/auth/GithubIcon.tsx
var GithubIcon = () => {
  return /* @__PURE__ */ h(
    "svg",
    {
      width: "1rem",
      viewBox: "0 -0.5 24 24",
      id: "meteor-icon-kit__regular-github",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg"
    },
    /* @__PURE__ */ h(
      "path",
      {
        "fill-rule": "evenodd",
        "clip-rule": "evenodd",
        d: "M12.2047 0.00001C6.56031 -0.005731 1.74628 4.08615 0.842541 9.6577C-0.061195 15.2293 3.2126 20.6331 8.56941 22.4118C9.14823 22.5177 9.35294 22.1577 9.35294 21.8541C9.35294 21.5506 9.35294 20.8588 9.35294 19.8988C6.14117 20.5977 5.46353 18.3529 5.46353 18.3529C5.25046 17.6572 4.79779 17.0595 4.18588 16.6659C3.14823 15.96 4.27059 15.96 4.27059 15.96C5.00761 16.0641 5.65578 16.5014 6.02823 17.1459C6.34368 17.7179 6.87393 18.1406 7.50179 18.3208C8.12965 18.5009 8.8034 18.4236 9.37411 18.1059C9.41842 17.5252 9.66876 16.9794 10.08 16.5671C7.5247 16.2777 4.84235 15.2894 4.84235 10.92C4.82481 9.7786 5.24688 8.67412 6.02117 7.8353C5.67632 6.84285 5.71662 5.7571 6.13412 4.79295C6.13412 4.79295 7.10117 4.48236 9.29647 5.97177C11.1816 5.45419 13.1713 5.45419 15.0565 5.97177C17.2518 4.48236 18.2118 4.79295 18.2118 4.79295C18.6351 5.74689 18.6854 6.82486 18.3529 7.81412C19.1272 8.65294 19.5493 9.7574 19.5318 10.8988C19.5318 15.3177 16.8424 16.2847 14.28 16.5459C14.8359 17.1047 15.1218 17.8774 15.0635 18.6635C15.0635 20.2024 15.0635 21.4447 15.0635 21.8188C15.0635 22.1929 15.2682 22.4824 15.8541 22.3694C21.1473 20.5447 24.3569 15.1728 23.4554 9.6469C22.5539 4.1211 17.8034 0.04779 12.2047 0.00001z",
        fill: "#758CA3"
      }
    )
  );
};

// src/components/auth/AuthModal.tsx
var AuthModalProviderList = () => {
  const options = [
    {
      title: "Google",
      icon: GoogleIcon
    },
    {
      title: "Github",
      icon: GithubIcon
    }
  ];
  const handleOptionClick = (option) => {
    window.location.href = `/login/${option.title.toLowerCase()}`;
  };
  return /* @__PURE__ */ h("div", { className: "flex gap flex-column text-center" }, options.map((option) => /* @__PURE__ */ h(
    "a",
    {
      href: `/login/${option.title.toLowerCase()}`,
      className: "btn flex gap-sm p-3 auth-provider shadow",
      onclick: (e) => {
        e.preventDefault();
        handleOptionClick(option);
      }
    },
    /* @__PURE__ */ h(option.icon, null),
    /* @__PURE__ */ h("small", null, "Continue with ", option.title)
  )));
};
var AuthModal = () => {
  return /* @__PURE__ */ h(Modal, { visible: authModalOpen, toggle: () => authModalOpen.value = false }, /* @__PURE__ */ h(ModalHeader, null, /* @__PURE__ */ h("h4", { className: "m-0" }, () => authModalState.value.title)), /* @__PURE__ */ h(ModalBody, { style: "line-height:1.3rem" }, /* @__PURE__ */ h("small", { className: "text-muted m-0" }, /* @__PURE__ */ h("i", null, () => authModalState.value.message)), /* @__PURE__ */ h("br", null), /* @__PURE__ */ h("br", null), /* @__PURE__ */ h("div", null, /* @__PURE__ */ h(AuthModalProviderList, null))), /* @__PURE__ */ h(ModalFooter, null, /* @__PURE__ */ h(
    Button,
    {
      className: "btn btn-secondary hover-animate",
      onclick: () => authModalOpen.value = false
    },
    "Cancel"
  )));
};

// src/components/communities/CommunitySearch.tsx
var inputState = createSignal("");
var loading = createSignal(false);
var results = createSignal(null);
var CommunitySearch = () => {
  let inputEl = null;
  const handleChange = (e) => {
    const target = e.target;
    inputState.value = target.value;
  };
  const onMounted = (self) => {
    inputEl = self.element;
  };
  const focusSearchInput = (e) => {
    const kbEvnt = e;
    if (kbEvnt.metaKey || kbEvnt.ctrlKey) {
      e.preventDefault();
      inputEl?.focus();
    }
  };
  return /* @__PURE__ */ h("div", { className: "community-search" }, /* @__PURE__ */ h(KeyboardListener, { keys: ["k"], onCapture: (_, e) => focusSearchInput(e) }), /* @__PURE__ */ h(KeyboardListener, { keys: ["Escape"], onCapture: () => inputEl?.blur() }), /* @__PURE__ */ h("div", { className: "input-wrapper" }, /* @__PURE__ */ h(
    "input",
    {
      type: "text",
      watch: inputState,
      "bind:value": () => inputState.value,
      oninput: handleChange,
      placeholder: "Search for a community",
      onMounted
    }
  ), /* @__PURE__ */ h(EllipsisLoader, { className: "loader", watch: loading, "bind:visible": () => loading.value })), /* @__PURE__ */ h(ResultsList, null));
};
var ResultsList = () => {
  let unsub = void 0;
  let timeout = void 0;
  const onMounted = () => {
    unsub = inputState.subscribe(async (val) => {
      if (val.length === 0) {
        results.value = null;
        return;
      }
      if (val.length < 3)
        return;
      if (val === results.value?.search)
        return;
      if (timeout)
        window.clearTimeout(timeout);
      loading.value = true;
      timeout = window.setTimeout(async () => {
        const data = await getCommunitySearch(val);
        if (!data)
          return;
        results.value = data;
        loading.value = false;
      }, 250);
    });
  };
  const onUnmounted = () => {
    if (unsub)
      unsub();
  };
  return /* @__PURE__ */ h("ul", { onMounted, onUnmounted, watch: results, "bind:children": true }, () => results.value ? results.value.communities.map((community) => /* @__PURE__ */ h(ResultItem, { community })) : /* @__PURE__ */ h(fragment, null));
};
var ResultItem = ({ community }) => {
  const handleNavigate = () => {
    loading.value = false;
    results.value = null;
    inputState.value = "";
  };
  return /* @__PURE__ */ h("li", { onclick: handleNavigate }, /* @__PURE__ */ h(Link, { store: pathStore, to: `/communities/${community.url_title}`, className: "community-link" }, community.title));
};

// src/components/icons/UsersIcon.tsx
var UsersIcon = () => {
  return /* @__PURE__ */ h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "1rem",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    },
    /* @__PURE__ */ h("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
    /* @__PURE__ */ h("circle", { cx: "9", cy: "7", r: "4" }),
    /* @__PURE__ */ h("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
    /* @__PURE__ */ h("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })
  );
};

// src/components/icons/GlobeIcon.tsx
var GlobeIcon = () => {
  return /* @__PURE__ */ h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "1rem",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    },
    /* @__PURE__ */ h("circle", { cx: "12", cy: "12", r: "10" }),
    /* @__PURE__ */ h("line", { x1: "2", x2: "22", y1: "12", y2: "12" }),
    /* @__PURE__ */ h("path", { d: "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" })
  );
};

// src/components/MenuButton.tsx
var MenuButton = ({ className }) => {
  return /* @__PURE__ */ h(
    Button,
    {
      className: `icon-button menu-button ${className}`,
      onclick: () => sidebarOpen.value = !sidebarOpen.value
    },
    /* @__PURE__ */ h(MenuIcon, null)
  );
};

// src/components/sidebar/Sidebar.tsx
var onBeforeNavigate = () => {
  sidebarOpen.value = false;
  return true;
};
var Sidebar = () => {
  return /* @__PURE__ */ h(fragment, null, /* @__PURE__ */ h(
    Transition,
    {
      className: "sidebar-background",
      properties: [{ name: "opacity", from: "0", to: "1", ms: 300 }],
      watch: sidebarOpen,
      "bind:visible": () => sidebarOpen.value,
      onclick: () => sidebarOpen.value = false
    }
  ), /* @__PURE__ */ h(
    SlideInOut,
    {
      settings: { from: "left" },
      className: "sidebar-container",
      watch: sidebarOpen,
      "bind:visible": () => sidebarOpen.value
    },
    /* @__PURE__ */ h(NavigationListener, { onCapture: () => sidebarOpen.value = false }),
    /* @__PURE__ */ h("header", { className: "sidebar-header" }, /* @__PURE__ */ h("div", { className: "sidebar-header-item" }, /* @__PURE__ */ h(MenuButton, null))),
    /* @__PURE__ */ h("section", { className: "sidebar-content" }, /* @__PURE__ */ h("div", { className: "sidebar-content-item" }, /* @__PURE__ */ h(
      Link,
      {
        to: "/communities",
        onBeforeNavigate,
        store: pathStore,
        className: "sidebar-link"
      },
      /* @__PURE__ */ h(GlobeIcon, null),
      /* @__PURE__ */ h("span", { className: "collapse-text" }, "Communities")
    )), /* @__PURE__ */ h("div", { className: "sidebar-content-item" }, /* @__PURE__ */ h(
      Link,
      {
        onBeforeNavigate,
        to: "/users",
        store: pathStore,
        className: "sidebar-link"
      },
      /* @__PURE__ */ h(UsersIcon, null),
      /* @__PURE__ */ h("span", { className: "collapse-text" }, "People")
    ))),
    /* @__PURE__ */ h("section", { className: "sidebar-footer" }, /* @__PURE__ */ h("div", { className: "sidebar-footer-item" }, /* @__PURE__ */ h(
      Link,
      {
        onBeforeNavigate,
        to: "/settings",
        store: pathStore,
        className: "sidebar-link"
      },
      /* @__PURE__ */ h("span", { className: "collapse-text" }, "Settings")
    )))
  ));
};

// src/components/drawer/Drawer.tsx
var defaultGestures2 = {
  closeOnNavigate: true,
  closeOnClickOutside: true,
  closeOnEscape: true
};
var Drawer = ({ visible, side, toggle, onclose, gestures = {} }, children) => {
  const _gestures = { ...defaultGestures2, ...gestures };
  const { closeOnNavigate, closeOnClickOutside, closeOnEscape } = _gestures;
  return /* @__PURE__ */ h(
    FadeInOut,
    {
      properties: [{ name: "opacity", from: 0, to: 1, ms: 350 }],
      className: "drawer-outer",
      tabIndex: -1,
      watch: visible,
      "bind:visible": () => {
        if (!visible.value && onclose)
          onclose();
        return visible.value;
      },
      onmouseup: (e) => {
        if (!visible.value || !closeOnClickOutside)
          return;
        const el = e.target;
        if (el.className === "drawer-outer")
          toggle();
      }
    },
    /* @__PURE__ */ h(
      SlideInOut,
      {
        className: `drawer drawer-${side} flex flex-column`,
        watch: visible,
        "bind:visible": () => visible.value,
        settings: { from: side }
      },
      /* @__PURE__ */ h(NavigationListener, { onCapture: () => closeOnNavigate && toggle() }),
      /* @__PURE__ */ h(KeyboardListener, { keys: ["Escape"], onCapture: () => closeOnEscape && toggle() }),
      children
    )
  );
};
var DrawerHeader = (props, children) => {
  return /* @__PURE__ */ h("div", { className: "drawer-header", ...props }, children);
};
var DrawerBody = (props, children) => {
  return /* @__PURE__ */ h("div", { className: "drawer-body flex-grow", ...props }, children);
};

// src/components/community/CommunityDrawer.tsx
var CommunityDrawer = () => {
  return /* @__PURE__ */ h(
    Drawer,
    {
      visible: communityDrawerOpen,
      side: "right",
      toggle: () => communityDrawerOpen.value = false
    },
    /* @__PURE__ */ h(DrawerHeader, null, /* @__PURE__ */ h("h2", { className: "m-0" }, () => communityDrawerState.value.title)),
    /* @__PURE__ */ h(DrawerBody, null, () => communityDrawerState.value.componentFunc ? communityDrawerState.value.componentFunc() : /* @__PURE__ */ h(fragment, null))
  );
};

// src/components/community/CommunityLeaveConfirmation.tsx
var CommunityLeaveConfirmation = () => {
  const loading2 = createSignal(false);
  const reloadCommmunity = () => {
    const communityTitle = selectedCommunity.value?.url_title;
    window.history.pushState({}, "", `/communities/${communityTitle}`);
    pathStore.value = `/communities/${communityTitle}`;
    communityLeaveModalOpen.value = false;
  };
  const leave = async () => {
    const communityId = selectedCommunity.value?.id;
    if (!communityId)
      return addNotification({ type: "error", text: "No community selected." });
    loading2.value = true;
    const res = await leaveCommunity(communityId);
    loading2.value = false;
    if (!res)
      return;
    switch (res.type) {
      case 0 /* Success */:
        addNotification({ type: "success", text: "You have left the community." });
        break;
      case 2 /* Error */:
        addNotification({ type: "error", text: "An error occurred while leaving the community." });
        break;
      case 1 /* NotAMember */:
        addNotification({ type: "error", text: "You're already not a member of the community." });
        break;
      default:
        console.error("Unhandled leave result type:", res.type);
        break;
    }
    reloadCommmunity();
  };
  return /* @__PURE__ */ h(Modal, { toggle: () => communityLeaveModalOpen.value = false, visible: communityLeaveModalOpen }, /* @__PURE__ */ h(ModalHeader, null, /* @__PURE__ */ h("h2", null, "Leave Community")), /* @__PURE__ */ h(ModalBody, null, /* @__PURE__ */ h("p", null, "Are you really sure you want to leave this community?")), /* @__PURE__ */ h(ModalFooter, null, /* @__PURE__ */ h(
    Button,
    {
      type: "button",
      className: "btn btn-secondary hover-animate",
      watch: loading2,
      "bind:disabled": () => loading2.value,
      onclick: () => communityLeaveModalOpen.value = false
    },
    "Cancel"
  ), /* @__PURE__ */ h(
    Button,
    {
      type: "button",
      className: "btn btn-danger hover-animate",
      watch: loading2,
      "bind:disabled": () => loading2.value,
      onclick: leave
    },
    "Leave",
    /* @__PURE__ */ h(EllipsisLoader, { watch: loading2, "bind:visible": () => loading2.value })
  )));
};

// src/components/community/CommunityDeleteConfirmation.tsx
var CommunityDeleteConfirmation = () => {
  const loading2 = createSignal(false);
  const confirmText = createSignal("");
  const handleDelete = async () => {
    if (confirmText.value !== selectedCommunity.value.title) {
      addNotification({
        text: "Confirmation text does not match!",
        type: "error"
      });
      return;
    }
    if (!selectedCommunity.value?.id) {
      addNotification({
        text: "No community selected!",
        type: "error"
      });
      return;
    }
    loading2.value = true;
    const res = await deleteCommunity(selectedCommunity.value?.id);
    communityDeleteModalOpen.value = false;
    setPath(pathStore, "/communities");
    loading2.value = false;
    if (!res)
      return;
    addNotification({
      text: "Community deleted.",
      type: "success"
    });
  };
  return /* @__PURE__ */ h(
    Modal,
    {
      visible: communityDeleteModalOpen,
      toggle: () => communityDeleteModalOpen.value = false
    },
    /* @__PURE__ */ h(ModalHeader, null, /* @__PURE__ */ h("h2", null, "Delete Community")),
    /* @__PURE__ */ h(ModalBody, { watch: selectedCommunity, "bind:children": true }, () => communityHasMembers() ? /* @__PURE__ */ h(fragment, null, /* @__PURE__ */ h("i", null, "This community has members. Consider transferring ownership instead!")) : /* @__PURE__ */ h(fragment, null), /* @__PURE__ */ h("p", null, /* @__PURE__ */ h("small", null, "Are you really sure you want to delete this community and everything within it?", " ", /* @__PURE__ */ h("b", null, "This can't be undone!"))), /* @__PURE__ */ h("small", null, "Type ", /* @__PURE__ */ h("b", null, () => selectedCommunity.value?.title), " to confirm."), /* @__PURE__ */ h(
      "input",
      {
        type: "text",
        className: "form-control",
        watch: confirmText,
        "bind:value": () => confirmText.value,
        oninput: (e) => confirmText.value = e.target.value
      }
    )),
    /* @__PURE__ */ h(ModalFooter, null, /* @__PURE__ */ h(
      Button,
      {
        type: "button",
        watch: loading2,
        "bind:disabled": () => loading2.value,
        className: "btn btn-secondary hover-animate",
        onclick: () => communityDeleteModalOpen.value = false
      },
      "Cancel"
    ), /* @__PURE__ */ h(
      Button,
      {
        type: "button",
        watch: [confirmText, loading2],
        "bind:disabled": () => confirmText.value !== selectedCommunity.value?.title || loading2.value,
        className: "btn btn-danger hover-animate",
        onclick: handleDelete
      },
      "Delete",
      /* @__PURE__ */ h(EllipsisLoader, { watch: loading2, "bind:visible": () => loading2.value })
    ))
  );
};

// src/App.tsx
var Header = () => /* @__PURE__ */ h("header", null, /* @__PURE__ */ h(MenuButton, { className: "hide-sm" }), /* @__PURE__ */ h(Link, { to: "/", store: pathStore }, /* @__PURE__ */ h("div", { id: "logo" }, "Project Zeta")), /* @__PURE__ */ h(CommunitySearch, null), /* @__PURE__ */ h(fragment, null, /* @__PURE__ */ h("ul", { id: "main-header-menu", className: "none flex-sm" }, /* @__PURE__ */ h("li", null, /* @__PURE__ */ h(Link, { to: "/communities", store: pathStore }, /* @__PURE__ */ h("small", null, "Communities"))), /* @__PURE__ */ h("li", null, /* @__PURE__ */ h(Link, { to: "/users", store: pathStore }, /* @__PURE__ */ h("small", null, "Users"))))), /* @__PURE__ */ h(UserAvatar, null));
var App = () => {
  return /* @__PURE__ */ h(fragment, null, /* @__PURE__ */ h(Header, null), /* @__PURE__ */ h("div", { className: "app-main" }, /* @__PURE__ */ h(Sidebar, null), /* @__PURE__ */ h("main", { className: "container" }, /* @__PURE__ */ h(Router, { store: pathStore }, /* @__PURE__ */ h(Route, { path: "/", component: Home }), /* @__PURE__ */ h(Route, { path: "/communities", component: Communities }), /* @__PURE__ */ h(Route, { path: "/communities/:url_title", component: CommunityPage }), /* @__PURE__ */ h(Route, { path: "/users", component: /* @__PURE__ */ h("div", null, "Users") }), /* @__PURE__ */ h(Route, { path: "/users/:userId", component: UserPage })))), /* @__PURE__ */ h(Portal, null, /* @__PURE__ */ h(NotificationTray, null), /* @__PURE__ */ h(PostCreator, null), /* @__PURE__ */ h(CommunityCreator, null), /* @__PURE__ */ h(CommunityEditor, null), /* @__PURE__ */ h(CommunityJoinPrompt, null), /* @__PURE__ */ h(AuthModal, null), /* @__PURE__ */ h(CommunityDrawer, null), /* @__PURE__ */ h(CommunityLeaveConfirmation, null), /* @__PURE__ */ h(CommunityDeleteConfirmation, null)));
};

// src/client/liveSocket.ts
var LiveSocket = class {
  socket;
  loading = createSignal(true);
  constructor(url) {
    this.socket = new WebSocket(url);
    this.socket.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (!("type" in data))
          throw new Error("received invalid message");
        this.handleMessage(data);
      } catch (error) {
        console.error(error);
      }
    };
    this.socket.onopen = () => {
      setInterval(() => {
        if (this.socket.readyState !== this.socket.OPEN)
          return;
        this.socket.send(JSON.stringify({ type: "ping" }));
      }, 3e3);
    };
    this.load();
  }
  async load() {
    this.loading.value = false;
  }
  handleMessage(message) {
    switch (message.type) {
      case "ping":
        return;
      default:
        return;
    }
  }
};
var createLiveSocket = () => {
  const { hostname, port } = window.location;
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return new LiveSocket(`${protocol}://${hostname}:${port}/ws`);
};

// src/client/index.ts
var env = "development";
if ("__cbData" in window) {
  try {
    Cinnabun.registerRuntimeServices(createLiveSocket());
    Hydration.hydrate(Document(App), window.__cbData);
  } catch (error) {
    console.error(error);
  }
  if (env === "development") {
    const evtHandler = new EventSource("/sse");
    let didConnect = false;
    evtHandler.addEventListener("handshake", () => {
      didConnect = true;
    });
    evtHandler.addEventListener("error", (evt) => {
      const connIsReset = didConnect && evtHandler.readyState === 0;
      if (connIsReset)
        location.reload();
      console.log("evtHandler err evt", evt);
    });
  }
}
//# sourceMappingURL=index.js.map
