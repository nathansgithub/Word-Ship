package com.voteagenda.stompserver

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.event.EventListener
import org.springframework.messaging.handler.annotation.DestinationVariable
import org.springframework.messaging.handler.annotation.Header
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.SendTo
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.messaging.simp.annotation.SubscribeMapping
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.CrossOrigin
import org.springframework.web.socket.messaging.SessionDisconnectEvent
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

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
        guess: Guess
    ): Response {
        guess.user.sessionId = sessionId
        val game = gameService.getGame(id)
        val lastGuess = gameService.addGuess(game, guess)
        if (lastGuess?.isGameEndingGuess == true) {
            Executors.newSingleThreadScheduledExecutor().schedule({
                gameService.deleteGame(id)
                this.broadcastGameUpdate(id)
            }, 5, TimeUnit.SECONDS)
        }
        return Response(game.userList, guess.user, lastGuess, game.getLatestUpdate())
    }

    @SubscribeMapping("/game/{id}")
    fun getGame(@DestinationVariable id: String, @Header("simpSessionId") sessionId: String): Response {
        val game = gameService.getGame(id)
        gameService.gamesBySessionId.put(sessionId, game)
        return Response(
            currentUser = User(sessionId = sessionId),
            userList = game.userList,
            latestUpdate = game.getLatestUpdate()
        )
    }

    fun broadcastGameUpdate(id: String) {
        val game = gameService.getGame(id)
        val response = Response(
            userList = game.userList, latestUpdate = game.getLatestUpdate()
        )
        this.messagingTemplate.convertAndSend("/topic/game/${id}", response)
    }

    @EventListener
    fun disconnectUser(event: SessionDisconnectEvent) {
        gameService.disconnectUser(event.sessionId)
    }

}