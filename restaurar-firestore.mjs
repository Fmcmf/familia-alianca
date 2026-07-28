// ─────────────────────────────────────────────────────────────
// RESTAURAR BACKUP DO FIRESTORE — App Família Aliança
// ─────────────────────────────────────────────────────────────
// O que faz: lê um arquivo de backup (.json gerado pelo
// backup-firestore.mjs ou pela aba Backup do app) e escreve
// tudo de volta no banco de dados, documento por documento,
// usando os MESMOS IDs de antes — para manter os vínculos
// entre músicas, escalas, membros, etc. intactos.
//
// ⚠️ IMPORTANTE: isso SOBRESCREVE os dados atuais que tiverem
// o mesmo ID do backup. Só use isso se realmente precisar
// restaurar (perda de dados, erro grave, etc.) — não é pra uso
// do dia a dia.
//
// COMO USAR:
// 1. Coloque este arquivo na pasta do projeto, junto com o
//    arquivo de backup que você quer restaurar (ex:
//    backup-familia-alianca-2026-07-27-13-22-56.json)
// 2. Abra o terminal na pasta do projeto:
//      cd E:\projetoigreja\familia-alianca
// 3. Rode, indicando o nome exato do arquivo de backup:
//      node restaurar-firestore.mjs backup-familia-alianca-2026-07-27-13-22-56.json
// 4. O script vai mostrar um resumo e pedir confirmação
//    (digite "SIM" pra confirmar) antes de escrever qualquer coisa.
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";
import readline from "readline";

const firebaseConfig = {
  apiKey: "AIzaSyCaoMEeWAa28IKfRpGH9dHrKnwpgbZ9RUo",
  authDomain: "familia-alianca.firebaseapp.com",
  projectId: "familia-alianca",
  storageBucket: "familia-alianca.firebasestorage.app",
  messagingSenderId: "1078568691508",
  appId: "1:1078568691508:web:7a90131afc803659666761",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function perguntar(texto) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(texto, (resp) => { rl.close(); resolve(resp); }));
}

async function main() {
  const nomeArquivo = process.argv[2];
  if (!nomeArquivo) {
    console.log("❌ Você precisa indicar o arquivo de backup. Exemplo:");
    console.log("   node restaurar-firestore.mjs backup-familia-alianca-2026-07-27-13-22-56.json");
    process.exit(1);
  }
  if (!fs.existsSync(nomeArquivo)) {
    console.log(`❌ Arquivo "${nomeArquivo}" não encontrado nesta pasta.`);
    process.exit(1);
  }

  const backup = JSON.parse(fs.readFileSync(nomeArquivo, "utf-8"));
  const colecoes = Object.keys(backup);
  let totalDocumentos = 0;
  console.log("📋 Resumo do backup a ser restaurado:\n");
  for (const nome of colecoes) {
    const qtd = Array.isArray(backup[nome]) ? backup[nome].length : 0;
    totalDocumentos += qtd;
    console.log(`   ${nome}: ${qtd} documento(s)`);
  }
  console.log(`\n   TOTAL: ${totalDocumentos} documento(s) em ${colecoes.length} coleção(ões)`);

  console.log("\n⚠️  ATENÇÃO: isso vai SOBRESCREVER os dados atuais que tiverem o mesmo ID.");
  const resposta = await perguntar('\nDigite "SIM" (em maiúsculas) para confirmar e continuar: ');
  if (resposta.trim() !== "SIM") {
    console.log("\n🚫 Cancelado. Nada foi alterado.");
    process.exit(0);
  }

  console.log("\n🔄 Restaurando...\n");
  let escritos = 0, falhas = 0;
  for (const nome of colecoes) {
    const docs = backup[nome];
    if (!Array.isArray(docs)) continue;
    for (const item of docs) {
      const { id, ...dados } = item;
      if (!id) continue;
      try {
        await setDoc(doc(db, nome, id), dados);
        escritos++;
      } catch (err) {
        falhas++;
        console.log(`  ❌ Falha em ${nome}/${id}: ${err.message}`);
      }
    }
    console.log(`  ✅ Coleção "${nome}" restaurada`);
  }

  console.log(`\n✅ Restauração concluída!`);
  console.log(`   Documentos escritos: ${escritos}`);
  console.log(`   Falhas: ${falhas}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ Erro geral:", err);
  process.exit(1);
});
