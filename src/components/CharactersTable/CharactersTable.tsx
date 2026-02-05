import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { FC } from 'react';

// Typowanie zgodnie z conventions.md
export type Character = {
  id: number;
  name: string;
  status: string;
  species: string;
  image: string;
};

const fetchCharacters = async (): Promise<Character[]> => {
  const { data } = await axios.get('https://rickandmortyapi.com/api/character');
  return data.results;
};

const CharactersTable: FC = () => {
  const { data, isLoading, error } = useQuery<Character[]>({
    queryKey: ['characters'],
    queryFn: fetchCharacters,
  });

  if (isLoading) return <div>Ładowanie...</div>;
  if (error) return <div>Błąd ładowania danych</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border mt-4">
        <thead>
          <tr>
            <th className="p-2 border">Avatar</th>
            <th className="p-2 border">Imię</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Gatunek</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((char) => (
            <tr key={char.id}>
              <td className="p-2 border">
                <img src={char.image} alt={char.name} className="w-12 h-12 rounded-full" />
              </td>
              <td className="p-2 border">{char.name}</td>
              <td className="p-2 border">{char.status}</td>
              <td className="p-2 border">{char.species}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CharactersTable;
