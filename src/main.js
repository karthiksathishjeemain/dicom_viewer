import "./style.css";
import { parse, extractMetadata, buildImageModel } from "./dicom.js";

const els = {
  fileInput: document.getElementById("file-input"),
  dropzone: document.getElementById("dropzone"),
  workspace: document.getElementById("workspace"),
  canvas: document.getElementById("canvas"),
  canvasMsg: document.getElementById("canvas-msg"),
  pixelInfo: document.getElementById("pixel-info"),
  ww: document.getElementById("ww"),
  wc: document.getElementById("wc"),
  wwVal: document.getElementById("ww-val"),
  wcVal: document.getElementById("wc-val"),
  frameCtrl: document.getElementById("frame-ctrl"),
  frame: document.getElementById("frame"),
  frameVal: document.getElementById("frame-val"),
  invert: document.getElementById("invert"),
  reset: document.getElementById("reset"),
  metaBody: document.getElementById("meta-body"),
  metaSearch: document.getElementById("meta-search"),
};

const state = {
  model: null,
  frameIndex: 0,
  ww: 400,
  wc: 40,
  invert: false,
  metadata: [],
};

function setError(msg) {
  els.canvasMsg.textContent = msg;
  els.canvasMsg.classList.remove("hidden");
  els.canvas.classList.add("hidden");
}

function clearError() {
  els.canvasMsg.classList.add("hidden");
  els.canvas.classList.remove("hidden");
}

async function handleFile(file) {
  if (!file) return;

  // Reset any state from a previously loaded file so its data never
  // lingers if this new file fails to parse.
  state.model = null;
  state.metadata = [];
  state.frameIndex = 0;
  els.metaSearch.value = "";
  renderMetadata();
  els.pixelInfo.textContent = "";

  try {
    const buffer = await file.arrayBuffer();
    const byteArray = new Uint8Array(buffer);
    const dataSet = parse(byteArray);

    state.metadata = extractMetadata(dataSet);
    renderMetadata();

    state.model = buildImageModel(dataSet, byteArray);
    els.dropzone.classList.add("hidden");
    els.workspace.classList.remove("hidden");

    setupViewer();
  } catch (err) {
    console.error(err);
    els.dropzone.classList.add("hidden");
    els.workspace.classList.remove("hidden");
    setError("Could not parse this file as DICOM. " + (err && err.message ? err.message : ""));
  }
}

function setupViewer() {
  const m = state.model;
  if (!m || !m.supported) {
    setError(m ? m.reason : "No image available.");
    els.frameCtrl.classList.add("hidden");
    return;
  }
  clearError();

  state.frameIndex = 0;
  state.invert = false;
  els.invert.classList.remove("active");

  els.canvas.width = m.width;
  els.canvas.height = m.height;

  if (m.isColor) {
    els.ww.disabled = true;
    els.wc.disabled = true;
  } else {
    els.ww.disabled = false;
    els.wc.disabled = false;
    state.ww = m.defaultWW;
    state.wc = m.defaultWC;
    const span = Math.max(m.defaultWW * 2, 4000, Math.abs(m.dataMax - m.dataMin));
    els.ww.min = 1;
    els.ww.max = Math.round(span);
    els.ww.value = state.ww;
    els.wc.min = Math.round(m.dataMin - span);
    els.wc.max = Math.round(m.dataMax + span);
    els.wc.value = state.wc;
    els.wwVal.textContent = state.ww;
    els.wcVal.textContent = state.wc;
  }

  if (m.frames > 1) {
    els.frameCtrl.classList.remove("hidden");
    els.frame.min = 0;
    els.frame.max = m.frames - 1;
    els.frame.value = 0;
    els.frameVal.textContent = `1 / ${m.frames}`;
  } else {
    els.frameCtrl.classList.add("hidden");
  }

  draw();
}

function draw() {
  const m = state.model;
  if (!m || !m.supported) return;
  const ctx = els.canvas.getContext("2d");
  const imageData = m.renderToImageData(state.frameIndex, state.ww, state.wc, state.invert);
  ctx.putImageData(imageData, 0, 0);

  const dims = `${m.width} × ${m.height}`;
  const bits = `${m.bitsAllocated}-bit`;
  const photo = m.photometric;
  els.pixelInfo.textContent =
    `${dims} · ${photo} · ${bits}` +
    (m.frames > 1 ? ` · ${m.frames} frames` : "") +
    (m.isColor ? "" : ` · slope ${m.slope}, intercept ${m.intercept}`);
}

function renderMetadata(filter = "") {
  const q = filter.trim().toLowerCase();
  const frag = document.createDocumentFragment();
  for (const row of state.metadata) {
    if (q) {
      const hay = `${row.tag} ${row.name} ${row.vr} ${row.value}`.toLowerCase();
      if (!hay.includes(q)) continue;
    }
    const tr = document.createElement("tr");
    tr.innerHTML =
      `<td class="t-tag">${escapeHtml(row.tag)}</td>` +
      `<td class="t-name">${escapeHtml(row.name)}</td>` +
      `<td class="t-vr">${escapeHtml(row.vr)}</td>` +
      `<td class="t-val">${escapeHtml(row.value)}</td>`;
    frag.appendChild(tr);
  }
  els.metaBody.innerHTML = "";
  els.metaBody.appendChild(frag);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ---- Events -------------------------------------------------------------

els.fileInput.addEventListener("change", (e) => handleFile(e.target.files[0]));

els.ww.addEventListener("input", () => {
  state.ww = Number(els.ww.value);
  els.wwVal.textContent = state.ww;
  draw();
});
els.wc.addEventListener("input", () => {
  state.wc = Number(els.wc.value);
  els.wcVal.textContent = state.wc;
  draw();
});
els.frame.addEventListener("input", () => {
  state.frameIndex = Number(els.frame.value);
  els.frameVal.textContent = `${state.frameIndex + 1} / ${state.model.frames}`;
  draw();
});
els.invert.addEventListener("click", () => {
  state.invert = !state.invert;
  els.invert.classList.toggle("active", state.invert);
  draw();
});
els.reset.addEventListener("click", () => {
  const m = state.model;
  if (!m || m.isColor) return;
  state.ww = m.defaultWW;
  state.wc = m.defaultWC;
  els.ww.value = state.ww;
  els.wc.value = state.wc;
  els.wwVal.textContent = state.ww;
  els.wcVal.textContent = state.wc;
  draw();
});
els.metaSearch.addEventListener("input", () => renderMetadata(els.metaSearch.value));

// Drag and drop on the whole window.
["dragenter", "dragover"].forEach((evt) =>
  window.addEventListener(evt, (e) => {
    e.preventDefault();
    els.dropzone.classList.add("dragging");
  })
);
["dragleave", "drop"].forEach((evt) =>
  window.addEventListener(evt, (e) => {
    e.preventDefault();
    if (evt === "dragleave" && e.relatedTarget) return;
    els.dropzone.classList.remove("dragging");
  })
);
window.addEventListener("drop", (e) => {
  const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (file) handleFile(file);
});

// Click-drag on canvas to adjust window/level (like clinical viewers).
let dragging = false;
let lastX = 0;
let lastY = 0;
els.canvas.addEventListener("mousedown", (e) => {
  if (!state.model || state.model.isColor) return;
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
});
window.addEventListener("mouseup", () => (dragging = false));
window.addEventListener("mousemove", (e) => {
  if (!dragging) return;
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  lastX = e.clientX;
  lastY = e.clientY;
  state.ww = Math.max(1, state.ww + dx);
  state.wc = state.wc + dy;
  els.ww.value = state.ww;
  els.wc.value = state.wc;
  els.wwVal.textContent = state.ww;
  els.wcVal.textContent = Math.round(state.wc);
  draw();
});
