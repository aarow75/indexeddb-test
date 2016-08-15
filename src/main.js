// const faker = require('faker');
const React = require('react');
const ReactDOM = require('react-dom');
// const Dexie = require('dexie');
// let Promise = Dexie.Promise;

const ObjectData = require('./ObjectData')

ReactDOM.render(
  <ObjectData width={1280} height={800} rowsCount={3} />, document.querySelector("#results")
);
