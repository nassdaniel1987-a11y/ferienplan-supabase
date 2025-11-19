import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';

export const angebote = writable({});
export const loading = writable(true);

let realtimeChannel = null;

// Formatiere Datum zu YYYY-MM-DD
export function formatDate(date) {
	return date.toISOString().split('T')[0];
}

// Hole heutiges und morgiges Datum
export function getRelevantDates() {
	const heute = new Date();
	const morgen = new Date(heute);
	morgen.setDate(morgen.getDate() + 1);
	
	return {
		heute: formatDate(heute),
		morgen: formatDate(morgen)
	};
}

// Lade Angebote für mehrere Daten
async function loadAngeboteForDates(dates) {
	const { data, error } = await supabase
		.from('angebote')
		.select('*')
		.in('datum', dates)
		.order('datum', { ascending: true })
		.order('uhrzeit', { ascending: true });

	if (error) {
		console.error('Fehler beim Laden:', error);
		return {};
	}

	// Gruppiere nach Datum
	const grouped = {};
	data.forEach(angebot => {
		if (!grouped[angebot.datum]) {
			grouped[angebot.datum] = {};
		}
		grouped[angebot.datum][angebot.id] = angebot;
	});

	return grouped;
}

let pollingInterval = null;
let realtimeWorking = false; // Flag ob Realtime tatsächlich Events empfängt

// Lösche alte Angebote (älter als gestern)
async function deleteOldAngebote() {
	try {
		const heute = new Date();
		const gestern = new Date(heute);
		gestern.setDate(gestern.getDate() - 1);
		const gestermFormatted = formatDate(gestern);

		console.log('🗑️ Lösche alte Angebote (älter als', gestermFormatted, ')...');

		// Hole alle alten Angebote mit Bild-URLs (zum Löschen aus Storage)
		const { data: oldAngebote, error: fetchError } = await supabase
			.from('angebote')
			.select('id, bild_url')
			.lt('datum', gestermFormatted);

		if (fetchError) {
			console.error('❌ Fehler beim Abrufen alter Angebote:', fetchError);
			return;
		}

		if (!oldAngebote || oldAngebote.length === 0) {
			console.log('✅ Keine alten Angebote zum Löschen gefunden');
			return;
		}

		console.log('📋 Gefunden:', oldAngebote.length, 'alte Angebote');

		// Lösche Bilder aus Storage
		const bildPaths = oldAngebote
			.filter(a => a.bild_url)
			.map(a => a.bild_url.split('/').pop());

		if (bildPaths.length > 0) {
			console.log('🖼️ Lösche', bildPaths.length, 'alte Bilder...');
			const { error: storageError } = await supabase.storage
				.from('ferienplan-bilder')
				.remove(bildPaths);

			if (storageError) {
				console.warn('⚠️ Einige Bilder konnten nicht gelöscht werden:', storageError);
			} else {
				console.log('✅ Bilder gelöscht');
			}
		}

		// Lösche Angebote aus Datenbank
		const { error: deleteError } = await supabase
			.from('angebote')
			.delete()
			.lt('datum', gestermFormatted);

		if (deleteError) {
			console.error('❌ Fehler beim Löschen der Angebote:', deleteError);
		} else {
			console.log('✅', oldAngebote.length, 'alte Angebote erfolgreich gelöscht');
		}
	} catch (error) {
		console.error('❌ Fehler bei der Bereinigung:', error);
	}
}

// Abonniere Ferienplan-Daten mit Realtime + Polling Fallback
export async function subscribeToFerienplan(usePolling = true) {
	const dates = getRelevantDates();
	const datesToLoad = [dates.heute, dates.morgen];

	// Lösche alte Angebote beim Start
	await deleteOldAngebote();

	// Initiales Laden
	const initialData = await loadAngeboteForDates(datesToLoad);
	angebote.set(initialData);
	loading.set(false);

	// Entferne alten Channel falls vorhanden
	if (realtimeChannel) {
		await supabase.removeChannel(realtimeChannel);
		realtimeChannel = null;
	}

	// Stop existing polling
	if (pollingInterval) {
		clearInterval(pollingInterval);
		pollingInterval = null;
	}

	// Reset Realtime-Flag
	realtimeWorking = false;

	console.log('🔌 Starte Daten-Synchronisation...');

	// Versuche Realtime zu nutzen (funktioniert nur wenn aktiviert)
	try {
		console.log('🔄 Versuche Realtime...');
		realtimeChannel = supabase
			.channel('ferienplan-changes')
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'angebote'
				},
				async (payload) => {
					console.log('🔄 Realtime Update empfangen!', {
						event: payload.eventType,
						new: payload.new,
						old: payload.old
					});

					// Erstes Realtime-Event empfangen - Polling kann gestoppt werden
					if (!realtimeWorking) {
						realtimeWorking = true;
						console.log('✅ Realtime funktioniert! Stoppe Polling...');
						if (pollingInterval) {
							clearInterval(pollingInterval);
							pollingInterval = null;
						}
					}

					// Reload data on any change
					const updatedData = await loadAngeboteForDates(datesToLoad);
					angebote.set(updatedData);
					console.log('✨ Daten via Realtime aktualisiert!');
				}
			)
			.subscribe(async (status, err) => {
				console.log('📡 Realtime Status:', status);

				if (status === 'SUBSCRIBED') {
					console.log('✅ Realtime Subscription aktiv');
					console.log('👂 Höre auf Änderungen in Tabelle "angebote"...');
					console.log('💡 Warte auf erstes Event um Polling zu deaktivieren...');
					// Polling läuft weiter bis erstes Event empfangen wurde
				}

				if (status === 'CHANNEL_ERROR') {
					console.warn('⚠️ Realtime nicht verfügbar');
					console.log('💡 Nutze Polling als Fallback (alle 5 Sekunden)');
					// Fallback zu Polling
					startPolling(datesToLoad);
				}

				if (status === 'TIMED_OUT') {
					console.warn('⏱️ Realtime Timeout');
					console.log('💡 Nutze Polling als Fallback (alle 5 Sekunden)');
					startPolling(datesToLoad);
				}
			});
	} catch (error) {
		console.warn('⚠️ Realtime Fehler:', error);
		console.log('💡 Nutze Polling als Fallback');
		startPolling(datesToLoad);
	}

	// Starte Polling sofort (wird erst gestoppt wenn erstes Realtime-Event kommt)
	if (usePolling) {
		console.log('🔄 Starte Polling (wird gestoppt wenn Realtime Event empfangen wird)');
		setTimeout(() => {
			// Starte Polling falls noch kein Realtime-Event empfangen wurde
			if (!realtimeWorking) {
				console.log('💡 Kein Realtime Event empfangen - aktiviere Polling');
				startPolling(datesToLoad);
			}
		}, 3000);
	}

	// Cleanup-Funktion zurückgeben
	return () => {
		console.log('🛑 Stoppe Daten-Synchronisation...');
		if (realtimeChannel) {
			supabase.removeChannel(realtimeChannel);
			realtimeChannel = null;
		}
		if (pollingInterval) {
			clearInterval(pollingInterval);
			pollingInterval = null;
		}
	};
}

// Polling-Mechanismus als Fallback
function startPolling(datesToLoad) {
	// Verhindere mehrfache Polling-Intervals
	if (pollingInterval) {
		return;
	}

	console.log('🔁 Polling aktiv: Daten werden alle 5 Sekunden aktualisiert');

	pollingInterval = setInterval(async () => {
		try {
			const updatedData = await loadAngeboteForDates(datesToLoad);
			angebote.set(updatedData);
			console.log('🔄 Daten via Polling aktualisiert');
		} catch (error) {
			console.error('❌ Polling Fehler:', error);
		}
	}, 5000); // Alle 5 Sekunden
}

// Füge neues Angebot hinzu
export async function addAngebot(datum, angebotData) {
	const { data, error } = await supabase
		.from('angebote')
		.insert([
			{
				datum: datum,
				titel: angebotData.titel,
				beschreibung: angebotData.beschreibung || null,
				uhrzeit: angebotData.uhrzeit || null,
				ort: angebotData.ort || null,
				betreuer: angebotData.betreuer || null,
				bild_url: angebotData.bildUrl || null,
				sichtbar: true
			}
		])
		.select();

	if (error) {
		console.error('Fehler beim Hinzufügen:', error);
		throw error;
	}

	return data[0].id;
}

// Update Angebot
export async function updateAngebot(angebotId, updates) {
	const updateData = {
		titel: updates.titel,
		beschreibung: updates.beschreibung || null,
		uhrzeit: updates.uhrzeit || null,
		ort: updates.ort || null,
		betreuer: updates.betreuer || null,
		bild_url: updates.bildUrl || null,
		sichtbar: updates.sichtbar !== undefined ? updates.sichtbar : true
	};

	const { error } = await supabase
		.from('angebote')
		.update(updateData)
		.eq('id', angebotId);

	if (error) {
		console.error('Fehler beim Updaten:', error);
		throw error;
	}
}

// Lösche Angebot
export async function deleteAngebot(angebotId, bildUrl) {
	// Lösche Bild aus Storage falls vorhanden
	if (bildUrl) {
		try {
			const path = bildUrl.split('/').pop();
			await supabase.storage.from('ferienplan-bilder').remove([path]);
		} catch (error) {
			console.error('Fehler beim Löschen des Bildes:', error);
		}
	}

	const { error } = await supabase
		.from('angebote')
		.delete()
		.eq('id', angebotId);

	if (error) {
		console.error('Fehler beim Löschen:', error);
		throw error;
	}
}

// Hilfsfunktion: Bild verkleinern/komprimieren
async function resizeImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);

		reader.onload = (event) => {
			const img = new Image();
			img.src = event.target.result;

			img.onload = () => {
				// Berechne neue Dimensionen
				let width = img.width;
				let height = img.height;

				if (width > height) {
					if (width > maxWidth) {
						height = (height * maxWidth) / width;
						width = maxWidth;
					}
				} else {
					if (height > maxHeight) {
						width = (width * maxHeight) / height;
						height = maxHeight;
					}
				}

				// Canvas erstellen und Bild zeichnen
				const canvas = document.createElement('canvas');
				canvas.width = width;
				canvas.height = height;

				const ctx = canvas.getContext('2d');
				ctx.drawImage(img, 0, 0, width, height);

				// Zu Blob konvertieren
				canvas.toBlob(
					(blob) => {
						if (blob) {
							// Erstelle neue Datei mit komprimierten Daten
							const resizedFile = new File([blob], file.name, {
								type: 'image/jpeg',
								lastModified: Date.now()
							});
							resolve(resizedFile);
						} else {
							reject(new Error('Fehler beim Komprimieren'));
						}
					},
					'image/jpeg',
					quality
				);
			};

			img.onerror = () => reject(new Error('Fehler beim Laden des Bildes'));
		};

		reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
	});
}

// Lade Bild hoch (mit automatischer Größenanpassung)
export async function uploadBild(file, angebotId, options = {}) {
	const {
		resize = true,
		maxWidth = 1200,
		maxHeight = 1200,
		quality = 0.8
	} = options;

	let fileToUpload = file;

	// Bild verkleinern falls gewünscht
	if (resize && file.type.startsWith('image/')) {
		try {
			console.log('📸 Originalgröße:', (file.size / 1024 / 1024).toFixed(2), 'MB');
			fileToUpload = await resizeImage(file, maxWidth, maxHeight, quality);
			console.log('📸 Neue Größe:', (fileToUpload.size / 1024 / 1024).toFixed(2), 'MB');
		} catch (error) {
			console.warn('⚠️ Resize fehlgeschlagen, nutze Originalbild:', error);
			fileToUpload = file;
		}
	}

	const fileExt = 'jpg'; // Immer JPG nach Resize
	const fileName = `${angebotId}_${Date.now()}.${fileExt}`;
	const filePath = fileName;

	const { error: uploadError } = await supabase.storage
		.from('ferienplan-bilder')
		.upload(filePath, fileToUpload, {
			cacheControl: '3600',
			upsert: false
		});

	if (uploadError) {
		console.error('Upload-Fehler:', uploadError);
		throw uploadError;
	}

	// Hole öffentliche URL
	const { data } = supabase.storage
		.from('ferienplan-bilder')
		.getPublicUrl(filePath);

	return data.publicUrl;
}

// Toggle Sichtbarkeit
export async function toggleSichtbarkeit(angebotId, currentValue) {
	const { error } = await supabase
		.from('angebote')
		.update({ sichtbar: !currentValue })
		.eq('id', angebotId);

	if (error) {
		console.error('Fehler beim Toggle:', error);
		throw error;
	}
}
