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
  currentdepth?: number;
  onbeforeremove?: any;
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

function getExecutionDelay(node: m.Vnode<any>, attrs: IAttrs) {
  const group = typeof node.attrs.transitiongroup === "string" ? node.attrs.transitiongroup : attrs.group;
  const delay = typeof node.attrs.transitiondelay === "number" ? node.attrs.transitiondelay : attrs.delay;
  return delay * getExecutionOrderIndex(group);
}

function injectAttrsObj(node: m.Vnode<any>) {
  if (!node.attrs) {
    node.attrs = {};
  }
}

function injectAttrsClassName(node: m.Vnode<any>, ...classNames: string[]) {
  node.attrs.className = getClassName(node.attrs.className, node.attrs.transition, ...classNames);
}

function injectAttrsOninit(node: m.Vnode<any>, attrs: IAttrs) {
  const oninit = node.attrs.oninit;
  node.attrs.oninit = (v: m.Vnode<any>) => {
    if (typeof node.tag === "function" && typeof node.tag.prototype.oninit === "function") {
      node.tag.prototype.oninit.call(v.state, v);
    }
    if (typeof oninit === "function") {
      oninit.call(v.state, v);
    }
    v.attrs.className = getClassName(v.attrs.className, "before");
  };
}

function injectAttrsOnbefore(node: m.Vnode<any>, attrs: IAttrs) {
  const oncreate = node.attrs.oncreate;
  node.attrs.oncreate = (v: m.VnodeDOM<any>) => {
    if (typeof node.tag === "function" && typeof node.tag.prototype.oncreate === "function") {
      node.tag.prototype.oncreate.call(node.state, node);
    }
    if (typeof oncreate === "function") {
      oncreate.call(v.state, v);
    }

    const intervalDelay = getExecutionDelay(node, attrs);

    const pause = typeof node.attrs.transitionpause === "number" ? node.attrs.transitionpause : attrs.pause;
    setTimeout(() => v.dom.classList.remove("before"), (intervalDelay || 20) + (pause || 0));
  };
}

function injectAttrsOnbeforeremove(node: m.Vnode<any>, attrs: IAttrs) {
  const onbeforeremove = node.attrs.onbeforeremove;
  node.attrs.onbeforeremove = (v: m.VnodeDOM<any>) => {
    const promises: Array<Promise<any>> = [];
    if (typeof node.tag === "function" && typeof node.tag.prototype.onbeforeremove === "function") {
      promises.push(node.tag.prototype.onbeforeremove.call(v.state, v));
    }
    if (typeof onbeforeremove === "function") {
      promises.push(onbeforeremove.call(v.state, v));
    }

    const intervalDelay = getExecutionDelay(node, attrs);

    const transitionDuration = getTransitionDuration(v.dom);
    setTimeout(() => v.dom.classList.add("after"), intervalDelay);
    promises.push(new Promise((resolve) => setTimeout(() => resolve(), transitionDuration + intervalDelay)));
    return Promise.all(promises);
  };
}

const groupExecutionOrder = {};
function getExecutionOrderIndex(group: string = "main"): number {
  const now = Date.now();
  if (groupExecutionOrder[group] === undefined) {
    groupExecutionOrder[group] = { t: now, i: 0 };
    return 0;
  }

  if (groupExecutionOrder[group].t + 50 > now) {
    groupExecutionOrder[group].i++;
  } else {
    groupExecutionOrder[group].i = 0;
  }
  groupExecutionOrder[group].t = now;
  return groupExecutionOrder[group].i;
}

function injectAttrs(nodes: Array<m.Vnode<any>>, attrs: IAttrs) {
  nodes.forEach((node, i) => {
    injectAttrsObj(node);
    injectAttrsClassName(node);
    injectAttrsOninit(node, attrs);
    injectAttrsOnbefore(node, attrs);
    injectAttrsOnbeforeremove(node, attrs);
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

  if (typeof node.tag === "function") {
    inject(node, attrs, depth);
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

  return tags;
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

function injectIntoInstance(v: m.Vnode<any>, parent: m.Vnode<any> | undefined, attrs: IAttrs, depth?: number) {
  const tags = searchTransitionTags(v, attrs, depth);
  if (parent && parent.attrs && parent.attrs.transition) {
    v.attrs = { ...parent.attrs, ...v.attrs };
    tags.push(v);
  }
  injectAttrs(tags, attrs);
  return v;
}

export const inject = (component: any, attrs: IAttrs, depth?: number) => {
  let parent = undefined;
  if (component.tag) {
    parent = component;
    component = component.tag;
  }
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
    const t = view.call(v.state, v);
    injectIntoInstance(t, parent, mergedAttrs, depth);
    return t;
  };

  return component;
};

export default T;
