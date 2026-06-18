import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, BottomNav, Icon } from "../components/Layout.jsx";

export default function Home() {
  const navigate = useNavigate();
  const [today, setToday] = useState("날짜 로딩 중...");

  useEffect(() => {
    const now = new Date();
    const options = { year: "numeric", month: "long", day: "numeric", weekday: "long" };
    setToday(now.toLocaleDateString("ko-KR", options));
  }, []);

  return (
    <>
      <Header />
      <main className="page-main">
        <div className="home-main">
          <div className="logo-section">
            <h1 className="app-title">Hand Spark</h1>
            <p className="app-subtitle">손 모양을 따라해서 인지 건강을 지켜봐요.</p>
          </div>

          <div className="hero-box" />

          <div className="action-buttons">
            <button className="btn-red" onClick={() => navigate("/level")}>
              <Icon name="play_circle" size={36} filled />
              게임 시작
            </button>
            <button className="btn-outline" onClick={() => navigate("/result")}>
              <Icon name="analytics" size={36} />
              내 기록 보기
            </button>
          </div>

          <div className="date-card">
            <p className="date-text">{today}</p>
            <p className="daily-message">오늘도 뇌를 깨워봐요!</p>
          </div>
        </div>
      </main>
      <BottomNav active="home" />
    </>
  );
}
