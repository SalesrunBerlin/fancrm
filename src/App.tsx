
import React from "react";
import ActionSharingPage from "./pages/ActionSharingPage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/actions/share/:actionId" element={<ActionSharingPage />} />
        {/* Add other routes as needed */}
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </Router>
  );
};

export default App;
