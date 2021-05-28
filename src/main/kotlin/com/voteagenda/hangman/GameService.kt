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

    fun deleteGame(id: String) {
        gamesByGameId.remove(id)
    }

    fun addGuess(game: Game, guess: Guess): Guess? {

        if (game.status !== GameStatus.IN_PROGRESS) return null

        val existingUser = game.userList.find { user -> user.sessionId === guess.user.sessionId }
        if (existingUser == null) {
            game.userList.add(guess.user)
        } else existingUser.userName = guess.user.userName

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

    fun disconnectUser(sessionId: String) {
        val game = gamesByUserId.remove(sessionId) ?: return
        val user = game.userList.find { user -> user.sessionId == sessionId }
        game.userList.remove(user)

        // Delete game after all players flee
        if (game.userList.isEmpty()) gamesByGameId.remove(game.id)
    }

    fun pickWord(): String {
        val content =
            this::class.java.getResource("/word-lists/dolch-nouns.txt")?.readText()?.split(System.lineSeparator())
        return content?.random() ?: "error"
    }
}
