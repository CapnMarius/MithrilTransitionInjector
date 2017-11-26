"use strict";
exports.__esModule = true;
var groups = {};
function getIteratedDelay(group, delay, pause) {
    if (group === void 0) { group = "main"; }
    if (delay === void 0) { delay = 0; }
    if (pause === void 0) { pause = 0; }
    if (delay === 0) {
        return delay + pause;
    }
    if (groups[group] === undefined) {
        groups[group] = { iteration: 0, lastStamp: 0 };
    }
    var g = groups[group];
    g.iteration++;
    var first = g.lastStamp === 0;
    if (g.lastStamp + 100 < Date.now()) {
        g.iteration = 0;
    }
    else {
        first = true;
    }
    g.lastStamp = Date.now();
    return (g.iteration * delay) + (first ? pause : 0);
}
function getCSSTransitionDuration(dom) {
    return (parseFloat(getComputedStyle(dom).transitionDelay) +
        parseFloat(getComputedStyle(dom).transitionDuration)) * 1000;
}
function isValidVnodeDOM(v) {
    return v.tag !== "#" && v.tag !== "[" && v.tag !== "<";
}
function getClassName(list, prefix) {
    var arrList = Array.from(list) || [];
    var index = arrList.findIndex(function (x) { return x.indexOf(prefix) === 0; });
    return arrList[index];
}
function onCreateFn(dom, attrs) {
    var className = getClassName(dom.classList, attrs.transitionprefix + "-");
    dom.setAttribute("data-" + attrs.transitionprefix, className);
    var delay = getIteratedDelay(attrs.group, attrs.delay, attrs.pause);
    setTimeout(function () { return dom.classList.remove(className); }, delay || requestAnimationFrame);
}
function onBeforeRemoveFn(dom, attrs) {
    var className = dom.getAttribute("data-" + attrs.transitionprefix);
    var delay = getIteratedDelay(attrs.group, attrs.delay, attrs.pause);
    setTimeout(function () { return dom.classList.add(className + "-after"); }, delay);
    var duration = getCSSTransitionDuration(dom);
    return new Promise(function (resolve) { return setTimeout(resolve, duration + delay); });
}
function getGroupDOMNodes(child, transitionprefix, deep, depth) {
    if (deep === void 0) { deep = 1; }
    if (depth === void 0) { depth = 0; }
    var nodes = [];
    if (depth >= deep) {
        return nodes;
    }
    if (Array.isArray(child)) {
        child.forEach(function (c) {
            nodes = nodes.concat(getGroupDOMNodes(c, transitionprefix, deep, depth));
        });
    }
    else {
        depth++;
        if (child && child.attrs && child.attrs.className && child.attrs.className.split(" ").indexOf(transitionprefix) !== -1) {
            nodes.push(child);
        }
        if (Array.isArray(child.children)) {
            child.children.forEach(function (c) {
                nodes = nodes.concat(getGroupDOMNodes(c, transitionprefix, deep, depth));
            });
        }
    }
    return nodes;
}
function childrenAttrsInjector(children, attrs) {
    if (Array.isArray(children)) {
        children.forEach(attrsInjector(attrs));
    }
}
function attrsInjector(attrs) {
    return function (v) {
        if (typeof v.attrs !== "object" || v.attrs === null) {
            v.attrs = {};
        }
        var attachedOncreateFn = v.attrs.oncreate;
        v.attrs.oncreate = function () {
            onCreateFn(v.dom, attrs);
            if (typeof attachedOncreateFn === "function") {
                attachedOncreateFn(v);
            }
        };
        var attachedOnbeforeremoveFn = v.attrs.onbeforeremove;
        v.attrs.onbeforeremove = function () {
            var promises = [];
            promises.push(onBeforeRemoveFn(v.dom, attrs));
            if (typeof attachedOnbeforeremoveFn === "function") {
                promises.push(attachedOnbeforeremoveFn(v));
            }
            return Promise.all(promises);
        };
    };
}
function onAllOnbeforeremoveFns(children) {
    var promises = [];
    if (Array.isArray(children)) {
        children.forEach(function (c) {
            if (c !== undefined && typeof c.attrs === "object" && c.attrs !== null && typeof c.attrs.onbeforeremove === "function") {
                promises.push(c.attrs.onbeforeremove());
            }
        });
    }
    return Promise.all(promises);
}
var TransitionInjector = function (v) {
    var children = [];
    var inject = function (v) {
        children = getGroupDOMNodes(v.children, v.attrs.transitionprefix, v.attrs.deep);
        childrenAttrsInjector(children, v.attrs);
    };
    return {
        oninit: inject,
        onbeforeupdate: inject,
        view: function (v) {
            return v.children;
        },
        onbeforeremove: function (v) {
            return onAllOnbeforeremoveFns(children);
        }
    };
};
exports["default"] = TransitionInjector;
