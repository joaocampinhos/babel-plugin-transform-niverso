// @flow

var a: bool = true;
function smth(x: number): number {
  return x;
}

let user__1 = (req, res): {
  name: {
    first: string;
    last?: string;
  };
  location?: string;
} => {
  return {
    name: {
      first: 'Foo'
    },
    location: 'lisboa'
  };
};

let user__2 = (req, res): {
  age: number;
  location: string;
  name: {
    first: string;
    last: string;
  };
} => {
  return {
    name: {
      first: 'Foo',
      last: 'Bar'
    },
    age: 24,
    location: 'lisboa'
  };
};
