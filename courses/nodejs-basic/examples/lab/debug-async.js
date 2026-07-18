/**
 * Лаба к уроку 37: порядок вывода и async.
 * Запуск: node --inspect-brk lab/debug-async.js
 */

console.log("A: sync start");

setTimeout(() => console.log("E: setTimeout 0"), 0);

Promise.resolve().then(() => console.log("D: microtask"));

process.nextTick(() => console.log("B: nextTick"));

setImmediate(() => console.log("F: setImmediate"));

console.log("C: sync end");

async function loadItems() {
  console.log("G: before fetch");
  // await fetch("http://localhost:8090/api/v1/items");
  console.log("H: after fetch");
}

loadItems().then(() => console.log("I: loadItems done"));
