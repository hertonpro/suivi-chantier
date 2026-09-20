import { NetworkInspectorData, NetworkOutlet, NetworkConnection, NetworkZone, NetworkRack, NetworkEquipment, NetworkAnomaly } from '../types';

// ============================================================================
// ZERO-DEPENDENCY ZIP BUILDER (Pure TypeScript / In-Browser)
// Generates standard uncompressed (STORE) .ZIP archives compatible with all OS
// ============================================================================

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
})();

function computeCrc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

interface ZipEntry {
  path: string;
  data: Uint8Array;
}

export class SimpleZip {
  private entries: ZipEntry[] = [];

  file(path: string, content: string | Uint8Array) {
    const data = typeof content === 'string' ? new TextEncoder().encode(content) : content;
    this.entries.push({ path, data });
  }

  folder(prefix: string) {
    const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
    return {
      file: (filename: string, content: string | Uint8Array) => {
        this.file(`${normalizedPrefix}${filename}`, content);
      },
    };
  }

  generateBlob(): Blob {
    const chunks: Uint8Array[] = [];
    let offset = 0;

    const now = new Date();
    const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xffff;
    const dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff;

    const centralDirectoryEntries: {
      pathBytes: Uint8Array;
      dataLength: number;
      crc: number;
      offset: number;
    }[] = [];

    // 1. Local file headers + payload
    for (const entry of this.entries) {
      const pathBytes = new TextEncoder().encode(entry.path);
      const crc = computeCrc32(entry.data);
      const dataLength = entry.data.length;

      const header = new Uint8Array(30);
      const view = new DataView(header.buffer);
      view.setUint32(0, 0x04034b50, true); // Local header signature
      view.setUint16(4, 20, true);         // Version 2.0
      view.setUint16(6, 0x0800, true);     // General purpose flag (UTF-8 encoding)
      view.setUint16(8, 0, true);          // Compression method (0 = STORE)
      view.setUint16(10, dosTime, true);   // Last mod time
      view.setUint16(12, dosDate, true);   // Last mod date
      view.setUint32(14, crc, true);       // CRC-32
      view.setUint32(18, dataLength, true);// Compressed size
      view.setUint32(22, dataLength, true);// Uncompressed size
      view.setUint16(26, pathBytes.length, true); // Filename length
      view.setUint16(28, 0, true);         // Extra field length

      centralDirectoryEntries.push({
        pathBytes,
        dataLength,
        crc,
        offset,
      });

      chunks.push(header);
      chunks.push(pathBytes);
      chunks.push(entry.data);

      offset += header.length + pathBytes.length + dataLength;
    }

    // 2. Central Directory
    const centralDirectoryStartOffset = offset;
    let centralDirectorySize = 0;

    for (const cd of centralDirectoryEntries) {
      const cdHeader = new Uint8Array(46);
      const view = new DataView(cdHeader.buffer);
      view.setUint32(0, 0x02014b50, true); // Central directory signature
      view.setUint16(4, 20, true);         // Version made by
      view.setUint16(6, 20, true);         // Version needed
      view.setUint16(8, 0x0800, true);     // UTF-8
      view.setUint16(10, 0, true);         // Method 0 (STORE)
      view.setUint16(12, dosTime, true);   // Last mod time
      view.setUint16(14, dosDate, true);   // Last mod date
      view.setUint32(16, cd.crc, true);    // CRC-32
      view.setUint32(20, cd.dataLength, true); // Compressed size
      view.setUint32(24, cd.dataLength, true); // Uncompressed size
      view.setUint16(28, cd.pathBytes.length, true); // Filename length
      view.setUint16(30, 0, true);         // Extra length
      view.setUint16(32, 0, true);         // Comment length
      view.setUint16(34, 0, true);         // Disk start
      view.setUint16(36, 0, true);         // Internal attr
      view.setUint32(38, 0, true);         // External attr
      view.setUint32(42, cd.offset, true); // Local header offset

      chunks.push(cdHeader);
      chunks.push(cd.pathBytes);

      const entrySize = cdHeader.length + cd.pathBytes.length;
      centralDirectorySize += entrySize;
      offset += entrySize;
    }

    // 3. End of Central Directory (EOCD)
    const eocd = new Uint8Array(22);
    const view = new DataView(eocd.buffer);
    view.setUint32(0, 0x06054b50, true); // EOCD signature
    view.setUint16(4, 0, true);          // Disk number
    view.setUint16(6, 0, true);          // Start disk
    view.setUint16(8, this.entries.length, true);  // Disk entries
    view.setUint16(10, this.entries.length, true); // Total entries
    view.setUint32(12, centralDirectorySize, true); // CD size
    view.setUint32(16, centralDirectoryStartOffset, true); // CD offset
    view.setUint16(20, 0, true);         // Comment length

    chunks.push(eocd);

    return new Blob(chunks, { type: 'application/zip' });
  }
}

// ============================================================================
// DOSSIER TECHNIQUE FINAL EXPORTER
// ============================================================================

export const generateDossierTechniqueZip = async (data: NetworkInspectorData, projectName: string) => {
  const zip = new SimpleZip();

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

    const ppName = conn?.patch_panel_name || (pp ? `${pp.brand} ${pp.model}` : conn?.patch_panel_id || '-');
    const swName = conn?.switch_name || (sw ? `${sw.brand} ${sw.model}` : conn?.switch_id || '-');
    const roomName = out.zone_name || zone?.room || '-';

    matrixCsv += `"${out.code}";"${out.type}";"${zone?.building || '-'}";"${zone?.service || '-'}";"${roomName}";"${zone?.floor || '-'}";"${cable?.code || '-'}";"${cable?.category || '-'}";"${cable?.length_est || '-'}";"${ppName}";"${conn?.patch_port || '-'}";"${swName}";"${conn?.switch_port || '-'}";"${conn?.vlan || '-'}";"${physicalStatus}";"${test?.tester_model || '-'}";"${testStatus}";"${out.status}"\n`;
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

      const ppName = conn?.patch_panel_name || (pp ? `${pp.brand} ${pp.model}` : 'Non raccordé');
      const swName = conn?.switch_name || (sw ? `${sw.brand} ${sw.model}` : 'Non raccordé');
      const roomName = out.zone_name || zone?.room || 'Non renseigné';

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
- Local / Bureau : ${roomName}
- Étage : ${zone?.floor || 'RDC'}

CHAÎNE DE LIAISON PHYSIQUE (TRAÇABILITÉ COMPLÈTE) :
1. Prise Terminale : [ ${out.code} ] (${out.type})
2. Câble de liaison : [ ${cable?.code || 'Non renseigné'} ] (Catégorie: ${cable?.category || 'CAT6A'} - Longueur est.: ${cable?.length_est || '-'}m)
3. Panneau de Brassage : [ ${ppName} ] -> Port: ${conn?.patch_port || '-'}
4. Commutateur (Switch) : [ ${swName} ] -> Port: ${conn?.switch_port || '-'}
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
  const zipBlob = zip.generateBlob();
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
