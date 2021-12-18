import { CatQueue, empty, foldr, snoc as qsnoc } from "./cat-queue"

export type CatList<a>
    = CatNil
    | CatCons<a>

enum Tag { Nil, Cons }

type CatNil = { tag: Tag.Nil }
type CatCons<a> = { tag: Tag.Cons, head: a, q: CatQueue<CatList<a>> }

export const CatNil: CatList<never> = { tag: Tag.Nil }
export const CatCons: <a>(head: a, q: CatQueue<CatList<a>>) => CatList<a> = (head, q) => ({ tag: Tag.Cons, head, q })
export const CatListTag = Tag

export const link: <a>(c: CatList<a>) => (c: CatList<a>) => CatList<a>
    = f => s => {
        if (f.tag === Tag.Nil) {
            return s
        }
        if (s.tag === Tag.Nil) {
            return f
        }
        return CatCons(f.head, qsnoc(f.q)(s))
    }

const ap: <a, b>(a: a, f: (a: a) => b) => b
    = (a, f) => f(a)

export const uncons: <a>(c: CatList<a>) => undefined | [a, CatList<a>]
    = c => {
        if (c.tag === Tag.Nil) {
            return undefined
        }
        return [c.head, ap(c.q, foldr(link)(CatNil))]
    }


export const snoc: <a>(c: CatList<a>) => (a: a) => CatList<a>
    = c => a => link(c)(CatCons(a, empty))
