import assert from 'node:assert/strict';
import test from 'node:test';

import { buildReservationFlow } from './reservation-flow';

test('buildReservationFlow creates a useful review summary for free tickets', () => {
  const flow = buildReservationFlow(
    {
      id: '4',
      title: 'Tournoi de Football Communautaire',
      date: '5 Juil 2026',
      location: 'Kinshasa',
      category: 'Sport',
      price: 'Gratuit',
      description: 'Un tournoi local ouvert aux equipes de quartier avec ambiance familiale, animations et trophees.',
      organizer: 'Kinshasa Sport+',
      color: '#F2C94C',
      imageUrl: 'https://example.com/event.jpg',
    },
    {
      key: 'standard',
      title: 'Standard',
      subtitle: 'Acces gratuit avec controle QR',
      price: 'Gratuit',
      description: 'Le meilleur point d entree pour reserver vite et garder le billet sur ton telephone.',
      perks: ['Billet mobile', 'QR code instantane', 'Confirmation email'],
      highlighted: true,
    },
  );

  assert.equal(flow.primaryActionLabel, 'Confirmer la reservation');
  assert.equal(flow.paymentLabel, 'Aucun paiement');
  assert.equal(flow.reviewItems[0].label, 'Billet');
  assert.equal(flow.reviewItems[1].label, 'Événement');
  assert.equal(flow.successActions[0].label, 'Voir mon billet');
});

test('buildReservationFlow sends paid reservations to checkout', () => {
  const flow = buildReservationFlow(
    {
      id: '3',
      organizerId: 'organizer_dakar',
      title: 'Nuit Electro Dakar',
      date: '28 Juin 2026',
      location: 'Dakar, SN',
      category: 'Soirees',
      price: '3 000 FC',
      description: 'La nuit la plus attendue de la saison.',
      organizer: 'Dakar Nights',
      color: '#3C9449',
      imageUrl: 'https://example.com/event.jpg',
    },
    {
      key: 'standard',
      title: 'Standard',
      subtitle: 'Entree simple, parcours rapide',
      price: '3 000 FC',
      description: 'Le meilleur point d entree pour reserver vite.',
      perks: ['Billet mobile', 'QR code instantane', 'Confirmation email'],
    },
  );

  assert.equal(flow.primaryActionLabel, 'Continuer vers le paiement');
  assert.equal(flow.paymentLabel, 'À payer : 3 000 FC');
});
