//////////////////////////////////////////////////
/////// Utility 
////////////////////////////

import { Free } from "../../src"
import { hot } from "../../src/hot"

const pipe: <a, b, c>(f: (a: a) => b, f2: (b: b) => c) => (a: a) => c
    = (f, g) => a => g(f(a))


export type Lazy<v> = { run: () => v }

export const Lazy: <v>(run: () => v) => Lazy<v>
    = run => ({ run })

export const lazyPure: <v>(v: v) => Lazy<v>
    = v => ({ run: () => v })

export const lazyFmap: <a, b>(f: (a: a) => Lazy<b>) => (l: Lazy<a>) => Lazy<b>
    = f => l => ({ run: () => f(l.run()).run() })

//////////////////////////////////////////////////
/////// Lang 
////////////////////////////

export type JobCtx = {
    jobsDone: string[]
}

export type LangF<a>
    = { tag: 'job1', v: a }
    | { tag: 'job2', v: a }
    | { tag: 'specJob', jobName: string, v: a }
    | { tag: 'print', msg: string, v: a }
    | { tag: 'read', f: (ctx: JobCtx) => a }

export const doJob1: LangF<{}> = { tag: 'job1', v: {} }
export const doJob2: LangF<{}> = { tag: 'job2', v: {} }
export const doSpecJob: (jobName: string) => LangF<{}>
    = jobName => ({ tag: 'specJob', jobName, v: {} })
export const doPrint: (msg: string) => LangF<{}>
    = msg => ({ tag: 'print', msg, v: {} })
export const doRead: <a>(f: (ctx: JobCtx) => a) => LangF<a>
    = f => ({ tag: 'read', f })

//////////////////////////////////////////////////
/////// Lift to Free 
////////////////////////////

const toHot: <a>(l: LangF<a>) => hot<LangF<any>, a>
    = v => v as any

const fromHot: <a>(l: hot<LangF<any>, a>) => LangF<a>
    = v => v as any

const liftLang = pipe(toHot, Free.Lift)

export type Lang<a> = Free<LangF<any>, a>

//////////////////////////////////////////////////
/////// Fold
////////////////////////////

const _foldLangToLazy: () => <a>(l: LangF<a>) => Lazy<a>
    = () => {
        const ctxMutable: JobCtx = { jobsDone: [] }

        return l => {
            switch (l.tag) {
                case 'job1': {
                    return Lazy(() => {
                        console.log(`[job1]`)
                        ctxMutable.jobsDone.push('job1')
                        return l.v
                    })
                }
                case 'job2': {
                    return Lazy(() => {
                        console.log(`[job2]`)
                        ctxMutable.jobsDone.push('job2')
                        return l.v
                    })
                }
                case 'specJob': {
                    return Lazy(() => {
                        // console.log(`[special job! whoa] named: ${l.jobName}`)
                        ctxMutable.jobsDone.push(l.jobName)
                        return l.v
                    })
                }
                case 'print': {
                    return Lazy(() => {
                        console.log(`[print:][ ${l.msg} ]`)
                        return l.v
                    })
                }
                case 'read': {
                    return Lazy(() => {
                        console.log(`[read]`)
                        return l.f(ctxMutable)
                    })
                }
            }
        }
    }

export const foldLangToLazy = () => pipe(fromHot, _foldLangToLazy())

//////////////////////////////////////////////////
/////// Exec
////////////////////////////

const _execLang: () => <a>(l: LangF<a>) => a
    = () => {
        const f = _foldLangToLazy()
        return l => {
            return f(l).run()
        }
    }

export const execLang = () => pipe(fromHot, _execLang())

//////////////////////////////////////////////////
/////// Tests
////////////////////////////

const cycle: <v>(ini: v, mk: (v: v) => Lang<v> | undefined) => Lang<v>
    = (v, mk) => {
        const r = mk(v)
        if (r === undefined) {
            return Free.Pure(v)
        }
        return r.flatMap(x => cycle(x, mk))
    }

const logTest = (name: string, run: () => void) => {
    console.log(`---------------------------------------------------`)
    console.log(`[Test Start] ${name}`)
    console.log(`---------------------------------------------------`)
    const f = performance.now()
    run()
    const took = performance.now() - f
    console.log(`---------------------------------------------------`)
    console.log(`[Test finished] time spent: ${took} milliseconds`)
    console.log()
}

export const runTestsA = () => {


    const checkAboutJobs = liftLang(doRead(x => x.jobsDone.length))
        .flatMap(l => liftLang(doPrint(l > 0 ? `${l} jobs is done, wow!` : `no jobs yet`)).map(_ => l))

    const doStuff = liftLang(doJob1)
        .flatMap(_ => liftLang(doJob2))
        .flatMap(_ => checkAboutJobs)


    logTest("doStuff", () => {
        console.log(`doStuff executed with result: ${doStuff.exec(execLang())}`)
    })
    logTest("checkAboutJobs", () => {
        console.log(`checkAboutJobs executed with result: ${checkAboutJobs.exec(execLang())}`)
    })

    logTest("Lazy doStuff", () => {
        const r = doStuff.fold(foldLangToLazy(), lazyPure, lazyFmap)
        console.log('Lazy was constructed')
        console.log(`doStuff executed with result: ${r.run()}`)
    })

    logTest("cycle", () => {
        const cc = 10000000
        const r = cycle(cc, v =>
            v === 0
                ? undefined
                : liftLang(doSpecJob(`In Cycle Job (${cc - v})`)).map(_ => v - 1)
        ).flatMap(_ => checkAboutJobs)
        console.log(`cycle executed with result: ${r.exec(execLang())}`)
    })
}


