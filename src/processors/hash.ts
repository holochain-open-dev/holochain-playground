import multihashing from "multihashing";
import multihashes from "multihashes";
import { Buffer } from "buffer";
import CID from "cids";
import bitwise from "bitwise";
import { Dictionary } from "../types/common";

export function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}

export function str2ab(str) {
  var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

export function hash(content: any): string {
  const contentString =
    typeof content === "string" ? content : JSON.stringify(content);
  const buffer = Buffer.from(contentString, "utf-8");

  const encoded = multihashing(buffer, "sha2-256");
  const cid = new CID(0, "dag-pb", encoded);

  return cid.toString();
}

export const hashLocation: Dictionary<number> = {};

export function location(hash: string): number {
  if (hashLocation[hash]) return hashLocation[hash];

  const hexes = arrayToHexes(multihashes.fromB58String(hash).slice(2));

  let xor = Buffer.from(hexes[0].slice(2), "hex");

  for (let i = 1; i < hexes.length; i++) {
    xor = bitwise.buffer.xor(xor, Buffer.from(hexes[i].slice(2), "hex"));
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
        h = "0" + h;
      }
      hex.push(h);
    });
    hexes.push("0x" + hex.join(""));
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
