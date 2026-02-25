import { AppData } from './types';

export const INITIAL_DATA: AppData = {
  config: {
    name: "Suivi de Chantier",
    subtitle: "Hôpital Central",
    steps: [
      { id: "cabling", label: "Câblage" },
      { id: "sockets", label: "Prises" },
      { id: "wifi", label: "WiFi" },
      { id: "connection", label: "Racc." },
      { id: "test", label: "Tests" }
    ]
  },
  tasks: [
    { id: '1', name: 'Administratif', service: 'Administratif', level: 'RDC', priority: 'Haute', tasks: {}, observations: [] },
    { id: '2', name: 'Studio', service: 'Administratif', level: 'RDC', priority: 'Haute', tasks: {}, observations: [] },
    { id: '3', name: 'Tuberculose', service: 'Tuberculose', level: 'RDC', priority: 'Haute', tasks: {}, observations: [] },
    { id: '4', name: 'Urgences', service: 'Urgences', level: 'RDC', priority: 'Haute', tasks: {}, observations: [] },
    { id: '5', name: 'Urgences', service: 'Urgences', level: 'R+1', priority: 'Haute', tasks: {}, observations: [] },
    { id: '6', name: 'Bâtiment 01', service: 'Chirurgie Tardive', level: 'RDC', priority: 'Moyenne', tasks: {}, observations: [] },
    { id: '7', name: 'Bâtiment 02', service: 'Urgences Pédiatriques', level: 'RDC', priority: 'Haute', tasks: {}, observations: [] },
    { id: '8', name: 'Bâtiment 03', service: 'Chirurgie Réveil', level: 'RDC', priority: 'Moyenne', tasks: {}, observations: [] },
    { id: '9', name: 'Bâtiment 04', service: 'Médecine Interne', level: 'RDC', priority: 'Moyenne', tasks: {}, observations: [] },
    { id: '10', name: 'Bâtiment 05', service: 'Nutrition & Pédiatrie', level: 'RDC', priority: 'Moyenne', tasks: {}, observations: [] },
    { id: '11', name: 'Bâtiment 06', service: 'Post-Partum', level: 'RDC', priority: 'Basse', tasks: {}, observations: [] },
    { id: '12', name: 'Bâtiment 07', service: 'Gynecologie', level: 'RDC', priority: 'Basse', tasks: {}, observations: [] },
    { id: '13', name: 'Maternité', service: 'Maternité', level: 'RDC BAS', priority: 'Haute', tasks: {}, observations: [] },
    { id: '14', name: 'Maternité', service: 'Maternité', level: 'RDC HAUT', priority: 'Haute', tasks: {}, observations: [] },
    { id: '15', name: 'Maternité', service: 'Maternité', level: 'R+1', priority: 'Haute', tasks: {}, observations: [] },
    { id: '16', name: 'Bâtiment 84', service: 'Clinique', level: 'RDC', priority: 'Basse', tasks: {}, observations: [] },
    { id: '17', name: 'Bâtiment 88', service: 'Post-Partum', level: 'RDC', priority: 'Basse', tasks: {}, observations: [] },
    { id: '18', name: 'Bâtiment 09', service: 'Clinique Post-Partum', level: 'RDC', priority: 'Basse', tasks: {}, observations: [] },
    { id: '19', name: 'Bâtiment 10', service: 'Clinique Post-Partum', level: 'R+1', priority: 'Basse', tasks: {}, observations: [] },
    { id: '20', name: 'PC Sécurité', service: 'Clinique', level: 'RDC', priority: 'Basse', tasks: {}, observations: [] },
    { id: '21', name: 'Accueil', service: 'Administratif', level: 'RDC', priority: 'Haute', tasks: {}, observations: [] },
    { id: '22', name: 'Administratif', service: '', level: 'R+1', priority: 'Haute', tasks: {}, observations: [] },
    { id: '23', name: 'Laboratoire/Pharmacie', service: 'Laboratoire/Pharmacie', level: 'RDC', priority: 'Haute', tasks: {}, observations: [] },
    { id: '24', name: 'Soins Intensif/Bloc', service: 'Bloc Opératoire/Imagerie', level: 'RDC', priority: 'Haute', tasks: {}, observations: [] },
    { id: '25', name: 'SVS', service: 'SVS', level: 'RDC', priority: 'Haute', tasks: {}, observations: [] },
    { id: '26', name: 'SVS', service: 'SVS', level: 'R+1', priority: 'Haute', tasks: {}, observations: [] },
    { id: '27', name: 'Extension SVS', service: 'SVS', level: 'RDC SAS', priority: 'Haute', tasks: {}, observations: [] },
    { id: '28', name: 'Bâtiment GE', service: 'Bâtiment GE', level: 'RDC', priority: 'Basse', tasks: {}, observations: [] },
    { id: '29', name: 'Magasin', service: 'Magasin', level: 'RDC', priority: 'Basse', tasks: {}, observations: [] },
    { id: '30', name: 'Fondation Baron', service: 'Fondation Baron', level: 'RDC', priority: 'Basse', tasks: {}, observations: [] },
    { id: '31', name: 'Psychanalyse', service: 'Psychanalyse', level: 'RDC', priority: 'Basse', tasks: {}, observations: [] },
    { id: '32', name: 'Dialyse', service: 'Dialyse', level: 'RDC', priority: 'Basse', tasks: {}, observations: [] },
    { id: '33', name: 'Ophtalmologie', service: 'Ophtalmologie', level: 'RDC', priority: 'Moyenne', tasks: {}, observations: [] },
    { id: '34', name: 'Morgue', service: 'Morgue', level: 'RDC', priority: 'Basse', tasks: {}, observations: [] },
    { id: '35', name: 'Morgue', service: 'Morgue', level: 'R+1', priority: 'Basse', tasks: {}, observations: [] },
    { id: '36', name: 'ITM', service: 'ITM', level: 'RDC', priority: 'Basse', tasks: {}, observations: [] },
  ]
};
