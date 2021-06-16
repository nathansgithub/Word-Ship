package com.voteagenda.wordship

import com.fasterxml.jackson.annotation.JsonIgnore
import java.time.ZoneId
import java.time.ZonedDateTime
import java.util.*

data class Game(val id: String, val word: String) {

    val userList = mutableSetOf<User>()
    var status = GameStatus.IN_PROGRESS
    var badGuessCount = 0
    var lettersGuessed = mutableSetOf<String>()
    var lettersAvailable: MutableSet<String> = listOfLetters()
    var wordProgress = "_".repeat(word.length)
    var currentTurnUser: User? = null

    private fun listOfLetters(): MutableSet<String> {
        val alphabet = mutableSetOf<String>()
        for (letter in 'a'..'z') {
            alphabet.add(letter.toString())
        }
        return alphabet
    }

    fun getLatestUpdate(): LatestUpdate {

        val statusString = status.toString().replace("_", " ").lowercase(Locale.getDefault())
        return LatestUpdate(statusString, badGuessCount, wordProgress, lettersAvailable, lettersGuessed)
    }

    fun updateUser(user: User): User {
        var existingUser = userList.find { userListUser -> userListUser.sessionId === user.sessionId }
        val userName = user.userName ?: "Anon-${user.sessionId?.substring(0, 6)}"

        if (existingUser == null) {
            existingUser = User(userName = userName, sessionId = user.sessionId)
            userList.add(existingUser)
        } else {
            existingUser.userName = userName
        }

        if (currentTurnUser === null) currentTurnUser = user

        if (status === GameStatus.ABANDONED) status = GameStatus.IN_PROGRESS

        return existingUser
    }

}

enum class GameStatus {
    IN_PROGRESS, WON, LOST, ABANDONED
}

data class LatestUpdate(
    val gameStatus: String,
    val badGuessCount: Int,
    val wordProgress: String,
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
    @JsonIgnore var lastSeen: ZonedDateTime? = ZonedDateTime.now(ZoneId.of("US/Eastern"))
) {
    val colorHSL = if (sessionId == null) null else listOf(
        sessionId!!.substring(0, 2).toInt(16) * 359 / 255,
        sessionId!!.substring(2, 4).toInt(16) * 70 / 255 + 30,
        sessionId!!.substring(4, 6).toInt(16) * 40 / 255 + 60
    )
}

data class Response(
    val userList: Set<User>,
    val currentUser: User? = null,
    val lastGuess: Guess? = null,
    val latestUpdate: LatestUpdate
)
