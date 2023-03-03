type MoveType = {
    double_damage_to: Array<PokemonType>,
    half_damage_to: Array<PokemonType>,
    no_damage_to: Array<PokemonType>,
}
type Pokemon = {
    stats: Array<{
        base_stat: number,
        effort: number,
        stat: {
            url: string,
            name: string
        }
    }>
}

type PokemonType = {
    type: {
        name: string
    }
}

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const apiUrl: string = "https://pokeapi.co/api/v2";

const message: string = `
0 - Quitter
1 - Nombre de pokémon par type
2 - Efficacité d'une attaque 
3 - Bases stats 
`;



const fetchData = (url: string) => fetch(url).then(res => res.json());

const askQuestion = (question: string) => {
    return new Promise<string>((resolve) => {
        rl.question(question, (input) => {
            resolve(input);
        });
    });
};

const showChoices = () => {
    askQuestion(message)
        .then((answer) => {
            switch (answer) {
                case '0':
                    return rl.close();
                case '1':
                    return pokemonCountByType();
                case '2':
                    return efficaciteMovePokemon();
                case '3':
                    return baseStatOfPokemon();
                default:
                    return showChoices();
            }
        });
};

//////////////////////////////////////////////////

const pokemonCountByType = () => {
    return getPokemonCountByTypes()
        .then(console.log)
        .finally(showChoices);
};

const getPokemonCountByTypes = () => {
    return fetchData(`${apiUrl}/type`)
        .then(types => Promise.all(types.results.map(type => fetchData(type.url))))
        .then(types => types.map(type => ({
            type: type.name,
            nombrePokemon: type.pokemon.length
        })));
};

//////////////////////////////////////////////////

const efficaciteMovePokemon = () => {
    askQuestion("Move, Pokémon : ")
        .then((input) => {
            const [move, pokemon] = input.trim().split(',');
            return showEfficaciteMoveOnPokemon(move, pokemon);
        })
        .finally(showChoices);
};

const showEfficaciteMoveOnPokemon = (move: string, pokemon: string) => {
    // Create Promise to get move's type
    const futurMoveType = fetchData(`${apiUrl}/move/${move}`)
        .then(move => fetchData(move.type.url))
        .catch(() => console.error(`L'attaque ${move} n'existe pas :(`));

    // Create Promise to get pokemon's types
    const futurPokemonTypesName = fetchData(`${apiUrl}/pokemon/${pokemon}`)
        .then(pokemon => pokemon.types.map(type => type.type.name))
        .catch(() => console.error(`Le pokemon ${pokemon} n'existe pas :(`));

    // Wait until all Promise are resolved
    return Promise.all([futurMoveType, futurPokemonTypesName])
        .then(res => compareMoveTypeAndPokemonTypes(...res))
        .then((multiplier) => console.log(`L'attaque ${move} sur ${pokemon} aura un multiplicateur de ${multiplier}`))
        .catch(() => 0);
};

const compareMoveTypeAndPokemonTypes = (moveType, pokemonTypes: Array<PokemonType>) => {
    // Error happened earlier
    if (!moveType || !pokemonTypes) throw new Error();

    let efficiency = 1;
    for (const pokemonType of pokemonTypes) {
        const { double_damage_to, half_damage_to, no_damage_to } = moveType.damage_relations;
        if (isTypeInArray(double_damage_to, pokemonType)) {
            efficiency *= 2;
        }
        if (isTypeInArray(half_damage_to, pokemonType)) {
            efficiency *= 0.5;
        }
        if (isTypeInArray(no_damage_to, pokemonType)) {
            efficiency *= 0;
        }
    }
    return efficiency;
};

const isTypeInArray = (array: Array<any>, type: PokemonType) => {
    return !!array.find((typeModifier) => typeModifier.name === type);
};

//////////////////////////////////////////////////

const baseStatOfPokemon = () => {
    askQuestion("Pokémon : ")
        .then(showPokemonTotalBaseStats)
        .finally(showChoices);
};

const showPokemonTotalBaseStats = (pokemon) => {
    return fetchData(`${apiUrl}/pokemon/${pokemon}`)
        .then((pokemon: Pokemon) => pokemon.stats.reduce((before, current) => before + current.base_stat, 0))
        .then(stats => console.log(`Stats totales de ${pokemon} : ${stats}`))
        .catch(() => console.error(`${pokemon} n'existe pas :(`));
};

//////////////////////////////////////////////////

showChoices();