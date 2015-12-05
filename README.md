smocks
=======================

Stateful HTTP mocking service built on top of [HAPI](http://hapijs.com/).  Easily add routes and different scenarios for each route including the ability to maintain state with an admin interface to control everything.

With smocks you can

* create route definitions (with dynamic tokens)
* define multiple route handlers (variants) for for any route (selectable through an admin panel)
* add input configuration components for routes and variants (accessable through an admin panel)
* define actions which can manipulate the current state and be executed from the admin pnael
* use route request handlers that can keep a state for true dynamic mocking capabilities
* define global request handlers (variants) which can be selected for any route
* use plugins which can intercept all requests to perform actions
* use a RESTful API to make configuration changes programatically
* Replay exports from HAR files


Docs
-----------------------
[View installation and API docs](http://jhudson8.github.io/fancydocs/index.html#project/jhudson8/smocks)


Try it yourself
-----------------------
Go to a clean directory
```
    npm install smocks
    touch mock-server.js
```
open ```mock-server.js``` and paste in [this content](https://raw.githubusercontent.com/jhudson8/smocks/master/example/simple-smocks-server.js)
```
    node mock-server.js
```
browse to [http://localhost:8000/_admin](http://localhost:8000/_admin) to see the admin panel and play around.

browse to [http://localhost:8000/api/counter](http://localhost:8000/api/counter) to see how your changes show up.

Take a look at [the code](https://github.com/jhudson8/smocks/tree/master/example/eimple-smocks-server.js) and to see what the route handlers are doing.

The ```handler``` methods are just [HAPI route handlers](http://hapijs.com/api#route-handler).

The admin panel shows you all of the routes you define and provides an interface to select different ways that routes should respond or update config values.
![admin panel](http://jhudson8.github.io/smocks/images/main.png)
