/**
 *
 * (c) 2013-2018 Wishtack
 *
 * $Id: $
 */

import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

import { Scavenger } from '../src/scavenger';

describe('Scavenger', () => {

    let subject$: BehaviorSubject<string>;

    beforeEach(() => {
        subject$ = new BehaviorSubject('Hello');
    });

    it('should create scavenger', () => {
        expect(new Scavenger()).not.toBeNull();
    });

    xit('should unsubscribe', () => {

        const scavenger = new Scavenger();
        let value: string;

        subject$
            .pipe(
                scavenger.scavenge()
            )
            .subscribe(_value => value = _value);

        expect(value).toBe('Hello');

        scavenger.unsubscribe();

        subject$.next('Bye');

        expect(value).toBe('Hello');

    });

    xit('should create ngOnDestroy and unsubscribe', () => {

    });

    xit('should wrap ngOnDestroy and unsubscribe', () => {

    });

});
