import JSZip from 'jszip';
import { NetworkInspectorData, NetworkOutlet, NetworkConnection, NetworkZone, NetworkRack, NetworkEquipment, NetworkAnomaly } from '../types';

export const generateDossierTechniqueZip = async (data: NetworkInspectorData, projectName: string) => {
  const zip = new JSZip();

  // Helper lookups
  const zonesMap = new Map(data.zones.map(z => [z.id, z]));
  const cablesMap = new Map(data.cables.map(c => [c.outlet_id, c]));
  const connMap = new Map(data.connections.map(cn => [cn.outlet_id, cn]));
  const racksMap = new Map(data.racks.map(r => [r.id, r]));
  const eqMap = new Map(data.equipments.map(e => [e.id, e]));

  const totalOutlets = data.outlets.length;
  const testedOutlets = Object.keys(data.continuity_tests).length;
  const passTests = Object.values(data.continuity_tests).filter(t => t.result === 'OK').length;
  const failTests = testedOutlets - passTests;
  const successRate = testedOutlets > 0 ? Math.round((passTests / testedOutlets) * 100) : 0;
  const openAnomalies = data.anomalies.filter(a => a.status !== 'CLOSED').length;
  const closedAnomalies = data.anomalies.filter(a => a.status === 'CLOSED').length;

  // 1. Rapport Général et Statistiques
  const reportContent = `========================================================================
DOSSIER TECHNIQUE FINAL DE CONTRÔLE RÉSEAU & RECETTE TERRAIN
Application : Herton Network Field Inspector (v2.0)
Auteur / Opérateur : Herton.pro
========================================================================

PROJET : ${projectName}
CODE PROJET : ${data.project_code}
CLIENT : ${data.client}
RÉFÉRENCE CONTRAT : ${data.contract_ref}
DATE DE GÉNÉRATION : ${new Date().toLocaleString('fr-FR')}
STATUT : Contrôle de continuité terrain et vérification physique

------------------------------------------------------------------------
SYNTHÈSE DES CONTRÔLES TERRAIN
------------------------------------------------------------------------
- Nombre total de points réseau (prises) : ${totalOutlets}
- Prises contrôlées (physique + continuité) : ${testedOutlets} (${totalOutlets > 0 ? Math.round((testedOutlets / totalOutlets) * 100) : 0}%)
- Prises conformes (Test OK) : ${passTests}
- Prises en défaut ou à reprendre : ${failTests}
- Taux de réussite continuité : ${successRate}%
- Baies & Répartiteurs inspectés : ${data.racks.length}
- Équipements recensés (Switches, PP, Onduleurs) : ${data.equipments.length}
- Anomalies ouvertes / en cours : ${openAnomalies}
- Anomalies résolues et clôturées : ${closedAnomalies}

------------------------------------------------------------------------
MENTION LÉGALE & NORMATIVE
------------------------------------------------------------------------
Ce document atteste de la conformité du câblage au contrôle de continuité
physique et d'étiquetage réalisé sur site par les techniciens Herton.pro.
Conforme aux règles de l'art du câblage structuré cuivre & optique.
Préalable formel avant la phase ultérieure de certification réflectométrique CAT6A.
========================================================================
`;
  zip.file('01_Rapport_General_et_Statistiques.txt', reportContent);

  // 2. Liste Points Raccordés et Matrice (CSV)
  let matrixCsv = 'Code Prise;Type;Batiment;Service;Local;Etage;Code Cable;Categorie;Longueur Est (m);Patch Panel;Port Patch;Switch;Port Switch;VLAN;Controle Physique;Test Continuite;Resultat Test;Statut Prise\n';
  data.outlets.forEach(out => {
    const zone = zonesMap.get(out.zone_id);
    const cable = cablesMap.get(out.id);
    const conn = connMap.get(out.id);
    const check = data.physical_checks[out.id];
    const test = data.continuity_tests[out.id];
    const pp = conn ? eqMap.get(conn.patch_panel_id) : null;
    const sw = conn ? eqMap.get(conn.switch_id) : null;

    const physicalStatus = check ? (check.fixation_ok && check.label_ok && check.connector_ok && check.cable_route_ok ? 'CONFORME' : 'NON_CONFORME') : 'NON_VERIFIE';
    const testStatus = test ? test.result : 'NON_TESTE';

    matrixCsv += `"${out.code}";"${out.type}";"${zone?.building || '-'}";"${zone?.service || '-'}";"${zone?.room || '-'}";"${zone?.floor || '-'}";"${cable?.code || '-'}";"${cable?.category || '-'}";"${cable?.length_est || '-'}";"${pp ? pp.brand + ' ' + pp.model : '-'}";"${conn?.patch_port || '-'}";"${sw ? sw.brand + ' ' + sw.model : '-'}";"${conn?.switch_port || '-'}";"${conn?.vlan || '-'}";"${physicalStatus}";"${test?.tester_model || '-'}";"${testStatus}";"${out.status}"\n`;
  });
  zip.file('02_Liste_Points_Raccordes_et_Matrice.csv', '\uFEFF' + matrixCsv);

  // 3. Inventaire Equipements et Baies (CSV)
  let eqCsv = 'Type;Designation;Marque;Modele;Numero Serie;Baie / Emplacement;Position U;Nombre Ports\n';
  data.equipments.forEach(eq => {
    const rack = racksMap.get(eq.rack_id);
    eqCsv += `"${eq.type}";"${eq.brand} ${eq.model}";"${eq.brand}";"${eq.model}";"${eq.serial_number}";"${rack?.name || '-'}";"${eq.position}";"${eq.ports_count || '-'}"\n`;
  });
  data.racks.forEach(rk => {
    const zone = zonesMap.get(rk.zone_id);
    eqCsv += `"Baie / Coffret";"${rk.name}";"-";"${rk.height_u}U";"-";"${zone?.building || '-'} - ${zone?.room || '-'}";"-";"-";"${rk.status}"\n`;
  });
  zip.file('03_Inventaire_Equipements_et_Baies.csv', '\uFEFF' + eqCsv);

  // 4. Registre Anomalies et Corrections (CSV)
  let anomCsv = 'Code Anomalie;Code Prise;Categorie;Severite;Statut;Date Constat;Description;Action Corrective;Reteste Conforme;Date Cloture;Technicien\n';
  data.anomalies.forEach(an => {
    const out = an.outlet_id ? data.outlets.find(o => o.id === an.outlet_id) : null;
    const ca = an.corrective_action;
    anomCsv += `"${an.code}";"${out?.code || '-'}";"${an.category}";"${an.severity}";"${an.status}";"${an.created_at}";"${an.description.replace(/"/g, '""')}";"${ca?.action_taken ? ca.action_taken.replace(/"/g, '""') : '-'}";"${ca ? (ca.retested_ok ? 'OUI' : 'NON') : '-'}";"${ca?.fixed_at || '-'}";"${ca?.tech_name || '-'}"\n`;
  });
  zip.file('04_Registre_Anomalies_et_Corrections.csv', '\uFEFF' + anomCsv);

  // 5. Fiches Individuelles de Prises (dossier dédié)
  const fichesFolder = zip.folder('05_Fiches_Individuelles_Prises');
  if (fichesFolder) {
    data.outlets.forEach(out => {
      const zone = zonesMap.get(out.zone_id);
      const cable = cablesMap.get(out.id);
      const conn = connMap.get(out.id);
      const check = data.physical_checks[out.id];
      const test = data.continuity_tests[out.id];
      const pp = conn ? eqMap.get(conn.patch_panel_id) : null;
      const sw = conn ? eqMap.get(conn.switch_id) : null;
      const relatedAnom = data.anomalies.filter(a => a.outlet_id === out.id);

      const ficheText = `========================================================================
FICHE INDIVIDUELLE DE CONTRÔLE DE PRISE RÉSEAU
HERTON NETWORK FIELD INSPECTOR - HERTON.PRO
========================================================================

IDENTIFICATION DU POINT RÉSEAU :
- Code Prise : ${out.code}
- Type de connecteur : ${out.type}
- Statut global : ${out.status}
- Projet : ${projectName} (${data.project_code})

LOCALISATION GÉOGRAPHIQUE :
- Bâtiment : ${zone?.building || 'Non renseigné'}
- Service : ${zone?.service || 'Non renseigné'}
- Local / Bureau : ${zone?.room || 'Non renseigné'}
- Étage : ${zone?.floor || 'RDC'}

CHAÎNE DE LIAISON PHYSIQUE (TRAÇABILITÉ COMPLÈTE) :
1. Prise Terminale : [ ${out.code} ] (${out.type})
2. Câble de liaison : [ ${cable?.code || 'Non renseigné'} ] (Catégorie: ${cable?.category || 'CAT6A'} - Longueur est.: ${cable?.length_est || '-'}m)
3. Panneau de Brassage : [ ${pp ? pp.brand + ' ' + pp.model : 'Non raccordé'} ] -> Port: ${conn?.patch_port || '-'}
4. Commutateur (Switch) : [ ${sw ? sw.brand + ' ' + sw.model : 'Non raccordé'} ] -> Port: ${conn?.switch_port || '-'}
5. Configuration VLAN : ${conn?.vlan || 'Non affecté'}

RAPPORT DE CONTRÔLE PHYSIQUE :
- Fixation plastron / boîtier : ${check ? (check.fixation_ok ? 'CONFORME [OK]' : 'DÉFECTUEUX [NOK]') : 'Non vérifié'}
- Étiquetage normalisé : ${check ? (check.label_ok ? 'CONFORME [OK]' : 'DÉFECTUEUX [NOK]') : 'Non vérifié'}
- État connecteur RJ45 : ${check ? (check.connector_ok ? 'CONFORME [OK]' : 'DÉFECTUEUX [NOK]') : 'Non vérifié'}
- Cheminement & courbure : ${check ? (check.cable_route_ok ? 'CONFORME [OK]' : 'DÉFECTUEUX [NOK]') : 'Non vérifié'}
- Technicien contrôleur : ${check?.tech_name || 'Herton Field Tech'} (Date: ${check?.checked_at || '-'})

TEST DE CONTINUITÉ & CABLÂGE :
- Appareil de test : ${test?.tester_model || 'Testeur de continuité normalisé'}
- Résultat : ${test?.result || 'NON TESTÉ'}
- Détail du schéma de câblage (Pinout) : ${test?.pinout_detail || 'Brochage standard EIA/TIA 568B'}
- Date du test : ${test?.tested_at || '-'}

RÉSERVES & ANOMALIES ASSOCIÉES :
${relatedAnom.length === 0 ? 'Aucune anomalie signalée sur ce point.' : relatedAnom.map(a => `- [${a.code}] (${a.severity}) : ${a.description} -> Statut : ${a.status} ${a.corrective_action ? '(Action: ' + a.corrective_action.action_taken + ')' : ''}`).join('\n')}

MENTION DE CONFORMITÉ :
Attestation de contrôle de continuité et de conformité physique terrain.
Établie par Herton.pro pour le compte de ${data.client}.
========================================================================
`;
      fichesFolder.file(`${out.code}.txt`, ficheText);
    });
  }

  // 6. Galerie Photos Classées
  let photosIndex = 'INVENTAIRE DES CLICHÉS PHOTOGRAPHIQUES TERRAIN\n';
  photosIndex += '===================================================\n\n';
  data.photos.forEach(ph => {
    photosIndex += `- ID: ${ph.id} | Entité: ${ph.entity_type} (${ph.entity_id})\n`;
    photosIndex += `  Légende: ${ph.caption}\n`;
    photosIndex += `  Date: ${ph.created_at}\n`;
    photosIndex += `  Fichier / Lien: ${ph.url_or_base64.slice(0, 100)}...\n\n`;
  });
  zip.file('06_Galerie_Photos_Classées/inventaire_photos.txt', photosIndex);

  // 7. Données brutes JSON complètes
  zip.file('07_Donnees_Brutes_Export.json', JSON.stringify(data, null, 2));

  // Génération du blob ZIP et téléchargement
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  const sanitizedProjectName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `DOSSIER_TECHNIQUE_${sanitizedProjectName}_HERTON_FIELD_INSPECTOR_${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
};
