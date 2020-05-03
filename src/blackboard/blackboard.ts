import { isEqual } from 'lodash-es';
import { Observable, Subscription, Subject } from 'rxjs';
import { map, last, flatMap, mergeMap } from 'rxjs/operators';

import { Dictionary } from '../types/common';

export interface PersistOptions<S> {
  persistId: string;
  serializer?: (state: S) => string;
  deserializer?: (stateString: string) => S;
}

export class Blackboard<S extends Dictionary<any>> {
  private subject: Subject<S>;
  protected _state: S;

  constructor(
    protected initialState: S,
    protected persistOptions?: PersistOptions<S>
  ) {
    this._state = initialState;
    this.subject = new Subject<S>();

    this.hidrateState();
    this.stateUpdated();
  }

  get state(): S {
    return this._state;
  }

  subscribe(
    next: (value: S) => void,
    error?: (error: any) => void,
    complete?: () => void
  ): Subscription {
    return this.subject.subscribe(next, error, complete);
  }

  select(selector: string | ((state: S) => any)): Observable<any> {
    let lastValue = undefined;
    return this.subject.pipe(
      mergeMap((state) => {
        let value;
        if (typeof selector === 'string') {
          value = state[selector];
        } else {
          value = selector(state);
        }

        if (!isEqual(lastValue, value)) {
          lastValue = value;
          return [lastValue];
        } else return [];
      })
    );
  }

  update(key: keyof S, value: any): void {
    this._state[key] = value;
    this.stateUpdated();
  }

  updateState(state: S): void {
    if (!isEqual(state, this._state)) {
      this._state = state;
      this.stateUpdated();
    }
  }

  reset() {
    this._state = this.initialState;
    this.stateUpdated();
  }

  private stateUpdated() {
    this.persistState();
    this.subject.next(this._state);
  }

  private persistState() {
    if (this.persistOptions !== undefined) {
      const stateString = this.persistOptions.serializer
        ? this.persistOptions.serializer(this._state)
        : JSON.stringify(this._state);
      localStorage.setItem(this.persistOptions.persistId, stateString);
    }
  }

  private hidrateState() {
    if (this.persistOptions !== undefined) {
      const stateString = localStorage.getItem(this.persistOptions.persistId);

      if (stateString) {
        this._state = this.persistOptions.deserializer
          ? this.persistOptions.deserializer(stateString)
          : JSON.parse(stateString);
        setTimeout(() => this.subject.next(this._state));
      }
    }
  }
}
