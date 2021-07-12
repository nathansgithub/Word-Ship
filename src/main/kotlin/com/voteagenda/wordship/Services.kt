package com.voteagenda.wordship

import org.springframework.stereotype.Service
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.temporal.ChronoUnit
import java.util.*

@Service
class GameService {

    val gameRepository = mutableMapOf<String, Game>()
    private val MAX_BAD_GUESSES = 6
    private val AUTO_ADVANCE_TURN_IN_MS = 20000L

    fun createGame(game: Game): Game {
        gameRepository[game.id] = game
        return game
    }

    fun getGame(id: String): Game? {
        return gameRepository[id]
    }

    fun getGames(): MutableCollection<Game> {
        return gameRepository.values
    }

    fun deleteGame(id: String) {
        gameRepository.remove(id)
    }

    fun restartGame(id: String) {
        val now = ZonedDateTime.now(ZoneId.of("US/Eastern"))
        val userList = mutableListOf<User>()
        val userIterator = (gameRepository[id]?.userList ?: mutableListOf()).iterator()
        while (userIterator.hasNext()) {
            val user = userIterator.next()
            val secondsSinceLastSeen = ChronoUnit.SECONDS.between(user.lastSeen, now)
            if (secondsSinceLastSeen < 60) userList.add(user)
            println("${user.userName} was last seen: ${user.lastSeen}: $secondsSinceLastSeen seconds ago")
        }

        gameRepository[id] = createGame(Game(id))
        gameRepository[id]?.userList?.addAll(userList)
    }

    fun addGuess(gameId: String, guess: Guess): Guess? {

        val game = getGame(gameId) ?: createGame(Game(gameId))

        if (guess.letter === null) return null
        if (game.currentTurnUser === null) advanceUserTurn(game)
        if (game.currentTurnUser?.sessionId !== guess.user.sessionId) return null
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

        game.latestUpdate = LatestUpdate(
            game.status.toString().replace("_", " ").lowercase(Locale.getDefault()),
            game.badGuessCount,
            game.wordProgress,
            game.currentTurnUser,
            game.lettersAvailable,
            game.lettersGuessed
        )

        return guess
    }

    fun advanceUserTurn(game: Game) {
        val nextUserIndex = if (game.currentTurnUser === null) 0
        else {
            val currentUserIndex =
                game.userList.indexOfFirst { user -> user.sessionId.equals(game.currentTurnUser!!.sessionId) }
            (currentUserIndex + 1) % game.userList.size
        }
        game.currentTurnUser = game.userList.elementAt(nextUserIndex)
        println("${game.userList.size} users... Current turn is for #$nextUserIndex (${game.currentTurnUser?.userName})")

        game.currentTurnTimer.schedule(object : TimerTask() {
            val gameId = game.id
            override fun run() {
                val gameToAdvance = getGame(gameId)
                if (gameToAdvance !== null) advanceUserTurn(gameToAdvance)
            }
        }, AUTO_ADVANCE_TURN_IN_MS)


    }
}

@Service
class UserService {

    val gamesByUserId = mutableMapOf<String, Game>()

    fun createUser(user: User, game: Game): User {
        val sessionId = user.sessionId ?: throw IllegalArgumentException("User session id is required.")
        val userName = user.userName

        val colorHSL = listOf(
            sessionId.substring(0, 2).toInt(16) * 359 / 255,
            sessionId.substring(2, 4).toInt(16) * 70 / 255 + 30,
            sessionId.substring(4, 6).toInt(16) * 40 / 255 + 60
        )

        val newUser = User(userName = userName, sessionId = sessionId, colorHSL = colorHSL)

        game.userList.add(newUser)
        gamesByUserId[sessionId] = game

        return newUser
    }

    fun getUser(sessionId: String): User {
        val game = getGameByUserId(sessionId)
        return game.userList.find { gameUser -> gameUser.sessionId.equals(sessionId) }
            ?: throw IllegalArgumentException("User not found.")
    }

    fun updateUser(user: User, game: Game? = null): User {

        val sessionId = user.sessionId ?: throw IllegalArgumentException("User not found.")
        val userName = user.userName ?: "Anon-${user.sessionId?.substring(0, 6)}"

        val existingUser: User = try {
            getUser(sessionId)
        } catch (nfe: IllegalArgumentException) {
            if (game === null) throw IllegalArgumentException("'Game' parameter is required.")
            createUser(user, game)
        }

        existingUser.userName = userName

        val gameToUpdate = getGameByUserId(sessionId)

        if (gameToUpdate.status === GameStatus.ABANDONED) gameToUpdate.status = GameStatus.IN_PROGRESS

        return existingUser
    }

    fun deleteUser(sessionId: String) {
        val game = gamesByUserId.remove(sessionId) ?: return
        game.userList.removeIf { user -> user.sessionId.equals(sessionId) }
    }

    fun getGameByUserId(sessionId: String): Game {
        return gamesByUserId[sessionId] ?: throw IllegalArgumentException("User not found.")
    }

}