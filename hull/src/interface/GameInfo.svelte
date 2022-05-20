<script>
</script>

<div id="game-info">
    <div id="word-progress" />
    <div id="guess-info">
        <div id="bad-guess-count" />
        <div id="guessed-letters" />
    </div>
</div>

<style>
    #game-info {
        padding: 0 0.5em 0.5em 0.5em;
        display: flex;
        flex-direction: column;
        background-image: linear-gradient(
            var(--water-color),
            var(--primary-color)
        );
        transition: all 2s ease;
    }

    #guess-info {
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
        font-family: monospace;
        font-size: 0.9rem;
    }

    #word-progress {
        margin: -1.2rem auto;
        padding: 0.6rem 0.4rem 0.2rem 0.4rem;
        min-width: 6rem;
        font-size: 2.6em;
        font-weight: bold;
        transition: color 1s ease;
        background-color: var(--black);
        line-height: 1.2em;
        border: 4px dashed var(--primary-color);
        border-radius: 10px;
    }

    #word-progress:empty:before {
        content: "-";
    }

    #bad-guess-count::before {
        content: "Wrong: ";
    }

    #guessed-letters::before {
        content: "Guessed: ";
    }

    #word-progress:empty,
    #bad-guess-count:empty,
    #guessed-letters:empty {
        visibility: hidden;
    }

    @media screen and (min-width: 600px) and (min-height: 600px) {
        #game-info {
            padding: 1em;
        }

        #word-progress {
            margin: 0 auto;
        }
    }
</style>
