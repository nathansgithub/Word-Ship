package com.voteagenda.stompserver

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.messaging.handler.annotation.Header
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.SendTo
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.CrossOrigin

@Controller
@CrossOrigin(allowCredentials = "false")
class HangmanController {

    var game = HangmanGame(1)

    @MessageMapping("/guess")
    @SendTo("/topic/guess")
    fun processChat(@Header("simpSessionId") sessionId : String, guess : HangmanGuess) : HangmanResponse {
        println("sessionId: $sessionId")
        println(ObjectMapper().writeValueAsString(guess))
        val isCorrect = game.evaluateGuess(guess)
        game.lettersGuessed.add(guess.content)

        if (isCorrect) game.lettersAvailable.remove(guess.content)
        else game.badGuessCount++

        val userRGB = listOf(sessionId.substring(0,2).toInt(16), sessionId.substring(2,4).toInt(16), sessionId.substring(4,6).toInt(16))

        return HangmanResponse(guess.userName, userRGB, guess.content, isCorrect, game.badGuessCount, game.getWordProgress(), game.lettersAvailable, game.lettersGuessed)
    }

}