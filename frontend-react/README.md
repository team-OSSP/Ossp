# Hand Spark (React) 👋✨

손 모양을 따라 만들며 인지 건강을 지키는 **시니어 친화 손 제스처 게임**의 React(Vite) 버전입니다.
웹캠 앞에서 미션 손 모양을 따라 하면 **MediaPipe Hands**가 손 관절을 인식해 자동으로 정답을 판정합니다.

> 기존 Vanilla JS 프로토타입을 React + react-router 구조로 재구성한 포트폴리오용 버전입니다.
> 인식 로직(규칙 기반 분류)·미션 데이터·디자인은 원본과 동일하게 이식했습니다.

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 출력된 주소(기본 `http://localhost:5173`)로 접속한 뒤 **카메라 권한을 허용**하세요.

> ⚠️ 손 인식(웹캠)은 보안 컨텍스트(localhost 또는 HTTPS)에서만 동작합니다.
> `npm run dev`는 localhost로 서빙되므로 정상 동작하며, 인터넷 연결이 필요합니다(MediaPipe를 CDN에서 로드).

## 빌드 / 배포

```bash
npm run build     # dist/ 생성
npm run preview   # 빌드 결과 미리보기
```

`dist/`를 Vercel·Netlify·GitHub Pages 등에 올리면 됩니다. (HTTPS면 카메라 동작)

## 구조

```
src/
├── main.jsx                  # 엔트리 + 라우터
├── App.jsx                   # 라우트 정의 (/ , /level , /game , /result)
├── index.css                 # 전체 스타일
├── components/Layout.jsx     # 헤더 · 하단 내비 · 아이콘
├── pages/
│   ├── Home.jsx
│   ├── Level.jsx
│   ├── Game.jsx              # 웹캠 + MediaPipe + 미션 + 타이머 + 점수
│   └── Result.jsx
├── hooks/useMediaPipeHands.js  # 웹캠·MediaPipe 생명주기 캡슐화 (마운트 시작/언마운트 정리)
├── lib/gestures.js           # 규칙 기반 제스처 분류 로직
└── data/missions.js          # 레벨별 미션 · 레벨 메타데이터
```

## 기술 스택

- React 18, react-router-dom 6, Vite 5
- MediaPipe Hands (CDN, 손 관절 21개 랜드마크)
- Canvas 2D (랜드마크 시각화), Web Storage (localStorage)

## YOLOv10n 모델 연동 (stage1, 8클래스)

- 모델 파일: `public/hagrid_stage1_8cls.onnx` (HaGRID 8클래스: palm·fist·ok·three·like·call·rock·three2)
- 추론: `onnxruntime-web` (브라우저 내 실행). `src/lib/yolo.js`가 전처리(letterbox)·추론·후처리(NMS-free) 담당.
- **하이브리드 판별**: YOLO가 잡는 6개 제스처(주먹·손바닥·OK·엄지척·전화·락사인) 미션은 YOLO로 판별하고, YOLO에 없는 미션(브이·총·손하트·양손 조합)은 MediaPipe 규칙 기반으로 판별합니다.
- **phase**: 미션이 바뀌면 1초간 YOLO 박스를 보여준 뒤(파란 박스), 이후 MediaPipe 랜드마크(빨간 점)로 전환합니다.
- 성능: YOLO 추론은 150ms 간격으로 스로틀링됩니다. WebGPU 지원 브라우저면 자동으로 더 빠르게 동작합니다.

> 첫 실행 시 onnxruntime-web의 wasm과 모델(약 9MB)을 내려받느라 몇 초 걸릴 수 있어요.
> 미션 라벨에 `YOLO ✓`가 뜨면 모델이 준비된 상태입니다(`YOLO 로딩중`이면 아직 MediaPipe로만 판별).

## 참고

- 현재 모델은 HaGRID 단독 학습본(stage1)입니다. 자체 수집(동양인·고령층) 데이터를 합친 버전과의 성능 비교를 위해 의도적으로 분리해 두었습니다.
- 8클래스 외 제스처(브이·총·손하트 등)는 MediaPipe 규칙 기반이 담당합니다.
