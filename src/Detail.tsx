import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { PokeAPI } from "./api";

interface PokemonDetail {
  id: number;
  name: string;
  image: string;
  types: string[];
  height: number;
  weight: number;
  abilities: string[];
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    spAtk: number;
    spDef: number;
    speed: number;
  };
  description: string;
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

function getTypeColor(type: string): string {
  return typeColors[type] || "bg-gray-400";
}

export const Detail = () => {
  const { id } = useParams();
  const [pokemon, setPokemon] = useState<PokemonDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await PokeAPI.getPokemonById(Number(id));
        const species = await PokeAPI.getPokemonSpeciesById(Number(id));
        
        setPokemon({
          id: data.id,
          name: data.name,
          image: data.sprites.other?.["official-artwork"].front_default ?? data.sprites.front_default ?? "",
          types: data.types.map((t: { type: { name: string } }) => t.type.name),
          height: data.height,
          weight: data.weight,
          abilities: data.abilities.map((a: { ability: { name: string } }) => a.ability.name),
          baseStats: {
            hp: data.stats[0].base_stat,
            attack: data.stats[1].base_stat,
            defense: data.stats[2].base_stat,
            spAtk: data.stats[3].base_stat,
            spDef: data.stats[4].base_stat,
            speed: data.stats[5].base_stat,
          },
          description: species.flavor_text_entries[0]?.flavor_text?.replace(/\f/g, " ") || "Nessuna descrizione disponibile",
        });
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Caricamento dettagli...</p>
        </div>
      </div>
    );
  }

  if (!pokemon) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-gray-300 text-lg">Pokémon non trovato</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <Link 
          to="/frontend-rocks"
          className="inline-flex items-center text-white hover:text-gray-300 mb-8 font-semibold transition-colors"
        >
          ← Torna alla lista dei Pokémon
        </Link>

        <div
          className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden card-3d"
          onMouseMove={(e) => {
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const dx = e.clientX - (rect.left + rect.width / 2);
            const dy = e.clientY - (rect.top + rect.height / 2);
            const rotationY = (dx / rect.width) * 20;
            const rotationX = (-dy / rect.height) * 20;
            e.currentTarget.style.transform = `perspective(1000px) rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
          }}
        >
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 h-32"></div>

          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row items-start gap-8 -mt-16 mb-8">
              <div className="flex-shrink-0">
                <div className="bg-white rounded-xl shadow-lg p-4 border-4 border-gray-100">
                  <img
                    src={pokemon.image}
                    alt={pokemon.name}
                    className="w-60 h-60 object-contain drop-shadow-lg"
                  />
                </div>
              </div>

              <div className="flex-grow pt-4">
                <div className="flex items-center gap-4 mb-4">
                  <h1 className="text-5xl font-black text-white capitalize">
                    {pokemon.name}
                  </h1>
                  <span className="text-2xl font-bold text-gray-300">
                    #{String(pokemon.id).padStart(3, "0")}
                  </span>
                </div>

                <p className="text-gray-300 text-lg mb-6 italic leading-relaxed">
                  {pokemon.description}
                </p>

                <div className="flex gap-3 mb-6 flex-wrap">
                  {pokemon.types.map((type) => (
                    <span
                      key={type}
                      className={`font-bold text-white px-4 py-2 rounded-full text-sm capitalize ${getTypeColor(type)}`}
                    >
                      {type}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-gray-300 text-sm font-semibold mb-1">Altezza</p>
                    <p className="text-2xl font-bold text-white">{(pokemon.height / 10).toFixed(1)} m</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-gray-300 text-sm font-semibold mb-1">Peso</p>
                    <p className="text-2xl font-bold text-white">{(pokemon.weight / 10).toFixed(1)} kg</p>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-lg font-bold text-white mb-3">Abilità</h3>
                  <div className="flex gap-2 flex-wrap">
                    {pokemon.abilities.map((ability) => (
                      <span
                        key={ability}
                        className="bg-gray-700 text-gray-200 px-4 py-2 rounded-lg text-sm font-semibold capitalize"
                      >
                        {ability.replace(/-/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t-2 border-gray-200">
              <h3 className="text-2xl font-black text-gray-900 mb-6">Statistiche Base</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <StatBar label="HP" value={pokemon.baseStats.hp} color="bg-red-500" />
                <StatBar label="Attacco" value={pokemon.baseStats.attack} color="bg-orange-500" />
                <StatBar label="Difesa" value={pokemon.baseStats.defense} color="bg-blue-500" />
                <StatBar label="Att. Speciale" value={pokemon.baseStats.spAtk} color="bg-purple-500" />
                <StatBar label="Dif. Speciale" value={pokemon.baseStats.spDef} color="bg-green-500" />
                <StatBar label="Velocità" value={pokemon.baseStats.speed} color="bg-yellow-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatBar = ({ label, value, color }: { label: string; value: number; color: string }) => {
  const percentage = (value / 150) * 100;
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-gray-300 text-sm">{label}</span>
        <span className="font-bold text-white">{value}</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};
