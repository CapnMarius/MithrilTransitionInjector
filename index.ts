import * as m from "mithril";

export interface IAttrs {
  group?: string;
  delay?: number;
  pause?: number;
  depth?: number | boolean;
  currentdepth?: number;
}

export interface ITagAttrs {
  transition: string;
  transitiongroup?: string;
  transitiondelay?: number;
  transitionpause?: number;
}

interface IGroup {
  iteration: number;
  lastStamp: number;
}

const groups: { [key: string]: IGroup } = {};
function getIteratedDelay(group: string = "main", delay: number = 0): number {
  if (groups[group] === undefined) {
    groups[group] = { iteration: 0, lastStamp: 0 };
  }
  const g: IGroup = groups[group];
  g.iteration++;
  if (g.lastStamp + 50 < Date.now()) {
    g.iteration = 0;
  }
  g.lastStamp = Date.now();
  return g.iteration * delay;
}

function getClassName(...classNames: any[]): string {
  return classNames
    .filter((x) => typeof x === "string")
    .map((x) => x.trim())
    .join(" ");
}

function getComputedStyleNumber(dom: Element, property: string): number {
  const style: string | null = getComputedStyle(dom)[property];
  return style ? parseFloat(style) : 0;
}

function getTransitionDuration(dom: Element): number {
  return (
    getComputedStyleNumber(dom, "transitionDelay") +
    getComputedStyleNumber(dom, "transitionDuration")
  ) * 1000;
}

function injectAttrsObj(node: m.Vnode<any>) {
  if (!node.attrs) {
    node.attrs = {};
  }
}

function injectClassName(node: m.Vnode<any>, ...classNames: string[]) {
  node.attrs.className = getClassName(node.attrs.className, node.attrs.transition, ...classNames);
}

function injectOninit(node: m.Vnode<any>, attrs: IAttrs) {
  const oninit = node.attrs.oninit;
  node.attrs.oninit = (v: m.Vnode<any>) => {
    injectClassName(v, "before");
    if (typeof oninit === "function") {
      oninit.call(v.state, v);
    }
  };
}

function injectOnbefore(node: m.Vnode<any>, attrs: IAttrs) {
  const oncreate = node.attrs.oncreate;
  node.attrs.oncreate = (v: m.VnodeDOM<any>) => {
    const intervalDelay = getIteratedDelay(
      typeof node.attrs.transitiongroup === "string" ? node.attrs.transitiongroup : attrs.group,
      typeof node.attrs.transitiondelay === "number" ? node.attrs.transitiondelay : attrs.delay,
    );
    const pause = typeof node.attrs.transitionpause === "number" ? node.attrs.transitionpause : attrs.pause;
    setTimeout(() => v.dom.classList.remove("before"), (intervalDelay || 20) + (pause || 0));
    if (typeof oncreate === "function") {
      oncreate.call(v.state, v);
    }
  };
}

function injectOnbeforeremove(node: m.Vnode<any>, attrs: IAttrs) {
  const onbeforeremove = node.attrs.onbeforeremove;
  node.attrs.onbeforeremove = (v: m.VnodeDOM<any>) => {
    const promises: Array<Promise<any>> = [];
    const intervalDelay = getIteratedDelay(
      typeof node.attrs.transitiongroup === "string" ? node.attrs.transitiongroup : attrs.group,
      typeof node.attrs.transitiondelay === "number" ? node.attrs.transitiondelay : attrs.delay,
    );
    const delay = getTransitionDuration(v.dom);
    setTimeout(() => v.dom.classList.add("after"), intervalDelay);
    promises.push(new Promise((resolve) => setTimeout(() => resolve(), delay + intervalDelay)));
    if (typeof onbeforeremove === "function") {
      promises.push(onbeforeremove.call(v.state, v));
    }
    return Promise.all(promises);
  };
}

function injectAttrs(nodes: Array<m.Vnode<any>>, attrs: IAttrs) {
  nodes.forEach((node) => {
    injectAttrsObj(node);
    injectClassName(node);
    injectOninit(node, attrs);
    injectOnbefore(node, attrs);
    injectOnbeforeremove(node, attrs);
  });
}

function searchTransitionTags(node: m.Children, attrs: IAttrs, depth: number = -1) {
  depth++;
  let tags: Array<m.Vnode<any>> = [];

  if (typeof node !== "object" || node === null) {
    return tags;
  }

  if (attrs.depth !== true && ((attrs.depth === undefined && depth > 1) || (attrs.depth !== undefined && depth > attrs.depth))) {
    return tags;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      tags = [...tags, ...searchTransitionTags(child, attrs, depth)];
    }
    return tags;
  }

  if (node.tag === "#" || node.tag === "<") {
    return tags;
  }

  if (node.tag === "[") {
    tags = [...tags, ...searchTransitionTags(node.children, attrs, depth - 1)];
    return tags;
  }

  if (node.attrs && node.attrs.transition) {
    tags.push(node);
  }

  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      tags = [...tags, ...searchTransitionTags(child, attrs, depth)];
    }
  }

  if (typeof node.tag === "function") {
    handleComponentTag(node, attrs, depth);
  }

  return tags;
}

function injectPassedComponentAttrs(v: m.Vnode<any>, attrs: ITagAttrs) {
  if (Array.isArray(v.children)) {
    v.children.forEach((child: m.Children) => {
      if (typeof child === "object" &&
        child !== null &&
        !Array.isArray(child) &&
        v.attrs &&
        child.attrs &&
        child.attrs.className.indexOf(attrs.transition) === -1) {
        child.attrs.className = getClassName(child.attrs.className, attrs.transition, "before");
      }
    });
  }
}

const T = () => {
  const tags: Array<m.Vnode<any>> = [];

  return {
    view(v: m.Vnode<IAttrs>) {
      this.tags = searchTransitionTags(v.children, v.attrs, v.attrs.currentdepth);
      injectAttrs(this.tags, v.attrs);
      return v.children;
    },
    onbeforeremove(v: m.VnodeDOM<IAttrs>) {
      const promises: Array<Promise<any>> = [];
      for (const node of this.tags) {
        promises.push(node.attrs.onbeforeremove.call(node.state, node));
      }
      return Promise.all(promises);
    },
  };
};

function handleComponentTag(node: m.Vnode<any>, attrs: IAttrs, depth?: number) {
  try {
    if (typeof node.tag === "function") {
      inject(node.tag, attrs, depth);
    }
  } catch (err) {
    console.error(err);
  }
}

function overrideAttrs(attrs: IAttrs, tagAttrs: ITagAttrs): IAttrs {
  const nextAttrs = { ...attrs };
  if (!tagAttrs) {
    return nextAttrs;
  }
  if (tagAttrs.transitiongroup !== undefined) {
    nextAttrs.group = tagAttrs.transitiongroup;
  }
  if (tagAttrs.transitiondelay !== undefined) {
    nextAttrs.delay = tagAttrs.transitiondelay;
  }
  if (tagAttrs.transitionpause !== undefined) {
    nextAttrs.pause = tagAttrs.transitionpause;
  }
  return nextAttrs;
}

export const inject = (component: any, attrs: IAttrs, depth?: number) => {
  if (!component.prototype || !component.prototype.view) {
    throw new Error("Component not supported, no view method found");
  }
  if (component.prototype.injected) {
    return component;
  }
  component.prototype.injected = true;

  const view = component.prototype.view;
  component.prototype.view = (v: m.Vnode<ITagAttrs>) => {
    const mergedAttrs = overrideAttrs(attrs, v.attrs);
    const t = m(T, { ...mergedAttrs, currentdepth: depth }, view.call(v.state, v));
    if (v.attrs) {
      injectPassedComponentAttrs(t, v.attrs);
    }
    return t;
  };

  return component;
};

export default T;
