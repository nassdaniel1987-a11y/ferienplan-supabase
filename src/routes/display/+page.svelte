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
	let showSettings = false;
	let isFullscreen = false;

	// AutoScroll Einstellungen
	let scrollSpeed = 5000; // Millisekunden
	let scrollDirection = 'vertical'; // vertical, horizontal
	let scrollMode = 'all'; // all, heute, morgen
	let scrollType = 'continuous'; // continuous oder cards

	onMount(async () => {
		// Subscribe to Supabase Realtime
		try {
			unsubscribe = await subscribeToFerienplan();
			console.log('✅ Realtime Subscription aktiv');
		} catch (error) {
			console.error('❌ Realtime Fehler:', error);
		}

		// Aktualisiere Uhrzeit jede Minute
		timeInterval = setInterval(() => {
			currentTime = new Date();
		}, 60000);

		// Einstellungen aus localStorage laden (nur im Browser!)
		if (typeof window !== 'undefined') {
			darkMode = localStorage.getItem('darkMode') === 'true';
			autoScroll = localStorage.getItem('autoScroll') === 'true';
			scrollSpeed = parseInt(localStorage.getItem('scrollSpeed') || '5000');
			scrollDirection = localStorage.getItem('scrollDirection') || 'vertical';
			scrollMode = localStorage.getItem('scrollMode') || 'all';
			scrollType = localStorage.getItem('scrollType') || 'continuous';

			// iPad Detection - füge CSS Klasse hinzu
			const isIPad = navigator.userAgent.includes('iPad') ||
			               (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1);
			if (isIPad) {
				document.body.classList.add('is-ipad');
				console.log('📱 iPad erkannt - verwende iPad-optimierte Größen');
			}

			if (autoScroll) {
				startAutoScroll();
			}

			// Fullscreen Event Listener
			document.addEventListener('fullscreenchange', handleFullscreenChange);
			document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
		}
	});

	onDestroy(() => {
		if (unsubscribe) unsubscribe();
		if (timeInterval) clearInterval(timeInterval);
		if (scrollInterval) clearInterval(scrollInterval);

		if (typeof window !== 'undefined') {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
			document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
		}
	});

	function handleFullscreenChange() {
		isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
	}

	function toggleFullscreen() {
		if (!document.fullscreenElement && !document.webkitFullscreenElement) {
			// Enter fullscreen
			const elem = document.documentElement;
			if (elem.requestFullscreen) {
				elem.requestFullscreen();
			} else if (elem.webkitRequestFullscreen) {
				elem.webkitRequestFullscreen();
			}
		} else {
			// Exit fullscreen
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
			}
		}
	}

	function toggleDarkMode() {
		darkMode = !darkMode;
		if (typeof window !== 'undefined') {
			localStorage.setItem('darkMode', darkMode.toString());
		}
	}

	function toggleAutoScroll() {
		autoScroll = !autoScroll;
		console.log('🔄 AutoScroll Toggle:', autoScroll ? 'AN' : 'AUS');
		if (typeof window !== 'undefined') {
			localStorage.setItem('autoScroll', autoScroll.toString());
		}

		if (autoScroll) {
			console.log('▶️ Starte AutoScroll...');
			startAutoScroll();
		} else {
			console.log('⏹️ Stoppe AutoScroll...');
			stopAutoScroll();
		}
	}

	function startAutoScroll() {
		if (typeof window === 'undefined') return;

		console.log('🚀 startAutoScroll aufgerufen, Typ:', scrollType);
		stopAutoScroll(); // Clear existing interval
		currentScrollIndex = 0;

		if (scrollType === 'continuous') {
			// Kontinuierliches, sanftes Scrollen
			console.log('→ Rufe startContinuousScroll auf...');
			startContinuousScroll();
		} else {
			// Karten-basiertes Scrollen
			console.log('→ Rufe startCardScroll auf...');
			startCardScroll();
		}
	}

	function startContinuousScroll() {
		const scrollContainer = document.querySelector('main');
		if (!scrollContainer) {
			console.warn('⚠️ Scroll-Container nicht gefunden');
			return;
		}

		// WICHTIG: Deaktiviere smooth scrolling während AutoScroll
		const originalScrollBehavior = scrollContainer.style.scrollBehavior;
		scrollContainer.style.scrollBehavior = 'auto';

		let isPaused = false;
		let lastTimestamp = 0;
		let accumulatedScroll = 0; // Akkumuliere Sub-Pixel Werte

		// Schnellere Basis-Geschwindigkeit: 20-100 px/s je nach scrollSpeed Setting
		// scrollSpeed: 2000ms (schnell) → 50 px/s
		// scrollSpeed: 8000ms (mittel) → 12.5 px/s
		// scrollSpeed: 15000ms (langsam) → 6.7 px/s
		const pixelsPerSecond = Math.max(10, 100 / (scrollSpeed / 1000));

		console.log('🎬 Starte kontinuierliches Scrollen (iOS-kompatibel mit RAF)');
		console.log('⚡ Scroll-Geschwindigkeit:', scrollSpeed, 'ms →', pixelsPerSecond.toFixed(2), 'px/s');
		console.log('📏 Container Höhe:', scrollContainer.scrollHeight);
		console.log('📐 Sichtbare Höhe:', scrollContainer.clientHeight);
		console.log('📊 Scrollbare Distanz:', scrollContainer.scrollHeight - scrollContainer.clientHeight);
		console.log('🍎 User Agent:', navigator.userAgent.includes('iPad') ? 'iPad' : navigator.userAgent.includes('iPhone') ? 'iPhone' : 'Anderes Gerät');

		let frameCount = 0;
		function animate(timestamp) {
			if (!lastTimestamp) {
				lastTimestamp = timestamp;
				console.log('🎞️ Erste Animation Frame gestartet');
			}
			const deltaTime = timestamp - lastTimestamp;
			lastTimestamp = timestamp;

			frameCount++;
			if (frameCount % 60 === 0) { // Log alle 60 Frames (ca. 1 Sekunde)
				console.log(`📊 Frame ${frameCount}: scrollTop=${scrollContainer.scrollTop.toFixed(1)}, accumulated=${accumulatedScroll.toFixed(3)}, deltaTime=${deltaTime.toFixed(1)}ms`);
			}

			if (!isPaused) {
				const currentScroll = scrollContainer.scrollTop;
				const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;

				if (currentScroll >= maxScroll - 10) { // 10px Toleranz
					// Am Ende angekommen - Pause und zurück nach oben
					console.log('🔄 Ende erreicht - Pause und zurück zum Anfang');
					isPaused = true;

					setTimeout(() => {
						scrollContainer.scrollTop = 0;
						accumulatedScroll = 0;
						console.log('⬆️ Zurück zum Anfang gesprungen');

						setTimeout(() => {
							isPaused = false;
							lastTimestamp = 0;
							console.log('▶️ Scrollen fortgesetzt');
						}, 2000); // 2 Sekunden Pause oben
					}, 1000); // 1 Sekunde Pause am Ende
				} else {
					// Berechne scroll basierend auf verstrichener Zeit
					const scrollAmount = (pixelsPerSecond * deltaTime) / 1000;
					accumulatedScroll += scrollAmount;

					// Nur scrollen wenn wir mindestens 1 ganzen Pixel haben
					if (accumulatedScroll >= 1) {
						const pixelsToScroll = Math.floor(accumulatedScroll);
						scrollContainer.scrollTop = currentScroll + pixelsToScroll;
						accumulatedScroll -= pixelsToScroll; // Behalte Rest für nächstes Mal
					}
				}
			}

			// Speichere die ID in globaler Variable UND fordere nächsten Frame an
			scrollInterval = requestAnimationFrame(animate);
		}

		// Cleanup-Funktion um scroll-behavior wiederherzustellen
		const originalStopAutoScroll = window.stopAutoScrollCleanup;
		window.stopAutoScrollCleanup = () => {
			scrollContainer.style.scrollBehavior = originalScrollBehavior;
			if (originalStopAutoScroll) originalStopAutoScroll();
		};

		// Starte die Animation
		scrollInterval = requestAnimationFrame(animate);
	}

	function startCardScroll() {
		console.log('🎴 Starte Karten-basiertes Scrollen');
		console.log('📋 Scroll-Modus:', scrollMode);
		console.log('⏱️ Geschwindigkeit:', scrollSpeed, 'ms');

		scrollInterval = setInterval(() => {
			let cards;

			if (scrollMode === 'heute') {
				cards = document.querySelectorAll('.day-section.heute .angebot-card');
			} else if (scrollMode === 'morgen') {
				cards = document.querySelectorAll('.day-section.morgen .angebot-card');
			} else {
				cards = document.querySelectorAll('.angebot-card');
			}

			if (cards.length > 0) {
				currentScrollIndex = (currentScrollIndex + 1) % cards.length;
				console.log(`➡️ Scrolle zu Karte ${currentScrollIndex + 1}/${cards.length}`);
				cards[currentScrollIndex]?.scrollIntoView({
					behavior: 'smooth',
					block: 'center'
				});
			} else {
				console.warn('⚠️ Keine Karten gefunden zum Scrollen');
			}
		}, scrollSpeed);
	}

	function stopAutoScroll() {
		if (scrollInterval) {
			// Unterstütze beide: RAF und Interval (für Card-Modus)
			if (scrollType === 'continuous') {
				cancelAnimationFrame(scrollInterval);
				// Stelle scroll-behavior wieder her
				if (typeof window !== 'undefined' && window.stopAutoScrollCleanup) {
					window.stopAutoScrollCleanup();
				}
			} else {
				clearInterval(scrollInterval);
			}
			scrollInterval = null;
			console.log('⏹️ AutoScroll gestoppt');
		}
	}

	function updateScrollSpeed(newSpeed) {
		scrollSpeed = newSpeed;
		if (typeof window !== 'undefined') {
			localStorage.setItem('scrollSpeed', scrollSpeed.toString());
		}
		if (autoScroll) {
			startAutoScroll();
		}
	}

	function updateScrollMode(newMode) {
		scrollMode = newMode;
		if (typeof window !== 'undefined') {
			localStorage.setItem('scrollMode', scrollMode);
		}
		currentScrollIndex = 0;
		if (autoScroll) {
			startAutoScroll();
		}
	}

	function updateScrollType(newType) {
		scrollType = newType;
		if (typeof window !== 'undefined') {
			localStorage.setItem('scrollType', scrollType);
		}
		if (autoScroll) {
			startAutoScroll();
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
					<button class="control-btn" on:click={toggleDarkMode} title="Dark Mode">
						{darkMode ? '☀️' : '🌙'}
					</button>
					<button class="control-btn" on:click={toggleAutoScroll} class:active={autoScroll} title="Auto-Scroll">
						{autoScroll ? '⏸️' : '▶️'}
					</button>
					<button class="control-btn" on:click={() => showSettings = !showSettings} class:active={showSettings} title="Einstellungen">
						⚙️
					</button>
					<button class="control-btn" on:click={toggleFullscreen} class:active={isFullscreen} title="Vollbild">
						{isFullscreen ? '🗗' : '⛶'}
					</button>
					<div class="current-time">{formatTime(currentTime)}</div>
				</div>
			</div>
		</header>

		<!-- Einstellungsmenü -->
		{#if showSettings}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div class="settings-overlay" on:click={() => showSettings = false}>
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
				<div class="settings-panel" role="dialog" aria-modal="true" on:click|stopPropagation>
					<div class="settings-header">
						<h2>⚙️ Einstellungen</h2>
						<button class="close-btn" on:click={() => showSettings = false}>✕</button>
					</div>

					<div class="settings-content">
						<!-- Auto-Scroll Geschwindigkeit -->
						<div class="setting-group">
							<label for="scroll-speed">
								<span class="setting-label">🏃 Scroll-Geschwindigkeit</span>
								<span class="setting-value">{scrollSpeed / 1000}s</span>
							</label>
							<input
								id="scroll-speed"
								type="range"
								min="2000"
								max="15000"
								step="1000"
								bind:value={scrollSpeed}
								on:change={() => updateScrollSpeed(scrollSpeed)}
								class="slider"
							/>
							<div class="slider-labels">
								<span>Schnell (2s)</span>
								<span>Langsam (15s)</span>
							</div>
						</div>

						<!-- Scroll-Art -->
						<div class="setting-group">
							<span class="setting-label">🎬 Scroll-Art</span>
							<div class="button-group-2">
								<button
									class="option-btn"
									class:active={scrollType === 'continuous'}
									on:click={() => updateScrollType('continuous')}
								>
									Kontinuierlich (sanft)
								</button>
								<button
									class="option-btn"
									class:active={scrollType === 'cards'}
									on:click={() => updateScrollType('cards')}
								>
									Karten-Navigation
								</button>
							</div>
						</div>

						<!-- Scroll-Modus (nur für Karten-Modus) -->
						{#if scrollType === 'cards'}
							<div class="setting-group">
								<span class="setting-label">📋 Scroll-Bereich</span>
								<div class="button-group">
									<button
										class="option-btn"
										class:active={scrollMode === 'all'}
										on:click={() => updateScrollMode('all')}
									>
										Alle
									</button>
									<button
										class="option-btn"
										class:active={scrollMode === 'heute'}
										on:click={() => updateScrollMode('heute')}
									>
										Nur Heute
									</button>
									<button
										class="option-btn"
										class:active={scrollMode === 'morgen'}
										on:click={() => updateScrollMode('morgen')}
									>
										Nur Morgen
									</button>
								</div>
							</div>
						{/if}

						<!-- Tipps für iPad/TV -->
						<div class="setting-group tips">
							<h3>💡 Tipps für iPad → TV Streaming</h3>
							<ul>
								<li>📱 Nutze AirPlay oder Screen Mirroring</li>
								<li>⛶ Aktiviere Vollbild für beste Ansicht</li>
								<li>🔋 iPad an Strom anschließen</li>
								<li>🔇 iPad-Töne deaktivieren</li>
								<li>🚫 "Nicht stören" Modus aktivieren</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		{/if}

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

	/* Einstellungsmenü */
	.settings-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
		padding: 2rem;
		backdrop-filter: blur(5px);
	}

	.settings-panel {
		background: rgba(255, 255, 255, 0.98);
		border-radius: 24px;
		max-width: 700px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
		color: #333;
	}

	.dark-mode .settings-panel {
		background: rgba(30, 30, 50, 0.98);
		color: #e0e0e0;
	}

	.settings-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 2rem 2.5rem;
		border-bottom: 2px solid rgba(0, 0, 0, 0.1);
	}

	.dark-mode .settings-header {
		border-bottom-color: rgba(255, 255, 255, 0.1);
	}

	.settings-header h2 {
		margin: 0;
		font-size: 2.5rem;
		font-weight: 700;
	}

	.close-btn {
		background: rgba(0, 0, 0, 0.1);
		border: none;
		width: 50px;
		height: 50px;
		border-radius: 12px;
		font-size: 2rem;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-btn:hover {
		background: rgba(0, 0, 0, 0.2);
		transform: scale(1.1);
	}

	.dark-mode .close-btn {
		background: rgba(255, 255, 255, 0.1);
		color: #e0e0e0;
	}

	.dark-mode .close-btn:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.settings-content {
		padding: 2.5rem;
	}

	.setting-group {
		margin-bottom: 2.5rem;
		padding-bottom: 2.5rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	}

	.dark-mode .setting-group {
		border-bottom-color: rgba(255, 255, 255, 0.1);
	}

	.setting-group:last-child {
		border-bottom: none;
		margin-bottom: 0;
		padding-bottom: 0;
	}

	.setting-label {
		font-size: 1.8rem;
		font-weight: 600;
		display: block;
		margin-bottom: 1rem;
	}

	.setting-value {
		float: right;
		background: rgba(102, 126, 234, 0.2);
		padding: 0.5rem 1rem;
		border-radius: 8px;
		font-weight: 700;
		color: #667eea;
	}

	.dark-mode .setting-value {
		background: rgba(102, 126, 234, 0.3);
		color: #8fa9ff;
	}

	.slider {
		width: 100%;
		height: 12px;
		border-radius: 6px;
		background: rgba(0, 0, 0, 0.1);
		outline: none;
		-webkit-appearance: none;
		cursor: pointer;
		margin: 1rem 0;
	}

	.dark-mode .slider {
		background: rgba(255, 255, 255, 0.1);
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: #667eea;
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.slider::-moz-range-thumb {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: #667eea;
		cursor: pointer;
		border: none;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.slider-labels {
		display: flex;
		justify-content: space-between;
		font-size: 1.3rem;
		opacity: 0.7;
	}

	.button-group {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		margin-top: 1rem;
	}

	.button-group-2 {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		margin-top: 1rem;
	}

	.option-btn {
		background: rgba(0, 0, 0, 0.05);
		border: 2px solid rgba(0, 0, 0, 0.1);
		padding: 1.2rem;
		border-radius: 12px;
		font-size: 1.6rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.dark-mode .option-btn {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.1);
		color: #e0e0e0;
	}

	.option-btn:hover {
		background: rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}

	.option-btn.active {
		background: #667eea;
		border-color: #667eea;
		color: white;
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
	}

	.tips {
		background: rgba(255, 193, 7, 0.1);
		padding: 2rem !important;
		border-radius: 16px;
		border: 2px solid rgba(255, 193, 7, 0.3);
	}

	.dark-mode .tips {
		background: rgba(255, 193, 7, 0.15);
	}

	.tips h3 {
		margin: 0 0 1.5rem 0;
		font-size: 2rem;
		color: #f57c00;
	}

	.dark-mode .tips h3 {
		color: #ffb74d;
	}

	.tips ul {
		margin: 0;
		padding-left: 1.5rem;
		font-size: 1.5rem;
		line-height: 2.2;
	}

	.tips li {
		margin-bottom: 0.8rem;
	}

	h1 {
		margin: 0;
		font-size: 1.5rem; /* Sehr klein für TV-Spiegelung */
		font-weight: 700;
		text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
	}

	.current-time {
		font-size: 1.2rem; /* Sehr klein für TV-Spiegelung */
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
	}

	main {
		padding: 3rem 4rem;
		max-width: 1800px;
		margin: 0 auto;
		/* Wichtig für AutoScroll: Feste Höhe und Overflow */
		height: calc(100vh - 120px); /* 100vh minus Header-Höhe */
		overflow-y: auto;
		overflow-x: hidden;
		scroll-behavior: smooth;
		/* iOS Safari Optimierungen */
		-webkit-overflow-scrolling: touch;
		touch-action: pan-y; /* Erlaube vertikales Scrollen auf Touch-Geräten */
	}

	.days-container {
		display: grid;
		grid-template-columns: 1fr 1fr; /* IMMER nebeneinander */
		gap: 1.5rem;
	}

	.day-section {
		background: rgba(255, 255, 255, 0.15);
		border-radius: 12px; /* Kompakt */
		padding: 0.75rem; /* Minimal Padding für mehr Inhalt */
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
		margin-bottom: 0.75rem; /* Minimal Abstand */
		padding-bottom: 0.5rem;
		border-bottom: 2px solid rgba(255, 255, 255, 0.3);
	}

	.day-header h2 {
		margin: 0 0 0.25rem 0;
		font-size: 1.2rem; /* Sehr klein für TV-Spiegelung */
		font-weight: 700;
		text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.3);
	}

	.day-header .date {
		margin: 0;
		font-size: 0.9rem; /* Sehr klein für TV-Spiegelung */
		opacity: 0.9;
		font-weight: 500;
	}

	.angebote-grid {
		display: flex;
		flex-direction: column;
		gap: 0.5rem; /* Minimal Abstand für maximalen Inhalt */
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
		border-radius: 8px; /* Sehr kompakt */
		overflow: hidden;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s;
		color: #333;
	}

	.angebot-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
	}

	.angebot-image {
		width: 100%;
		min-height: 80px; /* Minimum */
		max-height: 200px; /* Maximum */
		overflow: hidden;
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.angebot-image img {
		width: 100%;
		height: auto; /* Dynamisch basierend auf Bildverhältnis */
		max-height: 200px;
		object-fit: cover; /* Bild füllt Fläche aus */
	}

	.angebot-content {
		padding: 0.75rem; /* Minimal Padding */
	}

	.angebot-content h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1rem; /* Sehr klein für TV-Spiegelung */
		color: #2d3748;
		line-height: 1.2;
		font-weight: 700;
	}

	.beschreibung {
		margin: 0 0 0.5rem 0;
		font-size: 0.8rem; /* Sehr klein für TV-Spiegelung */
		color: #4a5568;
		line-height: 1.4;
	}

	.angebot-details {
		display: flex;
		flex-direction: column;
		gap: 0.3rem; /* Minimal Abstand */
	}

	.detail {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8rem; /* Sehr klein für TV-Spiegelung */
		color: #2d3748;
		font-weight: 500;
	}

	.detail .icon {
		font-size: 1rem; /* Kleine Icons */
		min-width: 1.5rem;
		text-align: center;
	}

	/* iPad & Tablet Optimierungen */
	/* Entfernt - Tage sollen IMMER nebeneinander sein */

	@media (max-width: 1024px) {
		h1 {
			font-size: 3rem;
		}

		.current-time {
			font-size: 2.5rem;
		}

		.control-btn {
			width: 50px;
			height: 50px;
			font-size: 1.8rem;
		}

		.day-header h2 {
			font-size: 2.5rem;
		}

		.angebot-content h3 {
			font-size: 1.8rem;
		}
	}

	/* iPad Portrait & kleinere Displays */
	@media (max-width: 768px) {
		header {
			padding: 1.5rem 2rem;
		}

		h1 {
			font-size: 2.5rem;
		}

		.current-time {
			font-size: 2rem;
		}

		.control-btn {
			width: 45px;
			height: 45px;
			font-size: 1.6rem;
		}

		.header-controls {
			gap: 1rem;
		}

		main {
			padding: 2rem;
			height: calc(100vh - 100px); /* Angepasst für kleinere Header */
		}

		.day-section {
			padding: 1.5rem;
		}

		.settings-panel {
			max-width: 95%;
		}

		.button-group,
		.button-group-2 {
			grid-template-columns: 1fr;
		}
	}

	/* Touch-Optimierung für iPad */
	@media (hover: none) and (pointer: coarse) {
		.control-btn,
		.option-btn,
		.close-btn {
			-webkit-tap-highlight-color: transparent;
			touch-action: manipulation;
		}

		.slider::-webkit-slider-thumb {
			width: 40px;
			height: 40px;
		}
	}

	/* iPad-spezifische Größen (noch kleiner für TV-Mirroring) */
	:global(body.is-ipad) h1 {
		font-size: 1rem !important;
	}

	:global(body.is-ipad) .current-time {
		font-size: 0.85rem !important;
	}

	:global(body.is-ipad) .day-header h2 {
		font-size: 0.85rem !important;
	}

	:global(body.is-ipad) .day-header .date {
		font-size: 0.7rem !important;
	}

	:global(body.is-ipad) .day-section {
		padding: 0.5rem !important;
	}

	:global(body.is-ipad) .day-header {
		margin-bottom: 0.5rem !important;
		padding-bottom: 0.35rem !important;
	}

	:global(body.is-ipad) .angebot-image {
		min-height: 60px !important;
		max-height: 150px !important;
	}

	:global(body.is-ipad) .angebot-content {
		padding: 0.5rem !important;
	}

	:global(body.is-ipad) .angebot-content h3 {
		font-size: 0.75rem !important;
		margin-bottom: 0.35rem !important;
	}

	:global(body.is-ipad) .beschreibung {
		font-size: 0.65rem !important;
		margin-bottom: 0.35rem !important;
	}

	:global(body.is-ipad) .detail {
		font-size: 0.65rem !important;
	}

	:global(body.is-ipad) .detail .icon {
		font-size: 0.8rem !important;
		min-width: 1.2rem !important;
	}

	:global(body.is-ipad) .angebot-details {
		gap: 0.2rem !important;
	}

	:global(body.is-ipad) .angebote-grid {
		gap: 0.35rem !important;
	}

	:global(body.is-ipad) .days-container {
		gap: 1rem !important;
	}

	:global(body.is-ipad) main {
		padding: 2rem !important;
	}

	:global(body.is-ipad) .control-btn {
		width: 50px !important;
		height: 50px !important;
		font-size: 1.5rem !important;
	}

	:global(body.is-ipad) header {
		padding: 1.5rem 2rem !important;
	}

	:global(body.is-ipad) .header-controls {
		gap: 1rem !important;
	}
</style>
