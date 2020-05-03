import { Playground } from '../state/playground';
import { Conductor } from '../types/conductor';
import { hookUpConductors } from './message';

export function serializePlayground(state: Playground): string {
  const conductorContents = state.conductors.map((c) => c.toContents());

  const preState = {
    ...state,
    conductors: conductorContents,
  };
  return JSON.stringify(preState);
}

export function deserializePlayground(stateString: string): Playground {
  const preState = JSON.parse(stateString);

  const conductors = preState.conductors.map((c) => Conductor.from(c));

  hookUpConductors(conductors);

  return {
    ...preState,
    conductors,
  };
}
