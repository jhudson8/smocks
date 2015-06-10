smocks
=======================

Stateful HTTP mocking service.  Easily add routes and different scenarios for each route including the ability to maintain state with an admin interface to control everything.

With smocks you can define

* the route (with dynamic tokens) and method to handle
* multiple route handlers (variants) for each route (selectable through an admin console)
* dynamic configuration values defined for routes and variants (accessable through an admin console)
* chaninable interface to streamline route definitions
* route request handlers that can keep a state for true dynamic mocking capabilities
* global request handlers which can be selected for any route
* plugins which can intercept all requests to perform actions


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
open ```mock-server.js``` and paste in [this content](https://github.com/jhudson8/smocks/blob/master/test/example.js)
```
    node mock-server.js
```
browse to [http://localhost:8000/_admin](http://localhost:8000/_admin) to see the admin panel

Click on any of the routes to select a variant (alter the response to the route)

browse to [http://localhost:8000/api/foo](http://localhost:8000/api/foo) or [http://localhost:8000/api/bar](http://localhost:8000/api/bar) to try out the routes.

Take a look at [the code](https://github.com/jhudson8/smocks/tree/master/test/example.js) and to see what the route handlers are doing.
