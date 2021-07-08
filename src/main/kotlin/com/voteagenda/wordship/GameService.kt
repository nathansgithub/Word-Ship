package com.voteagenda.wordship

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.temporal.ChronoUnit

@Service
class GameService {

    val gameRepository = mutableMapOf<String, Game>()
    val gamesByUserId = mutableMapOf<String, Game>()
    private val MAX_BAD_GUESSES = 6

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

        val nextUserIndex = (game.userList.indexOf(guess.user) + 1) % game.userList.size
        game.currentTurnUser = game.userList.elementAt(nextUserIndex)

        println("${game.userList.size} users... Next one is #$nextUserIndex")

        return guess
    }

    fun deleteUser(sessionId: String): Game? {
        val game = gamesByUserId.remove(sessionId) ?: return null
        game.userList.removeIf { user -> user.sessionId.equals(sessionId) }
        return game
    }

}

@Service
class UserService {

    fun createUser() {}
    fun getUser() {}
    fun updateUser() {}
    fun deleteUser() {}

}