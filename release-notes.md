# Release Notes

## Development

[Commits](https://github.com/jhudson8/smocks/compare/v1.2.1...master)

## v1.2.2 - September 29th, 2015
- bug fix: fix select box input plugin

[Commits](https://github.com/jhudson8/smocks/compare/v1.2.1...master)

## v1.2.1 - September 11th, 2015
- bug fix: don't use `reply.file` in admin pages

[Commits](https://github.com/jhudson8/smocks/compare/v1.2.0...master)

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

[Commits](https://github.com/jhudson8/smocks/compare/v1.1.9...master)

## v1.1.9 - August 7th, 2015
- added route id and variant id to be displayed in admin console to assist with API access - 7514214


[Commits](https://github.com/jhudson8/smocks/compare/v1.1.8...v1.1.9)

## v1.1.8 - August 6th, 2015
- add getVariant method to route model for API access - 8cdf525


[Commits](https://github.com/jhudson8/smocks/compare/v1.1.7...v1.1.8)

## v1.1.7 - August 5th, 2015
- fix profile loading bug - f36da2b


[Commits](https://github.com/jhudson8/smocks/compare/v1.1.6...v1.1.7)

## v1.1.6 - August 3rd, 2015
- add ability to reset route configuration in admin panel - 7f92a44


[Commits](https://github.com/jhudson8/smocks/compare/v1.1.5...v1.1.6)

## v1.1.5 - July 31st, 2015
- fix reset state button in admin panel - 66b61c0


[Commits](https://github.com/jhudson8/smocks/compare/v1.1.4...v1.1.5)

## v1.1.4 - July 29th, 2015
- update permalinks to ensure that only the specific permalinked fixture is visible.  And to be path/label specific based on when the permalink was clicked - 4872a6d
- update filter component styles - c9f58f2


[Commits](https://github.com/jhudson8/smocks/compare/v1.1.3...v1.1.4)

## v1.1.3 - July 29th, 2015
- added fixture permalinks in admin panel - 89d93bc


[Commits](https://github.com/jhudson8/smocks/compare/v1.1.2...v1.1.3)

## v1.1.2 - July 29th, 2015
- bug fix: local profile application was not setting fixture variant selections correctly - 9ce0aa7


[Commits](https://github.com/jhudson8/smocks/compare/v1.1.1...v1.1.2)

## v1.1.1 - July 28th, 2015
- bug fix: add path to cookie state - 0eaaa68 (only applies if using the 'session' state)


[Commits](https://github.com/jhudson8/smocks/compare/v1.1.0...v1.1.1)

## v1.1.0 - July 28th, 2015
- added toHapiPlugin method to export a hapi plugin - 781bf91

Returning a Hapi plugin can be done using

```
smocks.toHapiPlugin(options);
```

- make state pluggable and add cookie-based state - 0ee9dd0

To use a session (cookie-based) state, include `state: 'session'` as a startup option


[Commits](https://github.com/jhudson8/smocks/compare/v1.0.3...v1.1.0)

## v1.0.3 - July 22nd, 2015
- fix onAction bug - 1242e16


[Commits](https://github.com/jhudson8/smocks/compare/v1.0.2...v1.0.3)

## v1.0.2 - July 20th, 2015
- add sanity checks to prevent duplicate route / variant ids - 23c7aa3


[Commits](https://github.com/jhudson8/smocks/compare/v1.0.1...v1.0.2)

## v1.0.1 - July 19th, 2015
- bug fix: allow routes to use the "options" attribute - 030fc55


[Commits](https://github.com/jhudson8/smocks/compare/v1.0.0...v1.0.1)

## v1.0.0 - July 3rd, 2015
initial 1.0 release


[Commits](https://github.com/jhudson8/smocks/compare/v0.6.0...v1.0.0)

## v0.6.0 - June 30th, 2015
- bug fix: handle default route handler correctly - a2c2a7b
- allow global variants to have optional (route specific) config attributes - 1055c17


[Commits](https://github.com/jhudson8/smocks/compare/v0.5.7...v0.6.0)

## v0.5.7 - June 19th, 2015
- minor bug fixes - 5d10c1c


[Commits](https://github.com/jhudson8/smocks/compare/v0.5.6...v0.5.7)

## v0.5.6 - June 18th, 2015
- bug fix with boolean input type - 0ef7130


[Commits](https://github.com/jhudson8/smocks/compare/v0.5.5...v0.5.6)

## v0.5.5 - June 17th, 2015
I should *really* do a minor release for this but I'm not ready to document all of this yet... I just want to be able to use the changes for right now.  Anyway, if you are the kind of person that reads realease notes, here is what you can do now:

Actions
For any route, you can call .action(options) and it will expose a button that you can push within that route.  This button will perform some action (most likely involving updating the state somehow).  The action can also be at the global level (if you call .action on require('smocks') rather than on a route).  The options provided to the action call are

* id: a unique identifier
* label: the button label
* handler: function(options): the handler function (the options objects relates to the values to any config entries provided for the action... use this.config(...) still for normal route config values)
* config: same type of config object that you would provide to a route


Display
You can now also provide a ```display``` function to a route and it will display that content when you are viewing the route details.  The return value must be a string and it will be formatted as markdown.

```
    .route({
      id: ...
      display: function() { return 'hello' }
    })
```

[Commits](https://github.com/jhudson8/smocks/compare/v0.5.4...v0.5.5)

## v0.5.4 - June 17th, 2015
- minor tweaks to admin page and pluggable input types - f692eb3
- minor tweaks to admin panel - afba25a

The pluggable input types should actually come with a minor release but I've got a bit more of an API that I want to include (ability to bring in js libs / styles) and I'll do a minor release at that time.

[Commits](https://github.com/jhudson8/smocks/compare/v0.5.3...v0.5.4)

## v0.5.3 - June 16th, 2015
- small tweaks to admin panel - 0732259


[Commits](https://github.com/jhudson8/smocks/compare/v0.5.2...v0.5.3)

## v0.5.2 - June 15th, 2015
- bug fix: config defaultValue was not being applied - af4dbaf
- add better route filtering in the admin panel - daf7827


[Commits](https://github.com/jhudson8/smocks/compare/v0.5.1...v0.5.2)

## v0.5.1 - June 14th, 2015
- small bug fixes - baf3274


[Commits](https://github.com/jhudson8/smocks/compare/v0.5.0...v0.5.1)

## v0.5.0 - June 14th, 2015
- update "route" method.  It now looks more like a traditional HAPI route method by taking [an options object](http://hapijs.com/api#serverrouteoptions).
- add an optional "onResponse" lifecycle method to plugins
- you can now add route labels
- added route filtering by path or label in the admin panel
- add ability to save all route, variant and config selections as a "profile" in the admin panel


[Commits](https://github.com/jhudson8/smocks/compare/v0.4.2...v0.5.0)

## v0.4.2 - June 12th, 2015
- this is a mock server that might be running on localhost.  we'll go ahead and apply the CORS headers - 5a35486


[Commits](https://github.com/jhudson8/smocks/compare/v0.4.1...v0.4.2)

## v0.4.1 - June 12th, 2015
- add config values for plugins just like Routes/Variants have - 1701bca


[Commits](https://github.com/jhudson8/smocks/compare/v0.4.0...v0.4.1)

## v0.4.0 - June 11th, 2015
- add support for optional human readable route labels - 5df5d38


[Commits](https://github.com/jhudson8/smocks/compare/v0.3.1...v0.4.0)

## v0.3.1 - June 11th, 2015
- global plugin bug fix - 32b5afb


[Commits](https://github.com/jhudson8/smocks/compare/v0.3.0...v0.3.1)

## v0.3.0 - June 11th, 2015
- refactoring ```onRequest``` -> ```respondWith``` and ```withFile``` -> ```respondWithFile``` - d95a07b


[Commits](https://github.com/jhudson8/smocks/compare/v0.2.3...v0.3.0)

## v0.2.3 - June 11th, 2015
- small route visibility updates in admin panel - 4e32120


[Commits](https://github.com/jhudson8/smocks/compare/v0.2.2...v0.2.3)

## v0.2.2 - June 10th, 2015
- added "view endoing" link for GET routes to  admin page - 5ec09ef


[Commits](https://github.com/jhudson8/smocks/compare/v0.2.1...v0.2.2)

## v0.2.1 - June 10th, 2015
- update admin interface to support route filtering - a964455


[Commits](https://github.com/jhudson8/smocks/compare/v0.2.0...v0.2.1)

## v0.2.0 - June 10th, 2015
- add the "withFile" route/variant method - 358b0e8


[Commits](https://github.com/jhudson8/smocks/compare/v0.1.2...v0.2.0)

## v0.1.2 - June 10th, 2015
- sync text config field changes as they are typed (rather than blur) - 5659740


[Commits](https://github.com/jhudson8/smocks/compare/v0.1.1...v0.1.2)

## v0.1.1 - June 10th, 2015
- fix bux to render resources from the correct directory - 9eb9e92


[Commits](https://github.com/jhudson8/smocks/compare/v0.1.0...v0.1.1)

## v0.1.0 - June 9th, 2015
- add "Reset State" button to admin panel - a77d0db


[Commits](https://github.com/jhudson8/smocks/compare/v0.0.2...v0.1.0)

## v0.0.2 - June 9th, 2015
initial release with core functionality


[Commits](https://github.com/jhudson8/smocks/compare/4e1adec...v0.0.2)
