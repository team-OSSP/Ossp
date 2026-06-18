import { NavLink, useNavigate } from "react-router-dom";

const Icon = ({ name, size = 24, filled = false, style }) => (
  <span
    className={"material-symbols-outlined" + (filled ? " icon-filled" : "")}
    style={{ fontSize: size, ...style }}
  >
    {name}
  </span>
);

export function Header({ back = false, title = "Hand Spark", scoreText }) {
  const navigate = useNavigate();
  return (
    <header className="page-header">
      <div className="header-left">
        {back ? (
          <button className="icon-btn" onClick={() => navigate(-1)} aria-label="뒤로">
            <Icon name="arrow_back" size={30} />
          </button>
        ) : (
          <Icon name="waving_hand" size={30} />
        )}
        {scoreText ? (
          <span className="score-display">{scoreText}</span>
        ) : (
          <span className="header-title">{title}</span>
        )}
      </div>
      <div className="header-right">
        <button className="icon-btn" aria-label="설정"><Icon name="settings" /></button>
        <button className="icon-btn" aria-label="도움말"><Icon name="help" /></button>
      </div>
    </header>
  );
}

export function BottomNav({ active }) {
  const item = (to, icon, label, key) => (
    <NavLink to={to} className={"nav-item" + (active === key ? " active" : "")}>
      <Icon name={icon} filled={active === key} />
      <span className="nav-label">{label}</span>
    </NavLink>
  );
  return (
    <nav className="bottom-nav">
      {item("/", "home", "홈", "home")}
      {item("/level", "exercise", "레벨 선택", "level")}
      {item("/result", "analytics", "기록", "result")}
    </nav>
  );
}

export { Icon };
