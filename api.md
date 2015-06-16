smocks
==============

Stateful HTTP mocking service built on top of [HAPI](http://hapijs.com/).  Easily add routes and different scenarios for each route including the ability to maintain state with an admin interface to control everything.

With smocks you can

* create route definitions (with dynamic tokens)
* define multiple route handlers (variants) for for any route (selectable through an admin console)
* add input configuration components for routes and variants (accessable through an admin console)
* use a chaninable interface to streamline route definitions
* use route request handlers that can keep a state for true dynamic mocking capabilities
* define global request handlers which can be selected for any route
* use plugins which can intercept all requests to perform actions

The ```respondWith``` methods are just [HAPI route handlers](http://hapijs.com/api#route-handler) so they are very easy to use.

API
--------------
### global
#### route(options)
* ***options***: object containing the following values
* ***path***: the route path (must start with ```/```).  Ex: ```/api/customer/{id}```
* ***label***: An optional human readable label that can be seen in the admin panel for this route
* ***method***: optional method (GET is default)
* ***handler***: optional default route handler (same as the first variant applied to this route)

Register a route handler to enable setting the method, adding variants or config properties.

To see how variables can be used in the path, refer to the [HAPI routing guide](http://hapijs.com/tutorials/routing).

Return the associated [Route object](#project/jhudson8/smocks/snippet/package/Route).

```javascript
    var smocks = require('smocks');
    smocks.route({
      method: 'POST', // optional if method is 'GET'
      path: '/api/customer/{customerId}',
      handler: function(request, reply) {
        // route handler but we would use replyWith if we have
        // multiple variants
      }
    })
    .replyWith(function(request, reply) {
      // another way of definiting route handlers
    })
    ...
```


#### plugin(plugin)
* ***plugin***: the plugin object

Register the plugin.  See the plugin object type for details.  Return the [global object](#project/jhudson8/smocks/snippet/package/global).


#### start(options)
* ***options***: either object {host, port} or a HAPI server instance

Start a HAPI server with the defined mock configuration.

Both the host and port are optional and will default to ```localhost``` and ```8080```.

If a HAPI server instance is provided, the routes will be bound to the HAPI server provided but the ```start``` method will not be called.


### Route
#### route(options)
Refer to [global:route](#project/jhudson8/smocks/snippet/method/global/route)


#### config(attributes)
* ***attributes***: The configuration attributes

Set any configuration attributes that will be available for modification on the admin panel.

See [config example](#project/jhudson8/smocks/section/Examples/Route%20%2F%20variant%20configuration) for details.

Return the same route object for chaining.

```javascript
    var smocks = require('smocks');
    smocks.route(...)
    .config({
      myVar: {
        label: 'Config label',
        type: 'boolean|text|select|multiselect',
        defaultValue: ...
      }
    })
    .respondWith(...)
```


#### variant(id)
* ***id***: the variant id

Set up a new route variant with the provided id.  The id is meaningful when selecting the active variant from the admin panel.

A variant is basically a single request handler for a defined route.  This is useful to test out different scenarios for a single route definition.

Return the [Variant object](#project/jhudson8/smocks/snippet/package/Variant).

```javascript
    var smocks = require('smocks');
    smocks.route(...)
    .variant('respond like this').respondWith(...)
    .variant('respond like that').respondWith(...)
```


#### plugin(plugin)
Refer to [global:plugin](#project/jhudson8/smocks/snippet/method/global/plugin)


#### respondWith(requestHandler)
* ***requestHandler***: The [RequestHandler](#project/jhudson8/smocks/section/Object%20Types/RequestHandler)

Convienance method for creating a default variant (id of "default") and then calling [Variant:respondWith](#project/jhudson8/smocks/snippet/method/Variant/respondWith) on the variant.


#### respondWithFile(filePath)
Convienance method for creating a default variant (id of "default") and then calling [Variant:respondWithFile](#project/jhudson8/smocks/snippet/method/Variant/respondWithFile) on the variant.


### Variant
#### route(options)
Refer to [global:route](#project/jhudson8/smocks/snippet/method/global/route)


#### config(attributes)
* ***attributes***: The configuration attributes

Set any variant-scoped configuration attributes that will be available for modification on the admin panel.

See [config example](#project/jhudson8/smocks/section/Examples/Route%20%2F%20variant%20configuration) for details.

Return the same Variant object for chaining.


#### variant(id)
Refer to [Route:variant](l#project/jhudson8/smocks/snippet/method/Route/variant)


#### plugin(plugin)
Refer to [global:plugin](#project/jhudson8/smocks/snippet/method/global/plugin)


#### respondWith(requestHandler)
* ***requestHandler***: The [RequestHandler](#project/jhudson8/smocks/section/Object%20Types/RequestHandler)

Associate a request handler with the current route/method/variant combination.

Return the same Variant object for chaining.

```javascript
    var smocks = require('smocks');
    smocks.route(...).respondWith(function(request, reply) {
      var theMessage = request.params.message;
      var aQueryStringValue = request.query.theQueryStringKey;
      reply({message: theMessage}); // reply with a JSON payload
      // or reply with something else
      reply({error: {message: 'Some unknown error'}}).code(500);
    });
```


#### respondWithFile(filePath)
* ***filePath***: the path to the file to serve out (any route variables can be used in the file path as well)

Remember that using ```./``` will refer to the top level module directory (the directory where ```node_modules``` exists regardless of the location of the file that is referring to a file location with ```./```);

```javascript
    var smocks = require('smocks');
    smocks.route({path: '/customer/{id}'}).respondWithFile('./customer-{id}.json')
    .start(...)
```

This would cause a request to ```/customer/1``` to return the file ```./customer-1.json```

Return the same Variant object for chaining.


Sections
--------------
### Admin Panel

If a route has multiple variants, the admin panel can be used to select which variant should handle the requests.  Also, the admin panel exposes any configuration input fields defined at the route or variant level.

To view the admin panel, visit [http://localhost:{port number}/_admin](http://localhost:8080/_admin)

***Note, to see route specific config options, click the route entry with your mouse.***


### Plugins

Plugins can be used to perform an action on all requests or just to encapsulate a set of route handlers.  Plugins can have config values just like Routes or Variants.

Plugins are just simple objects that have the following attributes

* ***plugin***: (optional) if exists, will simply be called with a single parameter (the smocks object) so you can add new routes.
* ***config***: (optional) config definitions to allow the user with different types of input fields in the admin panel.  See the next section (Config types) for more details
* ***onRequest***: Called before the route handler (variant) executes for every request.  It is similar to the ([request, reply](http://hapijs.com/api#route-handler)) of the route handlers (Variants) but has an additional callback method that should be executed when the plugin has finished doing what it needs to do.

* ***onResponse***: Called after the route handler (variant) executes for every request.  Parameters are similar to ```onRequest``` except the 2nd parameter is the return value from the [reply method (see response object)](http://hapijs.com/api#reply-interface).

The following plugin will add simulated latency (which can be controlled by the user) to all requests.
```
    var smocks = require('smocks');
    smocks.plugin({
      // define the input field for the admin panel allowing the user to adjust the delay
        config: {
          delay: {
            label: 'Add delay to all responses',
            type: 'select',
            options: [{label: 'no delay', value: 0}, {label: '1 sec', value: 1000}, {label: '5 sec', value: 5000}],
            defaultValue: 0
          }
        },

        // call "next" after a timeout if the user requested a delay
        onRequest: function(request, reply, next) {
          // get the delay value from config
          var delay = this.config('delay');
          if (delay > 0) {
            // if there is a delay, call next after a timeout
            setTimeout(next, delay);
          } else {
            next();
          }
        },

        onResponse: function(request, response) {
          // I can do things to the response here
          response.code(404);
        }
      })
```


### Config types

Routes, variants and plugins can define config values to be exposed in the admin panel which can be accessed using ```this.config('varName')``` in route handlers (```respondWith``` functions).

There are a few different config types depending on the type of data you want to collect.

Here is what it looks like to define config values.

```
    var smocks = require('smocks');

    smocks.route(...)
    // these config values are for the route
    .config({
      theVarName: {
        label: 'The label shown on the admin panel',
        type: 'boolean|text|select|multiselect',
        defaultValue: {the default value}
      }
    })
```

Then, in your route handler, you would use ```this.config('theVarName')``` to access the value.

_boolean value_

```type``` value is ```boolean```.  The value will either be ```true``` or ```false``` or undefined if no defaultValue is provided.

_text value_

```type``` value is ```text```.  The value will be a string or undefined if no defaultValue is provided.

_select value_

This is used to allow the user to select a single option within a specific list of defined options (a select box).

An additional ```options``` attribute is used here to describe the available options.  It is an array of objects which contain a ```label``` and ```value``` attribute.

```options: [{label: 'One', value: 1}, {label: 'Two', value: 2}, {label: 'Three', value: 3}]```

```type``` value is ```select```.  The value will be the ```value``` attribute of the selected option or undefined if no defaultValue is provided.

_multiselect value_

This is basically the same as the ```select``` config type except that you can select multiple values rather than a single value.  It is represented as a list of check boxes rather than a select box.

```type``` value is ```multiselect```.  The value will be an array of the ```value``` attributes of the selected options or undefined if no defaultValue is provided.


### Object Types
#### Plugin
A plugin is a plain javascript object with the following attributes

* ***onRequest***: function(request, reply, next): Standard HAPI request handler with an additional callback method to continue processing the next plugins.

A small example plugin to add latency to all requests would be
```javascript
    ...
    .plugin({
      onRequest: function(request, reply, next) {
        // wait 1 sec before continuing
        setTimeout(next, 1000);
      }
    })
```


#### RequestHandler
The ```respondWith``` method for variants and global plugins has access to the ```request``` and ```reply``` objects as parameters just like any [HAPI route handler](http://hapijs.com/api#route-handler).

Additionally, state, config and options values can be accessed.

* ***this.state***: ```function(key, value)``` if ```value``` is undefined, return the state value of ```key```.  Otherwise set the state value of ```key``` to ```value```.
* ***this.config***: ```function(key)``` return the config value matching the provided key
 ***this.option***: ```function(key)``` return the option value matching the provided key

```javascript
    ...
    respondWith(function(request, reply) {
      var oldStateValue = this.state('foo');
      // update the state for "foo" to be "bar"
      this.state('foo', 'bar');
      var fooConfig = this.config('foo');
      var fooOption = this.option('foo');
      ...
    })
```


### Examples
#### Configurable route responses

Each defined route can have multiple response handlers defined.  Only 1 can be active at any time but the active handler can be changed in the admin console to test out different scenarios.

```javascript
    var smocks = require('smocks');

    smocks.route(...)
        .variant('default').respondWith(function(request, reply) {
            ...
        })
        .variant('something_else').respondWith(function(request, reply) {
            ...
        })

    .start();
```

Now, in the admin panel, you will be able to choose between the ```default``` and ```something_else``` response handlers when a POST to ```/api/foo``` is executed.

(make sure to click on the route path in the admin panel to see config options)

#### Multiple route methods

It is easy to define handlers for multiple methods associated with a single route using the chaining API.  Since the method is an attribute of the route options, you can call route with a path that was previously registered but with different method.

```javascript
    var smocks = require('smocks');

    smocks.route({ path: '/api/foo', method 'GET' })
        .respondWith(function(request, reply) {
            ...
        })

    .route({ path: '/api/foo', method 'POST' })
        .respondWith(function(request, reply) {
            ...
        })

    .start();
```


#### Routes, methods and variants 

The chaining API makes it easy to define a route but it is important to understand the different concepts.

* ***route***: the URL path
* ***method***: GET|POST|PUT|PATCH|DELETE
* ***variant***: for a specific route/method combination there can be multiple variants (or request handlers) which can be selected within the admin console.  This allows you to test different scenarios that exist from calling a single endpoint.

As long as you understand that, the ```method```, ```variant``` and ```route``` methods can be called wherever it makes sense to do so.

```javascript
    var smocks = require('smocks');

    smocks.route({ path: '/api/foo' })
        // the method is not necessary - GET is the default
        .variant('default').respondWith(function(request, reply) {
          // this is the "default" variant for "/api/foo" (GET)
          ...
        })
        .variant('scenario1').respondWith(function(request, reply) {
          // this is the "scenario1" variant for "/api/foo" (GET)
          ...
        })
        .variant('scenario2').respondWith(function(request, reply) {
          // this is the "scenario2" variant for "/api/foo" (GET)
          ...
        })

      .route({ path: '/api/foo', method: 'POST' })
        //  the variant is not necessary - "default" is the default variant id
        .respondWith(function(request, reply) {
          // this is the "default" variant for "/api/foo" (POST)
          ...
        })
        .variant('scenario1').respondWith(function(request, reply) {
          // this is the "scenario1" variant for "/api/foo" (POST)
          ...
        })

    .start();
```


#### Config, options and state, oh my

There are 3 different ways of introducting dynamic behavior into your responses but each serve a different purpose.

_config_

Config values are exposed as input fields in the admin panel so you have the ability to change the value at runtime.

These are accessed using ```this.config('varName')``` in any route handler.

_options_

Options are like config but are not exposed in the admin panel.  These are most useful to expose metadata for a global pugin.  For example, you could have a plugin that examined all requests and, if the user hasn't signed in yet, respond with a 401 error.  The routes could expose an option value that indicated whether they were routes that required authentication.

These are accessed using ```this.option('varName')```.

_state_

State is used to, obviously, maintain state.  For example, if you expose a route that adds a new piece of data, you should store it in state.  The user can reset the state with a button on the admin panel.

State values can be accessed using ```this.state('varName')```.
State values can be set using ```this.state('varName', 'value')```.


#### Route / variant configuration

Different types of input fields can be defined for routes or variants including ```boolean```, ```text```, ```select```, ```multiselect```.  Through the admin panel, you can modify these config values.

```javascript
    smock.route(...)
      .config({
        aBooleanField: {
          label: 'Is this a checkbox?',
          type: 'boolean',
          defaultValue: true
        },
        someTextField: {
          label: 'A text field',
          type: 'text',
          defaultValue: 'Hello'
        },
        someSelectBox: {
          label: 'A select box',
          type: 'select',
          options: [{label: 'One', value: 1}, {label: 'Two', value: 2}, {label: 'Three', value: 3}],
          defaultValue: 2
        },
        someMultiSelect: {
          label: 'A check list',
          type: 'multiselect',
          options: [{label: 'One', value: 1}, {label: 'Two', value: 2}, {label: 'Three', value: 3}],
          defaultValue: [2, 3]
        },
      })

      // these variants are here to show how the config values can be retrieved
      .variant('default').respondWith(function(request, reply) {
        var aBooleanField = this.config('aBooleanField'); // boolean
        var someTextField = this.config('someTextField'); // string
        var someSelectBox = this.config('someSelectBox'); // integer (because the values are integers)
        var someMultiSelect = this.config('someMultiSelect'); // array of integer (because the values are integers)
        // ...
      })
      .variant('scenario1').respondWith(function(request, reply) {
        // ...
        
      })
      .variant('scenario2').respondWith(function(request, reply) {
        // ...
      })
```

Then, within the route handler, the config values can be accessed by using ```this.config```.

The same ```config``` method can be applied at the variant level as well.

The previous config example would look like this in the admin panel
![admin panel](http://jhudson8.github.io/smocks/images/config-types.png)


#### Route / variant options

This is similar to Route / variant config except that these values are not exposed within the admin console.  They are accessable within the route handlers though.

This is mostly useful for global-level plugins.

```javascript
    var smocks = require('smocks');

    smocks.route(...)
      .options({
        theVarKey: 'the variable value'
      })
    .respondWith(function(request, reply) {
      var value = this.options('theVarKey');
      // do something with the value
    })
```

Then, within the route handler, the options values can be accessed by using ```this.options```.


#### Global route interceptors / plugins

"Plugins" can be provided which have the ability to intercept all income requests.  They are very similar to a variant route handler except there is a third ```next``` callback parameter which will trigger the rest of the plugins to execute.

If the plugin chooses to override the response, the ```next``` parameter should not be called.

For example, a plugin to add simulated latency to all endpoint methods

```javascript
    var smocks = require('smocks');

    smocks.route(...)
      ...

    .plugin({
      respondWith: function(request, reply, next) {
        // wait 1 sec before allowing the response to be handled
        setTimeout(next, 1000);
      }
    })
```


### Profiles

Using the Admin Panel, you can save all route, variant and config settings as a "profile".  Profiles can either be saved locally (using localStorage) or remotely by providing the code to update in your project.

The profiles can also be changed using an admin endpoint (for example, to use this with an automated testing solution).  To do so, simply POST to {host}:{port}/_admin/api/profile/{profile name}.
