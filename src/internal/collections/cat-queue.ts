import { Cons, List, ListTag, Nil, reverse } from "./list";

export type CatQueue<a> = { f: List<a>, b: List<a> }

export const unsnoc: <a>(c: CatQueue<a>) => undefined | [a, CatQueue<a>]
    = ({ f, b }) => {
        if (b.tag === ListTag.Cons) {
            return [b.head, { f: f, b: b.tail }]
        }
        if (f.tag === ListTag.Nil) {
            return undefined
        }
        return unsnoc({ f: Nil, b: reverse(f) })
    }

export const foldr: <acc, a>(f: (a: a) => (acc: acc) => acc) => (ini: acc) => (c: CatQueue<a>) => acc
    = f => acc => c => {
        while (true) {
            var r = unsnoc(c)
            if (r === undefined) {
                return acc
            }
            acc = f(r[0])(acc)
            c = r[1]
        }
    }

export const snoc: <a>(c: CatQueue<a>) => (a: a) => CatQueue<a>
    = ({ f, b }) => a => ({ f, b: Cons(a, b) })

export const isEmpty: <a>(c: CatQueue<a>) => boolean
    = ({ f, b }) => f.tag === ListTag.Nil && b.tag === ListTag.Nil

export const empty: CatQueue<never> = { f: Nil, b: Nil }
