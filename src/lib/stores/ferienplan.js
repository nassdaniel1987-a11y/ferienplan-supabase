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

// Abonniere Ferienplan-Daten mit Realtime
export async function subscribeToFerienplan() {
	const dates = getRelevantDates();
	const datesToLoad = [dates.heute, dates.morgen];
	
	// Initiales Laden
	const initialData = await loadAngeboteForDates(datesToLoad);
	angebote.set(initialData);
	loading.set(false);

	// Entferne alten Channel falls vorhanden
	if (realtimeChannel) {
		supabase.removeChannel(realtimeChannel);
	}

	// Realtime Subscription
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
				// Reload data on any change
				const updatedData = await loadAngeboteForDates(datesToLoad);
				angebote.set(updatedData);
			}
		)
		.subscribe();

	// Cleanup-Funktion zurückgeben
	return () => {
		if (realtimeChannel) {
			supabase.removeChannel(realtimeChannel);
		}
	};
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

// Lade Bild hoch
export async function uploadBild(file, angebotId) {
	const fileExt = file.name.split('.').pop();
	const fileName = `${angebotId}_${Date.now()}.${fileExt}`;
	const filePath = fileName;

	const { error: uploadError } = await supabase.storage
		.from('ferienplan-bilder')
		.upload(filePath, file, {
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
