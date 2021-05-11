package com.voteagenda.hangman

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
open class StompServerApplication

fun main(args: Array<String>) {
    runApplication<StompServerApplication>(*args)
}
