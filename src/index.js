export default function ({types: t}) {
  return {
    visitor: {
      FunctionDeclaration(path) {
        if (path.node.id.name === 'version') {
          let params = path.node.params;
          let body = path.node.body.body;
          let version = params.filter((value) => value.left.name === 'v')[0].right.value;
          body.filter((el) => el.type === 'VariableDeclaration').forEach((element) => {
              element.declarations.forEach((el) => {
                path.scope.rename(el.id.name, el.id.name+'__'+version);
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
              element.expression.name += '__'+version;
              path.replaceWith(element);
            }
          });
        }
      }
    }
  };
}
