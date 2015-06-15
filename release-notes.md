# Release Notes

## Development

[Commits](https://github.com/jhudson8/smocks/compare/v0.5.0...master)

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
