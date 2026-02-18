
export interface Asset {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  history: PricePoint[];
}

export interface PricePoint {
  time: string;
  price: number;
}

export interface Trade {
  id: string;
  assetId: string;
  amount: number;
  direction: 'UP' | 'DOWN';
  entryPrice: number;
  exitPrice?: number;
  timestamp: number;
  duration: number; // in seconds
  status: 'OPEN' | 'WIN' | 'LOSS';
  payout: number;
}

export interface User {
  balance: number;
  trades: Trade[];
  username: string;
}

export interface AppState {
  user: User;
  currentAsset: Asset;
  assets: Asset[];
  isAdmin: boolean;
  adminControls: {
    manipulationMode: 'NONE' | 'ALWAYS_WIN' | 'ALWAYS_LOSS';
    houseEdge: number;
  };
}
