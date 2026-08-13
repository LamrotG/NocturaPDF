import LutWorker from './lutWorker.js?worker';

let worker = null;
let nextId = 1;
const pending = new Map();

function ensureWorker() {
  if (!worker) {
    worker = new LutWorker();
    worker.onmessage = ({ data }) => {
      const { id, pixels } = data;
      const resolver = pending.get(id);
      if (resolver) {
        pending.delete(id);
        resolver(pixels);
      }
    };
    worker.onerror = (e) => {
      // Reject all pending tasks on error
      for (const [id, resolver] of pending.entries()) {
        resolver(Promise.reject(e));
        pending.delete(id);
      }
    };
  }
  return worker;
}

export function runLutWorker(pixelsBuffer, lutArray, mode) {
  return new Promise((resolve, reject) => {
    try {
      const w = ensureWorker();
      const id = nextId++;
      pending.set(id, (pixels) => resolve(pixels));
      w.postMessage({ id, pixels: pixelsBuffer, lut: Array.from(lutArray), mode }, [pixelsBuffer]);
    } catch (e) {
      reject(e);
    }
  });
}

export function terminatePool() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}
