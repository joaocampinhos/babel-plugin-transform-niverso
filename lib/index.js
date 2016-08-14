'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = function (_ref) {
  var t = _ref.types;

  var ids = {};
  var routes = {};
  return {
    visitor: {
      CallExpression: function CallExpression(path, state) {
        setRelation(state.opts.relation);
        var call = path.node.callee;
        if (call.object && call.object.name === 'niverso' && call.property.name !== 'use' && call.property.name !== 'start') {
          var version = path.node.arguments[0].value;
          var route = path.node.arguments[1].value;
          var type = void 0;
          if (path.node.arguments[2].type === 'ArrowFunctionExpression') {
            var id = path.node.arguments[2].body.name;
            type = ids[id].get(version);
          } else if (path.node.arguments[2].type === 'MemberExpression') {
            if (path.node.arguments[2].property.name === 'deprecate') {
              type = { type: 'VoidTypeAnnotation' };
            }
          }
          if (!(route in routes)) routes[route] = new VersionedType(route);
          routes[route].add(version, type);
        }
      },
      ArrowFunctionExpression: function ArrowFunctionExpression(path) {
        var params = path.node.params;
        if (params.length === 1 && params[0].type === 'AssignmentPattern' && params[0].left.type === 'Identifier' && params[0].left.name === 'version') {
          (function () {
            var version = params[0].right.value;
            var body = path.node.body;
            var type = void 0;
            if (body.type === 'BlockStatement') {
              body.body.filter(function (el) {
                return el.type === 'FunctionDeclaration';
              }).forEach(function (element) {
                type = JSON.parse(JSON.stringify(element.returnType.typeAnnotation));
                type = removeProp(type, 'start');
                type = removeProp(type, 'end');
                type = removeProp(type, 'loc');
                var name = element.id.name;
                path.scope.rename(name, name + '__' + version);
                if (!(name in ids)) ids[name] = new VersionedType(name);
                ids[name].add(version, type);
              });

              body.body.filter(function (el) {
                return el.type === 'VariableDeclaration';
              }).forEach(function (element) {
                element.declarations.forEach(function (el) {
                  if (el.init.returnType) {
                    var tipo = el.init.returnType.typeAnnotation;
                    tipo = removeProp(tipo, 'start');
                    tipo = removeProp(tipo, 'end');
                    tipo = removeProp(tipo, 'loc');
                    type = tipo;
                    switch (tipo.type) {
                      case 'GenericTypeAnnotation':

                      //console.log(tipo.id.name);
                      default:
                    }
                  }

                  var name = el.id.name;
                  path.scope.rename(name, name + '__' + version);
                  if (!(name in ids)) ids[name] = new VersionedType(name);
                  //console.log(name,version,type);
                  ids[name].add(version, type);
                });
              });
              body.body.forEach(function (el) {
                return path.insertBefore(el);
              });
              path.remove();
            } else if (body.type === 'Identifier') {
              body.name += '__' + version;
              path.replaceWith(body);
            }
          })();
        }
      },
      FunctionDeclaration: function FunctionDeclaration(path) {
        if (path.node.id.name === 'version') {
          (function () {
            var params = path.node.params;
            var body = path.node.body.body;
            var version = params.filter(function (value) {
              return value.left.name === 'v';
            })[0].right.value;
            body.filter(function (el) {
              return el.type === 'VariableDeclaration';
            }).forEach(function (element) {
              element.declarations.forEach(function (el) {
                if (el.id.typeAnnotation) {
                  var type = el.id.typeAnnotation.typeAnnotation.type;
                  var name = el.id.name;

                  //console.log(`id => ${name}, type => ${type}, version => ${version} }`);
                  if (!ids[name]) {
                    ids[name] = new VersionedType();
                    ids[name].add(version, type);
                    console.log(ids);
                    console.log('-----');
                  }
                }

                path.scope.rename(el.id.name, el.id.name + '__' + version);
              });
            });
            body.forEach(function (el) {
              return path.insertBefore(el);
            });
            path.remove();
          })();
        }
      },
      FunctionExpression: function FunctionExpression(path) {
        if (path.node.id.name === 'version') {
          (function () {
            var params = path.node.params;
            var body = path.node.body.body;
            var version = params.filter(function (value) {
              return value.left.name === 'v';
            })[0].right.value;
            body.filter(function (el) {
              return el.type === 'ExpressionStatement';
            }).forEach(function (element) {
              if (element.expression.type === 'Identifier') {
                element.expression.name += '__' + version;
                path.replaceWith(element);
              }
            });
          })();
        }
      }
    }
  };
};

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('lodash');

var relation = void 0;

var VersionedType = function () {
  function VersionedType(id) {
    _classCallCheck(this, VersionedType);

    this.nodes = {};
    this.id = id;
  }

  _createClass(VersionedType, [{
    key: 'get',
    value: function get(v) {
      var path = relation.pathToRoot(v);
      var i = path.length;
      while (i--) {
        var node = this.nodes[path[i]];
        if (node) return node;
      }

      return null;
    }
  }, {
    key: 'add',
    value: function add(v, t) {
      if (!t) {
        console.error('Cannot verify type correctness without annotations.');
        return;
      }

      var path = relation.pathToRoot(v);
      var type = relation.typeToRoot(v).reverse();

      var big = relation.NOTHING;

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = path[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var x = _step.value;

          var tmp = type.pop();
          if (tmp === undefined) break;
          if (tmp > big) big = tmp;
          if (!this.nodes[x]) continue;
          switch (big) {
            case relation.NOTHING:
              if (!equalTypes(this.nodes[x], t)) {
                throw new Error('\n              Incompatible types between version ' + v + ' and ' + x + '\n              Name: ' + this.id + '\n              type ' + v + ': ' + JSON.stringify(t) + '\n              type ' + x + ': ' + JSON.stringify(this.nodes[x]));
              }
              break;
            case relation.SUBTYPING:
              if (!subTypes(this.nodes[x], t)) {
                throw new Error('\n              Incompatible types between version ' + v + ' and ' + x + '\n              Name: ' + this.id + '\n              type ' + v + ': ' + JSON.stringify(t) + '\n              type ' + x + ': ' + JSON.stringify(this.nodes[x]));
              }
            case relation.EVERYTHING:
            default:
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      this.nodes[v] = t;
      return this;
    }
  }]);

  return VersionedType;
}();

function equalTypes(t1, t2) {
  if (t1.type !== t2.type) return false;else return _.isEqual(t1, t2);
}

function subTypes(t1, t2) {
  var result = false;
  if (t1.type !== t2.type) return false;else if (t1.type === 'ObjectTypeAnnotation') {
    result = t1.properties.every(function (prop) {
      var p = findByPropName(prop.key.name, t2.properties);
      if (!p) return false;
      if (equalTypes(prop, p)) return true;else {
        if (prop.type === p.type) {
          if (_.isEqual(prop.value, p.value)) {
            return prop.optional && !p.optional;
          } else {
            if (!(!prop.optional && p.optional)) return subTypes(prop.value, p.value);else return false;
          }
        }
      }
      return false;
    });
  } else if (t1.type === 'GenericTypeAnnotation') {
    if (t1.id.name === t2.id.name) {
      //Hack?
      result = subTypes(t1.typeParameters.params[0], t2.typeParameters.params[0]);
    }
  }
  return result;
}

function findByPropName(name, props) {
  return props.find(function (p) {
    return p.key.name === name;
  });
}

function removeProp(obj, p) {
  for (var prop in obj) {
    if (prop === p) delete obj[prop];else if (_typeof(obj[prop]) === 'object') {
      removeProp(obj[prop], p);
    }
  }
  return obj;
}

function setRelation(path) {
  if (!relation) {
    relation = require(path);
    relation.NOTHING = 0;
    relation.SUBTYPING = 10;
    relation.EVERYTHING = 20;
  }
}