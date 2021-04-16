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
class GuessController {

    lateinit var guessService : GuessService

    @MessageMapping("/{id}/guess")
    @SendTo("/topic/{id}/guess")
    fun processGuess(@DestinationVariable id : String, @Header("simpSessionId") sessionId : String, guess : HangmanGuess) : HangmanResponse {
        return guessService.processGuess(sessionId, guess)
    }

    @SubscribeMapping("/{id}/guess")
    fun getGame(@DestinationVariable id : String, @Header("simpSessionId") sessionId : String): HangmanResponse {
        guessService = GuessService(id)
        return guessService.getGame()
    }

}