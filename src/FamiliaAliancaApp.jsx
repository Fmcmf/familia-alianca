import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc } from "firebase/firestore";

// ─── CONFIG ────────────────────────────────────────────────────────────────
const YOUTUBE_CHANNEL = "familiaaliancapiracicaba";
const WHATSAPP_PASTOR = "5519997218590";
const PIX_KEY = "13.327.600/0001-00";

const ENDERECO = "Rua Armando Longatti, nº 45 - Vila Industrial - Piracicaba/SP";
const MAPS_URL = "https://www.google.com/maps/search/?api=1&query=Rua+Armando+Longatti+45+Vila+Industrial+Piracicaba+SP";

const HORARIOS_CULTO = [
  { dia: "Quinta-feira", hora: "20h", icon: "🌙" },
  { dia: "Domingo", hora: "10h", icon: "🌅" },
  { dia: "Domingo", hora: "19h", icon: "🌆" },
];

const WHATSAPP_SERVICOS = [
  { label: "Agendamento", icon: "📅" },
  { label: "Atendimento", icon: "🤝" },
  { label: "Pedido de Oração", icon: "🙏" },
  { label: "Visita Pastoral", icon: "🏠" },
  { label: "Aconselhamento", icon: "💬" },
];

// ─── DADOS INICIAIS (substituídos pelo Firebase futuramente) ────────────────
const AGENDA_INICIAL = [
  { id: 1, titulo: "Culto de Domingo", data: "2026-04-27", hora: "10:00", local: "Rua Armando Longatti, 45", tipo: "culto" },
  { id: 2, titulo: "Culto de Domingo", data: "2026-04-27", hora: "19:00", local: "Rua Armando Longatti, 45", tipo: "culto" },
  { id: 3, titulo: "Culto de Quinta-feira", data: "2026-05-01", hora: "20:00", local: "Rua Armando Longatti, 45", tipo: "culto" },
];

const MINISTERIOS = [
  { id: 1, nome: "Recepção & Acolhimento", icon: "🤝", desc: "Bem-vindos com amor e cuidado a cada visitante e membro da família.", cor: "#c9a84c" },
  { id: 2, nome: "Aliança Music", icon: "🎵", desc: "Adoração que transforma, música que toca o coração de Deus.", cor: "#8b5cf6" },
  { id: 3, nome: "Aliança Kids", icon: "⭐", desc: "Crianças aprendendo o amor de Jesus de forma divertida e criativa.", cor: "#f59e0b" },
  { id: 4, nome: "Ação Social", icon: "❤️", desc: "Servindo a comunidade com amor prático e transformador.", cor: "#ef4444" },
  { id: 5, nome: "Intercessão", icon: "🙏", desc: "Guerreiros de oração intercedendo pela igreja e pela cidade.", cor: "#3b82f6" },
];

const CONTATOS = {
  endereco: ENDERECO,
  whatsapp: "(19) 99721-8590",
  email: "contato@familiaalianca.com.br",
  instagram: "https://instagram.com/familiaaliancapiracicaba",
  youtube: "https://www.youtube.com/@familiaaliancapiracicaba",
  facebook: "https://facebook.com/familiaaliancapiracicaba",
};

// ─── BÍBLIA (livros) ────────────────────────────────────────────────────────
const LIVROS_AT = ["Gênesis","Êxodo","Levítico","Números","Deuteronômio","Josué","Juízes","Rute","1 Samuel","2 Samuel","1 Reis","2 Reis","1 Crônicas","2 Crônicas","Esdras","Neemias","Ester","Jó","Salmos","Provérbios","Eclesiastes","Cantares","Isaías","Jeremias","Lamentações","Ezequiel","Daniel","Oséias","Joel","Amós","Obadias","Jonas","Miquéias","Naum","Habacuque","Sofonias","Ageu","Zacarias","Malaquias"];
const LIVROS_NT = ["Mateus","Marcos","Lucas","João","Atos","Romanos","1 Coríntios","2 Coríntios","Gálatas","Efésios","Filipenses","Colossenses","1 Tessalonicenses","2 Tessalonicenses","1 Timóteo","2 Timóteo","Tito","Filemom","Hebreus","Tiago","1 Pedro","2 Pedro","1 João","2 João","3 João","Judas","Apocalipse"];

// ─── STORAGE ───────────────────────────────────────────────────────────────
const SK = {
  user: "fa-user",
  agenda: "fa-agenda",
  palavra: "fa-palavra",
  membros: "fa-membros",
  oracoes: "fa-oracoes",
};

const store = {
  get: (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ─── HELPERS ───────────────────────────────────────────────────────────────
const fmtData = (s) => { if (!s) return ""; const [a, m, d] = s.split("-"); return `${d}/${m}/${a}`; };
const tipoColor = { culto: "#c9a84c", oracao: "#3b82f6", kids: "#f59e0b", music: "#8b5cf6" };
const tipoLabel = { culto: "Culto", oracao: "Oração", kids: "Kids", music: "Music" };

export default function FamiliaAliancaApp() {
  const [screen, setScreen] = useState("splash");
  const [tab, setTab] = useState("home");
  const [user, setUser] = useState(null); // eslint-disable-line no-unused-vars
  const [isAdmin, setIsAdmin] = useState(false);

  // Auth
  const [loginForm, setLoginForm] = useState({ nome: "", email: "", senha: "", modo: "login" });
  const [loginErro, setLoginErro] = useState("");

  // Dados
  const [agenda, setAgenda] = useState([]);
  const [palavra, setPalavra] = useState(null);
  const [oracoes, setOracoes] = useState([]);
  const [membros, setMembros] = useState([]);

  // UI
  const [toast, setToast] = useState("");
  const [ministerioAtivo, setMinisterioAtivo] = useState(null);
  const [oracao, setOracao] = useState({ nome: "", pedido: "" });
  const [biblia, setBiblia] = useState({ testamento: "AT", livro: "", capitulo: 1, versos: null, loading: false, versiculo: null });
  const [adminTab, setAdminTab] = useState("agenda");
  const [novoEvento, setNovoEvento] = useState({ titulo: "", data: "", hora: "", local: "", tipo: "culto" });
  const [novaPalavra, setNovaPalavra] = useState({ titulo: "", texto: "", referencia: "", video: "" });
  const [editandoEvento, setEditandoEvento] = useState(null);

  // Splash + Firebase load
  useEffect(() => {
    setTimeout(() => {
      const u = store.get(SK.user, null);
      if (u) { setUser(u); setIsAdmin(u.admin || false); setScreen("app"); } // eslint-disable-line no-unused-vars
      else setScreen("login");
    }, 2200);

    // Agenda — tempo real
    const unsubAgenda = onSnapshot(collection(db, "agenda"), (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      lista.sort((a, b) => a.data.localeCompare(b.data));
      setAgenda(lista);
    });

    // Palavra — tempo real
    const unsubPalavra = onSnapshot(collection(db, "palavra"), (snap) => {
      if (!snap.empty) setPalavra({ id: snap.docs[0].id, ...snap.docs[0].data() });
    });

    // Orações — tempo real
    const unsubOracoes = onSnapshot(collection(db, "oracoes"), (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      lista.sort((a, b) => b.data.localeCompare(a.data));
      setOracoes(lista);
    });

    // Membros — tempo real
    const unsubMembros = onSnapshot(collection(db, "membros"), (snap) => {
      setMembros(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubAgenda(); unsubPalavra(); unsubOracoes(); unsubMembros(); };
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  // ── AUTH ──
  const handleLogin = async () => {
    if (loginForm.modo === "cadastro") {
      if (!loginForm.nome || !loginForm.email || !loginForm.senha) { setLoginErro("Preencha todos os campos."); return; }
      const snap = await getDoc(doc(db, "membros", loginForm.email));
      if (snap.exists()) { setLoginErro("E-mail já cadastrado."); return; }
      const u = { nome: loginForm.nome, email: loginForm.email, senha: loginForm.senha, admin: false };
      await setDoc(doc(db, "membros", loginForm.email), u);
      store.set(SK.user, { ...u, id: loginForm.email });
      setUser({ ...u, id: loginForm.email }); setScreen("app");
    } else {
      // admin master
      if (loginForm.email === "pastor@familiaalianca.com.br" && loginForm.senha === "alianca2024") {
        const u = { id: 0, nome: "Pr Fernando Mello", email: loginForm.email, admin: true };
        store.set(SK.user, u); setUser(u); setIsAdmin(true); setScreen("app"); return;
      }
      const snap = await getDoc(doc(db, "membros", loginForm.email));
      if (!snap.exists() || snap.data().senha !== loginForm.senha) { setLoginErro("E-mail ou senha incorretos."); return; }
      const u = { id: loginForm.email, ...snap.data() };
      store.set(SK.user, u); setUser(u); setIsAdmin(u.admin || false); setScreen("app");
    }
  };

  const handleLogout = () => { store.set(SK.user, null); setUser(null); setIsAdmin(false); setScreen("login"); setLoginForm({ nome: "", email: "", senha: "", modo: "login" }); };

  // ── AGENDA ──
  const salvarEvento = async () => {
    if (!novoEvento.titulo || !novoEvento.data || !novoEvento.hora) return;
    if (editandoEvento) {
      await updateDoc(doc(db, "agenda", editandoEvento), novoEvento);
      setEditandoEvento(null);
    } else {
      await addDoc(collection(db, "agenda"), novoEvento);
    }
    setNovoEvento({ titulo: "", data: "", hora: "", local: "", tipo: "culto" });
    showToast("✅ Evento salvo!");
  };

  const deletarEvento = async (id) => {
    await deleteDoc(doc(db, "agenda", id));
  };

  // ── PALAVRA ──
  const salvarPalavra = async () => {
    if (!novaPalavra.titulo || !novaPalavra.texto) return;
    const p = { ...novaPalavra, data: new Date().toISOString().split("T")[0] };
    await setDoc(doc(db, "palavra", "atual"), p);
    showToast("✅ Palavra salva!");
  };

  // ── ORAÇÃO ──
  const enviarOracao = async () => {
    if (!oracao.nome || !oracao.pedido) return;
    const msg = `🙏 *Pedido de Oração - Família Aliança*\n\n*Nome:* ${oracao.nome}\n\n*Pedido:* ${oracao.pedido}\n\n_Enviado pelo App Família Aliança_`;
    window.open(`https://wa.me/${WHATSAPP_PASTOR}?text=${encodeURIComponent(msg)}`, "_blank");
    await addDoc(collection(db, "oracoes"), { ...oracao, data: new Date().toISOString() });
    setOracao({ nome: "", pedido: "" });
    showToast("🙏 Pedido enviado!");
  };

  // ── BÍBLIA ──
  const buscarVersos = async (livro, cap) => {
    setBiblia(b => ({ ...b, loading: true, versos: null, versiculo: null }));
    try {
      const livroEnc = encodeURIComponent(livro);
      const res = await fetch(`https://bible-api.com/${livroEnc}+${cap}?translation=almeida`);
      const data = await res.json();
      setBiblia(b => ({ ...b, versos: data.verses || [], loading: false, livro, capitulo: cap, versiculo: null }));
    } catch {
      setBiblia(b => ({ ...b, loading: false, versos: [] }));
      showToast("Erro ao carregar. Verifique a conexão.");
    }
  };

  // ── STYLES ──
  const S = {
    app: { minHeight: "100vh", background: "#080810", color: "#f0eefc", fontFamily: "'Georgia', 'Times New Roman', serif", position: "relative", overflowX: "hidden" },
    bg: { position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(100,60,180,.15) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 100%, rgba(201,168,76,.08) 0%, transparent 60%)" },
    wrap: { position: "relative", zIndex: 1, maxWidth: 430, margin: "0 auto", paddingBottom: 90 },

    // Splash
    splash: { minHeight: "100vh", background: "#080810", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 },
    splashLogo: { width: 160, animation: "fadeIn 1s ease" },
    splashTag: { fontSize: 13, letterSpacing: 4, textTransform: "uppercase", color: "rgba(255,255,255,.35)" },

    // Login
    loginWrap: { minHeight: "100vh", background: "#080810", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 28px" },
    loginLogo: { width: 120, marginBottom: 32 },
    loginTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 6, textAlign: "center" },
    loginSub: { fontSize: 13, color: "rgba(255,255,255,.4)", marginBottom: 32, textAlign: "center" },
    input: { width: "100%", background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.25)", borderRadius: 12, padding: "14px 16px", color: "#ffffff", fontSize: 15, fontFamily: "Georgia,serif", outline: "none", boxSizing: "border-box", marginBottom: 12 },
    loginBtn: { width: "100%", padding: "14px 0", background: "linear-gradient(90deg,#c9a84c,#e8c97a)", border: "none", borderRadius: 12, color: "#080810", fontSize: 15, fontWeight: "bold", cursor: "pointer", fontFamily: "Georgia,serif", marginBottom: 12 },
    switchBtn: { background: "none", border: "none", color: "#c9a84c", fontSize: 13, cursor: "pointer", fontFamily: "Georgia,serif", textDecoration: "underline" },
    errMsg: { color: "#ef4444", fontSize: 13, marginBottom: 10, textAlign: "center" },

    // Header
    header: { padding: "28px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" },
    headerLogo: { height: 38 },
    headerUser: { fontSize: 12, color: "rgba(255,255,255,.4)", textAlign: "right" },
    headerName: { fontSize: 13, color: "#c9a84c", fontWeight: "bold" },

    // Section
    secTitle: { fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,.3)", padding: "0 20px", marginBottom: 12, marginTop: 24 },

    // Cards
    card: { margin: "0 16px 12px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: "16px 18px" },
    heroCard: { margin: "0 16px 8px", background: "linear-gradient(135deg,rgba(201,168,76,.18),rgba(100,60,180,.12))", border: "1px solid rgba(201,168,76,.2)", borderRadius: 20, padding: "22px 20px" },

    // Evento
    eventoCard: { margin: "0 16px 10px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 14, padding: "14px 16px", display: "flex", gap: 14, alignItems: "center" },
    eventoData: { minWidth: 44, textAlign: "center" },
    eventoDay: { fontSize: 22, fontWeight: "bold", color: "#c9a84c", lineHeight: 1 },
    eventoMon: { fontSize: 10, color: "rgba(255,255,255,.4)", textTransform: "uppercase" },
    eventoInfo: { flex: 1 },
    eventoTitle: { fontSize: 14, fontWeight: "bold", marginBottom: 3 },
    eventoSub: { fontSize: 12, color: "rgba(255,255,255,.4)" },
    eventoBadge: (tipo) => ({ display: "inline-block", fontSize: 10, padding: "2px 8px", borderRadius: 20, background: `${tipoColor[tipo]}22`, color: tipoColor[tipo], border: `1px solid ${tipoColor[tipo]}44`, marginTop: 4 }),

    // Ministerio
    minCard: { margin: "0 16px 10px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: "16px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 },
    minIcon: { fontSize: 28, minWidth: 44, textAlign: "center" },
    minInfo: { flex: 1 },
    minNome: { fontSize: 14, fontWeight: "bold", marginBottom: 3 },
    minDesc: { fontSize: 12, color: "rgba(255,255,255,.45)", lineHeight: 1.5 },

    // Nav
    nav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "rgba(8,8,16,.96)", borderTop: "1px solid rgba(255,255,255,.07)", display: "flex", backdropFilter: "blur(20px)", zIndex: 100 },
    navBtn: (a) => ({ flex: 1, padding: "10px 0 14px", background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: a ? "#c9a84c" : "rgba(255,255,255,.28)", fontSize: 9, letterSpacing: 1, textTransform: "uppercase", fontFamily: "Georgia,serif" }),
    navIcon: { fontSize: 18 },

    // Bíblia
    livroBtn: (sel) => ({ padding: "8px 14px", background: sel ? "rgba(201,168,76,.2)" : "rgba(255,255,255,.04)", border: `1px solid ${sel ? "rgba(201,168,76,.5)" : "rgba(255,255,255,.08)"}`, borderRadius: 20, fontSize: 12, color: sel ? "#c9a84c" : "rgba(255,255,255,.6)", cursor: "pointer", fontFamily: "Georgia,serif", whiteSpace: "nowrap" }),
    versoRow: { display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" },
    versoNum: { fontSize: 11, color: "#c9a84c", minWidth: 22, paddingTop: 2, fontWeight: "bold" },
    versoText: { fontSize: 15, lineHeight: 1.75, color: "rgba(255,255,255,.88)", flex: 1 },

    // Contribuição
    pixCard: { margin: "0 16px 12px", background: "linear-gradient(135deg,rgba(201,168,76,.15),rgba(201,168,76,.05))", border: "1px solid rgba(201,168,76,.25)", borderRadius: 16, padding: "20px" },
    pixTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 4, color: "#c9a84c" },
    pixSub: { fontSize: 12, color: "rgba(255,255,255,.5)", marginBottom: 16 },
    pixKey: { background: "rgba(0,0,0,.3)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#e8c97a", letterSpacing: 1, marginBottom: 8, wordBreak: "break-all" },
    copyBtn: { width: "100%", padding: "12px 0", background: "rgba(201,168,76,.15)", border: "1px solid rgba(201,168,76,.3)", borderRadius: 10, color: "#c9a84c", fontSize: 13, cursor: "pointer", fontFamily: "Georgia,serif" },

    // Palavra
    palavraCard: { margin: "0 16px 12px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: "20px" },
    palavraTitulo: { fontSize: 18, fontWeight: "bold", marginBottom: 8, lineHeight: 1.3 },
    palavraRef: { fontSize: 13, color: "#c9a84c", marginBottom: 12, fontStyle: "italic" },
    palavraTexto: { fontSize: 14.5, lineHeight: 1.8, color: "rgba(255,255,255,.82)" },

    // Contato
    contatoRow: { display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,.06)" },
    contatoIcon: { fontSize: 20, minWidth: 32, textAlign: "center" },
    contatoText: { fontSize: 13, color: "rgba(255,255,255,.75)" },

    // Admin
    adminHeader: { padding: "24px 20px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    adminTitle: { fontSize: 17, fontWeight: "bold" },
    adminTabs: { display: "flex", gap: 8, padding: "0 16px", marginBottom: 20, overflowX: "auto" },
    adminTab: (a) => ({ padding: "8px 16px", background: a ? "rgba(201,168,76,.2)" : "rgba(255,255,255,.04)", border: `1px solid ${a ? "rgba(201,168,76,.4)" : "rgba(255,255,255,.08)"}`, borderRadius: 20, fontSize: 12, color: a ? "#c9a84c" : "rgba(255,255,255,.5)", cursor: "pointer", fontFamily: "Georgia,serif", whiteSpace: "nowrap" }),
    label: { display: "block", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,.35)", marginBottom: 6, marginTop: 14 },
    select: { width: "100%", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, padding: "12px 14px", color: "#f0eefc", fontSize: 14, fontFamily: "Georgia,serif", outline: "none", boxSizing: "border-box" },
    saveBtn: { width: "100%", marginTop: 16, padding: "14px 0", background: "linear-gradient(90deg,#c9a84c,#e8c97a)", border: "none", borderRadius: 12, color: "#080810", fontSize: 14, fontWeight: "bold", cursor: "pointer", fontFamily: "Georgia,serif" },
    delBtn: { padding: "6px 12px", background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 8, color: "#ef4444", fontSize: 12, cursor: "pointer", fontFamily: "Georgia,serif" },
    textarea: { width: "100%", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, padding: "12px 14px", color: "#f0eefc", fontSize: 14, fontFamily: "Georgia,serif", outline: "none", resize: "vertical", minHeight: 100, boxSizing: "border-box" },

    // Toast
    toast: { position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", background: "#1a1830", border: "1px solid rgba(201,168,76,.3)", borderRadius: 12, padding: "12px 24px", fontSize: 13, color: "#f0eefc", zIndex: 999, whiteSpace: "nowrap", boxShadow: "0 4px 24px rgba(0,0,0,.5)" },

    // Logout
    logoutBtn: { background: "none", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, color: "rgba(255,255,255,.4)", fontSize: 11, padding: "5px 10px", cursor: "pointer", fontFamily: "Georgia,serif" },

    // Oração form
    oracaoBtn: { width: "100%", marginTop: 12, padding: "14px 0", background: "linear-gradient(90deg,#25d366,#128C7E)", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: "bold", cursor: "pointer", fontFamily: "Georgia,serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  };


  // ── SPLASH ──
  if (screen === "splash") return (
    <div style={S.splash}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}} @keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}`}</style>
      <img src="/logo-igreja.png" alt="Família Aliança" style={{ width: 180, animation: "fadeIn 1s ease" }} />
      <div style={{ textAlign: "center", animation: "fadeIn 1.4s ease" }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.2)", animation: "pulse 1.5s ease infinite", marginTop: 8, letterSpacing: 3 }}>Igreja do Nazareno</div>
      </div>
    </div>
  );

  // ── LOGIN ──
  if (screen === "login") return (
    <div style={S.loginWrap}>
      <img src="/logo-igreja.png" alt="Família Aliança" style={{ width: 160, marginBottom: 28 }} />
      <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 32, textAlign: "center", color: "#fff", letterSpacing: 1 }}>
        {loginForm.modo === "login" ? "Entrar na sua conta" : "Criar sua conta"}
      </div>

      <div style={{ width: "100%", maxWidth: 360 }}>
        {loginErro && <div style={S.errMsg}>{loginErro}</div>}
        {loginForm.modo === "cadastro" && (
          <input style={S.input} placeholder="Seu nome completo" value={loginForm.nome}
            onChange={e => { setLoginForm({ ...loginForm, nome: e.target.value }); setLoginErro(""); }} />
        )}
        <input style={S.input} placeholder="E-mail" type="email" value={loginForm.email}
          onChange={e => { setLoginForm({ ...loginForm, email: e.target.value }); setLoginErro(""); }} />
        <input style={S.input} placeholder="Senha" type="password" value={loginForm.senha}
          onChange={e => { setLoginForm({ ...loginForm, senha: e.target.value }); setLoginErro(""); }}
          onKeyDown={e => e.key === "Enter" && handleLogin()} />
        <button style={S.loginBtn} onClick={handleLogin}>
          {loginForm.modo === "login" ? "Entrar" : "Criar conta"}
        </button>
        <div style={{ textAlign: "center" }}>
          <button style={S.switchBtn} onClick={() => { setLoginForm({ ...loginForm, modo: loginForm.modo === "login" ? "cadastro" : "login" }); setLoginErro(""); }}>
            {loginForm.modo === "login" ? "Não tenho conta — Cadastrar" : "Já tenho conta — Entrar"}
          </button>
        </div>
      </div>
    </div>
  );

  // ── NAVEGAÇÃO TABS ──
  const TABS = [
    { id: "home", icon: "🏠", label: "Início" },
    { id: "biblia", icon: "📖", label: "Bíblia" },
    { id: "oracao", icon: "🙏", label: "Oração" },
    { id: "ministerios", icon: "✨", label: "Ministérios" },
    { id: "mais", icon: "⋯", label: "Mais" },
    ...(isAdmin ? [{ id: "admin", icon: "⚙️", label: "Admin" }] : []),
  ];

  // próximos eventos
  const hoje = new Date().toISOString().split("T")[0];
  const proximos = agenda.filter(e => e.data >= hoje).slice(0, 4);

  const getMonAbbr = (dataStr) => { const meses = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"]; const [, m] = dataStr.split("-"); return meses[parseInt(m) - 1]; };
  const getDay = (dataStr) => dataStr.split("-")[2];

  // ── RENDER APP ──
  return (
    <div style={S.app}>
      <div style={S.bg} />
      <style>{`
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,.5)}
        input,textarea,select{color:#ffffff !important}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(201,168,76,.3);border-radius:2px}
        select option{background:#1a1830}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div style={S.wrap}>
        {/* HEADER */}
        <div style={S.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo-igreja.png" alt="Família Aliança" style={{ height: 48, width: 48, objectFit: "contain" }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: "bold", letterSpacing: 2, color: "#fff" }}>FAMÍLIA ALIANÇA</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", letterSpacing: 1 }}>Igreja do Nazareno</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <button style={S.logoutBtn} onClick={handleLogout}>Sair</button>
          </div>
        </div>

        {/* ══ HOME ══ */}
        {tab === "home" && (
          <div style={{ animation: "slideUp .4s ease" }}>
            {/* Palavra Semanal */}
            {palavra ? (
              <>
                <div style={S.secTitle}>Palavra Semanal</div>
                <div style={S.heroCard}>
                  <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#c9a84c", marginBottom: 8 }}>Pr Fernando Mello</div>
                  <div style={{ fontSize: 19, fontWeight: "bold", lineHeight: 1.3, marginBottom: 8 }}>{palavra.titulo}</div>
                  {palavra.referencia && <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", fontStyle: "italic", marginBottom: 12 }}>{palavra.referencia}</div>}
                  <div style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,.8)", borderLeft: "2px solid #c9a84c", paddingLeft: 12 }}>
                    {palavra.texto.substring(0, 180)}{palavra.texto.length > 180 ? "..." : ""}
                  </div>
                  <button style={{ marginTop: 14, padding: "10px 0", width: "100%", background: "linear-gradient(90deg,#c9a84c,#e8c97a)", border: "none", borderRadius: 10, color: "#080810", fontSize: 13, fontWeight: "bold", cursor: "pointer", fontFamily: "Georgia,serif" }}
                    onClick={() => setTab("palavra")}>Ler Palavra Completa →</button>
                </div>
              </>
            ) : (
              <div style={{ ...S.card, textAlign: "center", padding: "32px 20px" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📜</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,.5)" }}>Nenhuma palavra semanal publicada ainda.</div>
              </div>
            )}

            {/* Próximas Programações */}
            <div style={S.secTitle}>Próximas Programações</div>
            {proximos.length === 0 ? (
              <div style={{ ...S.card, textAlign: "center", padding: "28px 20px" }}>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.4)" }}>Nenhum evento programado.</div>
              </div>
            ) : proximos.map(ev => (
              <div key={ev.id} style={S.eventoCard}>
                <div style={S.eventoData}>
                  <div style={S.eventoDay}>{getDay(ev.data)}</div>
                  <div style={S.eventoMon}>{getMonAbbr(ev.data)}</div>
                </div>
                <div style={S.eventoInfo}>
                  <div style={S.eventoTitle}>{ev.titulo}</div>
                  <div style={S.eventoSub}>{ev.hora}{ev.local ? ` • ${ev.local}` : ""}</div>
                  <div style={S.eventoBadge(ev.tipo)}>{tipoLabel[ev.tipo]}</div>
                </div>
              </div>
            ))}

            {/* YouTube */}
            <div style={S.secTitle}>Canal no YouTube</div>
            <div style={{ ...S.card, display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
              onClick={() => window.open(`https://www.youtube.com/@${YOUTUBE_CHANNEL}`, "_blank")}>
              <div style={{ background: "#ff0000", borderRadius: 12, width: 52, height: 38, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="24" height="18" viewBox="0 0 24 18" fill="white">
                  <path d="M23.5 2.8S23.2.7 22.3.8C21.4-.1 20.3 0 20.3 0H3.7S2.6-.1 1.7.8C.8.7.5 2.8.5 2.8S0 5.2 0 7.6v2.2c0 2.4.5 4.8.5 4.8s.3 2.1 1.2 2s1.7.8 1.7.8H12s5.5.1 7.3-.1c1.8-.2 1.7-.8 1.7-.8s1.2-1.9 1.2-2 .5-2.4.5-4.8V7.6c0-2.4-.5-4.8-.5-4.8zM9.7 12.1V5.2l6.6 3.5-6.6 3.4z"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 4 }}>Família Aliança Piracicaba</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)" }}>Assista nossos cultos e pregações</div>
                <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>youtube.com/@familiaaliancapiracicaba</div>
              </div>
            </div>

            {/* Contribuição rápida */}
            <div style={S.secTitle}>Contribua com a Igreja</div>
            <div style={S.pixCard}>
              <div style={S.pixTitle}>💛 Dízimos & Ofertas</div>
              <div style={S.pixSub}>Contribua via PIX e seja parte da obra de Deus</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>Chave PIX</div>
              <div style={S.pixKey}>{PIX_KEY}</div>
              <button style={S.copyBtn} onClick={() => { navigator.clipboard.writeText(PIX_KEY); showToast("✅ Chave PIX copiada!"); }}>
                📋 Copiar chave PIX
              </button>
            </div>
          </div>
        )}

        {/* ══ PALAVRA COMPLETA ══ */}
        {tab === "palavra" && palavra && (
          <div style={{ animation: "slideUp .4s ease", padding: "0 0 20px" }}>
            <div style={{ padding: "20px 20px 0", cursor: "pointer", color: "#c9a84c", fontSize: 13 }} onClick={() => setTab("home")}>← Voltar</div>
            <div style={{ padding: "16px 20px 0" }}>
              <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#c9a84c", marginBottom: 8 }}>Palavra Semanal • {fmtData(palavra.data)}</div>
              <div style={{ fontSize: 22, fontWeight: "bold", lineHeight: 1.3, marginBottom: 8 }}>{palavra.titulo}</div>
              {palavra.referencia && <div style={{ fontSize: 14, color: "#c9a84c", fontStyle: "italic", marginBottom: 16 }}>{palavra.referencia}</div>}
              <div style={{ fontSize: 15, lineHeight: 1.9, color: "rgba(255,255,255,.85)" }}>{palavra.texto}</div>
              {palavra.video && (
                <button style={{ ...S.saveBtn, marginTop: 24, background: "linear-gradient(90deg,#ef4444,#dc2626)" }}
                  onClick={() => window.open(palavra.video, "_blank")}>▶️ Assistir no YouTube</button>
              )}
            </div>
          </div>
        )}

        {/* ══ BÍBLIA ══ */}
        {tab === "biblia" && (
          <div style={{ animation: "slideUp .4s ease" }}>
            <div style={S.secTitle}>Bíblia Sagrada</div>
            <div style={{ margin: "0 16px 14px", background: "rgba(201,168,76,.08)", border: "1px solid rgba(201,168,76,.2)", borderRadius: 10, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>📖</span>
              <span style={{ fontSize: 12, color: "#c9a84c", fontStyle: "italic" }}>Nova Versão Transformadora — NVT</span>
            </div>

            {/* Testamento */}
            <div style={{ display: "flex", gap: 10, padding: "0 16px", marginBottom: 16 }}>
              <button style={S.livroBtn(biblia.testamento === "AT")} onClick={() => setBiblia(b => ({ ...b, testamento: "AT", livro: "", versos: null, versiculo: null }))}>Antigo Testamento</button>
              <button style={S.livroBtn(biblia.testamento === "NT")} onClick={() => setBiblia(b => ({ ...b, testamento: "NT", livro: "", versos: null, versiculo: null }))}>Novo Testamento</button>
            </div>

            {/* ETAPA 1: Lista de Livros */}
            {!biblia.livro && (
              <div style={{ padding: "0 16px", display: "flex", flexWrap: "wrap", gap: 8 }}>
                {(biblia.testamento === "AT" ? LIVROS_AT : LIVROS_NT).map(l => (
                  <button key={l} style={{ padding: "7px 12px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 20, fontSize: 12, color: "rgba(255,255,255,.7)", cursor: "pointer", fontFamily: "Georgia,serif" }}
                    onClick={() => setBiblia(b => ({ ...b, livro: l, versos: null, versiculo: null }))}>{l}</button>
                ))}
              </div>
            )}

            {/* ETAPA 2: Capítulos */}
            {biblia.livro && !biblia.versos && !biblia.loading && (
              <div style={{ padding: "0 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <button style={{ ...S.livroBtn(false), fontSize: 11 }} onClick={() => setBiblia(b => ({ ...b, livro: "", versos: null, versiculo: null }))}>← Livros</button>
                  <div style={{ fontSize: 14, fontWeight: "bold", color: "#c9a84c" }}>{biblia.livro}</div>
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginBottom: 12 }}>Escolha o capítulo:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {Array.from({ length: 150 }, (_, i) => i + 1).map(c => (
                    <button key={c} style={{ width: 44, height: 44, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, fontSize: 13, color: "rgba(255,255,255,.7)", cursor: "pointer", fontFamily: "Georgia,serif" }}
                      onClick={() => buscarVersos(biblia.livro, c)}>{c}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading */}
            {biblia.loading && <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,.4)" }}>Carregando...</div>}

            {/* ETAPA 3: Lista de Versículos */}
            {biblia.versos && !biblia.loading && !biblia.versiculo && (
              <div style={{ padding: "0 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                  <button style={{ ...S.livroBtn(false), fontSize: 11 }} onClick={() => setBiblia(b => ({ ...b, versos: null, versiculo: null }))}>← Capítulos</button>
                  <div style={{ fontSize: 14, fontWeight: "bold", color: "#c9a84c" }}>{biblia.livro} {biblia.capitulo}</div>
                  {biblia.capitulo > 1 && <button style={{ ...S.livroBtn(false), fontSize: 11 }} onClick={() => buscarVersos(biblia.livro, biblia.capitulo - 1)}>‹ Ant</button>}
                  <button style={{ ...S.livroBtn(false), fontSize: 11 }} onClick={() => buscarVersos(biblia.livro, biblia.capitulo + 1)}>Próx ›</button>
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginBottom: 12 }}>Escolha o versículo:</div>
                {biblia.versos.length === 0 ? (
                  <div style={{ color: "rgba(255,255,255,.4)", fontSize: 13 }}>Capítulo não encontrado. Tente outro.</div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {biblia.versos.map(v => (
                      <button key={v.verse} style={{ width: 44, height: 44, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, fontSize: 13, color: "rgba(255,255,255,.7)", cursor: "pointer", fontFamily: "Georgia,serif" }}
                        onClick={() => setBiblia(b => ({ ...b, versiculo: v }))}>
                        {v.verse}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ETAPA 4: Versículo selecionado */}
            {biblia.versiculo && !biblia.loading && (
              <div style={{ padding: "0 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <button style={{ ...S.livroBtn(false), fontSize: 11 }} onClick={() => setBiblia(b => ({ ...b, versiculo: null }))}>← Versículos</button>
                  <div style={{ fontSize: 13, color: "#c9a84c" }}>{biblia.livro} {biblia.capitulo}:{biblia.versiculo.verse}</div>
                </div>
                <div style={{ background: "rgba(201,168,76,.08)", border: "1px solid rgba(201,168,76,.2)", borderRadius: 16, padding: "24px 20px" }}>
                  <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#c9a84c", marginBottom: 16 }}>{biblia.livro} {biblia.capitulo}:{biblia.versiculo.verse}</div>
                  <div style={{ fontSize: 18, lineHeight: 1.8, color: "#fff", fontStyle: "italic", borderLeft: "3px solid #c9a84c", paddingLeft: 16 }}>
                    "{biblia.versiculo.text}"
                  </div>
                  <div style={{ marginTop: 16, fontSize: 12, color: "rgba(255,255,255,.4)", fontStyle: "italic" }}>Nova Versão Transformadora — NVT</div>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  {biblia.versiculo.verse > 1 && (
                    <button style={{ flex: 1, padding: "11px 0", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, color: "rgba(255,255,255,.6)", fontSize: 13, cursor: "pointer", fontFamily: "Georgia,serif" }}
                      onClick={() => setBiblia(b => ({ ...b, versiculo: b.versos.find(v => v.verse === b.versiculo.verse - 1) }))}>
                      ‹ Anterior
                    </button>
                  )}
                  {biblia.versos && biblia.versiculo.verse < biblia.versos.length && (
                    <button style={{ flex: 1, padding: "11px 0", background: "rgba(201,168,76,.12)", border: "1px solid rgba(201,168,76,.3)", borderRadius: 10, color: "#c9a84c", fontSize: 13, cursor: "pointer", fontFamily: "Georgia,serif" }}
                      onClick={() => setBiblia(b => ({ ...b, versiculo: b.versos.find(v => v.verse === b.versiculo.verse + 1) }))}>
                      Próximo ›
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ ORAÇÃO ══ */}
        {tab === "oracao" && (
          <div style={{ animation: "slideUp .4s ease" }}>
            <div style={S.secTitle}>Pedido de Oração</div>
            <div style={S.card}>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,.6)", marginBottom: 16, lineHeight: 1.6 }}>
                Compartilhe seu pedido com o Pastor Fernando. Vamos orar por você! 🙏
              </div>
              <label style={S.label}>Seu nome</label>
              <input style={{ ...S.input, marginBottom: 0 }} placeholder="Como podemos te chamar?" value={oracao.nome}
                onChange={e => setOracao({ ...oracao, nome: e.target.value })} />
              <label style={S.label}>Seu pedido</label>
              <textarea style={S.textarea} placeholder="Escreva seu pedido de oração..." value={oracao.pedido}
                onChange={e => setOracao({ ...oracao, pedido: e.target.value })} />
              <button style={S.oracaoBtn} onClick={enviarOracao}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Enviar via WhatsApp
              </button>
            </div>
            {oracoes.length > 0 && isAdmin && (
              <>
                <div style={S.secTitle}>Pedidos Recebidos</div>
                {oracoes.slice(0, 10).map(o => (
                  <div key={o.id} style={S.card}>
                    <div style={{ fontSize: 13, fontWeight: "bold", color: "#c9a84c", marginBottom: 4 }}>{o.nome}</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,.7)", lineHeight: 1.6 }}>{o.pedido}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ══ MINISTÉRIOS ══ */}
        {tab === "ministerios" && !ministerioAtivo && (
          <div style={{ animation: "slideUp .4s ease" }}>
            <div style={S.secTitle}>Nossos Ministérios</div>
            {MINISTERIOS.map(m => (
              <div key={m.id} style={{ ...S.minCard, borderLeft: `3px solid ${m.cor}44` }} onClick={() => setMinisterioAtivo(m)}>
                <div style={S.minIcon}>{m.icon}</div>
                <div style={S.minInfo}>
                  <div style={{ ...S.minNome, color: m.cor }}>{m.nome}</div>
                  <div style={S.minDesc}>{m.desc}</div>
                </div>
                <div style={{ color: "rgba(255,255,255,.3)", fontSize: 18 }}>›</div>
              </div>
            ))}
          </div>
        )}

        {tab === "ministerios" && ministerioAtivo && (
          <div style={{ animation: "slideUp .4s ease" }}>
            <div style={{ padding: "20px 20px 0", cursor: "pointer", color: "#c9a84c", fontSize: 13 }} onClick={() => setMinisterioAtivo(null)}>← Voltar</div>
            <div style={{ padding: "20px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{ministerioAtivo.icon}</div>
              <div style={{ fontSize: 22, fontWeight: "bold", color: ministerioAtivo.cor, marginBottom: 12 }}>{ministerioAtivo.nome}</div>
              <div style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,.75)" }}>{ministerioAtivo.desc}</div>
              <div style={{ ...S.card, marginTop: 20, marginLeft: 0, marginRight: 0 }}>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)" }}>Quer fazer parte deste ministério?</div>
                <button style={{ ...S.oracaoBtn, marginTop: 12 }}
                  onClick={() => window.open(`https://wa.me/${WHATSAPP_PASTOR}?text=${encodeURIComponent(`Olá Pastor Fernando! Gostaria de participar do ministério ${ministerioAtivo.nome}.`)}`, "_blank")}>
                  💬 Falar com o Pastor
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ MAIS ══ */}
        {tab === "mais" && (
          <div style={{ animation: "slideUp .4s ease" }}>

            {/* Horários dos Cultos */}
            <div style={S.secTitle}>Horários dos Cultos</div>
            <div style={S.card}>
              {HORARIOS_CULTO.map((h, i) => (
                <div key={i} style={{ ...S.contatoRow, borderBottom: i < HORARIOS_CULTO.length - 1 ? "1px solid rgba(255,255,255,.06)" : "none" }}>
                  <div style={S.contatoIcon}>{h.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: "bold", color: "#fff" }}>{h.dia}</div>
                    <div style={{ fontSize: 12, color: "#c9a84c", marginTop: 2 }}>{h.hora}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* WhatsApp Atendimento */}
            <div style={S.secTitle}>Fale Conosco pelo WhatsApp</div>
            <div style={S.card}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.6)", marginBottom: 14, lineHeight: 1.6 }}>
                Entre em contato para:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {WHATSAPP_SERVICOS.map((s, i) => (
                  <div key={i} style={{ padding: "6px 12px", background: "rgba(37,211,102,.08)", border: "1px solid rgba(37,211,102,.2)", borderRadius: 20, fontSize: 12, color: "#4ade80", display: "flex", alignItems: "center", gap: 5 }}>
                    <span>{s.icon}</span>{s.label}
                  </div>
                ))}
              </div>
              <button style={{ width: "100%", padding: "14px 0", background: "linear-gradient(90deg,#25d366,#128C7E)", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: "bold", cursor: "pointer", fontFamily: "Georgia,serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                onClick={() => window.open(`https://wa.me/${WHATSAPP_PASTOR}?text=${encodeURIComponent("Olá! Vim pelo app da Igreja Família Aliança.")}`, "_blank")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                (19) 99721-8590
              </button>
            </div>

            {/* Endereço e Mapa */}
            <div style={S.secTitle}>Nossa Localização</div>
            <div style={S.card}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
                <div style={{ fontSize: 20, marginTop: 2 }}>📍</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: "bold", color: "#fff", marginBottom: 3 }}>Rua Armando Longatti, nº 45</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,.55)" }}>Vila Industrial — Piracicaba/SP</div>
                </div>
              </div>
              <div style={{ borderRadius: 10, overflow: "hidden", marginBottom: 12, border: "1px solid rgba(255,255,255,.08)" }}>
                <iframe
                  title="Localização Igreja Família Aliança"
                  width="100%" height="180"
                  style={{ border: 0, display: "block" }}
                  loading="lazy"
                  allowFullScreen
                  src="https://maps.google.com/maps?q=Rua+Armando+Longatti+45+Vila+Industrial+Piracicaba+SP&output=embed"
                />
              </div>
              <button style={{ width: "100%", padding: "11px 0", background: "rgba(201,168,76,.12)", border: "1px solid rgba(201,168,76,.3)", borderRadius: 10, color: "#c9a84c", fontSize: 13, cursor: "pointer", fontFamily: "Georgia,serif" }}
                onClick={() => window.open(MAPS_URL, "_blank")}>
                🗺️ Abrir no Google Maps
              </button>
            </div>

            {/* Contribuição */}
            <div style={S.secTitle}>Dízimos & Ofertas</div>
            <div style={S.pixCard}>
              <div style={S.pixTitle}>💛 Contribua com a Igreja</div>
              <div style={S.pixSub}>Sua contribuição sustenta a obra de Deus em Piracicaba</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>Chave PIX</div>
              <div style={S.pixKey}>{PIX_KEY}</div>
              <button style={S.copyBtn} onClick={() => { navigator.clipboard.writeText(PIX_KEY); showToast("✅ Chave PIX copiada!"); }}>
                📋 Copiar chave PIX
              </button>
              <div style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,.4)", textAlign: "center" }}>
                Você também pode entregar sua oferta presencialmente nos cultos
              </div>
            </div>

            {/* Redes Sociais */}
            <div style={S.secTitle}>Redes Sociais</div>
            <div style={{ display: "flex", gap: 10, padding: "0 16px", flexWrap: "wrap" }}>
              {[
                {
                  label: "YouTube", url: CONTATOS.youtube, color: "#ff0000", bg: "rgba(255,0,0,.12)", border: "rgba(255,0,0,.3)",
                  svg: <svg width="28" height="28" viewBox="0 0 24 24" fill="#ff0000"><path d="M23.5 6.2s-.3-2.1-1.2-3c-1.1-1.2-2.4-1.2-3-1.3C16.8 1.8 12 1.8 12 1.8s-4.8 0-7.3.1c-.6.1-1.9.1-3 1.3C.8 4.1.5 6.2.5 6.2S0 8.6 0 11v2.2c0 2.4.5 4.8.5 4.8s.3 2.1 1.2 3c1.1 1.2 2.6 1.1 3.3 1.2C7.2 22.4 12 22.4 12 22.4s4.8 0 7.3-.2c.6-.1 1.9-.1 3-1.3.9-.9 1.2-3 1.2-3s.5-2.4.5-4.8V11c0-2.4-.5-4.8-.5-4.8zM9.7 15.5V8.6l6.6 3.5-6.6 3.4z"/></svg>
                },
                {
                  label: "Instagram", url: CONTATOS.instagram, color: "#e1306c", bg: "rgba(225,48,108,.12)", border: "rgba(225,48,108,.3)",
                  svg: <svg width="28" height="28" viewBox="0 0 24 24" fill="url(#igGrad)"><defs><linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f09433"/><stop offset="25%" stopColor="#e6683c"/><stop offset="50%" stopColor="#dc2743"/><stop offset="75%" stopColor="#cc2366"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                },

                {
                  label: "WhatsApp", url: `https://wa.me/${WHATSAPP_PASTOR}`, color: "#25d366", bg: "rgba(37,211,102,.12)", border: "rgba(37,211,102,.3)",
                  svg: <svg width="28" height="28" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                },
              ].map(r => (
                <button key={r.label} style={{ flex: 1, minWidth: 70, padding: "14px 8px", background: r.bg, border: `1px solid ${r.border}`, borderRadius: 14, color: r.color, fontSize: 11, cursor: "pointer", fontFamily: "Georgia,serif", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
                  onClick={() => window.open(r.url, "_blank")}>
                  {r.svg}
                  {r.label}
                </button>
              ))}
            </div>

            {/* Agenda completa */}
            <div style={S.secTitle}>Agenda Completa</div>
            {agenda.length === 0 ? (
              <div style={{ ...S.card, textAlign: "center" }}><div style={{ fontSize: 13, color: "rgba(255,255,255,.4)" }}>Nenhum evento.</div></div>
            ) : agenda.map(ev => (
              <div key={ev.id} style={S.eventoCard}>
                <div style={S.eventoData}>
                  <div style={S.eventoDay}>{getDay(ev.data)}</div>
                  <div style={S.eventoMon}>{getMonAbbr(ev.data)}</div>
                </div>
                <div style={S.eventoInfo}>
                  <div style={S.eventoTitle}>{ev.titulo}</div>
                  <div style={S.eventoSub}>{fmtData(ev.data)} • {ev.hora}{ev.local ? ` • ${ev.local}` : ""}</div>
                  <div style={S.eventoBadge(ev.tipo)}>{tipoLabel[ev.tipo]}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ ADMIN ══ */}
        {tab === "admin" && isAdmin && (
          <div style={{ animation: "slideUp .4s ease" }}>
            <div style={S.adminHeader}>
              <div style={S.adminTitle}>⚙️ Painel do Pastor</div>
            </div>
            <div style={S.adminTabs}>
              {["agenda", "palavra", "membros"].map(t => (
                <button key={t} style={S.adminTab(adminTab === t)} onClick={() => setAdminTab(t)}>
                  {{ agenda: "📅 Agenda", palavra: "📜 Palavra", membros: "👥 Membros" }[t]}
                </button>
              ))}
            </div>

            {/* Admin: Agenda */}
            {adminTab === "agenda" && (
              <div style={{ padding: "0 16px" }}>
                <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 14, color: "#c9a84c" }}>
                  {editandoEvento ? "Editar Evento" : "Novo Evento"}
                </div>
                <label style={S.label}>Título</label>
                <input style={{ ...S.input, marginBottom: 0 }} placeholder="Nome do evento" value={novoEvento.titulo}
                  onChange={e => setNovoEvento({ ...novoEvento, titulo: e.target.value })} />
                <label style={S.label}>Data</label>
                <input style={{ ...S.input, marginBottom: 0 }} type="date" value={novoEvento.data}
                  onChange={e => setNovoEvento({ ...novoEvento, data: e.target.value })} />
                <label style={S.label}>Horário</label>
                <input style={{ ...S.input, marginBottom: 0 }} type="time" value={novoEvento.hora}
                  onChange={e => setNovoEvento({ ...novoEvento, hora: e.target.value })} />
                <label style={S.label}>Local</label>
                <input style={{ ...S.input, marginBottom: 0 }} placeholder="Templo, Sala..." value={novoEvento.local}
                  onChange={e => setNovoEvento({ ...novoEvento, local: e.target.value })} />
                <label style={S.label}>Tipo</label>
                <select style={S.select} value={novoEvento.tipo} onChange={e => setNovoEvento({ ...novoEvento, tipo: e.target.value })}>
                  <option value="culto">Culto</option>
                  <option value="oracao">Reunião de Oração</option>
                  <option value="kids">Kids</option>
                  <option value="music">Music</option>
                </select>
                <button style={S.saveBtn} onClick={salvarEvento}>
                  {editandoEvento ? "💾 Atualizar Evento" : "➕ Adicionar Evento"}
                </button>
                {editandoEvento && (
                  <button style={{ ...S.saveBtn, background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.6)", marginTop: 8 }}
                    onClick={() => { setEditandoEvento(null); setNovoEvento({ titulo: "", data: "", hora: "", local: "", tipo: "culto" }); }}>
                    Cancelar
                  </button>
                )}

                <div style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,.3)", marginTop: 24, marginBottom: 12 }}>Eventos Cadastrados</div>
                {agenda.map(ev => (
                  <div key={ev.id} style={{ ...S.card, marginLeft: 0, marginRight: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: "bold" }}>{ev.titulo}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>{fmtData(ev.data)} • {ev.hora}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={{ padding: "6px 10px", background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.3)", borderRadius: 8, color: "#c9a84c", fontSize: 12, cursor: "pointer", fontFamily: "Georgia,serif" }}
                        onClick={() => { setEditandoEvento(ev.id); setNovoEvento({ ...ev }); }}>✏️</button>
                      <button style={S.delBtn} onClick={() => deletarEvento(ev.id)}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Admin: Palavra */}
            {adminTab === "palavra" && (
              <div style={{ padding: "0 16px" }}>
                <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 14, color: "#c9a84c" }}>Palavra Semanal</div>
                <label style={S.label}>Título da Palavra</label>
                <input style={{ ...S.input, marginBottom: 0 }} placeholder="Ex: A Fidelidade de Deus" value={novaPalavra.titulo}
                  onChange={e => setNovaPalavra({ ...novaPalavra, titulo: e.target.value })} />
                <label style={S.label}>Referência Bíblica</label>
                <input style={{ ...S.input, marginBottom: 0 }} placeholder="Ex: Salmos 37:5" value={novaPalavra.referencia}
                  onChange={e => setNovaPalavra({ ...novaPalavra, referencia: e.target.value })} />
                <label style={S.label}>Texto da Palavra</label>
                <textarea style={{ ...S.textarea, minHeight: 140 }} placeholder="Escreva a mensagem da semana..." value={novaPalavra.texto}
                  onChange={e => setNovaPalavra({ ...novaPalavra, texto: e.target.value })} />
                <label style={S.label}>Link do vídeo (opcional)</label>
                <input style={{ ...S.input, marginBottom: 0 }} placeholder="https://youtube.com/..." value={novaPalavra.video}
                  onChange={e => setNovaPalavra({ ...novaPalavra, video: e.target.value })} />
                <button style={S.saveBtn} onClick={salvarPalavra}>💾 Publicar Palavra</button>
                {palavra && (
                  <div style={{ ...S.card, marginLeft: 0, marginRight: 0, marginTop: 20 }}>
                    <div style={{ fontSize: 12, color: "#c9a84c", marginBottom: 6 }}>Palavra atual:</div>
                    <div style={{ fontSize: 14, fontWeight: "bold" }}>{palavra.titulo}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginTop: 4 }}>{fmtData(palavra.data)}</div>
                  </div>
                )}
              </div>
            )}

            {/* Admin: Membros */}
            {adminTab === "membros" && (
              <div style={{ padding: "0 16px" }}>
                <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 4, color: "#c9a84c" }}>Membros Cadastrados</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginBottom: 16 }}>{membros.length} membro(s)</div>
                {membros.length === 0 ? (
                  <div style={{ ...S.card, marginLeft: 0, marginRight: 0, textAlign: "center" }}>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,.4)" }}>Nenhum membro cadastrado ainda.</div>
                  </div>
                ) : membros.map(m => (
                  <div key={m.id} style={{ ...S.card, marginLeft: 0, marginRight: 0, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(201,168,76,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#c9a84c", fontWeight: "bold" }}>
                      {m.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: "bold" }}>{m.nome}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>{m.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* NAV */}
      <nav style={S.nav}>
        {TABS.map(t => (
          <button key={t.id} style={S.navBtn(tab === t.id)} onClick={() => { setTab(t.id); setMinisterioAtivo(null); }}>
            <span style={S.navIcon}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {toast && <div style={S.toast}>{toast}</div>}
    </div>
  );
}
