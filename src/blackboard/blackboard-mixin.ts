import { Constructor, LitElement } from "lit-element";
import { Blackboard } from "./blackboard";

export interface PinnedElement<S> {
  state: S;
  blackboard: Blackboard<S>;

  stateUpdated(state: S): void;
}

export const pinToBoard = <
  S,
  T extends Constructor<LitElement> = Constructor<LitElement>
>(
  baseElement: T
): {
  new (...args: any[]): PinnedElement<S> & LitElement & T;
  prototype: any;
} =>
  (class extends baseElement implements PinnedElement<S> {
    blackboard: Blackboard<S>;
    get state() {
      return this.blackboard.state;
    }
    connectedCallback() {
      super.connectedCallback();
      const e = new CustomEvent("pin-to-board", {
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(e);
      this.blackboard = e["blackboard"];
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
