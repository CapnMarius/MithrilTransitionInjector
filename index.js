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
function attrsInjector(attrs) {
    var parentAttrs = attrs;
    return function (v) {
        if (typeof v.attrs !== "object" || v.attrs === null) {
            v.attrs = {};
        }
        var attachedOncreateFn = v.attrs.oncreate;
        v.attrs.oncreate = function () {
            var delay = getIteratedDelay(parentAttrs.group, parentAttrs.delay);
            setTimeout(function () { return v.dom.classList.add("oncreate"); }, delay);
            if (typeof attachedOncreateFn === "function") {
                attachedOncreateFn(v);
            }
        };
        var attachedOnbeforeremoveFn = v.attrs.onbeforeremove;
        v.attrs.onbeforeremove = function () {
            var promises = [];
            var delay = getIteratedDelay(parentAttrs.group, attrs.delay);
            setTimeout(function () {
                v.dom.classList.add("onbeforeremove");
                v.dom.classList.remove("oncreate");
            }, delay);
            var transitionDuration = getCSSTransitionDuration(v.dom);
            promises.push(new Promise(function (resolve) { return setTimeout(resolve, transitionDuration + delay); }));
            if (typeof attachedOnbeforeremoveFn === "function") {
                promises.push(attachedOnbeforeremoveFn(v));
            }
            return Promise.all(promises);
        };
    };
}
function getFirstDOMNodes(child) {
    if (!child) {
        return;
    }
    if (Array.isArray(child)) {
        return child.reduce(function (total, c) { return total.concat(getFirstDOMNodes(c)); }, []).filter(function (n) { return n !== undefined; });
    }
    if (typeof child.tag === "string" && isValidVnodeDOM(child)) {
        return [child];
    }
    if (child.children) {
        return getFirstDOMNodes(child.children);
    }
}
function inject(children, attrs) {
    if (Array.isArray(children)) {
        children.forEach(attrsInjector(attrs));
    }
}
function execAllOnbeforeremoveFns(children) {
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
            inject(getFirstDOMNodes(v.children), v.attrs);
            return v.children;
        },
        onbeforeremove: function (v) {
            return execAllOnbeforeremoveFns(getFirstDOMNodes(v.children));
        }
    };
};
