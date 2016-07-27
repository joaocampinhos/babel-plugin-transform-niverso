var _ = require('lodash');

let relation;

class VersionedType {

  constructor(id) {
    this.nodes = {};
    this.id = id;
  }

  get(v) {
    const path = relation.pathToRoot(v);
    let i = path.length;
    while (i--) {
      const node = this.nodes[path[i]];
      if (node) return node;
    }

    return null;
  }

  add(v, t) {
    if (!t) {
      console.error('Cannot verify type correctness without annotations.');
      return;
    }

    const path = relation.pathToRoot(v);
    const type = relation.typeToRoot(v).reverse();

    let big = relation.NOTHING;

    for (let x of path) {
      const tmp = type.pop();
      if (tmp === undefined) break;
      if (tmp > big) big = tmp;
      if (!this.nodes[x]) continue;
      switch (big) {
        case relation.NOTHING:
          if (!equalTypes(this.nodes[x],t)) {
            throw new Error(`
              Incompatible types between version ${v} and ${x}
              Name: ${this.id}
              type ${v}: ${JSON.stringify(t)}
              type ${x}: ${JSON.stringify(this.nodes[x])}`);
          }
          break;
        case relation.SUBTYPING:
          if (!subTypes(this.nodes[x],t)) {
            throw new Error(`
              Incompatible types between version ${v} and ${x}
              Name: ${this.id}
              type ${v}: ${JSON.stringify(t)}
              type ${x}: ${JSON.stringify(this.nodes[x])}`);
          }
        case relation.EVERYTHING:
        default:
      }
    }

    this.nodes[v] = t;
    return this;
  }

}

function equalTypes(t1, t2) {
  if (t1.type !== t2.type) return false;
  else return _.isEqual(t1, t2);
}

function subTypes(t1, t2) {
  let result = false;
  if (t1.type !== t2.type) return false;
  else if (t1.type === 'ObjectTypeAnnotation') {
    result = t1.properties.every((prop) => {
      const p = findByPropName(prop.key.name,t2.properties);
      if (!p) return false;
      if (equalTypes(prop,p)) return true;
      else {
        if (prop.type === p.type) {
          if (_.isEqual(prop.value,p.value)) {
            return prop.optional && !p.optional;
          } else {
            if (!(!prop.optional && p.optional))
              return subTypes(prop.value, p.value);
            else return false;
          }
        }
      }
      return false;
    });
  }
  else if (t1.type === 'GenericTypeAnnotation') {
    if (t1.id.name === t2.id.name) {
      //Hack?
      result = subTypes(t1.typeParameters.params[0], t2.typeParameters.params[0]);
    }
  }
  return result;
}

function findByPropName(name,props) {
  return props.find((p) => p.key.name === name);
}

function removeProp(obj, p) {
  for(let prop in obj) {
    if (prop === p)
      delete obj[prop];
    else if (typeof obj[prop] === 'object') {
      removeProp(obj[prop], p);
    }
  }
  return obj;
}

function setRelation(path) {
  if (!relation) {
    relation = require(path)
    relation.NOTHING = 0;
    relation.SUBTYPING = 10;
    relation.EVERYTHING = 20;
  }
}

export default function ({ types: t }) {
  let ids = {};
  let routes = {};
  return {
    visitor: {
      CallExpression(path, state) {
        setRelation(state.opts.relation);
        const call = path.node.callee;
        if (call.object &&
          call.object.name === 'niverso' &&
          call.property.name !== 'use' &&
          call.property.name !== 'start') {
          let version = path.node.arguments[0].value;
          let route = path.node.arguments[1].value;
          let type;
          if (path.node.arguments[2].type === 'ArrowFunctionExpression') {
            let id = path.node.arguments[2].body.name;
            type = ids[id].get(version);
          }
          else if (path.node.arguments[2].type === 'MemberExpression') {
            if (path.node.arguments[2].property.name === 'deprecate') {
              type = {type: 'VoidTypeAnnotation'};
            }
          }
          if (!(route in routes))
            routes[route] = new VersionedType(route);
          routes[route].add(version, type);
        }
      },

      ArrowFunctionExpression(path) {
        const params = path.node.params;
        if (params.length === 1 &&
          params[0].type === 'AssignmentPattern' &&
          params[0].left.type === 'Identifier' &&
          params[0].left.name === 'version') {
          let version = params[0].right.value;
          let body = path.node.body;
          let type;
          if (body.type === 'BlockStatement') {
            body.body.filter((el) => el.type === 'FunctionDeclaration').forEach((element) => {
              type = JSON.parse(JSON.stringify(element.returnType.typeAnnotation));
              type = removeProp(type,'start');
              type = removeProp(type,'end');
              type = removeProp(type,'loc');
              const name = element.id.name;
              path.scope.rename(name, name + '__' + version);
              if (!(name in ids))
                ids[name] = new VersionedType(name);
              ids[name].add(version, type);
            });

            body.body.filter((el) => el.type === 'VariableDeclaration').forEach((element) => {
              element.declarations.forEach((el) => {
                if (el.init.returnType) {
                  let tipo = el.init.returnType.typeAnnotation;
                  tipo = removeProp(tipo,'start');
                  tipo = removeProp(tipo,'end');
                  tipo = removeProp(tipo,'loc');
                  type = tipo;
                  switch (tipo.type) {
                    case 'GenericTypeAnnotation':

                      //console.log(tipo.id.name);
                    default:
                  }
                }

                const name = el.id.name;
                path.scope.rename(name, name + '__' + version);
                if (!(name in ids))
                  ids[name] = new VersionedType(name);
                //console.log(name,version,type);
                ids[name].add(version, type);
              });
            });
            body.body.forEach((el) => path.insertBefore(el));
            path.remove();

          } else if (body.type === 'Identifier') {
            body.name += '__' + version;
            path.replaceWith(body);
          }
        }
      },

      FunctionDeclaration(path) {
        if (path.node.id.name === 'version') {
          let params = path.node.params;
          let body = path.node.body.body;
          let version = params.filter((value) => value.left.name === 'v')[0].right.value;
          body.filter((el) => el.type === 'VariableDeclaration').forEach((element) => {
            element.declarations.forEach((el) => {
              if (el.id.typeAnnotation) {
                const type = el.id.typeAnnotation.typeAnnotation.type;
                const name = el.id.name;

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
          body.forEach((el) => path.insertBefore(el));
          path.remove();
        }
      },

      FunctionExpression(path) {
        if (path.node.id.name === 'version') {
          let params = path.node.params;
          let body = path.node.body.body;
          let version = params.filter((value) => value.left.name === 'v')[0].right.value;
          body.filter((el) => el.type === 'ExpressionStatement').forEach((element) => {
            if (element.expression.type === 'Identifier') {
              element.expression.name += '__' + version;
              path.replaceWith(element);
            }
          });
        }
      },
    },
  };
}
