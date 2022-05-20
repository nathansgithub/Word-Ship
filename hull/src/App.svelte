<script>
	import GameInfo from "./interface/GameInfo.svelte";
	import Keyboard from "./interface/Keyboard.svelte";
	import Panorama from "./panorama/Panorama.svelte";
</script>

<main>
	<header>
		<h1>Word Ship</h1>
		<div id="game-room-name">Guess the secret word.</div>
	</header>

	<article>
		<div id="game">
			<Panorama />
			<GameInfo />
		</div>
		<Keyboard />
	</article>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		text-align: center;
		margin: 0 auto;
		min-height: 100vh;
		overflow: auto hidden;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: left;
		flex-wrap: wrap;
		font-weight: 700;
		text-shadow: 2px 2px 1px var(--black);
		line-height: 1.3;
	}

	h1 {
		margin: 0.8rem 1rem;
		text-transform: uppercase;
		font-size: 3rem;
	}

	article {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	#game {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	#game-room-name {
		flex: 1 1 20%;
	}

	@media (min-width: 640px) {
		main {
			max-width: 750px;
		}
	}

	@media (min-height: 560px) {
		main {
		}
	}
</style>
