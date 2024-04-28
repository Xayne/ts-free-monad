export type TailRecData<i, mi, o, mo>
    = { type: 'Done', v: mo }
    | {
        type: 'Next',
        v: mi,
        next: (a: i) => TailRec<mo>
    }

export type TailRec<mo> = TailRecData<unknown, unknown, unknown, mo>
