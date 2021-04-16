package com.voteagenda.stompserver

import org.springframework.context.annotation.Configuration
import org.springframework.context.event.EventListener
import org.springframework.messaging.simp.config.MessageBrokerRegistry
import org.springframework.stereotype.Component
import org.springframework.web.socket.config.annotation.*
import org.springframework.web.socket.messaging.SessionConnectedEvent

import javax.servlet.http.HttpServletResponse

import java.io.IOException
import javax.servlet.*

/**
 * For testing purposes, allow all CORS requests
 */
@Component
class CORSFilter : Filter {
    @Throws(IOException::class, ServletException::class)
    override fun doFilter(req: ServletRequest?, res: ServletResponse, chain: FilterChain) {
        val response = res as HttpServletResponse
//        response.setHeader("Access-Control-Allow-Origin", "*")
        response.setHeader("Access-Control-Allow-Origin", "http://localhost:63343")
        response.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT, OPTIONS, DELETE")
        response.setHeader("Access-Control-Max-Age", "3600")
        response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
        response.setHeader("Access-Control-Allow-Credentials", "true")
        chain.doFilter(req, res)
    }

    override fun init(filterConfig: FilterConfig?) {}
    override fun destroy() {}
}

@Configuration
@EnableWebSocketMessageBroker
class WebSocketConfig : WebSocketMessageBrokerConfigurer {

    override fun configureMessageBroker(config : MessageBrokerRegistry) {
        config.enableSimpleBroker("/topic")
        config.setApplicationDestinationPrefixes("/app")
    }

    override fun registerStompEndpoints(registry: StompEndpointRegistry) {
        registry.addEndpoint("/hangman-ws").setAllowedOriginPatterns("http://localhost:63343")
    }

}

@Component
class WebSocketListener {

    @EventListener
    fun connectionEstablished(event : SessionConnectedEvent) {
        val message = event.message
        val headers = message.headers
        println(headers["simpSessionId"])
    }

}