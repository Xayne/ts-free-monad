import { CatList, CatNil, link, snoc, uncons } from "./internal/collections/cat-list"
import { hot } from "./hot"
import { TailRec } from "./tail-rec"

export class Free<f, v> {

    static Pure<f, v>(v: v): Free<f, v> {
        return new Free<f, v>({ type: FreeDataTag.Pure, v }, CatNil)
    }

    static Lift<f, v>(f: hot<f, v>): Free<f, v> {
        return new Free<f, v>(
            { type: FreeDataTag.Bind, v: f, next: Free.Pure },
            CatNil
        )
    }

    private constructor(
        private readonly data: FreeData<f, _, _>,
        private readonly expr: CatList<(a: _) => Free<f, _>>
        // last is always (a: _) => Free<f, v>, or if list is empty data is FreeData<f, _, v>
    ) { }


    flatMap<o>(f: (v: v) => Free<f, o>): Free<f, o> {
        return new Free(this.data, snoc(this.expr)(f))
    }

    map<o>(f: (v: v) => o): Free<f, o> {
        return this.flatMap(x => Free.Pure(f(x)))
    }

    exec(unbx: <a>(f: hot<f, a>) => a): v {
        let d = this.ibx()
        while (true) {
            if (d.type === FreeDataTag.Pure) {
                return d.v
            }
            d = d.next(unbx(d.v)).ibx()
        }
    }

    /**
     * Folds the free monad `Free f a` into other monad `m a`.
     * Providing fully correct typing for this method is not possible due to typescript's 
     * type-system limitations, so, the User is adviced to be very carefull when passing arguments here,
     * and is adviced to write separated utils for each concrete `f` and `m` types. See example.
     * 
     * ## Example
     * 
     * ```
     * type MyType<a> = { ... }
     * 
     * const foldMyMonadToObservable: <a>(m: Free<MyType<any>, a>) => Observable<a>
     *      = m => m.fold(
     *                  unboxImplementation,
     *                  x => of(x),
     *                  f => obs => concatMap(f)(obs) 
     *             )
     * 
     * ```
     * * `unboxImplementation` is a core of the method. 
     * for any `hot<MyType<any>, a>` it must return `Observable<a>` 
     * (`hot<MyType<any>, a>` actually is `MyType<a>`, check the `hot` type doc for more info)
     * 
     * * `of` is from rxjs lib, for whatever `a` it returns `Observable<a>`
     * 
     * * `concatMap` is from rxjs lib, for whatever `(a: a) => Observable<b>` and `Observable<a>`
     * it returns `Observable<b>`
     * 
     * Any other monad instead of `Observable` can be used here
     * (just substitute `Observable` in this example with a monad type and provide correct arguments)
     */
    fold<mv, ma>(
        /** actually: ```f a -> m a``` */
        nat: <a>(f: hot<f, a>) => ma,
        /** actually: ```a -> m a``` */
        pure: (v: v) => mv,
        /** actually: ```(a -> m b) -> m a -> m b``` */
        // fmap: <a, ma, mb>(f: (a: a) => mb) => (ma: ma) => mb
        fmap: (f: (a: v) => mv) => (ma: mv) => mv
    ): mv {
        const d = this.ibx()
        if (d.type === FreeDataTag.Pure) {
            return pure(d.v)
        }
        return fmap(v => d.next(v).fold(nat, pure, fmap))(nat(d.v) as any)
    }

    
    /** 
     * Folding into `TailRec` monad. 
     * 
     * Experimental, still in testing
     */
    fold_tr<mv, ma>(
        /** actually: ```a -> m a``` */
        pure: (v: v) => mv,
        /** actually: ```f a -> m a``` */
        nat: <a>(f: hot<f, a>) => ma,
    ): TailRec<mv> {
        const d = this.ibx()
        if (d.type === FreeDataTag.Pure) {
            return { type: 'Done', v: pure(d.v) }
        }
        return {
            type: 'Next',
            v: nat(d.v) as any,
            next: v => d.next(v).fold_tr(pure, nat)
        }
    }

    private ibx(): FreeData<f, _, v> {
        const d = this.data
        if (d.type === FreeDataTag.Pure) {
            const nexp = uncons(this.expr)
            if (nexp === undefined) {
                return d
            }
            const [e, list] = nexp
            return e(d.v).addexp(list).ibx()
        }
        return {
            type: FreeDataTag.Bind,
            v: d.v,
            next: a => d.next(a).addexp(this.expr)
        }
    }

    private addexp(exp: CatList<(a: _) => Free<f, _>>): Free<f, _> {
        return new Free(this.data, link(this.expr)(exp))
    }

}

/**
 * Experimental, still in testing
 * 
 * Folding into other monad, Stack safe. 
 * Instead of `fmap` function needed in usual `fold`, here,
 * `unwind` function is needed instead.
 * 
 * unwind must stack-safely unfold chain of computation
 * 
 * Here is example of `unwind` for trivial Either monad:
 * 
 * ```
export type Either<l, r> = { _tag: 'Left' l: l } | { _tag: 'Right' r: r }

export const eiUnwind: <l, v>(tr: TailRec<Either<l, v>>) => Either<l, v>
    = tr => {
        let __t = tr
        while (true) {
            if (__t.type === 'Done') {
                return __t.v
            }
            const t = __t
            const ne = __t.v as Either<any, any>
            if (ne._tag === 'Left') {
                return ne
            }
            p(ne, eiMap(x => {
                __t = t.next(x)
            }))
        }
    }
   ```
 */
export const foldTailRec: <f, v, mv, ma>(
    /** actually: ```f a -> m a``` */
    nat: <a>(f: hot<f, a>) => ma,
    /** actually: ```a -> m a``` */
    pure: (v: v) => mv,
    /** actually: ```TailRec m a -> m a``` */
    unwind: (mv: TailRec<mv>) => mv
) => (free: Free<f, v>) => mv
    = (nat, pure, unwind) => v => unwind(v.fold_tr(pure, nat))

type _ = any

type FreeData<f, a, b>
    = Pure<b>
    | Bind<f, a, b>

enum FreeDataTag { Pure, Bind }

type Pure<v> = {
    type: FreeDataTag.Pure
    v: v
}

type Bind<f, a, b> = {
    type: FreeDataTag.Bind
    v: hot<f, a>
    next: (a: a) => Free<f, b>
}
