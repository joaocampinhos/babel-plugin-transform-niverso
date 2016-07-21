var _ = require('lodash');

class IntRelation {
  isVersion(v) {
    return true;
  }

  pathToRoot(v) {
    const vv = parseInt(v);
    return [...Array(vv + 1).keys()];
  }

  typeToRoot(v) {
    const vv = parseInt(v);
    return new Array(vv + 1).join('0').split('');
  }
}

let relation = new IntRelation();
relation.NOTHING = 0;
relation.SUBTYPING = 20;
relation.EVERYTHING = 10;

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

    const path = relation.pathToRoot(v).reverse();
    const type = relation.typeToRoot(v);

    let big = relation.NOTHING;

    for (let x of path) {
      const tmp = type.pop();
      if (!this.nodes[x]) continue;
      if (!tmp) break;
      if (tmp > big) big = tmp;
      switch (big) {
        case relation.NOTHING:
          if (!compareTypes(this.nodes[x],t)) {
            throw new Error(`
              Incompatible types between version ${v} and ${x}
              Name: ${this.id}
              type ${v}: ${JSON.stringify(t)}
              type ${x}: ${JSON.stringify(this.nodes[x])}`);
          }

          break;
        case relation.SUBTYPING:
          if (!subTypes(this.nodes[x],t)) {

          }
        case relation.EVERYTHING:
        default:
      }
    }

    this.nodes[v] = t;
    return this;
  }

}

function compareTypes(t1, t2) {
  if (t1.type !== t2.type) return false;
  else return _.isEqual(t1, t2);
}

function subTypes(t1, t2) {
  return true;
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

export default function ({ types: t }) {
  let ids = {};
  let routes = {};
  return {
    visitor: {
      CallExpression(path) {
        const call = path.node.callee;
        if (call.object &&
          call.object.name === 'niverso' &&
          call.property.name !== 'use' &&
          call.property.name !== 'start') {
          let version = path.node.arguments[0].value;
          let route = path.node.arguments[1].value;
          let id = path.node.arguments[2].body.name;
          let type = ids[id].get(version);
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
