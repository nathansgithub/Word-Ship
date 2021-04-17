package com.voteagenda.stompserver

import org.springframework.stereotype.Service

@Service
class GameService {

    val activeGames = mutableMapOf<String, Game>()

    fun getGame(id: String): Game {
        return activeGames[id] ?: createGame(id)
    }

    private fun createGame(id: String): Game {
        val game = Game(id)
        activeGames[id] = game
        return game
    }

    fun addGuess(game: Game, guess: Guess) {
        var isCorrect = guess.isValid()
        if (isCorrect) {
            if (!game.lettersAvailable.contains(guess.letter)) isCorrect = false
            if (!game.word.contains(guess.letter)) isCorrect = false
        }
        if (isCorrect) {
            game.lettersAvailable.remove(guess.letter)
            game.lettersGuessed.add(guess.letter)
        } else game.badGuessCount++
        guess.isCorrect = isCorrect
    }
}
