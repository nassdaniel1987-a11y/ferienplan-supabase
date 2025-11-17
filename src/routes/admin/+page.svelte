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
	
	let editingId = null;
	let uploading = false;

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
				bildUrl = await uploadBild(formData.bildFile, angebotId);
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
						<p class="file-info">📎 {formData.bildFile.name}</p>
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
		object-fit: cover;
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
