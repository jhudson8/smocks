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


Sections
--------------
### Concepts
#### Admin Panel
Whenever the mock server is running, you can view an admin panel at ```{host}:{port}/_admin```.  Using this, you can

* Select what type of response your routes should have (see Variants)
* Execute route specific actions (see Actions)
* View all available routes by label or path
* Set route specific or global configuration input fields (see Config)
* Save all current settings as a profile (selected route variant and config values) to be applied at a later time (see Profiles)



#### Routes
A route by itself is really nothing more than a [HAPI route](http://hapijs.com/api#serverrouteoptions).  The route definition has a ```handler``` attribute which is called when the endpoint is hit.  This handler is nothing more than a [HAPI route handler](http://hapijs.com/api#route-handler).

Routes are defined using the ```route``` method on the ```smocks``` object.  An object parameter is provided with the following attributes

* _id_: (optional) the route id - used for the RESTful admin API and profile settings
* _label_: (optional) the route label - used for display on the admin panel
* _path_: the route path
* _method_: (optional) the route method - defaults to ```GET```
* _handler_: (optional) the [HAPI route handler](http://hapijs.com/api#route-handler) which provides the route response.  This is optional because you could use multiple vairants to handle the response.  (see Variants).
* _config_: An object contain input configuration meta data (see Configuration)
* _display_: A function which can return [markdown]([markdown](http://daringfireball.net/projects/markdown/)) where the contents are exposed when viewing the route information on the amin panel
* _actions_: An object containing a set of actions associated with this route (see Actions)

In more detail, you can...

Add config parameters that are exposed through the admin panel

```javascript
    var smocks = require('smocks');
    smocks.route({
      // labels aren't required but make things easier to view in the admin panel for non-technical people
      id: 'my_route',
      label: 'My Route',
      path: '/api/foo',
      method: 'GET',
      config: {
        // more about config later
        agreementAccepted: {
          label: 'agreement accepted?',
          type: 'boolean',
          defaultValue: false
        }
      }
      handler: function(request, reply) {
        // you can control this value through the admin panel
        var agreementAccepted = this.config('agreementAccepted');
        reply({accepted: agreementAccepted});
      }
    })
```


Provide multiple response types for each route (called Variants).  With the variants below, you can select which type of response the ```/api/foo``` route should respond with in the admin panel.  More about variants later...

```javascript
    var smocks = require('smocks');
    smocks.route({
      id: 'my_route',
      path: '/api/foo',
      handler: function(request, reply) {
        // this is essentially the same as the "default" variant
        reply({firstName: 'John'});
      }
    })
    .variant({
      // in this case the label really isn't necesary since it would be the same as the id
      id: 'Billy',
      handler: function(request, reply) {
        reply({firstName: 'Billy'});
      }
    })
    .variant({
      // in this case the label really isn't necesary since it would be the same as the id
      id: 'Clark',
      handler: function(request, reply) {
        reply({firstName: 'Billy'});
      }
    })
```


You can provide a display value which will be used when viewing the route details in the admin panel.  We haven't discussed state yet but this is meaningful to represent the current state of things for quick glance in the admin panel.  The admin panel supports [markdown](http://daringfireball.net/projects/markdown/) for your display response.

```javascript
    var smocks = require('smocks');
    smocks.route({
      // ...
      display: function() {
        return '* this will show up as a <ul>';
      }
    })
```


You can expose "actions" which are represented as buttons.  These are meaningful to quickly make changes to the state of things.  Actions, like routes and variants, can accept config parameters which will allow you to input data required to perform the action.

```javascript
    var smocks = require('smocks');
    smocks.route({
      // ...
      config: {
        yourPhoneNumber: {
          label: 'What is your phone number?',
          type: 'text',
          defaultValue: '999.867.5309'
        }
      }
    })

    // now define our action for the previous route
    .action({
      id: 'the_action_id',
      label: 'the button label',
      config: {
        yourName: {
          label: 'What is your name?',
          type: 'text',
          defaultValue: 'John Doe'
        }
      },
      handler: function(config) {
        // this is how you access action specific user input
        var yourName = config.yourName;
        // this is how you access user input created for the route
        var phoneNumber = this.config('yourPhoneNumber');
        // now I would perform whatever action needs to be taken
        // I would make changes to "state" most likely (more about state later)
      }
    })
```


You can use dynamic parameters in the route path, get access to query parameters and the body payload.  See [path parameters](http://hapijs.com/api#path-parameters) for more details.

```javascript
    var smocks = require('smocks');
    smocks.route({
      path: '/api/customer/{id}'
      handler: function(config) {
        // would be "123" if the endpiont hit was "/api/customer/123"
        var id = request.params.id;

        // would be "bar" if the endpoint hit was "/api/customer/123?foo=bar"
        var foo = request.query.foo;

        // would be "bar" if the posted body content (as JSON) was {"foo": "bar"}
        var foo = request.payload.foo;
      }
    })
```



#### Variants
We briefly touch on variants when discussing routes but variants are route handlers that can be selected by you in the admin panel (or with a RESTful API) to determine what type of response a route should have.

Routes are defined using the ```variant``` method on the ```Route``` object (returned by calling the ```route``` method.  An object parameter is provided with the following attributes

* _id_: (optional) the route id - used for the RESTful admin API and profile settings
* _label_: (optional) the route label - used for display on the admin panel
* _config_: An object contain input configuration meta data (see Configuration)
* _handler_: (optional) the [HAPI route handler](http://hapijs.com/api#route-handler) which provides the route response

Variants are useful because they allow yout test multiple scenarios that can happen with your route.  Say, for example, you have a route exposing the ability to update a password.  You might have several exceptional scenarios that you would want to test out (each could be a vairant that you simply select to tell the route handler to use the appropriate response)

* the password was reset successfully
* the password didn't pass validation
* the old password wasn't entered correctly
* the username doesn't exist
* and so on...

In more detail, you can...

Have multiple variants associated with a single route

```javascript
    var smocks = require('smocks');
    smocks.route({...})

      .variant(...)

      .variant(...)

      .variant(...)
```


Add variant specific config parameters (only visible if the variant is selected as the active variant) that are exposed through the admin panel

```javascript
    var smocks = require('smocks');
    smocks.route({...})

      .variant({
        id: 'invalid_password',
        label: 'invalid password',
        handler: function(request, reply) {
          // the input value is retrieved using this.config('varName');
          var typeOfValidationError = this.config('typeOfValidationError')
          reply({error: 'field', message: typeOfValidationError}).code(400);
        },
        config: {
          // the key is the identifier used to retrieve the value
          typeOfValidationError: {
            // the input field label
            label: 'What type of validation error?',
            // type can be "boolean", "text", "select", "multiselect"
            type: 'text',
            // the value shown if no selection has been made
            defaultValue: 'password too short'
          }
        }
      })
```



#### Route / variant configuration

Different types of input fields can be defined for routes or variants including ```boolean```, ```text```, ```select```, ```multiselect```.  Through the admin panel, you can modify these config values.

Routes and Variants when defined can provide an optional ```config``` attribute which defines any input fields that should be shown in the admin panel.  This config attribute is an object with each attribute relating to a single input field and the associated key as the input field id.

The attributes for each input field setting are

* _label_: the input field label
* _type_: the input field type (```boolean|text|select|multiselect```)
* _defaultValue_: the value for the input field when the user has not yet made a selection in the admin panel
* _options_: (specific to ```select``` and ```multiselect```) an array of options for the input field.  Each element in the array is an object with a ```value``` and ```label``` attribute.

Config values are referenced using ```this.config('varName')``` where ```varName``` is the specific config attribute key.

```javascript
    smock.route({
      ...
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
        }
      },
      handler: function(request, response) {
        var aBooleanField = this.config('aBooleanField'); // boolean
        var someTextField = this.config('someTextField'); // string
        var someSelectBox = this.config('someSelectBox'); // integer (because the values are integers)
        var someMultiSelect = this.config('someMultiSelect'); // array of integer (because the values are integers)
        // ...
      });
```

The same ```config``` values can be applied at the variant level as well.

The previous config example would look like this in the admin panel
![admin panel](http://jhudson8.github.io/smocks/images/config-types.png)



#### Route options

This is similar to Route / variant config except that these values are not exposed within the admin console.  They are accessable within the route handlers though.

This is mostly useful for global plugins (see Plugins).

Within the route handler, the options values can be accessed by using ```this.options('varName')```.

```javascript
    var smocks = require('smocks');

    smocks.route(...)
      .options({
        requiresLogin: true
      })
    .respondWith(function(request, reply) {
      var value = this.options('requiresLogin');
      // do something with the value
    })
```



#### State

The real benefit to using ```smocks``` is that state can be maintained.  Within any response handler, use ```this.state('varName')``` to access an object stored in the state and ```this.state('varName', 'varValue')``` where ```varValue``` can be any type of object you want.  There is a button on the admin panel which allows you to reset the state and start over.

```javascript
    var smocks = require('smocks');

    smocks.route({
      route: '/api/login',
      method: 'POST',
      handler: function(request, reply) {
        // now you can use this.state('loggedIn') in any route handler to see if the user has logged in
        this.state('loggedIn', true);
        reply().code(204);
      }
    });
```



### Plugins

Plugins can be used to perform an action on all requests or just to encapsulate a set of route handlers.  Plugins can have config values just like Routes or Variants.

Plugins are just simple objects that have the following attributes

* _plugin_: (optional) if exists, will simply be called with a single parameter (the smocks object) so you can add new routes.
* _config_: (optional) config definitions to allow the user with different types of input fields in the admin panel.  See the next section (Config types) for more details
* _onRequest_: Called before the route handler (variant) executes for every request.  It is similar to the ([request, reply](http://hapijs.com/api#route-handler)) of the route handlers (Variants) but has an additional callback method that should be executed when the plugin has finished doing what it needs to do.

* _onResponse_: Called after the route handler (variant) executes for every request.  Parameters are similar to ```onRequest``` except the 2nd parameter is the return value from the [reply method (see response object)](http://hapijs.com/api#reply-interface).

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

Or, check to see if the use has logged in (assuming the route exposed a ```requiresLogin``` option; see Route Options).  We are using state (see State) to track if the login endpoing has been hit prior to the current route.

```javascript
    var smocks = require('smocks');
    smocks.plugin({
      onRequest: function(request, reply, next) {
        // only do this check if the route exposed a "requiresLogin" option
        if (this.options('requiresLogin')) {
          // now, see if we have previously logged in (the login route would have set this state value)
          if (!this.state('loggedIn')) {
            // if we haven't logged respond with a 401 and bypass calling "next"
            return reply({error: 'auth', message: 'Not logged in'}).code(401);
          }
        }
        
        next();
      }
    });
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



### Profiles

Using the Admin Panel, you can save all route, variant and config settings as a "profile".  Profiles can either be saved locally (using localStorage) or remotely by providing the code to update in your project.

The profiles can also be changed using an admin endpoint (for example, to use this with an automated testing solution).  To do so, simply POST to {host}:{port}/_admin/api/profile/{profile name}.



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

