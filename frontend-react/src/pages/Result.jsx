import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, BottomNav, Icon } from "../components/Layout.jsx";

function formatElapsed(seconds) {
  const s = Math.max(0, Number(seconds) || 0);
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return m > 0 ? `${m}분 ${rest}초` : `${rest}초`;
}

export default function Result() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);

  useEffect(() => {
    try {
      setResult(JSON.parse(localStorage.getItem("handSparkLastResult")));
    } catch {
      setResult(null);
    }
  }, []);

  const r = result || { total: 0, correct: 0, averageReaction: 0, elapsedSeconds: 0 };
  const total = Number(r.total) || 0;
  const correct = Number(r.correct) || 0;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;

  const vibrate = () => window.navigator.vibrate && window.navigator.vibrate(20);

  return (
    <>
      <Header back />
      <main className="page-main">
        <div className="result-main">
          <section className="congrats-section">
            <div className="emoji-circle">
              <span style={{ fontSize: 64 }}>👍</span>
            </div>
            <h2 className="congrats-title">
              {total ? (
                <>훌륭해요!<br />오늘 최고예요!</>
              ) : (
                <>아직 기록이 없어요.<br />게임을 먼저 해볼까요?</>
              )}
            </h2>
          </section>

          <div className="result-card">
            <div className="score-row">
              <span className="score-label">정답 수</span>
              <span className="score-value">
                {total}문제 중{" "}
                <span style={{ color: "#D32F2F", textDecoration: "underline" }}>
                  {correct}문제
                </span>
              </span>
            </div>

            <div className="stats-list">
              <div className="stat-item">
                <Icon name="task_alt" size={32} />
                <div>
                  <p className="stat-label">정답률</p>
                  <p className="stat-value">{accuracy}%</p>
                </div>
              </div>
              <div className="stat-item">
                <Icon name="timer" size={32} />
                <div>
                  <p className="stat-label">평균 반응속도</p>
                  <p className="stat-value">
                    {r.averageReaction ? Number(r.averageReaction).toFixed(1) + "초" : "-"}
                  </p>
                </div>
              </div>
              <div className="stat-item">
                <Icon name="schedule" size={32} />
                <div>
                  <p className="stat-label">소요 시간</p>
                  <p className="stat-value">{formatElapsed(r.elapsedSeconds)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="result-actions">
            <button className="btn-retry" onClick={() => { vibrate(); navigate("/game"); }}>
              <Icon name="refresh" size={32} />
              다시 하기
            </button>
            <button className="btn-home" onClick={() => { vibrate(); navigate("/"); }}>
              <Icon name="home" size={32} />
              홈으로
            </button>
          </div>
        </div>
      </main>
      <BottomNav active="result" />
    </>
  );
}
