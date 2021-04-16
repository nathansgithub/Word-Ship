package com.voteagenda.stompserver

class HangmanGame(val id: Int) {

    var word = "hangman"
    var badGuessCount = 0
    var lettersGuessed = mutableSetOf<String>()
    var lettersAvailable : MutableSet<String> = listOfLetters()

    private fun listOfLetters(): MutableSet<String> {
        val alphabet = mutableSetOf<String>()
        for (letter in 'a'..'z') {
            alphabet.add(letter.toString())
        }
        return alphabet
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

class HangmanGuess(val userName: String, val content : String)

class HangmanResponse(val userName: String, val userRGB : List<Int>, val content : String, val isCorrect : Boolean, val badGuessCount : Int, val wordProgress : String, val lettersAvailable : Set<String>, val lettersGuessed : Set<String>)