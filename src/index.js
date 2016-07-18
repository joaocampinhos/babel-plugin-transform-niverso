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
    return new Array(vv).join(0).split('')
  }
}

let relation = new IntRelation();

class VersionedType {

  constructor() {
    this.nodes = {};
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
    const path = relation.pathToRoot(v);
    const type = relation.typeToRoot(v);
    this.nodes[v] = t;

    //Verificações
    console.log(relation.pathToRoot(v));
  }
}

export default function ({ types: t }) {
  let ids = {};

  let relation = new IntRelation();
  console.log(relation.typeToRoot(22));

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
          if (body.type === 'BlockStatement') {
            body.body.filter((el) => el.type === 'VariableDeclaration').forEach((element) => {
              element.declarations.forEach((el) => {
                const name = el.id.name;
                path.scope.rename(name, name + '__' + version);
              });
            });
            body.body.forEach((el) => path.insertBefore(el));
            path.remove();
          }
          else if (body.type === 'Identifier') {
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
