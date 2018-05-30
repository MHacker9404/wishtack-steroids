/**
 *
 * (c) 2013-2018 Wishtack
 *
 * $Id: $
 */

import { BehaviorSubject, Observable, range, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { ComponentWithOptionalOnDestroy, Scavenger } from '../src/scavenger';

describe('Scavenger', () => {

    let subject$: BehaviorSubject<string>;

    beforeEach(() => {
        subject$ = new BehaviorSubject('Hello');
    });

    it('should collect subscription using pipe and unsubscribe', () => {

        const scavenger = new Scavenger();
        let value: string;

        const subscription = subject$
            .pipe(
                scavenger.collect()
            )
            .subscribe(_value => value = _value);

        expect(value).toBe('Hello');

        expect(subscription.closed).toBe(false);

        scavenger.unsubscribe();

        expect(subscription.closed).toBe(true);

        subject$.next('Bye');

        expect(value).toBe('Hello');

    });

    it('should replace subscription if collected by key', () => {

        const scavenger = new Scavenger();

        const foo: {
            lastValue?: string,
            source$?: Observable<string>,
            subscription?: Subscription
        } = {};
        const john: typeof foo = {};

        /* Creating two observables. */
        foo.source$ = subject$.pipe(map(_value => `${_value} Foo`));
        john.source$ = subject$.pipe(map(_value => `${_value} John`));

        /* Subscribing to the foo's observable... */
        foo.subscription = foo.source$
            .pipe(
                /* ... but we collect the subscription by key this time. */
                scavenger.collectByKey('greetings')
            )
            .subscribe(value => foo.lastValue = value);

        expect(foo.lastValue).toBe('Hello Foo');
        expect(foo.subscription.closed).toBe(false);

        /* Subscribing to the john's observable... */
        john.subscription = john.source$
            .pipe(
                /* ... but we collect the subscription with the same key. */
                scavenger.collectByKey('greetings')
            )
            .subscribe(value => john.lastValue = value);

        /* New subscription should replace the previous one. */
        expect(foo.lastValue).toBe('Hello Foo');
        expect(foo.subscription.closed).toBe(true);

        expect(john.lastValue).toBe('Hello John');
        expect(john.subscription.closed).toBe(false);

        subject$.next('Bye');

        expect(foo.lastValue).toBe('Hello Foo');
        expect(foo.subscription.closed).toBe(true);

        expect(john.lastValue).toBe('Bye John');
        expect(john.subscription.closed).toBe(false);

        scavenger.unsubscribe();

        subject$.next('Are you there?');

        expect(foo.lastValue).toBe('Hello Foo');
        expect(foo.subscription.closed).toBe(true);

        expect(john.lastValue).toBe('Bye John');
        expect(john.subscription.closed).toBe(true);

    });

    it('should replace subscription if collected by key even if same observable', () => {

        const scavenger = new Scavenger();

        const foo: {
            lastValue?: string,
            subscription?: Subscription
        } = {};
        const john: typeof foo = {};

        const source$ = subject$.pipe(scavenger.collectByKey('greetings'));

        foo.subscription = source$.subscribe(value => foo.lastValue = `${value} Foo`);

        expect(foo.lastValue).toBe('Hello Foo');
        expect(foo.subscription.closed).toBe(false);

        john.subscription = source$.subscribe(value => john.lastValue = `${value} John`);

        /* New subscription should replace the previous one. */
        expect(foo.lastValue).toBe('Hello Foo');
        expect(foo.subscription.closed).toBe(true);

        expect(john.lastValue).toBe('Hello John');
        expect(john.subscription.closed).toBe(false);

        subject$.next('Bye');

        expect(foo.lastValue).toBe('Hello Foo');
        expect(foo.subscription.closed).toBe(true);

        expect(john.lastValue).toBe('Bye John');
        expect(john.subscription.closed).toBe(false);

        scavenger.unsubscribe();

        subject$.next('Are you there?');

        expect(foo.lastValue).toBe('Hello Foo');
        expect(foo.subscription.closed).toBe(true);

        expect(john.lastValue).toBe('Bye John');
        expect(john.subscription.closed).toBe(true);

    });

    it('should create ngOnDestroy and unsubscribe', () => {

        const component: ComponentWithOptionalOnDestroy = {};
        const scavenger = new Scavenger(component);

        spyOn(scavenger, 'unsubscribe');

        expect(component.ngOnDestroy).not.toBeUndefined();

        component.ngOnDestroy();

        /* `ngOnDestroy()` should call `scavenger.unsubscribe()`. */
        expect(scavenger.unsubscribe).toHaveBeenCalledTimes(1);

    });

    xit('should wrap ngOnDestroy and unsubscribe', () => {

        const ngOnDestroy = jasmine.createSpy('ngOnDestroy');

        const component: ComponentWithOptionalOnDestroy = {
            ngOnDestroy
        };
        const scavenger = new Scavenger(component);

        spyOn(scavenger, 'unsubscribe');

        component.ngOnDestroy();

        /* `ngOnDestroy()` should call `scavenger.unsubscribe()`... */
        expect(scavenger.unsubscribe).toHaveBeenCalledTimes(1);
        /* ... and the original `ngOnDestroy()`. */
        expect(ngOnDestroy).toHaveBeenCalledTimes(1);
        /* `ngOnDestroy` should be bound to `component`. */
        expect(ngOnDestroy.calls.first().object).toBe(component);

    });

    it('should unsubscribe from synchronous fire hose', () => {

        const fireHose$ = range(0, 10);
        const scavenger = new Scavenger();
        let value;

        const subscription = fireHose$
            .pipe(
                scavenger.collect()
            )
            .subscribe(_value => {
                value = _value;
                scavenger.unsubscribe();
            });

        expect(subscription.closed).toEqual(true);

        expect(value).toEqual(0);

    });

    xit('should unsubscribe from synchronous fire hose when replaced', () => {

        const fireHose$ = range(0, 10);
        const scavenger = new Scavenger();
        let valueNew;
        let valuePrevious;

        const source$ = fireHose$
            .pipe(
                scavenger.collectByKey('synchronous-fire-hose')
            );

        const subscription = source$
            .subscribe(_value => {

                valuePrevious = _value;

                source$.subscribe(_valueNew => valueNew = _valueNew);

            });

        expect(subscription.closed).toEqual(true);

        expect(valuePrevious).toEqual(0);
        expect(valueNew).toEqual(9);

    });

});
