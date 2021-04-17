package com.voteagenda.stompserver

import org.springframework.messaging.handler.annotation.DestinationVariable
import org.springframework.messaging.handler.annotation.Header
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.SendTo
import org.springframework.messaging.simp.annotation.SubscribeMapping
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.CrossOrigin

@Controller
@CrossOrigin(allowCredentials = "false")
class GameController {

    var gameService = GameService()

    @MessageMapping("/game/{id}")
    @SendTo("/topic/game/{id}")
    fun processGuess(
        @DestinationVariable id: String,
        @Header("simpSessionId") sessionId: String,
        guess: Guess
    ): Response {
        gameService.addGuess(gameService.getGame(id), guess)
        val user = User(guess.user.userName, sessionId)
        guess.user = user
        return Response(user, guess, gameService.getGame(id).getStatus())
    }

    @SubscribeMapping("/game/{id}")
    fun getGame(@DestinationVariable id: String, @Header("simpSessionId") sessionId: String): Response {
        return Response(User("CoolAnon", sessionId), gameStatus = gameService.getGame(id).getStatus())
    }

}