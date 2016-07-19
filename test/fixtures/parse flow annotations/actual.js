// @flow

var a: bool = true;
function smth(x: number): number {
  return x;
}

type User = {
  name: string,
  age: number,
}

type User1 = {
  name: Name,
  age: number,
}

type Name = {
  first: string,
  last: string,
}

(version = 1) => {
  let users = (req, res): User => {
    return {
      name: 'João Campinhos',
      age: 24,
    };
  };
};

(version = 2) => {
  let users = (req, res): User => {
    return {
      name: 'João Campinhos',
      age: 24,
    };
  };
};

(version = 3) => {
  let users = (req, res): User => {
    return {
      name: {
        first: 'João',
        last: 'Campinhos',
      },
      age: 24,
    };
  };
};
