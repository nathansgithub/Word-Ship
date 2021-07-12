package com.voteagenda.wordship

import com.fasterxml.jackson.annotation.JsonIgnore
import java.time.ZoneId
import java.time.ZonedDateTime
import java.util.*

data class Game(val id: String) {

    val word =
        this::class.java.getResource("/word-lists/dolch-nouns.txt")?.readText()?.split(System.lineSeparator())?.random()
            ?: "error"
    val userList = mutableSetOf<User>()
    var status = GameStatus.IN_PROGRESS
    var badGuessCount = 0
    var lettersGuessed = mutableSetOf<String>()
    var lettersAvailable: MutableSet<String> = listOfLetters()
    var wordProgress = "_".repeat(word.length)
    var currentTurnUser: User? = null
    var currentTurnTimer = Timer()
    var latestUpdate = LatestUpdate(
        this.status.toString().replace("_", " ").lowercase(Locale.getDefault()),
        badGuessCount,
        wordProgress,
        currentTurnUser,
        lettersAvailable,
        lettersGuessed
    )

    private fun listOfLetters(): MutableSet<String> {
        val alphabet = mutableSetOf<String>()
        for (letter in 'a'..'z') {
            alphabet.add(letter.toString())
        }
        return alphabet
    }

}

enum class GameStatus {
    IN_PROGRESS, WON, LOST, ABANDONED
}

data class LatestUpdate(
    val gameStatus: String,
    val badGuessCount: Int,
    val wordProgress: String,
    val currentTurnUser: User?,
    val lettersAvailable: Set<String>,
    val lettersGuessed: Set<String>
)

class Guess(var user: User, letter: String?, var isGameEndingGuess: Boolean = false) {

    val letter = letter?.lowercase(Locale.getDefault())
    var isCorrect = false

    fun isValid(): Boolean {
        if (letter === null) return false
        if (letter.length != 1) return false
        if (!letter.matches("[A-Za-z]".toRegex())) return false
        return true
    }
}

data class User(
    var userName: String? = null,
    var sessionId: String? = null,
    val colorHSL: List<Int>? = null,
    @JsonIgnore var lastSeen: ZonedDateTime? = ZonedDateTime.now(ZoneId.of("US/Eastern"))
)

data class Response(
    val userList: Set<User>,
    val currentUser: User? = null,
    val lastGuess: Guess? = null,
    val latestUpdate: LatestUpdate
)
