<script>
import { onMount } from "svelte";


	export let currentKeyDown;
	export let keyboardKeys = new Map();

	let timer;

	document.addEventListener('keydown', (event) => {
		const charCode = event.key.charCodeAt(0);
		if (charCode < 97 || charCode > 122) return; // Only a-z

		typeLetter(event.key);
	});

	onMount(() => {
		const k = document.getElementById('keyboard').getElementsByTagName('button');
		for (let i = 0; i < k.length; i++) {
			keyboardKeys.set(k[i].innerText.toLowerCase(), k[i]);
		}
	})

	function clickKeyboard(event) {
		if (event.target.tagName !== 'BUTTON') return;

		typeLetter(event.target.innerText);
	}

	function typeLetter(letter) {
		letter = letter.toLowerCase();
		if (currentKeyDown == letter) return;

		console.log(letter);
		currentKeyDown = letter;

		keyboardKeys.get(letter).classList.add('active');
		window.setTimeout(() => {keyboardKeys.get(letter).classList.remove('active')}, 150);

		window.clearTimeout(timer);
		timer = setTimeout(() => {currentKeyDown = null}, 800);
	}
</script>

<main>
	<header>
		<h1>Word Ship</h1>
		<div>Guess the secret word.</div>
	</header>

	<article>
		<div id="panorama">
			:)))
		</div>
		<div id="keyboard" on:click="{clickKeyboard}">
			<div class="keyboard-row">
				<button type="submit">q</button><button>w</button><button>e</button><button>r</button><button>t</button><button>y</button><button>u</button><button>i</button><button>o</button><button>p</button>
			</div>
			<div class="keyboard-row activez">
				<button>a</button><button>s</button><button>d</button><button>f</button><button>g</button><button>h</button><button>j</button><button>k</button><button>l</button>
			</div>
			<div class="keyboard-row">
				<button>z</button><button>x</button><button>c</button><button>v</button><button>b</button><button>n</button><button>m</button>
			</div>
		</div>
	</article>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		margin: 0 auto;
	}

	h1 {
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	#keyboard {
		margin: 0.4rem auto;
		padding: 0.4rem;
		width: fit-content;
		border-radius: 0 0 10px 10px;
		border: 2px solid var(--black);
		background-color: var(--black);
	}

	#keyboard button {
		margin: 1px;
		width: 3rem;
		height: 3rem;
		border-radius: 10px;
		background-color: var(--white);
		color: var(--black);
		font-size: 1rem;
		text-transform: capitalize;
	}

	#keyboard button:hover, #keyboard button:focus {
		border: 2px solid var(--black);
		background-color: var(--secondary-color);
	}

	:global(#keyboard button.active) {
		background-color: var(--secondary-color-dark) !important;
	}

	@media (min-width: 640px) {
		main {
			max-width: 750px;
		}
	}
</style>