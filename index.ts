import * as m from "mithril";

interface IGroup {
  iteration: number;
  lastStamp: number;
}

type Vnode = m.Vnode<any, any>;
type VnodeDOM = m.VnodeDOM<any, any>;
type VnodeAny = Vnode | VnodeDOM;
type Key = string | number;

const groups: { [key: string]: IGroup } = {};
function getIteratedDelay(group: string = "main", delay: number = 0): number {
  if (delay === 0) {
    return 0;
  }

  if (groups[group] === undefined) {
    groups[group] = { iteration: 0, lastStamp: 0 };
  }

  const g: IGroup = groups[group];

  g.iteration++;
  if (g.lastStamp + 100 < Date.now()) {
    g.iteration = 0;
  }
  g.lastStamp = Date.now();
  return g.iteration * delay;
}

export function getCSSTransitionDuration(dom: Element): number {
  return (
    parseFloat(getComputedStyle(dom).transitionDelay) +
    parseFloat(getComputedStyle(dom).transitionDuration)
  ) * 1000;
}

export function isValidVnodeDOM(v: VnodeDOM): boolean {
  return v.tag !== "#" && v.tag !== "[" && v.tag !== "<";
}

function attrsInjector(attrs: IAttrs): (v: VnodeDOM) => void {
  const parentAttrs: IAttrs = attrs;

  return (v: VnodeDOM) => {
    if (typeof v.attrs !== "object" || v.attrs === null) {
      v.attrs = {};
    }

    const attachedOncreateFn = v.attrs.oncreate;
    v.attrs.oncreate = (): void => {
      const delay: number = getIteratedDelay(parentAttrs.group, parentAttrs.delay);
      setTimeout(() => v.dom.classList.add("oncreate"), delay || requestAnimationFrame);
      if (typeof attachedOncreateFn === "function") {
        attachedOncreateFn(v);
      }
    };

    const attachedOnbeforeremoveFn = v.attrs.onbeforeremove;
    v.attrs.onbeforeremove = (): Promise<any> => {
      const promises: Array<Promise<any>> = [];
      const delay: number = getIteratedDelay(parentAttrs.group, attrs.delay);
      setTimeout(() => {
        v.dom.classList.add("onbeforeremove");
        v.dom.classList.remove("oncreate");
      }, delay);
      const transitionDuration: number = getCSSTransitionDuration(v.dom);
      promises.push(new Promise((resolve) => setTimeout(resolve, transitionDuration + delay)));
      if (typeof attachedOnbeforeremoveFn === "function") {
        promises.push(attachedOnbeforeremoveFn(v));
      }
      return Promise.all(promises);
    };
  };
}

function getFirstDOMNodes(child: VnodeAny | VnodeAny[]): VnodeAny[] {
  if (!child) {
    return;
  }
  if (Array.isArray(child)) {
    return child.reduce((total: VnodeAny[], c: VnodeAny) => total.concat(getFirstDOMNodes(c)), []).filter((n: VnodeAny) => n !== undefined);
  }
  if (typeof child.tag === "string" && isValidVnodeDOM(child as VnodeDOM)) {
    return [child];
  }
  if (child.children) {
    return getFirstDOMNodes(child.children as VnodeAny[]);
  }
}

function inject(children: m.ChildArrayOrPrimitive, attrs: IAttrs): void {
  if (Array.isArray(children)) {
    children.forEach(attrsInjector(attrs));
  }
}

function execAllOnbeforeremoveFns(children: m.ChildArrayOrPrimitive): Promise<any> {
  const promises: Array<Promise<any>> = [];
  if (Array.isArray(children)) {
    children.forEach((c: VnodeAny) => {
      if (c !== undefined && typeof c.attrs === "object" && c.attrs !== null && typeof c.attrs.onbeforeremove === "function") {
        promises.push(c.attrs.onbeforeremove());
      }
    });
  }
  return Promise.all(promises);
}

export interface IAttrs {
  group?: string;
  delay?: number;
}

export default (v: m.Vnode<IAttrs>) => {
  return {
    view: (v: m.Vnode<IAttrs>) => {
      inject(getFirstDOMNodes(v.children as VnodeAny[]), v.attrs);
      return v.children;
    },
    onbeforeremove: (v: m.VnodeDOM<IAttrs>) => {
      return execAllOnbeforeremoveFns(getFirstDOMNodes(v.children as VnodeAny[]));
    },
  };
};
