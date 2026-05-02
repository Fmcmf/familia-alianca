import React, { useState, useEffect } from "react";
import { db, messaging, solicitarPermissaoNotificacao, onMessage } from "./firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc } from "firebase/firestore";
import emailjs from "@emailjs/browser";

// ─── EMAILJS CONFIG ─────────────────────────────────────────── v1.1 ───────
const EMAILJS_SERVICE_ID  = "service_sffzlx2";
const EMAILJS_TEMPLATE_ID = "template_142tb2a";
const EMAILJS_PUBLIC_KEY  = "KkcyGeZOZYPkwGing";

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


const MINISTERIOS = [
  { id: 1, nome: "Recepção & Acolhimento", icon: "🤝", desc: "Bem-vindos com amor e cuidado a cada visitante e membro da família.", cor: "#c9a84c" },
  { id: 2, nome: "Aliança Music", icon: "🎵", desc: "Adoração que transforma, música que toca o coração de Deus.", cor: "#8b5cf6" },
  { id: 3, nome: "Aliança Kids", icon: "⭐", desc: "Crianças aprendendo o amor de Jesus de forma divertida e criativa.", cor: "#f59e0b" },
  { id: 4, nome: "Ação Social", icon: "❤️", desc: "Servindo a comunidade com amor prático e transformador.", cor: "#ef4444" },
  { id: 5, nome: "Intercessão", icon: "🙏", desc: "Guerreiros de oração intercedendo pela igreja e pela cidade.", cor: "#3b82f6" },
  { id: 6, nome: "MOVE — Jovens", icon: "🔥", desc: "Um movimento de jovens apaixonados por Deus, transformando vidas e gerações.", cor: "#f97316" },
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
  const [avisos, setAvisos] = useState([]);
  const [novoAviso, setNovoAviso] = useState({ titulo: "", texto: "", tipo: "info" });
  const [editandoAviso, setEditandoAviso] = useState(null);

  // UI
  const [toast, setToast] = useState("");
  const [ministerioAtivo, setMinisterioAtivo] = useState(null);
  const [oracao, setOracao] = useState({ nome: "", pedido: "" });
  const [adminTab, setAdminTab] = useState("agenda");
  const [novoEvento, setNovoEvento] = useState({ titulo: "", data: "", hora: "", local: "", tipo: "culto" });
  const [novaPalavra, setNovaPalavra] = useState({ titulo: "", texto: "", referencia: "", video: "" });
  const [editandoEvento, setEditandoEvento] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [historicoPalavras, setHistoricoPalavras] = useState([]);
  const [ultimoVideo, setUltimoVideo] = useState(null);
  const [aoVivo, setAoVivo] = useState(null);
  const [devocional, setDevocional] = useState(null);
  const [novoDevocional, setNovoDevocional] = useState({ titulo: "", versiculo: "", referencia: "", palavra: "", aplicacao: "", oracao: "" });
  const [notifForm, setNotifForm] = useState({ titulo: "", mensagem: "" });
  const [voluntarioForm, setVoluntarioForm] = useState({ nome: "", email: "", telefone: "", ministerio: "", mensagem: "" });
  const [onlineCount, setOnlineCount] = useState(0);
  const [enviandoVoluntario, setEnviandoVoluntario] = useState(false);
  const [maisScrollTarget, setMaisScrollTarget] = useState(null);

  // Scroll até seção alvo na aba Mais/Voluntario
  useEffect(() => {
    if (!maisScrollTarget) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`mais-${maisScrollTarget}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      setMaisScrollTarget(null);
    }, 350);
    return () => clearTimeout(timer);
  }, [tab, maisScrollTarget]);

  // Splash + Firebase load
  useEffect(() => {
    setTimeout(() => {
      const u = store.get(SK.user, null);
      if (u) { setUser(u); setIsAdmin(u.admin || false); setScreen("app"); } // eslint-disable-line no-unused-vars
      else setScreen("login");
    }, 2200);

    // Detectar iOS
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const standalone = window.navigator.standalone;
    setIsIOS(ios);
    if (ios && !standalone) setShowInstallBanner(true);

    // Detectar Android/Chrome
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    });

    // Esconder banner se já instalado
    window.addEventListener("appinstalled", () => {
      setShowInstallBanner(false);
      setInstallPrompt(null);
    });

    // FCM — pedir permissão e salvar token
    solicitarPermissaoNotificacao().then(token => {
      if (token) {
        setDoc(doc(db, "fcm_tokens", token), { token, data: new Date().toISOString() });
      }
    });

    // FCM — notificações em primeiro plano
    onMessage(messaging, (payload) => {
      showToast(`🔔 ${payload.notification?.title}: ${payload.notification?.body}`);
    });

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

    // Histórico de palavras
    const unsubHistorico = onSnapshot(collection(db, "palavras_historico"), (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      lista.sort((a, b) => b.data.localeCompare(a.data));
      setHistoricoPalavras(lista);
    });

    // Último vídeo do culto
    const unsubVideo = onSnapshot(doc(db, "config", "ultimoVideo"), (snap) => {
      if (snap.exists()) setUltimoVideo(snap.data());
    });

    // Ao Vivo
    const unsubAoVivo = onSnapshot(doc(db, "config", "aoVivo"), (snap) => {
      if (snap.exists()) setAoVivo(snap.data());
      else setAoVivo(null);
    });

    // Devocional da semana
    const unsubDevocional = onSnapshot(doc(db, "config", "devocional"), (snap) => {
      if (snap.exists()) setDevocional(snap.data());
    });

    // Membros — tempo real
    const unsubMembros = onSnapshot(collection(db, "membros"), (snap) => {
      setMembros(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Avisos — tempo real
    const unsubAvisos = onSnapshot(collection(db, "avisos"), (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      lista.sort((a, b) => b.data.localeCompare(a.data));
      setAvisos(lista);
    });

    // ── PRESENÇA ONLINE ──
    // Reutiliza o mesmo ID durante toda a sessão do navegador
    let sessionId = sessionStorage.getItem("fa-session-id");
    if (!sessionId) {
      sessionId = Math.random().toString(36).slice(2);
      sessionStorage.setItem("fa-session-id", sessionId);
    }
    const presencaRef = doc(db, "presenca", sessionId);

    const registrarPresenca = () => {
      setDoc(presencaRef, { ativo: true, visto: Date.now() });
    };

    registrarPresenca();
    const heartbeat = setInterval(registrarPresenca, 20000); // atualiza a cada 20s

    const removerPresenca = () => deleteDoc(presencaRef);
    window.addEventListener("beforeunload", removerPresenca);

    // Conta ativos (vistos nos últimos 60 segundos)
    const unsubPresenca = onSnapshot(collection(db, "presenca"), (snap) => {
      const agora = Date.now();
      const ativos = snap.docs.filter(d => agora - (d.data().visto || 0) < 60000);
      setOnlineCount(ativos.length);
    });

    return () => {
      unsubAgenda(); unsubPalavra(); unsubOracoes(); unsubHistorico();
      unsubMembros(); unsubAvisos(); unsubVideo(); unsubDevocional(); unsubAoVivo(); unsubPresenca();
      clearInterval(heartbeat);
      removerPresenca();
      window.removeEventListener("beforeunload", removerPresenca);
    };
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") { setShowInstallBanner(false); setInstallPrompt(null); }
    }
  };

  const getYouTubeId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

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
    // Salva como atual
    await setDoc(doc(db, "palavra", "atual"), p);
    // Salva no histórico
    await addDoc(collection(db, "palavras_historico"), p);
    setNovaPalavra({ titulo: "", texto: "", referencia: "", video: "" });
    showToast("✅ Palavra publicada!");
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

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("familiaAlianca_theme");
    return saved ? saved === "dark" : true;
  });

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("familiaAlianca_theme", newMode ? "dark" : "light");
  };

  // Cores do tema
  const T = {
    bg: darkMode ? "#03060f" : "#f0f0f5",
    bg2: darkMode ? "#060d1c" : "#ffffff",
    card: darkMode ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.07)",
    cardBorder: darkMode ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.18)",
    text: darkMode ? "#ffffff" : "#0a0a1a",
    textSub: darkMode ? "rgba(255,255,255,.72)" : "rgba(0,0,0,.65)",
    textFaint: darkMode ? "rgba(255,255,255,.42)" : "rgba(0,0,0,.4)",
    nav: darkMode ? "#040810" : "#ffffff",
    navBorder: darkMode ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.15)",
    header: darkMode ? "#040810" : "#ffffff",
    input: darkMode ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.07)",
    inputBorder: darkMode ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.2)",
    gold: darkMode ? "#c9a84c" : "#9a7020",
  };
  const S = {
    app: { minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'Georgia', 'Times New Roman', serif", position: "relative", overflowX: "hidden" },
    bg: { position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: darkMode ? "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(10,40,100,.35) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 100%, rgba(201,168,76,.07) 0%, transparent 60%)" : "none" },
    wrap: { position: "relative", zIndex: 1, maxWidth: 430, margin: "0 auto", paddingBottom: 90 },
    splash: { minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 },
    splashLogo: { width: 160, animation: "fadeIn 1s ease" },
    splashTag: { fontSize: 13, letterSpacing: 4, textTransform: "uppercase", color: T.textSub },
    loginWrap: { minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 28px" },
    loginLogo: { width: 120, marginBottom: 32 },
    loginTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 6, textAlign: "center" },
    loginSub: { fontSize: 13, color: T.textSub, marginBottom: 32, textAlign: "center" },
    input: { width: "100%", background: T.input, border: `1px solid ${T.inputBorder}`, borderRadius: 12, padding: "14px 16px", color: T.text, fontSize: 15, fontFamily: "Georgia,serif", outline: "none", boxSizing: "border-box", marginBottom: 12 },
    loginBtn: { width: "100%", padding: "14px 0", background: "linear-gradient(90deg,#c9a84c,#e8c97a)", border: "none", borderRadius: 12, color: "#080810", fontSize: 15, fontWeight: "bold", cursor: "pointer", fontFamily: "Georgia,serif", marginBottom: 12 },
    switchBtn: { background: "none", border: "none", color: T.gold, fontSize: 13, cursor: "pointer", fontFamily: "Georgia,serif", textDecoration: "underline" },
    errMsg: { color: "#ef4444", fontSize: 13, marginBottom: 10, textAlign: "center" },
    header: { padding: "28px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", background: T.header, borderBottom: `1px solid ${T.navBorder}` },
    headerLogo: { height: 38 },
    headerUser: { fontSize: 12, color: T.textSub, textAlign: "right" },
    headerName: { fontSize: 13, color: T.gold, fontWeight: "bold" },
    secTitle: { fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: T.textSub, padding: "0 20px", marginBottom: 12, marginTop: 24 },
    card: { margin: "0 16px 12px", background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 16, padding: "16px 18px" },
    heroCard: { margin: "0 16px 8px", background: "linear-gradient(135deg,rgba(201,168,76,.18),rgba(100,60,180,.12))", border: `1px solid ${darkMode ? "rgba(201,168,76,.2)" : "rgba(154,112,32,.5)"}`, borderRadius: 20, padding: "22px 20px" },
    eventoCard: { margin: "0 16px 10px", background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: "14px 16px", display: "flex", gap: 14, alignItems: "center" },
    eventoData: { minWidth: 44, textAlign: "center" },
    eventoDay: { fontSize: 22, fontWeight: "bold", color: T.gold, lineHeight: 1 },
    eventoMon: { fontSize: 10, color: T.textSub, textTransform: "uppercase" },
    eventoInfo: { flex: 1 },
    eventoTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 3 },
    eventoSub: { fontSize: 13, color: T.textSub },
    eventoBadge: (tipo) => ({ display: "inline-block", fontSize: 11, padding: "2px 8px", borderRadius: 20, background: `${tipoColor[tipo]}22`, color: tipoColor[tipo], border: `1px solid ${tipoColor[tipo]}44`, marginTop: 4 }),
    minCard: { margin: "0 16px 10px", background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 16, padding: "16px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 },
    minIcon: { fontSize: 28, minWidth: 44, textAlign: "center" },
    minInfo: { flex: 1 },
    minNome: { fontSize: 15, fontWeight: "bold", marginBottom: 3 },
    minDesc: { fontSize: 13, color: T.textSub, lineHeight: 1.5 },
    nav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: T.nav, borderTop: `1px solid ${T.navBorder}`, display: "flex", backdropFilter: "blur(20px)", zIndex: 100 },
    navBtn: (a) => ({ flex: 1, padding: "10px 0 14px", background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: a ? "#c9a84c" : darkMode ? "rgba(255,255,255,.65)" : "rgba(0,0,0,.45)", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", fontFamily: "Georgia,serif" }),
    navIcon: { fontSize: 20 },
    pixCard: { margin: "0 16px 12px", background: "linear-gradient(135deg,rgba(201,168,76,.15),rgba(201,168,76,.05))", border: `1px solid ${darkMode ? "rgba(201,168,76,.25)" : "rgba(154,112,32,.55)"}`, borderRadius: 16, padding: "20px" },
    pixTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 4, color: T.gold },
    pixSub: { fontSize: 13, color: T.textSub, marginBottom: 16 },
    pixKey: { background: darkMode ? "rgba(0,0,0,.3)" : "rgba(0,0,0,.08)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: darkMode ? "#e8c97a" : "#0a0a1a", letterSpacing: 1, marginBottom: 8, wordBreak: "break-all" },
    copyBtn: { width: "100%", padding: "12px 0", background: "rgba(201,168,76,.15)", border: `1px solid ${darkMode ? "rgba(201,168,76,.3)" : "rgba(154,112,32,.6)"}`, borderRadius: 10, color: T.gold, fontSize: 13, cursor: "pointer", fontFamily: "Georgia,serif" },
    palavraCard: { margin: "0 16px 12px", background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 16, padding: "20px" },
    palavraTitulo: { fontSize: 18, fontWeight: "bold", marginBottom: 8, lineHeight: 1.3 },
    palavraRef: { fontSize: 13, color: T.gold, marginBottom: 12, fontStyle: "italic" },
    palavraTexto: { fontSize: 14.5, lineHeight: 1.8, color: T.textSub },
    contatoRow: { display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${T.cardBorder}` },
    contatoIcon: { fontSize: 20, minWidth: 32, textAlign: "center" },
    contatoText: { fontSize: 14, color: T.textSub },
    adminHeader: { padding: "24px 20px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    adminTitle: { fontSize: 17, fontWeight: "bold" },
    adminTabs: { display: "flex", gap: 8, padding: "0 16px", marginBottom: 20, overflowX: "auto" },
    adminTab: (a) => ({ padding: "8px 16px", background: a ? "rgba(201,168,76,.2)" : T.card, border: `1px solid ${a ? "rgba(201,168,76,.4)" : T.cardBorder}`, borderRadius: 20, fontSize: 12, color: a ? "#c9a84c" : T.textSub, cursor: "pointer", fontFamily: "Georgia,serif", whiteSpace: "nowrap" }),
    label: { display: "block", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: T.textSub, marginBottom: 6, marginTop: 14 },
    select: { width: "100%", background: T.input, border: `1px solid ${T.inputBorder}`, borderRadius: 10, padding: "12px 14px", color: T.text, fontSize: 14, fontFamily: "Georgia,serif", outline: "none", boxSizing: "border-box" },
    saveBtn: { width: "100%", marginTop: 16, padding: "14px 0", background: "linear-gradient(90deg,#c9a84c,#e8c97a)", border: "none", borderRadius: 12, color: "#080810", fontSize: 14, fontWeight: "bold", cursor: "pointer", fontFamily: "Georgia,serif" },
    delBtn: { padding: "6px 12px", background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 8, color: "#ef4444", fontSize: 12, cursor: "pointer", fontFamily: "Georgia,serif" },
    textarea: { width: "100%", background: T.input, border: `1px solid ${T.inputBorder}`, borderRadius: 10, padding: "12px 14px", color: T.text, fontSize: 14, fontFamily: "Georgia,serif", outline: "none", resize: "vertical", minHeight: 100, boxSizing: "border-box" },
    toast: { position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", background: darkMode ? "#040e20" : "#fff", border: `1px solid ${darkMode ? "rgba(201,168,76,.3)" : "rgba(154,112,32,.6)"}`, borderRadius: 12, padding: "12px 24px", fontSize: 13, color: T.text, zIndex: 999, whiteSpace: "nowrap", boxShadow: "0 4px 24px rgba(0,0,0,.2)" },
    logoutBtn: { background: "none", border: `1px solid ${T.cardBorder}`, borderRadius: 8, color: T.textSub, fontSize: 11, padding: "5px 10px", cursor: "pointer", fontFamily: "Georgia,serif" },
    oracaoBtn: { width: "100%", marginTop: 12, padding: "14px 0", background: "linear-gradient(90deg,#25d366,#128C7E)", border: "none", borderRadius: 12, color: T.text, fontSize: 14, fontWeight: "bold", cursor: "pointer", fontFamily: "Georgia,serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  };


  // ── SPLASH ──
  if (screen === "splash") return (
    <div style={S.splash}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}} @keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}`}</style>
      <img src="/logo-igreja.png" alt="Família Aliança" style={{ width: 180, animation: "fadeIn 1s ease", borderRadius: 16, background: darkMode ? "transparent" : "#080810", padding: darkMode ? 0 : 12 }} />
      <div style={{ textAlign: "center", animation: "fadeIn 1.4s ease" }}>
        <div style={{ fontSize: 12, color: T.textFaint, animation: "pulse 1.5s ease infinite", marginTop: 8, letterSpacing: 3 }}>Igreja do Nazareno</div>
      </div>
      <div style={{ position: "absolute", bottom: 32, fontSize: 11, color: "rgba(255,255,255,.15)", letterSpacing: 2 }}>v1.0</div>
    </div>
  );

  // ── LOGIN ──
  if (screen === "login") return (
    <div style={S.loginWrap}>
      <img src="/logo-igreja.png" alt="Família Aliança" style={{ width: 160, marginBottom: 28, borderRadius: 16, background: darkMode ? "transparent" : "#080810", padding: darkMode ? 0 : 12 }} />
      <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 32, textAlign: "center", color: T.text, letterSpacing: 1 }}>
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
    { id: "devocional", icon: "🕊️", label: "Devocional" },
    { id: "voluntario", icon: "🤲", label: "Servir" },
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
        * { box-sizing: border-box; }
        html { font-size: 18px; }
        input::placeholder,textarea::placeholder{color:${darkMode ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.35)"};}
        input,textarea,select{color:${T.text} !important; background:${T.input} !important;}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(201,168,76,.3);border-radius:2px}
        select option{background:${darkMode ? "#040e20" : "#ffffff"}; color:${T.text};}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .acesso-rapido::-webkit-scrollbar{display:none}
        .acesso-rapido{scrollbar-width:none;-ms-overflow-style:none;}
      `}</style>

      <div style={S.wrap}>
        {/* HEADER */}
        <div style={S.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo-igreja.png" alt="Família Aliança" style={{ height: 48, width: 48, objectFit: "contain", borderRadius: 10, background: darkMode ? "transparent" : "#080810", padding: darkMode ? 0 : 4 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: "bold", letterSpacing: 2, color: T.text }}>FAMÍLIA ALIANÇA</div>
              <div style={{ fontSize: 10, color: T.textSub, letterSpacing: 1 }}>Igreja do Nazareno</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Contador online */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(34,197,94,.12)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 20, padding: "4px 10px" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 6px #22c55e" }} />
                <span style={{ fontSize: 11, color: "#22c55e", fontWeight: "bold" }}>{onlineCount}</span>
              </div>
              <button onClick={toggleTheme} style={{ background: "none", border: `1px solid ${T.cardBorder}`, borderRadius: 20, padding: "5px 10px", cursor: "pointer", fontSize: 15 }}>
                {darkMode ? "☀️" : "🌙"}
              </button>
              <button style={S.logoutBtn} onClick={handleLogout}>Sair</button>
            </div>
          </div>
        </div>

        {/* ══ HOME ══ */}
        {tab === "home" && (
          <div style={{ animation: "slideUp .4s ease" }}>

            {/* Boas-vindas */}
            <div style={{ padding: "20px 20px 4px" }}>
              <div style={{ fontSize: 13, color: T.textSub }}>Bem-vindo!</div>
              <div style={{ fontSize: 16, color: T.text, fontWeight: "bold" }}>Que bom ter você aqui. 🙏</div>
            </div>

            {/* ── CARD PALAVRA SEMANAL (com foto do pastor) ── */}
            {palavra ? (
              <div style={{ margin: "16px 16px 4px", borderRadius: 20, overflow: "hidden", position: "relative", background: "linear-gradient(135deg,#071428 0%,#03060f 60%)", border: `1px solid ${darkMode ? "rgba(201,168,76,.3)" : "rgba(154,112,32,.55)"}`, minHeight: 190 }}>
                {/* faixa dourada topo */}
                <div style={{ background: "linear-gradient(90deg,#c9a84c,#e8c97a)", padding: "6px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: "bold", letterSpacing: 3, textTransform: "uppercase", color: "#080810" }}>Palavra Semanal</span>
                </div>
                {/* conteúdo */}
                <div style={{ display: "flex", alignItems: "stretch", minHeight: 160 }}>
                  {/* texto */}
                  <div style={{ flex: 1, padding: "14px 16px 16px" }}>
                    <div style={{ fontSize: 11, color: "#c9a84c", marginBottom: 4, letterSpacing: 1 }}>Pr. Fernando Mello</div>
                    <div style={{ fontSize: 20, fontWeight: "bold", lineHeight: 1.25, color: "#fff", marginBottom: 14 }}>
                      {palavra.titulo}
                    </div>
                    <button
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", background: "linear-gradient(90deg,#c9a84c,#e8c97a)", border: "none", borderRadius: 20, padding: "10px 16px", fontSize: 13, fontWeight: "bold", color: "#080810", cursor: "pointer", fontFamily: "Georgia,serif" }}
                      onClick={() => setTab("palavra")}>
                      Ler Palavra Completa →
                    </button>
                  </div>
                  {/* foto pastor — maior */}
                  <div style={{ width: 140, flexShrink: 0, position: "relative", overflow: "hidden" }}>
                    <img
                      src="/pastor.png"
                      alt="Pastor"
                      style={{ position: "absolute", bottom: 0, right: 0, height: "115%", maxHeight: 220, objectFit: "cover", objectPosition: "top center" }}
                      onError={e => { e.target.style.display = "none"; }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ ...S.card, textAlign: "center", padding: "32px 20px" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📜</div>
                <div style={{ fontSize: 14, color: T.textSub }}>Nenhuma palavra semanal publicada ainda.</div>
              </div>
            )}

            {/* ── GRADE DE ACESSO RÁPIDO ── */}
            <div style={{ padding: "20px 16px 0" }}>
              <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: T.textSub, marginBottom: 14 }}>Acesso rápido</div>
              <div className="acesso-rapido" style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                {[
                  {
                    label: "Agenda",
                    action: () => { setTab("mais"); setMaisScrollTarget("agenda"); },
                    svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="3"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  },
                  {
                    label: "Mensagens",
                    action: () => window.open(`https://www.youtube.com/@${YOUTUBE_CHANNEL}`, "_blank"),
                    svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16" fill="#c9a84c" stroke="none"/></svg>
                  },
                  {
                    label: "Contribuir",
                    action: () => { setTab("mais"); setMaisScrollTarget("pix"); },
                    svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="rgba(201,168,76,.15)"/></svg>
                  },
                  {
                    label: "Fale Conosco",
                    action: () => { setTab("mais"); setMaisScrollTarget("whatsapp"); },
                    svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="rgba(201,168,76,.1)"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="9" y1="14" x2="13" y2="14"/></svg>
                  },
                  {
                    label: "Ministérios",
                    action: () => { setTab("voluntario"); setMaisScrollTarget("ministerios"); },
                    svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="rgba(201,168,76,.12)"/></svg>
                  },
                  {
                    label: "Avisos",
                    action: () => { setTab("mais"); setMaisScrollTarget("avisos"); },
                    svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0" fill="rgba(201,168,76,.15)"/><circle cx="18" cy="5" r="3" fill="#c9a84c" stroke="none"/></svg>
                  },
                  {
                    label: "Devocional",
                    action: () => setTab("devocional"),
                    svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="rgba(201,168,76,.08)"/><path d="M12 6v6l4 2" strokeLinecap="round"/><circle cx="12" cy="12" r="1" fill="#c9a84c" stroke="none"/><path d="M8 3.5C9.3 3 10.6 2.8 12 2.8" strokeLinecap="round"/></svg>
                  },
                  {
                    label: "Bíblia",
                    action: () => setTab("biblia"),
                    svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h7a4 4 0 0 1 4 4v12H4V4z" fill="rgba(201,168,76,.08)"/><path d="M20 20H11a4 4 0 0 1-4-4V4"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="8" y1="9" x2="11" y2="9"/><line x1="8" y1="13" x2="11" y2="13"/></svg>
                  },
                ].map(item => (
                  <button key={item.label} onClick={item.action}
                    style={{ background: darkMode ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.05)", border: `1px solid rgba(201,168,76,.18)`, borderRadius: 14, padding: "14px 10px 11px", display: "flex", flexDirection: "column", alignItems: "center", gap: 7, cursor: "pointer", fontFamily: "Georgia,serif", flexShrink: 0, width: 80 }}>
                    {item.svg}
                    <span style={{ fontSize: 10, color: T.textSub, textAlign: "center", lineHeight: 1.2 }}>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── PRÓXIMOS EVENTOS ── */}
            <div style={{ padding: "20px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: T.textSub }}>Próximos eventos</div>
              <button style={{ background: "none", border: "none", color: T.gold, fontSize: 12, cursor: "pointer", fontFamily: "Georgia,serif" }} onClick={() => setTab("mais")}>Ver todos</button>
            </div>
            {proximos.length === 0 ? (
              <div style={{ ...S.card, textAlign: "center", padding: "28px 20px", margin: "12px 16px" }}>
                <div style={{ fontSize: 13, color: T.textSub }}>Nenhum evento programado.</div>
              </div>
            ) : proximos.map(ev => (
              <div key={ev.id} style={{ margin: "10px 16px 0", background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: "14px 16px", display: "flex", gap: 16, alignItems: "center" }}>
                {/* data lateral */}
                <div style={{ minWidth: 42, textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: "bold", color: T.gold, lineHeight: 1 }}>{getDay(ev.data)}</div>
                  <div style={{ fontSize: 10, color: T.textSub, textTransform: "uppercase", letterSpacing: 1 }}>{getMonAbbr(ev.data)}</div>
                </div>
                {/* divider */}
                <div style={{ width: 1, alignSelf: "stretch", background: T.cardBorder }} />
                {/* info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: "bold", color: T.text, marginBottom: 2 }}>{ev.titulo}</div>
                  <div style={{ fontSize: 12, color: T.textSub }}>{tipoLabel[ev.tipo] || ev.tipo}{ev.hora ? `, ${ev.hora}` : ""}</div>
                  {ev.local && <div style={{ fontSize: 12, color: T.textFaint, marginTop: 2 }}>{ev.local}</div>}
                </div>
              </div>
            ))}

            {/* ── AO VIVO ── */}
            <div style={S.secTitle}>Transmissão Online</div>
            {aoVivo?.ativo ? (
              <div style={{ margin: "0 16px 12px", borderRadius: 16, overflow: "hidden", border: "2px solid #ef4444", boxShadow: "0 0 20px rgba(239,68,68,.3)" }}>
                <div style={{ background: "linear-gradient(90deg,#ef4444,#dc2626)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff", display: "inline-block", animation: "pulse 1s ease infinite", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: "bold", color: "#fff", letterSpacing: 1 }}>🔴 ESTAMOS AO VIVO!</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.85)" }}>{aoVivo.titulo || "Culto Online"}</div>
                  </div>
                </div>
                {aoVivo.url && getYouTubeId(aoVivo.url) && (
                  <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, background: "#000" }}>
                    <iframe
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                      src={`https://www.youtube.com/embed/${getYouTubeId(aoVivo.url)}?autoplay=1`}
                      title="Ao Vivo"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
            ) : (
              <div style={{ ...S.card, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: T.textFaint, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: "bold" }}>Não estamos ao vivo</div>
                  <div style={{ fontSize: 12, color: T.textSub }}>Cultos: Qui 20h • Dom 10h e 19h</div>
                </div>
              </div>
            )}

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
                <div style={{ fontSize: 12, color: T.textSub }}>Assista nossos cultos e pregações</div>
                <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>youtube.com/@familiaaliancapiracicaba</div>
              </div>
            </div>

            {/* Último Vídeo do Culto */}
            {ultimoVideo && getYouTubeId(ultimoVideo.url) && (
              <>
                <div style={S.secTitle}>Último Culto</div>
                <div style={{ margin: "0 16px 12px" }}>
                  {ultimoVideo.titulo && (
                    <div style={{ fontSize: 14, fontWeight: "bold", color: T.text, marginBottom: 10 }}>{ultimoVideo.titulo}</div>
                  )}
                  <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid " + T.cardBorder }}>
                    <iframe
                      width="100%" height="200"
                      src={`https://www.youtube.com/embed/${getYouTubeId(ultimoVideo.url)}`}
                      title="Último Culto"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ display: "block" }}
                    />
                  </div>
                  {ultimoVideo.data && (
                    <div style={{ fontSize: 11, color: T.textFaint, marginTop: 8, textAlign: "right" }}>{fmtData(ultimoVideo.data)}</div>
                  )}
                </div>
              </>
            )}

            {/* Contribuição rápida */}
            <div style={S.secTitle}>Contribua com a Igreja</div>
            <div style={S.pixCard}>
              <div style={S.pixTitle}>💛 Dízimos & Ofertas</div>
              <div style={S.pixSub}>Contribua via PIX e seja parte da obra de Deus</div>
              <div style={{ fontSize: 11, color: T.textSub, marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>Chave PIX</div>
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
            <div style={{ padding: "20px 20px 0", cursor: "pointer", color: T.gold, fontSize: 13 }} onClick={() => setTab("home")}>← Voltar</div>
            <div style={{ padding: "16px 20px 0" }}>
              <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: T.gold, marginBottom: 8 }}>Palavra Semanal • {fmtData(palavra.data)}</div>
              <div style={{ fontSize: 22, fontWeight: "bold", lineHeight: 1.3, marginBottom: 8 }}>{palavra.titulo}</div>
              {palavra.referencia && <div style={{ fontSize: 14, color: T.gold, fontStyle: "italic", marginBottom: 20 }}>{palavra.referencia}</div>}
              {/* Renderiza parágrafos formatados */}
              <div style={{ fontSize: 15, lineHeight: 1.6, color: T.textSub }}>
                {palavra.texto.split("\n").map((par, i) => {
                  if (par.trim() === "") return <br key={i} style={{ lineHeight: "0.3" }} />;
                  const parts = par.split(/(\*\*.*?\*\*)/g).map((p, j) =>
                    p.startsWith("**") && p.endsWith("**")
                      ? <strong key={j} style={{ color: T.text }}>{p.slice(2, -2)}</strong>
                      : p
                  );
                  return <p key={i} style={{ marginBottom: 5 }}>{parts}</p>;
                })}
              </div>
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

            {/* Hero */}
            <div style={{ margin: "0 16px 20px", background: "linear-gradient(135deg,rgba(201,168,76,.18),rgba(100,60,180,.10))", border: `1px solid ${darkMode ? "rgba(201,168,76,.25)" : "rgba(154,112,32,.55)"}`, borderRadius: 20, padding: "28px 22px", textAlign: "center" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>📖</div>
              <div style={{ fontSize: 18, fontWeight: "bold", color: T.text, marginBottom: 10 }}>Leia a Bíblia Sagrada</div>
              <div style={{ fontSize: 14, color: T.textSub, lineHeight: 1.7, marginBottom: 20 }}>
                Acesse a Bíblia completa em diversas versões — NVI, NVT, ARC e muito mais — pelo YouVersion, o app de Bíblia mais usado no mundo!
              </div>
              <button style={{ width: "100%", padding: "15px 0", background: "linear-gradient(90deg,#c9a84c,#e8c97a)", border: "none", borderRadius: 12, color: "#080810", fontSize: 15, fontWeight: "bold", cursor: "pointer", fontFamily: "Georgia,serif", marginBottom: 10 }}
                onClick={() => window.open("https://www.bible.com/pt", "_blank")}>
                📖 Abrir Bíblia Online
              </button>
              <button style={{ width: "100%", padding: "13px 0", background: T.card, border: "1px solid " + T.cardBorder, borderRadius: 12, color: T.textSub, fontSize: 14, cursor: "pointer", fontFamily: "Georgia,serif" }}
                onClick={() => window.open("https://www.bible.com/app", "_blank")}>
                📱 Baixar App YouVersion
              </button>
            </div>

            {/* Versões disponíveis */}
            <div style={S.secTitle}>Versões Disponíveis</div>
            {[
              { nome: "Nova Versão Internacional", sigla: "NVI", desc: "Tradução moderna e fiel ao texto original", url: "https://www.bible.com/pt/bible/129/GEN.1.NVI" },
              { nome: "Nova Versão Transformadora", sigla: "NVT", desc: "Linguagem contemporânea e clara", url: "https://www.bible.com/pt/bible/1608/GEN.1.NVT" },
              { nome: "Almeida Revista e Corrigida", sigla: "ARC", desc: "A versão clássica mais conhecida", url: "https://www.bible.com/pt/bible/212/GEN.1.ARC" },
              { nome: "Nova Tradução na Linguagem de Hoje", sigla: "NTLH", desc: "Linguagem simples e acessível", url: "https://www.bible.com/pt/bible/211/GEN.1.NTLH" },
            ].map(v => (
              <div key={v.sigla} style={{ margin: "0 16px 10px", background: T.card, border: "1px solid " + T.cardBorder, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
                onClick={() => window.open(v.url, "_blank")}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(201,168,76,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: "bold", color: T.gold, flexShrink: 0 }}>{v.sigla}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: "bold", color: T.text, marginBottom: 3 }}>{v.nome}</div>
                  <div style={{ fontSize: 12, color: T.textSub }}>{v.desc}</div>
                </div>
                <div style={{ color: T.gold, fontSize: 18 }}>›</div>
              </div>
            ))}
          </div>
        )}

        {/* ══ ORAÇÃO ══ */}
        {tab === "oracao" && (
          <div style={{ animation: "slideUp .4s ease" }}>
            <div style={S.secTitle}>Pedido de Oração</div>
            <div style={S.card}>
              <div style={{ fontSize: 14, color: T.textSub, marginBottom: 16, lineHeight: 1.6 }}>
                Compartilhe seu pedido com o nosso Ministério de Intercessão. Vamos orar por você! 🙏
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
                <div style={S.secTitle}>Pedidos Recebidos ({oracoes.length})</div>
                {oracoes.map(o => (
                  <div key={o.id} style={{ ...S.card, display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: "bold", color: T.gold, marginBottom: 4 }}>{o.nome}</div>
                      <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.6 }}>{o.pedido}</div>
                      {o.data && <div style={{ fontSize: 11, color: T.textFaint, marginTop: 6 }}>{fmtData(o.data)}</div>}
                    </div>
                    <button style={S.delBtn} onClick={async () => {
                      if (window.confirm("Excluir este pedido de oração?")) {
                        await deleteDoc(doc(db, "oracoes", o.id));
                        showToast("🗑️ Pedido removido!");
                      }
                    }}>🗑️</button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ══ DEVOCIONAL ══ */}
        {tab === "devocional" && (
          <div style={{ animation: "slideUp .4s ease", paddingBottom: 20 }}>

            {/* Hero */}
            <div style={{ margin: "16px 16px 0", background: "linear-gradient(135deg,rgba(201,168,76,.18),rgba(100,60,180,.12))", border: `1px solid ${darkMode ? "rgba(201,168,76,.25)" : "rgba(154,112,32,.55)"}`, borderRadius: 20, padding: "28px 22px", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🕊️</div>
              <div style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>Devocional da Semana</div>
              <div style={{ fontSize: 14, color: T.textSub, lineHeight: 1.8, fontStyle: "italic", borderLeft: "2px solid #c9a84c", paddingLeft: 14, textAlign: "left" }}>
                "O devocional não é uma obrigação religiosa — é um encontro de amor com Aquele que nos criou e nos redimiu."
              </div>
            </div>

            {/* Sobre o devocional */}
            <div style={{ margin: "16px 16px 0", background: T.card, border: "1px solid " + T.cardBorder, borderRadius: 16, padding: "18px" }}>
              <div style={{ fontSize: 14, fontWeight: "bold", color: T.gold, marginBottom: 10 }}>Por que fazer o devocional?</div>
              <div style={{ fontSize: 14, lineHeight: 1.8, color: T.textSub }}>
                O devocional diário é o momento sagrado em que nos aproximamos de Deus através da Sua Palavra e da oração. É nesse tempo de intimidade que nossa fé é fortalecida, nossa mente renovada e nosso coração transformado.
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.8, color: T.textSub, marginTop: 10 }}>
                Assim como o corpo precisa de alimento diário, nossa alma precisa da Palavra de Deus para crescer, viver e prosperar em todas as áreas da vida.
              </div>
              <div style={{ marginTop: 14, fontSize: 13, color: T.gold, fontStyle: "italic", borderLeft: "2px solid rgba(201,168,76,.4)", paddingLeft: 12 }}>
                "A tua palavra é lâmpada que ilumina os meus passos e luz que clareia o meu caminho." — Salmos 119:105
              </div>
            </div>

            {/* Devocional da semana */}
            {devocional ? (
              <>
                <div style={S.secTitle}>Esta Semana</div>

                {/* Versículo */}
                <div style={{ margin: "0 16px 12px", background: "rgba(201,168,76,.08)", border: `1px solid ${darkMode ? "rgba(201,168,76,.25)" : "rgba(154,112,32,.55)"}`, borderRadius: 16, padding: "20px" }}>
                  {devocional.titulo && (
                    <div style={{ fontSize: 18, fontWeight: "bold", color: T.text, marginBottom: 14, textAlign: "center" }}>{devocional.titulo}</div>
                  )}
                  <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: T.gold, marginBottom: 12 }}>📖 Versículo da Semana</div>
                  <div style={{ fontSize: 17, lineHeight: 1.8, color: T.text, fontStyle: "italic", borderLeft: "3px solid #c9a84c", paddingLeft: 16, marginBottom: 10 }}>
                    "{devocional.versiculo}"
                  </div>
                  <div style={{ fontSize: 13, color: T.gold, textAlign: "right" }}>— {devocional.referencia}</div>
                </div>

                {/* Palavra */}
                <div style={{ margin: "0 16px 12px", background: T.card, border: "1px solid " + T.cardBorder, borderRadius: 16, padding: "20px" }}>
                  <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: T.gold, marginBottom: 12 }}>✝️ Palavra</div>
                  {devocional.palavra.split("\n").map((par, i) => {
                    if (!par.trim()) return <br key={i} />;
                    const parts = par.split(/(\*\*.*?\*\*)/g).map((p, j) =>
                      p.startsWith("**") && p.endsWith("**")
                        ? <strong key={j} style={{ color: T.text }}>{p.slice(2, -2)}</strong>
                        : p
                    );
                    return <p key={i} style={{ fontSize: 14, lineHeight: 1.8, color: T.textSub, marginBottom: 10 }}>{parts}</p>;
                  })}
                </div>

                {/* Aplicação */}
                <div style={{ margin: "0 16px 12px", background: "rgba(100,60,180,.08)", border: "1px solid rgba(100,60,180,.2)", borderRadius: 16, padding: "20px" }}>
                  <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#a78bfa", marginBottom: 12 }}>💡 Aplicação Prática</div>
                  {devocional.aplicacao.split("\n").map((par, i) => {
                    if (!par.trim()) return <br key={i} />;
                    return <p key={i} style={{ fontSize: 14, lineHeight: 1.8, color: T.textSub, marginBottom: 10 }}>{par}</p>;
                  })}
                </div>

                {/* Oração */}
                <div style={{ margin: "0 16px 12px", background: "rgba(37,211,102,.05)", border: "1px solid rgba(37,211,102,.15)", borderRadius: 16, padding: "20px" }}>
                  <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#4ade80", marginBottom: 12 }}>🙏 Oração</div>
                  <div style={{ fontSize: 14, lineHeight: 1.8, color: T.textSub, fontStyle: "italic" }}>
                    {devocional.oracao}
                  </div>
                </div>

                {/* Data */}
                {devocional.data && (
                  <div style={{ textAlign: "center", fontSize: 11, color: T.textFaint, marginTop: 8 }}>
                    Publicado em {fmtData(devocional.data)}
                  </div>
                )}
              </>
            ) : (
              <div style={{ margin: "16px 16px 0", background: T.card, border: "1px solid " + T.cardBorder, borderRadius: 16, padding: "24px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📖</div>
                <div style={{ fontSize: 14, color: T.textSub }}>Nenhum devocional publicado ainda.</div>
                <div style={{ fontSize: 12, color: T.textFaint, marginTop: 6 }}>Volte em breve!</div>
              </div>
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
                <div style={{ color: T.textFaint, fontSize: 18 }}>›</div>
              </div>
            ))}
          </div>
        )}

        {tab === "ministerios" && ministerioAtivo && (
          <div style={{ animation: "slideUp .4s ease" }}>
            <div style={{ padding: "20px 20px 0", cursor: "pointer", color: T.gold, fontSize: 13 }} onClick={() => setMinisterioAtivo(null)}>← Voltar</div>
            <div style={{ padding: "20px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{ministerioAtivo.icon}</div>
              <div style={{ fontSize: 22, fontWeight: "bold", color: ministerioAtivo.cor, marginBottom: 12 }}>{ministerioAtivo.nome}</div>
              <div style={{ fontSize: 15, lineHeight: 1.8, color: T.textSub }}>{ministerioAtivo.desc}</div>
              <div style={{ ...S.card, marginTop: 20, marginLeft: 0, marginRight: 0 }}>
                <div style={{ fontSize: 13, color: T.textSub }}>Quer fazer parte deste ministério?</div>
                <button style={{ ...S.oracaoBtn, marginTop: 12 }}
                  onClick={() => window.open(`https://wa.me/${WHATSAPP_PASTOR}?text=${encodeURIComponent(`Olá Pastor Fernando! Gostaria de participar do ministério ${ministerioAtivo.nome}.`)}`, "_blank")}>
                  💬 Falar com o Pastor
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ VOLUNTARIADO ══ */}
        {tab === "voluntario" && (
          <div style={{ animation: "slideUp .4s ease" }}>
            {/* Hero */}
            <div style={{ margin: "16px 16px 0", background: "linear-gradient(135deg,rgba(201,168,76,.18),rgba(100,60,180,.10))", border: `1px solid ${darkMode ? "rgba(201,168,76,.25)" : "rgba(154,112,32,.55)"}`, borderRadius: 20, padding: "28px 22px", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🤲</div>
              <div style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, lineHeight: 1.3 }}>Seja um Voluntário</div>
              <div style={{ fontSize: 14, color: T.textSub, lineHeight: 1.8, fontStyle: "italic", borderLeft: "2px solid #c9a84c", paddingLeft: 14, textAlign: "left" }}>
                "O ato que mais nos assemelha a Cristo é o ato de Servir. Jesus não veio para ser servido, mas para servir e dar a sua vida em resgate de muitos."
              </div>
              <div style={{ fontSize: 12, color: T.gold, marginTop: 8, textAlign: "right" }}>— Mateus 20:28</div>
            </div>

            {/* Texto sobre voluntariado */}
            <div style={{ margin: "16px 16px 0", background: T.card, border: "1px solid " + T.cardBorder, borderRadius: 16, padding: "20px" }}>
              <div style={{ fontSize: 15, fontWeight: "bold", color: T.gold, marginBottom: 10 }}>Por que ser voluntário?</div>
              <div style={{ fontSize: 14, lineHeight: 1.8, color: T.textSub }}>
                O voluntariado na Igreja Família Aliança é muito mais do que ajudar — é uma oportunidade de crescer espiritualmente, desenvolver dons e talentos, e fazer parte de algo maior do que nós mesmos.
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.8, color: T.textSub, marginTop: 10 }}>
                Cada pessoa tem um dom único dado por Deus. Quando colocamos esses dons a serviço da Igreja, somos instrumentos da graça de Deus na vida das pessoas.
              </div>
            </div>

            {/* Ministérios */}
            <div id="mais-ministerios" style={S.secTitle}>Conheça os nossos Ministérios</div>
            {MINISTERIOS.map(m => (
              <div key={m.id} style={{ margin: "0 16px 10px", background: T.card, border: `1px solid ${m.cor}30`, borderLeft: `3px solid ${m.cor}`, borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 22 }}>{m.icon}</span>
                  <div style={{ fontSize: 14, fontWeight: "bold", color: m.cor }}>{m.nome}</div>
                </div>
                <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.6 }}>{m.desc}</div>
              </div>
            ))}

            {/* Formulário */}
            <div style={S.secTitle}>Quero Servir!</div>
            <div style={{ margin: "0 16px 24px", background: T.card, border: "1px solid " + T.cardBorder, borderRadius: 16, padding: "20px" }}>
              <div style={{ fontSize: 13, color: T.textSub, marginBottom: 16, lineHeight: 1.6 }}>
                Preencha o formulário abaixo e nossa equipe entrará em contato com você! 🙏
              </div>

              <label style={S.label}>Nome completo *</label>
              <input style={{ ...S.input, marginBottom: 0 }} placeholder="Seu nome"
                value={voluntarioForm.nome} onChange={e => setVoluntarioForm({ ...voluntarioForm, nome: e.target.value })} />

              <label style={S.label}>E-mail *</label>
              <input style={{ ...S.input, marginBottom: 0 }} placeholder="seu@email.com" type="email"
                value={voluntarioForm.email} onChange={e => setVoluntarioForm({ ...voluntarioForm, email: e.target.value })} />

              <label style={S.label}>WhatsApp *</label>
              <input style={{ ...S.input, marginBottom: 0 }} placeholder="(19) 99999-9999" type="tel"
                value={voluntarioForm.telefone} onChange={e => setVoluntarioForm({ ...voluntarioForm, telefone: e.target.value })} />

              <label style={S.label}>Ministério de interesse *</label>
              <select style={{ ...S.select, marginBottom: 0 }}
                value={voluntarioForm.ministerio} onChange={e => setVoluntarioForm({ ...voluntarioForm, ministerio: e.target.value })}>
                <option value="">Selecione um ministério...</option>
                {MINISTERIOS.map(m => <option key={m.id} value={m.nome}>{m.icon} {m.nome}</option>)}
              </select>

              <label style={S.label}>Conte um pouco sobre você</label>
              <textarea style={{ ...S.textarea, minHeight: 80 }}
                placeholder="Por que você quer ser voluntário? Tem algum dom ou habilidade especial?"
                value={voluntarioForm.mensagem} onChange={e => setVoluntarioForm({ ...voluntarioForm, mensagem: e.target.value })} />

              <button style={{ width: "100%", marginTop: 16, padding: "15px 0", background: (enviandoVoluntario || !voluntarioForm.nome || !voluntarioForm.email || !voluntarioForm.telefone || !voluntarioForm.ministerio) ? "rgba(201,168,76,.3)" : "linear-gradient(90deg,#c9a84c,#e8c97a)", border: "none", borderRadius: 12, color: "#080810", fontSize: 15, fontWeight: "bold", cursor: (enviandoVoluntario || !voluntarioForm.nome || !voluntarioForm.email || !voluntarioForm.telefone || !voluntarioForm.ministerio) ? "not-allowed" : "pointer", fontFamily: "Georgia,serif" }}
                disabled={enviandoVoluntario || !voluntarioForm.nome || !voluntarioForm.email || !voluntarioForm.telefone || !voluntarioForm.ministerio}
                onClick={async () => {
                  setEnviandoVoluntario(true);
                  try {
                    await emailjs.send(
                      EMAILJS_SERVICE_ID,
                      EMAILJS_TEMPLATE_ID,
                      {
                        nome:       voluntarioForm.nome,
                        email:      voluntarioForm.email,
                        telefone:   voluntarioForm.telefone,
                        ministerio: voluntarioForm.ministerio,
                        mensagem:   voluntarioForm.mensagem || "—",
                      },
                      EMAILJS_PUBLIC_KEY
                    );
                    setVoluntarioForm({ nome: "", email: "", telefone: "", ministerio: "", mensagem: "" });
                    showToast("🤲 Candidatura enviada! Que Deus abençoe!");
                  } catch (err) {
                    console.error("EmailJS erro:", err);
                    showToast("⚠️ Erro ao enviar. Tente novamente.");
                  } finally {
                    setEnviandoVoluntario(false);
                  }
                }}>
                {enviandoVoluntario ? "Enviando..." : "🤲 Enviar candidatura"}
              </button>
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
                <div key={i} style={{ ...S.contatoRow, borderBottom: i < HORARIOS_CULTO.length - 1 ? "1px solid " + T.cardBorder : "none" }}>
                  <div style={S.contatoIcon}>{h.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: "bold", color: T.text }}>{h.dia}</div>
                    <div style={{ fontSize: 12, color: T.gold, marginTop: 2 }}>{h.hora}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* WhatsApp Atendimento */}
            <div id="mais-whatsapp" style={S.secTitle}>Fale Conosco pelo WhatsApp</div>
            <div style={S.card}>
              <div style={{ fontSize: 13, color: T.textSub, marginBottom: 14, lineHeight: 1.6 }}>
                Entre em contato para:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {WHATSAPP_SERVICOS.map((s, i) => (
                  <div key={i} style={{ padding: "6px 12px", background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 20, fontSize: 12, color: T.text, display: "flex", alignItems: "center", gap: 5 }}>
                    <span>{s.icon}</span>{s.label}
                  </div>
                ))}
              </div>
              <button style={{ width: "100%", padding: "14px 0", background: "linear-gradient(90deg,#25d366,#128C7E)", border: "none", borderRadius: 12, color: T.text, fontSize: 14, fontWeight: "bold", cursor: "pointer", fontFamily: "Georgia,serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
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
                  <div style={{ fontSize: 14, fontWeight: "bold", color: T.text, marginBottom: 3 }}>Rua Armando Longatti, nº 45</div>
                  <div style={{ fontSize: 13, color: T.textSub }}>Vila Industrial — Piracicaba/SP</div>
                </div>
              </div>
              <div style={{ borderRadius: 10, overflow: "hidden", marginBottom: 12, border: "1px solid " + T.cardBorder }}>
                <iframe
                  title="Localização Igreja Família Aliança"
                  width="100%" height="180"
                  style={{ border: 0, display: "block" }}
                  loading="lazy"
                  allowFullScreen
                  src="https://maps.google.com/maps?q=Rua+Armando+Longatti+45+Vila+Industrial+Piracicaba+SP&output=embed"
                />
              </div>
              <button style={{ width: "100%", padding: "11px 0", background: "rgba(201,168,76,.12)", border: `1px solid ${darkMode ? "rgba(201,168,76,.3)" : "rgba(154,112,32,.6)"}`, borderRadius: 10, color: T.gold, fontSize: 13, cursor: "pointer", fontFamily: "Georgia,serif" }}
                onClick={() => window.open(MAPS_URL, "_blank")}>
                🗺️ Abrir no Google Maps
              </button>
            </div>

            {/* Contribuição */}
            <div id="mais-pix" style={S.secTitle}>Dízimos & Ofertas</div>
            <div style={S.pixCard}>
              <div style={S.pixTitle}>💛 Contribua com a Igreja</div>
              <div style={S.pixSub}>Sua contribuição sustenta a obra de Deus em Piracicaba</div>
              <div style={{ fontSize: 11, color: T.textSub, marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>Chave PIX</div>
              <div style={S.pixKey}>{PIX_KEY}</div>
              <button style={S.copyBtn} onClick={() => { navigator.clipboard.writeText(PIX_KEY); showToast("✅ Chave PIX copiada!"); }}>
                📋 Copiar chave PIX
              </button>
              <div style={{ marginTop: 12, fontSize: 12, color: T.textSub, textAlign: "center" }}>
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

            {/* ── AVISOS ── */}
            <div id="mais-avisos" style={S.secTitle}>📢 Avisos da Igreja</div>
            {avisos.length === 0 ? (
              <div style={{ ...S.card, textAlign: "center", padding: "24px 20px" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                <div style={{ fontSize: 13, color: T.textSub }}>Nenhum aviso no momento.</div>
              </div>
            ) : avisos.map(av => {
              const tipoAviso = {
                info:    { cor: "#3b82f6", bg: "rgba(59,130,246,.08)",  borda: "rgba(59,130,246,.25)",  icon: "ℹ️" },
                urgente: { cor: "#ef4444", bg: "rgba(239,68,68,.08)",   borda: "rgba(239,68,68,.25)",   icon: "🚨" },
                evento:  { cor: "#c9a84c", bg: "rgba(201,168,76,.08)",  borda: "rgba(201,168,76,.25)",  icon: "📅" },
                oracao:  { cor: "#8b5cf6", bg: "rgba(139,92,246,.08)",  borda: "rgba(139,92,246,.25)",  icon: "🙏" },
              }[av.tipo] || { cor: "#3b82f6", bg: "rgba(59,130,246,.08)", borda: "rgba(59,130,246,.25)", icon: "ℹ️" };
              return (
                <div key={av.id} style={{ margin: "0 16px 10px", background: tipoAviso.bg, border: `1px solid ${tipoAviso.borda}`, borderLeft: `3px solid ${tipoAviso.cor}`, borderRadius: 14, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 16 }}>{tipoAviso.icon}</span>
                    <div style={{ fontSize: 14, fontWeight: "bold", color: tipoAviso.cor, flex: 1 }}>{av.titulo}</div>
                    <div style={{ fontSize: 10, color: T.textFaint }}>{fmtData(av.data)}</div>
                  </div>
                  <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.65 }}>
                    {av.texto.split("\n").map((par, i) =>
                      par.trim() === "" ? <br key={i} style={{ lineHeight: "0.6" }} /> : <p key={i} style={{ margin: "0 0 6px" }}>{par}</p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Agenda completa */}
            <div id="mais-agenda" style={S.secTitle}>Agenda Completa</div>
            {agenda.length === 0 ? (
              <div style={{ ...S.card, textAlign: "center" }}><div style={{ fontSize: 13, color: T.textSub }}>Nenhum evento.</div></div>
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
              {["agenda", "palavra", "devocional", "avisos", "video", "aovivo", "membros"].map(t => (
                <button key={t} style={S.adminTab(adminTab === t)} onClick={() => setAdminTab(t)}>
                  {{ agenda: "📅 Agenda", palavra: "📜 Palavra", devocional: "🕊️ Devoc", avisos: "📢 Avisos", video: "▶️ Vídeo", aovivo: "🔴 Ao Vivo", membros: "👥 Membros" }[t]}
                </button>
              ))}
            </div>

            {/* Admin: Agenda */}
            {adminTab === "agenda" && (
              <div style={{ padding: "0 16px" }}>
                <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 14, color: T.gold }}>
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
                  <button style={{ ...S.saveBtn, background: T.card, color: T.textSub, marginTop: 8 }}
                    onClick={() => { setEditandoEvento(null); setNovoEvento({ titulo: "", data: "", hora: "", local: "", tipo: "culto" }); }}>
                    Cancelar
                  </button>
                )}

                <div style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: T.textFaint, marginTop: 24, marginBottom: 12 }}>Eventos Cadastrados</div>
                {agenda.map(ev => (
                  <div key={ev.id} style={{ ...S.card, marginLeft: 0, marginRight: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: "bold" }}>{ev.titulo}</div>
                      <div style={{ fontSize: 12, color: T.textSub }}>{fmtData(ev.data)} • {ev.hora}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={{ padding: "6px 10px", background: "rgba(201,168,76,.1)", border: `1px solid ${darkMode ? "rgba(201,168,76,.3)" : "rgba(154,112,32,.6)"}`, borderRadius: 8, color: T.gold, fontSize: 12, cursor: "pointer", fontFamily: "Georgia,serif" }}
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
                <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 14, color: T.gold }}>Nova Palavra Semanal</div>
                <label style={S.label}>Título da Palavra</label>
                <input style={{ ...S.input, marginBottom: 0 }} placeholder="Ex: A Fidelidade de Deus" value={novaPalavra.titulo}
                  onChange={e => setNovaPalavra({ ...novaPalavra, titulo: e.target.value })} />
                <label style={S.label}>Referência Bíblica</label>
                <input style={{ ...S.input, marginBottom: 0 }} placeholder="Ex: Salmos 37:5" value={novaPalavra.referencia}
                  onChange={e => setNovaPalavra({ ...novaPalavra, referencia: e.target.value })} />
                <label style={S.label}>Texto da Palavra</label>
                {/* Dicas de formatação */}
                <div style={{ background: "rgba(201,168,76,.06)", border: "1px solid rgba(201,168,76,.15)", borderRadius: 8, padding: "8px 12px", marginBottom: 8, fontSize: 11, color: T.textSub, lineHeight: 1.7 }}>
                  💡 <strong style={{ color: T.gold }}>Formatação:</strong> Use <code style={{ color: "#e8c97a" }}>**texto**</code> para <strong>negrito</strong>. Pressione Enter para novo parágrafo. Linha em branco cria espaço extra.
                </div>
                <textarea style={{ ...S.textarea, minHeight: 200, fontFamily: "Georgia,serif", lineHeight: 1.6 }}
                  placeholder={"Escreva a mensagem da semana...\n\nUse Enter para separar parágrafos.\n\nUse **negrito** para destacar palavras."}
                  value={novaPalavra.texto}
                  onChange={e => setNovaPalavra({ ...novaPalavra, texto: e.target.value })} />
                {/* Preview da formatação */}
                {novaPalavra.texto.trim() && (
                  <div style={{ background: "rgba(201,168,76,.04)", border: "1px solid rgba(201,168,76,.12)", borderRadius: 10, padding: "12px 14px", marginTop: 8 }}>
                    <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: T.gold, marginBottom: 8 }}>Preview</div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: T.textSub }}>
                      {novaPalavra.texto.split("\n").map((par, i) => {
                        if (par.trim() === "") return <br key={i} style={{ lineHeight: "0.3" }} />;
                        const parts = par.split(/(\*\*.*?\*\*)/g).map((p, j) =>
                          p.startsWith("**") && p.endsWith("**")
                            ? <strong key={j} style={{ color: T.text }}>{p.slice(2, -2)}</strong>
                            : p
                        );
                        return <p key={i} style={{ marginBottom: 5 }}>{parts}</p>;
                      })}
                    </div>
                  </div>
                )}
                <label style={S.label}>Link do vídeo (opcional)</label>
                <input style={{ ...S.input, marginBottom: 0 }} placeholder="https://youtube.com/..." value={novaPalavra.video}
                  onChange={e => setNovaPalavra({ ...novaPalavra, video: e.target.value })} />
                <button style={S.saveBtn} onClick={salvarPalavra}>💾 Publicar Palavra</button>

                {/* Histórico de palavras */}
                <div style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: T.textFaint, marginTop: 28, marginBottom: 12 }}>Palavras Publicadas</div>
                {historicoPalavras.length === 0 ? (
                  <div style={{ ...S.card, marginLeft: 0, marginRight: 0, textAlign: "center" }}>
                    <div style={{ fontSize: 13, color: T.textSub }}>Nenhuma palavra publicada ainda.</div>
                  </div>
                ) : historicoPalavras.map(p => (
                  <div key={p.id} style={{ ...S.card, marginLeft: 0, marginRight: 0, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, paddingRight: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: "bold", marginBottom: 3 }}>{p.titulo}</div>
                      <div style={{ fontSize: 11, color: T.gold, marginBottom: 3 }}>{p.referencia}</div>
                      <div style={{ fontSize: 11, color: T.textFaint }}>{fmtData(p.data)}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button style={{ padding: "6px 10px", background: "rgba(201,168,76,.1)", border: `1px solid ${darkMode ? "rgba(201,168,76,.3)" : "rgba(154,112,32,.6)"}`, borderRadius: 8, color: T.gold, fontSize: 11, cursor: "pointer", fontFamily: "Georgia,serif" }}
                        onClick={async () => {
                          await setDoc(doc(db, "palavra", "atual"), p);
                          showToast("✅ Palavra reativada!");
                        }}>📌 Ativar</button>
                      <button style={S.delBtn} onClick={async () => {
                        if (window.confirm("Excluir esta palavra?")) {
                          await deleteDoc(doc(db, "palavras_historico", p.id));
                          showToast("🗑️ Palavra excluída!");
                        }
                      }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Admin: Notificações */}
            {adminTab === "notif" && (
              <div style={{ padding: "0 16px" }}>
                <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 4, color: T.gold }}>Enviar Notificação</div>
                <div style={{ fontSize: 12, color: T.textSub, marginBottom: 16 }}>Envie uma mensagem para todos os membros do app</div>
                <label style={S.label}>Título</label>
                <input style={{ ...S.input, marginBottom: 0 }} placeholder="Ex: Culto Especial hoje!" value={notifForm.titulo}
                  onChange={e => setNotifForm({ ...notifForm, titulo: e.target.value })} />
                <label style={S.label}>Mensagem</label>
                <textarea style={{ ...S.textarea, minHeight: 80 }} placeholder="Ex: Não perca o culto de hoje às 19h. Te esperamos!"
                  value={notifForm.mensagem} onChange={e => setNotifForm({ ...notifForm, mensagem: e.target.value })} />
                <button style={S.saveBtn} onClick={async () => {
                  if (!notifForm.titulo || !notifForm.mensagem) return;
                  await addDoc(collection(db, "notificacoes"), {
                    titulo: notifForm.titulo,
                    mensagem: notifForm.mensagem,
                    data: new Date().toISOString(),
                    enviado: false
                  });
                  setNotifForm({ titulo: "", mensagem: "" });
                  showToast("🔔 Notificação agendada!");
                }}>🔔 Enviar para todos</button>
                <div style={{ marginTop: 16, background: "rgba(201,168,76,.06)", border: "1px solid rgba(201,168,76,.15)", borderRadius: 10, padding: "12px 14px", fontSize: 12, color: T.textSub, lineHeight: 1.7 }}>
                  💡 A notificação será recebida por todos os membros que permitiram notificações no app.
                </div>
              </div>
            )}

            {/* Admin: Devocional */}
            {adminTab === "devocional" && (
              <div style={{ padding: "0 16px" }}>
                <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 4, color: T.gold }}>Devocional da Semana</div>
                <div style={{ fontSize: 12, color: T.textSub, marginBottom: 16 }}>Publique o devocional semanal para os membros</div>

                <label style={S.label}>Título do Devocional *</label>
                <input style={{ ...S.input, marginBottom: 0 }} placeholder="Ex: A Graça que Transforma"
                  value={novoDevocional.titulo}
                  onChange={e => setNovoDevocional({ ...novoDevocional, titulo: e.target.value })} />

                <label style={S.label}>Versículo *</label>
                <textarea style={{ ...S.textarea, minHeight: 80, fontStyle: "italic" }}
                  placeholder="Ex: Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito..."
                  value={novoDevocional.versiculo}
                  onChange={e => setNovoDevocional({ ...novoDevocional, versiculo: e.target.value })} />

                <label style={S.label}>Referência *</label>
                <input style={{ ...S.input, marginBottom: 0 }} placeholder="Ex: João 3:16"
                  value={novoDevocional.referencia}
                  onChange={e => setNovoDevocional({ ...novoDevocional, referencia: e.target.value })} />

                <label style={S.label}>Palavra *</label>
                <div style={{ background: "rgba(201,168,76,.06)", border: "1px solid rgba(201,168,76,.15)", borderRadius: 8, padding: "8px 12px", marginBottom: 8, fontSize: 11, color: T.textSub, lineHeight: 1.7 }}>
                  💡 Use **negrito** e Enter para parágrafos
                </div>
                <textarea style={{ ...S.textarea, minHeight: 160 }}
                  placeholder="Escreva a reflexão sobre o versículo..."
                  value={novoDevocional.palavra}
                  onChange={e => setNovoDevocional({ ...novoDevocional, palavra: e.target.value })} />

                <label style={S.label}>Aplicação Prática *</label>
                <textarea style={{ ...S.textarea, minHeight: 100 }}
                  placeholder="Como aplicar essa palavra no dia a dia..."
                  value={novoDevocional.aplicacao}
                  onChange={e => setNovoDevocional({ ...novoDevocional, aplicacao: e.target.value })} />

                <label style={S.label}>Oração *</label>
                <textarea style={{ ...S.textarea, minHeight: 100 }}
                  placeholder="Escreva uma oração baseada no devocional..."
                  value={novoDevocional.oracao}
                  onChange={e => setNovoDevocional({ ...novoDevocional, oracao: e.target.value })} />

                <button style={S.saveBtn} onClick={async () => {
                  if (!novoDevocional.titulo || !novoDevocional.versiculo || !novoDevocional.referencia || !novoDevocional.palavra || !novoDevocional.aplicacao || !novoDevocional.oracao) {
                    showToast("⚠️ Preencha todos os campos!");
                    return;
                  }
                  await setDoc(doc(db, "config", "devocional"), {
                    ...novoDevocional,
                    data: new Date().toISOString().split("T")[0]
                  });
                  setNovoDevocional({ titulo: "", versiculo: "", referencia: "", palavra: "", aplicacao: "", oracao: "" });
                  showToast("✅ Devocional publicado!");
                  setAdminTab("agenda");
                }}>🕊️ Publicar Devocional</button>

                {devocional && (
                  <div style={{ ...S.card, marginLeft: 0, marginRight: 0, marginTop: 20 }}>
                    <div style={{ fontSize: 12, color: T.gold, marginBottom: 6 }}>Devocional atual:</div>
                    <div style={{ fontSize: 13, fontWeight: "bold" }}>{devocional.referencia}</div>
                    <div style={{ fontSize: 12, color: T.textSub, marginTop: 4 }}>{fmtData(devocional.data)}</div>
                  </div>
                )}
              </div>
            )}

            {/* Admin: Avisos */}
            {adminTab === "avisos" && (
              <div style={{ padding: "0 16px" }}>
                <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 4, color: T.gold }}>
                  {editandoAviso ? "✏️ Editar Aviso" : "📢 Novo Aviso"}
                </div>
                <div style={{ fontSize: 12, color: T.textSub, marginBottom: 20 }}>
                  {editandoAviso ? "Edite as informações do aviso abaixo" : "Publique avisos que aparecerão para todos os membros na aba Mais"}
                </div>

                <label style={S.label}>Título do aviso *</label>
                <input style={{ ...S.input, marginBottom: 0 }} placeholder="Ex: Culto especial neste domingo!"
                  value={novoAviso.titulo}
                  onChange={e => setNovoAviso({ ...novoAviso, titulo: e.target.value })} />

                <label style={S.label}>Mensagem *</label>
                <textarea style={{ ...S.textarea, minHeight: 100 }}
                  placeholder="Escreva o texto completo do aviso..."
                  value={novoAviso.texto}
                  onChange={e => setNovoAviso({ ...novoAviso, texto: e.target.value })} />

                <label style={S.label}>Tipo</label>
                <select style={{ ...S.select, marginBottom: 0 }}
                  value={novoAviso.tipo}
                  onChange={e => setNovoAviso({ ...novoAviso, tipo: e.target.value })}>
                  <option value="info">ℹ️ Informativo</option>
                  <option value="urgente">🚨 Urgente</option>
                  <option value="evento">📅 Evento</option>
                  <option value="oracao">🙏 Oração</option>
                </select>

                <button style={S.saveBtn} onClick={async () => {
                  if (!novoAviso.titulo || !novoAviso.texto) { showToast("⚠️ Preencha título e mensagem!"); return; }
                  if (editandoAviso) {
                    await updateDoc(doc(db, "avisos", editandoAviso), {
                      titulo: novoAviso.titulo,
                      texto: novoAviso.texto,
                      tipo: novoAviso.tipo,
                    });
                    setEditandoAviso(null);
                    showToast("✅ Aviso atualizado!");
                  } else {
                    await addDoc(collection(db, "avisos"), {
                      ...novoAviso,
                      data: new Date().toISOString().split("T")[0]
                    });
                    showToast("✅ Aviso publicado!");
                  }
                  setNovoAviso({ titulo: "", texto: "", tipo: "info" });
                }}>
                  {editandoAviso ? "💾 Salvar Alterações" : "📢 Publicar Aviso"}
                </button>

                {editandoAviso && (
                  <button style={{ ...S.saveBtn, background: T.card, color: T.textSub, marginTop: 8 }}
                    onClick={() => { setEditandoAviso(null); setNovoAviso({ titulo: "", texto: "", tipo: "info" }); }}>
                    Cancelar edição
                  </button>
                )}

                {/* Lista de avisos existentes */}
                {avisos.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, color: T.gold, marginTop: 24, marginBottom: 12, letterSpacing: 2, textTransform: "uppercase" }}>Avisos publicados ({avisos.length})</div>
                    {avisos.map(av => (
                      <div key={av.id} style={{ ...S.card, marginLeft: 0, marginRight: 0, marginBottom: 10, display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: "bold", color: T.gold, marginBottom: 3 }}>{av.titulo}</div>
                          <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.5 }}>{av.texto}</div>
                          <div style={{ fontSize: 11, color: T.textFaint, marginTop: 4 }}>{fmtData(av.data)} • {av.tipo}</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <button style={{ padding: "6px 10px", background: "rgba(201,168,76,.1)", border: `1px solid rgba(201,168,76,.3)`, borderRadius: 8, color: T.gold, fontSize: 12, cursor: "pointer", fontFamily: "Georgia,serif" }}
                            onClick={() => {
                              setEditandoAviso(av.id);
                              setNovoAviso({ titulo: av.titulo, texto: av.texto, tipo: av.tipo });
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}>✏️</button>
                          <button style={S.delBtn} onClick={async () => {
                            if (window.confirm("Excluir este aviso?")) {
                              await deleteDoc(doc(db, "avisos", av.id));
                              showToast("🗑️ Aviso removido!");
                            }
                          }}>🗑️</button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Admin: Ao Vivo */}
            {adminTab === "aovivo" && (
              <div style={{ padding: "0 16px" }}>
                <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 4, color: "#c9a84c" }}>Transmissão Ao Vivo</div>
                <div style={{ fontSize: 12, color: T.textSub, marginBottom: 20 }}>Ative quando estiver transmitindo o culto online</div>

                {/* Status atual */}
                <div style={{ ...S.card, marginLeft: 0, marginRight: 0, marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", background: aoVivo?.ativo ? "#ef4444" : "rgba(255,255,255,.2)", flexShrink: 0, boxShadow: aoVivo?.ativo ? "0 0 10px #ef4444" : "none" }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: "bold" }}>{aoVivo?.ativo ? "🔴 AO VIVO AGORA" : "⚫ Offline"}</div>
                    <div style={{ fontSize: 12, color: T.textSub }}>{aoVivo?.ativo ? "Transmissão ativa para todos os membros" : "Nenhuma transmissão ativa"}</div>
                  </div>
                </div>

                <label style={S.label}>Título da transmissão</label>
                <input style={{ ...S.input, marginBottom: 0 }} placeholder="Ex: Culto de Domingo — 10h"
                  value={aoVivo?.titulo || ""}
                  onChange={async (e) => {
                    await setDoc(doc(db, "config", "aoVivo"), { ...aoVivo, titulo: e.target.value });
                  }} />

                <label style={S.label}>Link do YouTube (Live)</label>
                <input style={{ ...S.input, marginBottom: 0 }} placeholder="https://youtube.com/live/..."
                  value={aoVivo?.url || ""}
                  onChange={async (e) => {
                    await setDoc(doc(db, "config", "aoVivo"), { ...aoVivo, url: e.target.value });
                  }} />

                <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                  <button style={{ flex: 1, padding: "16px 0", background: "linear-gradient(90deg,#ef4444,#dc2626)", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: "bold", cursor: "pointer", fontFamily: "Georgia,serif", opacity: aoVivo?.ativo ? 0.4 : 1 }}
                    disabled={aoVivo?.ativo}
                    onClick={async () => {
                      if (!aoVivo?.url) { showToast("⚠️ Cole o link do YouTube!"); return; }
                      await setDoc(doc(db, "config", "aoVivo"), { ...aoVivo, ativo: true });
                      showToast("🔴 Transmissão ativada!");
                    }}>
                    🔴 Iniciar Transmissão
                  </button>
                  <button style={{ flex: 1, padding: "16px 0", background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 12, color: T.text, fontSize: 15, fontWeight: "bold", cursor: "pointer", fontFamily: "Georgia,serif", opacity: !aoVivo?.ativo ? 0.4 : 1 }}
                    disabled={!aoVivo?.ativo}
                    onClick={async () => {
                      await setDoc(doc(db, "config", "aoVivo"), { ...aoVivo, ativo: false });
                      showToast("⚫ Transmissão encerrada!");
                    }}>
                    ⏹ Encerrar
                  </button>
                </div>
              </div>
            )}

            {/* Admin: Vídeo */}
            {adminTab === "video" && (
              <div style={{ padding: "0 16px" }}>
                <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 4, color: T.gold }}>Último Culto no YouTube</div>
                <div style={{ fontSize: 12, color: T.textSub, marginBottom: 16 }}>Cole o link do vídeo para aparecer na tela inicial</div>
                <label style={S.label}>Título do culto</label>
                <input style={{ ...S.input, marginBottom: 0 }}
                  placeholder="Ex: Culto de Domingo — 27/04/2026"
                  value={ultimoVideo?.titulo || ""}
                  onChange={e => setUltimoVideo(v => ({ ...v, titulo: e.target.value }))} />
                <label style={S.label}>Link do YouTube</label>
                <input style={{ ...S.input, marginBottom: 0 }}
                  placeholder="https://youtube.com/watch?v=..."
                  value={ultimoVideo?.url || ""}
                  onChange={e => setUltimoVideo(v => ({ ...v, url: e.target.value }))} />
                <label style={S.label}>Data</label>
                <input style={{ ...S.input, marginBottom: 0 }} type="date"
                  value={ultimoVideo?.data || ""}
                  onChange={e => setUltimoVideo(v => ({ ...v, data: e.target.value }))} />
                {ultimoVideo?.url && getYouTubeId(ultimoVideo.url) && (
                  <div style={{ borderRadius: 12, overflow: "hidden", margin: "14px 0", border: "1px solid " + T.cardBorder }}>
                    <iframe width="100%" height="180"
                      src={`https://www.youtube.com/embed/${getYouTubeId(ultimoVideo.url)}`}
                      title="Preview" frameBorder="0" allowFullScreen style={{ display: "block" }} />
                  </div>
                )}
                <button style={S.saveBtn} onClick={async () => {
                  if (!ultimoVideo?.url) return;
                  await setDoc(doc(db, "config", "ultimoVideo"), {
                    url: ultimoVideo.url,
                    titulo: ultimoVideo.titulo || "",
                    data: ultimoVideo.data || new Date().toISOString().split("T")[0]
                  });
                  showToast("✅ Vídeo atualizado!");
                  setAdminTab("agenda");
                }}>💾 Salvar Vídeo</button>
              </div>
            )}

            {/* Admin: Membros */}
            {adminTab === "membros" && (
              <div style={{ padding: "0 16px" }}>
                <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 4, color: T.gold }}>Membros Cadastrados</div>
                <div style={{ fontSize: 12, color: T.textSub, marginBottom: 16 }}>{membros.length} membro(s)</div>
                {membros.length === 0 ? (
                  <div style={{ ...S.card, marginLeft: 0, marginRight: 0, textAlign: "center" }}>
                    <div style={{ fontSize: 13, color: T.textSub }}>Nenhum membro cadastrado ainda.</div>
                  </div>
                ) : membros.map(m => (
                  <div key={m.id} style={{ ...S.card, marginLeft: 0, marginRight: 0, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(201,168,76,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: T.gold, fontWeight: "bold", flexShrink: 0 }}>
                      {m.nome.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: "bold" }}>{m.nome}</div>
                      <div style={{ fontSize: 12, color: T.textSub }}>{m.email}</div>
                    </div>
                    <button style={S.delBtn} onClick={async () => {
                      if (window.confirm(`Excluir membro ${m.nome}?`)) {
                        await deleteDoc(doc(db, "membros", m.email));
                        showToast("✅ Membro removido!");
                      }
                    }}>🗑️</button>
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
          <button key={t.id} style={S.navBtn(tab === t.id)} onClick={() => {
            setTab(t.id);
            setMinisterioAtivo(null);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}>
            <span style={S.navIcon}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {/* Banner de instalação */}
      {showInstallBanner && (
        <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", width: "calc(100% - 32px)", maxWidth: 400, background: "#040e20", border: `1px solid ${darkMode ? "rgba(201,168,76,.4)" : "rgba(154,112,32,.7)"}`, borderRadius: 16, padding: "16px 18px", zIndex: 998, boxShadow: "0 4px 24px rgba(0,0,0,.6)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <img src="/logo-igreja.png" alt="logo" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "contain" }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: "bold", color: T.text }}>Instalar o App</div>
              <div style={{ fontSize: 12, color: T.textSub }}>Igreja Família Aliança</div>
            </div>
            <button style={{ marginLeft: "auto", background: "none", border: "none", color: T.textSub, fontSize: 20, cursor: "pointer", padding: "0 4px" }} onClick={() => setShowInstallBanner(false)}>✕</button>
          </div>
          {isIOS ? (
            <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.7, background: T.card, borderRadius: 10, padding: "10px 12px" }}>
              Para instalar no iPhone: toque em <strong style={{ color: T.gold }}>Compartilhar</strong> (ícone de seta) e depois em <strong style={{ color: T.gold }}>"Adicionar à Tela de Início"</strong>
            </div>
          ) : (
            <button style={{ width: "100%", padding: "12px 0", background: "linear-gradient(90deg,#c9a84c,#e8c97a)", border: "none", borderRadius: 10, color: "#080810", fontSize: 14, fontWeight: "bold", cursor: "pointer", fontFamily: "Georgia,serif" }}
              onClick={handleInstall}>
              📲 Adicionar à tela inicial
            </button>
          )}
        </div>
      )}

      {toast && <div style={S.toast}>{toast}</div>}
    </div>
  );
}
