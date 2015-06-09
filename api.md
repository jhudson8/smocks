smocks
==============

API
--------------
### global
#### route(path)
* ***path***: the route path (must start with ```/```).  Ex: ```/api/customer/{id}```

Register a route handler to enable setting the method, adding variants or config properties.

To see how variables can be used in the path, refer to the [HAPI routing guide](http://hapijs.com/tutorials/routing).

Return the associated [Route object](#project/jhudson8/smocks/snippet/package/Route).

#### plugin(plugin)
* ***plugin***: the plugin object

Register the plugin.  See the plugin object type for details.  Return the [global object](#project/jhudson8/smocks/snippet/package/global).

#### start(options)
* ***options***: either object {host, port} or a HAPI server instance

Start a HAPI server with the defined mock configuration.

Both the host and port are optional and will default to ```localhost``` and ```8080```.

If a HAPI server instance is provided, the routes will be bound to the HAPI server provided but the ```start``` method will not be called.


### Route
#### route(path)

Refer to [global:route](#project/jhudson8/smocks/snippet/method/global/route)

#### method(method)
* ***method***: the HTTP method (GET|POST|PUT|PATCH|DELETE)

Set the HTTP method for the current route and return the route object.

#### config(attributes)
* ***attributes***: The configuration attributes

Set any configuration attributes that will be available for modification on the admin panel.

See [config example](#project/jhudson8/smocks/section/Examples/Route%20%2F%20variant%20configuration) for details.

#### variant(id)
* ***id***: the variant id

Set up a new route variant with the provided id.  The id is meaningful when selecting the active variant from the admin panel.

A variant is basically a single request handler for a defined route.  This is useful to test out different scenarios for a single route definition.

Return the [Variant object](#project/jhudson8/smocks/snippet/package/Variant).

#### plugin(plugin)

Refer to [global:plugin](#project/jhudson8/smocks/snippet/method/global/plugin)

#### onRequest(requestHandler)
* ***requestHandler***: The [RequestHandler](#project/jhudson8/smocks/section/Object%20Types/RequestHandler)

Convienance method for creating a default variant (id of "default") and then calling [Variant:onRequest](#project/jhudson8/smocks/snippet/method/Variant/onRequest) on the variant.


### Variant
#### route(path)

Refer to [global:route](#project/jhudson8/smocks/snippet/method/global/route)

#### method(method)

Refer to [Route:method](#project/jhudson8/smocks/snippet/method/Route/method)

#### config(attributes)
* ***attributes***: The configuration attributes

Set any variant-scoped configuration attributes that will be available for modification on the admin panel.

See [config example](#project/jhudson8/smocks/section/Examples/Route%20%2F%20variant%20configuration) for details.

#### variant(id)

Refer to [Route:variant](l#project/jhudson8/smocks/snippet/method/Route/variant)

#### plugin(plugin)

Refer to [global:plugin](#project/jhudson8/smocks/snippet/method/global/plugin)

#### onRequest(requestHandler)
* ***requestHandler***: The [RequestHandler](#project/jhudson8/smocks/section/Object%20Types/RequestHandler)

Associate a request handler with the current route/method/variant combination.


Sections
--------------
### Admin Panel

If a route has multiple variants, the admin panel can be used to select which variant should handle the requests.  Also, the admin panel exposes any configuration input fields defined at the route or variant level.

To view the admin panel, visit [http://localhost:{port number}/_admin](http://localhost:8080/_admin)

***Note, to see route specific config options, click the route entry with your mouse.***


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
The ```onRequest``` method for variants and global plugins has access to the ```request``` and ```reply``` objects as parameters just like any [HAPI route handler](http://hapijs.com/api#route-handler).

Additionally, state, config and options values can be accessed.

* ***this.state***: ```function(key, value)``` if ```value``` is undefined, return the state value of ```key```.  Otherwise set the state value of ```key``` to ```value```.
* ***this.config***: ```function(key)``` return the config value matching the provided key
 ***this.option***: ```function(key)``` return the option value matching the provided key

```javascript
    ...
    onRequest(function(request, reply) {
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

    smocks.route('/api/foo')
        .method('POST')
            .variant('default')
                .onRequest(function(request, reply) {
                    ...
                })
            .variant('something_else')
                .onRequest(function(request, reply) {
                    ...
                })

    .start();
```

Now, in the admin panel, you will be able to choose between the ```default``` and ```something_else``` response handlers when a POST to ```/api/foo``` is executed.

(make sure to click on the route path in the admin panel to see config options)

#### Multiple route methods

It is easy to define handlers for multiple methods associated with a single route using the chaining API.  Simply call the ```method``` method any time to define a new route handler with the defined method.

```javascript
    var smocks = require('smocks');

    smocks.route('/api/foo')
        .method('GET')
            .onRequest(function(request, reply) {
                ...
            })

        .method('POST')
            .onRequest(function(request, reply) {
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

    smocks.route('/api/foo')
        // the method is not necessary - GET is the default
        .variant('default').onRequest(function(request, reply) {
          // this is the "default" variant for "/api/foo" (GET)
          ...
        })
        .variant('scenario1').onRequest(function(request, reply) {
          // this is the "scenario1" variant for "/api/foo" (GET)
          ...
        })
        .variant('scenario2').onRequest(function(request, reply) {
          // this is the "scenario2" variant for "/api/foo" (GET)
          ...
        })

      .method('POST')
        //  the variant is not necessary - "default" is the default variant id
        .onRequest(function(request, reply) {
          // this is the "default" variant for "/api/foo" (POST)
          ...
        })
        .variant('scenario1').onRequest(function(request, reply) {
          // this is the "scenario1" variant for "/api/foo" (POST)
          ...
        })

    .start();
```


#### Route / variant configuration

Different types of input fields can be defined for routes or variants including ```boolean```, ```text```, ```select```, ```multiselect```.  Through the admin panel, you can modify these config values.

```javascript
    smock.route('/api/foo')
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
      .variant('default').onRequest(function(request, reply) {
        var aBooleanField = this.config('aBooleanField'); // boolean
        var someTextField = this.config('someTextField'); // string
        var someSelectBox = this.config('someSelectBox'); // integer (because the values are integers)
        var someMultiSelect = this.config('someMultiSelect'); // array of integer (because the values are integers)
        // ...
      })
      .variant('scenario1').onRequest(function(request, reply) {
        // ...
        
      })
      .variant('scenario2').onRequest(function(request, reply) {
        // ...
      })
```

Then, within the route handler, the config values can be accessed by using ```this.config```.

The same ```config``` method can be applied at the variant level as well.

The previous config example would look like this in the admin panel
[admin panel](http://jhudson8.github.io/smocks/images/config-types.png)


#### Route / variant options

This is similar to Route / variant config except that these values are not exposed within the admin console.  They are accessable within the route handlers though.

This is mostly useful for global-level plugins.

```javascript
    var smocks = require('smocks');

    smocks.route('/api/foo')
      .options({
        theVarKey: 'the variable value'
      })
    .onRequest(function(request, reply) {
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

    smocks.route('/api/foo')
      ...

    .plugin({
      onRequest: function(request, reply, next) {
        // wait 1 sec before allowing the response to be handled
        setTimeout(next, 1000);
      }
    })
```

