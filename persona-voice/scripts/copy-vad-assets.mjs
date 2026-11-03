import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const vadDist = resolve(__dirname, '../node_modules/@ricky0123/vad-web/dist');
const onnxDist = resolve(__dirname, '../node_modules/onnxruntime-web/dist');
const targetDir = resolve(__dirname, '../public/vad');

mkdirSync(targetDir, { recursive: true });

const filesToCopy = [
  { src: `${vadDist}/vad.worklet.bundle.min.js`, dest: `${targetDir}/vad.worklet.bundle.min.js` },
  { src: `${vadDist}/silero_vad_v5.onnx`, dest: `${targetDir}/silero_vad.onnx` },
  { src: `${vadDist}/silero_vad_legacy.onnx`, dest: `${targetDir}/silero_vad_legacy.onnx` },
  { src: `${vadDist}/silero_vad_v5.onnx`, dest: `${targetDir}/silero_vad_v5.onnx` },
  { src: `${vadDist}/silero_vad_v6.onnx`, dest: `${targetDir}/silero_vad_v6.onnx` },
  { src: `${onnxDist}/ort-wasm-simd-threaded.wasm`, dest: `${targetDir}/ort-wasm-simd-threaded.wasm` },
  { src: `${onnxDist}/ort-wasm-simd-threaded.mjs`, dest: `${targetDir}/ort-wasm-simd-threaded.mjs` },
  { src: `${onnxDist}/ort-wasm-simd.wasm`, dest: `${targetDir}/ort-wasm-simd.wasm` },
  { src: `${onnxDist}/ort-wasm.wasm`, dest: `${targetDir}/ort-wasm.wasm` },
];

for (const { src, dest } of filesToCopy) {
  if (existsSync(src)) {
    copyFileSync(src, dest);
    console.log(`Copied ${src} -> ${dest}`);
  } else {
    console.warn(`File not found: ${src}`);
  }
}
console.log('VAD assets successfully copied to public/vad/');
