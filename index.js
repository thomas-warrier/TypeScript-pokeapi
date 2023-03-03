var readline = require('readline');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
var apiUrl = "https://pokeapi.co/api/v2";
var message = "\n0 - Quitter\n1 - Nombre de pok\u00E9mon par type\n2 - Efficacit\u00E9 d'une attaque \n3 - Bases stats \n";
var fetchData = function (url) { return fetch(url).then(function (res) { return res.json(); }); };
var askQuestion = function (question) {
    return new Promise(function (resolve) {
        rl.question(question, function (input) {
            resolve(input);
        });
    });
};
var showChoices = function () {
    askQuestion(message)
        .then(function (answer) {
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
var pokemonCountByType = function () {
    return getPokemonCountByTypes()
        .then(console.log)["finally"](showChoices);
};
var getPokemonCountByTypes = function () {
    return fetchData("".concat(apiUrl, "/type"))
        .then(function (types) { return Promise.all(types.results.map(function (type) { return fetchData(type.url); })); })
        .then(function (types) { return types.map(function (type) { return ({
        type: type.name,
        nombrePokemon: type.pokemon.length
    }); }); });
};
//////////////////////////////////////////////////
var efficaciteMovePokemon = function () {
    askQuestion("Move, Pokémon : ")
        .then(function (input) {
        var _a = input.trim().split(','), move = _a[0], pokemon = _a[1];
        return showEfficaciteMoveOnPokemon(move, pokemon);
    })["finally"](showChoices);
};
var showEfficaciteMoveOnPokemon = function (move, pokemon) {
    // Create Promise to get move's type
    var futurMoveType = fetchData("".concat(apiUrl, "/move/").concat(move))
        .then(function (move) { return fetchData(move.type.url); })["catch"](function () { return console.error("L'attaque ".concat(move, " n'existe pas :(")); });
    // Create Promise to get pokemon's types
    var futurPokemonTypesName = fetchData("".concat(apiUrl, "/pokemon/").concat(pokemon))
        .then(function (pokemon) { return pokemon.types.map(function (type) { return type.type.name; }); })["catch"](function () { return console.error("Le pokemon ".concat(pokemon, " n'existe pas :(")); });
    // Wait until all Promise are resolved
    return Promise.all([futurMoveType, futurPokemonTypesName])
        .then(function (res) { return compareMoveTypeAndPokemonTypes.apply(void 0, res); })
        .then(function (multiplier) { return console.log("L'attaque ".concat(move, " sur ").concat(pokemon, " aura un multiplicateur de ").concat(multiplier)); })["catch"](function () { return 0; });
};
var compareMoveTypeAndPokemonTypes = function (moveType, pokemonTypes) {
    // Error happened earlier
    if (!moveType || !pokemonTypes)
        throw new Error();
    var efficiency = 1;
    for (var _i = 0, pokemonTypes_1 = pokemonTypes; _i < pokemonTypes_1.length; _i++) {
        var pokemonType = pokemonTypes_1[_i];
        var _a = moveType.damage_relations, double_damage_to = _a.double_damage_to, half_damage_to = _a.half_damage_to, no_damage_to = _a.no_damage_to;
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
var isTypeInArray = function (array, type) {
    return !!array.find(function (typeModifier) { return typeModifier.name === type; });
};
//////////////////////////////////////////////////
var baseStatOfPokemon = function () {
    askQuestion("Pokémon : ")
        .then(showPokemonTotalBaseStats)["finally"](showChoices);
};
var showPokemonTotalBaseStats = function (pokemon) {
    return fetchData("".concat(apiUrl, "/pokemon/").concat(pokemon))
        .then(function (pokemon) { return pokemon.stats.reduce(function (before, current) { return before + current.base_stat; }, 0); })
        .then(function (stats) { return console.log("Stats totales de ".concat(pokemon, " : ").concat(stats)); })["catch"](function () { return console.error("".concat(pokemon, " n'existe pas :(")); });
};
//////////////////////////////////////////////////
showChoices();
