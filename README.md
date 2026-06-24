# HandSpark — AI 손 제스처 인지훈련 게임

웹캠 앞에서 손 모양을 따라 만들며 인지 건강을 지키는 시니어 친화 손 제스처 게임입니다.
화면이 미션 손 모양을 제시하면, 웹캠이 손을 인식해 자동으로 정답을 판정하고
정답률, 반응속도, 소요 시간을 기록해 인지 훈련을 도와줍니다.

고령화 사회에서 치매 예방·경도인지장애(MCI) 관리를 위한 손가락 인지 훈련을,
별도 장비 없이 카메라만으로 가정에서 할 수 있도록 만들었습니다.

---

## 한눈에 보기

- 프론트엔드: React(Vite) + YOLOv10n 모델 통합 (하이브리드 인식)
- 손 제스처 인식 모델: YOLOv10n
  - stage1 — HaGRID 8개 클래스 학습본
  - stage2 — 자체 수집 동양인·고령층 데이터를 추가한 학습본 (성능 비교용)
- 학습·전처리 파이프라인: `train/`, `prepare/`, `datasets/`

---

## 프로젝트 구조

```
Ossp/
├── frontend-react/               # React(Vite) 메인 앱
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   │   ├── hagrid_stage1_8cls.onnx       # 브라우저 추론용 stage1 모델
│   │   └── hagrid_stage2_8cls2.onnx      # 브라우저 추론용 stage2 모델
│   └── src/
│       ├── App.jsx                       # 라우팅 (/, /level, /game, /result)
│       ├── pages/                        # Home, Level, Game, Result 페이지
│       ├── components/Layout.jsx         # 헤더, 하단 내비게이션
│       ├── hooks/useMediaPipeHands.js    # 웹캠 + MediaPipe 처리
│       ├── lib/gestures.js               # 규칙 기반 제스처 분류
│       ├── lib/yolo.js                   # onnxruntime-web YOLO 추론
│       └── data/missions.js             # 레벨별 미션 데이터
│
├── model/
│   ├── hagrid_stage1_8cls_best.pt        # stage1 학습 가중치
│   └── export_yolov10_onnx.ipynb         # .pt → .onnx 변환 노트북
│
├── train/
│   ├── train_yolov10_stage1.ipynb                  # stage1 기본 학습
│   ├── train_yolov10_HaGRID_8cls.ipynb             # HaGRID 8클래스 학습
│   ├── train_yolov10_HaGRID_8cls_1_Elderly.ipynb   # HaGRID + 고령층 데이터 1차 추가
│   ├── train_yolov10_stage2_elderly.ipynb           # stage2 고령층 데이터 학습
│   ├── train_yolov10_stage2_2.ipynb                # stage2 재실험
│   ├── train_yolov10_stage2_elderly_freezer.ipynb  # stage2 레이어 고정(freezer) 실험
│   └── hagrid_stage2_elderly_best.pt               # stage2 최종 가중치
│
├── datasets/
│   ├── dataset.yaml                      # HaGRID YOLO 8클래스 정의
│   └── OSSP-Labeling-coco.zip            # 자체 수집 라벨링 데이터 (COCO 포맷)
│
└── prepare/
    └── prepare_hagrid_dataset.py         # HaGRID 다운로드·전처리 스크립트
```

---

## 게임 방법

1. 홈에서 게임 시작 → 레벨 선택 (기본값 Lv.2)
2. 화면 상단의 미션 손 모양을 웹캠 앞에서 따라 만듭니다.
3. 손 모양이 인식되면 자동으로 다음 문제로 넘어갑니다.
4. 제한 시간(10초) 안에 5문제를 마치면 결과 화면에서 통계를 확인할 수 있습니다.

### 레벨 구성

| 레벨 | 이름 | 내용 | 제한 시간 | 예시 |
|------|------|------|-----------|------|
| Lv.1 | 한 손 기초 | 한 손 간단한 모양 | 10초 | 손바닥, 주먹, 엄지척, 숫자 3(검·중·약) |
| Lv.2 | 한 손 심화 | 한 손 복잡한 모양 | 10초 | OK, 락사인, 전화, 숫자 3(엄·검·중) |
| Lv.3 | 양손 조합 | 양손으로 서로 다른 모양 | 10초 | 손바닥+주먹, OK+손바닥, 엄지척+전화 등 |

---

## 손 제스처 인식 방식

YOLOv10n 모델과 MediaPipe Hands를 함께 사용하는 하이브리드 방식입니다.

- **YOLO**: 8개 손 모양(손바닥·주먹·OK·숫자3·엄지척·전화·락사인·숫자3′)을 직접 인식합니다. Lv.3 양손 조합은 두 손 검출 결과를 조합해 판정합니다.
- **MediaPipe**: 손 관절 21개 랜드마크를 화면에 그려줍니다.
- **화면 흐름**: 미션이 시작되면 1초간 YOLO 바운딩 박스를 보여준 뒤 랜드마크 표시로 전환합니다.

모델은 `onnxruntime-web`으로 브라우저에서 직접 추론하기 때문에 별도 백엔드가 필요 없습니다.

---

## 모델 학습

| 단계 | 학습 데이터 | 클래스 | 가중치 파일 |
|------|-------------|--------|-------------|
| stage1 | HaGRID (8클래스) | palm·fist·ok·three·like·call·rock·three2 | `model/hagrid_stage1_8cls_best.pt` |
| stage2 | HaGRID + 자체 수집(동양인·고령층) | 동일 | `train/hagrid_stage2_elderly_best.pt` |

- 데이터셋: HaGRID(`datasets/dataset.yaml`) + 자체 수집 데이터를 Roboflow로 라벨링(`datasets/OSSP-Labeling-coco.zip`)
- 전처리: `prepare/prepare_hagrid_dataset.py`로 HaGRID를 다운로드하고 YOLO 포맷으로 변환합니다.
- 학습/변환: `train/` 노트북에서 학습하고, `model/export_yolov10_onnx.ipynb`로 `.pt → .onnx` 변환합니다.
- ablation: HaGRID 단독(stage1) vs 자체 데이터 추가(stage2)로 고령층·동양인 손에 대한 인식 성능을 비교했습니다.

현재 앱에는 stage1(`hagrid_stage1_8cls.onnx`)과 stage2(`hagrid_stage2_8cls2.onnx`) 모두 탑재되어 있습니다.

---

## 실행 방법

카메라(`getUserMedia`)는 **localhost 또는 HTTPS** 환경에서만 동작합니다.
VS Code 내장 미리보기(Simple Browser)는 카메라 접근이 안 되니 Chrome/Edge 같은 실제 브라우저에서 열어주세요.

```bash
cd frontend-react
npm install
npm run dev
# http://localhost:5173 접속 → 카메라 허용
```

첫 실행 시 onnxruntime-web의 wasm과 모델 파일(약 9MB)을 받느라 몇 초 걸릴 수 있습니다.
미션 라벨에 `YOLO ✓`가 표시되면 모델이 준비된 상태입니다.

### 모델 전환 (stage1 / stage2)

기본은 stage1 모델로 실행됩니다. stage2로 바꿔 성능을 비교하려면 주소에 `?model=2`를 붙이세요.

http://localhost:5173/game?level=2          # stage1 (기본)
http://localhost:5173/game?level=2&model=2  # stage2 (자체 데이터 추가)

모델을 바꾼 뒤에는 브라우저를 하드 리프레시(Ctrl+Shift+R)해야 새 모델이 로드됩니다.

---

## 기술 스택

- 프론트엔드: React 18, Vite, React Router
- 손 관절 인식: MediaPipe Hands (CDN)
- 제스처 모델: YOLOv10n → ONNX (onnxruntime-web, 브라우저 추론)
- 데이터: HaGRID + 자체 수집 / Roboflow 라벨링
- 저장: localStorage (선택 레벨, 최근 기록)

---

## 데이터 저장

서버 없이 브라우저 `localStorage`만 사용합니다.

| 키 | 내용 |
|----|------|
| `handSparkLevel` | 마지막으로 선택한 레벨 |
| `handSparkLastResult` | 최근 게임 결과 (레벨, 정답 수, 소요 시간, 평균 반응속도) |

---

## 주의사항

- 카메라 권한이 필요하고, localhost 또는 HTTPS 환경에서 실행해야 합니다.
- MediaPipe와 onnxruntime-web을 CDN에서 불러오므로 인터넷 연결이 필요합니다.
- Chrome 계열 브라우저에서 가장 안정적으로 동작합니다.

---

## 팀 HandSpark

| 역할 | 이름 | 담당 |
|------|------|------|
| 팀장 | 안서희 (2414784) | 프론트엔드·게임 로직·전체 통합 (React/Vite 앱·라우팅, 웹캠·MediaPipe 연동, 미션 데이터·생성 로직, 정답 판정(쿨다운/타이머), onnxruntime-web YOLO 통합, 결과 통계·localStorage) |
| 팀원 | 김리원 (2415145) | UI·AI 모델·데이터 (데이터 수집·Roboflow 라벨링·전처리, HaGRID 8클래스 stage1 학습, .pt→.onnx 변환, 시니어 친화 UI, 랜드마크·박스 렌더링) |
| 팀원 | 박현아 (2413151) | AI 모델·데이터 (데이터 수집·Roboflow 라벨링, 자체 데이터 통합 stage2 파인튜닝, freeze 등 추가 실험·성능 비교 분석) |