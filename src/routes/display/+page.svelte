<script>
	import { onMount, onDestroy } from 'svelte';
	import { angebote, loading, subscribeToFerienplan, getRelevantDates } from '$lib/stores/ferienplan';

	let unsubscribe;
	let currentTime = new Date();
	let timeInterval;
	let darkMode = false;
	let autoScroll = false;
	let scrollInterval;
	let currentScrollIndex = 0;

	onMount(() => {
		// Subscribe to Supabase Realtime
		subscribeToFerienplan().then(unsub => {
			unsubscribe = unsub;
		});

		// Aktualisiere Uhrzeit jede Minute
		timeInterval = setInterval(() => {
			currentTime = new Date();
		}, 60000);

		// Dark Mode aus localStorage laden
		const savedDarkMode = localStorage.getItem('darkMode');
		if (savedDarkMode === 'true') {
			darkMode = true;
		}

		// AutoScroll aus localStorage laden
		const savedAutoScroll = localStorage.getItem('autoScroll');
		if (savedAutoScroll === 'true') {
			autoScroll = true;
			startAutoScroll();
		}
	});

	onDestroy(() => {
		if (unsubscribe) unsubscribe();
		if (timeInterval) clearInterval(timeInterval);
		if (scrollInterval) clearInterval(scrollInterval);
	});

	function toggleDarkMode() {
		darkMode = !darkMode;
		localStorage.setItem('darkMode', darkMode.toString());
	}

	function toggleAutoScroll() {
		autoScroll = !autoScroll;
		localStorage.setItem('autoScroll', autoScroll.toString());

		if (autoScroll) {
			startAutoScroll();
		} else {
			stopAutoScroll();
		}
	}

	function startAutoScroll() {
		currentScrollIndex = 0;
		scrollInterval = setInterval(() => {
			const allCards = document.querySelectorAll('.angebot-card');
			if (allCards.length > 0) {
				currentScrollIndex = (currentScrollIndex + 1) % allCards.length;
				allCards[currentScrollIndex]?.scrollIntoView({
					behavior: 'smooth',
					block: 'center'
				});
			}
		}, 5000); // Scroll alle 5 Sekunden
	}

	function stopAutoScroll() {
		if (scrollInterval) {
			clearInterval(scrollInterval);
			scrollInterval = null;
		}
	}

	$: dates = getRelevantDates();
	$: heuteAngebote = Object.entries($angebote[dates.heute] || {})
		.filter(([_, angebot]) => angebot && angebot.sichtbar)
		.sort((a, b) => (a[1].uhrzeit || '').localeCompare(b[1].uhrzeit || ''));
	
	$: morgenAngebote = Object.entries($angebote[dates.morgen] || {})
		.filter(([_, angebot]) => angebot && angebot.sichtbar)
		.sort((a, b) => (a[1].uhrzeit || '').localeCompare(b[1].uhrzeit || ''));

	function formatTime(date) {
		return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
	}

	function formatDateString(dateStr) {
		const date = new Date(dateStr + 'T00:00:00');
		const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
		const day = days[date.getDay()];
		const dateNum = date.getDate();
		const month = date.getMonth() + 1;
		return `${day}, ${dateNum}.${month}.`;
	}
</script>

<div class="display-container" class:dark-mode={darkMode}>
	{#if $loading}
		<div class="loading">
			<div class="spinner"></div>
			<p>Lade Ferienplan...</p>
		</div>
	{:else}
		<header>
			<div class="header-content">
				<h1>🌞 Ferienplan 🌞</h1>
				<div class="header-controls">
					<button class="control-btn" on:click={toggleDarkMode} title="Dark Mode umschalten">
						{darkMode ? '☀️' : '🌙'}
					</button>
					<button class="control-btn" on:click={toggleAutoScroll} class:active={autoScroll} title="Auto-Scroll umschalten">
						{autoScroll ? '⏸️' : '▶️'}
					</button>
					<div class="current-time">{formatTime(currentTime)}</div>
				</div>
			</div>
		</header>

		<main>
			<div class="days-container">
				<!-- HEUTE -->
				<section class="day-section heute">
					<div class="day-header">
						<h2>Heute</h2>
						<p class="date">{formatDateString(dates.heute)}</p>
					</div>
					
					<div class="angebote-grid">
						{#if heuteAngebote.length === 0}
							<div class="no-angebote">
								<p>Heute keine Angebote geplant</p>
								<span class="emoji">🏖️</span>
							</div>
						{:else}
							{#each heuteAngebote as [id, angebot]}
								<div class="angebot-card">
									{#if angebot.bild_url}
										<div class="angebot-image">
											<img src={angebot.bild_url} alt={angebot.titel} />
										</div>
									{/if}
									
									<div class="angebot-content">
										<h3>{angebot.titel}</h3>
										
										{#if angebot.beschreibung}
											<p class="beschreibung">{angebot.beschreibung}</p>
										{/if}
										
										<div class="angebot-details">
											{#if angebot.uhrzeit}
												<div class="detail">
													<span class="icon">🕐</span>
													<span>{angebot.uhrzeit} Uhr</span>
												</div>
											{/if}
											
											{#if angebot.ort}
												<div class="detail">
													<span class="icon">📍</span>
													<span>{angebot.ort}</span>
												</div>
											{/if}
											
											{#if angebot.betreuer}
												<div class="detail">
													<span class="icon">👤</span>
													<span>{angebot.betreuer}</span>
												</div>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</section>

				<!-- MORGEN -->
				<section class="day-section morgen">
					<div class="day-header">
						<h2>Morgen</h2>
						<p class="date">{formatDateString(dates.morgen)}</p>
					</div>
					
					<div class="angebote-grid">
						{#if morgenAngebote.length === 0}
							<div class="no-angebote">
								<p>Morgen keine Angebote geplant</p>
								<span class="emoji">🌅</span>
							</div>
						{:else}
							{#each morgenAngebote as [id, angebot]}
								<div class="angebot-card">
									{#if angebot.bild_url}
										<div class="angebot-image">
											<img src={angebot.bild_url} alt={angebot.titel} />
										</div>
									{/if}
									
									<div class="angebot-content">
										<h3>{angebot.titel}</h3>
										
										{#if angebot.beschreibung}
											<p class="beschreibung">{angebot.beschreibung}</p>
										{/if}
										
										<div class="angebot-details">
											{#if angebot.uhrzeit}
												<div class="detail">
													<span class="icon">🕐</span>
													<span>{angebot.uhrzeit} Uhr</span>
												</div>
											{/if}
											
											{#if angebot.ort}
												<div class="detail">
													<span class="icon">📍</span>
													<span>{angebot.ort}</span>
												</div>
											{/if}
											
											{#if angebot.betreuer}
												<div class="detail">
													<span class="icon">👤</span>
													<span>{angebot.betreuer}</span>
												</div>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</section>
			</div>
		</main>
	{/if}
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		overflow-x: hidden;
		transition: background 0.3s ease;
	}

	.display-container {
		min-height: 100vh;
		color: white;
		transition: color 0.3s ease;
	}

	/* Dark Mode */
	.display-container.dark-mode :global(body) {
		background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
	}

	.display-container.dark-mode {
		background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
	}

	.dark-mode .angebot-card {
		background: rgba(30, 30, 50, 0.95) !important;
		color: #e0e0e0 !important;
	}

	.dark-mode .angebot-content h3 {
		color: #ffffff !important;
	}

	.dark-mode .beschreibung {
		color: #b0b0b0 !important;
	}

	.dark-mode .detail {
		color: #e0e0e0 !important;
	}

	.dark-mode .day-section {
		background: rgba(30, 30, 50, 0.3) !important;
		border-color: rgba(255, 255, 255, 0.1) !important;
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
		gap: 2rem;
	}

	.spinner {
		width: 80px;
		height: 80px;
		border: 8px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	header {
		background: rgba(0, 0, 0, 0.3);
		padding: 2rem 4rem;
		backdrop-filter: blur(10px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		max-width: 1800px;
		margin: 0 auto;
	}

	.header-controls {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.control-btn {
		background: rgba(255, 255, 255, 0.2);
		border: 2px solid rgba(255, 255, 255, 0.3);
		color: white;
		font-size: 2rem;
		width: 60px;
		height: 60px;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.3s ease;
		backdrop-filter: blur(10px);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.control-btn:hover {
		background: rgba(255, 255, 255, 0.3);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.control-btn.active {
		background: rgba(76, 175, 80, 0.4);
		border-color: rgba(76, 175, 80, 0.6);
		box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
	}

	h1 {
		margin: 0;
		font-size: 4rem;
		font-weight: 700;
		text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
	}

	.current-time {
		font-size: 3rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
	}

	main {
		padding: 3rem 4rem;
		max-width: 1800px;
		margin: 0 auto;
	}

	.days-container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 3rem;
	}

	.day-section {
		background: rgba(255, 255, 255, 0.15);
		border-radius: 24px;
		padding: 2.5rem;
		backdrop-filter: blur(10px);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		border: 2px solid rgba(255, 255, 255, 0.2);
	}

	.heute {
		border-left: 8px solid #ffd700;
	}

	.morgen {
		border-left: 8px solid #87ceeb;
	}

	.day-header {
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 2px solid rgba(255, 255, 255, 0.3);
	}

	.day-header h2 {
		margin: 0 0 0.5rem 0;
		font-size: 3rem;
		font-weight: 700;
		text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.3);
	}

	.day-header .date {
		margin: 0;
		font-size: 1.8rem;
		opacity: 0.9;
		font-weight: 500;
	}

	.angebote-grid {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.no-angebote {
		text-align: center;
		padding: 4rem 2rem;
		opacity: 0.8;
	}

	.no-angebote p {
		font-size: 2rem;
		margin: 0 0 1rem 0;
	}

	.no-angebote .emoji {
		font-size: 5rem;
		display: block;
	}

	.angebot-card {
		background: rgba(255, 255, 255, 0.95);
		border-radius: 16px;
		overflow: hidden;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		transition: transform 0.2s;
		color: #333;
	}

	.angebot-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
	}

	.angebot-image {
		width: 100%;
		height: 250px;
		overflow: hidden;
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
	}

	.angebot-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.angebot-content {
		padding: 2rem;
	}

	.angebot-content h3 {
		margin: 0 0 1rem 0;
		font-size: 2.2rem;
		color: #2d3748;
		font-weight: 700;
	}

	.beschreibung {
		margin: 0 0 1.5rem 0;
		font-size: 1.6rem;
		color: #4a5568;
		line-height: 1.6;
	}

	.angebot-details {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.detail {
		display: flex;
		align-items: center;
		gap: 1rem;
		font-size: 1.6rem;
		color: #2d3748;
		font-weight: 500;
	}

	.detail .icon {
		font-size: 2rem;
		min-width: 2.5rem;
		text-align: center;
	}

	@media (max-width: 1400px) {
		.days-container {
			grid-template-columns: 1fr;
		}
	}
</style>
