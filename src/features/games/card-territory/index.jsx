import { Routes, Route } from 'react-router-dom';
import { CardTerritorySelect } from './CardTerritorySelect';
import { Blackjack } from './blackjack/Blackjack';
import { Poker } from './poker/Poker';
import { Rummy } from './rummy/Rummy';
import { Uno } from './uno/Uno';

export default function CardTerritoryParent() {
  return (
    <Routes>
      <Route index element={<CardTerritorySelect />} />
      <Route path="blackjack" element={<Blackjack />} />
      <Route path="poker" element={<Poker />} />
      <Route path="rummy" element={<Rummy />} />
      <Route path="uno" element={<Uno />} />
    </Routes>
  );
}
