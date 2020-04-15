import multihashing from "multihashing";
import multihashes from "multihashes";
import { Buffer } from "buffer";
import CID from "cids";
import bitwise from "bitwise";

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

export const distanceResults = {};

export function distance(hash1: string, hash2: string): bigint {
  const distanceId = `${hash1}-${hash2}`;
  if (distanceResults[distanceId]) return distanceResults[distanceId];

  const array1 = multihashes.fromB58String(hash1);
  const array2 = multihashes.fromB58String(hash2);

  const distance = arrayToInt(array1) - arrayToInt(array2);

  const result = distance > 0 ? distance : -distance;
  distanceResults[distanceId] = result;
  return result;
}

export function arrayToInt(array: Uint8Array): bigint {
  var hex = [];

  array.forEach(function (i) {
    var h = i.toString(16);
    if (h.length % 2) {
      h = "0" + h;
    }
    hex.push(h);
  });

  return BigInt("0x" + hex.join(""));
}

export function compareBigInts(a: bigint, b: bigint): number {
  if (a > b) {
    return 1;
  } else if (a < b) {
    return -1;
  }
  return 0;
}
