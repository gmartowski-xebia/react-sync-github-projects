import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CharactersTable from './CharactersTable';

const queryClient = new QueryClient();

describe('CharactersTable', () => {
  it('renderuje nagłówki tabeli', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CharactersTable />
      </QueryClientProvider>
    );
    await waitFor(() => {
      expect(screen.getByText(/Avatar/i)).toBeInTheDocument();
      expect(screen.getByText(/Imię/i)).toBeInTheDocument();
      expect(screen.getByText(/Status/i)).toBeInTheDocument();
      expect(screen.getByText(/Gatunek/i)).toBeInTheDocument();
    });
  });
});
