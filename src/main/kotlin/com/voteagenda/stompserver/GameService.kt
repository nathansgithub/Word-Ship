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
        val word = pickWord()
        println(word)
        val game = Game(id, word)
        activeGames[id] = game
        return game
    }

    fun addGuess(game: Game, guess: Guess): Guess? {

        if (game.status !== GameStatus.IN_PROGRESS) return null

        var isCorrect = guess.isValid()
        if (isCorrect) {
            if (!game.lettersAvailable.contains(guess.letter)) isCorrect = false
            if (!game.word.contains(guess.letter)) isCorrect = false
        }

        if (isCorrect) {
            game.lettersAvailable.remove(guess.letter)
        } else game.badGuessCount++

        game.lettersGuessed.add(guess.letter)
        guess.isCorrect = isCorrect

        var wordProgress = ""
        for (letter in game.word) {
            if (game.lettersGuessed.contains(letter.toString())) {
                wordProgress += letter
            } else {
                wordProgress += "*"
            }
        }
        game.wordProgress = wordProgress

        if (game.badGuessCount >= MAX_BAD_GUESSES) {
            game.status = GameStatus.LOST
            game.wordProgress = game.word
        } else if (!game.wordProgress.contains("*")) {
            game.status = GameStatus.WON
        }

        return guess
    }

    fun pickWord(): String {

        val content = this::class.java.getResource("/word-lists/dolch-nouns.txt").readText().split(System.lineSeparator())
        return content.random()

    }
}
