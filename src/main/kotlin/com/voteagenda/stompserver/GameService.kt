package com.voteagenda.stompserver

import org.springframework.stereotype.Service

@Service
class GameService {

    val activeGames = mutableMapOf<String, Game>()
    private final val MAX_BAD_GUESSES = 6

    fun getGame(id: String): Game {
        return activeGames[id] ?: createGame(id)
    }

    private fun createGame(id: String): Game {
        val game = Game(id)
        activeGames[id] = game
        return game
    }

    fun addGuess(game: Game, guess: Guess) : Guess? {

        if (game.status !== GameStatus.IN_PROGRESS) return null

        var isCorrect = guess.isValid()
        if (isCorrect) {
            if (!game.lettersAvailable.contains(guess.letter)) isCorrect = false
            if (!game.word.contains(guess.letter)) isCorrect = false
            if (!game.getWordProgress().contains("*")) game.status = GameStatus.WON
        }

        if (isCorrect) {
            game.lettersAvailable.remove(guess.letter)
        } else game.badGuessCount++

        if (game.badGuessCount >= MAX_BAD_GUESSES) game.status = GameStatus.LOST

        game.lettersGuessed.add(guess.letter)
        guess.isCorrect = isCorrect

        return guess
    }
}
