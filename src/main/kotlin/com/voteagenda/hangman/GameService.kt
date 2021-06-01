package com.voteagenda.hangman

import org.springframework.stereotype.Service

@Service
class GameService {

    val gamesByGameId = mutableMapOf<String, Game>()
    val gamesByUserId = mutableMapOf<String, Game>()
    private val MAX_BAD_GUESSES = 6

    fun createGame(id: String): Game {
        val word = pickWord()
        println(word)
        val game = Game(id, word)
        gamesByGameId[id] = game
        return game
    }

    fun getGame(id: String): Game {
        return gamesByGameId[id] ?: createGame(id)
    }

    fun restartGame(id: String) {
        val userList = gamesByGameId[id]?.userList ?: mutableListOf()
        gamesByGameId[id] = createGame(id)
        gamesByGameId[id]?.userList?.addAll(userList)
    }

    fun deleteGame(id: String) {
        gamesByGameId.remove(id)
    }

    fun addGuess(game: Game, guess: Guess): Guess? {

        if (guess.letter === null) return null
        if (game.status === GameStatus.ABANDONED) game.status = GameStatus.IN_PROGRESS
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
                wordProgress += "_"
            }
        }
        game.wordProgress = wordProgress

        if (game.badGuessCount >= MAX_BAD_GUESSES) {
            game.status = GameStatus.LOST
            game.wordProgress = game.word
            guess.isGameEndingGuess = true
        } else if (!game.wordProgress.contains("_")) {
            game.status = GameStatus.WON
            guess.isGameEndingGuess = true
        }

        return guess
    }

    fun disconnectUser(sessionId: String): Game? {
        val game = gamesByUserId.remove(sessionId) ?: return null
        game.userList.removeIf { user -> user.sessionId.equals(sessionId) }
        return game
    }

    fun pickWord(): String {
        val content =
            this::class.java.getResource("/word-lists/dolch-nouns.txt")?.readText()?.split(System.lineSeparator())
        return content?.random() ?: "error"
    }
}
