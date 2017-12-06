"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
exports.__esModule = true;
var m = require("mithril");
var groups = {};
function getIteratedDelay(group, delay) {
    if (group === void 0) { group = "main"; }
    if (delay === void 0) { delay = 0; }
    if (groups[group] === undefined) {
        groups[group] = { iteration: 0, lastStamp: 0 };
    }
    var g = groups[group];
    g.iteration++;
    if (g.lastStamp + 50 < Date.now()) {
        g.iteration = 0;
    }
    g.lastStamp = Date.now();
    return g.iteration * delay;
}
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
function injectAttrsObj(node) {
    if (!node.attrs) {
        node.attrs = {};
    }
}
function injectClassName(node) {
    var classNames = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        classNames[_i - 1] = arguments[_i];
    }
    node.attrs.className = getClassName.apply(void 0, [node.attrs.className, node.attrs.transition].concat(classNames));
}
function injectOninit(node, attrs) {
    var oninit = node.attrs.oninit;
    node.attrs.oninit = function (v) {
        injectClassName(v, "before");
        if (typeof oninit === "function") {
            oninit.call(v.state, v);
        }
    };
}
function injectOnbefore(node, attrs) {
    var oncreate = node.attrs.oncreate;
    node.attrs.oncreate = function (v) {
        var intervalDelay = getIteratedDelay(typeof node.attrs.transitiongroup === "string" ? node.attrs.transitiongroup : attrs.group, typeof node.attrs.transitiondelay === "number" ? node.attrs.transitiondelay : attrs.delay);
        var pause = typeof node.attrs.transitionpause === "number" ? node.attrs.transitionpause : attrs.pause;
        setTimeout(function () { return v.dom.classList.remove("before"); }, (intervalDelay || 20) + (pause || 0));
        if (typeof oncreate === "function") {
            oncreate.call(v.state, v);
        }
    };
}
function injectOnbeforeremove(node, attrs) {
    var onbeforeremove = node.attrs.onbeforeremove;
    node.attrs.onbeforeremove = function (v) {
        var promises = [];
        var intervalDelay = getIteratedDelay(typeof node.attrs.transitiongroup === "string" ? node.attrs.transitiongroup : attrs.group, typeof node.attrs.transitiondelay === "number" ? node.attrs.transitiondelay : attrs.delay);
        var delay = getTransitionDuration(v.dom);
        setTimeout(function () { return v.dom.classList.add("after"); }, intervalDelay);
        promises.push(new Promise(function (resolve) { return setTimeout(function () { return resolve(); }, delay + intervalDelay); }));
        if (typeof onbeforeremove === "function") {
            promises.push(onbeforeremove.call(v.state, v));
        }
        return Promise.all(promises);
    };
}
function injectAttrs(nodes, attrs) {
    nodes.forEach(function (node) {
        injectAttrsObj(node);
        injectClassName(node);
        injectOninit(node, attrs);
        injectOnbefore(node, attrs);
        injectOnbeforeremove(node, attrs);
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
    if (typeof node.tag === "function") {
        handleComponentTag(node, attrs, depth);
    }
    return tags;
}
function injectPassedComponentAttrs(v, attrs) {
    if (Array.isArray(v.children)) {
        v.children.forEach(function (child) {
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
        }
    };
};
function handleComponentTag(node, attrs, depth) {
    try {
        if (typeof node.tag === "function") {
            exports.inject(node.tag, attrs, depth);
        }
    }
    catch (err) {
        console.error(err);
    }
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
exports.inject = function (component, attrs, depth) {
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
        var t = m(T, __assign({}, mergedAttrs, { currentdepth: depth }), view.call(v.state, v));
        if (v.attrs) {
            injectPassedComponentAttrs(t, v.attrs);
        }
        return t;
    };
    return component;
};
exports["default"] = T;
