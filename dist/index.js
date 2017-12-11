"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var T = function () {
    var tags = [];
    return {
        view: function (v) {
            this.tags = searchTransitionTags(v.children, v.attrs, v.attrs.currentdepth);
            injectAttrs(this.tags, v.attrs);
            return v.children;
        },
        onbeforeremove: function (v) {
            var promises = [];
            for (var _i = 0, _a = this.tags; _i < _a.length; _i++) {
                var node = _a[_i];
                promises.push(node.attrs.onbeforeremove.call(node.state, node));
            }
            return Promise.all(promises);
        },
    };
};
function getClassName() {
    var classNames = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        classNames[_i] = arguments[_i];
    }
    return classNames
        .filter(function (x) { return typeof x === "string"; })
        .map(function (x) { return x.trim(); })
        .join(" ");
}
function getComputedStyleNumber(dom, property) {
    var style = getComputedStyle(dom)[property];
    return style ? parseFloat(style) : 0;
}
function getTransitionDuration(dom) {
    return (getComputedStyleNumber(dom, "transitionDelay") +
        getComputedStyleNumber(dom, "transitionDuration")) * 1000;
}
function getExecutionDelay(node, attrs) {
    var group = typeof node.attrs.transitiongroup === "string" ? node.attrs.transitiongroup : attrs.group;
    var delay = typeof node.attrs.transitiondelay === "number" ? node.attrs.transitiondelay : attrs.delay;
    return delay * getExecutionOrderIndex(group);
}
function injectAttrsObj(node) {
    if (!node.attrs) {
        node.attrs = {};
    }
}
function injectAttrsClassName(node) {
    var classNames = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        classNames[_i - 1] = arguments[_i];
    }
    node.attrs.className = getClassName.apply(void 0, [node.attrs.className, node.attrs.transition].concat(classNames));
}
function injectAttrsOninit(node, attrs) {
    var oninit = node.attrs.oninit;
    node.attrs.oninit = function (v) {
        if (typeof node.tag === "function" && typeof node.tag.prototype.oninit === "function") {
            node.tag.prototype.oninit.call(v.state, v);
        }
        if (typeof oninit === "function") {
            oninit.call(v.state, v);
        }
        v.attrs.className = getClassName(v.attrs.className, "before");
    };
}
function injectAttrsOnbefore(node, attrs) {
    var oncreate = node.attrs.oncreate;
    node.attrs.oncreate = function (v) {
        if (typeof node.tag === "function" && typeof node.tag.prototype.oncreate === "function") {
            node.tag.prototype.oncreate.call(node.state, node);
        }
        if (typeof oncreate === "function") {
            oncreate.call(v.state, v);
        }
        var intervalDelay = getExecutionDelay(node, attrs);
        var pause = typeof node.attrs.transitionpause === "number" ? node.attrs.transitionpause : attrs.pause;
        setTimeout(function () { return v.dom.classList.remove("before"); }, (intervalDelay || 20) + (pause || 0));
    };
}
function injectAttrsOnbeforeremove(node, attrs) {
    var onbeforeremove = node.attrs.onbeforeremove;
    node.attrs.onbeforeremove = function (v) {
        var promises = [];
        if (typeof node.tag === "function" && typeof node.tag.prototype.onbeforeremove === "function") {
            promises.push(node.tag.prototype.onbeforeremove.call(v.state, v));
        }
        if (typeof onbeforeremove === "function") {
            promises.push(onbeforeremove.call(v.state, v));
        }
        var intervalDelay = getExecutionDelay(node, attrs);
        var transitionDuration = getTransitionDuration(v.dom);
        setTimeout(function () { return v.dom.classList.add("after"); }, intervalDelay);
        promises.push(new Promise(function (resolve) { return setTimeout(function () { return resolve(); }, transitionDuration + intervalDelay); }));
        return Promise.all(promises);
    };
}
var groupExecutionOrder = {};
function getExecutionOrderIndex(group) {
    if (group === void 0) { group = "main"; }
    var now = Date.now();
    if (groupExecutionOrder[group] === undefined) {
        groupExecutionOrder[group] = { t: now, i: 0 };
        return 0;
    }
    if (groupExecutionOrder[group].t + 50 > now) {
        groupExecutionOrder[group].i++;
    }
    else {
        groupExecutionOrder[group].i = 0;
    }
    groupExecutionOrder[group].t = now;
    return groupExecutionOrder[group].i;
}
function injectAttrs(nodes, attrs) {
    nodes.forEach(function (node, i) {
        injectAttrsObj(node);
        injectAttrsClassName(node);
        injectAttrsOninit(node, attrs);
        injectAttrsOnbefore(node, attrs);
        injectAttrsOnbeforeremove(node, attrs);
    });
}
function searchTransitionTags(node, attrs, depth) {
    if (depth === void 0) { depth = -1; }
    depth++;
    var tags = [];
    if (typeof node !== "object" || node === null) {
        return tags;
    }
    if (attrs.depth !== true && ((attrs.depth === undefined && depth > 1) || (attrs.depth !== undefined && depth > attrs.depth))) {
        return tags;
    }
    if (Array.isArray(node)) {
        for (var _i = 0, node_1 = node; _i < node_1.length; _i++) {
            var child = node_1[_i];
            tags = tags.concat(searchTransitionTags(child, attrs, depth));
        }
        return tags;
    }
    if (typeof node.tag === "function") {
        exports.inject(node, attrs, depth);
        return tags;
    }
    if (node.tag === "#" || node.tag === "<") {
        return tags;
    }
    if (node.tag === "[") {
        tags = tags.concat(searchTransitionTags(node.children, attrs, depth - 1));
        return tags;
    }
    if (node.attrs && node.attrs.transition) {
        tags.push(node);
    }
    if (node.children && Array.isArray(node.children)) {
        for (var _a = 0, _b = node.children; _a < _b.length; _a++) {
            var child = _b[_a];
            tags = tags.concat(searchTransitionTags(child, attrs, depth));
        }
    }
    return tags;
}
function overrideAttrs(attrs, tagAttrs) {
    var nextAttrs = __assign({}, attrs);
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
function injectIntoInstance(v, parent, attrs, depth) {
    var tags = searchTransitionTags(v, attrs, depth);
    if (parent && parent.attrs && parent.attrs.transition) {
        v.attrs = __assign({}, parent.attrs, v.attrs);
        tags.push(v);
    }
    injectAttrs(tags, attrs);
    return v;
}
exports.inject = function (component, attrs, depth) {
    var parent = undefined;
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
    var view = component.prototype.view;
    component.prototype.view = function (v) {
        var mergedAttrs = overrideAttrs(attrs, v.attrs);
        var t = view.call(v.state, v);
        injectIntoInstance(t, parent, mergedAttrs, depth);
        return t;
    };
    return component;
};
exports.default = T;
