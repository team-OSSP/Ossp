import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Level from "./pages/Level.jsx";
import Game from "./pages/Game.jsx";
import Result from "./pages/Result.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/level" element={<Level />} />
      <Route path="/game" element={<Game />} />
      <Route path="/result" element={<Result />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
