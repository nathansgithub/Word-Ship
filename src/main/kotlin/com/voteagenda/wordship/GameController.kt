package com.voteagenda.wordship

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.event.EventListener
import org.springframework.messaging.handler.annotation.DestinationVariable
import org.springframework.messaging.handler.annotation.Header
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.SendTo
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.messaging.simp.annotation.SubscribeMapping
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Controller
import org.springframework.util.ClassUtils
import org.springframework.web.bind.annotation.CrossOrigin
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.socket.messaging.SessionDisconnectEvent
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import javax.servlet.http.HttpServletRequest

@Controller
@CrossOrigin(allowCredentials = "false")
class GameController {

    val gameService = GameService()
    val userService = UserService()

    @Autowired
    private lateinit var messagingTemplate: SimpMessagingTemplate

    @MessageMapping("/game/{gameId}")
    @SendTo("/topic/game/{gameId}")
    fun processGuess(
        @DestinationVariable gameId: String,
        @Header("simpSessionId") sessionId: String,
        request: Guess
    ): Response {
        request.user.sessionId = sessionId

        val game = gameService.getGame(gameId) ?: gameService.createGame(Game(gameId))

        request.user = userService.updateUser(request.user, game)

        var lastGuess: Guess? = null
        if (request.letter != null) {
            lastGuess = gameService.addGuess(gameId, request)

            if (lastGuess?.isGameEndingGuess == true) {

                Executors.newSingleThreadScheduledExecutor().schedule({
                    gameService.restartGame(gameId)
                    this.broadcastGameUpdate(gameId)
                }, 20, TimeUnit.SECONDS)
            }
        }

        return Response(
            game.userList,
            request.user,
            lastGuess,
            game.latestUpdate
        )
    }

    fun broadcastGameUpdate(gameId: String) {
        val game = gameService.getGame(gameId) ?: gameService.createGame(Game(gameId))
        val response = Response(
            userList = game.userList, latestUpdate = game.latestUpdate
        )
        this.messagingTemplate.convertAndSend("/topic/game/${gameId}", response)
    }

    @SubscribeMapping("/game/{gameId}")
    fun addUser(@DestinationVariable gameId: String, @Header("simpSessionId") sessionId: String) {
        val game = gameService.getGame(gameId) ?: gameService.createGame(Game(gameId))
        userService.createUser(User(sessionId = sessionId), game)
        broadcastGameUpdate(game.id)
    }

    @EventListener
    fun removeUser(event: SessionDisconnectEvent) {
        try {
            val game = userService.getGameByUserId(event.sessionId)
            userService.deleteUser(event.sessionId)
            broadcastGameUpdate(game.id)
        } catch (nfe: IllegalArgumentException) {}
    }

    @Scheduled(fixedRate = 5000)
    fun doScheduledMaintenance() {

        val gameIterator = gameService.getGames().iterator()
        while (gameIterator.hasNext()) {
            val game = gameIterator.next()
            if (game.status === GameStatus.ABANDONED) {
                println("Deleting abandoned game \'${game.id}\'")
                gameIterator.remove()
                gameService.deleteGame(game.id)
            } else {
                if (game.userList.size == 0) game.status = GameStatus.ABANDONED
            }
        }

    }

    @ExceptionHandler(Throwable::class)
    fun handleAnyException(ex: Throwable, request: HttpServletRequest?): String? {
        return ClassUtils.getShortName(ex.javaClass)
    }

}