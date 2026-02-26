import { useState, useEffect } from "react";
import { PokeAPI } from "./api";

interface PokemonCardProps {
  id: number;
  image: string;
  name: string;
  types: string[];
  height?: number;
  weight?: number;
  onClick?: () => void;
  className?: string;
}

export const Card: React.FC<PokemonCardProps> = (props) => {
  const [rot, setRot] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    const rotationY = (dx / rect.width) * 30;
    const rotationX = (-dy / rect.height) * 30;
    setRot({ x: rotationX, y: rotationY });
  };

  const handleMouseLeave = () => {
    setRot({ x: 0, y: 0 });
  };

  // derive values for display
  const hp = 50 + (props.id % 100);
  const power = 20 + (props.id % 80);
  const rarityLevel = (props.id % 5) + 1;
  const raritySymbol = "★".repeat(rarityLevel);

  return (
    <div
      className={`relative w-full h-80 card-3d cursor-pointer ${props.className ?? ""}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
      }}
      onClick={props.onClick}
    >
      {/* holo overlay */}
      <div className="absolute inset-0 rounded-2xl holo-effect pointer-events-none"></div>

      <div className="absolute inset-0 rounded-2xl border-4 border-yellow-400 bg-gradient-to-br from-white/80 to-white/60 shadow-2xl overflow-hidden">
        {/* header band */}
        <div className="flex justify-between items-center px-3 py-1">
          <div className="type-icon w-6 h-6 rounded-full flex items-center justify-center bg-white/70">
            <span className="text-xs font-bold">{props.types[0]?.[0].toUpperCase() || "?"}</span>
          </div>
          <h4 className="text-lg font-extrabold text-gray-900 uppercase tracking-wider drop-shadow relative">
            {props.name}
            <span className="absolute -top-2 -right-0 text-xs text-gray-500">{raritySymbol}</span>
          </h4>
          <div className="hp-box text-xs font-bold text-red-600">
            {hp} HP
          </div>
        </div>

        <div className="flex-grow flex flex-col items-center justify-center px-2">
          <img
            src={props.image}
            alt={props.name}
            className="max-w-full max-h-full object-contain"
          />
          <div className="mt-2 flex space-x-2 text-xs text-gray-600">
            {props.height !== undefined && (
              <div className="flex items-center space-x-1">
                <span>📏</span>
                <span>{(props.height / 10).toFixed(1)} m</span>
              </div>
            )}
            {props.weight !== undefined && (
              <div className="flex items-center space-x-1">
                <span>⚖️</span>
                <span>{(props.weight / 10).toFixed(1)} kg</span>
              </div>
            )}
          </div>
        </div>

        <footer className="flex justify-between items-center px-3 py-1 text-xs">
          <div className="flex gap-1 items-center">
            <span className="font-black text-yellow-500 text-sm">{raritySymbol}</span>
            {props.types.map((type) => (
              <span
                key={type}
                className={`font-bold px-2 py-0.5 rounded-full capitalize ${getTypeColor(type)}`}
              >
                {type}
              </span>
            ))}
          </div>
          <div className="rarity-number text-gray-600 flex items-center gap-1">
            <span className="font-semibold">Atk</span>
            <span className="font-bold text-red-600">{power}</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

interface Pokemon {
  id: number;
  image: string;
  name: string;
  types: string[];
  height: number;
  weight: number;
}

async function fetchPokemonData(): Promise<Pokemon[]> {
  const list = await PokeAPI.listPokemons(0, 200);
  const pokemons = await Promise.all(
    list.results.map(async (item: { name: string; url: string }) => {
      const pokemon = await PokeAPI.getPokemonByName(item.name);
      return {
        id: pokemon.id,
        image: pokemon.sprites.other?.["official-artwork"].front_default ?? pokemon.sprites.front_default ?? "",
        name: pokemon.name,
        types: pokemon.types.map((type: { type: { name: string } }) => type.type.name),
        height: pokemon.height,
        weight: pokemon.weight,
      };
    }),
  );

  return pokemons;
}

export function Root() {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Pokemon | null>(null);
  const [comparison, setComparison] = useState<Pokemon[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [battleMode, setBattleMode] = useState(false);
  const [player1Name, setPlayer1Name] = useState("");
  const [player2Name, setPlayer2Name] = useState("");
  const [player1Points, setPlayer1Points] = useState(0);
  const [player2Points, setPlayer2Points] = useState(0);
  const [player1Filter, setPlayer1Filter] = useState("");
  const [player2Filter, setPlayer2Filter] = useState("");
  const [player1Card, setPlayer1Card] = useState<Pokemon | null>(null);
  const [player2Card, setPlayer2Card] = useState<Pokemon | null>(null);
  const [battleResult, setBattleResult] = useState<{winner: string; p1Stat: number; p2Stat: number; statName: string; winnerIsPlayer1: boolean | null} | null>(null);

  useEffect(() => {
    fetchPokemonData().then((data) => {
      setPokemon(data);
      setLoading(false);
    });
  }, []);

  const toggleComparison = (poke: Pokemon) => {
    if (comparison.find(p => p.id === poke.id)) {
      setComparison(comparison.filter(p => p.id !== poke.id));
    } else if (comparison.length < 4) {
      setComparison([...comparison, poke]);
    }
  };

  const filteredPokemon = pokemon
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "height-asc":
          return a.height - b.height;
        case "height-desc":
          return b.height - a.height;
        case "weight-asc":
          return a.weight - b.weight;
        case "weight-desc":
          return b.weight - a.weight;
        case "power-asc":
          return (20 + (a.id % 80)) - (20 + (b.id % 80));
        case "power-desc":
          return (20 + (b.id % 80)) - (20 + (a.id % 80));
        case "hp-asc":
          return (50 + (a.id % 100)) - (50 + (b.id % 100));
        case "hp-desc":
          return (50 + (b.id % 100)) - (50 + (a.id % 100));
        default:
          return 0;
      }
    });

  const simulateBattle = (p1: Pokemon, p2: Pokemon) => {
    // Apply nerfs if player has won 3+ times
    const p1Nerf = player1Points >= 3 ? 0.85 : 1;
    const p2Nerf = player2Points >= 3 ? 0.85 : 1;
    
    const stats = [
      {name: "HP", p1Val: Math.floor((50 + (p1.id % 100)) * p1Nerf), p2Val: Math.floor((50 + (p2.id % 100)) * p2Nerf)},
      {name: "Attacco", p1Val: Math.floor((20 + (p1.id % 80)) * p1Nerf), p2Val: Math.floor((20 + (p2.id % 80)) * p2Nerf)},
      {name: "Difesa", p1Val: Math.floor((30 + (p1.id % 60)) * p1Nerf), p2Val: Math.floor((30 + (p2.id % 60)) * p2Nerf)},
      {name: "Velocità", p1Val: Math.floor((15 + (p1.id % 70)) * p1Nerf), p2Val: Math.floor((15 + (p2.id % 70)) * p2Nerf)},
    ];
    
    let p1Score = 0;
    let p2Score = 0;
    let decidingStat = stats[0];
    
    for (const stat of stats) {
      if (stat.p1Val > stat.p2Val) p1Score++;
      if (stat.p2Val > stat.p1Val) p2Score++;
      if (stat.p1Val !== stat.p2Val) decidingStat = stat;
    }
    
    let winnerIsPlayer1 = p1Score > p2Score ? true : p2Score > p1Score ? false : null;
    let winner = p1Score > p2Score ? `${player1Name} Vince!` : p2Score > p1Score ? `${player2Name} Vince!` : "Pareggio!";
    
    if (winnerIsPlayer1 === true) setPlayer1Points(player1Points + 1);
    if (winnerIsPlayer1 === false) setPlayer2Points(player2Points + 1);
    
    setBattleResult({
      winner,
      p1Stat: decidingStat.p1Val,
      p2Stat: decidingStat.p2Val,
      statName: decidingStat.name,
      winnerIsPlayer1
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Caricamento Pokémon...</p>
        </div>
      </div>
    );
  }

  if (battleMode) {
    if (!player1Name || !player2Name) {
      return (
        <div className="min-h-screen bg-black p-8">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => {setBattleMode(false);}}
              className="mb-8 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white font-bold rounded-lg transition-colors"
            >
              ← Torna alla Collezione
            </button>

            <h1 className="text-5xl font-black bg-gradient-to-r from-red-600 via-yellow-600 to-orange-600 bg-clip-text text-transparent text-center mb-12">⚔️ Battaglia Pokémon ⚔️</h1>

            <div className="bg-gray-900 rounded-2xl p-12 border-4 border-yellow-500">
              <h2 className="text-3xl font-bold text-white text-center mb-8">Inserisci i Nomi dei Giocatori</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-blue-300 font-bold mb-2">🔵 Giocatore 1:</label>
                  <input
                    type="text"
                    value={player1Name}
                    onChange={(e) => setPlayer1Name(e.target.value)}
                    placeholder="Nome Giocatore 1"
                    maxLength={40}
                    autoComplete="name"
                    spellCheck={false}
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 border-2 border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-red-300 font-bold mb-2">🔴 Giocatore 2:</label>
                  <input
                    type="text"
                    value={player2Name}
                    onChange={(e) => setPlayer2Name(e.target.value)}
                    placeholder="Nome Giocatore 2"
                    maxLength={40}
                    autoComplete="name"
                    spellCheck={false}
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 border-2 border-red-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={() => {}}
                  disabled={!player1Name || !player2Name}
                  className="w-full px-6 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 text-black font-black text-lg rounded-lg transition-colors"
                >
                  ⚡ INIZIA BATTAGLIA! ⚡
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-black p-8">
            <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <button
                onClick={() => {setBattleMode(false); setPlayer1Name(""); setPlayer2Name(""); setPlayer1Points(0); setPlayer2Points(0); setPlayer1Card(null); setPlayer2Card(null); setBattleResult(null);}}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white font-bold rounded-lg transition-colors"
              >
                ← Torna alla Collezione
              </button>
              
              <div className="flex gap-8">
                <div className="text-center">
                  <p className="text-blue-300 font-bold text-lg">{player1Name}</p>
                  <p className="text-4xl font-black text-blue-400">{player1Points}</p>
                </div>
                <div className="text-2xl font-black text-gray-400">VS</div>
                <div className="text-center">
                  <p className="text-red-300 font-bold text-lg">{player2Name}</p>
                  <p className="text-4xl font-black text-red-400">{player2Points}</p>
                </div>
              </div>
            </div>

            <h1 className="text-5xl font-black bg-gradient-to-r from-red-600 via-yellow-600 to-orange-600 bg-clip-text text-transparent text-center mb-12">⚔️ Battaglia Pokémon ⚔️</h1>

          {!battleResult ? (
            <div>
              <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-900 rounded-xl p-6 border-4 border-blue-500">
              <h2 className="text-2xl font-bold text-white mb-4">🔵 {player1Name}</h2>
                  {!player1Card ? (
                    <div>
                      <input
                        type="text"
                        placeholder="Cerca Pokémon..."
                        value={player1Filter}
                        onChange={(e) => setPlayer1Filter(e.target.value)}
                        className="w-full mb-3 px-3 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 border-2 border-gray-700 focus:outline-none"
                      />
                      <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                      {pokemon.filter(p => p.name.toLowerCase().includes(player1Filter.toLowerCase())).map(p => (
                        <div
                          key={p.id}
                          onClick={() => setPlayer1Card(p)}
                          className="cursor-pointer p-3 bg-gray-800 rounded-lg hover:bg-blue-700 transition-colors text-white text-center"
                        >
                          <img src={p.image} alt={p.name} className="w-full h-20 object-contain mb-2" />
                          <p className="font-bold capitalize text-sm">{p.name}</p>
                        </div>
                      ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <img src={player1Card.image} alt={player1Card.name} className="w-32 h-32 object-contain mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white capitalize mb-2">{player1Card.name}</h3>
                      <p className="text-gray-300">HP: {50 + (player1Card.id % 100)}</p>
                      <button
                        onClick={() => setPlayer1Card(null)}
                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition-colors"
                      >
                        Cambia Pokémon
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-gray-900 rounded-xl p-6 border-4 border-red-500">
                  <h2 className="text-2xl font-bold text-white mb-4">🔴 {player2Name}</h2>
                  {!player2Card ? (
                    <div>
                      <input
                        type="text"
                        placeholder="Cerca Pokémon..."
                        value={player2Filter}
                        onChange={(e) => setPlayer2Filter(e.target.value)}
                        className="w-full mb-3 px-3 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 border-2 border-gray-700 focus:outline-none"
                      />
                      <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                      {pokemon.filter(p => p.name.toLowerCase().includes(player2Filter.toLowerCase())).map(p => (
                        <div
                          key={p.id}
                          onClick={() => setPlayer2Card(p)}
                          className="cursor-pointer p-3 bg-gray-800 rounded-lg hover:bg-red-700 transition-colors text-white text-center"
                        >
                          <img src={p.image} alt={p.name} className="w-full h-20 object-contain mb-2" />
                          <p className="font-bold capitalize text-sm">{p.name}</p>
                        </div>
                      ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <img src={player2Card.image} alt={player2Card.name} className="w-32 h-32 object-contain mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white capitalize mb-2">{player2Card.name}</h3>
                      <p className="text-gray-300">HP: {50 + (player2Card.id % 100)}</p>
                      <button
                        onClick={() => setPlayer2Card(null)}
                        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition-colors"
                      >
                        Cambia Pokémon
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {player1Card && player2Card && (
                <div className="text-center">
                  <button
                    onClick={() => simulateBattle(player1Card, player2Card)}
                    className="px-8 py-4 bg-yellow-500 hover:bg-yellow-600 text-black font-black text-lg rounded-lg transition-colors"
                  >
                    ⚡ INIZIA BATTAGLIA! ⚡
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl p-8 border-4 border-yellow-500 text-center">
              <h2 className={`text-4xl font-black mb-8 ${battleResult.winner.includes("Pareggio") ? "text-yellow-400" : battleResult.winnerIsPlayer1 ? "text-blue-400" : "text-red-400"}`}>
                {battleResult.winner}
              </h2>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <img src={player1Card!.image} alt={player1Card!.name} className="w-40 h-40 object-contain mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white capitalize mb-4">{player1Card!.name}</h3>
                  <div className="text-lg text-blue-300"><strong>{battleResult.statName}:</strong> {battleResult.p1Stat}</div>
                </div>

                <div>
                  <img src={player2Card!.image} alt={player2Card!.name} className="w-40 h-40 object-contain mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white capitalize mb-4">{player2Card!.name}</h3>
                  <div className="text-lg text-red-300"><strong>{battleResult.statName}:</strong> {battleResult.p2Stat}</div>
                </div>
              </div>

              <button
                onClick={() => {setPlayer1Card(null); setPlayer2Card(null); setBattleResult(null);}}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
              >
                Un'altra Battaglia
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Pokémon
            </h1>
            <p className="text-center text-gray-300 mt-2">Clicca su una carta per vedere i dettagli completi</p>
          </div>
          <div className="flex gap-4">
            {comparison.length > 0 && (
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-colors"
                onClick={() => setShowComparison(true)}
              >
                Confronta ({comparison.length}/4)
              </button>
            )}
            <button
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-colors"
              onClick={() => setBattleMode(true)}
            >
              ⚔️ Battaglia
            </button>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <input
            type="text"
            placeholder="Cerca per nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 border-2 border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 rounded-lg bg-gray-800 text-white border-2 border-gray-700 focus:border-blue-500 focus:outline-none transition-colors cursor-pointer"
          >
            <optgroup label="Nome">
              <option value="name-asc">Nome (A-Z)</option>
              <option value="name-desc">Nome (Z-A)</option>
            </optgroup>
            <optgroup label="Altezza">
              <option value="height-asc">Altezza (Basso-Alto)</option>
              <option value="height-desc">Altezza (Alto-Basso)</option>
            </optgroup>
            <optgroup label="Peso">
              <option value="weight-asc">Peso (Leggero-Pesante)</option>
              <option value="weight-desc">Peso (Pesante-Leggero)</option>
            </optgroup>
            <optgroup label="Attacco">
              <option value="power-asc">Attacco (Debole-Forte)</option>
              <option value="power-desc">Attacco (Forte-Debole)</option>
            </optgroup>
            <optgroup label="HP">
              <option value="hp-asc">HP (Basso-Alto)</option>
              <option value="hp-desc">HP (Alto-Basso)</option>
            </optgroup>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {filteredPokemon.map((p) => (
            <Card
              key={p.id}
              id={p.id}
              image={p.image}
              name={p.name}
              types={p.types}
              height={p.height}
              weight={p.weight}
              onClick={() => setSelected(p)}
            />
          ))}
        </div>

        {selected && (
          <div
            className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-50 overlay-fade p-4"
            onClick={() => setSelected(null)}
          >
            {/* header bar with buttons - always accessible */}
            <div className="w-full max-w-screen-lg mb-4 bg-gray-900/95 rounded-xl p-4 flex gap-3 items-center justify-between" onClick={(e) => e.stopPropagation()}>
              <div className="flex-1 border-2 border-gray-700 rounded-lg p-3 bg-black/50 min-w-0">
                <p className="text-gray-400 text-xs mb-1">Carta Selezionata:</p>
                <div className="flex gap-3 items-center">
                  <img
                    src={selected.image}
                    alt={selected.name}
                    className="w-12 h-12 object-contain flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-white font-bold capitalize text-sm truncate">{selected.name}</p>
                    <p className="text-gray-400 text-xs">HP: {50 + (selected.id % 100)}</p>
                  </div>
                </div>
              </div>
              <button
                className={comparison.find(p => p.id === selected.id) ? "px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap flex-shrink-0 bg-red-600 hover:bg-red-700 text-white" : "px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white"}
                onClick={(e) => {
                  e.stopPropagation();
                  const isAlreadySelected = comparison.find(p => p.id === selected.id);
                  toggleComparison(selected);
                  if (!isAlreadySelected && comparison.length < 4) {
                    setSelected(null);
                    setShowComparison(false);
                  }
                }}
              >
                {comparison.find(p => p.id === selected.id) ? "Rimuovi" : "Confronta"}
              </button>
              <button
                className="px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap flex-shrink-0 bg-gray-700 hover:bg-gray-800 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(null);
                }}
              >
                Seleziona altro
              </button>
            </div>

            {/* card */}
            <div className="relative w-96 h-[32rem]" onClick={(e) => e.stopPropagation()}>
              <button
                className="absolute top-4 right-4 text-white text-xl font-bold hover:text-gray-300 transition-colors z-10"
                onClick={() => setSelected(null)}
              >
                ×
              </button>
              <Card
                id={selected.id}
                image={selected.image}
                name={selected.name}
                types={selected.types}
                height={selected.height}
                weight={selected.weight}
                className="modal-card"
              />
            </div>
          </div>
        )}

        {comparison.length > 0 && showComparison && (
          <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-40 p-4">
            <div className="bg-gray-900 rounded-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-black text-white">Confronto Pokémon</h2>
                <button
                  className="text-white text-2xl font-bold hover:text-gray-300"
                  onClick={() => setShowComparison(false)}
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {comparison.map((p) => (
                  <div key={p.id} className="bg-black/50 rounded-xl p-4">
                    <h3 className="text-lg font-bold text-white mb-2 capitalize">{p.name}</h3>
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-32 object-contain mb-3"
                    />
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex justify-between">
                        <span>HP:</span>
                        <span className="font-bold text-red-400">{50 + (p.id % 100)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Atk:</span>
                        <span className="font-bold text-orange-400">{20 + (p.id % 80)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Altezza:</span>
                        <span className="font-bold">{(p.height / 10).toFixed(1)} m</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Peso:</span>
                        <span className="font-bold">{(p.weight / 10).toFixed(1)} kg</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.types.map((type) => (
                          <span
                            key={type}
                            className={`text-xs px-2 py-1 rounded-full font-bold capitalize ${getTypeColor(type)}`}
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white font-bold py-1 rounded transition-colors"
                      onClick={() => setComparison(comparison.filter(x => x.id !== p.id))}
                    >
                      Rimuovi
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getTypeColor(type: string): string {
  return typeColors[type] || "bg-gray-400";
}

function getTypeBgColor(type: string): string {
  const map: { [key: string]: string } = {
    fire: "#FECACA",
    water: "#BFDBFE",
    grass: "#BBF7D0",
    electric: "#FEF9C3",
    psychic: "#FBCFE8",
    ice: "#CFFAFE",
    dragon: "#E9D5FF",
    dark: "#D1D5DB",
    fairy: "#FCE7F3",
    normal: "#E5E7EB",
    fighting: "#FCA5A5",
    flying: "#C7D2FE",
    poison: "#E9D5FF",
    ground: "#FDE68A",
    rock: "#FBBF24",
    bug: "#BBF7D0",
    ghost: "#D8B4FE",
    steel: "#E5E7EB",
  };
  return map[type] || "#E5E7EB";
}

const typeColors: { [key: string]: string } = {
  fire: "bg-red-500",
  water: "bg-blue-500",
  grass: "bg-green-500",
  electric: "bg-yellow-400",
  psychic: "bg-pink-500",
  ice: "bg-cyan-400",
  dragon: "bg-purple-700",
  dark: "bg-gray-700",
  fairy: "bg-pink-300",
  normal: "bg-gray-400",
  fighting: "bg-red-700",
  flying: "bg-indigo-400",
  poison: "bg-purple-500",
  ground: "bg-yellow-600",
  rock: "bg-yellow-800",
  bug: "bg-green-700",
  ghost: "bg-indigo-700",
  steel: "bg-gray-500",
};
