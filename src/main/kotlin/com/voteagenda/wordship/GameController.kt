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

    @Autowired
    private lateinit var messagingTemplate: SimpMessagingTemplate

    @MessageMapping("/game/{id}")
    @SendTo("/topic/game/{id}")
    fun processGuess(
        @DestinationVariable id: String,
        @Header("simpSessionId") sessionId: String,
        request: Guess
    ): Response {
        request.user.sessionId = sessionId
        val game = gameService.getGame(id)?: gameService.createGame(Game(id))

        request.user = game.updateUser(request.user)

        var lastGuess: Guess? = null
        if (request.letter != null) {
            lastGuess = gameService.addGuess(game, request)

            if (lastGuess?.isGameEndingGuess == true) {

                Executors.newSingleThreadScheduledExecutor().schedule({
                    gameService.restartGame(id)
                    this.broadcastGameUpdate(id)
                }, 20, TimeUnit.SECONDS)
            }
        }

        return Response(
            game.userList,
            request.user,
            lastGuess,
            game.getLatestUpdate()
        )
    }

    fun broadcastGameUpdate(id: String) {
        val game = gameService.getGame(id)?: gameService.createGame(Game(id))
        val response = Response(
            userList = game.userList, latestUpdate = game.getLatestUpdate()
        )
        this.messagingTemplate.convertAndSend("/topic/game/${id}", response)
    }

    @SubscribeMapping("/game/{id}")
    fun addUser(@DestinationVariable id: String, @Header("simpSessionId") sessionId: String) {
        val game = gameService.getGame(id)?: gameService.createGame(Game(id))
        gameService.gamesByUserId[sessionId] = game
        game.updateUser(User(sessionId = sessionId))
        broadcastGameUpdate(game.id)
    }

    @EventListener
    fun removeUser(event: SessionDisconnectEvent) {
        val game = gameService.deleteUser(event.sessionId)
        if (game != null) broadcastGameUpdate(game.id)
    }

    @Scheduled(fixedRate = 5000)
    fun doScheduledMaintenance() {

        var gameIterator = gameService.gameRepository.values.iterator()
        while (gameIterator.hasNext()) {
            val game = gameIterator.next()
            if (game.status === GameStatus.ABANDONED) {
                println("Deleting abandoned game \'${game.id}\'")
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