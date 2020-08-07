import multihashing from 'multihashing-async';

import { Buffer } from 'buffer';
import CID from 'cids';
import bitwise from 'bitwise';
import { Dictionary } from '../types/common';
import { Encoding } from '@holochain/hcid-js';

export async function hash(content: any): Promise<string> {
  const contentString =
    typeof content === 'string' ? content : JSON.stringify(content);
  const buffer = Buffer.from(contentString, 'utf-8');

  const encoded = await multihashing(buffer, 'sha2-256');
  const cid = new CID(0, 'dag-pb', encoded);

  return cid.toString();
}

export const hashLocation: Dictionary<number> = {};
(new Encoding('hcs0') as any).then((enc) => (window['enc'] = enc));

function hashBytes(hash: string): Uint8Array {
  try {
    return multihashing.multihash.fromB58String(hash).slice(2);
  } catch (e) {
    return window['enc'].decode(hash);
  }
}

export function location(hash: string): number {
  if (hashLocation[hash]) return hashLocation[hash];

  const bytes = hashBytes(hash);
  const hexes = arrayToHexes(bytes);

  let xor = Buffer.from(hexes[0].slice(2), 'hex');

  for (let i = 1; i < hexes.length; i++) {
    xor = bitwise.buffer.xor(xor, Buffer.from(hexes[i].slice(2), 'hex'));
  }
  const location = xor.readUIntBE(0, xor.length);

  hashLocation[hash] = location;

  return location;
}

const limit = Math.pow(2, 32) - 1;

export function distance(hash1: string, hash2: string): number {
  const location1 = location(hash1);
  const location2 = location(hash2);

  if (location2 >= location1) return location2 - location1;
  return limit - location1 + location2 + 1;
}

export function arrayToHexes(array: Uint8Array): string[] {
  var hexes = [];

  const sliceSize = array.length / 8;

  for (let i = 0; i < 8; i++) {
    const subarray = array.subarray(i * sliceSize, (i + 1) * sliceSize);
    let hex = [];
    subarray.forEach(function (i) {
      var h = i.toString(16);
      if (h.length % 2) {
        h = '0' + h;
      }
      hex.push(h);
    });
    hexes.push('0x' + hex.join(''));
  }

  return hexes;
}

export function compareBigInts(a: number, b: number): number {
  if (a > b) {
    return 1;
  } else if (a < b) {
    return -1;
  }
  return 0;
}
