// ─────────────────────────────────────────────────────────────
// BACKUP DO FIRESTORE — App Família Aliança
// ─────────────────────────────────────────────────────────────
// O que faz: baixa TODOS os dados do banco (músicas, membros,
// escalas, avisos, pregações, etc.) e salva num arquivo .json
// na sua própria pasta, com data e hora no nome.
//
// COMO USAR:
// 1. Abra o Prompt de Comando na pasta do projeto:
//      cd E:\projetoigreja\familia-alianca
// 2. Rode:
//      node backup-firestore.mjs
// 3. Aguarde terminar — vai aparecer um arquivo tipo
//    "backup-familia-alianca-2026-07-27-14-30-00.json"
//    na mesma pasta. Guarde esse arquivo num lugar seguro
//    (Google Drive, pendrive, etc.)
//
// Não precisa instalar nada além do que o projeto já tem
// (o pacote "firebase" já vem com o projeto).
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = {
  apiKey: "AIzaSyCaoMEeWAa28IKfRpGH9dHrKnwpgbZ9RUo",
  authDomain: "familia-alianca.firebaseapp.com",
  projectId: "familia-alianca",
  storageBucket: "familia-alianca.firebasestorage.app",
  messagingSenderId: "1078568691508",
  appId: "1:1078568691508:web:7a90131afc803659666761",
};

// Todas as coleções que o app usa hoje.
// Se no futuro criarmos uma coleção nova, é só adicionar o nome aqui.
const COLECOES = [
  "agenda",
  "arquivosMidia",
  "avisos",
  "categoriasEquipe",
  "cifras",
  "concluidos",
  "config",
  "dizimistas",
  "escalas",
  "estudos",
  "fcm_tokens",
  "lancamentos",
  "membros",
  "musicas",
  "oracoes",
  "palavra",
  "palavras_historico",
  "pregacoes",
  "vs",
];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function carimboData() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

async function main() {
  console.log("🔄 Iniciando backup do Família Aliança...\n");
  const backup = {};
  let totalDocumentos = 0;

  for (const nome of COLECOES) {
    try {
      process.stdout.write(`  Baixando "${nome}"... `);
      const snap = await getDocs(collection(db, nome));
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      backup[nome] = docs;
      totalDocumentos += docs.length;
      console.log(`${docs.length} documento(s)`);
    } catch (err) {
      console.log(`⚠️  erro ao baixar (${err.message})`);
      backup[nome] = { erro: err.message };
    }
  }

  const nomeArquivo = `backup-familia-alianca-${carimboData()}.json`;
  fs.writeFileSync(nomeArquivo, JSON.stringify(backup, null, 2), "utf-8");

  console.log(`\n✅ Backup concluído!`);
  console.log(`   Total de documentos: ${totalDocumentos}`);
  console.log(`   Arquivo salvo em: ${nomeArquivo}`);
  console.log(`\n💡 Guarde esse arquivo em um lugar seguro (Google Drive, pendrive, e-mail para você mesmo, etc.)`);
  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ Erro ao fazer backup:", err);
  process.exit(1);
});
