import { Constructor, LitElement } from 'lit-element';
import { Blackboard } from './blackboard';
import { CustomElement } from './custom-element';

export interface BlackboardContainerElement<S> extends HTMLElement {
  blackboard: Blackboard<S>;
}

export const blackboardContainer = <
  S,
  T extends Constructor<LitElement> = Constructor<LitElement>
>(
  blackboardId: string,
  baseElement: T
): Constructor<BlackboardContainerElement<S>> => {
  abstract class BlackboardContainer extends baseElement
    implements BlackboardContainerElement<S> {
    blackboard: Blackboard<S>;
    get state() {
      return this.blackboard.state;
    }
    connectedCallback() {
      super.connectedCallback();

      this.blackboard = this.buildBlackboard();

      this.addEventListener('connect-to-blackboard', (e: CustomEvent) => {
        if (e.detail.blackboardId == blackboardId) {
          e.stopPropagation();
          e['blackboard'] = this.blackboard;
        }
      });
    }

    abstract buildBlackboard(): Blackboard<S>;
  }

  return BlackboardContainer;
};
