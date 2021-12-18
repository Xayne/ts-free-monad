export type List<a>
    = Nil
    | Cons<a>

enum Tag { Nil, Cons }

type Nil = { tag: Tag.Nil }
type Cons<a> = { tag: Tag.Cons, head: a, tail: List<a> }

export const Nil: List<never> = { tag: Tag.Nil }
export const Cons: <a>(head: a, tail: List<a>) => List<a> = (head, tail) => ({ tag: Tag.Cons, head, tail })
export const ListTag = Tag

const _rev: <a>(acc: List<a>) => (left: List<a>) => List<a>
    = acc => left =>
        left.tag === Tag.Nil
            ? acc
            : _rev(Cons(left.head, acc))(left.tail)

export const reverse: <a>(l: List<a>) => List<a>
    = _rev(Nil)

