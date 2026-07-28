// ─────────────────────────────────────────────────────────────
// BACKUP DOS ARQUIVOS (Cloudinary) — App Família Aliança
// ─────────────────────────────────────────────────────────────
// O que faz: percorre todas as músicas, cifras, VS e imagens do
// telão cadastradas no banco, e baixa CADA ARQUIVO de verdade
// (PDF, áudio, imagem) pro seu computador, organizado em pastas.
//
// COMO USAR:
// 1. Coloque este arquivo na pasta do projeto:
//      E:\projetoigreja\familia-alianca\backup-arquivos-cloudinary.mjs
// 2. Abra o Prompt de Comando na pasta do projeto:
//      cd E:\projetoigreja\familia-alianca
// 3. Rode:
//      node backup-arquivos-cloudinary.mjs
// 4. Aguarde — pode demorar alguns minutos dependendo de quantos
//    arquivos existem. Vai criar uma pasta "backup-arquivos"
//    com tudo organizado dentro, por música.
//
// Não precisa instalar nada além do que o projeto já tem.
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";
import path from "path";

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

const PASTA_BASE = "backup-arquivos";

// Deixa o nome seguro pra usar como nome de pasta/arquivo no Windows/Mac
function nomeSeguro(texto, maxLen = 60) {
  return (texto || "sem-nome")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // tira acentos
    .replace(/[\\/:*?"<>|]/g, "") // tira caracteres proibidos
    .trim()
    .slice(0, maxLen) || "sem-nome";
}

// Descobre a extensão do arquivo pela URL, ou por padrão
function extensaoDaUrl(url) {
  const semQuery = url.split("?")[0];
  const partes = semQuery.split(".");
  const possivel = partes[partes.length - 1];
  if (possivel && possivel.length <= 5 && /^[a-zA-Z0-9]+$/.test(possivel)) return possivel;
  return "bin";
}

let totalBaixados = 0;
let totalErros = 0;
let totalJaExistia = 0;

async function baixarArquivo(url, caminhoDestino) {
  if (!url || !url.startsWith("http")) return;
  if (fs.existsSync(caminhoDestino)) {
    totalJaExistia++;
    return;
  }
  try {
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    const buffer = Buffer.from(await resposta.arrayBuffer());
    fs.mkdirSync(path.dirname(caminhoDestino), { recursive: true });
    fs.writeFileSync(caminhoDestino, buffer);
    totalBaixados++;
    console.log(`  ✅ ${path.basename(caminhoDestino)}`);
  } catch (err) {
    totalErros++;
    console.log(`  ❌ Falhou: ${caminhoDestino} (${err.message})`);
  }
}

async function main() {
  console.log("🔄 Iniciando backup dos arquivos do Cloudinary...\n");
  fs.mkdirSync(PASTA_BASE, { recursive: true });

  // ── 1. Arquivos dentro de cada música (modelo novo) ──
  console.log("🎵 Músicas...");
  const musicasSnap = await getDocs(collection(db, "musicas"));
  for (const docSnap of musicasSnap.docs) {
    const m = docSnap.data();
    const arquivos = m.arquivos || [];
    if (arquivos.length === 0) continue;
    const pastaMusica = path.join(PASTA_BASE, "musicas", nomeSeguro(m.titulo));
    for (const a of arquivos) {
      const ext = extensaoDaUrl(a.url);
      const nomeArq = `${nomeSeguro(a.nome)}.${ext}`;
      await baixarArquivo(a.url, path.join(pastaMusica, nomeArq));
    }
  }

  // ── 2. Cifras antigas (modelo anterior) ──
  console.log("\n🎸 Cifras (modelo antigo)...");
  const cifrasSnap = await getDocs(collection(db, "cifras"));
  for (const docSnap of cifrasSnap.docs) {
    const c = docSnap.data();
    if (!c.arquivo) continue;
    const ext = extensaoDaUrl(c.arquivo);
    await baixarArquivo(c.arquivo, path.join(PASTA_BASE, "cifras-antigas", `${nomeSeguro(c.titulo)}.${ext}`));
  }

  // ── 3. VS antigos (modelo anterior) ──
  console.log("\n🎧 VS (modelo antigo)...");
  const vsSnap = await getDocs(collection(db, "vs"));
  for (const docSnap of vsSnap.docs) {
    const v = docSnap.data();
    if (!v.arquivo) continue;
    const ext = extensaoDaUrl(v.arquivo);
    await baixarArquivo(v.arquivo, path.join(PASTA_BASE, "vs-antigos", `${nomeSeguro(v.titulo)}.${ext}`));
  }

  // ── 4. Imagens do Telão (Mídia) ──
  console.log("\n🖼️ Imagens do Telão...");
  const arquivosMidiaSnap = await getDocs(collection(db, "arquivosMidia"));
  for (const docSnap of arquivosMidiaSnap.docs) {
    const a = docSnap.data();
    if (!a.arquivo) continue;
    const ext = extensaoDaUrl(a.arquivo);
    await baixarArquivo(a.arquivo, path.join(PASTA_BASE, "imagens-telao", `${nomeSeguro(a.titulo)}.${ext}`));
  }

  console.log(`\n✅ Backup de arquivos concluído!`);
  console.log(`   Baixados agora: ${totalBaixados}`);
  console.log(`   Já existiam (pulados): ${totalJaExistia}`);
  console.log(`   Falharam: ${totalErros}`);
  console.log(`   Pasta: ${path.resolve(PASTA_BASE)}`);
  console.log(`\n💡 Guarde essa pasta inteira em um lugar seguro (Google Drive, HD externo, etc.)`);
  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ Erro geral:", err);
  process.exit(1);
});
