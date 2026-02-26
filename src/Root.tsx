import { useState, useEffect } from "react";
import { Link } from "react-router";
import { PokeAPI } from "./api";

interface PokemonCardProps {
  id: number;
  image: string;
  name: string;
  types: string[];
}

export const Card: React.FC<PokemonCardProps> = (props) => {
  const bgColor = getTypeBgColor(props.types[0] || "normal");
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

  return (
    <Link to={`/frontend-rocks/dettaglio/${props.id}`}>
      <div
        className="relative w-full h-80 card-3d cursor-pointer"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(1000px) rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
        }}
      >
        <div
          className="absolute inset-0 rounded-2xl border-4 border-yellow-400 bg-gradient-to-br from-white/80 to-white/60 shadow-2xl overflow-hidden"
        ></div>

        <div className="absolute inset-0 p-4 flex flex-col justify-between">
          <header className="flex justify-between items-center">
            <h4 className="text-xl font-extrabold text-gray-900 capitalize drop-shadow">
              {props.name}
            </h4>
            <span className="text-sm font-semibold text-gray-600">
              #{String(props.id).padStart(3, "0")}
            </span>
          </header>

          <div className="flex-grow flex items-center justify-center">
            <img
              src={props.image}
              alt={props.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          <footer className="flex justify-center gap-2 flex-wrap">
            {props.types.map((type) => (
              <span
                key={type}
                className={`font-bold text-xs px-2 py-1 rounded-full capitalize ${getTypeColor(type)}`}
              >
                {type}
              </span>
            ))}
          </footer>
        </div>
      </div>
    </Link>
  );
}

interface Pokemon {
  id: number;
  image: string;
  name: string;
  types: string[];
}

async function fetchPokemonData(): Promise<Pokemon[]> {
  const list = await PokeAPI.listPokemons(0, 20); // ora prendiamo 20 pokémon
  const pokemons = await Promise.all(
    list.results.map(async (item: { name: string; url: string }) => {
      const pokemon = await PokeAPI.getPokemonByName(item.name);
      return {
        id: pokemon.id,
        image: pokemon.sprites.other?.["official-artwork"].front_default ?? pokemon.sprites.front_default ?? "",
        name: pokemon.name,
        types: pokemon.types.map((type: { type: { name: string } }) => type.type.name),
      };
    }),
  );

  return pokemons;
}

export function Root() {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPokemonData().then((data) => {
      setPokemon(data);
      setLoading(false);
    });
  }, []);

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

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-black text-center mb-2 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
          Pokémon
        </h1>
        <p className="text-center text-gray-300 mb-12">Clicca su una carta per vedere i dettagli completi</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {pokemon.map((p) => (
            <Card
              key={p.id}
              id={p.id}
              image={p.image}
              name={p.name}
              types={p.types}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
function getTypeColor(type: string): string {
  return typeColors[type] || "bg-gray-400";
}

function getTypeBgColor(type: string): string {
  // light hex versions used for card backgrounds
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

/*
interface PokemonCard {
  id: number;
  image: string;
  name: string;
  types: string[];
}

async function fetchData(offset: number): Promise<PokemonCard[]> {
  const list = await PokeAPI.listPokemons(offset, 20);
  const pokemons = await Promise.all(
    list.results.map(async (item: { name: string; url: string }) => {
      const pokemon = await PokeAPI.getPokemonByName(item.name);
      return pokemon;
    }),
  );

  return pokemons.map((item) => ({
    id: item.id,
    image: item.sprites.other?.["official-artwork"].front_default ?? "",
    name: item.name,
    types: item.types.map((type) => type.type.name),
  }));
}*/