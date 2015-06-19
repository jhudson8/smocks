registerProject({"title":"smocks","summary":"Stateful HTTP mocking service built on top of [HAPI](http://hapijs.com/).  Easily add routes and different scenarios for each route including the ability to maintain state with an admin interface to control everything.\n\nWith smocks you can\n\n* create route definitions (with dynamic tokens)\n* define multiple route handlers (variants) for for any route (selectable through an admin panel)\n* add input configuration components for routes and variants (accessable through an admin panel)\n* define actions which can manipulate the current state and be executed from the admin pnael\n* use route request handlers that can keep a state for true dynamic mocking capabilities\n* define global request handlers (variants) which can be selected for any route\n* use plugins which can intercept all requests to perform actions\n* use a RESTful API to make configuration changes programatically","sections":[{"body":"The ```smocks.start``` method is used to start the server.  It kes a single argument which can either be\n\n_an options object_\nThis will call [start on a HAPI server](http://hapijs.com/api#serverstartcallback) and pass the options to that method.  Then, all of the defined routes will be applied to the HAPI server.\n\nYou would want to at least provide the following attributes\n\n* _host_: 'localhost' for example\n* port: 8000 for example (use a number rather than a string)\n\n_a HAPI server instance_\nAll of the routes will be applied but the server will not be started.\n\n```javascript\nvar smocks = require('smocks');\n\n  smocks.route(...)\n\n  .route(...)\n\n  .start({\n    host: 'localhost',\n    port: 8000\n  });\n\n// or, you can call start directly from smocks\nsmocks.start(...);\n```\n\nThe HAPI server will automatically have CORS headers applied to allow calls from any external domain.","title":"Starting the server","sections":[]},{"body":"","title":"Concepts","sections":[{"body":"Whenever the mock server is running, you can view an admin panel at ```{host}:{port}/_admin```.  Using this, you can\n\n* Select what type of response your routes should have (see [Variants](#link/%23section%2FConcepts%2FVariants))\n* Execute route specific actions (see Actions)\n* View all available routes by label or path\n* Set route specific or global configuration input fields (see [Route / Variant configuration](#link/%23section%2FConcepts%2FRoute%252520%25252F%252520variant%252520configuration))\n* Save all current settings as a profile (selected route variant and config values) to be applied at a later time (see [Profiles](#link/%23section%2FConcepts%2FProfiles))\n\nThroughout these docs, you will see different screenshots to understand how different route configurations are represented in the admin panel.","title":"Admin Panel","sections":[]},{"body":"A route by itself is really nothing more than a [HAPI route](http://hapijs.com/api#serverrouteoptions).  The route definition has a ```handler``` attribute which is called when the endpoint is hit.  This handler is nothing more than a [HAPI route handler](http://hapijs.com/api#route-handler).\n\nRoutes are defined using the ```route``` method on the ```smocks``` object.  An object parameter is provided with the following attributes\n\n* _id_: (optional) the route id - used for the RESTful admin API and profile settings\n* _label_: (optional) the route label - used for display on the admin panel\n* _path_: the route path\n* _method_: (optional) the route method - defaults to ```GET```\n* _handler_: (optional) the [HAPI route handler](http://hapijs.com/api#route-handler) which provides the route response.  This is optional because you could use multiple vairants to handle the response.  (see Variants).\n* _config_: An object contain input configuration meta data (see Configuration)\n* _display_: A function which can return [markdown]([markdown](http://daringfireball.net/projects/markdown/)) where the contents are exposed when viewing the route information on the amin panel\n* _actions_: An object containing a set of actions associated with this route (see Actions)\n\nIn more detail, you can...\n\nAdd config parameters that are exposed through the admin panel\n\n```javascript\n    var smocks = require('smocks');\n    smocks.route({\n      // labels aren't required but make things easier to view in the admin panel for non-technical people\n      id: 'my_route',\n      label: 'My Route',\n      path: '/api/foo',\n      method: 'GET',\n      config: {\n        // more about config later\n        agreementAccepted: {\n          label: 'agreement accepted?',\n          type: 'boolean',\n          defaultValue: false\n        }\n      },\n      handler: function(request, reply) {\n        // you can control this value through the admin panel\n        var agreementAccepted = this.config('agreementAccepted');\n        reply({accepted: agreementAccepted});\n      }\n    })\n```\n\n![route ex1](http://jhudson8.github.io/smocks/images/route-ex1.png)\n\n\nProvide multiple response types for each route (called Variants).  With the variants below, you can select which type of response the ```/api/foo``` route should respond with in the admin panel.  More about variants later...\n\n```javascript\n    var smocks = require('smocks');\n    smocks.route({\n      id: 'my_route',\n      path: '/api/foo',\n      handler: function(request, reply) {\n        // this is essentially the same as the \"default\" variant\n        reply({firstName: 'John'});\n      }\n    })\n    .variant({\n      // in this case the label really isn't necesary since it would be the same as the id\n      id: 'Billy',\n      handler: function(request, reply) {\n        reply({firstName: 'Billy'});\n      }\n    })\n    .variant({\n      // in this case the label really isn't necesary since it would be the same as the id\n      id: 'Clark',\n      handler: function(request, reply) {\n        reply({firstName: 'Billy'});\n      }\n    })\n```\n\n![route ex2](http://jhudson8.github.io/smocks/images/route-ex2.png)\n\n\nYou can provide a display value which will be used when viewing the route details in the admin panel.  We haven't discussed state yet but this is meaningful to represent the current state of things for quick glance in the admin panel.  The admin panel supports [markdown](http://daringfireball.net/projects/markdown/) for your display response.\n\n```javascript\n    var smocks = require('smocks');\n    smocks.route({\n      // ...\n      display: function() {\n        return '* this will show up as a unordered list';\n      }\n    })\n```\n\n![route ex3](http://jhudson8.github.io/smocks/images/route-ex3.png)\n\n\nYou can expose \"actions\" which are represented as buttons.  These are meaningful to quickly make changes to the state of things.  Actions, like routes and variants, can accept config parameters which will allow you to input data required to perform the action.\n\n```javascript\n    var smocks = require('smocks');\n    smocks.route({\n      // ...\n      config: {\n        yourPhoneNumber: {\n          label: 'What is your phone number?',\n          type: 'text',\n          defaultValue: '999.867.5309'\n        }\n      },\n\n      // now define our action for the previous route\n      actions: {\n        'the_action_id': {\n          label: 'the button label',\n          config: {\n            yourName: {\n              label: 'What is your name?',\n              type: 'text',\n              defaultValue: 'John Doe'\n            }\n          },\n          handler: function(config) {\n            // this is how you access action specific user input\n            var yourName = config.yourName;\n            // this is how you access user input created for the route\n            var phoneNumber = this.config('yourPhoneNumber');\n            // now I would perform whatever action needs to be taken\n            // I would make changes to \"state\" most likely (more about state later)\n          }          \n        }\n\n      }\n    })\n```\n\n![route ex4](http://jhudson8.github.io/smocks/images/route-ex4.png)\n\nYou can use dynamic parameters in the route path, get access to query parameters and the body payload.  See [path parameters](http://hapijs.com/api#path-parameters) for more details.\n\n```javascript\n    var smocks = require('smocks');\n    smocks.route({\n      path: '/api/customer/{id}'\n      handler: function(config) {\n        // would be \"123\" if the endpiont hit was \"/api/customer/123\"\n        var id = request.params.id;\n\n        // would be \"bar\" if the endpoint hit was \"/api/customer/123?foo=bar\"\n        var foo = request.query.foo;\n\n        // would be \"bar\" if the posted body content (as JSON) was {\"foo\": \"bar\"}\n        var foo = request.payload.foo;\n      }\n    })\n```","title":"Routes","sections":[]},{"body":"We briefly touch on variants when discussing routes but variants are route handlers that can be selected by you in the admin panel (or with a RESTful API) to determine what type of response a route should have.\n\nRoutes are defined using the ```variant``` method on the ```Route``` object (returned by calling the ```route``` method.  An object parameter is provided with the following attributes\n\n* _id_: (optional) the route id - used for the RESTful admin API and profile settings\n* _label_: (optional) the route label - used for display on the admin panel\n* _config_: An object contain input configuration meta data (see Configuration)\n* _handler_: (optional) the [HAPI route handler](http://hapijs.com/api#route-handler) which provides the route response\n\nVariants are useful because they allow yout test multiple scenarios that can happen with your route.  Say, for example, you have a route exposing the ability to update a password.  You might have several exceptional scenarios that you would want to test out (each could be a vairant that you simply select to tell the route handler to use the appropriate response)\n\n* the password was reset successfully\n* the password didn't pass validation\n* the old password wasn't entered correctly\n* the username doesn't exist\n* and so on...\n\nIn more detail, you can...\n\nHave multiple variants associated with a single route\n\n```javascript\n    var smocks = require('smocks');\n    smocks.route({...})\n\n      .variant(...)\n\n      .variant(...)\n\n      .variant(...)\n```\n\n\nAdd variant specific config parameters (only visible if the variant is selected as the active variant) that are exposed through the admin panel\n\n```javascript\n    var smocks = require('smocks');\n    smocks.route({...})\n\n      .variant({\n        id: 'invalid_password',\n        label: 'invalid password',\n        handler: function(request, reply) {\n          // the input value is retrieved using this.config('varName');\n          var typeOfValidationError = this.config('typeOfValidationError')\n          reply({error: 'field', message: typeOfValidationError}).code(400);\n        },\n        config: {\n          // the key is the identifier used to retrieve the value\n          typeOfValidationError: {\n            // the input field label\n            label: 'What type of validation error?',\n            // type can be \"boolean\", \"text\", \"select\", \"multiselect\"\n            type: 'text',\n            // the value shown if no selection has been made\n            defaultValue: 'password too short'\n          }\n        }\n      })\n```","title":"Variants","sections":[]},{"body":"Different types of input fields can be defined for routes or variants including ```boolean```, ```text```, ```select```, ```multiselect```.  Through the admin panel, you can modify these config values.\n\nRoutes and Variants when defined can provide an optional ```config``` attribute which defines any input fields that should be shown in the admin panel.  This config attribute is an object with each attribute relating to a single input field and the associated key as the input field id.\n\nThe attributes for each input field setting are\n\n* _label_: the input field label\n* _type_: the input field type (```boolean|text|select|multiselect```)\n* _defaultValue_: the value for the input field when the user has not yet made a selection in the admin panel\n* _options_: (specific to ```select``` and ```multiselect```) an array of options for the input field.  Each element in the array is an object with a ```value``` and ```label``` attribute.\n\nConfig values are referenced using ```this.config('varName')``` where ```varName``` is the specific config attribute key.\n\n```javascript\n    smock.route({\n      ...\n      config: {\n        aBooleanField: {\n          label: 'Is this a checkbox?',\n          type: 'boolean',\n          defaultValue: true\n        },\n        someTextField: {\n          label: 'A text field',\n          type: 'text',\n          defaultValue: 'Hello'\n        },\n        someSelectBox: {\n          label: 'A select box',\n          type: 'select',\n          options: [{label: 'One', value: 1}, {label: 'Two', value: 2}, {label: 'Three', value: 3}],\n          defaultValue: 2\n        },\n        someMultiSelect: {\n          label: 'A check list',\n          type: 'multiselect',\n          options: [{label: 'One', value: 1}, {label: 'Two', value: 2}, {label: 'Three', value: 3}],\n          defaultValue: [2, 3]\n        }\n      },\n      handler: function(request, response) {\n        var aBooleanField = this.config('aBooleanField'); // boolean\n        var someTextField = this.config('someTextField'); // string\n        var someSelectBox = this.config('someSelectBox'); // integer (because the values are integers)\n        var someMultiSelect = this.config('someMultiSelect'); // array of integer (because the values are integers)\n        // ...\n      });\n```\n\n![config example](http://jhudson8.github.io/smocks/images/config-ex1.png)\n\nThe same ```config``` values can be applied at the variant level as well.","title":"Route / variant configuration","sections":[]},{"body":"This is similar to Route / variant config except that these values are not exposed within the admin console.  They are accessable within the route handlers though.\n\nThis is mostly useful for global plugins (see Plugins).\n\nWithin the route handler, the options values can be accessed by using ```this.options('varName')```.\n\n```javascript\n    var smocks = require('smocks');\n\n    smocks.route(...)\n      .options({\n        requiresLogin: true\n      })\n    .respondWith(function(request, reply) {\n      var value = this.options('requiresLogin');\n      // do something with the value\n    })\n```","title":"Route options","sections":[]},{"body":"The real benefit to using ```smocks``` is that state can be maintained.  Within any response handler, use ```this.state('varName')``` to access an object stored in the state and ```this.state('varName', 'varValue')``` where ```varValue``` can be any type of object you want.  There is a button on the admin panel which allows you to reset the state and start over.\n\n```javascript\n    var smocks = require('smocks');\n\n    smocks.route({\n      route: '/api/login',\n      method: 'POST',\n      handler: function(request, reply) {\n        // now you can use this.state('loggedIn') in any route handler to see if the user has logged in\n        this.state('loggedIn', true);\n        reply().code(204);\n      }\n    });\n```","title":"State","sections":[]},{"body":"There are 3 different ways of introducting dynamic behavior into your responses but each serve a different purpose.\n\n_config_\n\nConfig values are exposed as input fields in the admin panel so you have the ability to change the value at runtime.\n\nThese are accessed using ```this.config('varName')``` in any route handler.\n\n_options_\n\nOptions are like config but are not exposed in the admin panel.  These are most useful to expose metadata for a global pugin.  For example, you could have a plugin that examined all requests and, if the user hasn't signed in yet, respond with a 401 error.  The routes could expose an option value that indicated whether they were routes that required authentication.\n\nThese are accessed using ```this.option('varName')```.\n\n_state_\n\nState is used to, obviously, maintain state.  For example, if you expose a route that adds a new piece of data, you should store it in state.  The user can reset the state with a button on the admin panel.\n\nState values can be accessed using ```this.state('varName')```.\nState values can be set using ```this.state('varName', 'value')```.","title":"Config, options and state, oh my","sections":[]},{"body":"Plugins can be used to perform an action on all requests or just to encapsulate a set of route handlers.  Plugins can have config values just like Routes or Variants.\n\nPlugins are just simple objects that have the following attributes\n\n* _plugin_: (optional) if exists, will simply be called with a single parameter (the smocks object) so you can add new routes.\n* _config_: (optional) config definitions to allow the user with different types of input fields in the admin panel.  See the next section (Config types) for more details\n* _onRequest_: Called before the route handler (variant) executes for every request.  It is similar to the ([request, reply](http://hapijs.com/api#route-handler)) of the route handlers (Variants) but has an additional callback method that should be executed when the plugin has finished doing what it needs to do.\n\n* _onResponse_: Called after the route handler (variant) executes for every request.  Parameters are similar to ```onRequest``` except the 2nd parameter is the return value from the [reply method (see response object)](http://hapijs.com/api#reply-interface).\n\nThe following plugin will add simulated latency (which can be controlled by the user) to all requests.\n\n```\n    var smocks = require('smocks');\n    smocks.plugin({\n      // define the input field for the admin panel allowing the user to adjust the delay\n        config: {\n          delay: {\n            label: 'Add delay to all responses',\n            type: 'select',\n            options: [{label: 'no delay', value: 0}, {label: '1 sec', value: 1000}, {label: '5 sec', value: 5000}],\n            defaultValue: 0\n          }\n        },\n\n        // call \"next\" after a timeout if the user requested a delay\n        onRequest: function(request, reply, next) {\n          // get the delay value from config\n          var delay = this.config('delay');\n          if (delay > 0) {\n            // if there is a delay, call next after a timeout\n            setTimeout(next, delay);\n          } else {\n            next();\n          }\n        },\n\n        onResponse: function(request, response) {\n          // I can do things to the response here\n          response.code(404);\n        }\n      })\n```\n\n![plugin example](http://jhudson8.github.io/smocks/images/plugin-ex1.png)\n\nOr, check to see if the use has logged in (assuming the route exposed a ```requiresLogin``` option; see Route Options).  We are using state (see State) to track if the login endpoing has been hit prior to the current route.\n\n```javascript\n    var smocks = require('smocks');\n    smocks.plugin({\n      onRequest: function(request, reply, next) {\n        // only do this check if the route exposed a \"requiresLogin\" option\n        if (this.options('requiresLogin')) {\n          // now, see if we have previously logged in (the login route would have set this state value)\n          if (!this.state('loggedIn')) {\n            // if we haven't logged respond with a 401 and bypass calling \"next\"\n            return reply({error: 'auth', message: 'Not logged in'}).code(401);\n          }\n        }\n        \n        next();\n      }\n    });\n```","title":"Plugins","sections":[]},{"body":"Using the Admin Panel, you can save all route, variant and config settings as a \"profile\".  Profiles can either be saved locally (using localStorage) or remotely by providing the code to update in your project.\n\nThe profiles can also be changed using an admin endpoint (for example, to use this with an automated testing solution).  To do so, simply POST to {host}:{port}/_admin/api/profile/{profile name}.\n\nGlobal profiles can be set applied to the ```smocks``` object.  The easiest way to do this is to make your changes in the admin panel, enter the ```Profile Name``` in the settings header, and click the ```for everyone``` button.  You will be provided with the code that is necessary for the provide to be loaded globally.\n\n![profile example](http://jhudson8.github.io/smocks/images/profile-ex1.png)","title":"Profiles","sections":[]}]},{"body":"_reset the state_\nPOST to ```{host}:{port}/_admin/api/state/reset```\n\n_set an active route variant_\nPOST to ```{host}:{port}/_admin/api/route/{routeId}/variant/{variantId}\n\n_select a profile_\nPOST to ```/_admin/api/profile/{profile name}```","title":"RESTful admin API","sections":[]}],"api":{"API":{"methods":{},"packages":{"global":{"overview":"","methods":{"route":{"profiles":["options"],"params":{"options":"object containing the following values","path":"the route path (must start with ```/```).  Ex: ```/api/customer/{id}```","label":"An optional human readable label that can be seen in the admin panel for this route","method":"optional method (GET is default)","handler":"optional default route handler (same as the first variant applied to this route)"},"summary":"Register a route handler to enable setting the method, adding variants or config properties.","dependsOn":[],"overview":"To see how variables can be used in the path, refer to the [HAPI routing guide](http://hapijs.com/tutorials/routing).\n\nReturn the associated [Route object](#project/jhudson8/smocks/snippet/package/Route).\n\n```javascript\n    var smocks = require('smocks');\n    smocks.route({\n      method: 'POST', // optional if method is 'GET'\n      path: '/api/customer/{customerId}',\n      handler: function(request, reply) {\n        // route handler but we would use replyWith if we have\n        // multiple variants\n      }\n    })\n    .replyWith(function(request, reply) {\n      // another way of definiting route handlers\n    })\n    ...\n```"},"plugin":{"profiles":["plugin"],"params":{"plugin":"the plugin object"},"summary":"Register the plugin.  See the plugin object type for details.  Return the [global object](#link/%23project%2Fjhudson8%2Fsmocks%2Fsnippet%2Fpackage%2Fglobal).","dependsOn":[],"overview":""},"start":{"profiles":["options"],"params":{"options":"either object {host, port} or a HAPI server instance"},"summary":"Start a HAPI server with the defined mock configuration.","dependsOn":[],"overview":"Both the host and port are optional and will default to ```localhost``` and ```8080```.\n\nIf a HAPI server instance is provided, the routes will be bound to the HAPI server provided but the ```start``` method will not be called."}}},"Route":{"overview":"","methods":{"route":{"profiles":["options"],"params":{},"summary":"Refer to [global:route](#link/%23project%2Fjhudson8%2Fsmocks%2Fsnippet%2Fmethod%2Fglobal%2Froute)","dependsOn":[],"overview":""},"config":{"profiles":["attributes"],"params":{"attributes":"The configuration attributes"},"summary":"Set any configuration attributes that will be available for modification on the admin panel.","dependsOn":[],"overview":"See [config example](#project/jhudson8/smocks/section/Examples/Route%20%2F%20variant%20configuration) for details.\n\nReturn the same route object for chaining.\n\n```javascript\n    var smocks = require('smocks');\n    smocks.route(...)\n    .config({\n      myVar: {\n        label: 'Config label',\n        type: 'boolean|text|select|multiselect',\n        defaultValue: ...\n      }\n    })\n    .respondWith(...)\n```"},"variant":{"profiles":["id"],"params":{"id":"the variant id"},"summary":"Set up a new route variant with the provided id.  The id is meaningful when selecting the active variant from the admin panel.","dependsOn":[],"overview":"A variant is basically a single request handler for a defined route.  This is useful to test out different scenarios for a single route definition.\n\nReturn the [Variant object](#project/jhudson8/smocks/snippet/package/Variant).\n\n```javascript\n    var smocks = require('smocks');\n    smocks.route(...)\n    .variant('respond like this').respondWith(...)\n    .variant('respond like that').respondWith(...)\n```"},"plugin":{"profiles":["plugin"],"params":{},"summary":"Refer to [global:plugin](#link/%23project%2Fjhudson8%2Fsmocks%2Fsnippet%2Fmethod%2Fglobal%2Fplugin)","dependsOn":[],"overview":""},"respondWith":{"profiles":["requestHandler"],"params":{"requestHandler":"The [RequestHandler](#project/jhudson8/smocks/section/Object%20Types/RequestHandler)"},"summary":"Convienance method for creating a default variant (id of \"default\") and then calling [Variant:respondWith](#link/%23project%2Fjhudson8%2Fsmocks%2Fsnippet%2Fmethod%2FVariant%2FrespondWith) on the variant.","dependsOn":[],"overview":""},"respondWithFile":{"profiles":["filePath"],"params":{},"summary":"Convienance method for creating a default variant (id of \"default\") and then calling [Variant:respondWithFile](#link/%23project%2Fjhudson8%2Fsmocks%2Fsnippet%2Fmethod%2FVariant%2FrespondWithFile) on the variant.","dependsOn":[],"overview":""}}},"Variant":{"overview":"","methods":{"route":{"profiles":["options"],"params":{},"summary":"Refer to [global:route](#link/%23project%2Fjhudson8%2Fsmocks%2Fsnippet%2Fmethod%2Fglobal%2Froute)","dependsOn":[],"overview":""},"config":{"profiles":["attributes"],"params":{"attributes":"The configuration attributes"},"summary":"Set any variant-scoped configuration attributes that will be available for modification on the admin panel.","dependsOn":[],"overview":"See [config example](#project/jhudson8/smocks/section/Examples/Route%20%2F%20variant%20configuration) for details.\n\nReturn the same Variant object for chaining."},"variant":{"profiles":["id"],"params":{},"summary":"Refer to [Route:variant](#link/l%23project%2Fjhudson8%2Fsmocks%2Fsnippet%2Fmethod%2FRoute%2Fvariant)","dependsOn":[],"overview":""},"plugin":{"profiles":["plugin"],"params":{},"summary":"Refer to [global:plugin](#link/%23project%2Fjhudson8%2Fsmocks%2Fsnippet%2Fmethod%2Fglobal%2Fplugin)","dependsOn":[],"overview":""},"respondWith":{"profiles":["requestHandler"],"params":{"requestHandler":"The [RequestHandler](#project/jhudson8/smocks/section/Object%20Types/RequestHandler)"},"summary":"Associate a request handler with the current route/method/variant combination.","dependsOn":[],"overview":"Return the same Variant object for chaining.\n\n```javascript\n    var smocks = require('smocks');\n    smocks.route(...).respondWith(function(request, reply) {\n      var theMessage = request.params.message;\n      var aQueryStringValue = request.query.theQueryStringKey;\n      reply({message: theMessage}); // reply with a JSON payload\n      // or reply with something else\n      reply({error: {message: 'Some unknown error'}}).code(500);\n    });\n```"},"respondWithFile":{"profiles":["filePath"],"params":{"filePath":"the path to the file to serve out (any route variables can be used in the file path as well)"},"summary":"Remember that using ```./``` will refer to the top level module directory (the directory where ```node_modules``` exists regardless of the location of the file that is referring to a file location with ```./```);","dependsOn":[],"overview":"```javascript\n    var smocks = require('smocks');\n    smocks.route({path: '/customer/{id}'}).respondWithFile('./customer-{id}.json')\n    .start(...)\n```\n\nThis would cause a request to ```/customer/1``` to return the file ```./customer-1.json```\n\nReturn the same Variant object for chaining."}}}}}}});
