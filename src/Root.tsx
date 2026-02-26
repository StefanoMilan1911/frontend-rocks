import { useState, useEffect } from "react";
import { Link } from "react-router";
import { PokeAPI } from "./api";

interface PokemonCardProps {
  id: number;
  image: string;
  name: string;
  types: string[];
}

export const Card: React.FC<PokemonCardProps> = (props) => (
  <Link to={`/frontend-rocks/dettaglio/${props.id}`}>
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer relative w-full h-80 flex flex-col items-center justify-center p-4 overflow-hidden hover:border-blue-400">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"></div>
      
      <h4 className="text-lg text-gray-900 tracking-wide font-bold text-center mb-2 capitalize">
        {props.name}
      </h4>
      
      <span className="text-xs font-semibold text-gray-500 mb-3">
        #{String(props.id).padStart(3, "0")}
      </span>

      <img
        src={props.image}
        alt={props.name}
        className="w-40 h-40 object-contain mb-3 drop-shadow-lg"
      />

      <div className="text-sm text-gray-700 flex justify-center gap-2 flex-wrap">
        {props.types.map((type) => (
          <span
            key={type}
            className={`font-bold text-white px-3 py-1 rounded-full text-xs capitalize ${getTypeColor(type)}`}
          >
            {type}
          </span>
        ))}
      </div>
    </div>
  </Link>
);

interface Pokemon {
  id: number;
  image: string;
  name: string;
  types: string[];
}

async function fetchPokemonData(): Promise<Pokemon[]> {
  const list = await PokeAPI.listPokemons(0, 10);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Caricamento Pokemon...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-black text-center mb-2 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
          Pokémon
        </h1>
        <p className="text-center text-gray-600 mb-12">Clicca su una carta per vedere i dettagli completi</p>
        
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
  return typeColors[type];
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