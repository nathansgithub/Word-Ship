<script>
	export let name;
</script>

<main>
	<header>
		<h1>Word Ship</h1>
		<div>Guess the secret word.</div>
	</header>

	<article>
		<div></div>
		<div class="keyboard">
			<div class="keyboard-row">
				<button>q</button><button>w</button><button>e</button><button>r</button><button>t</button><button>y</button><button>u</button><button>i</button><button>o</button><button>p</button>
			</div>
			<div class="keyboard-row">
				<button>a</button><button>s</button><button>d</button><button>f</button><button>g</button><button>h</button><button>j</button><button>k</button><button>l</button>
			</div>
			<div class="keyboard-row">
				<button>z</button><button>x</button><button>c</button><button>v</button><button>b</button><button>n</button><button>m</button>
			</div>
		</div>
	</article>
</main>

<style>
	:root {
		--red: #f55;
		--green: #3c7;
		--water: hsla(199, 46%, 70%, 0.7);
		--black: #333;
		--white: rgb(220, 220, 220);
		--white-fade: rgba(220, 220, 220, 0.65);
		--white-fade-heavy: rgba(220, 220, 220, 0);
		--primary-color: rgb(14, 123, 92);
		--primary-color-fade: rgba(14, 123, 92, 0.3);
		--primary-color-light: rgb(44, 153, 122);
		--secondary-color: rgb(240, 180, 70);
		--secondary-color-dark: rgb(168, 126, 23);
	}

	body {
		line-height: 1.6;
		font-size: 16px;
		font-family: josefin sans, 'sans-serif';
		font-weight: 700;
	}

	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	.keyboard {
		margin: 0.4rem auto;
		padding: 0.4rem;
		width: fit-content;
		border-radius: 10px;
		border: 2px solid var(--black);
		background-color: var(--primary-color-light);
	}

	.keyboard button {
		margin: 1px;
		width: 3rem;
		height: 3rem;
		border-radius: 10px;
		background-color: var(--white);
		color: var(--black);
		font-size: 1rem;
		text-transform: capitalize;
	}

	.keyboard button:hover, .keyboard button:focus {
		border: 2px solid var(--black);
		background-color: var(--secondary-color);
	}

	.keyboard button:active {
		background-color: var(--secondary-color-dark);
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>