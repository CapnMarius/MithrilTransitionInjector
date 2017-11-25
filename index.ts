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

function attrsInjector(group: string, delay: number): (v: VnodeDOM) => void {
  return (v: VnodeDOM) => {
    if (typeof v.attrs !== "object" || v.attrs === null) {
      v.attrs = {};
    }

    const attachedOncreateFn = v.attrs.oncreate;
    v.attrs.oncreate = (): void => {
      const iterateDelay: number = getIteratedDelay(group, delay);
      setTimeout(() => v.dom.classList.add("oncreate"), iterateDelay || requestAnimationFrame);
      if (typeof attachedOncreateFn === "function") {
        attachedOncreateFn(v);
      }
    };

    const attachedOnbeforeremoveFn = v.attrs.onbeforeremove;
    v.attrs.onbeforeremove = (): Promise<any> => {
      const promises: Array<Promise<any>> = [];
      const iterateDelay: number = getIteratedDelay(group, delay);
      setTimeout(() => {
        v.dom.classList.add("onbeforeremove");
        v.dom.classList.remove("oncreate");
      }, iterateDelay);
      const transitionDuration: number = getCSSTransitionDuration(v.dom);
      promises.push(new Promise((resolve) => setTimeout(resolve, transitionDuration + iterateDelay)));
      if (typeof attachedOnbeforeremoveFn === "function") {
        promises.push(attachedOnbeforeremoveFn(v));
      }
      return Promise.all(promises);
    };
  };
}

function flattenAndFilterChildren(children: VnodeAny[]): VnodeAny[] {
  if (!Array.isArray(children)) {
    return [];
  }
  return children.reduce((flatten: VnodeAny[], c: VnodeDOM) => {
    if (c.tag === "[") {
      return flatten.concat(c.children as VnodeAny[]);
    } else if (isValidVnodeDOM(c)) {
      flatten.push(c);
    }
    return flatten;
  }, []);
}

function inject(children: m.ChildArrayOrPrimitive, group: string, delay: number): void {
  if (Array.isArray(children)) {
    children = flattenAndFilterChildren(children as VnodeAny[]);
    children.forEach(attrsInjector(group, delay));
  }
}

function execAllOnbeforeremoveFns(children: m.ChildArrayOrPrimitive, group: string, delay: number): Promise<any> {
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

export default (v: Vnode) => {
  return {
    view: (v: Vnode) => {
      inject(v.children, v.attrs.group, v.attrs.delay);
      return v.children;
    },
    onbeforeremove: (v: VnodeDOM) => {
      return execAllOnbeforeremoveFns(v.children, v.attrs.group, v.attrs.delay);
    },
  };
};
