# Free Monad

Highly performant implementation of **The Free monad for typescript**, internally based 
on persistent data structures which allow to avoid high computational complexity in
monadic binds. 
There are also some in-place optimizations which replace recoursion to cycles to avoid stack overflow.

Advantages over other implementations:
- High performance
- Stack safe

inspired by:

- [Purely Functional Data Structures](https://github.com/aistrate/Articles/blob/master/Haskell/Purely%20Functional%20Data%20Structures%20(Okasaki).pdf) (Okasaki)
- [Reflection without Remorse](http://okmij.org/ftp/Haskell/zseq.pdf) (Ploeg and Kiselyov 2014)
- [Purescript free](https://github.com/purescript/purescript-free) (Eric Thul, Brian McKenna, John A. De Goes, Gary Burgess, Phil Freeman)

## Installation

`npm install ts-free-monad`

## Typescript limitations

Due to absence of higher-kinded types in typescript, 
there are some tricks/utils/best-practices the User is adviced to use to get round these limitations: 

- Fantom type `hot<f, a>` which is intented to use *instead* of the real type free-monad is builded over. This type's doc explains how to deal with it.
- `Free.fold` method cannot have correct typing due to typescript's 
type-system limitations. This type's doc explains how to it correctly.

*detailed decription will be provided later*.

## Documentation

*detailed documentation and examples will be provided later*.

