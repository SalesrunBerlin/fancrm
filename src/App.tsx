
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ActionSharingPage from "./pages/ActionSharingPage";
import PublicActionPage from "./pages/PublicActionPage";
import Index from "./pages/Index";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/action/share/:id" element={<ActionSharingPage />} />
        <Route path="/action/public/:token" element={<PublicActionPage />} />
      </Routes>
    </Router>
  );
}

export default App;
