// 레벨별 미션 세트 (원본 game.html의 missionSets 이식)
export const missionSets = {
  1: [
    { emoji: "👊", text: "주먹 만들기", gesture: "fist" },
    { emoji: "🖐️", text: "손바닥 펴기", gesture: "open_palm" },
    { emoji: "👍", text: "엄지척 만들기", gesture: "thumbs_up" },
    { emoji: "👌", text: "OK 모양 만들기", gesture: "ok" },
    { emoji: "✌️", text: "브이 만들기", gesture: "peace" },
  ],
  2: [
    { emoji: "🤙", text: "전화 모양 만들기", gesture: "call" },
    { emoji: "🤟", text: "락사인 만들기", gesture: "rock" },
    { emoji: "👉", text: "손가락 총 만들기", gesture: "point" },
    { emoji: "☝️", text: "검지 들기", gesture: "point" },
    { emoji: "🫰", text: "손하트 만들기", gesture: "finger_heart" },
  ],
  3: [
    { emoji: "🙌", text: "양손 들어 올리기", gesture: "two_hands" },
    { emoji: "👊🖐️", text: "주먹 + 손바닥", gesture: "fist_open" },
    { emoji: "👍✌️", text: "엄지척 + 브이", gesture: "thumbs_peace" },
    { emoji: "👌☝️", text: "OK + 검지 들기", gesture: "ok_point" },
    { emoji: "🫶", text: "양손 하트 만들기", gesture: "two_hands" },
  ],
};

// 레벨 선택 화면 메타데이터
export const levelMeta = [
  {
    id: 1, emoji: "👊", name: "한 손 기초", stars: 1,
    desc: "한 손으로 간단한 손 모양 만들기",
    examples: "주먹, 손바닥, 엄지척, OK",
  },
  {
    id: 2, emoji: "🤙", name: "한 손 심화", stars: 2,
    desc: "조금 더 어려운 손 모양에 도전!",
    examples: "락사인, 총모양, 새끼손가락",
  },
  {
    id: 3, emoji: "🙌", name: "양손 조합", stars: 3,
    desc: "양손으로 서로 다른 모양 만들기",
    examples: "왼손 주먹 + 오른손 손바닥",
  },
];
