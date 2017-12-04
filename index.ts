import * as m from "mithril";

export interface IAttrs {
  group?: string;
  delay?: number;
  depth?: number;
  oncreate: (v: m.VnodeDOM<IAttrs>) => void;
  onbeforeremove: (v: m.VnodeDOM<IAttrs>) => Promise<any>;
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
      oninit(v);
    }
  };
}

function injectOnbefore(node: m.Vnode<any>, attrs: IAttrs) {
  const oncreate = node.attrs.oncreate;
  node.attrs.oncreate = (v: m.VnodeDOM<any>) => {
    const intervalDelay = getIteratedDelay(attrs.group, attrs.delay);
    setTimeout(() => {
      v.dom.classList.remove("before");
    }, intervalDelay || 20);
    if (typeof oncreate === "function") {
      oncreate(v);
    }
  };
}

function injectOnbeforeremove(node: m.Vnode<any>, attrs: IAttrs) {
  const onbeforeremove = node.attrs.onbeforeremove;
  node.attrs.onbeforeremove = (v: m.VnodeDOM<any>) => {
    const promises = [];
    const intervalDelay = getIteratedDelay(attrs.group, attrs.delay);
    const delay = getTransitionDuration(v.dom);
    setTimeout(() => v.dom.classList.add("after"), intervalDelay);
    promises.push(new Promise((resolve) => setTimeout(() => resolve(), delay + intervalDelay)));
    if (typeof onbeforeremove === "function") {
      promises.push(onbeforeremove(v));
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
  if (attrs.depth !== undefined && depth > attrs.depth) {
    return tags;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      tags = [...tags, ...searchTransitionTags(child, attrs, depth)];
    }
  } else {
    if (node.attrs && node.attrs.transition) {
      tags.push(node);
    }

    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        tags = [...tags, ...searchTransitionTags(child, attrs, depth)];
      }
    }

    if (typeof node.tag === "function") {
      let view;
      if (node.tag.prototype && typeof node.tag.prototype.view === "function") {
        view = node.tag.prototype.view;
      } else {
        try {
          view = (node.tag as any)(node).view;
        } catch (err) {
          view = undefined;
        }
      }
      if (typeof view === "function") {
        const child: m.Vnode<any> = view(node);
        if (searchTransitionTags(child, attrs, depth).length > 0) {
          node.attrs.transition = child.attrs.transition;
          tags.push(node);
        }
      }
    }
  }
  return tags;
}

export default class T {
  private tags: Array<m.Vnode<any>> = [];

  public view(v: m.Vnode<IAttrs>) {
    const node = m("[", v.attrs, v.children);
    this.tags = searchTransitionTags(node, v.attrs);
    injectAttrs(this.tags, v.attrs);
    return node;
  }

  public onbeforeremove(v: m.VnodeDOM<IAttrs>) {
    const promises = [];
    for (const node of this.tags) {
      promises.push(node.attrs.onbeforeremove(node));
    }
    return Promise.all(promises);
  }
}
