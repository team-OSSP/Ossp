# HandSpark 👋✨ — AI 손 제스처 인지훈련 게임

> 웹캠 앞에서 손 모양을 따라 만들며 인지 건강을 지키는 **시니어 친화 손 제스처 게임**입니다.
> 화면이 제시하는 손 모양(주먹, 손바닥, OK, 전화 모양 등)을 따라 하면 손을 인식해 자동으로 정답을 판정하고,
> 정답률·반응속도·소요 시간을 기록해 인지 훈련을 돕습니다.

고령화 사회에서 **치매 예방·경도인지장애(MCI) 관리**를 위한 손가락 인지 훈련을, 별도 장비 없이 카메라만으로 가정에서도 할 수 있도록 만드는 것이 목표입니다.

---

## 📌 한눈에 보기

- **두 가지 프론트엔드**
  - `frontend/` — HTML/CSS/Vanilla JS 프로토타입 (MediaPipe 규칙 기반 인식)
  - `frontend-react/` — React(Vite) 버전 + **YOLOv10n 모델 통합**(하이브리드 인식)
- **손 제스처 인식 모델 (YOLOv10n)**
  - `stage1` — HaGRID 8개 클래스 학습본
  - `stage2` — 자체 수집 **동양인·고령층 데이터**를 추가한 학습본 (성능 비교용)
- **학습·전처리 파이프라인** — `train/`, `prepare/`, `datasets/`

---

## 📂 프로젝트 구조

```
Ossp/
├── frontend/                     # 바닐라 JS 프로토타입
│   ├── home.html                 # 홈
│   ├── level.html                # 레벨 선택
│   ├── game.html                 # 게임 진행 (웹캠 + 손 인식)
│   ├── result.html               # 결과 통계
│   └── style.css                 # 공통 스타일
│
├── frontend-react/               # React(Vite) 버전 + YOLO 통합
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   │   └── hagrid_stage1_8cls.onnx   # 브라우저 추론용 stage1 모델
│   └── src/
│       ├── App.jsx                   # 라우팅 (/, /level, /game, /result)
│       ├── pages/                    # Home · Level · Game · Result
│       ├── components/Layout.jsx     # 헤더 · 하단 내비
│       ├── hooks/useMediaPipeHands.js # 웹캠 + MediaPipe 생명주기
│       ├── lib/gestures.js           # 규칙 기반 제스처 분류
│       ├── lib/yolo.js               # onnxruntime-web YOLO 추론
│       └── data/missions.js          # 레벨별 미션 데이터
│
├── model/                        # 배포용 모델
│   ├── hagrid_stage1_8cls_best.pt    # stage1 학습 가중치
│   └── export_yolov10_onnx.ipynb     # .pt → .onnx 변환 노트북
│
├── train/                        # 학습 노트북 + 가중치
│   ├── train_yolov10_stage1.ipynb
│   ├── train_yolov10_HaGRID_8cls.ipynb
│   ├── train_yolov10_stage2_elderly_*.ipynb
│   └── hagrid_stage2_elderly_best.pt # stage2 (고령층 데이터 포함)
│
├── datasets/
│   ├── dataset.yaml                  # HaGRID YOLO 8클래스 정의
│   └── OSSP-Labeling.coco (1).zip    # 자체 수집 라벨링 데이터 (COCO)
│
└── prepare/
    └── prepare_hagrid_dataset.py     # HaGRID 다운로드·전처리 스크립트
```

---

## 🎮 게임 방법

1. 홈에서 **게임 시작** → 레벨 선택 (기본값 Lv.2)
2. 화면 상단의 **미션 손 모양**을 웹캠 앞에서 따라 만듭니다.
3. 손 모양이 인식되면 **자동으로 다음 문제**로 진행됩니다.
   - 인식이 어려우면 **`동작했어요`** 로 통과, **`건너뛰기`** 로 패스 (접근성 보장)
4. 미션마다 **제한 시간**이 있고, 5문제를 마치면 **결과 화면**에서 통계를 확인합니다.

### 레벨 구성

| 레벨 | 이름 | 내용 | 제한 시간 | 예시 |
| --- | --- | --- | --- | --- |
| **Lv.1** | 한 손 기초 | 한 손 간단한 모양 | 10초 | 주먹, 손바닥, 엄지척, OK, 브이 |
| **Lv.2** | 한 손 심화 | 한 손 복잡한 모양 | 8초 | 전화 모양, 락사인, 손가락 총, 검지, 손하트 |
| **Lv.3** | 양손 조합 | 양손으로 서로 다른 모양 | 6초 | 주먹+손바닥, 엄지척+브이, OK+검지 |

> 제한 시간은 `max(5, 12 − 레벨×2)` 초로 자동 계산됩니다.

---

## 🤚 손 제스처 인식 방식

### 1) 규칙 기반 (MediaPipe Hands)

별도 학습 모델 없이, **MediaPipe가 추정한 손 관절 21개 좌표를 규칙으로 해석**해 제스처를 판별합니다. 손가락 펴짐(끝–중간 관절 위치)과 거리(엄지–검지, 손바닥 크기 비율)를 이용해 `fist`, `open_palm`, `thumbs_up`, `ok`, `peace`, `call`, `rock`, `point`, `finger_heart` 등을 분류합니다. 오인식을 줄이기 위해 자동 판정에 **1.2초 쿨다운**을 둡니다.

### 2) YOLOv10n (React 버전, 하이브리드)

`frontend-react`는 학습한 **YOLOv10n 모델(stage1, 8클래스)** 을 `onnxruntime-web`으로 **브라우저에서 직접 추론**합니다. 별도 백엔드 없이 클라이언트에서 동작합니다.

- **하이브리드 판정**: YOLO가 잡는 6개 제스처(주먹·손바닥·OK·엄지척·전화·락사인)는 YOLO로, 나머지(브이·손가락 총·손하트·양손 조합)는 MediaPipe 규칙 기반으로 판정합니다.
- **화면 표시**: 미션 시작 시 1초간 YOLO 박스를 보여준 뒤, MediaPipe 손 관절 랜드마크로 전환합니다.

---

## 🧠 인식 모델 학습 (YOLOv10n)

| 단계 | 데이터 | 클래스 | 가중치 |
| --- | --- | --- | --- |
| **stage1** | HaGRID (8클래스) | palm·fist·ok·three·like·call·rock·three2 | `model/hagrid_stage1_8cls_best.pt` |
| **stage2** | HaGRID + 자체 수집(동양인·고령층) | 동일 | `train/hagrid_stage2_elderly_best.pt` |

- **데이터셋**: HaGRID(`datasets/dataset.yaml`) + 자체 수집 데이터를 Roboflow로 라벨링(`datasets/OSSP-Labeling.coco (1).zip`)
- **전처리**: `prepare/prepare_hagrid_dataset.py` (HaGRID 다운로드·YOLO 포맷 변환)
- **학습/내보내기**: `train/`의 노트북에서 학습, `model/export_yolov10_onnx.ipynb`에서 `.pt → .onnx` 변환
- **비교 실험(ablation)**: HaGRID 단독(stage1) vs 자체 데이터 추가(stage2)로 고령층·동양인 손에 대한 인식 성능을 비교합니다.

> 현재 React 데모에는 stage1(`.onnx`)이 탑재돼 있습니다.

---

## 🚀 실행 방법

손 인식 카메라(`getUserMedia`)는 **보안 컨텍스트(localhost 또는 HTTPS)** 에서만 동작합니다.
⚠️ VS Code의 내장 미리보기(Simple Browser)는 카메라 접근이 안 되니, **Chrome/Edge 등 실제 브라우저**에서 여세요.

### A. 바닐라 버전 (`frontend/`)

```bash
cd frontend
python -m http.server 8000      # 또는: npx serve
# 브라우저에서 http://localhost:8000/home.html 접속 → 카메라 허용
```

### B. React 버전 (`frontend-react/`)

```bash
cd frontend-react
npm install
npm run dev
# 브라우저에서 http://localhost:5173 접속 → 카메라 허용
```

> 첫 실행 시 onnxruntime-web의 wasm과 모델(약 9MB)을 내려받느라 몇 초 걸릴 수 있습니다.
> 미션 라벨에 `YOLO ✓`가 뜨면 모델이 준비된 상태입니다.

---

## 🛠 기술 스택

- **프론트엔드**: HTML5 · CSS3 · Vanilla JS / React 18 · Vite · React Router
- **손 관절 인식**: MediaPipe Hands (CDN)
- **제스처 검출 모델**: YOLOv10n (Ultralytics) → ONNX (`onnxruntime-web`, 브라우저 추론)
- **데이터**: HaGRID + 자체 수집 데이터 / Roboflow 라벨링
- **저장**: Web Storage(`localStorage`) — 선택 레벨·최근 기록

---

## 💾 데이터 저장

서버 없이 브라우저 `localStorage`만 사용합니다.

| 키 | 내용 |
| --- | --- |
| `handSparkLevel` | 마지막으로 선택한 레벨 |
| `handSparkLastResult` | 최근 게임 결과(레벨·정답 수·소요 시간·평균 반응속도 등) |

---

## ⚠️ 요구 사항 · 주의점

- 카메라 권한이 필요하며 **localhost 또는 HTTPS** 환경에서 실행해야 합니다.
- MediaPipe·onnxruntime-web을 CDN에서 불러오므로 **인터넷 연결**이 필요합니다.
- 카메라·모델 로드 실패 시 자동으로 **수동 진행 모드**로 전환됩니다.
- 최신 Chrome 계열 브라우저에서 가장 안정적으로 동작합니다.

---

## 👥 팀 HandSpark

| 역할 | 이름 | 담당 |
| --- | --- | --- |
| 팀장 | 안서희 (2414784) | AI 모델 · 데이터 수집/라벨링 |
| 팀원 | 김리원 (2415145) | 프론트엔드 · UI |
| 팀원 | 박현아 (2413151) | 게임 로직 · 기획 · 통합 |

---

**HandSpark** · 손을 움직여 뇌를 깨우는 인지훈련 게임 🧠
