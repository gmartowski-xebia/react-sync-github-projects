import * as React from 'react';
import type { FC } from 'react';
import CharactersTable from '../components/CharactersTable/CharactersTable';

const CharactersPage: FC = () => (
  <div className="container mx-auto p-4">
    <h1 className="text-2xl font-bold mb-4">Rick & Morty</h1>
    <CharactersTable />
  </div>
);

export default CharactersPage;
