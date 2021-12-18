/**
 * Fantom type to get round of limitation of absence 
 * of higher-kinded types in typescript.
 * 
 * **There is no real run-time represention of this type**
 * and it's purpose is only helping type-system to keep correct type-information.
 * 
 * In a runtime value of type `hot<h, l>` is always `h<l>` for whatever `h` and `l`
 * 
 * The user is adviced to write pair of functions
 * ```
 * const materialize: <a>(v: hot<SomeType<any>, a>) => SomeType<a>
 *      = x => x as any // yes, just cast as any
 * const dematerialize: <a>(v: SomeType<a>) => hot<SomeType<any>, a>
 *      = x => x as any // yes, just cast as any
 * ```
 * for any *concrete*
 * ```
 * type SomeType<a> = { ... }
 * ```
 * 
 * and use them whenever he's dealing with `hot<h, l>`
 */
export type hot<h, l> = {
    can_construct: never
    higher: h
    lower: l
}
