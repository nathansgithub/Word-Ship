'use strict'

class ConnectionHandler {
    client = new StompJs.Client({
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
            this.subscribe(`/topic/game/${cmd.currentGame.id}`, (response) => cmd.currentGame.parseServerResponse(response))
        },

    })
    activate = () => {
        this.client.activate()
    }
    deactivate = () => {
        this.client.deactivate()
    }
    publishMessage = (topic, body) => {
        console.info('sending:', body)
        this.client.publish({destination: topic, body: JSON.stringify(body)})
    }
}

class Terminal {

    connectionHandler = new ConnectionHandler()
    currentGame = undefined
    currentUser = undefined
    commands = ['help', 'clear', 'debug', 'quit']
    debug = false
    userListDisplay = true
    element = document.getElementById('cmd')
    promptElement = document.getElementById('cmd-prompt')
    cmdInputElement = document.getElementById('cmd-input')
    state = 'terminal'
    userInput = null
    colors = new Map().set('green', 'var(--green)').set('red', 'var(--red)')

    constructor() {
        const urlQuery = new URLSearchParams(window.location.search)
        const gameId = urlQuery.get('game')
        if (!gameId) this.joinGame()
        this.currentGame = new Game(gameId, this)

        document.getElementById('sink-ship').addEventListener('click', () => this.currentGame.loseGameAnimation())
        document.getElementById('landfall').addEventListener('click', () => this.currentGame.winGameAnimation())
        document.getElementById('reset-stage').addEventListener('click', () => this.currentGame.resetPanorama())

        this.element.addEventListener('submit', (event) => this.submitText(event), true)
        document.getElementById('change-room').addEventListener('click', () => this.promptAsync('Enter a new game id or an existing game id to join a game in progress:', (id) => cmd.joinGame(id)))
        document.getElementById('change-name').addEventListener('click', () => this.promptAsync('Enter a new username:', (userName) => cmd.setUserName(userName)))
        document.getElementById('user-list-box').addEventListener('click', () => this.toggleUserList())
    }

    toggleDebug = () => {
        this.debug = !this.debug
        const debuggables = document.getElementsByClassName('debug')
        for (let i = debuggables.length - 1; i >= 0; i--) {
            if (this.debug) debuggables[i].classList.remove('hidden')
            else debuggables[i].classList.add('hidden')
        }
    }
    submitText = (event) => {
        event.preventDefault()
        if (this.element.classList.contains('not-ready')) return
        const message = document.getElementById('cmd-input').value
        const command = message.split(' ')[0]
        if (this.state === 'prompting') {
            this.userInput = message
            this.resetInput()
            return
        }
        if (this.currentGame.latestUpdate.gameStatus !== 'in progress' ||
            this.commands.includes(command)) {
            switch (command) {
                case 'clear':
                    this.clear()
                    break
                case 'debug':
                    this.toggleDebug()
                    break
                case 'quit':
                    this.quit()
                    break
                default:
                    this.printHelp()
            }
            this.resetInput()
        } else if (this.currentGame.latestUpdate.gameStatus === 'in progress') {
            if (this.currentGame.isValidLetter(message)) {
                const body = {user: this.currentUser, letter: message}
                this.connectionHandler.publishMessage(`/app/game/${this.currentGame.id}`, body)
            } else {
                this.print(`\'${message}\' is not a valid letter.`)
            }
            this.resetInput()
        }
    }
    promptAsync = (prompt, callback) => {
        if (this.state === 'prompting') return
        const previousState = this.state
        this.updateState('prompting')
        this.promptElement.innerText = prompt
        this.cmdInputElement.scrollIntoView()
        this.cmdInputElement.focus()

        const loop = () => {
            if (this.userInput) {
                this.updateState(previousState)
                callback(this.userInput)
                this.userInput = null
            } else {
                setTimeout(() => loop(), 0.2)
            }
        }

        loop()
    }
    print = (message, color = 'default', user = {}) => {
        const previousLines = document.getElementById('chat-history')
        const messageDiv = document.createElement('div')
        messageDiv.classList.add('chat-history-line')
        messageDiv.style.color = color
        if (Object.keys(user).length > 0) {
            const userTag = document.createElement('span')
            if (user.colorHSL) {
                const colorHSL = user.colorHSL
                userTag.style.color = `hsl(${colorHSL[0]}, ${colorHSL[1]}%, ${colorHSL[2]}%)`
            }
            userTag.innerText = user.userName
            userTag.classList.add('user-tag')
            messageDiv.appendChild(userTag)
            message = ' ' + message
        }
        messageDiv.appendChild(document.createTextNode(message))
        const cmdInputDivElement = document.getElementById('cmd-input-div')
        previousLines.insertBefore(messageDiv, cmdInputDivElement)
        if (previousLines.childNodes.length > 100) {
            previousLines.childNodes[0].remove()
        }
        cmdInputDivElement.scrollIntoView()
    }
    clear = () => {
        const lines = document.getElementsByClassName('chat-history-line')
        for (let i = lines.length - 1; i >= 0; i--) {
            lines[i].parentNode.removeChild(lines[i])
        }
    }
    resetInput = () => {
        document.getElementById('cmd-form').reset()
    }
    toggleUserList = () => {
        this.userListDisplay = !this.userListDisplay
        const userList = document.getElementById('user-list')
        if (this.userListDisplay) userList.classList.remove('minimized-y')
        else (userList).classList.add('minimized-y')
    }
    repopulateUserList = (userList) => {
        const userListDiv = document.getElementById('user-list')
        userListDiv.innerText = userList.map(user => user.userName).join('\n')
    }
    updateState = (state) => {
        if (!['playing', 'terminal', 'prompting'].includes(state)) throw `Cannot update cmd state to ${state}`
        this.state = state
        console.info('changing state to ' + state)

        switch (state) {
            case 'playing':
                this.promptElement.innerText = 'Guess a letter: '
                break
            case 'terminal':
                this.promptElement.innerText = 'Enter command: '
                break
            case 'prompting':
                break
        }
    }
    setUserName = (userName) => {
        localStorage.setItem('userName', userName)
        if (this.currentUser) this.currentUser.userName = userName
        else this.currentUser = new User({userName: userName})

        if (this.currentGame) {
            const body = {user: this.currentUser}
            this.connectionHandler.publishMessage(`/app/game/${this.currentGame.id}`, body)
            document.getElementById(
                'game-room-name').innerText = `Playing as ${this.currentUser.userName} in room \"${this.currentGame.id}\"`
        }
    }
    joinGame = (id) => {
        if (!id) id = 'secret%20club'
        window.location.replace(location.href.replace(location.search, '').replace(/index.html$/, '').replace(/\/$/, '') + '?game=' + id)
    }
    printHelp = () => {
        this.print(`Valid commands are: ${this.commands.join(', ')}`)
    }
    quit = () => {
        this.print('You shrugged and gave up.')
    }

}

class User {
    userName
    colorHSL

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

    constructor(id, terminal) {
        this.id = id
        this.terminal = terminal
        this.start(id)
    }

    start = () => {
        this.terminal.updateState('playing')
        this.resetPanorama()
        if (localStorage.getItem('userName')) this.terminal.setUserName(localStorage.getItem('userName'))
        else this.terminal.promptAsync('Please choose a username:', (userName) => this.terminal.setUserName(userName))
        this.latestUpdate = {status: 'in progress'}
        this.terminal.connectionHandler.deactivate()
        this.wordProgressElement.classList.remove('bad-job')
        this.terminal.connectionHandler.activate()
        this.terminal.print(`You are playing a game in room \"${this.id}\"`, '#99f')
        this.terminal.cmdInputElement.focus()
    }
    fireCannon = () => {
        const hangedManDiv = document.getElementById('panorama')
        const shipDiv = document.getElementById('ship')
        const cannonBall = document.createElement('div')
        cannonBall.classList.add('cannon-ball', 'pixel-art')
        cannonBall.style.left = (5 + Math.floor(Math.random() * 90)) + "%"
        hangedManDiv.insertBefore(cannonBall, shipDiv)

        setTimeout(() => {
            cannonBall.parentNode.removeChild(cannonBall)
            const explosion = document.createElement('div')
            explosion.classList.add('explosion', 'pixel-art')
            hangedManDiv.insertBefore(explosion, shipDiv)
            shipDiv.classList.add('hit')
            setTimeout(() => {
                explosion.parentNode.removeChild(explosion)
                shipDiv.classList.remove('hit')
            }, 600)
        }, 2000)
    }
    winGameAnimation = () => {
        const landDiv = document.getElementById('land')
        const waterDiv = document.getElementById('waves')
        setTimeout(() => {
            landDiv.classList.add('approaching-ship')
            setTimeout(() => {
                waterDiv.classList.remove('passing')
            }, 4000)
        }, 2000)
    }
    loseGameAnimation = () => {
        let timer = setInterval(() => this.fireCannon(), 2000)
        setTimeout(() => {
            clearInterval(timer)
            timer = setInterval(() => this.fireCannon(), 250)
            document.getElementById('waves').classList.remove('passing')
            setTimeout(() => {
                clearInterval(timer)
                setTimeout(() => {
                    document.getElementById('ship').classList.add('sinking')
                    document.getElementById('ship-sail').classList.add('sinking')
                }, 1000)
            }, 5000)
        }, 5000)
    }
    resetPanorama = () => {
        const shipDiv = document.getElementById('ship')
        const sailDiv = document.getElementById('ship-sail')
        const landDiv = document.getElementById('land')
        const waterDiv = document.getElementById('waves')
        if (shipDiv.classList.contains('sinking')) {
            shipDiv.classList.add('resetting')
            sailDiv.classList.add('resetting')
            shipDiv.classList.remove('sinking')
            sailDiv.classList.remove('sinking')
            setTimeout(() => {
                shipDiv.classList.remove('resetting')
                sailDiv.classList.remove('resetting')
                waterDiv.classList.add('passing')
            }, 5000)
        }
        if (landDiv.classList.contains('approaching-ship')) {
            landDiv.classList.remove('approaching-ship')
            landDiv.classList.add('passing')
            waterDiv.classList.add('passing')
            setTimeout(() => {
                landDiv.classList.remove('passing')
            }, 13000)
        }
    }
    parseServerResponse = (response) => {

        const messageBody = JSON.parse(response.body)
        console.info('receiving:', messageBody)

        if (messageBody.currentUser && (!cmd.currentUser || !cmd.currentUser.colorHSL)) {
            messageBody.currentUser.userName = cmd.currentUser.userName
            cmd.currentUser = new User(messageBody.currentUser)
        }

        if (messageBody.userList) {
            this.terminal.repopulateUserList(messageBody.userList)
        }

        const lastGuess = messageBody.lastGuess
        const latestUpdate = messageBody.latestUpdate

        if (lastGuess && lastGuess.valid) {
            switch (lastGuess.correct) {
                case true:
                    this.terminal.print(`correctly guessed \"${lastGuess.letter}\"`,
                        this.terminal.colors.get('green'), lastGuess.user)
                    break
                case false:
                    this.terminal.print(`incorrectly guessed \"${lastGuess.letter}\"`,
                        this.terminal.colors.get('red'), lastGuess.user)
                    setTimeout(() => this.fireCannon(), Math.floor(Math.random() * 1000))
                    break
            }
        }

        if (latestUpdate) {
            this.update(latestUpdate)
        }
    }
    update = (latestUpdate) => {

        // Run on game reset
        if (this.latestUpdate.gameStatus && this.latestUpdate.gameStatus !==
            'in progress' &&
            latestUpdate.gameStatus === 'in progress') {
            this.terminal.updateState('playing')
            this.wordProgressElement.classList.remove('bad-job')
            this.terminal.print('Let\'s start a new game!')
            this.start()
        }

        this.latestUpdate = latestUpdate
        this.badGuessCountElement.innerText = latestUpdate.badGuessCount
        this.guessedLettersElement.innerText = latestUpdate.lettersGuessed.join(
            ',')
        this.wordProgressElement.innerText = latestUpdate.wordProgress

        this.terminal.element.classList.remove('not-ready')

        if (latestUpdate.gameStatus !== 'in progress') {
            this.terminal.updateState('terminal')
        }
        if (latestUpdate.gameStatus === 'won') {
            this.terminal.print('WE WON! Starting a new game soon.')
            this.winGameAnimation()
        } else if (latestUpdate.gameStatus === 'lost') {
            this.wordProgressElement.classList.add('bad-job')
            this.terminal.print('WE LOST... Starting a new game soon.')
            this.loseGameAnimation()
        }

    }
    isValidLetter = (letter) => {
        if (letter.length !== 1) return false
        return /[A-Za-z]/.test(letter)
    }

}

const cmd = new Terminal()


