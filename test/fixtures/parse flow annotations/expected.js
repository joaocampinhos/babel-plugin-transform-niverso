// @flow

var a: bool = true;
function smth(x: number): number {
  return x;
}

type User = {
  name: string;
  age: number;
};

type User1 = {
  name: Name;
  age: number;
};

type Name = {
  first: string;
  last: string;
};

let users__1 = (req, res): User => {
  return {
    name: 'João Campinhos',
    age: 24
  };
};

let users__2 = (req, res): User => {
  return {
    name: 'João Campinhos',
    age: 24
  };
};

let users__3 = (req, res): User1 => {
  return {
    name: {
      first: 'João',
      last: 'Campinhos'
    },
    age: 24
  };
};
