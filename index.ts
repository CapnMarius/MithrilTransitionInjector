import * as m from "mithril";

interface IGroup {
  iteration: number;
  lastStamp: number;
}

export interface IAttrs {
  transitionprefix: string;
  group?: string;
  delay?: number;
  pause?: number;
  deep?: number;
}

type Vnode = m.Vnode<any, any>;
type VnodeDOM = m.VnodeDOM<any, any>;
type Key = string | number;

const groups: { [key: string]: IGroup } = {};

function getIteratedDelay(group: string = "main", delay: number = 0, pause: number = 0): number {
  if (delay === 0) {
    return delay + pause;
  }

  if (groups[group] === undefined) {
    groups[group] = { iteration: 0, lastStamp: 0 };
  }

  const g: IGroup = groups[group];

  g.iteration++;
  let first: boolean = g.lastStamp === 0;
  if (g.lastStamp + 100 < Date.now()) {
    g.iteration = 0;
  } else {
    first = true;
  }
  g.lastStamp = Date.now();
  return (g.iteration * delay) + (first ? pause : 0);
}

function getCSSTransitionDuration(dom: Element): number {
  return (
    parseFloat(getComputedStyle(dom).transitionDelay) +
    parseFloat(getComputedStyle(dom).transitionDuration)
  ) * 1000;
}

function isValidVnodeDOM(v: VnodeDOM): boolean {
  return v.tag !== "#" && v.tag !== "[" && v.tag !== "<";
}

function getClassName(list: DOMTokenList, prefix: string): string {
  const arrList: string[] = Array.from(list) || [];
  const index: number = arrList.findIndex((x: string) => x.indexOf(prefix) === 0);
  return arrList[index];
}

function onCreateFn(dom: Element, attrs: IAttrs): void {
  const className: string = getClassName(dom.classList, attrs.transitionprefix + "-");
  dom.setAttribute(`data-${attrs.transitionprefix}`, className);
  const delay: number = getIteratedDelay(attrs.group, attrs.delay, attrs.pause);
  setTimeout(() => dom.classList.remove(className), delay || requestAnimationFrame);
}

function onBeforeRemoveFn(dom: Element, attrs: IAttrs): Promise<any> {
  const className: string = dom.getAttribute(`data-${attrs.transitionprefix}`);
  const delay: number = getIteratedDelay(attrs.group, attrs.delay, attrs.pause);
  setTimeout(() => dom.classList.add(`${className}-after`), delay);
  const duration: number = getCSSTransitionDuration(dom);
  return new Promise((resolve) => setTimeout(resolve, duration + delay));
}

function getGroupDOMNodes(child: Vnode | Vnode[], transitionprefix: string, deep: number = 1, depth: number = 0): Vnode[] {
  let nodes = [];

  if (depth >= deep) {
    return nodes;
  }

  if (Array.isArray(child)) {
    child.forEach((c: Vnode | Vnode[]) => {
      nodes = nodes.concat(getGroupDOMNodes(c, transitionprefix, deep, depth));
    });
  } else {
    depth ++;
    if (child && child.attrs && child.attrs.className && child.attrs.className.split(" ").indexOf(transitionprefix) !== -1) {
      nodes.push(child);
    }

    if (Array.isArray(child.children)) {
      child.children.forEach((c: Vnode | Vnode[]) => {
        nodes = nodes.concat(getGroupDOMNodes(c, transitionprefix, deep, depth));
      });
    }
  }

  return nodes;
}

function childrenAttrsInjector(children: m.ChildArrayOrPrimitive, attrs: IAttrs): void {
  if (Array.isArray(children)) {
    children.forEach(attrsInjector(attrs));
  }
}

function attrsInjector(attrs: IAttrs): (v: VnodeDOM) => void {
  return (v: VnodeDOM) => {
    if (typeof v.attrs !== "object" || v.attrs === null) {
      v.attrs = {};
    }

    const attachedOncreateFn = v.attrs.oncreate;
    v.attrs.oncreate = (): void => {
      onCreateFn(v.dom, attrs);
      if (typeof attachedOncreateFn === "function") {
        attachedOncreateFn(v);
      }
    };

    const attachedOnbeforeremoveFn = v.attrs.onbeforeremove;
    v.attrs.onbeforeremove = (): Promise<any> => {
      const promises: Array<Promise<any>> = [];
      promises.push(onBeforeRemoveFn(v.dom, attrs));
      if (typeof attachedOnbeforeremoveFn === "function") {
        promises.push(attachedOnbeforeremoveFn(v));
      }
      return Promise.all(promises);
    };
  };
}

function onAllOnbeforeremoveFns(children: m.ChildArrayOrPrimitive): Promise<any> {
  const promises: Array<Promise<any>> = [];
  if (Array.isArray(children)) {
    children.forEach((c: Vnode) => {
      if (c !== undefined && typeof c.attrs === "object" && c.attrs !== null && typeof c.attrs.onbeforeremove === "function") {
        promises.push(c.attrs.onbeforeremove());
      }
    });
  }
  return Promise.all(promises);
}

const TransitionInjector = (v: m.Vnode<IAttrs>) => {
  let children = [];
  const inject = (v: m.Vnode<IAttrs>) => {
    children = getGroupDOMNodes(v.children as Vnode[], v.attrs.transitionprefix, v.attrs.deep);
    childrenAttrsInjector(children, v.attrs);
  };
  return {
    oninit: inject,
    onbeforeupdate: inject,
    view: (v: m.Vnode<IAttrs>) => {
      return v.children;
    },
    onbeforeremove: (v: m.VnodeDOM<IAttrs>) => {
      return onAllOnbeforeremoveFns(children);
    },
  };
};

export default TransitionInjector;
