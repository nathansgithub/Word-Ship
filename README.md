# Word Ship

[![Java CI with Maven](https://github.com/nathansgithub/hangman/actions/workflows/maven.yml/badge.svg)](https://github.com/nathansgithub/hangman/actions/workflows/maven.yml)

An online multiplayer word game written in Kotlin, HTML/CSS, and vanilla JavaScript. It uses STOMP over WebSockets to keep everyone in a game updated. I am partly using this project to get more familiar with Kotlin and Spring.

There is no data storage, so a game will be deleted when the server restarts or when all the players leave a room. You can dynamically spin up a new game by clicking *'Change Room'* and typing a room name that hasn't been picked yet. Typing the name of an existing room will let you join that game.

# Development
The project will spin up on localhost:8080 by default.
## Run from Maven
```mvn spring-boot:run```
## Run from Docker Compose
```docker-compose up```

# Gameplay Screenshots
![Game window with pirate ship and text prompt beneath. The incomplete word shows as "_o_".](src/main/resources/static/images/screenshots/screenshot-2021-07-13-play.png)

Game window showing player losing the game. A hail of cannonfire sinks the pirate ship:

https://user-images.githubusercontent.com/14364359/166086409-f007737b-de40-4b0d-95a0-39a44ff7ac9a.mp4

