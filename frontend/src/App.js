import { BrowserRouter, Routes, Route } from "react-router-dom";
import Intro           from "./pages/Intro";
import CharacterSelect from "./pages/CharacterSelect";
import Dashboard       from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Intro />} />
        <Route path="/select"    element={<CharacterSelect />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;