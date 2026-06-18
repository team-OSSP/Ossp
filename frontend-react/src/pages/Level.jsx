import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, BottomNav, Icon } from "../components/Layout.jsx";
import { levelMeta } from "../data/missions.js";

export default function Level() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(
    Number(localStorage.getItem("handSparkLevel")) || 2
  );

  const select = (id) => {
    setSelected(id);
    localStorage.setItem("handSparkLevel", String(id));
  };

  const start = () => {
    localStorage.setItem("handSparkLevel", String(selected));
    navigate("/game?level=" + selected);
  };

  return (
    <>
      <Header back />
      <main className="page-main">
        <section className="level-header-section">
          <h2>단계를 선택하세요</h2>
        </section>

        <div className="level-grid">
          {levelMeta.map((lv) => (
            <button
              key={lv.id}
              className={"level-card" + (selected === lv.id ? " selected" : "")}
              onClick={() => select(lv.id)}
            >
              <div className="level-emoji-box">{lv.emoji}</div>
              <div className="level-top-row">
                <span className="level-number">Lv.{lv.id}</span>
                <div className="level-stars">
                  {[1, 2, 3].map((s) => (
                    <span
                      key={s}
                      className={"material-symbols-outlined " + (s <= lv.stars ? "star-on" : "star-off")}
                    >
                      star
                    </span>
                  ))}
                </div>
              </div>
              <h3 className="level-name">{lv.name}</h3>
              <p className="level-desc">{lv.desc}</p>
              <div className="level-examples">
                <p className="example-title">연습 예시:</p>
                <p className="example-list">{lv.examples}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="start-section">
          <button className="btn-start" onClick={start}>
            시작하기
            <Icon name="play_circle" size={36} />
          </button>
        </div>
      </main>
      <BottomNav active="level" />
    </>
  );
}
