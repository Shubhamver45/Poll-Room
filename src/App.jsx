import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CreatePoll from './pages/CreatePoll';
import ViewPoll from './pages/ViewPoll';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      {/* Background is controlled by index.css body color */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreatePoll />} />
        <Route path="/poll/:shareId" element={<ViewPoll />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
