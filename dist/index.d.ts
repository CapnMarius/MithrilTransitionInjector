/// <reference types="mithril" />
import * as m from "mithril";
export interface IAttrs {
    group?: string;
    delay?: number;
    depth?: number;
    oncreate: (v: m.VnodeDOM<IAttrs>) => void;
    onbeforeremove: (v: m.VnodeDOM<IAttrs>) => Promise<any>;
}
export default class T {
    private tags;
    view(v: m.Vnode<IAttrs>): m.Vnode<any, any>;
    onbeforeremove(v: m.VnodeDOM<IAttrs>): Promise<any[]>;
}
