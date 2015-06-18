# Release Notes

## Development

[Commits](https://github.com/jhudson8/smocks/compare/v0.5.6...master)

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
