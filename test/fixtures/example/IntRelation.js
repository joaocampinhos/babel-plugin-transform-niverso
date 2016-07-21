exports.isVersion = (v) => true;

exports.pathToRoot = (v) => {
  const vv = parseInt(v);
  return [...Array(vv + 1).keys()];
};

exports.typeToRoot = (v) => {
  console.log('TODO');
  return pathToRoot(v);
};
