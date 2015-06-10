smocks
=======================

Stateful HTTP mocking service built on top of [HAPI](http://hapijs.com/).  Easily add routes and different scenarios for each route including the ability to maintain state with an admin interface to control everything.

With smocks you can

* create route definitions (with dynamic tokens)
* define multiple route handlers (variants) for for any route (selectable through an admin console)
* add input configuration components for routes and variants (accessable through an admin console)
* use a chaninable interface to streamline route definitions
* use route request handlers that can keep a state for true dynamic mocking capabilities
* define global request handlers which can be selected for any route
* use plugins which can intercept all requests to perform actions


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
open ```mock-server.js``` and paste in [this content](https://raw.githubusercontent.com/jhudson8/smocks/master/test/example.js)
```
    node mock-server.js
```
browse to [http://localhost:8000/_admin](http://localhost:8000/_admin) to see the admin panel and play around.

browse to [http://localhost:8000/api/history](http://localhost:8000/api/history) or [http://localhost:8000/api/hello/world](http://localhost:8000/api/hello/world) to try out the routes.

After visiting [http://localhost:8000/api/history](http://localhost:8000/api/history), refresh your page and notice the history changes (this is using state).  Go back to the [admin panel](http://localhost:8000/_admin) and reset your state to clear the history and try it again.

Take a look at [the code](https://github.com/jhudson8/smocks/tree/master/test/example.js) and to see what the route handlers are doing.
