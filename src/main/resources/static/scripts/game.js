'use strict'

class Terminal {

    connectionHandler
    currentGame
    currentUser = new User({})
    commands = ['help', 'clear', 'debug', 'quit']
    debug = false
    userListDisplay = true
    element = document.getElementById('cmd')
    elements = {
        chatHistory: document.getElementById('chat-history'),
        gameRoomInfo: document.getElementById('game-room-name'),
        prompt: document.getElementById('cmd-prompt'),
        terminalInput: document.getElementById('cmd-input'),
        terminalInputContainer: document.getElementById('cmd-input-div'),
        userList: document.getElementById('user-list')
    }
    state = 'terminal'
    userInput = null
    colors = new Map().set('green', 'var(--green)').set('red', 'var(--red)')

    constructor() {

        this.connectionHandler = new ConnectionHandler(this)
        this.connectionHandler.activate()

        const urlQuery = new URLSearchParams(window.location.search)
        const gameId = urlQuery.get('game')
        if (!gameId) this.joinGame()
        this.currentGame = new Game(gameId, this)

        if (localStorage.getItem('userName')) setTimeout(() => this.setUserName(localStorage.getItem('userName')), 100)
        else this.promptAsync('Please choose a username:', (userName) => this.setUserName(userName))

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
        const message = this.elements.terminalInput.value
        const command = message.split(' ')[0]
        if (this.state === 'prompting') {
            this.userInput = message
            this.resetInput()
            return
        }
        if (this.currentGame.latestUpdate['gameStatus'] !== 'in progress' ||
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
        } else if (this.currentGame.latestUpdate['gameStatus'] === 'in progress') {
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
        this.elements.prompt.innerText = prompt
        this.elements.terminalInput.scrollIntoView()
        this.elements.terminalInput.focus()

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
        this.elements.chatHistory.insertBefore(messageDiv, this.elements.terminalInputContainer)
        if (this.elements.chatHistory.childNodes.length > 100) {
            this.elements.chatHistory.childNodes[0].remove()
        }
        this.elements.terminalInputContainer.scrollIntoView()
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
        if (this.userListDisplay) this.elements.userList.classList.remove('minimized-y')
        else this.elements.userList.classList.add('minimized-y')
    }
    repopulateUserList = (userList) => {
        this.elements.userList.innerText = userList.map(user => user.userName).join('\n')
    }
    updateState = (state) => {
        if (!['playing', 'terminal', 'prompting'].includes(state)) throw `Cannot update cmd state to ${state}`
        this.state = state
        console.info('changing state to ' + state)

        switch (state) {
            case 'playing':
                this.elements.prompt.innerText = 'Guess a letter: '
                break
            case 'terminal':
                this.elements.prompt.innerText = 'Enter command: '
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
            console.info(`/app/game/${this.currentGame.id}`)
            this.elements.gameRoomInfo.innerText = `Playing as ${this.currentUser.userName} in room \"${this.currentGame.id}\"`

            this.connectionHandler.publishMessage(`/app/game/${this.currentGame.id}`, body)

            // setTimeout(() => this.connectionHandler.publishMessage(`/app/game/${this.currentGame.id}`, body), 10)

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

class ConnectionHandler {

    terminal

    client = new StompJs.Client({
        brokerURL: (location.hostname === 'localhost' ? 'ws://' : 'wss://') + location.host + location.pathname.replace(/\/$/, '') + '/ws',
        debug: (message) => {
            // console.log(message)
        },
        onConnect: () => this.client.subscribe(`/topic/game/${this.terminal.currentGame.id}`, (response) => this.terminal.currentGame.parseServerResponse(response))
    })

    constructor(terminal) {
        this.terminal = terminal
    }

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

    elements = {
        wordProgress: document.getElementById('word-progress'),
        guessedLetters: document.getElementById('guessed-letters'),
        badGuessCount: document.getElementById('bad-guess-count'),

        land: document.getElementById('land'),
        panorama: document.getElementById('panorama'),
        sail: document.getElementById('ship-sail'),
        ship: document.getElementById('ship'),
        waves: document.getElementById('waves')
    }

    constructor(id, terminal) {
        this.id = id
        this.terminal = terminal
        this.start(id)
    }

    start = () => {
        this.terminal.updateState('playing')
        this.resetPanorama()
        this.latestUpdate = {status: 'in progress'}
        this.elements.wordProgress.classList.remove('bad-job')
        this.terminal.print(`You are playing a game in room \"${this.id}\"`, '#99f')
        this.terminal.elements.terminalInput.focus()
    }
    fireCannon = () => {
        const cannonBall = document.createElement('div')
        cannonBall.classList.add('cannon-ball', 'pixel-art')
        cannonBall.style.left = (5 + Math.floor(Math.random() * 90)) + "%"
        this.elements.panorama.insertBefore(cannonBall, this.elements.ship)

        setTimeout(() => {
            cannonBall.parentNode.removeChild(cannonBall)
            const explosion = document.createElement('div')
            explosion.classList.add('explosion', 'pixel-art')
            this.elements.panorama.insertBefore(explosion, this.elements.ship)
            this.elements.ship.classList.add('hit')
            setTimeout(() => {
                explosion.parentNode.removeChild(explosion)
                this.elements.ship.classList.remove('hit')
            }, 600)
        }, 2000)
    }
    winGameAnimation = () => {
        setTimeout(() => {
            this.elements.land.classList.add('approaching-ship')
            setTimeout(() => {
                this.elements.waves.classList.remove('passing')
            }, 4000)
        }, 2000)
    }
    loseGameAnimation = () => {
        let timer = setInterval(() => this.fireCannon(), 2000)
        setTimeout(() => {
            clearInterval(timer)
            timer = setInterval(() => this.fireCannon(), 250)
            this.elements.waves.classList.remove('passing')
            setTimeout(() => {
                clearInterval(timer)
                setTimeout(() => {
                    this.elements.ship.classList.add('sinking')
                    this.elements.sail.classList.add('sinking')
                }, 1000)
            }, 5000)
        }, 5000)
    }
    resetPanorama = () => {
        if (this.elements.ship.classList.contains('sinking')) {
            this.elements.ship.classList.add('resetting')
            this.elements.sail.classList.add('resetting')
            this.elements.ship.classList.remove('sinking')
            this.elements.sail.classList.remove('sinking')
            setTimeout(() => {
                this.elements.ship.classList.remove('resetting')
                this.elements.sail.classList.remove('resetting')
                this.elements.waves.classList.add('passing')
            }, 5000)
        }
        if (this.elements.land.classList.contains('approaching-ship')) {
            this.elements.land.classList.remove('approaching-ship')
            this.elements.land.classList.add('passing')
            this.elements.waves.classList.add('passing')
            setTimeout(() => {
                this.elements.land.classList.remove('passing')
            }, 13000)
        }
    }
    parseServerResponse = (response) => {

        this.terminal.element.classList.remove('not-ready')

        const messageBody = JSON.parse(response.body)
        console.info('receiving:', messageBody)

        if (messageBody.currentUser && (!cmd.currentUser || !cmd.currentUser.colorHSL)) {
            messageBody.currentUser.userName = cmd.currentUser.userName
            cmd.currentUser = new User(messageBody.currentUser)
        }

        if (messageBody.userList) {
            this.terminal.repopulateUserList(messageBody.userList)
        }

        const lastGuess = messageBody['lastGuess']
        const latestUpdate = messageBody.latestUpdate

        if (lastGuess && lastGuess.valid) {
            switch (lastGuess['correct']) {
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
        if (this.latestUpdate['gameStatus'] && this.latestUpdate['gameStatus'] !== 'in progress'
            && latestUpdate['gameStatus'] === 'in progress') {
            this.terminal.updateState('playing')
            this.elements.wordProgress.classList.remove('bad-job')
            this.terminal.print('Let\'s start a new game!')
            this.start()
        }

        this.latestUpdate = latestUpdate
        this.elements.badGuessCount.innerText = latestUpdate.badGuessCount
        this.elements.guessedLetters.innerText = latestUpdate['lettersGuessed'].join(
            ',')
        this.elements.wordProgress.innerText = latestUpdate.wordProgress

        if (latestUpdate['gameStatus'] !== 'in progress') {
            this.terminal.updateState('terminal')
        }
        if (latestUpdate['gameStatus'] === 'won') {
            this.terminal.print('WE WON! Starting a new game soon.')
            this.winGameAnimation()
        } else if (latestUpdate['gameStatus'] === 'lost') {
            this.elements.wordProgress.classList.add('bad-job')
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


