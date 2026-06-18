import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "../components/Layout.jsx";
import { useMediaPipeHands } from "../hooks/useMediaPipeHands.js";
import { missionSets } from "../data/missions.js";
import { isExpectedGesture } from "../lib/gestures.js";
import { loadYolo, runYolo, YOLO_TO_GESTURE } from "../lib/yolo.js";

// YOLO(stage1 8클래스)가 판별 가능한 미션 제스처
const YOLO_GESTURES = new Set(["open_palm", "fist", "ok", "thumbs_up", "call", "rock"]);

export default function Game() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const level =
    Number(params.get("level")) ||
    Number(localStorage.getItem("handSparkLevel")) ||
    2;

  const missions = missionSets[level] || missionSets[2];
  const roundSeconds = Math.max(5, 12 - level * 2);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // 렌더용 state
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [remaining, setRemaining] = useState(roundSeconds);
  const [status, setStatus] = useState("모델·카메라 준비 중...");
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState("landmark");
  const [yoloReady, setYoloReady] = useState(false);

  // 콜백/루프에서 참조할 로직 state (stale closure 방지)
  const indexRef = useRef(0);
  const scoreRef = useRef(0);
  const finishedRef = useRef(false);
  const lastAutoMatchRef = useRef(0);
  const roundStartedAtRef = useRef(Date.now());
  const reactionTimesRef = useRef([]);
  const startedAtRef = useRef(Date.now());
  const markRef = useRef(() => {});
  const phaseRef = useRef("landmark");
  const mpLandmarksRef = useRef([]);
  const yoloDetsRef = useRef([]);

  const finishGame = useCallback(() => {
    finishedRef.current = true;
    const elapsedSeconds = Math.round((Date.now() - startedAtRef.current) / 1000);
    const rt = reactionTimesRef.current;
    const averageReaction = rt.length ? rt.reduce((a, b) => a + b, 0) / rt.length : 0;
    const result = {
      level,
      total: missions.length,
      correct: scoreRef.current,
      elapsedSeconds,
      averageReaction,
      finishedAt: new Date().toISOString(),
    };
    localStorage.setItem("handSparkLastResult", JSON.stringify(result));
    navigate("/result");
  }, [level, missions.length, navigate]);

  const markMission = useCallback(
    (isCorrect) => {
      if (finishedRef.current) return;
      if (isCorrect) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
        reactionTimesRef.current.push((Date.now() - roundStartedAtRef.current) / 1000);
      }
      const next = indexRef.current + 1;
      if (next >= missions.length) { finishGame(); return; }
      indexRef.current = next;
      setIndex(next);
      setRemaining(roundSeconds);
      roundStartedAtRef.current = Date.now();
    },
    [missions.length, roundSeconds, finishGame]
  );
  markRef.current = markMission;

  // 공통 판별 (1.2초 쿨다운)
  const judge = useCallback(
    (gestures) => {
      if (finishedRef.current) return;
      const m = missions[indexRef.current];
      const expected = m && m.gesture;
      if (
        expected &&
        isExpectedGesture(expected, gestures) &&
        Date.now() - lastAutoMatchRef.current > 1200
      ) {
        lastAutoMatchRef.current = Date.now();
        setStatus("정답 인식!");
        markRef.current(true);
      }
    },
    [missions]
  );

  // MediaPipe 결과: 랜드마크 저장 + (YOLO가 못 잡는 미션은) 규칙 기반으로 판별
  const onResults = useCallback(
    ({ gestures, landmarks }) => {
      mpLandmarksRef.current = landmarks;
      setStarted(true);
      const m = missions[indexRef.current];
      const expected = m && m.gesture;
      if (expected && !YOLO_GESTURES.has(expected)) {
        if (gestures.length) setStatus("인식: " + gestures.join(", "));
        judge(gestures);
      }
    },
    [missions, judge]
  );

  const onStatus = useCallback((t) => {
    setStatus(t);
    if (t.includes("연결") || t.includes("인식")) setStarted(true);
  }, []);

  useMediaPipeHands({ videoRef, onResults, onStatus });

  // YOLO 모델 로드
  useEffect(() => {
    let alive = true;
    loadYolo("/hagrid_stage1_8cls.onnx")
      .then(() => { if (alive) setYoloReady(true); })
      .catch((e) => { console.error("YOLO 모델 로드 실패:", e); });
    return () => { alive = false; };
  }, []);

  // 게임 화면 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // 미션 바뀔 때: 1초간 YOLO 박스 표시 -> 이후 랜드마크
  useEffect(() => {
    phaseRef.current = "yolo";
    setPhase("yolo");
    const id = setTimeout(() => { phaseRef.current = "landmark"; setPhase("landmark"); }, 1000);
    return () => clearTimeout(id);
  }, [index]);

  // 라운드 타이머
  useEffect(() => {
    if (finishedRef.current) return;
    setRemaining(roundSeconds);
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(id); setTimeout(() => markRef.current(false), 0); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [index, roundSeconds]);

  // YOLO 추론 + 렌더 루프 (phase에 따라 박스/랜드마크 분기)
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    let raf = null, busy = false, last = 0;

    function cover() {
      const cw = (canvas.width = canvas.clientWidth);
      const ch = (canvas.height = canvas.clientHeight);
      const vw = video.videoWidth || cw;
      const vh = video.videoHeight || ch;
      const scale = Math.max(cw / vw, ch / vh);
      const ox = (vw * scale - cw) / 2;
      const oy = (vh * scale - ch) / 2;
      return { cw, ch, vw, vh, scale, px: (x) => x * scale - ox, py: (y) => y * scale - oy };
    }

    function drawLandmarks() {
      const M = cover();
      ctx.clearRect(0, 0, M.cw, M.ch);
      ctx.fillStyle = "#D32F2F";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      mpLandmarksRef.current.forEach((lm) =>
        lm.forEach((p) => {
          const x = M.px(p.x * M.vw), y = M.py(p.y * M.vh);
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        })
      );
    }

    function drawBoxes() {
      const M = cover();
      ctx.clearRect(0, 0, M.cw, M.ch);
      ctx.strokeStyle = "#00E5FF";
      ctx.lineWidth = 3;
      yoloDetsRef.current.forEach((d) => {
        ctx.strokeRect(M.px(d.x1), M.py(d.y1), (d.x2 - d.x1) * M.scale, (d.y2 - d.y1) * M.scale);
      });
    }

    function loop(now) {
      if (video.readyState >= 2) {
        if (phaseRef.current === "yolo") drawBoxes();
        else drawLandmarks();
      }
      if (yoloReady && !busy && now - last > 150 && video.videoWidth) {
        busy = true; last = now;
        runYolo(video)
          .then((dets) => {
            yoloDetsRef.current = dets;
            const m = missions[indexRef.current];
            const expected = m && m.gesture;
            if (expected && YOLO_GESTURES.has(expected)) {
              const g = dets.map((d) => YOLO_TO_GESTURE[d.name]).filter(Boolean);
              if (g.length) setStatus("YOLO 인식: " + g.join(", "));
              judge(g);
            }
          })
          .catch(() => {})
          .finally(() => { busy = false; });
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [yoloReady, missions, judge]);

  const mission = missions[index] || missions[0];

  return (
    <>
      <Header back scoreText={`점수: ${score}/${missions.length}`} />

      <main className="game-main">
        <section className="timer-section">
          <div className="timer-display">
            <span className="timer-emoji">⏱️</span>
            <span className="timer-text">남은 시간: {remaining}초</span>
          </div>
          <div className="timer-bar-wrap">
            <div className="timer-bar-fill" style={{ width: (remaining / roundSeconds) * 100 + "%" }} />
          </div>
        </section>

        <section className="mission-box">
          <span className="mission-label">
            이번 동작 {index + 1}/{missions.length} · {yoloReady ? "YOLO ✓" : "YOLO 로딩중"} ·{" "}
            {phase === "yolo" ? "박스" : "랜드마크"}
          </span>
          <div className="mission-content">
            <span className="mission-emoji">{mission.emoji}</span>
            <h2 className="mission-text">미션: {mission.text}</h2>
          </div>
        </section>

        <section className="webcam-section">
          <video className="webcam-video" ref={videoRef} autoPlay playsInline muted />
          <canvas className="landmark-canvas" ref={canvasRef} />
          {!started && (
            <p className="webcam-placeholder">
              📷
              <br />
              카메라 연결 전
            </p>
          )}
        </section>

        <section className="game-actions">
          <button className="game-action-btn correct" onClick={() => markMission(true)}>
            동작했어요
          </button>
          <button className="game-action-btn skip" onClick={() => markMission(false)}>
            건너뛰기
          </button>
        </section>
      </main>

      <footer className="status-bar">
        <div className="status-content">
          <span className="status-label">인식 중:</span>
          <span className="status-waiting">{status}</span>
        </div>
      </footer>
    </>
  );
}
