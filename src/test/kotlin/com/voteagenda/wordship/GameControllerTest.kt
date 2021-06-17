package com.voteagenda.wordship

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest

@SpringBootTest
internal class GameControllerTest {

    @Autowired
    lateinit var controller: GameController

    @Test
    @DisplayName("Controller loads")
    fun controllerLoads() {
        assertNotEquals(null, controller)
    }

    @Test
    @DisplayName("Created user matches inputs")
    fun createdUserMatchesInputs() {
        val gameId = "a"
        val sessionId = "1234-asdf-567890"

        val game = controller.gameService.getGame(gameId)

        controller.addUser(gameId, sessionId)

        assertEquals(1, game.userList.size)
        assertEquals(sessionId, game.userList.first().sessionId)
    }
}