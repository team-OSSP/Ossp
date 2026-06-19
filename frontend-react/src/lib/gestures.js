// 규칙 기반 손 제스처 분류 로직 (원본 game.html에서 그대로 이식)
// MediaPipe Hands가 반환하는 21개 랜드마크(points[i].{x,y})를 입력으로 받는다.

export function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function isFingerExtended(points, tipIndex, pipIndex) {
  return points[tipIndex].y < points[pipIndex].y - 0.025;
}

export function isThumbOpen(points) {
  return distance(points[4], points[9]) > distance(points[3], points[9]) * 1.25;
}

export function classifyHand(points) {
  const index = isFingerExtended(points, 8, 6);
  const middle = isFingerExtended(points, 12, 10);
  const ring = isFingerExtended(points, 16, 14);
  const pinky = isFingerExtended(points, 20, 18);
  const thumb = isThumbOpen(points);
  const extendedCount = [index, middle, ring, pinky].filter(Boolean).length;
  const thumbIndexDistance = distance(points[4], points[8]);
  const palmSize = distance(points[0], points[9]) || 0.1;

  if (!thumb && extendedCount === 0) return "fist";
  if (thumb && !index && !middle && !ring && !pinky) return "thumbs_up";
  if (extendedCount === 4) return "open_palm";
  if (thumbIndexDistance < palmSize * 0.45 && middle && ring && pinky) return "ok";
  if (index && middle && !ring && !pinky) return "peace";
  if (thumb && pinky && !index && !middle && !ring) return "call";
  if (index && pinky && !middle && !ring) return "rock";
  if (index && !middle && !ring && !pinky) return "point";
  if (thumbIndexDistance < palmSize * 0.5 && index) return "finger_heart";
  return "unknown";
}

export function isExpectedGesture(expected, gestures) {
  if (expected === "palm_fist")   return gestures.includes("open_palm") && gestures.includes("fist");
  if (expected === "ok_palm")     return gestures.includes("ok")        && gestures.includes("open_palm");
  if (expected === "like_call")   return gestures.includes("thumbs_up") && gestures.includes("call");
  if (expected === "three2_like") return gestures.includes("three2")    && gestures.includes("thumbs_up");
  if (expected === "three_rock")  return gestures.includes("three")     && gestures.includes("rock");
  if (expected === "call_ok")     return gestures.includes("call")      && gestures.includes("ok");
  if (expected === "rock_fist")   return gestures.includes("rock")      && gestures.includes("fist");
  return gestures.includes(expected);
}
