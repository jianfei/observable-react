import Rx from 'rxjs';

module.exports = function setupObservables(context) {
    setupLifeCycles(context);
    setupEvents(context);
    setupSetState(context);
    setupRequests(context);
}

function setupLifeCycles(context) {
    const lifeCycles = {
        componentWillMount: context.componentWillMount,
        componentDidMount: context.componentDidMount,
        componentWillReceiveProps: context.componentWillReceiveProps,
        shouldComponentUpdate: context.shouldComponentUpdate,
        componentWillUpdate: context.componentWillUpdate,
        componentDidUpdate: context.componentDidUpdate,
        componentWillUnmount: context.componentWillUnmount,
        componentDidCatch: context.componentDidCatch,
    }

    Object.assign(context, {
        componentWillMount$: new Rx.Subject(),
        componentDidMount$: new Rx.Subject(),
        componentWillReceiveProps$: new Rx.Subject(),
        shouldComponentUpdate$: new Rx.Subject(),
        componentWillUpdate$: new Rx.Subject(),
        componentDidUpdate$: new Rx.Subject(),
        componentWillUnmount$: new Rx.Subject(),
        componentDidCatch$: new Rx.Subject(),
    });

    Object.assign(context, {
        componentWillMount: () => {
            context.componentWillMount$.next();
            return lifeCycles.componentWillMount
                && lifeCycles.componentWillMount.call(context);
        },

        componentDidMount: () => {
            context.componentDidMount$.next();
            return lifeCycles.componentDidMount
                && lifeCycles.componentDidMount.call(context);
        },

        componentWillReceiveProps: nextProps => {
            context.componentWillReceiveProps$.next(nextProps);
            return lifeCycles.componentWillReceiveProps
                && lifeCycles.componentWillReceiveProps.call(context, nextProps);
        },

        shouldComponentUpdate: (nextProps, nextState) => {
            context.shouldComponentUpdate$.next({ nextProps, nextState });
            return lifeCycles.shouldComponentUpdate
                && lifeCycles.shouldComponentUpdate.call(context, nextProps, nextState)
                || true;
        },

        componentWillUpdate: (nextProps, nextState) => {
            context.componentWillUpdate$.next({ nextProps, nextState });
            return lifeCycles.componentWillUpdate
                && lifeCycles.componentWillUpdate.call(context, nextProps, nextState);
        },

        componentDidUpdate: (nextProps, nextState) => {
            context.componentDidUpdate$.next({ nextProps, nextState });
            return lifeCycles.componentDidUpdate
                && lifeCycles.componentDidUpdate.call(context, nextProps, nextState);
        },

        componentWillUnmount: () => {
            context.componentWillUnmount$.next();
            return lifeCycles.componentWillUnmount
                && lifeCycles.componentWillUnmount.call(context);
        },

        componentDidCatch: (error, info) => {
            context.componentDidCatch$.next({ error, info });
            return lifeCycles.componentDidCatch
                && lifeCycles.componentDidCatch.call(context, error, info);
        },
    });
}

function setupEvents(context) {
    context.ObservableEvent = (name, ...args) => {
        let observable = context[`${name}$`];

        if (!observable || !isObservable(observable)) {
            context[`${name}$`] = observable = new Rx.Subject();
        }

        return (...eventArgs) => {
            if (args.length > 0) {
                if (typeof args[0] === 'function') {
                    return observable.next(valueMapper(...eventArgs));
                }
                else if (args.length === 1) {
                    return observable.next(args[0]);
                }
                else {
                    return observable.next(args);
                }
            }
            else {
                if (eventArgs.length > 1) {
                    return observable.next(eventArgs);
                }
                else if (eventArgs.length === 1) {
                    return observable.next(eventArgs[0]);
                }
                else {
                    return observable.next();
                }
            }
        };
    };
}

function isObservable(object) {
    return typeof object === 'object'
        && typeof object.subscribe === 'function';
}

function setupSetState(context) {
    context.setState$ = (...args) => {
        args.forEach(arg => {
            if (isObservable(arg)) {
                arg.subscribe(valuesFromObservable => {
                    if (typeof valuesFromObservable === 'object') {
                        context.setState(prevState => Object.assign(prevState, valuesFromObservable));
                    }
                });
            }
            else if (typeof arg === 'object') {
                for (const key in arg) {
                    arg[key].subscribe(value => context.setState({ [key]: value }));
                }
            }
        });
    };
}

function setupRequests(context) {
    context.createObservableRequest = (request, ...defaultArgs) => {
        const request$ = new Rx.BehaviorSubject(defaultArgs);

        const result$ = request$
            .switchMap(args => {
                const argsUsing = args.length ? args : defaultArgs;

                return Rx.Observable.fromPromise(request(...argsUsing));
            })
            .share();

        result$.request = (...args) => {
            request$.next(args);

            return request$.skip(1);
        }

        return result$;
    };

    context.ObservableRequest = (name, request, ...defaultArgs) => {
        const result$ = context.createObservableRequest(request, ...defaultArgs);

        context[`${name}$`] = result$;
        return result$;
    };
}
