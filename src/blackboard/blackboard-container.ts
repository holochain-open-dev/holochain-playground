import { Constructor, LitElement } from 'lit-element';
import { Blackboard } from './blackboard';
import { CustomElement } from './custom-element';

export interface BlackboardProviderElement<S> {
  blackboard: Blackboard<S>;
}

export const blackboardProvider = <
  S,
  T extends Constructor<LitElement> = Constructor<LitElement>
>(
  blackboardId: string,
  baseElement: T
): {
  new (...args: any[]): BlackboardProviderElement<S> & LitElement & T;
  prototype: any;
} =>
  (class extends baseElement implements BlackboardProviderElement<S> {
    blackboard: Blackboard<S>;
    get state() {
      return this.blackboard.state;
    }
    connectedCallback() {
      super.connectedCallback();
      this.addEventListener('connect-to-blackboard', (e: CustomEvent) => {
        if ((e.detail.blackboardId = blackboardId)) {
          e.stopPropagation();
          e['blackboard'] = this.blackboard;
        }
      });
    }
  } as unknown) as {
    new (...args: any[]): BlackboardProviderElement<S> & LitElement & T;
    prototype: any;
  };
