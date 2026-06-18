import { useEffect, useRef } from "react";
import { classifyHand } from "../lib/gestures.js";

/**
 * 웹캠 + MediaPipe Hands 처리. 그리기는 하지 않고,
 * 매 프레임 { gestures, landmarks }를 onResults로 전달한다.
 * (랜드마크/박스 렌더링은 Game 컴포넌트의 렌더 루프에서 담당)
 */
export function useMediaPipeHands({ videoRef, onResults, onStatus }) {
  const onResultsRef = useRef(onResults);
  const onStatusRef = useRef(onStatus);
  useEffect(() => { onResultsRef.current = onResults; }, [onResults]);
  useEffect(() => { onStatusRef.current = onStatus; }, [onStatus]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let stream = null;
    let hands = null;
    let rafId = null;
    let active = true;
    const status = (t) => onStatusRef.current && onStatusRef.current(t);

    function handleResults(results) {
      const landmarks = results.multiHandLandmarks || [];
      const gestures = landmarks.map(classifyHand);
      if (onResultsRef.current) onResultsRef.current({ gestures, landmarks });
    }

    function loop() {
      if (!active || !hands || video.readyState < 2) {
        if (active) rafId = requestAnimationFrame(loop);
        return;
      }
      hands
        .send({ image: video })
        .catch(() => {})
        .finally(() => { if (active) rafId = requestAnimationFrame(loop); });
    }

    function initHands() {
      if (!window.Hands) {
        status("손 인식 라이브러리를 불러오지 못해 수동 진행 모드입니다.");
        return;
      }
      hands = new window.Hands({
        locateFile: (file) => "https://cdn.jsdelivr.net/npm/@mediapipe/hands/" + file,
      });
      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.65,
        minTrackingConfidence: 0.65,
      });
      hands.onResults(handleResults);
      loop();
    }

    async function start() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        status("이 브라우저는 카메라를 지원하지 않아요.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
        video.srcObject = stream;
        await video.play().catch(() => {});
        status("카메라 연결됨. 손 인식 준비 중...");
        initHands();
      } catch (err) {
        const name = err && err.name;
        let msg = "카메라를 시작할 수 없어요. 수동 진행 모드입니다.";
        if (name === "NotAllowedError") msg = "카메라 권한이 거부됨 → 주소창 카메라 아이콘에서 허용 후 새로고침.";
        else if (name === "NotReadableError") msg = "다른 앱이 카메라 사용 중 → 종료 후 새로고침.";
        else if (name === "NotFoundError") msg = "카메라를 찾을 수 없습니다.";
        else if (name === "AbortError") msg = "카메라 요청이 중단됨 → 새로고침해 보세요.";
        else if (name) msg = "카메라 오류(" + name + "). 수동 진행 모드입니다.";
        status(msg);
        console.error("getUserMedia error:", err);
      }
    }

    start();

    return () => {
      active = false;
      if (rafId) cancelAnimationFrame(rafId);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (hands && hands.close) { try { hands.close(); } catch { /* noop */ } }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
