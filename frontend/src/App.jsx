import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Visualizations from "./pages/Visualizations";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/visualizations" element={<Visualizations />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;