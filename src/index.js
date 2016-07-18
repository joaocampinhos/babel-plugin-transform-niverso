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
    return new Array(vv + 1).join(0).split('');
  }
}

let relation = new IntRelation();

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
      console.error('');
      console.error('Cannot verify type correctness without annotations.');
      console.error(`Name    : ${this.id}`);
      console.error(`Version : ${v}`);
      console.error('');
      return;
    }

    const path = relation.pathToRoot(v).reverse();
    const type = relation.typeToRoot(v);
    this.nodes[v] = t;

    console.log(path);
    console.log(type);

    for (let x of path) {
      console.log(x);
      console.log(type);
      console.log(type.pop());
    }

    return this;

    //Verificações
    //console.log(relation.pathToRoot(v));
  }
}

export default function ({ types: t }) {
  let ids = {};

  // let vt = new VersionedType(IntRelation);

  return {
    visitor: {
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
            body.body.filter((el) => el.type === 'VariableDeclaration').forEach((element) => {
              element.declarations.forEach((el) => {
                if (el.init.returnType) {
                  const tipo = el.init.returnType.typeAnnotation;
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
                console.log(name,version,type);
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
