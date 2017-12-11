/// <reference types="mithril" />
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
declare const T: () => {
    view(v: m.Vnode<IAttrs, m.Lifecycle<IAttrs, {}>>): m.ChildArrayOrPrimitive;
    onbeforeremove(v: m.VnodeDOM<IAttrs, m.Lifecycle<IAttrs, {}>>): Promise<any[]>;
};
export declare const inject: (component: any, attrs: IAttrs, depth?: number) => any;
export default T;
