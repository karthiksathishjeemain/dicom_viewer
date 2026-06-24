import dicomParser from "dicom-parser";
import { lookup, tagToDisplay } from "./dictionary.js";

const STRING_VRS = new Set([
  "AE", "AS", "CS", "DA", "DS", "DT", "IS", "LO", "LT",
  "PN", "SH", "ST", "TM", "UI", "UC", "UR", "UT"
]);

const UNCOMPRESSED_TS = new Set([
  "1.2.840.10008.1.2",   // Implicit VR Little Endian
  "1.2.840.10008.1.2.1", // Explicit VR Little Endian
]);

export function parse(byteArray) {
  return dicomParser.parseDicom(byteArray);
}

// ---- Metadata -----------------------------------------------------------

function readNumeric(dataSet, element, vr) {
  const tag = element.tag;
  const sizes = { US: 2, SS: 2, UL: 4, SL: 4, FL: 4, FD: 8, AT: 2 };
  const size = sizes[vr];
  if (!size || !element.length) return "";
  const count = Math.floor(element.length / size);
  const out = [];
  for (let i = 0; i < count && i < 64; i++) {
    switch (vr) {
      case "US": out.push(dataSet.uint16(tag, i)); break;
      case "SS": out.push(dataSet.int16(tag, i)); break;
      case "UL": out.push(dataSet.uint32(tag, i)); break;
      case "SL": out.push(dataSet.int32(tag, i)); break;
      case "FL": out.push(dataSet.float(tag, i)); break;
      case "FD": out.push(dataSet.double(tag, i)); break;
      case "AT": {
        const g = dataSet.uint16(tag, i * 2);
        const e = dataSet.uint16(tag, i * 2 + 1);
        out.push(`(${hex4(g)},${hex4(e)})`);
        break;
      }
    }
  }
  if (count > 64) out.push(`… (+${count - 64} more)`);
  return out.join("\\");
}

function hex4(n) {
  return n.toString(16).toUpperCase().padStart(4, "0");
}

function readValue(dataSet, element) {
  const tag = element.tag;
  const info = lookup(tag);
  const vr = element.vr || info.vr;

  if (vr === "SQ" || (element.items && element.items.length)) {
    return { vr: vr || "SQ", value: `<sequence: ${element.items ? element.items.length : 0} item(s)>` };
  }
  if (["OB", "OW", "OF", "OD", "OL", "UN", "OV"].includes(vr) || tag === "x7fe00010") {
    return { vr: vr || "OB", value: `<binary data, ${element.length} bytes>` };
  }

  if (vr && STRING_VRS.has(vr)) {
    const s = dataSet.string(tag);
    return { vr, value: s == null ? "" : s };
  }

  if (vr && ["US", "SS", "UL", "SL", "FL", "FD", "AT"].includes(vr)) {
    return { vr, value: readNumeric(dataSet, element, vr) };
  }

  // Unknown VR (implicit, not in dictionary): try a printable string.
  const s = safeString(dataSet, tag);
  return { vr: vr || "?", value: s };
}

function safeString(dataSet, tag) {
  try {
    const s = dataSet.string(tag);
    if (s == null) return "";
    // Keep only if it looks printable.
    if (/^[\x20-\x7e\\^.,/:\-\s]*$/.test(s)) return s;
    return "<non-printable>";
  } catch {
    return "";
  }
}

export function extractMetadata(dataSet) {
  const rows = [];
  for (const key in dataSet.elements) {
    const element = dataSet.elements[key];
    const info = lookup(element.tag);
    const { vr, value } = readValue(dataSet, element);
    rows.push({
      tag: tagToDisplay(element.tag),
      rawTag: element.tag,
      name: info.name,
      vr: vr || "",
      value,
    });
  }
  rows.sort((a, b) => a.tag.localeCompare(b.tag));
  return rows;
}

// ---- Image --------------------------------------------------------------

function firstNumber(str, fallback) {
  if (str == null || str === "") return fallback;
  const n = parseFloat(String(str).split("\\")[0]);
  return Number.isFinite(n) ? n : fallback;
}

export function buildImageModel(dataSet, byteArray) {
  const pixelElement = dataSet.elements.x7fe00010;
  if (!pixelElement) {
    return { supported: false, reason: "This file has no image pixel data (0x7FE0,0x0010)." };
  }

  const transferSyntax = dataSet.string("x00020010") || "1.2.840.10008.1.2";
  if (!UNCOMPRESSED_TS.has(transferSyntax)) {
    return {
      supported: false,
      reason:
        `The image uses a compressed transfer syntax (${transferSyntax}) that this lightweight ` +
        `viewer does not decode. Metadata is still fully available.`,
    };
  }

  const rows = dataSet.uint16("x00280010");
  const columns = dataSet.uint16("x00280011");
  const samplesPerPixel = dataSet.uint16("x00280002") || 1;
  const bitsAllocated = dataSet.uint16("x00280100") || 16;
  const pixelRepresentation = dataSet.uint16("x00280103") || 0;
  const planarConfiguration = dataSet.uint16("x00280006") || 0;
  const photometric = (dataSet.string("x00280004") || "MONOCHROME2").trim();
  const numberOfFrames = parseInt(dataSet.string("x00280008") || "1", 10) || 1;
  const slope = firstNumber(dataSet.string("x00281053"), 1);
  const intercept = firstNumber(dataSet.string("x00281052"), 0);

  if (!rows || !columns) {
    return { supported: false, reason: "Missing image dimensions (Rows/Columns)." };
  }

  const isColor = samplesPerPixel === 3;
  const bytesPerSample = bitsAllocated <= 8 ? 1 : 2;
  const frameSamples = rows * columns * samplesPerPixel;
  const frameBytes = frameSamples * bytesPerSample;

  // Build a typed view per frame on demand.
  function rawFrame(frameIndex) {
    const offset = pixelElement.dataOffset + frameIndex * frameBytes;
    if (bitsAllocated <= 8) {
      return new Uint8Array(byteArray.buffer, byteArray.byteOffset + offset, frameSamples);
    }
    if (pixelRepresentation === 1) {
      return new Int16Array(byteArray.buffer, byteArray.byteOffset + offset, frameSamples);
    }
    return new Uint16Array(byteArray.buffer, byteArray.byteOffset + offset, frameSamples);
  }

  // Compute sensible default window from tags, or from data range.
  let defaultWC = firstNumber(dataSet.string("x00281050"), NaN);
  let defaultWW = firstNumber(dataSet.string("x00281051"), NaN);
  let dataMin = 0;
  let dataMax = 255;
  if (!isColor) {
    const f = rawFrame(0);
    let mn = Infinity;
    let mx = -Infinity;
    const step = Math.max(1, Math.floor(f.length / 200000));
    for (let i = 0; i < f.length; i += step) {
      const v = f[i] * slope + intercept;
      if (v < mn) mn = v;
      if (v > mx) mx = v;
    }
    dataMin = mn;
    dataMax = mx;
    if (!Number.isFinite(defaultWC) || !Number.isFinite(defaultWW)) {
      defaultWW = Math.max(1, mx - mn);
      defaultWC = (mx + mn) / 2;
    }
  }

  function renderToImageData(frameIndex, ww, wc, invert) {
    const out = new ImageData(columns, rows);
    const data = out.data;

    if (isColor) {
      const f = rawFrame(frameIndex);
      const n = rows * columns;
      if (planarConfiguration === 0) {
        for (let i = 0; i < n; i++) {
          data[i * 4] = f[i * 3];
          data[i * 4 + 1] = f[i * 3 + 1];
          data[i * 4 + 2] = f[i * 3 + 2];
          data[i * 4 + 3] = 255;
        }
      } else {
        const plane = n;
        for (let i = 0; i < n; i++) {
          data[i * 4] = f[i];
          data[i * 4 + 1] = f[i + plane];
          data[i * 4 + 2] = f[i + 2 * plane];
          data[i * 4 + 3] = 255;
        }
      }
      return out;
    }

    const f = rawFrame(frameIndex);
    const monochrome1 = photometric === "MONOCHROME1";
    const doInvert = monochrome1 ? !invert : invert;
    const low = wc - 0.5 - (ww - 1) / 2;
    const range = ww - 1;
    const n = rows * columns;
    for (let i = 0; i < n; i++) {
      const v = f[i] * slope + intercept;
      let g;
      if (v <= low) g = 0;
      else if (v > low + range) g = 255;
      else g = ((v - low) / range) * 255;
      if (doInvert) g = 255 - g;
      const o = i * 4;
      data[o] = g;
      data[o + 1] = g;
      data[o + 2] = g;
      data[o + 3] = 255;
    }
    return out;
  }

  return {
    supported: true,
    width: columns,
    height: rows,
    frames: numberOfFrames,
    isColor,
    photometric,
    bitsAllocated,
    transferSyntax,
    slope,
    intercept,
    dataMin,
    dataMax,
    defaultWW: Math.round(defaultWW),
    defaultWC: Math.round(defaultWC),
    renderToImageData,
  };
}
