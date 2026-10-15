import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TicTacToeGame from '@/features/games/tictactoe';
import ChessGame from '@/features/games/chess';
import SudokuGame from '@/features/games/sudoku';
import CarromGame from '@/features/games/carrom';
import { CardTerritorySelect } from '@/features/games/card-territory/CardTerritorySelect';
import { Blackjack } from '@/features/games/card-territory/blackjack/Blackjack';
import { Poker } from '@/features/games/card-territory/poker/Poker';
import { Rummy } from '@/features/games/card-territory/rummy/Rummy';
import { Uno } from '@/features/games/card-territory/uno/Uno';

describe('Game Smoke Tests', () => {
  it('renders Tic Tac Toe board successfully', () => {
    render(
      <BrowserRouter>
        <TicTacToeGame />
      </BrowserRouter>
    );
    expect(screen.getByText('Tic Tac Clash')).toBeInTheDocument();
    expect(screen.getByText('Solo vs AI')).toBeInTheDocument();
  });

  it('renders Chess Royale board successfully', () => {
    render(
      <BrowserRouter>
        <ChessGame />
      </BrowserRouter>
    );
    expect(screen.getByText('Chess Royale')).toBeInTheDocument();
    expect(screen.getByText('New Match')).toBeInTheDocument();
  });

  it('renders Sudoku Clash successfully', () => {
    render(
      <BrowserRouter>
        <SudokuGame />
      </BrowserRouter>
    );
    expect(screen.getByText('Sudoku Clash')).toBeInTheDocument();
    expect(screen.getByText('Erase')).toBeInTheDocument();
  });

  it('renders Carrom Clash board successfully', () => {
    render(
      <BrowserRouter>
        <CarromGame />
      </BrowserRouter>
    );
    expect(screen.getByText('Carrom Clash')).toBeInTheDocument();
    expect(screen.getByText('New Board')).toBeInTheDocument();
  });

  it('renders Card Territory selection screen with all 4 games', () => {
    render(
      <BrowserRouter>
        <CardTerritorySelect />
      </BrowserRouter>
    );
    expect(screen.getByText('Blackjack Vault')).toBeInTheDocument();
    expect(screen.getByText('Poker Arena')).toBeInTheDocument();
    expect(screen.getByText('Rummy Market')).toBeInTheDocument();
    expect(screen.getByText('Uno Zone')).toBeInTheDocument();
  });

  it('renders Blackjack Vault table and chip controls successfully', () => {
    render(
      <BrowserRouter>
        <Blackjack />
      </BrowserRouter>
    );
    expect(screen.getByText('Blackjack Vault')).toBeInTheDocument();
    expect(screen.getByText('Dealer Hand')).toBeInTheDocument();
    expect(screen.getByText('Your Hand')).toBeInTheDocument();
    expect(screen.getByText('Deal ($50)')).toBeInTheDocument();
  });

  it('renders Poker Arena 3-player table successfully', () => {
    render(
      <BrowserRouter>
        <Poker />
      </BrowserRouter>
    );
    expect(screen.getByText('Poker Arena')).toBeInTheDocument();
    expect(screen.getByText('Bot 1')).toBeInTheDocument();
    expect(screen.getByText('Bot 2')).toBeInTheDocument();
    expect(screen.getByText('Your Cards')).toBeInTheDocument();
    expect(screen.getByText('POT:')).toBeInTheDocument();
  });

  it('renders Rummy Market 13-card table successfully', () => {
    render(
      <BrowserRouter>
        <Rummy />
      </BrowserRouter>
    );
    expect(screen.getByText('Rummy Market')).toBeInTheDocument();
    expect(screen.getByText('Pure Sequence')).toBeInTheDocument();
    expect(screen.getByText('2nd Sequence')).toBeInTheDocument();
    expect(screen.getAllByText('Discard').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Declare Show')).toBeInTheDocument();
  });

  it('renders Uno Zone table with 3-player stations and draw pile successfully', () => {
    render(
      <BrowserRouter>
        <Uno />
      </BrowserRouter>
    );
    expect(screen.getByText('Uno Zone')).toBeInTheDocument();
    expect(screen.getByText('Bot 1')).toBeInTheDocument();
    expect(screen.getByText('Bot 2')).toBeInTheDocument();
    expect(screen.getByText('DRAW')).toBeInTheDocument();
    expect(screen.getByText('Draw Card')).toBeInTheDocument();
  });
});

