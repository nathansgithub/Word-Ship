package com.voteagenda.stompserver

import org.springframework.messaging.handler.annotation.Header
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.SendTo
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.CrossOrigin

@Controller
@CrossOrigin(allowCredentials = "false")
class GameController {

    val gameService = GameService()

    @MessageMapping("/guess")
    @SendTo("/topic/guess")
    fun processGuess(@Header("simpSessionId") sessionId : String, guess : HangmanGuess) : HangmanResponse {
        return gameService.processGuess(sessionId, guess)
    }

}