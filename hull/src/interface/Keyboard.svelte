<script>
    import { onMount } from "svelte";

    let keyboardKeys = new Map();
    let currentKeyDown = null;

    function isValidLetter(str) {
        const charCode = str.charCodeAt(0);
        if (charCode > 96 && charCode < 123) return true;
        false;
    }

    document.addEventListener("keydown", (event) => {
        if (!isValidLetter(event.key)) return;

        typeLetter(event.key.toLowerCase());
    });

    document.addEventListener("keyup", (event) => {
        if (
            !isValidLetter(event.key) ||
            event.key.toLowerCase() == currentKeyDown
        ) {
            currentKeyDown = null;
        }
    });

    onMount(() => {
        const k = document
            .getElementById("keyboard")
            .getElementsByTagName("button");
        for (let i = 0; i < k.length; i++) {
            keyboardKeys.set(k[i].innerText.toLowerCase(), k[i]);
        }
    });

    function clickKeyboard(event) {
        if (event.target.tagName !== "BUTTON") return;

        typeLetter(event.target.innerText);
    }

    function typeLetter(letter) {
        letter = letter.toLowerCase();
        if (currentKeyDown == letter) return;

        console.log(letter);
        currentKeyDown = letter;

        keyboardKeys.get(letter).classList.add("active");
        window.setTimeout(() => {
            keyboardKeys.get(letter).classList.remove("active");
        }, 150);
    }
</script>

<div id="keyboard" on:click={clickKeyboard}>
    <div class="keyboard-row">
        <button type="submit">q</button><button>w</button><button>e</button
        ><button>r</button><button>t</button><button>y</button><button>u</button
        ><button>i</button><button>o</button><button>p</button>
    </div>
    <div class="keyboard-row">
        <div class="keyboard-spacer-2" /><button>a</button><button>s</button><button>d</button><button>f</button
        ><button>g</button><button>h</button><button>j</button><button>k</button
        ><button>l</button><div class="keyboard-spacer-2" />
    </div>
    <div class="keyboard-row">
        <div class="keyboard-spacer-3" /><button>z</button><button>x</button><button>c</button><button>v</button
        ><button>b</button><button>n</button><button>m</button><div class="keyboard-spacer-3" />
    </div>
</div>

<style>
    #keyboard {
        margin: 0.4rem auto;
        padding: 0.4rem 0.1rem;
        max-width: 480px;
        border-radius: 0 0 10px 10px;
        background-color: var(--black);
    }

    .keyboard-row {
        display: flex;
    }

    #keyboard button {
        flex: 1;
        margin: 1px;
        padding: 2px;
        height: 3rem;
        border-radius: 10px;
        background-color: var(--white);
        color: var(--black);
        font-size: 1rem;
        text-transform: capitalize;
    }

    .keyboard-spacer-2 {
        flex: 0.6;
    }

    .keyboard-spacer-3 {
        flex: 1.8;
    }

    #keyboard button:hover,
    #keyboard button:focus {
        background-color: var(--secondary-color-light);
    }

    :global(#keyboard button.active) {
        background-color: var(--secondary-color) !important;
    }

    @media (min-width: 640px) {
		#keyboard {
			padding: 0.4rem;
		}
	}
</style>
