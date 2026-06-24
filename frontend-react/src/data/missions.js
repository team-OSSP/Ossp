const gestureInfo = {
  palm:   { emoji: "🖐️", text: "손바닥 펴기",      gesture: "open_palm"  },
  fist:   { emoji: "👊",  text: "주먹 만들기",       gesture: "fist"       },
  like:   { emoji: "👍",  text: "엄지척 만들기",     gesture: "thumbs_up"  },
  three:  { emoji: "3️⃣",  text: "검지, 중지, 약지를 펼쳐서 숫자 3을 만드세요.", gesture: "three" },
  ok:     { emoji: "👌",  text: "OK 모양 만들기",    gesture: "ok"         },
  rock:   { emoji: "🤟",  text: "락사인 만들기",     gesture: "rock"       },
  three2: { emoji: "3️⃣",  text: "엄지, 검지, 중지를 펼쳐서 숫자 3을 만드세요.", gesture: "three2" },
  call:   { emoji: "🤙",  text: "전화 모양 만들기",  gesture: "call"       },
};

const comboInfo = {
  palm_fist:   { emoji: "🖐️👊", text: "손바닥 + 주먹",         gesture: "palm_fist"   },
  ok_palm:     { emoji: "👌🖐️", text: "OK + 손바닥",            gesture: "ok_palm"     },
  like_call:   { emoji: "👍🤙", text: "엄지척 + 전화",          gesture: "like_call"   },
  three2_like: { emoji: "✌️👍", text: "세 손가락(2) + 엄지척",  gesture: "three2_like" },
  three_rock:  { emoji: "3️⃣🤟", text: "세 손가락(1) + 락사인",  gesture: "three_rock"  },
  call_ok:     { emoji: "🤙👌", text: "전화 + OK",              gesture: "call_ok"     },
  rock_fist:   { emoji: "🤟👊", text: "락사인 + 주먹",          gesture: "rock_fist"   },
};

const POOLS = {
  1: ["palm", "three", "like", "fist"],
  2: ["ok", "rock", "three2", "call"],
  3: ["palm_fist", "ok_palm", "like_call", "three_rock", "call_ok", "rock_fist"],
};

function pick(pool, n) {
  return Array.from({ length: n }, () => pool[Math.floor(Math.random() * pool.length)]);
}

export function generateMissions(level) {
  const pool = POOLS[level] || POOLS[1];
  return pick(pool, 5).map((key) => gestureInfo[key] ?? comboInfo[key]);
}

export const levelMeta = [
  {
    id: 1, emoji: "👊", name: "한 손 기초", stars: 1,
    desc: "한 손으로 간단한 손 모양 만들기",
    examples: "주먹, 손바닥, 엄지척",
  },
  {
    id: 2, emoji: "🤙", name: "한 손 심화", stars: 2,
    desc: "조금 더 어려운 손 모양에 도전!",
    examples: "OK, 락사인, 전화",
  },
  {
    id: 3, emoji: "🙌", name: "양손 조합", stars: 3,
    desc: "양손으로 서로 다른 모양 만들기",
    examples: "손바닥 + 주먹, OK + 손바닥",
  },
];
