// Curated subset of the standard DICOM data dictionary.
// Maps an 8-char hex tag "ggggeeee" (lower-case) -> { name, vr }.
// Used for friendly names and to parse values in Implicit VR files.
export const DICT = {
  "00020000": { name: "File Meta Information Group Length", vr: "UL" },
  "00020001": { name: "File Meta Information Version", vr: "OB" },
  "00020002": { name: "Media Storage SOP Class UID", vr: "UI" },
  "00020003": { name: "Media Storage SOP Instance UID", vr: "UI" },
  "00020010": { name: "Transfer Syntax UID", vr: "UI" },
  "00020012": { name: "Implementation Class UID", vr: "UI" },
  "00020013": { name: "Implementation Version Name", vr: "SH" },
  "00020016": { name: "Source Application Entity Title", vr: "AE" },

  "00080005": { name: "Specific Character Set", vr: "CS" },
  "00080008": { name: "Image Type", vr: "CS" },
  "00080012": { name: "Instance Creation Date", vr: "DA" },
  "00080013": { name: "Instance Creation Time", vr: "TM" },
  "00080016": { name: "SOP Class UID", vr: "UI" },
  "00080018": { name: "SOP Instance UID", vr: "UI" },
  "00080020": { name: "Study Date", vr: "DA" },
  "00080021": { name: "Series Date", vr: "DA" },
  "00080022": { name: "Acquisition Date", vr: "DA" },
  "00080023": { name: "Content Date", vr: "DA" },
  "00080030": { name: "Study Time", vr: "TM" },
  "00080031": { name: "Series Time", vr: "TM" },
  "00080032": { name: "Acquisition Time", vr: "TM" },
  "00080033": { name: "Content Time", vr: "TM" },
  "00080050": { name: "Accession Number", vr: "SH" },
  "00080060": { name: "Modality", vr: "CS" },
  "00080064": { name: "Conversion Type", vr: "CS" },
  "00080070": { name: "Manufacturer", vr: "LO" },
  "00080080": { name: "Institution Name", vr: "LO" },
  "00080081": { name: "Institution Address", vr: "ST" },
  "00080090": { name: "Referring Physician's Name", vr: "PN" },
  "00081010": { name: "Station Name", vr: "SH" },
  "00081030": { name: "Study Description", vr: "LO" },
  "0008103e": { name: "Series Description", vr: "LO" },
  "00081050": { name: "Performing Physician's Name", vr: "PN" },
  "00081070": { name: "Operators' Name", vr: "PN" },
  "00081090": { name: "Manufacturer's Model Name", vr: "LO" },

  "00100010": { name: "Patient's Name", vr: "PN" },
  "00100020": { name: "Patient ID", vr: "LO" },
  "00100030": { name: "Patient's Birth Date", vr: "DA" },
  "00100040": { name: "Patient's Sex", vr: "CS" },
  "00101010": { name: "Patient's Age", vr: "AS" },
  "00101020": { name: "Patient's Size", vr: "DS" },
  "00101030": { name: "Patient's Weight", vr: "DS" },
  "00104000": { name: "Patient Comments", vr: "LT" },

  "00180015": { name: "Body Part Examined", vr: "CS" },
  "00180050": { name: "Slice Thickness", vr: "DS" },
  "00180060": { name: "KVP", vr: "DS" },
  "00180088": { name: "Spacing Between Slices", vr: "DS" },
  "00181020": { name: "Software Versions", vr: "LO" },
  "00181030": { name: "Protocol Name", vr: "LO" },
  "00181100": { name: "Reconstruction Diameter", vr: "DS" },
  "00181110": { name: "Distance Source to Detector", vr: "DS" },
  "00181111": { name: "Distance Source to Patient", vr: "DS" },
  "00181150": { name: "Exposure Time", vr: "IS" },
  "00181151": { name: "X-Ray Tube Current", vr: "IS" },
  "00181152": { name: "Exposure", vr: "IS" },
  "00185100": { name: "Patient Position", vr: "CS" },

  "0020000d": { name: "Study Instance UID", vr: "UI" },
  "0020000e": { name: "Series Instance UID", vr: "UI" },
  "00200010": { name: "Study ID", vr: "SH" },
  "00200011": { name: "Series Number", vr: "IS" },
  "00200012": { name: "Acquisition Number", vr: "IS" },
  "00200013": { name: "Instance Number", vr: "IS" },
  "00200032": { name: "Image Position (Patient)", vr: "DS" },
  "00200037": { name: "Image Orientation (Patient)", vr: "DS" },
  "00200052": { name: "Frame of Reference UID", vr: "UI" },
  "00201041": { name: "Slice Location", vr: "DS" },

  "00280002": { name: "Samples per Pixel", vr: "US" },
  "00280004": { name: "Photometric Interpretation", vr: "CS" },
  "00280006": { name: "Planar Configuration", vr: "US" },
  "00280008": { name: "Number of Frames", vr: "IS" },
  "00280010": { name: "Rows", vr: "US" },
  "00280011": { name: "Columns", vr: "US" },
  "00280030": { name: "Pixel Spacing", vr: "DS" },
  "00280100": { name: "Bits Allocated", vr: "US" },
  "00280101": { name: "Bits Stored", vr: "US" },
  "00280102": { name: "High Bit", vr: "US" },
  "00280103": { name: "Pixel Representation", vr: "US" },
  "00280106": { name: "Smallest Image Pixel Value", vr: "US" },
  "00280107": { name: "Largest Image Pixel Value", vr: "US" },
  "00281050": { name: "Window Center", vr: "DS" },
  "00281051": { name: "Window Width", vr: "DS" },
  "00281052": { name: "Rescale Intercept", vr: "DS" },
  "00281053": { name: "Rescale Slope", vr: "DS" },
  "00281054": { name: "Rescale Type", vr: "LO" },
  "00282110": { name: "Lossy Image Compression", vr: "CS" },

  "7fe00010": { name: "Pixel Data", vr: "OW" }
};

export function tagToDisplay(tag) {
  // dicom-parser gives tags like "x00280010"
  const hex = tag.replace(/^x/i, "");
  const g = hex.substring(0, 4).toUpperCase();
  const e = hex.substring(4, 8).toUpperCase();
  return `(${g},${e})`;
}

export function lookup(tag) {
  const hex = tag.replace(/^x/i, "").toLowerCase();
  if (DICT[hex]) return DICT[hex];
  // Private/group-specific common cases
  const group = hex.substring(0, 4);
  const elem = hex.substring(4, 8);
  if (elem === "0000") return { name: "Group Length", vr: "UL" };
  if (parseInt(group, 16) % 2 === 1) return { name: "Private Tag", vr: undefined };
  return { name: "Unknown", vr: undefined };
}
