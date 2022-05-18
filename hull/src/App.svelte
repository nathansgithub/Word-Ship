<script>
	import Keyboard from "./interface/Keyboard.svelte";
</script>

<main>
	<header>
		<h1>Word Ship</h1>
		<div>Guess the secret word.</div>
	</header>

	<article>
		<div id="panorama">:)))</div>
		<Keyboard />
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

	@media (min-width: 640px) {
		main {
			max-width: 750px;
		}
	}
</style>
