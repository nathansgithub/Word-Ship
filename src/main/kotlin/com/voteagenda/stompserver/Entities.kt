package com.voteagenda.stompserver

class Game(val id: String) {

    var word = "hangman"
    var badGuessCount = 0
    var lettersGuessed = mutableSetOf<String>()
    var lettersAvailable: MutableSet<String> = listOfLetters()

    private fun listOfLetters(): MutableSet<String> {
        val alphabet = mutableSetOf<String>()
        for (letter in 'a'..'z') {
            alphabet.add(letter.toString())
        }
        return alphabet
    }

    fun getStatus(): GameStatus {
        return GameStatus(badGuessCount, getWordProgress(), lettersAvailable, lettersGuessed)
    }

    fun getWordProgress(): String {
        var progress = ""
        for (letter in word) {
            if (lettersGuessed.contains(letter.toString())) {
                progress += letter
            } else {
                progress += "*"
            }
        }
        return progress
    }

}

class GameStatus(
    val badGuessCount: Int,
    val wordProgress: String,
    val lettersAvailable: Set<String>,
    val lettersGuessed: Set<String>
)

class Guess(var user: User, letter: String) {

    val letter = letter.toLowerCase()
    var isCorrect = false

    fun isValid(): Boolean {
        if (letter.length != 1) return false
        if (!letter.matches("[A-Za-z]".toRegex())) return false
        return true
    }
}

class User(val userName: String, val sessionId: String? = null) {
    val userRGB = if (sessionId == null) null else listOf(
        sessionId.substring(0, 2).toInt(16),
        sessionId.substring(2, 4).toInt(16),
        sessionId.substring(4, 6).toInt(16)
    )
}

class Response(val currentUser: User, val lastGuess: Guess? = null, val gameStatus: GameStatus)
