import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Intro           from "./pages/Intro";
import CharacterSelect from "./pages/CharacterSelect";
import Login           from "./pages/Login";
import Register        from "./pages/Register";
import Dashboard       from "./pages/Dashboard";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("friday_token");
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Intro />} />
        <Route path="/select"    element={<CharacterSelect />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/register"  element={<Register />} />
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
// Main app component with routing and private route for dashboard
export default App;