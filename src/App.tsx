import * as React from 'react';
import type { FC } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CharactersPage from './pages/CharactersPage';

const queryClient = new QueryClient();

const App: FC = () => (
  <QueryClientProvider client={queryClient}>
    <CharactersPage />
  </QueryClientProvider>
);

export default App;
