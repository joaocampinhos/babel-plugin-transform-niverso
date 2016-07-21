let routes = {
  'm-search': { },
  checkout: { },
  copy: { },
  delete: { },
  get: { },
  head: { },
  lock: { },
  merge: { },
  mkactivity: { },
  mkcol: { },
  move: { },
  notify: { },
  options: { },
  patch: { },
  post: { },
  purge: { },
  put: { },
  report: { },
  search: { },
  subscribe: { },
  trace: { },
  unlock: { },
  unsubscribe: { },
};

let relation;

function addRoute(v, r, f, m) {
  console.log(f === deprecate)
  if (!(r in routes[m])) routes[m][r] = { };
  routes[m][r][v] = f;
}

exports.use = (r) => {
  relation = r;
};

let deprecate = (req, res) => res.status(404).json({ error: 'Resource deprecated in this version' });
exports.deprecate = deprecate;

exports['delete']   = (v, r, f) => addRoute(v, r, f, 'delete');
exports['m-search'] = (v, r, f) => addRoute(v, r, f, 'm-search');
exports.checkout    = (v, r, f) => addRoute(v, r, f, 'checkout');
exports.copy        = (v, r, f) => addRoute(v, r, f, 'copy');
exports.get         = (v, r, f) => addRoute(v, r, f, 'get');
exports.head        = (v, r, f) => addRoute(v, r, f, 'head');
exports.lock        = (v, r, f) => addRoute(v, r, f, 'lock');
exports.merge       = (v, r, f) => addRoute(v, r, f, 'merge');
exports.mkactivity  = (v, r, f) => addRoute(v, r, f, 'mkactivty');
exports.mkcol       = (v, r, f) => addRoute(v, r, f, 'mkcol');
exports.move        = (v, r, f) => addRoute(v, r, f, 'move');
exports.notify      = (v, r, f) => addRoute(v, r, f, 'notify');
exports.options     = (v, r, f) => addRoute(v, r, f, 'options');
exports.patch       = (v, r, f) => addRoute(v, r, f, 'patch');
exports.post        = (v, r, f) => addRoute(v, r, f, 'post');
exports.purge       = (v, r, f) => addRoute(v, r, f, 'purge');
exports.put         = (v, r, f) => addRoute(v, r, f, 'put');
exports.report      = (v, r, f) => addRoute(v, r, f, 'report');
exports.search      = (v, r, f) => addRoute(v, r, f, 'search');
exports.subscribe   = (v, r, f) => addRoute(v, r, f, 'subscribe');
exports.trace       = (v, r, f) => addRoute(v, r, f, 'trace');
exports.unlock      = (v, r, f) => addRoute(v, r, f, 'unlock');
exports.unsubscribe = (v, r, f) => addRoute(v, r, f, 'ubsubscribe');

exports.start = (app) => {
  for (let m in routes) {
    for (let key in routes[m]) {
      app[m](key, (req, res) => {
        let v = req.get('X-Version');
        const path = relation.pathToRoot(v);
        let i = path.length;
        while (i--) {
          const node = routes[m][key][path[i]];
          if (node) {
            res.set('X-Version', path[i]);
            return node(req, res);
          }
        }

        return res.status(400).json({ error: 'Could not find any valid version' });
      });
    }
  }
};
