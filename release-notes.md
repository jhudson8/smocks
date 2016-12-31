# Release Notes

## v7.0.0
- Multiple smocks servers can be created
  * note: your code should still be ***mostly*** compatible as long as smocks.id(...) is the first function called
- `smocks.context` is always available as the `this` available to a route request handler
- `smocks.context.options` can be used to evaluate smocks options passed when starting the smocks server or creating the hapi plugin
- smocks admin page URL is now on `/`.  Use the `adminPath` smocks option to use an alternate.

Changes that you will need to make to your code

When creating a smocks instance (now you can have multiple)
```
var mockServer = require('smocks')(_arbitrary_server_id_);
// now you can use the old style
require('smocks').route(...);
// or the new way
mockServer.route(...);
```

When starting your HAPI server
```
// *almost* the old way
require('smocks/hapi').start(...);
// the new way
require('smocks/hapi')(mockServer).start(...);
```


## v6.0.0 - Dec 16th 2016
Reviewed documentation for accuracy and added docs for Route groupings.

Added new pseudo database functionality which saves to smocks state.  See [smocks.db docs](http://jhudson8.github.io/fancydocs/index.html#project/jhudson8/smocks/api/Pseudo%20Database) for more details.

## v5.0.0 - Dec 8th 2016
- bump HAPI version to 16
- allow empty path to show admin page (http://localhost:{port})

## v4.1.0 - Aug 18th 2016
allow a "group" route attribute to categorize route in the admin panel

```
smocks.route({
  ...
  group: 'Some Group'
});
```

## v4.0.7 - Jun 30th 2016
enhancement: Show route id and variant id in the details view

## v4.0.6 - Jun 8th 2016
bug fix: mutate host header when proxying to be correct

## v4.0.5 - May 26th 2016
fix proxy support for cookies

## v4.0.4 - May 25th 2016
fix bug with direct API access

## v4.0.3 - May 25th 2016
- fix proxying bug if multiple query parameters of the same name are provided

## v4.0.2 - March 8th 2016
- fix https://github.com/jhudson8/smocks/issues/12

## v4.0.1 - March 8th 2016
- fix issue with admin panel rendering after upgrade to babel@6

## v4.0.0 - March 2nd 2016
- upgrade to babel@6 for the admin panel transpilation

## v3.2.1 - February 10th 2016
- fix bug allowing initial state smocks option to be used when resetting state through admin panel

## v3.2.0 - February 10th 2016
- added custom `respondWithFile` handler capabilities
- fixed `boolen` input rendering on admin panel
- added `route` and `variant` attributes to `this` in the route response handler (to access route and active variant objects)
- added `initialState` smocks option for custom initial server state (or when state is reset)

## v3.1.3 - January 26th 2016

- add helpful tooltips to admin panel


## v3.1.2 - January 25th 2016

- fix global plugin config REST service


## v3.1.1 - January 24th 2016

bug fix: just added content type headers to resources used from the admin panel


## v3.1.0 - January 20th 2016

Allows a choice of to which connection endpoints are added
https://github.com/jhudson8/smocks/pull/2


## v3.0.2 - December 22nd 2015

don't return full config data (for admin panel) when making simple restful calls.  Not exactly a bug fix but an optimization.


## v3.0.1 - December 9th 2015

bug fix: I forgot to update direct API access to use `input` rather than `config`


## v3.0.0 - December 9th 2015

This release contains significant route / variant API refactoring.

* `config` route attributes are now called `input` (access using `this.input('...')`
* `options` route attributes are now called `meta` (access using `this.meta('...')`
* if a `config` attribute is provided for a route, it will be passed through as a [HAPI route config](http://hapijs.com/api#route-options)

In general, since the 2.0 release, the major additions are

* ability to upload and play back har files
* ability to proxy to another service


## v2.3.1 - December 5th 2015

- remove accidental console log


## v2.3.0 - December 5th 2015

- make the hapi plugin function be consistent with the start function (pluginOptions, smocksOptions)

```
var plugin = require('smocks/hapi').toPlugin({
  // hapi plugin options
  onRegister: function (server, options, next) {
    // this is optional but "next" must be called if used
  }
}, {
  // smocks core options
});
plugin.attributes = {
  pkg: require('/path/to/package.json')
};
module.exports = plugin;
``

This is not backwards compatible if you were using a previous version of the `toPlugin` method`


## v2.2.0 - November 4th 2015

- hapi server start config params has changed.  See details below

The ```require('smocks/hapi').start(hapiOptions, smocksOptions)``` method is used to start the server.

* ***hapiOptions***: the hapi connection options (at least `host` and `port` must be provided)
* ***smocksOptions***: (optional) and smocks options to be provided

For example

```
// initialize smocks routes here
require('smocks/hapi').start({
  host: 'localhost',
  port: 8080
});
```

The HAPI server will automatically have CORS headers applied unless the `routes` attribute is provided in the hapi options.


## v2.1.1 - November 3rd 2015

- downgrade wreck to be compatable with v1


## v2.1.0 - November 1st 2015

- Added proxy support

You can use smocks to be a straight proxy to another server.  To do so, you must provide the proxy details in the hapi start options.

```
smocks.start({
  port: 8000,
  host: 'localhost',
  options: {
    proxy: {
      '{key shown in admin panel}': '{fully qualified endpoint prefix before the request path}',
      // example
      'google': 'http://www.google.com'
      // or, using a function
      'google': function (request) {
        return ...
      }
    }
  }
});
```

View the `Config` tab on the admin panel to make any proxy setting changes.


## v2.0.5 - October 15th 2015
- bug fix: ensure the first variant defined for a route is used as the default


## v2.0.4 - October 14th 2015
- minor admin panel style fixes


## v2.0.3 - October 6th 2015
- add har call preview functionality


## v2.0.2 - October 6th 2015
- add more details to HAR data in admin page


## v2.0.1 - October 4th 2015
- Add fancier error messaging to match the fancy success messaging


## v2.0.0 - October 3rd 2015

Fresh new look, ability to replay HAR sessions, and a bunch of other stability enhancements.  You must now assign an id to your smocks instance using
```
require('smocks').id('my-project');
```
This allows you to have multiple project using smocks to have their own locally saved profiles - but the server will not start unless you set an id.


## v1.4.8 - October 3rd 2015
- admin style updates

yes, I should let the release bake so I don't have to release so often but... that's how I do things


## v1.4.7 - October 3rd 2015
- fix route rendering after HAR reset


## v1.4.6 - October 3rd 2015
- add dynamic HAR tracking


## v1.4.5 - October 3rd 2015
- add logo


## v1.4.4 - October 3rd 2015
- bug fix: rix RESTful endpoints


## v1.4.3 - October 3rd 2015
- bug fix: don't show view link for non-GET fixtures


## v1.4.2 - October 2nd 2015
- fix select component and profile management


## v1.4.1 - October 1st, 2015
- small fix to cache transpiled JSX code for admin panel


## v1.4.0 - October 1st, 2015
- Added ability to upload HAR files which will override mock responses
- MASSIVE overhaul of admin panel


## v1.3.1 - September 29th, 2015
- small spelling fix


## v1.3.0 - September 29th, 2015
- (beta) Add ability to replay HAR recordings (only JSON responses)


## v1.2.2 - September 29th, 2015
- bug fix: fix select box input plugin


## v1.2.1 - September 11th, 2015
- bug fix: don't use `reply.file` in admin pages


## v1.2.0 - September 10th, 2015
- Separated the smocks core from HAPI to allow for direct API access to fixtures

You can no longer call `start` from the smocks instance.  Instead, use `smocks/hapi`.

```
var smocks = require('smocks');
// add smocks fixtures just like you used to do

var server = require('smocks/hapi');
// same options as you used to do
server.start(...);
```


## v1.1.9 - August 7th, 2015
- added route id and variant id to be displayed in admin console to assist with API access - 7514214


## v1.1.8 - August 6th, 2015
- add getVariant method to route model for API access - 8cdf525


## v1.1.7 - August 5th, 2015
- fix profile loading bug - f36da2b


## v1.1.6 - August 3rd, 2015
- add ability to reset route configuration in admin panel - 7f92a44


## v1.1.5 - July 31st, 2015
- fix reset state button in admin panel - 66b61c0


## v1.1.4 - July 29th, 2015
- update permalinks to ensure that only the specific permalinked fixture is visible.  And to be path/label specific based on when the permalink was clicked - 4872a6d
- update filter component styles - c9f58f2


## v1.1.3 - July 29th, 2015
- added fixture permalinks in admin panel - 89d93bc


## v1.1.2 - July 29th, 2015
- bug fix: local profile application was not setting fixture variant selections correctly - 9ce0aa7


## v1.1.1 - July 28th, 2015
- bug fix: add path to cookie state - 0eaaa68 (only applies if using the 'session' state)


## v1.1.0 - July 28th, 2015
- added toHapiPlugin method to export a hapi plugin - 781bf91

Returning a Hapi plugin can be done using

```
smocks.toHapiPlugin(options);
```

- make state pluggable and add cookie-based state - 0ee9dd0

To use a session (cookie-based) state, include `state: 'session'` as a startup option


## v1.0.3 - July 22nd, 2015
- fix onAction bug - 1242e16


## v1.0.2 - July 20th, 2015
- add sanity checks to prevent duplicate route / variant ids - 23c7aa3


## v1.0.1 - July 19th, 2015
- bug fix: allow routes to use the "options" attribute - 030fc55


## v1.0.0 - July 3rd, 2015
initial 1.0 release


## v0.6.0 - June 30th, 2015
- bug fix: handle default route handler correctly - a2c2a7b
- allow global variants to have optional (route specific) config attributes - 1055c17


## v0.5.7 - June 19th, 2015
- minor bug fixes - 5d10c1c


## v0.5.6 - June 18th, 2015
- bug fix with boolean input type - 0ef7130


## v0.5.5 - June 17th, 2015
I should *really* do a minor release for this but I'm not ready to document all of this yet... I just want to be able to use the changes for right now.  Anyway, if you are the kind of person that reads realease notes, here is what you can do now:

Actions
For any route, you can call .action(options) and it will expose a button that you can push within that route.  This button will perform some action (most likely involving updating the state somehow).  The action can also be at the global level (if you call .action on require('smocks') rather than on a route).  The options provided to the action call are

* id: a unique identifier
* label: the button label
* handler: function (options): the handler function (the options objects relates to the values to any config entries provided for the action... use this.config(...) still for normal route config values)
* config: same type of config object that you would provide to a route


Display
You can now also provide a ```display``` function to a route and it will display that content when you are viewing the route details.  The return value must be a string and it will be formatted as markdown.

```
    .route({
      id: ...
      display: function () { return 'hello' }
    })
```

## v0.5.4 - June 17th, 2015
- minor tweaks to admin page and pluggable input types - f692eb3
- minor tweaks to admin panel - afba25a

The pluggable input types should actually come with a minor release but I've got a bit more of an API that I want to include (ability to bring in js libs / styles) and I'll do a minor release at that time.


## v0.5.3 - June 16th, 2015
- small tweaks to admin panel - 0732259


## v0.5.2 - June 15th, 2015
- bug fix: config defaultValue was not being applied - af4dbaf
- add better route filtering in the admin panel - daf7827


## v0.5.1 - June 14th, 2015
- small bug fixes - baf3274


## v0.5.0 - June 14th, 2015
- update "route" method.  It now looks more like a traditional HAPI route method by taking [an options object](http://hapijs.com/api#serverrouteoptions).
- add an optional "onResponse" lifecycle method to plugins
- you can now add route labels
- added route filtering by path or label in the admin panel
- add ability to save all route, variant and config selections as a "profile" in the admin panel


## v0.4.2 - June 12th, 2015
- this is a mock server that might be running on localhost.  we'll go ahead and apply the CORS headers - 5a35486


## v0.4.1 - June 12th, 2015
- add config values for plugins just like Routes/Variants have - 1701bca


## v0.4.0 - June 11th, 2015
- add support for optional human readable route labels - 5df5d38


## v0.3.1 - June 11th, 2015
- global plugin bug fix - 32b5afb


## v0.3.0 - June 11th, 2015
- refactoring ```onRequest``` -> ```respondWith``` and ```withFile``` -> ```respondWithFile``` - d95a07b


## v0.2.3 - June 11th, 2015
- small route visibility updates in admin panel - 4e32120


## v0.2.2 - June 10th, 2015
- added "view endoing" link for GET routes to  admin page - 5ec09ef


## v0.2.1 - June 10th, 2015
- update admin interface to support route filtering - a964455


## v0.2.0 - June 10th, 2015
- add the "withFile" route/variant method - 358b0e8


## v0.1.2 - June 10th, 2015
- sync text config field changes as they are typed (rather than blur) - 5659740


## v0.1.1 - June 10th, 2015
- fix bux to render resources from the correct directory - 9eb9e92


## v0.1.0 - June 9th, 2015
- add "Reset State" button to admin panel - a77d0db


## v0.0.2 - June 9th, 2015
initial release with core functionality
