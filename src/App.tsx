import React from 'react';
import { AppProvider } from './context/AppContext';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <AppProvider>
      <AdminPanel />
    </AppProvider>
  );
}

export default App;