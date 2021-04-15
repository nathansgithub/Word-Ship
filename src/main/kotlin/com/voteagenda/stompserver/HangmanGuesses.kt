package com.voteagenda.stompserver

class HangmanGame(val id: Int) {

    private var word = "hangman"
    var lettersAvailable = listOfAlphabet()
    var lettersGuessed = mutableSetOf<String>()
    var badGuessCount = 0

    private fun listOfAlphabet(): MutableSet<String> {
        val alphabet = mutableSetOf<String>()
        for (letter in 'a'..'z') {
            alphabet.add(letter.toString())
        }
        return alphabet
    }

    fun evaluateGuess(guess : HangmanGuess): Boolean {
        if (!guess.isValidGuess()) return false
        if (!lettersAvailable.contains(guess.content)) return false
        if (!word.contains(guess.content)) return false
        return true
    }

    fun getWordProgress() : String {
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

class HangmanGuess(val userName: String, content : String) {

    val content = content.toLowerCase()

    fun isValidGuess(): Boolean {
        if (content.length != 1) return false
        if (!content.matches("[A-Za-z]".toRegex())) return false
        return true
    }
}

class HangmanResponse(val userName: String, val userRGB : List<Int>, val content : String, val isCorrect : Boolean, val badGuessCount : Int, val wordProgress : String, val lettersAvailable : Set<String>, val lettersGuessed : Set<String>)