"use strict";
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
            oninit(v);
        }
    };
}
function injectOnbefore(node, attrs) {
    var oncreate = node.attrs.oncreate;
    node.attrs.oncreate = function (v) {
        var intervalDelay = getIteratedDelay(attrs.group, attrs.delay);
        setTimeout(function () {
            v.dom.classList.remove("before");
        }, intervalDelay || 20);
        if (typeof oncreate === "function") {
            oncreate(v);
        }
    };
}
function injectOnbeforeremove(node, attrs) {
    var onbeforeremove = node.attrs.onbeforeremove;
    node.attrs.onbeforeremove = function (v) {
        var promises = [];
        var intervalDelay = getIteratedDelay(attrs.group, attrs.delay);
        var delay = getTransitionDuration(v.dom);
        setTimeout(function () { return v.dom.classList.add("after"); }, intervalDelay);
        promises.push(new Promise(function (resolve) { return setTimeout(function () { return resolve(); }, delay + intervalDelay); }));
        if (typeof onbeforeremove === "function") {
            promises.push(onbeforeremove(v));
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
    if (attrs.depth !== undefined && depth > attrs.depth) {
        return tags;
    }
    if (Array.isArray(node)) {
        for (var _i = 0, node_1 = node; _i < node_1.length; _i++) {
            var child = node_1[_i];
            tags = tags.concat(searchTransitionTags(child, attrs, depth));
        }
    }
    else {
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
            var view = void 0;
            if (node.tag.prototype && typeof node.tag.prototype.view === "function") {
                view = node.tag.prototype.view;
            }
            else {
                try {
                    view = node.tag(node).view;
                }
                catch (err) {
                    view = undefined;
                }
            }
            if (typeof view === "function") {
                var child = view(node);
                if (searchTransitionTags(child, attrs, depth).length > 0) {
                    node.attrs.transition = child.attrs.transition;
                    tags.push(node);
                }
            }
        }
    }
    return tags;
}
var T = (function () {
    function T() {
        this.tags = [];
    }
    T.prototype.view = function (v) {
        var node = m("[", v.attrs, v.children);
        this.tags = searchTransitionTags(node, v.attrs);
        injectAttrs(this.tags, v.attrs);
        return node;
    };
    T.prototype.onbeforeremove = function (v) {
        var promises = [];
        for (var _i = 0, _a = this.tags; _i < _a.length; _i++) {
            var node = _a[_i];
            promises.push(node.attrs.onbeforeremove(node));
        }
        return Promise.all(promises);
    };
    return T;
}());
exports["default"] = T;
