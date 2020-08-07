import { Playground } from '../state/playground';
import { Conductor } from '../types/conductor';
import { hookUpConductors } from './message';

export function serializePlayground(state: Playground): string {
  if (!state) return '';

  const conductorContents = state.conductors.map((c) => c.toContents());

  const preState = {
    ...state,
    conductors: conductorContents,
  };
  return JSON.stringify(preState);
}

export function deserializePlayground(stateString: string): Playground {
  if (stateString === '') return null;

  const preState = JSON.parse(stateString);

  const conductors = preState.conductors.map((c) => Conductor.from(c));

  hookUpConductors(conductors);

  return {
    ...preState,
    conductors,
  };
}
