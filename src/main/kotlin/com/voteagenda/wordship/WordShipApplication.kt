package com.voteagenda.wordship

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.builder.SpringApplicationBuilder
import org.springframework.boot.runApplication
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer


@SpringBootApplication
class WordShipApplication : SpringBootServletInitializer() {
    override fun configure(builder: SpringApplicationBuilder): SpringApplicationBuilder? {
        return builder.sources(this::class.java)
    }
}

fun main(args: Array<String>) {
    runApplication<WordShipApplication>(*args)
}
