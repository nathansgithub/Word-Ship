'use strict'

const connectionHandler = {

    client: new StompJs.Client({
        brokerURL: (location.hostname === 'localhost' ? 'ws://' : 'wss://') + location.host + location.pathname.replace(/\/$/, '') + '/ws',
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
        onConnect: function () {
            this.subscribe(`/topic/game/${currentGame.id}`,
                function (message) {

                    const messageBody = JSON.parse(message.body)
                    console.info('receiving:', messageBody)

                    if (messageBody.currentUser && (!currentUser || !currentUser.colorHSL)) {
                        if (currentUser) messageBody.currentUser.userName = currentUser.userName
                        currentUser = new User(messageBody.currentUser)
                    }

                    if (messageBody.userList) {
                        cmd.updateUserList(messageBody.userList)
                    }

                    const lastGuess = messageBody.lastGuess
                    const latestUpdate = messageBody.latestUpdate

                    if (lastGuess && lastGuess.valid) {
                        switch (lastGuess.correct) {
                            case true:
                                cmd.print(`correctly guessed \"${lastGuess.letter}\"`,
                                    cmd.colors.get('green'), lastGuess.user)
                                break
                            case false:
                                cmd.print(`incorrectly guessed \"${lastGuess.letter}\"`,
                                    cmd.colors.get('red'), lastGuess.user)
                                setTimeout(currentGame.fireCannon, Math.floor(Math.random() * 1000))
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

    commands: ['help', 'clear', 'debug', 'quit'], // 'join'
    debug: false,
    userListDisplay: true,
    element: document.getElementById('cmd'),
    promptElement: document.getElementById('cmd-prompt'),
    cmdInputElement: document.getElementById('cmd-input'),
    state: 'terminal',
    userInput: null,
    colors: new Map().set('green', 'var(--green)').set('red', 'var(--red)'),
    toggleDebug: function () {
        cmd.debug = !cmd.debug
        const debuggables = document.getElementsByClassName('debug')
        for (let i = debuggables.length - 1; i >= 0; i--) {
            if (cmd.debug) debuggables[i].classList.remove('hidden')
            else debuggables[i].classList.add('hidden')
        }
    },
    toggleUserList: function () {
        cmd.userListDisplay = !cmd.userListDisplay
        const userList = document.getElementById('user-list')
        if (cmd.userListDisplay) userList.classList.remove('minimized-y')
        else (userList).classList.add('minimized-y')
    },
    updateUserList: function (userList) {
        const userListDiv = document.getElementById('user-list')
        userListDiv.innerText = userList.map(user => user.userName).join('\n')
    },
    updateState: function (state) {
        if (!['guessing', 'terminal', 'prompting'].includes(state)) throw `Cannot update cmd state to ${state}`
        this.state = state
        console.info('changing state to ' + state)

        switch (state) {
            case 'guessing':
                this.promptElement.innerText = 'Guess a letter: '
                break
            case 'terminal':
                this.promptElement.innerText = 'Enter command: '
                break
            case 'prompting':
                break
        }
    },
    print: function (message, color = 'default', user = {}) {
        const chats = document.getElementById('chat-history')
        const messageDiv = document.createElement('div')
        messageDiv.classList.add('chat-history-line')
        messageDiv.style.color = color
        if (Object.keys(user).length > 0) {
            const userTag = document.createElement('span')
            const colorHSL = user.colorHSL
            userTag.style.color = `hsl(${colorHSL[0]}, ${colorHSL[1]}%, ${colorHSL[2]}%)`
            userTag.innerText = user.userName
            userTag.classList.add('user-tag')
            messageDiv.appendChild(userTag)
            message = ' ' + message
        }
        messageDiv.appendChild(document.createTextNode(message))
        const cmdInputDivElement = document.getElementById('cmd-input-div')
        chats.insertBefore(messageDiv, cmdInputDivElement)
        if (chats.childNodes.length > 100) {
            chats.childNodes[0].remove()
        }
        cmdInputDivElement.scrollIntoView()
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
    setUserName: function (userName) {
        localStorage.setItem('userName', userName)
        if (currentUser) currentUser.userName = userName
        else currentUser = new User({userName: userName})
        document.getElementById(
            'game-room-name').innerText = `Playing as ${currentUser.userName} in room \"${gameId}\"`
    },
    promptAsync: function (prompt, callback) {
        if (this.state === 'prompting') return
        const previousState = this.state
        this.updateState('prompting')
        this.promptElement.innerText = prompt
        console.log(this.cmdInputElement)
        this.cmdInputElement.scrollIntoView()
        this.cmdInputElement.focus()

        function loop() {
            if (cmd.userInput) {
                cmd.updateState(previousState)
                callback(cmd.userInput)
                cmd.userInput = null
            } else {
                setTimeout(loop, 0.2)
            }
        }

        loop()
    },
    joinGame: function (id) {
        if (!id) id = 'secret%20club'
        window.location.replace(location.href.replace(location.search, '').replace(/index.html$/, '').replace(/\/$/, '') + '?game=' + id)
    },
    quit: function () {
        this.print('You shrugged and gave up.')
    },
    enterText: function (event) {
        event.preventDefault()
        if (cmd.element.classList.contains('not-ready')) return
        const message = document.getElementById('cmd-input').value
        const command = message.split(' ')[0]
        if (cmd.state === 'prompting') {
            cmd.userInput = message
            cmd.clearInput()
            return
        }
        if (currentGame.latestUpdate.gameStatus !== 'in progress' ||
            cmd.commands.includes(command)) {
            switch (command) {
                case 'clear':
                    cmd.clearChat()
                    break
                case 'debug':
                    cmd.toggleDebug()
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
    }

}

class User {

    userName
    colorHSL
    sessionId

    constructor(object) {
        for (const property in object) {
            if (object.hasOwnProperty(property)) {
                this[property] = object[property]
            }
        }
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
        this.startGame(id)
    }

    startGame() {
        cmd.updateState('guessing')
        this.resetStage()
        if (localStorage.getItem('userName')) cmd.setUserName(localStorage.getItem('userName'))
        else cmd.promptAsync('Please choose a username:', cmd.setUserName)
        this.latestUpdate = {status: 'in progress'}
        connectionHandler.deactivate()
        this.wordProgressElement.classList.remove('bad-job')
        connectionHandler.activate()
        cmd.print(`You are playing a game in room \"${this.id}\"`, '#99f')
        cmd.cmdInputElement.focus()
    }

    fireCannon() {
        const hangedManDiv = document.getElementById('panorama')
        const shipDiv = document.getElementById('ship')
        const cannonBall = document.createElement('div')
        cannonBall.classList.add('cannon-ball', 'pixel-art')
        cannonBall.style.left = (5 + Math.floor(Math.random() * 90)) + "%"
        hangedManDiv.insertBefore(cannonBall, shipDiv)

        setTimeout(function () {
            cannonBall.parentNode.removeChild(cannonBall)
            const explosion = document.createElement('div')
            explosion.classList.add('explosion', 'pixel-art')
            hangedManDiv.insertBefore(explosion, shipDiv)
            shipDiv.classList.add('hit')
            setTimeout(function () {
                explosion.parentNode.removeChild(explosion)
                shipDiv.classList.remove('hit')
            }, 600)
        }, 2000)
    }

    winGameAnimation() {
        const landDiv = document.getElementById('land')
        const waterDiv = document.getElementById('waves')
        setTimeout(function () {
            landDiv.classList.add('approaching-ship')
            setTimeout(function () {
                waterDiv.classList.remove('passing')
            }, 4000)
        }, 2000)
    }

    loseGameAnimation() {
        let timer = setInterval(currentGame.fireCannon, 2000)
        setTimeout(function () {
            clearInterval(timer)
            timer = setInterval(currentGame.fireCannon, 250)
            document.getElementById('waves').classList.remove('passing')
            setTimeout(function () {
                clearInterval(timer)
                setTimeout(function () {
                    document.getElementById('ship').classList.add('sinking')
                    document.getElementById('ship-sail').classList.add('sinking')
                }, 1000)
            }, 5000)
        }, 5000)
    }

    resetStage() {
        const shipDiv = document.getElementById('ship')
        const sailDiv = document.getElementById('ship-sail')
        const landDiv = document.getElementById('land')
        const waterDiv = document.getElementById('waves')
        if (shipDiv.classList.contains('sinking')) {
            shipDiv.classList.add('resetting')
            sailDiv.classList.add('resetting')
            shipDiv.classList.remove('sinking')
            sailDiv.classList.remove('sinking')
            setTimeout(function () {
                shipDiv.classList.remove('resetting')
                sailDiv.classList.remove('resetting')
                waterDiv.classList.add('passing')
            }, 5000)
        }
        if (landDiv.classList.contains('approaching-ship')) {
            landDiv.classList.remove('approaching-ship')
            landDiv.classList.add('passing')
            waterDiv.classList.add('passing')
            setTimeout(function () {
                landDiv.classList.remove('passing')
            }, 13000)
        }
    }

    update(latestUpdate) {

        // Run on game reset
        if (this.latestUpdate.gameStatus && this.latestUpdate.gameStatus !==
            'in progress' &&
            latestUpdate.gameStatus === 'in progress') {
            cmd.updateState('guessing')
            this.wordProgressElement.classList.remove('bad-job')
            cmd.print('Let\'s start a new game!')
            this.startGame()
        }

        this.latestUpdate = latestUpdate
        this.badGuessCountElement.innerText = latestUpdate.badGuessCount
        this.guessedLettersElement.innerText = latestUpdate.lettersGuessed.join(
            ',')
        this.wordProgressElement.innerText = latestUpdate.wordProgress

        cmd.element.classList.remove('not-ready')

        if (latestUpdate.gameStatus !== 'in progress') {
            cmd.updateState('terminal')
        }
        if (latestUpdate.gameStatus === 'won') {
            cmd.print('WE WON! Starting a new game soon.')
            currentGame.winGameAnimation()
        } else if (latestUpdate.gameStatus === 'lost') {
            this.wordProgressElement.classList.add('bad-job')
            cmd.print('WE LOST... Starting a new game soon.')
            currentGame.loseGameAnimation()
        }

    }

    isValidLetter(letter) {
        if (letter.length !== 1) return false
        return /[A-Za-z]/.test(letter)
    }

}

// --------------

const urlQuery = new URLSearchParams(window.location.search)
const gameId = urlQuery.get('game')
if (!gameId) cmd.joinGame()
let currentUser
let currentGame = new Game(gameId)

cmd.element.addEventListener('submit', cmd.enterText, true)

document.getElementById('change-room').addEventListener('click', function () {
    cmd.promptAsync('Enter a new game id or an existing game id to join a game in progress:', cmd.joinGame)
})

document.getElementById('change-name').addEventListener('click', function () {
    cmd.promptAsync('Enter a new name:', cmd.setUserName)
})

document.getElementById('user-list-box').addEventListener('click', cmd.toggleUserList)

document.getElementById('sink-ship').addEventListener('click', currentGame.loseGameAnimation)
document.getElementById('landfall').addEventListener('click', currentGame.winGameAnimation)
document.getElementById('reset-stage').addEventListener('click', currentGame.resetStage)
