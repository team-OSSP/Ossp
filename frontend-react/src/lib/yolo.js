import * as ort from "onnxruntime-web";

// wasm을 CDN에서 로드 (설치 버전과 동일 버전으로 고정)
ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/";

// stage1 모델 클래스 (8개)
export const YOLO_NAMES = ["palm", "fist", "ok", "three", "like", "call", "rock", "three2"];

// YOLO 클래스 -> 게임 미션 제스처 이름 (게임이 실제로 쓰는 6개만 매핑)
export const YOLO_TO_GESTURE = {
  palm: "open_palm",
  fist: "fist",
  ok: "ok",
  like: "thumbs_up",
  call: "call",
  rock: "rock",
  // three, three2 는 현재 미션에 없어 매핑하지 않음
};

const SIZE = 640;
let session = null;
let loading = null;

const off = document.createElement("canvas");
off.width = SIZE;
off.height = SIZE;
const octx = off.getContext("2d", { willReadFrequently: true });

export async function loadYolo(url = "/hagrid_stage1_8cls.onnx") {
  if (session) return session;
  if (loading) return loading;
  loading = ort.InferenceSession
    .create(url, { executionProviders: ["webgpu", "wasm"] })
    .then((s) => { session = s; return s; });
  return loading;
}

export function isYoloReady() {
  return !!session;
}

function preprocess(video) {
  const vw = video.videoWidth, vh = video.videoHeight;
  const r = Math.min(SIZE / vw, SIZE / vh);
  const nw = Math.round(vw * r), nh = Math.round(vh * r);
  const dx = Math.floor((SIZE - nw) / 2), dy = Math.floor((SIZE - nh) / 2);
  octx.fillStyle = "rgb(114,114,114)";
  octx.fillRect(0, 0, SIZE, SIZE);
  octx.drawImage(video, 0, 0, vw, vh, dx, dy, nw, nh);
  const { data } = octx.getImageData(0, 0, SIZE, SIZE);
  const area = SIZE * SIZE;
  const chw = new Float32Array(3 * area);
  for (let i = 0; i < area; i++) {
    chw[i] = data[i * 4] / 255;
    chw[i + area] = data[i * 4 + 1] / 255;
    chw[i + area * 2] = data[i * 4 + 2] / 255;
  }
  return { chw, r, dx, dy };
}

// 추론 -> 원본 video 픽셀 좌표계 박스 배열 [{x1,y1,x2,y2,score,cls,name}]
export async function runYolo(video, conf = 0.45) {
  if (!session || !video || !video.videoWidth) return [];
  const { chw, r, dx, dy } = preprocess(video);
  const out = await session.run({
    images: new ort.Tensor("float32", chw, [1, 3, SIZE, SIZE]),
  });
  const d = out.output0.data; // [300*6], 점수 내림차순 (end2end)
  const dets = [];
  for (let i = 0; i < 300; i++) {
    const o = i * 6;
    const score = d[o + 4];
    if (score < conf) break; // 정렬돼 있어 조기 종료
    const cls = d[o + 5] | 0;
    dets.push({
      x1: (d[o] - dx) / r,
      y1: (d[o + 1] - dy) / r,
      x2: (d[o + 2] - dx) / r,
      y2: (d[o + 3] - dy) / r,
      score,
      cls,
      name: YOLO_NAMES[cls],
    });
  }
  return dets;
}
