import { BrowserRouter, Routes, Route } from "react-router-dom";
import TopBar from "./components/TopBar";
import Home from "./pages/Home";
import Detail from "./pages/Detail";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <TopBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/work/:slug" element={<Detail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
