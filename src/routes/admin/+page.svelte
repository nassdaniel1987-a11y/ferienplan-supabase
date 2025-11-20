<script>
	import { onMount, onDestroy } from 'svelte';
	import { angebote, loading, subscribeToFerienplan, addAngebot, updateAngebot, deleteAngebot, uploadBild, toggleSichtbarkeit } from '$lib/stores/ferienplan';

	let unsubscribe;
	let selectedDate = '';
	let showAddForm = false;
	
	// Formular-Daten
	let formData = {
		titel: '',
		beschreibung: '',
		ort: '',
		uhrzeit: '',
		betreuer: '',
		bildFile: null
	};

	// Bildgrößen-Einstellungen
	let imageSettings = {
		resize: true,
		maxWidth: 1200,
		maxHeight: 1200,
		quality: 80 // 0-100 für UI, wird zu 0.0-1.0 konvertiert
	};

	let editingId = null;
	let uploading = false;
	let showImageSettings = false;
	let imagePreviewUrl = null; // Für Bildvorschau

	// Bild-Crop Einstellungen
	let cropSettings = {
		zoom: 1,
		offsetX: 0,
		offsetY: 0
	};

	onMount(() => {
		unsubscribe = subscribeToFerienplan();
		
		// Setze heutiges Datum als Standard
		const heute = new Date();
		selectedDate = heute.toISOString().split('T')[0];
	});

	onDestroy(() => {
		if (unsubscribe) unsubscribe();
	});

	$: currentAngebote = Object.entries($angebote[selectedDate] || {})
		.filter(([_, angebot]) => angebot)
		.sort((a, b) => (a[1].uhrzeit || '').localeCompare(b[1].uhrzeit || ''));

	function formatDateForDisplay(dateStr) {
		const date = new Date(dateStr + 'T00:00:00');
		const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
		const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
		return `${days[date.getDay()]}, ${date.getDate()}. ${months[date.getMonth()]}`;
	}

	function openAddForm() {
		resetForm();
		showAddForm = true;
		editingId = null;
	}

	function openEditForm(id, angebot) {
		formData = {
			titel: angebot.titel || '',
			beschreibung: angebot.beschreibung || '',
			ort: angebot.ort || '',
			uhrzeit: angebot.uhrzeit || '',
			betreuer: angebot.betreuer || '',
			bildFile: null
		};
		editingId = id;
		showAddForm = true;
	}

	function resetForm() {
		formData = {
			titel: '',
			beschreibung: '',
			ort: '',
			uhrzeit: '',
			betreuer: '',
			bildFile: null
		};
		editingId = null;
		imagePreviewUrl = null; // Reset Vorschau
		cropSettings = { zoom: 1, offsetX: 0, offsetY: 0 }; // Reset Crop
	}

	function closeForm() {
		showAddForm = false;
		resetForm();
	}

	async function handleSubmit() {
		if (!formData.titel) {
			alert('Bitte einen Titel eingeben!');
			return;
		}

		uploading = true;
		
		try {
			let bildUrl = editingId && getCurrentAngebot(editingId)?.bild_url ? 
				getCurrentAngebot(editingId).bild_url : null;
			
			// Lade neues Bild hoch falls vorhanden
			if (formData.bildFile) {
				const angebotId = editingId || `temp_${Date.now()}`;
				bildUrl = await uploadBild(formData.bildFile, angebotId, {
					resize: imageSettings.resize,
					maxWidth: imageSettings.maxWidth,
					maxHeight: imageSettings.maxHeight,
					quality: imageSettings.quality / 100 // Konvertiere 0-100 zu 0.0-1.0
				});
			}

			const angebotData = {
				titel: formData.titel,
				beschreibung: formData.beschreibung,
				ort: formData.ort,
				uhrzeit: formData.uhrzeit,
				betreuer: formData.betreuer,
				bildUrl: bildUrl,
				sichtbar: true
			};

			if (editingId) {
				await updateAngebot(editingId, angebotData);
			} else {
				await addAngebot(selectedDate, angebotData);
			}

			closeForm();
		} catch (error) {
			console.error('Fehler beim Speichern:', error);
			alert('Fehler beim Speichern: ' + error.message);
		} finally {
			uploading = false;
		}
	}

	function getCurrentAngebot(id) {
		return $angebote[selectedDate]?.[id];
	}

	async function handleDelete(id) {
		if (confirm('Dieses Angebot wirklich löschen?')) {
			const angebot = $angebote[selectedDate]?.[id];
			await deleteAngebot(id, angebot?.bild_url);
		}
	}

	async function handleToggleSichtbarkeit(id) {
		const angebot = $angebote[selectedDate]?.[id];
		await toggleSichtbarkeit(id, angebot.sichtbar);
	}

	function handleFileChange(event) {
		const file = event.target.files?.[0];
		if (file && file.type.startsWith('image/')) {
			formData.bildFile = file;

			// Erstelle Vorschau-URL
			if (imagePreviewUrl) {
				URL.revokeObjectURL(imagePreviewUrl); // Alte URL freigeben
			}
			imagePreviewUrl = URL.createObjectURL(file);

			// Reset Crop-Einstellungen für neues Bild
			cropSettings = { zoom: 1, offsetX: 0, offsetY: 0 };
		}
	}

	// Generiere Datum-Optionen (14 Tage voraus)
	function getDateOptions() {
		const options = [];
		const heute = new Date();
		
		for (let i = 0; i < 14; i++) {
			const date = new Date(heute);
			date.setDate(heute.getDate() + i);
			const dateStr = date.toISOString().split('T')[0];
			options.push({
				value: dateStr,
				label: formatDateForDisplay(dateStr)
			});
		}
		
		return options;
	}
</script>

<div class="admin-container">
	<header>
		<h1>📝 Ferienplan Admin</h1>
		<a href="/display" target="_blank" class="display-link">
			🖥️ Display öffnen
		</a>
	</header>

	{#if $loading}
		<div class="loading">
			<div class="spinner"></div>
			<p>Lädt...</p>
		</div>
	{:else}
		<main>
			<div class="controls">
				<div class="date-selector">
					<label for="date">Datum:</label>
					<select id="date" bind:value={selectedDate}>
						{#each getDateOptions() as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>

				<button class="btn-primary" on:click={openAddForm}>
					+ Angebot hinzufügen
				</button>
			</div>

			<div class="angebote-list">
				{#if currentAngebote.length === 0}
					<div class="empty-state">
						<p>Noch keine Angebote für diesen Tag</p>
						<button class="btn-secondary" on:click={openAddForm}>
							Erstes Angebot erstellen
						</button>
					</div>
				{:else}
					{#each currentAngebote as [id, angebot]}
						<div class="angebot-item" class:hidden={!angebot.sichtbar}>
							{#if angebot.bild_url}
								<div class="thumbnail">
									<img src={angebot.bild_url} alt={angebot.titel} />
								</div>
							{:else}
								<div class="thumbnail no-image">
									<span>📷</span>
								</div>
							{/if}

							<div class="angebot-info">
								<h3>{angebot.titel}</h3>
								{#if angebot.beschreibung}
									<p class="beschreibung">{angebot.beschreibung}</p>
								{/if}
								<div class="meta">
									{#if angebot.uhrzeit}
										<span>🕐 {angebot.uhrzeit}</span>
									{/if}
									{#if angebot.ort}
										<span>📍 {angebot.ort}</span>
									{/if}
									{#if angebot.betreuer}
										<span>👤 {angebot.betreuer}</span>
									{/if}
								</div>
							</div>

							<div class="actions">
								<button 
									class="btn-icon" 
									class:active={angebot.sichtbar}
									on:click={() => handleToggleSichtbarkeit(id)}
									title={angebot.sichtbar ? 'Ausblenden' : 'Einblenden'}
								>
									{angebot.sichtbar ? '👁️' : '🚫'}
								</button>
								<button class="btn-icon" on:click={() => openEditForm(id, angebot)} title="Bearbeiten">
									✏️
								</button>
								<button class="btn-icon danger" on:click={() => handleDelete(id)} title="Löschen">
									🗑️
								</button>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</main>
	{/if}
</div>

{#if showAddForm}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal-overlay" on:click={closeForm}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
		<div class="modal" role="dialog" aria-modal="true" on:click|stopPropagation>
			<div class="modal-header">
				<h2>{editingId ? 'Angebot bearbeiten' : 'Neues Angebot'}</h2>
				<button class="btn-close" on:click={closeForm}>✕</button>
			</div>

			<form on:submit|preventDefault={handleSubmit}>
				<div class="form-group">
					<label for="titel">Titel *</label>
					<input 
						type="text" 
						id="titel" 
						bind:value={formData.titel}
						placeholder="z.B. Bastelwerkstatt"
						required
					/>
				</div>

				<div class="form-group">
					<label for="beschreibung">Beschreibung</label>
					<textarea 
						id="beschreibung" 
						bind:value={formData.beschreibung}
						placeholder="Was wird gemacht?"
						rows="3"
					></textarea>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="uhrzeit">Uhrzeit</label>
						<input 
							type="time" 
							id="uhrzeit" 
							bind:value={formData.uhrzeit}
						/>
					</div>

					<div class="form-group">
						<label for="ort">Ort</label>
						<input 
							type="text" 
							id="ort" 
							bind:value={formData.ort}
							placeholder="z.B. Raum 12"
						/>
					</div>
				</div>

				<div class="form-group">
					<label for="betreuer">Betreuer/in</label>
					<input 
						type="text" 
						id="betreuer" 
						bind:value={formData.betreuer}
						placeholder="Name"
					/>
				</div>

				<div class="form-group">
					<label for="bild">Bild</label>
					<input
						type="file"
						id="bild"
						accept="image/*"
						on:change={handleFileChange}
					/>
					{#if formData.bildFile}
						<p class="file-info">📎 {formData.bildFile.name} ({(formData.bildFile.size / 1024 / 1024).toFixed(2)} MB)</p>
					{/if}

					<!-- Bildvorschau mit Crop-Tool -->
					{#if imagePreviewUrl || (editingId && getCurrentAngebot(editingId)?.bild_url)}
						<div class="image-preview">
							<p class="preview-label">Bildvorschau & Ausschnitt:</p>

							<div class="preview-container">
								<img
									src={imagePreviewUrl || getCurrentAngebot(editingId)?.bild_url}
									alt="Vorschau"
									class="preview-image"
									style="
										transform: scale({cropSettings.zoom}) translate({cropSettings.offsetX}%, {cropSettings.offsetY}%);
										transform-origin: center center;
									"
								/>
							</div>

							<!-- Crop Controls -->
							<div class="crop-controls">
								<div class="crop-control-group">
									<label for="zoom-slider">
										🔍 Zoom: {cropSettings.zoom.toFixed(1)}x
									</label>
									<input
										id="zoom-slider"
										type="range"
										min="0.5"
										max="3"
										step="0.1"
										bind:value={cropSettings.zoom}
										class="crop-slider"
									/>
								</div>

								<div class="crop-control-group">
									<label for="offset-x-slider">
										↔️ Horizontal: {cropSettings.offsetX > 0 ? '+' : ''}{cropSettings.offsetX}%
									</label>
									<input
										id="offset-x-slider"
										type="range"
										min="-50"
										max="50"
										step="1"
										bind:value={cropSettings.offsetX}
										class="crop-slider"
									/>
								</div>

								<div class="crop-control-group">
									<label for="offset-y-slider">
										↕️ Vertikal: {cropSettings.offsetY > 0 ? '+' : ''}{cropSettings.offsetY}%
									</label>
									<input
										id="offset-y-slider"
										type="range"
										min="-50"
										max="50"
										step="1"
										bind:value={cropSettings.offsetY}
										class="crop-slider"
									/>
								</div>

								<button
									type="button"
									class="btn-reset-crop"
									on:click={() => cropSettings = { zoom: 1, offsetX: 0, offsetY: 0 }}
								>
									↺ Zurücksetzen
								</button>
							</div>
						</div>
					{/if}

					<button
						type="button"
						class="btn-settings"
						on:click={() => showImageSettings = !showImageSettings}
					>
						⚙️ Bildgröße einstellen
					</button>

					{#if showImageSettings}
						<div class="image-settings">
							<div class="setting-row">
								<label>
									<input type="checkbox" bind:checked={imageSettings.resize} />
									Bild automatisch verkleinern
								</label>
							</div>

							{#if imageSettings.resize}
								<div class="setting-row">
									<label for="maxWidth">Max. Breite (px):</label>
									<input
										type="number"
										id="maxWidth"
										bind:value={imageSettings.maxWidth}
										min="100"
										max="4000"
										step="100"
									/>
								</div>

								<div class="setting-row">
									<label for="maxHeight">Max. Höhe (px):</label>
									<input
										type="number"
										id="maxHeight"
										bind:value={imageSettings.maxHeight}
										min="100"
										max="4000"
										step="100"
									/>
								</div>

								<div class="setting-row">
									<label for="quality">Qualität ({imageSettings.quality}%):</label>
									<input
										type="range"
										id="quality"
										bind:value={imageSettings.quality}
										min="10"
										max="100"
										step="5"
									/>
								</div>

								<p class="settings-hint">
									💡 Empfohlen: 1200x1200px bei 80% Qualität
								</p>
							{/if}
						</div>
					{/if}
				</div>

				<div class="form-actions">
					<button type="button" class="btn-secondary" on:click={closeForm}>
						Abbrechen
					</button>
					<button type="submit" class="btn-primary" disabled={uploading}>
						{uploading ? 'Wird gespeichert...' : 'Speichern'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: #f5f7fa;
	}

	.admin-container {
		min-height: 100vh;
		padding-bottom: 4rem;
	}

	header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	h1 {
		margin: 0;
		font-size: 2rem;
	}

	.display-link {
		background: rgba(255, 255, 255, 0.2);
		color: white;
		text-decoration: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-weight: 600;
		transition: background 0.2s;
		backdrop-filter: blur(10px);
	}

	.display-link:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem;
		gap: 1rem;
	}

	.spinner {
		width: 50px;
		height: 50px;
		border: 4px solid #e2e8f0;
		border-top-color: #667eea;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	main {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}

	.date-selector {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.date-selector label {
		font-weight: 600;
		color: #2d3748;
	}

	select {
		padding: 0.75rem 1rem;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		font-size: 1rem;
		background: white;
		cursor: pointer;
		min-width: 200px;
	}

	select:focus {
		outline: none;
		border-color: #667eea;
	}

	.btn-primary {
		background: #667eea;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-primary:hover {
		background: #5568d3;
	}

	.btn-primary:disabled {
		background: #a0aec0;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: #e2e8f0;
		color: #2d3748;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-secondary:hover {
		background: #cbd5e0;
	}

	.angebote-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: white;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.empty-state p {
		font-size: 1.25rem;
		color: #718096;
		margin-bottom: 1.5rem;
	}

	.angebot-item {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		display: flex;
		gap: 1.5rem;
		align-items: flex-start;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		transition: box-shadow 0.2s;
	}

	.angebot-item:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.angebot-item.hidden {
		opacity: 0.5;
		background: #f7fafc;
	}

	.thumbnail {
		width: 120px;
		height: 120px;
		border-radius: 8px;
		overflow: hidden;
		flex-shrink: 0;
		background: #e2e8f0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.thumbnail img {
		width: 100%;
		height: 100%;
		object-fit: cover; /* Bild füllt Fläche - sieht besser aus */
		background: #ffffff;
	}

	.thumbnail.no-image {
		font-size: 3rem;
	}

	.angebot-info {
		flex: 1;
		min-width: 0;
	}

	.angebot-info h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
		color: #2d3748;
	}

	.beschreibung {
		margin: 0 0 1rem 0;
		color: #4a5568;
		line-height: 1.5;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		font-size: 0.95rem;
		color: #718096;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.btn-icon {
		background: #f7fafc;
		border: 2px solid #e2e8f0;
		width: 40px;
		height: 40px;
		border-radius: 8px;
		font-size: 1.2rem;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-icon:hover {
		background: #e2e8f0;
		transform: translateY(-2px);
	}

	.btn-icon.active {
		background: #c6f6d5;
		border-color: #48bb78;
	}

	.btn-icon.danger:hover {
		background: #fed7d7;
		border-color: #fc8181;
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal {
		background: white;
		border-radius: 16px;
		max-width: 600px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem 2rem;
		border-bottom: 2px solid #e2e8f0;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
		color: #2d3748;
	}

	.btn-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #718096;
		width: 32px;
		height: 32px;
		border-radius: 4px;
		transition: background 0.2s;
	}

	.btn-close:hover {
		background: #f7fafc;
	}

	form {
		padding: 2rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #2d3748;
	}

	input[type="text"],
	input[type="time"],
	textarea {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		font-size: 1rem;
		font-family: inherit;
		box-sizing: border-box;
	}

	input:focus,
	textarea:focus {
		outline: none;
		border-color: #667eea;
	}

	input[type="file"] {
		width: 100%;
		padding: 0.5rem;
		border: 2px dashed #e2e8f0;
		border-radius: 8px;
		cursor: pointer;
	}

	.file-info {
		margin-top: 0.5rem;
		color: #718096;
		font-size: 0.9rem;
	}

	.image-preview {
		margin-top: 1rem;
		padding: 1rem;
		background: #f7fafc;
		border-radius: 8px;
		border: 2px solid #e2e8f0;
	}

	.preview-label {
		margin: 0 0 0.75rem 0;
		font-weight: 600;
		color: #4a5568;
		font-size: 0.9rem;
	}

	.preview-container {
		width: 100%;
		height: 300px;
		overflow: hidden;
		background: #ffffff;
		border-radius: 6px;
		border: 2px solid #4299e1;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.preview-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.1s ease-out;
	}

	.crop-controls {
		margin-top: 1rem;
		padding: 1rem;
		background: #f7fafc;
		border-radius: 8px;
		border: 1px solid #e2e8f0;
	}

	.crop-control-group {
		margin-bottom: 1rem;
	}

	.crop-control-group:last-of-type {
		margin-bottom: 0;
	}

	.crop-control-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #2d3748;
		font-size: 0.9rem;
	}

	.crop-slider {
		width: 100%;
		height: 8px;
		border-radius: 4px;
		background: #e2e8f0;
		outline: none;
		-webkit-appearance: none;
		cursor: pointer;
	}

	.crop-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #4299e1;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.crop-slider::-moz-range-thumb {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #4299e1;
		cursor: pointer;
		border: none;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.btn-reset-crop {
		width: 100%;
		margin-top: 1rem;
		padding: 0.75rem;
		background: #edf2f7;
		border: 1px solid #cbd5e0;
		border-radius: 6px;
		font-weight: 600;
		color: #2d3748;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-reset-crop:hover {
		background: #e2e8f0;
		border-color: #a0aec0;
	}

	.btn-settings {
		margin-top: 0.75rem;
		background: #e2e8f0;
		color: #2d3748;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-size: 0.9rem;
		cursor: pointer;
		transition: background 0.2s;
		width: 100%;
	}

	.btn-settings:hover {
		background: #cbd5e0;
	}

	.image-settings {
		margin-top: 1rem;
		padding: 1rem;
		background: #f7fafc;
		border-radius: 8px;
		border: 2px solid #e2e8f0;
	}

	.setting-row {
		margin-bottom: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.setting-row:last-child {
		margin-bottom: 0;
	}

	.setting-row label {
		font-size: 0.9rem;
		font-weight: 500;
		color: #4a5568;
	}

	.setting-row input[type="checkbox"] {
		width: auto;
		margin-right: 0.5rem;
	}

	.setting-row input[type="number"] {
		padding: 0.5rem;
	}

	.setting-row input[type="range"] {
		width: 100%;
		cursor: pointer;
	}

	.settings-hint {
		margin: 1rem 0 0 0;
		padding: 0.75rem;
		background: #edf2f7;
		border-radius: 6px;
		color: #4a5568;
		font-size: 0.85rem;
		border-left: 3px solid #667eea;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 2px solid #e2e8f0;
	}

	@media (max-width: 768px) {
		.angebot-item {
			flex-direction: column;
		}

		.thumbnail {
			width: 100%;
			height: 200px;
		}

		.form-row {
			grid-template-columns: 1fr;
		}
	}
</style>
