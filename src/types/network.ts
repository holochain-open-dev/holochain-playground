import { DHTOp } from "./dht-op";

export enum NetworkMessageType {
  Publish,
  GetEntry
}

export interface NetworkMessageBody<T, P> {
  type: T;
  payload: P;
}

export type NetworkMessage =
  | NetworkMessageBody<NetworkMessageType.Publish, {dhtOpId: string, dhtOp: DHTOp}>
  | NetworkMessageBody<NetworkMessageType.GetEntry, string>;

export type SendMessage = (
  dna: string,
  fromAgentId: string,
  toAgentId: string,
  message: NetworkMessage
) => any;
