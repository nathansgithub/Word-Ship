'use strict'

const connectionHandler = {

    client: new StompJs.Client({
        brokerURL: 'ws://localhost:8080/hangman-ws',
        // connectHeaders: {
        //   login: 'user',
        //   passcode: 'password',
        // },
        reconnectDelay: 3000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        debug: function (str) {
            // console.log(str)
        },
        onStompError: function (frame) {
            // Will be invoked in case of error encountered at Broker
            // Bad login/passcode typically will cause an error
            // Complaint brokers will set `message` header with a brief message. Body may contain details.
            // Compliant brokers will terminate the connection after any error
            console.log('Broker reported error: ' + frame.headers['message'])
            console.log('Additional details: ' + frame.body)
        },
        onConnect: function (frame) {
            this.subscribe(`/topic/game/${currentGame.id}`,
                function (message) {

                    const messageBody = JSON.parse(message.body)
                    console.info('receiving:', messageBody)

                    if (messageBody.currentUser && !currentUser.userRGB) {
                        messageBody.currentUser.userName = currentUser.userName
                        currentUser = new User(messageBody.currentUser)
                    }

                    const lastGuess = messageBody.lastGuess
                    const latestUpdate = messageBody.latestUpdate

                    if (lastGuess) {
                        switch (lastGuess.isCorrect) {
                            case true:
                                cmd.print(`correctly guessed \"${lastGuess.letter}\"`,
                                    cmd.colors.get('green'), lastGuess.user)
                                break
                            case false:
                                cmd.print(`incorrectly guessed \"${lastGuess.letter}\"`,
                                    cmd.colors.get('red'), lastGuess.user)
                                break
                        }
                    }

                    if (latestUpdate) {
                        currentGame.update(latestUpdate)
                    }
                })
        },

    }),
    activate: function () {
        this.client.activate()
    },
    deactivate: function () {
        this.client.deactivate()
    },
    publishMessage: function (topic, body) {
        console.info('sending:', body)
        this.client.publish({destination: topic, body: JSON.stringify(body)})
    },

}

const cmd = {

    commands: ['help', 'clear', 'new', 'join', 'quit'],
    element: document.getElementById('cmd'),
    promptElement: document.getElementById('cmd-prompt'),
    colors: new Map().set('green', 'var(--green)').set('red', 'var(--red)'),
    print: function (message, color = 'default', user = {}) {
        const chats = document.getElementById('chat-history')
        const messageDiv = document.createElement('div')
        messageDiv.classList.add('chat-history-line')
        messageDiv.style.color = color
        if (Object.keys(user).length > 0) {
            const userTag = document.createElement('span')
            const userRGB = user.userRGB
            userTag.style.backgroundColor = `rgb(${userRGB[0]},${userRGB[1]},${userRGB[2]})`
            userTag.innerText = user.userName
            userTag.classList.add('user-tag')
            userTag.style.color = currentUser.getContrastColor(userRGB)
            messageDiv.appendChild(userTag)
        }
        messageDiv.appendChild(document.createTextNode(message))
        const cmdInputDiv = document.getElementById('cmd-input-div')
        chats.insertBefore(messageDiv, cmdInputDiv)
        if (chats.childNodes.length > 100) {
            chats.childNodes[0].remove()
        }
        cmdInputDiv.scrollIntoView()
    },
    clearChat: function () {
        const chatLines = document.getElementsByClassName('chat-history-line')
        for (let i = chatLines.length - 1; i >= 0; i--) {
            chatLines[i].parentNode.removeChild(chatLines[i])
        }
    },
    clearInput: function () {
        document.getElementById('cmd-form').reset()
    },
    printHelp: function () {
        this.print(`Valid commands are: ${this.commands.join(', ')}`)
    },
    joinGame: function (id = 'woobly' + Math.floor(Math.random() * 100000)) {
        currentGame = new Game(id)
    },
    quit: function () {
        this.print('You shrugged and gave up.')
    },

}

class User {

    userName
    userRGB
    sessionId

    constructor(object) {
        for (const property in object) {
            if (object.hasOwnProperty(property)) {
                this[property] = object[property]
            }
        }
        if (this.userRGB != null) {
            this.contrastColor = this.getContrastColor(this.userRGB)
        }
    }

    getContrastColor(colorRGB) {
        const sum = Math.round(
            ((parseInt(colorRGB[0]) * 299) + (parseInt(colorRGB[1]) * 587) +
                (parseInt(colorRGB[2]) * 114)) / 1000)
        return (sum > 128) ? '#000' : '#fff'
    }

}

class Game {

    wordProgressElement = document.getElementById(
        'word-progress')
    guessedLettersElement = document.getElementById(
        'guessed-letters')
    badGuessCountElement = document.getElementById(
        'bad-guess-count')

    constructor(id) {
        this.id = id
        this.latestUpdate = {status: 'in progress'}
        this.startGame(id)
    }

    startGame() {
        connectionHandler.deactivate()
        this.resetInterface()
        connectionHandler.activate()
        cmd.print(`You are playing a game in room \'${this.id}\'`, '#77f')
    }

    resetInterface() {
        cmd.clearChat()
        this.wordProgressElement.classList.remove('bad-job')
        document.getElementById(
            'game-room-name').innerText = `Playing in room: ${this.id}`
        cmd.promptElement.innerText = 'Guess a letter: '
    }

    update(latestUpdate) {

        // Run on game reset
        if (this.latestUpdate.gameStatus && this.latestUpdate.gameStatus !==
            'in progress' &&
            latestUpdate.gameStatus === 'in progress') {
            this.resetInterface()
            cmd.print('Let\'s start a new game!')
        }

        this.latestUpdate = latestUpdate
        this.badGuessCountElement.innerText = latestUpdate.badGuessCount
        this.guessedLettersElement.innerText = latestUpdate.lettersGuessed.join(
            ', ')
        this.wordProgressElement.innerText = latestUpdate.wordProgress

        cmd.element.classList.remove('not-ready')

        if (latestUpdate.gameStatus !== 'in progress') {
            cmd.promptElement.innerText = 'Enter command: '
        }
        if (latestUpdate.gameStatus === 'won') {
            cmd.print('WE WON! Starting a new game soon.')
        } else if (latestUpdate.gameStatus === 'lost') {
            this.wordProgressElement.classList.add('bad-job')
            cmd.print('WE LOST... Starting a new game soon.')
        }

    }

    isValidLetter(letter) {
        if (letter.length !== 1) return false
        return /[A-Za-z]/.test(letter)
    }

}

// --------------

let currentUser = new User({userName: 'AnonyMan'})
let currentGame = new Game('flooey')

cmd.element.addEventListener('submit', function (event) {
    event.preventDefault()
    const message = document.getElementById('cmd-input').value
    const command = message.split(' ')[0]
    if (currentGame.latestUpdate.gameStatus !== 'in progress' ||
        cmd.commands.includes(command)) {
        switch (command) {
            case 'clear':
                cmd.clearChat()
                break
            case 'new':
                cmd.joinGame()
                break
            case 'quit':
                cmd.quit()
                break
            default:
                cmd.printHelp()
        }
        cmd.clearInput()
    } else if (currentGame.latestUpdate.gameStatus === 'in progress') {
        if (currentGame.isValidLetter(message)) {
            const body = {user: currentUser, letter: message}
            connectionHandler.publishMessage(`/app/game/${currentGame.id}`, body)
        } else {
            cmd.print(`\'${message}\' is not a valid letter.`)
        }
        cmd.clearInput()
    }
}, true)

// cmd.print('Type \'new\' to start a new game.', '#77f')
// startGame('one')
