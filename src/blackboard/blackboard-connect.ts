import { Constructor, LitElement } from 'lit-element';
import { Blackboard } from './blackboard';

export interface PinnedElement<S> {
  blackboard: Blackboard<S>;

  stateUpdated(state: S): void;
}

export const blackboardConnect = <
  S,
  T extends Constructor<LitElement> = Constructor<LitElement>
>(
  blackboardId: string,
  baseElement: T
): {
  new (...args: any[]): PinnedElement<S> & LitElement & T;
  prototype: any;
} =>
  (class extends baseElement implements PinnedElement<S> {
    blackboard: Blackboard<S>;

    connectedCallback() {
      super.connectedCallback();
      const e = new CustomEvent('connect-to-blackboard', {
        bubbles: true,
        composed: true,
        detail: {
          blackboardId,
        },
      });
      this.dispatchEvent(e);
      this.blackboard = e['blackboard'];

      if (!this.blackboard) {
        throw new Error(
          'Could not connect to the blackboard: this element must be contained inside a blackboard-container element with the same blackboardId'
        );
      }

      this.blackboard.subscribe((state) => {
        if (((this as unknown) as LitElement).requestUpdate) {
          ((this as unknown) as LitElement).requestUpdate();
        }
        this.stateUpdated(state);
      });
    }
    
    stateUpdated(state: S) {}
  } as unknown) as {
    new (...args: any[]): PinnedElement<S> & LitElement & T;
    prototype: any;
  };
