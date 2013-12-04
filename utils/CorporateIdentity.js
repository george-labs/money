var live = {},
    edit = {},
    factory = {
        bodyColor: '#287d9a',
        headerColor: '#24505d',
        headerTextColor: '#498d8d',
        logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGIAAAA4AQMAAAA8fr/cAAAABlBMVEUAAABJjY3HCBYbAAAAAXRSTlMAQObYZgAAACVJREFUKM9jYEAB7jKFx2GogYF44IDEbsDLGzVz1MyBNhNPKgcASWQdYTt7/AkAAAAASUVORK5CYII='
    },
    chain = function (req) {
        var stack = [factory];
        if (typeof req === 'object' && typeof req.isAuthenticated === 'function') {
            if (req.isAuthenticated()) {
                stack.push(edit);
            } else {
                stack.push(live);
                stack.push(req.session);
            }
        }
        return stack;
    },
    fetch = function (stack, key) {
        for (var i = stack.length - 1; i >= 0; --i) {
            if (stack[i][key]) {
                return stack[i][key];
            }
        }
    };

module.exports = {

    /**
     * set
     * @param isLive {Boolean} true if live version of #key is to be set (mandatory).
     * @param key {String} one of SystemBranding.default (mandatory).
     * @param value {String} updated value for #key.
     */
    set: function (isLive, key, value) {
        if (typeof key === 'string') {
            if (isLive) {
                live[key] = value;
            } else {
                edit[key] = value;
            }
        }
    },

    /**
     * get
     * @param key {String} one of SystemBranding.default (mandatory).
     * @param req {Object} request; if omitted, the factory default for #key is returned.
     */
    get: function (key, req) {
        if (typeof key !== 'string') {
            return undefined;
        }
        return fetch(chain(req), key);
    },

    /**
     * render
     * @param req {Object} request (mandatory).
     * @returns {Object} {'cid': {String} urlEndoded, 'logoUrl': {String}, 'css': {String}}
     */
    render: function (req) {
        var stack = chain(req),
            ci = {css: []};
        ci.css.push('html{background-color:' + fetch(stack, 'bodyColor') + '}');
        ci.css.push('header{background-color:' + fetch(stack, 'headerColor') + '}');
        ci.css.push('.branding-text{color:' + fetch(stack, 'headerTextColor') + '}');
        ci.css = ci.css.join('');
        ci.url = fetch(stack, 'url');
        ci.logoUrl = fetch(stack, 'logo');
        if (req.session.cid) {
            ci.cid = encodeURIComponent(req.session.cid);
        }
        return ci;
    }

};