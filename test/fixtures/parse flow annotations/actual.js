// @flow

var a: bool = true;
function smth(x: number): number {
  return x;
}

(version = 1) => {
  let user = (req, res): {name: {first: string; last?: string;}; location?: string;}  => {
    return {
      name: {
        first: 'Foo'
      },
      location: 'lisboa'
    };
  };
};

(version = 2) => {
  let user = (req, res): {age: number; location: string; name: {first: string; last: string;};}  => {
    return {
      name: {
        first: 'Foo',
        last: 'Bar'
      },
      age: 24,
      location: 'lisboa'
    };
  };
};
