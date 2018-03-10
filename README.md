# tform

_**[WARNING]** tform is in alpha and subject to imminent overhaul._ 

## Purpose

Written in TypeScript and short for record transformer, Tform applies a given set of rules to transform JSON-like structured data into a different structure. Rules take the form of easy-to-read-and-write functional expressions that can be serialized and applied safely at runtime.

Transformation state does not persist between records. Tform works well as a pre-processor for data from external sources, especially for record canonicalization.


## Design Criteria

* *Easy-to-read rules.* Rules to process Rimeto clients should become super simple after refactoring.
* *Extensible by 3rd parties.* As an open source project, can Tform be extended without modifying the source code? Can enough core functionality be separated from Rimeto-specific logic?
* *Exception handling.* Tform should handle errors gracefully while also providing a way to report any deviations from what the data should have looked like.
* *Serializable.* Being able to throw the rules into a database sets the stage for editing in a UI later.
* *Reduce state.* As much as possible, the design should encourage users to reduce dependence on state, and where state is necessary, make that state explicit to easily review what state gets used.

