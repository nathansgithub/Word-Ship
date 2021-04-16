package com.voteagenda.stompserver

import com.fasterxml.jackson.databind.ObjectMapper

class GuessService(val id : String) {

    var game: HangmanGame = HangmanGame(id)

    fun processGuess(sessionId : String, guess: HangmanGuess): HangmanResponse {
        println("game id = ${game.id}")
        println(ObjectMapper().writeValueAsString(guess))
        val isCorrect = testGuess(guess)
        game.lettersGuessed.add(guess.content)

        if (isCorrect) game.lettersAvailable.remove(guess.content)
        else game.badGuessCount++

        val userRGB = listOf(sessionId.substring(0,2).toInt(16), sessionId.substring(2,4).toInt(16), sessionId.substring(4,6).toInt(16))

        return HangmanResponse(guess.userName, userRGB, guess.content, isCorrect, getGameStatus())
    }

    fun getGame(): HangmanResponse {
        return HangmanResponse("BlahAnon", listOf(220,220,220), "x", false, getGameStatus())
    }

    fun getGameStatus(): HangmanGameStatus {
        return HangmanGameStatus(game.badGuessCount, game.getWordProgress(), game.lettersAvailable, game.lettersGuessed)
    }

    private fun testGuess(guess: HangmanGuess): Boolean {
        val content = guess.content.toLowerCase()
        if (content.length != 1) return false
        if (!content.matches("[A-Za-z]".toRegex())) return false
        if (!game.lettersAvailable.contains(guess.content)) return false
        if (!game.word.contains(guess.content)) return false
        return true
    }

}