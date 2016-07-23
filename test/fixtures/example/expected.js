/* @flow */

const niverso = require('./niverso');
const express = require('express');
const app = express();

app.get('/api', (req, res) => {
  res.send('api');
});

/* ------------ *\
 *    Routes    *
\* ------------ */

function users__1(req, res): Array<{ name: string; age: number; }> {
  return [{
    name: 'João Campinhos',
    age: 24
  }];
};

function users__3(req, res): Array<{ name: string; age: number; location: string; }> {
  return [{
    name: 'João Campinhos',
    age: 24,
    location: 'Lisbon'
  }];
};


// Qual a relação a utilizar
niverso.use(require('./IntRelation'));

niverso.get(1, '/api/users', users__1);
//niverso.get(2, '/api/users', niverso.deprecate);
niverso.get(3, '/api/users', users__3);

// Criar routes do express com base nas routes do niverso
niverso.start(app);

app.listen(3000, () => console.log('Express server listening on port 3000'));
