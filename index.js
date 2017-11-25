"use strict";
exports.__esModule = true;
var groups = {};
function getIteratedDelay(group, delay) {
    if (group === void 0) { group = "main"; }
    if (delay === void 0) { delay = 0; }
    if (delay === 0) {
        return 0;
    }
    if (groups[group] === undefined) {
        groups[group] = { iteration: 0, lastStamp: 0 };
    }
    var g = groups[group];
    g.iteration++;
    if (g.lastStamp + 100 < Date.now()) {
        g.iteration = 0;
    }
    g.lastStamp = Date.now();
    return g.iteration * delay;
}
function getCSSTransitionDuration(dom) {
    return (parseFloat(getComputedStyle(dom).transitionDelay) +
        parseFloat(getComputedStyle(dom).transitionDuration)) * 1000;
}
exports.getCSSTransitionDuration = getCSSTransitionDuration;
function isValidVnodeDOM(v) {
    return v.tag !== "#" && v.tag !== "[" && v.tag !== "<";
}
exports.isValidVnodeDOM = isValidVnodeDOM;
function attrsInjector(group, delay) {
    return function (v) {
        if (typeof v.attrs !== "object" || v.attrs === null) {
            v.attrs = {};
        }
        var attachedOncreateFn = v.attrs.oncreate;
        v.attrs.oncreate = function () {
            var iterateDelay = getIteratedDelay(group, delay);
            setTimeout(function () { return v.dom.classList.add("oncreate"); }, iterateDelay || requestAnimationFrame);
            if (typeof attachedOncreateFn === "function") {
                attachedOncreateFn(v);
            }
        };
        var attachedOnbeforeremoveFn = v.attrs.onbeforeremove;
        v.attrs.onbeforeremove = function () {
            var promises = [];
            var iterateDelay = getIteratedDelay(group, delay);
            setTimeout(function () {
                v.dom.classList.add("onbeforeremove");
                v.dom.classList.remove("oncreate");
            }, iterateDelay);
            var transitionDuration = getCSSTransitionDuration(v.dom);
            promises.push(new Promise(function (resolve) { return setTimeout(resolve, transitionDuration + iterateDelay); }));
            if (typeof attachedOnbeforeremoveFn === "function") {
                promises.push(attachedOnbeforeremoveFn(v));
            }
            return Promise.all(promises);
        };
    };
}
function flattenAndFilterChildren(children) {
    if (!Array.isArray(children)) {
        return [];
    }
    return children.reduce(function (flatten, c) {
        if (c.tag === "[") {
            return flatten.concat(c.children);
        }
        else if (isValidVnodeDOM(c)) {
            flatten.push(c);
        }
        return flatten;
    }, []);
}
function inject(children, group, delay) {
    if (Array.isArray(children)) {
        children = flattenAndFilterChildren(children);
        children.forEach(attrsInjector(group, delay));
    }
}
function execAllOnbeforeremoveFns(children, group, delay) {
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
exports["default"] = function (v) {
    return {
        view: function (v) {
            inject(v.children, v.attrs.group, v.attrs.delay);
            return v.children;
        },
        onbeforeremove: function (v) {
            return execAllOnbeforeremoveFns(v.children, v.attrs.group, v.attrs.delay);
        }
    };
};
