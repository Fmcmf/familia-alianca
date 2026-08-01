import React, { useState, useEffect } from "react";
import { db, messaging, solicitarPermissaoNotificacao, onMessage, auth } from "./firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, deleteField } from "firebase/firestore";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updatePassword } from "firebase/auth";
import emailjs from "@emailjs/browser";

// ─── CLOUDINARY CONFIG ──────────────────────────────────────────────────────
const CLOUDINARY_CLOUD = "trmdo2jy";
const CLOUDINARY_PRESET = "familia_alianca";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/upload`;

const uploadCloudinary = async (file, onProgress) => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY_PRESET);
  fd.append("resource_type", "auto");
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", CLOUDINARY_URL);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (data.secure_url) resolve(data.secure_url);
        else reject(new Error(data.error?.message || "Upload falhou"));
      } catch { reject(new Error("Resposta inválida")); }
    };
    xhr.onerror = () => reject(new Error("Erro de conexão"));
    xhr.send(fd);
  });
};

// ─── EMAILJS CONFIG ─────────────────────────────────────────── v1.1 ───────
const ONESIGNAL_APP_ID = "10ba1be7-f0bc-4c2d-bb2e-e9a02d4235f1";
const ONESIGNAL_API_KEY = "os_v2_app_cc5bxz7qxrgc3ozo5gqc2qrv6fvhavzuxthuwrubrn6h6e6hhl7llhqjzm642hcawtwg2341hscb4t6xdvqjwptkzb1665spna4xk3a";
const EMAILJS_SERVICE_ID  = "service_sffzlx2";
const EMAILJS_TEMPLATE_ID = "template_142tb2a";
const EMAILJS_PUBLIC_KEY  = "KkcyGeZOZYPkwGing";

// ─── CONFIG ────────────────────────────────────────────────────────────────
const WHATSAPP_PASTOR = "5519997218590";
const PIX_KEY = "13.327.600/0001-00";

const ENDERECO = "Rua Armando Longatti, nº 45 - Jardim São Vicente - Piracicaba/SP";
const MAPS_URL = "https://www.google.com/maps/search/?api=1&query=Rua+Armando+Longatti+45+Vila+Industrial+Piracicaba+SP";

const HORARIOS_CULTO = [
  { dia: "Terças de Cura", hora: "15h — Oração", icon: "🙏" },
  { dia: "Quinta-feira", hora: "20h", icon: "🌙" },
  { dia: "Domingo em Família", hora: "10h", icon: "🌅" },
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
  { id: 3, nome: "Mídia", icon: "📸", desc: "Comunicando o evangelho com excelência através das redes sociais, transmissões ao vivo e produção audiovisual.", cor: "#06b6d4" },
  { id: 4, nome: "Aliança Kids", icon: "⭐", desc: "Crianças aprendendo o amor de Jesus de forma divertida e criativa.", cor: "#f59e0b" },
  { id: 5, nome: "Ação Social", icon: "❤️", desc: "Servindo a comunidade com amor prático e transformador.", cor: "#ef4444" },
  { id: 6, nome: "Intercessão", icon: "🙏", desc: "Guerreiros de oração intercedendo pela igreja e pela cidade.", cor: "#3b82f6" },
  { id: 7, nome: "MOVE — Jovens", icon: "🔥", desc: "Um movimento de jovens apaixonados por Deus, transformando vidas e gerações.", cor: "#f97316" },
];

const ESTUDOS_FIXOS = [
  // ══ INICIANTES ══
  {
    id: "f1", nivel: "iniciante", fixo: true,
    titulo: "Quem é Deus?",
    versiculo: "Êxodo 34:6 — \"O Senhor, o Senhor, Deus compassivo e misericordioso, tardio em irar-se e grande em amor e fidelidade.\"",
    texto: "Conhecer Deus é a maior aventura da existência humana. Mas quem é Ele, de verdade?\n\n**Deus é o Criador de tudo**\n\nO primeiro versículo da Bíblia declara: 'No princípio, Deus criou os céus e a terra' (Gênesis 1:1). Deus não foi criado — Ele existe por Si mesmo, sem começo e sem fim. Tudo o que existe — o universo, a vida, o tempo — veio à existência por Sua vontade e poder.\n\nIsso significa que você não é um acidente. Você foi criado por um Deus pessoal que o conhece pelo nome, que contou os seus cabelos (Mateus 10:30) e que o amou antes mesmo de você existir.\n\n**Deus é santo e justo**\n\nA palavra 'santo' significa separado, puro, sem mácula. Deus não pode conviver com o pecado — não porque seja intolerante, mas porque Sua natureza é luz pura, e trevas não podem existir onde há luz (1 João 1:5). A justiça de Deus garante que o bem será recompensado e o mal será julgado.\n\n**Deus é amor**\n\nMas Deus não é apenas santo e justo — Ele é amor (1 João 4:8). Não apenas que Deus ama, mas que Deus É amor. Seu amor não depende do nosso comportamento. Ele amou o mundo de tal maneira que deu Seu único Filho para que todo aquele que nEle crê não pereça (João 3:16).\n\n**Deus é pessoal**\n\nDeus não é uma força impessoal ou uma energia cósmica. Ele pensa, sente, age e se comunica. Ele ouve orações, responde, se alegra com Seus filhos e chora com eles. Jesus revelou que podemos chamá-Lo de 'Pai' — a maior prova de que Deus deseja um relacionamento íntimo e real conosco.\n\n**Como conhecer a Deus?**\n\nDeus se revelou de três formas principais: na criação (Salmos 19:1), nas Escrituras (2 Timóteo 3:16) e em Jesus Cristo, que é 'o resplendor da glória de Deus e a expressão exata do seu ser' (Hebreus 1:3). Conhecer Jesus é conhecer o Pai.",
    referencias: [
      "Gênesis 1:1 — No princípio, Deus criou os céus e a terra",
      "1 João 4:7-8 — Deus é amor",
      "Salmos 139:1-18 — Deus nos conhece completamente",
      "João 1:18 — Jesus revelou o Pai",
      "Êxodo 3:14 — Eu Sou o que Sou — o nome de Deus",
      "Isaías 40:28 — O Senhor é o Deus eterno, criador dos confins da terra",
    ],
    perguntas: [
      "Qual atributo de Deus — amor, santidade, poder, onisciência — mais te impressiona? Por quê?",
      "Como a ideia de que Deus é pessoal e não apenas uma força muda sua forma de se relacionar com Ele?",
      "Você já sentiu a presença de Deus em alguma situação da sua vida? Como foi?",
      "O que significa para você saber que Deus te conhece completamente e ainda assim te ama?",
    ],
    oracao: "Senhor Deus, Tu és maior do que posso compreender, e ainda assim Te revelas para mim. Obrigado por ser um Deus pessoal, que me criou, me conhece e me ama com amor eterno. Quero conhecer-Te cada vez mais — não apenas saber sobre Ti, mas Te encontrar de verdade. Revela-Te a mim através da Tua Palavra e do Teu Espírito. Amém."
  },
  {
    id: "f2", nivel: "iniciante", fixo: true,
    titulo: "Quem é Jesus?",
    versiculo: "João 14:6 — \"Eu sou o caminho, a verdade e a vida. Ninguém vem ao Pai, a não ser por mim.\"",
    texto: "Jesus de Nazaré é a figura mais influente da história humana. Mas quem Ele é, de fato?\n\n**Jesus é Deus encarnado**\n\nA grande afirmação do cristianismo é que o eterno Filho de Deus tomou natureza humana e nasceu de uma virgem chamada Maria. João 1:1-14 declara: 'No princípio era o Verbo... e o Verbo se fez carne'. Jesus não é apenas um grande mestre ou profeta — Ele é Deus que veio ao nosso encontro.\n\nEle demonstrou isso em Sua vida: perdoando pecados (algo que só Deus pode fazer), acalmando tempestades, ressuscitando mortos e revelando o caráter exato do Pai.\n\n**Jesus como Caminho**\n\nAntes de Jesus, havia um abismo entre a humanidade pecadora e o Deus santo. Nenhum esforço humano conseguia atravessá-lo. Jesus veio ser esse caminho — não uma filosofia ou método, mas uma Pessoa. Ele disse 'Eu sou o caminho', não 'Eu mostro o caminho'. O acesso a Deus passa por Jesus.\n\n**Jesus como Verdade**\n\nEm um mundo cheio de relativismo, Jesus se apresenta como a Verdade absoluta. Conhecê-Lo é conhecer a realidade sobre Deus, sobre o ser humano, sobre o propósito da vida e sobre o destino eterno. Ele disse: 'E conhecereis a verdade, e a verdade vos libertará' (João 8:32).\n\n**Jesus como Vida**\n\nJesus não veio apenas nos dar regras, mas vida — vida em abundância (João 10:10). Essa vida começa no novo nascimento, continua na caminhada diária com Ele e se completa na eternidade. A ressurreição de Jesus é a garantia de que a morte não tem a última palavra.\n\n**Um encontro pessoal**\n\nO mais importante não é saber sobre Jesus, mas conhecê-Lo pessoalmente. Ele ainda bate à porta: 'Estou à porta e bato. Se alguém ouvir a minha voz e abrir a porta, entrarei' (Apocalipse 3:20). O convite é aberto.",
    referencias: [
      "João 1:1-14 — O Verbo se fez carne",
      "Filipenses 2:5-11 — Jesus, que sendo Deus, assumiu forma de servo",
      "Colossenses 1:15-20 — Jesus, imagem do Deus invisível",
      "Hebreus 1:1-4 — Deus nos falou pelo Filho",
      "1 Coríntios 15:3-4 — Morte e ressurreição de Cristo",
      "Romanos 5:8 — Cristo morreu por nós quando ainda éramos pecadores",
    ],
    perguntas: [
      "O que significa para você dizer que Jesus é o seu caminho, verdade e vida?",
      "Como a ideia de que Jesus é Deus encarnado muda sua visão sobre quem Ele é?",
      "De que forma você tem experimentado a vida abundante que Jesus promete?",
      "Existe algo que te impede de entregar sua vida completamente a Jesus?",
    ],
    oracao: "Senhor Jesus, obrigado por ser meu caminho, minha verdade e minha vida. Obrigado por ter deixado a glória dos céus por mim, por ter morrido no meu lugar e por ter ressuscitado para que eu possa ter vida eterna. Quero Te conhecer cada dia mais profundamente. Toma o controle da minha vida. Amém."
  },
  {
    id: "f3", nivel: "iniciante", fixo: true,
    titulo: "O que é Graça?",
    versiculo: "Efésios 2:8-9 — \"Porque pela graça sois salvos, por meio da fé, e isso não vem de vós; é dom de Deus.\"",
    texto: "A graça é um dos conceitos mais libertadores da fé cristã. Entendê-la muda tudo.\n\n**Graça: favor imerecido**\n\nA palavra grega 'charis' significa favor imerecido, presente não conquistado. Graça não é Deus nos dando o que merecemos — isso seria justiça. Graça é Deus nos dando exatamente o oposto do que merecemos: perdão, amor, adoção e vida eterna.\n\n**Por que precisamos da graça?**\n\nTodos pecamos — 'Todos pecaram e estão destituídos da glória de Deus' (Romanos 3:23). O pecado criou uma separação entre nós e Deus que nenhum esforço humano pode superar. Religiões tentam ensinar como ganhar o favor divino, mas o evangelho diz que Deus já tomou a iniciativa.\n\n**A graça em ação: a cruz**\n\nA maior demonstração da graça foi a cruz. Deus enviou Seu Filho para morrer no lugar de pecadores. Paulo escreve: 'Cristo morreu em nosso favor quando ainda éramos pecadores' (Romanos 5:8). Não quando melhoramos. Quando ainda estávamos perdidos. Isso é graça pura.\n\n**Graça não é permissão para pecar**\n\nUm erro comum é pensar que graça dá liberdade para viver como quisermos. Paulo responde: 'De modo nenhum!' (Romanos 6:1-2). A graça nos transforma de dentro para fora. Quando entendemos o que foi feito por nós, o desejo natural é honrar esse amor.\n\n**Graça para o dia a dia**\n\nA graça não é apenas para o momento da salvação. Ela sustenta toda a caminhada. Hebreus 4:16 nos convida a nos aproximar com confiança 'do trono da graça, a fim de recebermos misericórdia e encontrarmos graça que nos ajude no momento da necessidade'. A cada manhã, as misericórdias de Deus se renovam (Lamentações 3:22-23).",
    referencias: [
      "Romanos 3:21-26 — A justiça de Deus pela fé em Cristo",
      "Romanos 5:1-8 — Justificados pela fé, temos paz com Deus",
      "Tito 2:11-14 — A graça de Deus nos ensina a viver retamente",
      "Hebreus 4:14-16 — O trono da graça",
      "2 Coríntios 12:9 — A minha graça é suficiente para ti",
      "Lamentações 3:22-23 — As misericórdias se renovam a cada manhã",
    ],
    perguntas: [
      "Você já tentou merecer o amor de Deus? Como isso te fez sentir?",
      "De que forma entender que a salvação é pela graça muda sua relação com Deus?",
      "Como você pode demonstrar graça às pessoas ao seu redor esta semana?",
      "Existe algo que te faz sentir indigno da graça de Deus? O que a Bíblia diz sobre isso?",
    ],
    oracao: "Pai, obrigado pela Tua graça que me salva, sustenta e transforma. Que eu nunca tome esse presente como garantido. Liberta-me de tentar ganhar o Teu amor pelo meu esforço, e ajuda-me a descansar na graça que já foi dada. Que eu seja, para os outros, um reflexo dessa mesma graça. Em nome de Jesus, amém."
  },
  {
    id: "f4", nivel: "iniciante", fixo: true,
    titulo: "O Espírito Santo",
    versiculo: "João 14:16-17 — \"Eu pedirei ao Pai, e ele vos dará outro Consolador para estar convosco para sempre: o Espírito da verdade.\"",
    texto: "O Espírito Santo é frequentemente o membro da Trindade menos compreendido. Muitos cristãos vivem como se Ele não existisse. Mas Ele é essencial para a vida cristã.\n\n**Quem é o Espírito Santo?**\n\nO Espírito Santo não é uma força, uma energia ou uma influência — Ele é uma Pessoa divina, a terceira Pessoa da Santíssima Trindade. Ele pensa (Romanos 8:27), sente (Efésios 4:30), age (Atos 13:2) e pode ser contrariado (Atos 5:3). Ele é co-igual e co-eterno com o Pai e o Filho.\n\n**O que o Espírito Santo faz?**\n\nSua obra é ampla e essencial. Ele convence de pecado (João 16:8), opera o novo nascimento (João 3:5-8), habita no crente como templo (1 Coríntios 6:19), guia para a verdade (João 16:13), intercede por nós (Romanos 8:26-27), distribui dons espirituais (1 Coríntios 12) e produz frutos na vida do crente (Gálatas 5:22-23).\n\n**O fruto do Espírito**\n\nGálatas 5:22-23 lista o fruto do Espírito: amor, alegria, paz, longanimidade, benignidade, bondade, fidelidade, mansidão e domínio próprio. Não são conquistas do nosso esforço, mas resultado natural de uma vida rendida ao Espírito.\n\n**Como ser cheio do Espírito Santo?**\n\nEfésios 5:18 ordena: 'Sede cheios do Espírito'. É um mandamento, não uma opção. Ser cheio do Espírito significa ser controlado por Ele — rendering nossa vontade à Sua direção. Isso acontece através da rendição diária, da oração, da Palavra e da obediência.",
    referencias: [
      "João 14:16-26 — A promessa do Consolador",
      "Atos 2:1-4 — A descida do Espírito Santo em Pentecostes",
      "Romanos 8:1-17 — Vida no Espírito",
      "1 Coríntios 12 — Os dons do Espírito",
      "Gálatas 5:16-25 — Fruto do Espírito x obras da carne",
      "Efésios 5:18 — Sede cheios do Espírito",
    ],
    perguntas: [
      "Qual aspecto da obra do Espírito Santo mais te surpreende ou impressiona?",
      "Como você percebe a presença e a ação do Espírito Santo na sua vida?",
      "Quais frutos do Espírito você sente que estão crescendo em você? Quais precisam crescer mais?",
      "O que seria diferente na sua vida se você estivesse completamente rendido ao Espírito Santo?",
    ],
    oracao: "Espírito Santo, obrigado por habitar em mim e por nunca me abandonar. Perdoa as vezes em que Te ignorei ou Te entristeço. Quero ser cheio de Ti — que Tu controles meus pensamentos, palavras e ações. Produz em mim o Teu fruto e usa-me segundo Tua vontade. Amém."
  },
  {
    id: "f5", nivel: "iniciante", fixo: true,
    titulo: "A Bíblia: Palavra de Deus",
    versiculo: "2 Timóteo 3:16-17 — \"Toda a Escritura é inspirada por Deus e útil para o ensino, para a repreensão, para a correção e para a instrução na justiça.\"",
    texto: "A Bíblia é o livro mais vendido, mais traduzido e mais influente da história. Mas o que a torna única?\n\n**A Bíblia é Palavra de Deus**\n\nA afirmação central é que a Bíblia não é apenas um livro humano sobre Deus — é o próprio Deus falando através de seres humanos. 'Toda a Escritura é inspirada por Deus' (2 Timóteo 3:16). A palavra 'inspirada' em grego é 'theopneustos' — literalmente 'soprada por Deus'.\n\nIsso não significa que os autores foram robôs. Cada escritor expressou sua personalidade, seu estilo e seu contexto. Mas o Espírito Santo os guiou de tal forma que as palavras resultantes são ao mesmo tempo humanas e divinas.\n\n**O que a Bíblia contém?**\n\nA Bíblia é composta por 66 livros, escritos por cerca de 40 autores, ao longo de aproximadamente 1.500 anos. Apesar dessa diversidade, apresenta uma unidade notável — a história da redenção da humanidade por Deus, culminando em Jesus Cristo.\n\n**Para que serve a Bíblia?**\n\nPaulo diz que ela é útil para: ensino (aprender a verdade), repreensão (ser corrigido quando erra), correção (voltar ao caminho certo) e instrução na justiça (aprender a viver santamente). O objetivo final é que o homem de Deus seja 'perfeito e plenamente capacitado' (2 Timóteo 3:17).\n\n**Como ler a Bíblia?**\n\nNão existe fórmula mágica, mas algumas práticas ajudam: comece com os Evangelhos (Mateus, Marcos, Lucas ou João), leia regularmente mesmo que pouco, peça ao Espírito Santo que abra sua mente, anote o que aprendeu e aplique na vida. A Palavra de Deus é 'viva e eficaz' (Hebreus 4:12) — ela transforma quem a recebe com fé.",
    referencias: [
      "2 Timóteo 3:14-17 — Toda Escritura é inspirada por Deus",
      "2 Pedro 1:20-21 — Nenhuma profecia é de interpretação pessoal",
      "Hebreus 4:12 — A Palavra de Deus é viva e eficaz",
      "Salmos 119:105 — Lâmpada para os meus pés é a Tua palavra",
      "Salmos 19:7-11 — A perfeição da lei do Senhor",
      "Mateus 5:17-18 — Jesus e o cumprimento das Escrituras",
    ],
    perguntas: [
      "Como você descreve sua relação atual com a leitura da Bíblia? É regular, esporádica ou quase inexistente?",
      "Qual passagem bíblica já impactou sua vida de forma significativa? Por quê?",
      "O que te impede de ler a Bíblia com mais regularidade? Como pode superar isso?",
      "De que forma a Palavra de Deus tem servido como lâmpada para seus pés em decisões difíceis?",
    ],
    oracao: "Pai, obrigado pela Tua Palavra — um tesouro inestimável. Perdoa-me pelas vezes que a negligenciei. Abre meu coração e minha mente para recebê-la com fé. Que Tua Palavra seja minha meditação dia e noite, e que ela me transforme à imagem de Cristo. Amém."
  },
  {
    id: "f6", nivel: "iniciante", fixo: true,
    titulo: "Oração: Conversando com Deus",
    versiculo: "Filipenses 4:6-7 — \"Não andeis ansiosos de coisa alguma; antes, em tudo fazei conhecidas as vossas petições a Deus em oração e súplica.\"",
    texto: "A oração é o respirar da alma. Sem ela, a vida espiritual sufoca gradualmente — muitas vezes sem que percebamos.\n\n**O que é oração?**\n\nOração não é um ritual religioso ou uma lista de pedidos enviada a um Deus distante. É conversa com o Pai que nos ama. Jesus chamou Deus de 'Abba' — Papai — e nos convidou para essa mesma intimidade (Romanos 8:15). Deus quer ouvir tudo: alegrias, medos, dúvidas, gratidão.\n\n**Jesus e a oração**\n\nSe alguém não precisava orar, era Jesus — o Filho de Deus. E ainda assim Ele orava constantemente: antes de decisões (Lucas 6:12-13), em momentos de angústia (Lucas 22:42), madrugadas inteiras (Marcos 1:35). Se Jesus priorizava a oração, quanto mais nós precisamos?\n\n**O Pai Nosso como modelo**\n\nQuando os discípulos pediram 'Ensina-nos a orar', Jesus deu um modelo (Lucas 11:1-4). O Pai Nosso não é uma oração para ser recitada mecanicamente, mas uma estrutura que nos guia: adoração ('Santificado seja o Teu nome'), alinhamento ('Venha o Teu reino'), dependência ('O pão nosso de cada dia nos dá hoje'), confissão ('Perdoa-nos') e proteção ('Livra-nos do mal').\n\n**A oração que transforma**\n\nA oração transforma principalmente quem ora, não apenas as circunstâncias. Ela alinha nossa vontade com a de Deus. Filipenses 4:6-7 promete que a paz que excede todo entendimento guardará nossos corações — não necessariamente mudando a situação, mas transformando nossa perspectiva.\n\n**Cultivando o hábito**\n\nNão existe segredo: comece. Dez minutos consistentes valem mais que uma hora esporádica. Encontre um lugar, estabeleça um horário, use a Palavra como base e seja honesto. Deus não se assusta com nossa honestidade.",
    referencias: [
      "Mateus 6:5-15 — O Pai Nosso e os princípios da oração",
      "Lucas 18:1-8 — A parábola da viúva persistente",
      "Filipenses 4:6-7 — A paz de Deus que excede todo entendimento",
      "1 Tessalonicenses 5:17 — Orai sem cessar",
      "Tiago 5:16 — A oração do justo tem grande poder",
      "Romanos 8:26-27 — O Espírito intercede por nós",
    ],
    perguntas: [
      "Como você descreveria sua vida de oração atualmente? O que gostaria que fosse diferente?",
      "Você ora principalmente com pedidos ou também inclui adoração, gratidão e confissão?",
      "Você já viveu uma experiência em que a oração não mudou a circunstância, mas mudou você?",
      "O que você poderia fazer essa semana para tornar a oração uma prioridade maior?",
    ],
    oracao: "Pai, que maravilha é poder Te chamar de Pai! Obrigado por me convidar a essa intimidade. Perdoa as vezes que tratei a oração como obrigação em vez de privilégio. Ensina-me a orar com persistência, honestidade e dependência total de Ti. Que a oração seja o respirar da minha alma. Amém."
  },

  // ══ AVANÇADOS ══
  {
    id: "f7", nivel: "avancado", fixo: true,
    titulo: "A Santíssima Trindade",
    versiculo: "Mateus 28:19 — \"Ide, portanto, fazei discípulos de todas as nações, batizando-os em nome do Pai, e do Filho, e do Espírito Santo.\"",
    texto: "A Trindade é a doutrina central e mais distintiva do cristianismo. É também um dos maiores mistérios da fé.\n\n**O que é a Trindade?**\n\nA doutrina afirma que existe um único Deus que subsiste eternamente em três Pessoas distintas: Pai, Filho e Espírito Santo. Cada Pessoa é plenamente Deus, mas não existem três deuses — existe um único Deus em três Pessoas.\n\nIsso não é uma contradição matemática (1+1+1=3), mas uma realidade ontológica única (1x1x1=1): uma essência, três subsistências.\n\n**Evidências bíblicas**\n\nEmbora a palavra 'Trindade' não apareça na Bíblia, a realidade está presente em toda ela. No batismo de Jesus, as três Pessoas aparecem simultaneamente (Mateus 3:16-17). A Grande Comissão batiza 'em nome' (singular) do Pai, Filho e Espírito Santo. Paulo fecha 2 Coríntios 13:14 com a bênção trinitária. João 1:1 identifica o Verbo como Deus, mas distinto do Pai.\n\n**As relações intratrinitárias**\n\nO Pai gera o Filho eternamente (Salmos 2:7; João 1:14). O Filho é eternamente gerado pelo Pai. O Espírito procede do Pai e do Filho (João 15:26). Essas relações não implicam inferioridade — são relacionamentos de amor eterno dentro da divindade.\n\n**Por que isso importa?**\n\nA Trindade revela que o amor não é algo que Deus desenvolveu na criação, mas a natureza eterna de Deus. Antes de criar qualquer coisa, havia amor perfeito entre as três Pessoas. Somos convidados a participar dessa comunhão de amor (João 17:21-23). A Igreja, como comunidade de amor, reflete a natureza trinitária de Deus.",
    referencias: [
      "Mateus 3:16-17 — As três Pessoas no batismo de Jesus",
      "João 1:1-18 — O Verbo, que era Deus",
      "João 17:20-23 — A unidade trinitária como modelo para a Igreja",
      "2 Coríntios 13:14 — A bênção trinitária",
      "Gênesis 1:26 — 'Façamos o homem à nossa imagem'",
      "Deuteronômio 6:4 — 'O Senhor nosso Deus é o único Senhor'",
    ],
    perguntas: [
      "Como a doutrina da Trindade distingue o cristianismo de outras religiões monoteístas?",
      "De que forma a ideia de que Deus é amor eterno entre três Pessoas muda sua compreensão da natureza de Deus?",
      "Como a unidade na diversidade da Trindade pode ser um modelo para a Igreja e para os relacionamentos?",
      "Qual aspecto da Trindade você acha mais desafiador de compreender? Como você lida com esse mistério?",
    ],
    oracao: "Pai, Filho e Espírito Santo — único Deus em três Pessoas — obrigado por me revelar Tua natureza e por me convidar a participar da Tua comunhão de amor. Que a minha vida reflita a unidade e o amor que existe em Ti. Que eu nunca reduza Tua grandeza à minha pequena compreensão. Amém."
  },
  {
    id: "f8", nivel: "avancado", fixo: true,
    titulo: "Justificação pela Fé",
    versiculo: "Romanos 3:28 — \"Porque concluímos que o homem é justificado pela fé, independentemente das obras da lei.\"",
    texto: "A justificação pela fé foi o coração da Reforma Protestante e continua sendo o artigo pelo qual a Igreja está de pé ou cai.\n\n**O que é justificação?**\n\nJustificação é um ato forense — uma declaração legal. Quando Deus justifica o pecador, Ele o declara justo diante de Seu tribunal, não com base no desempenho do pecador, mas com base na perfeita obediência de Cristo imputada a ele pela fé.\n\nA distinção crucial: Deus não nos justifica porque somos justos — Ele nos declara justos por causa de Cristo. Nossa justificação é externa a nós (extra nos), assentada na obra acabada de Jesus.\n\n**Justificação vs. Santificação**\n\nJustificação é instantânea e completa: acontece no momento da fé e é permanente. Santificação é progressiva e contínua: é o processo de ser transformado à imagem de Cristo ao longo da vida. Misturar os dois é uma das maiores fontes de confusão espiritual.\n\n**Somente pela fé (Sola Fide)**\n\nPaulo é enfático: a justificação é 'pela fé, independentemente das obras da lei' (Romanos 3:28). Não é pela fé mais as obras. Não é pela fé mais os sacramentos. É pela fé somente — mas essa fé genuína sempre produz obras (Tiago 2:17).\n\n**A dupla imputação**\n\nA doutrina envolve duas imputações: nossos pecados foram imputados a Cristo na cruz (Ele carregou nossa culpa), e a justiça de Cristo é imputada a nós pela fé (recebemos Seu registro perfeito). Paulo chama isso de 'a troca maravilhosa': 'Aquele que não conheceu pecado, Deus o fez pecado por nós, para que nos tornássemos, nele, justiça de Deus' (2 Coríntios 5:21).",
    referencias: [
      "Romanos 3:21-31 — A justiça de Deus revelada pela fé",
      "Romanos 4:1-8 — Abraão foi justificado pela fé",
      "Gálatas 2:15-21 — Justificados pela fé em Cristo",
      "2 Coríntios 5:21 — A troca maravilhosa",
      "Filipenses 3:8-9 — A justiça que vem pela fé em Cristo",
      "Tiago 2:14-26 — A fé sem obras é morta",
    ],
    perguntas: [
      "Como você distingue justificação de santificação na sua vida prática?",
      "De que formas você tende a buscar ser justificado pelas suas obras em vez de descansar na obra de Cristo?",
      "Como a ideia de que sua posição diante de Deus não depende do seu desempenho afeta sua paz interior?",
      "Por que Tiago diz que a fé sem obras é morta, se Paulo diz que somos justificados pela fé independente das obras?",
    ],
    oracao: "Senhor, que maravilha é ser declarado justo não pelo que faço, mas pelo que Cristo fez! Guarda-me de tentar ganhar o que já foi dado gratuitamente. Que essa certeza me liberte do medo e me motive a viver de maneira que honre esse presente precioso. Em nome de Jesus, amém."
  },
  {
    id: "f9", nivel: "avancado", fixo: true,
    titulo: "A Armadura de Deus",
    versiculo: "Efésios 6:11 — \"Revesti-vos de toda a armadura de Deus, para que possais ficar firmes contra as ciladas do diabo.\"",
    texto: "A vida cristã é uma batalha espiritual real. Deus não nos deixou desarmados.\n\n**A natureza da batalha**\n\nPaulo é claro: 'Não temos que lutar contra a carne e o sangue, mas contra os principados, contra as potestades, contra os príncipes das trevas deste século' (Efésios 6:12). Nosso inimigo é espiritual, portanto nossas armas também devem ser espirituais.\n\n**1. Cinto da Verdade**\n\nO cinto sustentava todas as outras peças e protegia os órgãos vitais. A verdade de Deus é nosso fundamento. O diabo é 'pai da mentira' (João 8:44) — sua estratégia é distorcer a verdade sobre Deus e sobre nós. Conhecer a Palavra nos protege do engano.\n\n**2. Couraça da Justiça**\n\nA couraça protegia o coração. A justiça de Cristo imputada a nós protege nosso coração das acusações do inimigo. 'Não há, pois, agora condenação alguma para os que estão em Cristo Jesus' (Romanos 8:1).\n\n**3. Calçado do Evangelho**\n\nO soldado romano usava sandálias com pregos para firmeza no campo de batalha. O evangelho nos dá firmeza e nos prepara para avançar, levando boas novas onde formos.\n\n**4. Escudo da Fé**\n\nO escudo romano, o 'scutum', era grande e podia ser interligado com outros, formando parede impenetrável. A fé apaga os 'dardos inflamados do maligno' — dúvidas, medos, acusações.\n\n**5. Capacete da Salvação**\n\nProtege a mente. Saber que somos salvos, que nossa identidade está segura em Cristo, nos protege dos ataques mentais do inimigo.\n\n**6. Espada do Espírito**\n\nA única arma ofensiva. É a Palavra de Deus. Jesus a usou no deserto: 'Está escrito...' (Mateus 4:1-11). Conhecer as Escrituras de memória nos dá acesso a essa espada a qualquer momento.\n\n**A oração como combustível**\n\nApós descrever a armadura, Paulo acrescenta: 'Orando em todo tempo' (Efésios 6:18). A oração é o que dá vida a toda a armadura.",
    referencias: [
      "Efésios 6:10-20 — A armadura de Deus completa",
      "2 Coríntios 10:3-5 — As armas da nossa guerra não são carnais",
      "Romanos 8:1 — Nenhuma condenação para os que estão em Cristo",
      "Mateus 4:1-11 — Jesus usando a Palavra contra Satanás",
      "1 Pedro 5:8-9 — Sede sóbrios e vigilantes",
      "Tiago 4:7 — Resisti ao diabo e ele fugirá",
    ],
    perguntas: [
      "Qual peça da armadura você sente que está mais fraca na sua vida agora?",
      "Como o conhecimento das Escrituras tem sido uma espada nas batalhas que você enfrenta?",
      "Como a certeza da sua salvação influencia a forma como você enfrenta os ataques do inimigo?",
      "De que maneira a oração se conecta com o uso de cada peça da armadura?",
    ],
    oracao: "Senhor, me revisto hoje de toda a Tua armadura. Cingo-me com a verdade, visto a couraça da justiça, calço-me com o evangelho, levanto o escudo da fé, coloco o capacete da salvação e empunho a espada do Espírito. Que eu possa estar firme não na minha força, mas no poder do Teu nome. Amém."
  },
  {
    id: "f10", nivel: "avancado", fixo: true,
    titulo: "Sofrimento e Fé",
    versiculo: "Romanos 8:18 — \"Porque para mim tenho por certo que os sofrimentos do tempo presente não podem ser comparados com a glória que em nós há de ser revelada.\"",
    texto: "Uma das perguntas mais difíceis da vida cristã é: por que Deus permite o sofrimento? Não há resposta simples, mas a Bíblia oferece perspectivas profundas.\n\n**O sofrimento é real**\n\nO cristianismo não nega a realidade da dor. Jesus chorou diante do túmulo de Lázaro (João 11:35). Os Salmos estão cheios de lamento. O Livro de Jó é inteiramente dedicado ao sofrimento. Deus não pede que fingamos que está tudo bem quando não está.\n\n**Tipos de sofrimento**\n\nNem todo sofrimento tem a mesma origem. Há sofrimento consequência do pecado (nossas escolhas têm resultados), sofrimento por viver em um mundo caído (doenças, desastres), sofrimento pelo nome de Cristo (perseguição), e sofrimento cujo propósito não compreendemos — como no caso de Jó.\n\n**O que o sofrimento produz**\n\nPaulo escreve que 'a tribulação produz perseverança; a perseverança, experiência; a experiência, esperança' (Romanos 5:3-4). Pedro diz que o fogo da provação purifica a fé 'mais preciosa do que o ouro' (1 Pedro 1:6-7). O sofrimento, quando recebido com fé, tem poder transformador.\n\n**Deus sofreu conosco**\n\nA maior resposta cristã ao sofrimento não é uma explicação filosófica, mas uma Pessoa: Jesus. Deus entrou no sofrimento humano. Ele foi tentado, traído, abandonado, torturado e morreu. Hebreus 4:15 diz que temos um sumo sacerdote 'que foi tentado em tudo como nós'. Ele entende.\n\n**A perspectiva eterna**\n\nPaulo chama suas provações — que incluíam prisão, açoites e naufrágio — de 'leve e momentânea tribulação' comparada 'à eterna e excessiva glória' (2 Coríntios 4:17). A perspectiva eterna não elimina a dor, mas transforma como nos relacionamos com ela.",
    referencias: [
      "Romanos 5:3-5 — A tribulação produz perseverança",
      "1 Pedro 1:6-7 — A prova da fé mais preciosa que ouro",
      "2 Coríntios 4:16-18 — A glória eterna supera a tribulação presente",
      "Jó 1-2; 38-42 — A história de Jó e a resposta de Deus",
      "Hebreus 4:14-16 — Jesus, sumo sacerdote que entende nossa fraqueza",
      "João 11:32-35 — Jesus chora com Maria",
    ],
    perguntas: [
      "Como você tem respondido ao sofrimento na sua vida — com fuga, amargura, resignação ou fé?",
      "O sofrimento que você já viveu contribuiu de alguma forma para o seu crescimento espiritual?",
      "Como a ideia de que Jesus sofreu e entende sua dor impacta sua relação com Ele nos momentos difíceis?",
      "De que forma a perspectiva eterna muda como você vê seus problemas presentes?",
    ],
    oracao: "Senhor, há momentos em que a dor parece maior do que a esperança. Mas Tu és o Deus que entrou no sofrimento por amor a nós. Ajuda-me a confiar em Ti mesmo quando não entendo. Que minha fé seja purificada no fogo da provação e que eu possa dizer, no final, que valerá a pena. Amém."
  },
  {
    id: "f11", nivel: "avancado", fixo: true,
    titulo: "A Igreja: Corpo de Cristo",
    versiculo: "Efésios 1:22-23 — \"E sujeitou todas as coisas debaixo dos seus pés e sobre todas as coisas o constituiu cabeça da Igreja, que é o seu corpo.\"",
    texto: "A Igreja não é um prédio, um evento ou uma instituição religiosa. Ela é o povo de Deus, o corpo de Cristo, a comunidade do Reino.\n\n**A identidade da Igreja**\n\nO Novo Testamento usa diversas imagens para descrever a Igreja: corpo (1 Coríntios 12), noiva (Efésios 5:25-27), templo (Efésios 2:19-22), família (Efésios 2:19), rebanho (João 10:16). Cada imagem revela uma dimensão: unidade na diversidade, intimidade com Cristo, presença do Espírito, pertencimento mútuo, dependência do Pastor.\n\n**A missão da Igreja**\n\nJesus definiu a missão em Mateus 28:19-20: ir, fazer discípulos, batizar, ensinar. Atos 2:42-47 mostra a Igreja primitiva vivendo isso: ensinamento apostólico, comunhão, partir do pão, orações, generosidade, testemunho. A missão é ao mesmo tempo externa (evangelização) e interna (edificação).\n\n**Os dons no corpo**\n\n1 Coríntios 12 ensina que o Espírito distribui dons a cada membro, 'como lhe apraz', para o bem comum. Não existe membro sem dom e não existe dom sem responsabilidade. A saúde do corpo depende de que cada parte funcione.\n\n**A importância da comunhão local**\n\nHebreus 10:24-25 exorta a não 'deixarmos de congregar-nos'. A vida cristã não é um esporte individual. Precisamos de comunidade para crescer, para ser responsabilizados, para servir e para ser servidos. A Igreja local é o contexto normal do discipulado.\n\n**A Igreja imperfeita**\n\nA Igreja é santa e ao mesmo tempo pecadora. É a noiva de Cristo e um hospital de almas necessitadas. Não devemos idolatrar a Igreja nem desprezá-la. Devemos amá-la como Cristo a amou — 'entregando-se por ela' (Efésios 5:25).",
    referencias: [
      "Efésios 2:19-22 — A Igreja como templo santo",
      "1 Coríntios 12:12-31 — O corpo e seus membros",
      "Atos 2:42-47 — A Igreja primitiva em ação",
      "Mateus 16:18 — Sobre esta pedra edificarei a minha Igreja",
      "Efésios 5:25-27 — Cristo amou a Igreja",
      "Hebreus 10:24-25 — Não abandones a assembleia",
    ],
    perguntas: [
      "Como você tem se relacionado com a Igreja local — como consumidor ou como participante ativo?",
      "Qual dom espiritual você acredita ter recebido? Como está usando para o bem da comunidade?",
      "Como você lida com as imperfeições e decepções dentro da Igreja?",
      "O que significa para você ser parte do corpo de Cristo em termos práticos no seu dia a dia?",
    ],
    oracao: "Senhor, obrigado pela Igreja — imperfeita, mas Tua. Perdoa-me pelas vezes em que a critiquei sem a amar, em que recebi sem dar, em que estive presente sem me comprometer. Que eu ame a Igreja como Tu a amaste — com entrega e perseverança. Amém."
  },
  {
    id: "f12", nivel: "avancado", fixo: true,
    titulo: "Vida de Oração Profunda",
    versiculo: "Lucas 18:1 — \"Era preciso orar sempre e nunca esmorecer.\"",
    texto: "Há uma diferença entre orar e ter uma vida de oração. A oração é um ato; a vida de oração é uma postura permanente de dependência de Deus.\n\n**Oração como relacionamento**\n\nA oração não é uma técnica espiritual — é o exercício de um relacionamento. Assim como qualquer relacionamento profundo exige tempo, honestidade e presença, a oração aprofunda nossa intimidade com Deus. Jesus não nos ensinou sobre Deus apenas — Ele nos ensinou a falar com o Pai.\n\n**As dimensões da oração**\n\nUma vida de oração madura abrange múltiplas dimensões. A adoração (contemplar quem Deus é) precede a petição. A confissão (honestidade sobre nossos pecados e fraquezas) purifica o canal. A intercessão (orar pelos outros) nos tira do centro. A petição (apresentar nossas necessidades) expressa confiança. A escuta (silêncio diante de Deus) permite que Ele fale.\n\n**Oração e Palavra**\n\nA oração e a Palavra são inseparáveis. A Bíblia nos diz o que Deus pensa; a oração é nossa resposta. Orar sobre o que acabamos de ler é um dos métodos mais poderosos de aprofundar a vida de oração. Os Salmos são o maior livro de orações já escrito.\n\n**Perseverança na oração**\n\nJesus contou a parábola da viúva persistente (Lucas 18:1-8) para ensinar que 'era preciso orar sempre e nunca esmorecer'. A resposta a Deus nem sempre é imediata — às vezes Ele nos convida a persistir, não porque precise ser persuadido, mas porque o processo de perseverar nos transforma.\n\n**Oração contemplativa**\n\nAlém da oração verbal, existe a dimensão contemplativa — estar simplesmente na presença de Deus, sem palavras. Salmos 46:10 diz: 'Aquietai-vos e sabei que eu sou Deus'. Em um mundo acelerado, aprender a quietude diante de Deus é uma das disciplinas mais desafiadoras e mais transformadoras.",
    referencias: [
      "Lucas 18:1-8 — A parábola da viúva persistente",
      "Filipenses 4:6-7 — Não andeis ansiosos; orai",
      "Romanos 8:26-27 — O Espírito intercede por nós",
      "Salmos 46:10 — Aquietai-vos e sabei que eu sou Deus",
      "1 Reis 19:11-13 — Deus na voz mansa e delicada",
      "Mateus 6:5-13 — O ensino de Jesus sobre a oração",
    ],
    perguntas: [
      "Qual é o maior obstáculo na sua vida de oração atualmente? Como pode endereçá-lo?",
      "Você ora principalmente com petições, ou sua oração inclui adoração, confissão, intercessão e escuta?",
      "Como a oração tem transformado você, não apenas suas circunstâncias?",
      "O que aconteceria na sua vida se você passasse os próximos 30 dias com um tempo fixo de oração diária?",
    ],
    oracao: "Pai, Tu és o Deus que ouve. Obrigado por me convidar a essa conversa eterna. Quero ir além das orações ocasionais para uma vida de oração — uma postura permanente de dependência e comunhão. Ensina-me a adorar, confessar, interceder, pedir e escutar. Em nome de Jesus, amém."
  },
];


const DICIONARIO_BIBLICO = [
  { letra: "A", termos: [
    { termo: "Abba", definicao: "Palavra aramaica que significa 'Pai' ou 'Papai', usada por Jesus ao se dirigir a Deus (Marcos 14:36) e pelos cristãos como expressão de intimidade filial com Deus (Romanos 8:15; Gálatas 4:6). Revela o relacionamento de confiança e amor entre o crente e Deus." },
    { termo: "Aliança", definicao: "Acordo solene estabelecido por Deus com a humanidade. As principais alianças bíblicas são: com Noé (Gênesis 9), com Abraão (Gênesis 15 e 17), com Moisés/Israel (Êxodo 19-24), com Davi (2 Samuel 7) e a Nova Aliança em Cristo (Jeremias 31:31-34; Lucas 22:20). Cada aliança envolve promessas, obrigações e sinais." },
    { termo: "Aleluia", definicao: "Expressão hebraica que significa 'Louvai ao Senhor' (Hallelu = louvai; Jah = forma abreviada de YHWH). Aparece especialmente nos Salmos 111-118 e 146-150, e no Novo Testamento em Apocalipse 19:1-6. É um grito de adoração e celebração a Deus." },
    { termo: "Amém", definicao: "Palavra hebraica que expressa concordância, confirmação e fidelidade, derivada da raiz 'aman' (ser firme, fiel). Jesus a usava no início de declarações ('Em verdade vos digo') para enfatizar autoridade. Na liturgia cristã é usada para confirmar orações e declarações." },
    { termo: "Anjo", definicao: "Ser espiritual criado por Deus para servi-Lo e executar Seus propósitos. A palavra significa 'mensageiro'. Os anjos adoram a Deus (Isaías 6), protegem os fiéis (Salmos 91:11), anunciam revelações (Lucas 1:26-38) e executam julgamentos divinos. São seres poderosos mas criados, não devem ser adorados (Apocalipse 22:8-9)." },
    { termo: "Apóstolo", definicao: "Do grego 'apostolos', significa 'enviado'. Refere-se primariamente aos doze discípulos escolhidos por Jesus (Mateus 10:1-4) e a Paulo (Gálatas 1:1). Os critérios apostólicos incluíam ter visto o Senhor ressuscitado e ter sido diretamente comissionado por Ele. Fundaram a Igreja e suas cartas formam o Novo Testamento." },
    { termo: "Arrependimento", definicao: "Do grego 'metanoia', significa mudança de mente e direção. É a resposta inicial ao evangelho (Atos 2:38), envolvendo reconhecimento do pecado, tristeza genuína e mudança de comportamento. Não é mera emoção, mas transformação profunda da orientação da vida, voltando-se de si mesmo e do pecado para Deus." },
    { termo: "Ascensão", definicao: "Subida de Jesus ao céu após Sua ressurreição, quarenta dias depois da Páscoa (Atos 1:9-11). Marca o fim de Seu ministério terreno visível e o início de Seu reinado à direita do Pai (Salmos 110:1). É garantia da vinda do Espírito Santo e da Sua segunda vinda." },
  ]},
  { letra: "B", termos: [
    { termo: "Batismo", definicao: "Sacramento cristão de iniciação que simboliza morte para o pecado e ressurreição para uma nova vida em Cristo (Romanos 6:3-4). Realizado em água, em nome da Trindade (Mateus 28:19). Representa publicamente a fé do crente, a obra purificadora de Cristo e a entrada na comunidade cristã." },
    { termo: "Bênção", definicao: "Favor e graça de Deus derramados sobre uma pessoa ou comunidade. No AT, bênção frequentemente envolvia prosperidade, saúde e descendência (Deuteronômio 28:1-14). No NT, as maiores bênçãos são espirituais: perdão, adoção, o Espírito Santo e a vida eterna (Efésios 1:3). Deus é a fonte de toda bênção." },
    { termo: "Bíblia", definicao: "Do grego 'biblia' (livros). A Palavra de Deus composta por 66 livros (39 no Antigo Testamento e 27 no Novo Testamento), escrita por aproximadamente 40 autores ao longo de 1.500 anos, sob inspiração divina (2 Timóteo 3:16-17). É a autoridade suprema para a fé e prática cristã." },
    { termo: "Buscar a Deus", definicao: "Disposição ativa de se aproximar de Deus através da oração, meditação na Palavra e obediência. As Escrituras prometem que quem busca a Deus com todo o coração O encontrará (Jeremias 29:13; Mateus 7:7-8). É atitude essencial da vida espiritual e pressupõe fé em Sua existência e bondade (Hebreus 11:6)." },
  ]},
  { letra: "C", termos: [
    { termo: "Carne", definicao: "No NT, especialmente em Paulo, 'carne' (grego: 'sarx') refere-se à natureza humana caída e sua tendência ao pecado (Romanos 7:18; Gálatas 5:19-21). Não se refere ao corpo físico em si, mas à orientação egoísta e rebelde que se opõe ao Espírito. O cristão é chamado a 'mortificar' as obras da carne (Colossenses 3:5)." },
    { termo: "Conversão", definicao: "Processo pelo qual uma pessoa se volta de sua vida de pecado e independência para Deus, através do arrependimento e da fé em Jesus Cristo. Envolve uma transformação radical da orientação da vida, sendo descrita como 'novo nascimento' (João 3:3-8) e 'nova criação' (2 Coríntios 5:17)." },
    { termo: "Cruz", definicao: "Instrumento de execução romana que se tornou o símbolo central do cristianismo. Na cruz, Jesus morreu como substituto pelos pecadores, satisfazendo a justiça de Deus e abrindo o caminho da reconciliação (Colossenses 2:14). Paulo a chama de 'poder de Deus' e 'sabedoria de Deus' (1 Coríntios 1:18-25). Para o cristão, carregar a cruz significa abnegação e seguimento a Jesus (Marcos 8:34)." },
    { termo: "Cristão", definicao: "Seguidor de Jesus Cristo. O termo foi usado pela primeira vez em Antioquia (Atos 11:26). Designa alguém que creu no evangelho, foi salvo pela graça e vive sob o senhorio de Cristo. O cristão é chamado a imitar Cristo em amor, serviço e santidade." },
    { termo: "Comunhão", definicao: "Do grego 'koinonia', significa participação, parceria e compartilhamento. Refere-se ao relacionamento íntimo dos crentes entre si e com Deus (1 João 1:3-7). A comunhão cristã envolve partilha de bens, oração, ensino e a Ceia do Senhor (Atos 2:42). É sinal distintivo da vida da Igreja." },
  ]},
  { letra: "D", termos: [
    { termo: "Decálogo", definicao: "As Dez Palavras (ou Dez Mandamentos) dadas por Deus a Moisés no Sinai (Êxodo 20:1-17; Deuteronômio 5:6-21). Dividem-se em deveres para com Deus (1-4) e para com o próximo (5-10). Jesus as resumiu em dois mandamentos: amar a Deus e amar ao próximo (Mateus 22:37-40)." },
    { termo: "Dízimo", definicao: "Décima parte dos rendimentos dedicada a Deus. Praticado antes da Lei (Abraão em Gênesis 14:20; Jacó em Gênesis 28:22), institutionalizado na Lei Mosaica (Levítico 27:30-32) e reafirmado no NT como princípio de generosidade (2 Coríntios 9:6-7). Expressa reconhecimento de que tudo pertence a Deus." },
    { termo: "Doutrina", definicao: "Conjunto de ensinamentos teológicos que formam as crenças fundamentais da fé cristã. Inclui doutrinas sobre Deus (Teologia), a Bíblia (Bibliologia), o ser humano (Antropologia), o pecado (Hamartiologia), Cristo (Cristologia), a salvação (Soteriologia), o Espírito Santo (Pneumatologia) e as últimas coisas (Escatologia)." },
  ]},
  { letra: "E", termos: [
    { termo: "Eleição", definicao: "Doutrina bíblica que afirma que Deus, em Sua soberania e graça, escolheu pessoas para a salvação antes da fundação do mundo (Efésios 1:4-5; Romanos 8:29-30). Não se baseia em mérito humano previsto, mas na vontade soberana de Deus. Tem como objetivo a glorificação de Deus e a santidade do eleito." },
    { termo: "Encarnação", definicao: "Doutrina fundamental que afirma que o eterno Filho de Deus tomou sobre Si a natureza humana, tornando-se o homem Jesus de Nazaré (João 1:14). É o mistério central do cristianismo. Jesus é plenamente Deus e plenamente homem, sem mistura ou confusão de naturezas (Concílio de Calcedônia, 451 d.C.)." },
    { termo: "Espírito Santo", definicao: "A terceira Pessoa da Santíssima Trindade, co-igual e co-eterno com o Pai e o Filho. Prometido por Jesus (João 14:16-17), derramado em Pentecostes (Atos 2). Suas obras incluem: convicção de pecado (João 16:8), novo nascimento (João 3:5-8), habitação no crente (1 Coríntios 6:19), santificação, dons espirituais e intercessão (Romanos 8:26)." },
    { termo: "Evangelho", definicao: "Do grego 'euangelion', boas novas. É a mensagem central do cristianismo: que Jesus Cristo morreu pelos nossos pecados, foi sepultado e ressuscitou ao terceiro dia, segundo as Escrituras (1 Coríntios 15:3-4). É o poder de Deus para a salvação de todo aquele que crê (Romanos 1:16)." },
    { termo: "Expiação", definicao: "A obra de Cristo na cruz pela qual o pecado é coberto e o pecador é reconciliado com Deus. Envolve propiciação (satisfação da ira de Deus), redenção (libertação do cativeiro do pecado) e reconciliação (restauração do relacionamento com Deus). É exclusiva e suficiente (Hebreus 10:10-14)." },
  ]},
  { letra: "F", termos: [
    { termo: "Fé", definicao: "Do grego 'pistis', convicção e confiança. Hebreus 11:1 define fé como 'certeza das coisas que se esperam e prova das coisas que não se veem'. A fé salvadora envolve: conhecimento (notitia) do evangelho, concordância intelectual (assensus) e confiança pessoal (fiducia) em Cristo. É dom de Deus (Efésios 2:8) e sem ela é impossível agradar a Deus (Hebreus 11:6)." },
    { termo: "Fruto do Espírito", definicao: "As nove qualidades que o Espírito Santo produz no crente: amor, alegria, paz, longanimidade, benignidade, bondade, fidelidade, mansidão e domínio próprio (Gálatas 5:22-23). São manifestações do caráter de Cristo sendo formado no crente, em contraste com as obras da carne. O fruto cresce gradualmente através da rendição ao Espírito." },
  ]},
  { letra: "G", termos: [
    { termo: "Glória", definicao: "A manifestação da presença e perfeições de Deus. No AT, a glória (hebraico: 'kabod') frequentemente aparecia como luz ou nuvem luminosa (Êxodo 24:17; 1 Reis 8:11). No NT, a glória de Deus brilha plenamente no rosto de Jesus Cristo (2 Coríntios 4:6). Os cristãos são chamados a glorificar a Deus em tudo (1 Coríntios 10:31) e participarão da glória eterna (Romanos 8:18)." },
    { termo: "Graça", definicao: "Do grego 'charis', favor imerecido. É o amor de Deus em ação a favor de quem não o merece. A salvação é inteiramente pela graça (Efésios 2:8-9), não por obras. Paulo a contrapõe à lei como princípio de relacionamento com Deus (Romanos 6:14). A graça não é apenas perdão do passado, mas poder para o presente e esperança para o futuro (2 Coríntios 12:9)." },
  ]},
  { letra: "H", termos: [
    { termo: "Heresia", definicao: "Ensinamento que se desvia das doutrinas fundamentais da fé cristã, especialmente as definidas nas grandes confissões e concílios da Igreja. As heresias do NT incluíam negação da ressurreição (1 Coríntios 15:12), falsos evangelhos (Gálatas 1:6-9) e negação da encarnação (1 João 4:2-3). Paulo e João advertem seriamente contra elas." },
    { termo: "Humildade", definicao: "Virtude cristã que envolve o reconhecimento correto de si mesmo diante de Deus e dos outros. Jesus é o modelo supremo de humildade (Filipenses 2:5-8). Não é auto-depreciação, mas ausência de orgulho e disposição para servir. Deus resiste ao soberbo, mas dá graça ao humilde (Tiago 4:6; 1 Pedro 5:5)." },
  ]},
  { letra: "I", termos: [
    { termo: "Igreja", definicao: "Do grego 'ekklesia', assembleia dos chamados. É o corpo de Cristo (1 Coríntios 12:27), composto por todos os que verdadeiramente creram nEle. A Igreja universal é invisível; a local é a reunião visível de crentes em um lugar. Seus quatro atributos clássicos são: una, santa, católica (universal) e apostólica. Sua missão é adorar, edificar, evangelizar e servir." },
    { termo: "Inspiração", definicao: "Doutrina que afirma que as Escrituras foram escritas por autores humanos sob a orientação do Espírito Santo, de modo que as palavras resultantes são a Palavra de Deus (2 Timóteo 3:16; 2 Pedro 1:21). Isso garante sua autoridade, inerrância e suficiência. Os autores escreveram com seus estilos e personalidades, mas foram 'soprados' pelo Espírito." },
    { termo: "Intercessão", definicao: "Oração em favor de outros. Cristo é o supremo intercessor, vivendo para sempre interceder pelos Seus (Hebreus 7:25; Romanos 8:34). O Espírito Santo também intercede por nós (Romanos 8:26-27). Os cristãos são chamados a interceder uns pelos outros (1 Timóteo 2:1-2; Tiago 5:16)." },
  ]},
  { letra: "J", termos: [
    { termo: "Justificação", definicao: "Ato forense pelo qual Deus declara o pecador justo com base na obra de Cristo, recebida pela fé (Romanos 3:24-26; 5:1). É a imputação da justiça de Cristo ao crente. É instantânea, completa e permanente — não baseada no desempenho do crente, mas na perfeita obediência de Cristo. Lutero a chamou de 'o artigo pelo qual a Igreja está de pé ou cai'." },
    { termo: "Juízo", definicao: "Avaliação divina de pessoas e ações. A Bíblia fala de um juízo futuro e universal (Hebreus 9:27; Apocalipse 20:11-15) onde todos darão conta a Deus. Para o crente, o juízo de condenação já passou (João 5:24), mas haverá avaliação das obras (2 Coríntios 5:10). Para o incrédulo, o juízo resultará em condenação eterna." },
  ]},
  { letra: "M", termos: [
    { termo: "Messias", definicao: "Palavra hebraica que significa 'o Ungido' (equivalente grego: Cristo). No AT, reis, sacerdotes e profetas eram ungidos para seus ofícios. O Messias prometido seria o Ungido por excelência, cumprindo os três ofícios (Profeta, Sacerdote e Rei). Jesus é o Messias prometido, confessado por Pedro (Mateus 16:16) e reconhecido progressivamente pelos discípulos." },
    { termo: "Misericórdia", definicao: "Atributo de Deus que o move a não dar às pessoas o que merecem por seus pecados. Junto com a graça (dar o que não merecemos), compõe o amor ativo de Deus. As misericórdias do Senhor se renovam a cada manhã (Lamentações 3:22-23). Jesus é descrito como 'misericordioso e fiel sumo sacerdote' (Hebreus 2:17)." },
    { termo: "Milagre", definicao: "Intervenção sobrenatural de Deus na ordem natural das coisas para Seus propósitos. Os milagres bíblicos servem para autenticar mensageiros divinos (Hebreus 2:3-4), demonstrar compaixão, revelar a glória de Deus e anunciar o Reino. Os maiores milagres são a Encarnação e a Ressurreição. Deus permanece soberano sobre Sua criação." },
  ]},
  { letra: "N", termos: [
    { termo: "Novo Nascimento", definicao: "Expressão usada por Jesus em João 3:3-8 para descrever a regeneração — a obra do Espírito Santo que torna uma pessoa nova criatura em Cristo. É necessário para ver e entrar no Reino de Deus. Não é iniciativa humana, mas divina: 'os quais não nasceram do sangue... mas de Deus' (João 1:13)." },
    { termo: "Nova Criação", definicao: "Em 2 Coríntios 5:17, Paulo declara que quem está em Cristo é nova criação, onde as coisas velhas passaram e tudo se tornou novo. Refere-se tanto à transformação individual do crente quanto à renovação cósmica final prometida (Apocalipse 21:1-5; Romanos 8:19-23). É a meta da redenção." },
  ]},
  { letra: "O", termos: [
    { termo: "Oração", definicao: "Comunicação pessoal com Deus, envolvendo adoração, confissão, ação de graças e súplica (Filipenses 4:6). Jesus ensinou sobre a oração no Pai Nosso (Mateus 6:9-13) e praticou-a regularmente. A oração pressupõe a realidade de Deus, Sua atenção aos crentes e Seu poder de agir. O Espírito nos ajuda a orar (Romanos 8:26)." },
    { termo: "Obediência", definicao: "Resposta positiva à vontade de Deus revelada em Sua Palavra. Jesus é o modelo supremo de obediência (Filipenses 2:8; Hebreus 5:8). A obediência cristã não é legalismo, mas resposta de amor à graça recebida (João 14:15). Nasce da fé e é capacitada pelo Espírito, sendo distinta da obediência legal que busca merecer a salvação." },
  ]},
  { letra: "P", termos: [
    { termo: "Pecado", definicao: "Qualquer pensamento, palavra, ação ou omissão que viola o caráter e a lei de Deus (1 João 3:4). Entrou no mundo por Adão (Romanos 5:12) e afetou toda a humanidade. O pecado separa o ser humano de Deus (Isaías 59:2) e traz morte (Romanos 6:23). Somente o sangue de Cristo purifica de todo pecado (1 João 1:7)." },
    { termo: "Perdão", definicao: "Ato divino pelo qual Deus remove a culpa e a penalidade do pecado do crente, baseado na morte expiatória de Cristo. É gratuito (Romanos 3:24), completo (Colossenses 2:13-14) e permanente. O cristão também é chamado a perdoar os outros como Deus o perdoou em Cristo (Efésios 4:32; Colossenses 3:13)." },
    { termo: "Profecia", definicao: "Comunicação da mensagem de Deus, seja para o presente (fortalecer, exortar, consolar — 1 Coríntios 14:3) ou para revelar o futuro. Os profetas do AT foram os portadores da Palavra de Deus para Israel. No NT, a profecia é um dom espiritual. As profecias messiânicas do AT foram cumpridas em Jesus Cristo." },
    { termo: "Propiciação", definicao: "Obra de Cristo que satisfaz a justa ira de Deus contra o pecado. Em 1 João 2:2, Jesus é chamado de 'propiciação pelos nossos pecados'. Deus, em Seu amor, enviou Seu Filho para ser a propiciação (Romanos 3:25). Isso distingue o cristianismo: não é o ser humano que aplaca a ira de Deus, mas o próprio Deus que provê a propiciação." },
  ]},
  { letra: "R", termos: [
    { termo: "Redenção", definicao: "Libertação mediante pagamento de preço. Cristo nos redimiu do pecado e de sua condenação pelo preço de Seu próprio sangue (1 Pedro 1:18-19; Efésios 1:7). A metáfora vem do mercado de escravos: o escravo é comprado e libertado. Somos libertos para pertencer a Deus e servi-Lo em liberdade." },
    { termo: "Regeneração", definicao: "Obra sobrenatural do Espírito Santo pela qual o ser humano morto em pecado recebe nova vida espiritual (Tito 3:5; João 3:5-8; Ezequiel 36:26-27). Precede logicamente a fé e o arrependimento, pois o ser humano em seu estado natural não pode vir a Deus (João 6:44; 1 Coríntios 2:14). É iniciativa exclusivamente divina." },
    { termo: "Ressurreição", definicao: "A ressurreição corporal de Jesus Cristo no terceiro dia após Sua morte é o fato central do cristianismo (1 Coríntios 15:14-17). Demonstra a aceitação do sacrifício de Cristo pelo Pai, a derrota da morte e a garantia da ressurreição dos crentes. Jesus ressuscitou com um corpo glorificado e real, como primícias dos que dormem (1 Coríntios 15:20)." },
    { termo: "Revelação", definicao: "A auto-comunicação de Deus à humanidade. A revelação geral é acessível a todos através da criação e da consciência (Romanos 1:19-20; 2:14-15). A revelação especial é a comunicação específica de Deus em palavras e atos, culminando em Jesus Cristo (Hebreus 1:1-2) e preservada nas Escrituras." },
  ]},
  { letra: "S", termos: [
    { termo: "Sacramento", definicao: "Ritos ordenados por Cristo que envolvem elementos físicos e prometem graça divina. As igrejas protestantes reconhecem dois: Batismo e Ceia do Senhor. São sinais visíveis da graça invisível, meios pelos quais Deus confirma e sela Suas promessas aos crentes. São acompanhados de Palavra e fé para serem eficazes." },
    { termo: "Salvação", definicao: "A obra completa de Deus pela qual o pecador é libertado da culpa, do poder e eventualmente da presença do pecado. Envolve eleição (eterno propósito de Deus), chamado, regeneração, fé, arrependimento, justificação, adoção, santificação e glorificação. É inteiramente de Deus, pela graça, mediante a fé em Cristo." },
    { termo: "Santidade", definicao: "Atributo central de Deus que denota Sua perfeita pureza moral e Sua separação de tudo que é impuro (Isaías 6:3). Para o crente, santidade significa ser separado para Deus e conformado ao caráter de Cristo (1 Pedro 1:15-16). É ao mesmo tempo posicional (somos santos em Cristo) e progressiva (tornamo-nos santificados pela obra do Espírito)." },
    { termo: "Santificação", definicao: "Processo pelo qual o crente é progressivamente transformado à imagem de Cristo pelo Espírito Santo (2 Coríntios 3:18). É distinta da justificação (declaração de justiça) por ser progressiva e contínua. Envolve a cooperação do crente (Filipenses 2:12-13) e o uso dos meios de graça: Palavra, oração, comunhão e disciplinas espirituais." },
    { termo: "Soberania de Deus", definicao: "O domínio absoluto de Deus sobre toda a criação, história e destino humano. Deus governa todas as coisas segundo o conselho de Sua vontade (Efésios 1:11; Daniel 4:35). A soberania de Deus é fundamento da confiança cristã: nada está fora do Seu controle. Ela não elimina a responsabilidade humana, mas é o alicerce da esperança e da oração." },
  ]},
  { letra: "T", termos: [
    { termo: "Tentação", definicao: "Solicitação ao mal, podendo vir do mundo, da carne ou do diabo. Deus não tenta ninguém (Tiago 1:13), mas permite tentações para provar e fortalecer a fé (Tiago 1:2-4). Jesus foi tentado em tudo como nós, mas sem pecado (Hebreus 4:15), e proveu caminho de escape para cada tentação (1 Coríntios 10:13). Resistir ao diabo faz com que ele fuja (Tiago 4:7)." },
    { termo: "Trindade", definicao: "Doutrina central do cristianismo que afirma que o único Deus existe eternamente em três Pessoas distintas — Pai, Filho e Espírito Santo — co-iguais e co-eternos, com uma essência e três subsistências. Não é uma contradição (um Deus em três deuses), mas mistério. Evidências: Mateus 28:19; 2 Coríntios 13:14; João 1:1; 14:16-17." },
  ]},
  { letra: "V", termos: [
    { termo: "Vida Eterna", definicao: "Não apenas existência sem fim, mas qualidade de vida que começa aqui e agora no relacionamento com Deus (João 17:3). É o maior presente de Deus ao crente (João 3:16; Romanos 6:23). Envolve a ressurreição corporal, a visão beatífica (ver a Deus face a face) e a perfeita comunhão com Deus e Seu povo para sempre." },
    { termo: "Vontade de Deus", definicao: "Os propósitos e desejos de Deus. Distingue-se entre a vontade decretiva (tudo o que Deus determina que aconteça — infalível) e a vontade preceptiva (o que Deus ordena e deseja moralmente — pode ser desobedecida). O cristão é chamado a discernir e fazer a vontade de Deus (Romanos 12:2; Efésios 5:17)." },
  ]},
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
// ── SEGURANÇA DE SENHA ──
// Gera um salt aleatório (evita que duas pessoas com a mesma senha tenham o mesmo hash)
const gerarSalt = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
};
// Hash SHA-256 de (salt + senha), em hexadecimal — feito com a Web Crypto API nativa do navegador
const hashSenha = async (senha, salt) => {
  const dados = new TextEncoder().encode(salt + ":" + senha);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dados);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
};
// Senha temporária aleatória (usada na recuperação de senha)
const gerarSenhaTemporaria = () => Math.random().toString(36).slice(-8);
// Deriva um e-mail válido pro Firebase Authentication a partir do identificador de login.
// Contas normais já usam e-mail real (passa direto). Serve como salvaguarda caso algum
// identificador de login não tenha "@" — só pra satisfazer a exigência de formato do Firebase.
const paraContaAuth = (identificador) => identificador.includes("@") ? identificador : `${identificador.toLowerCase()}@interno.familia-alianca`;
// Retorna o intervalo (segunda a domingo) da semana atual, no formato "YYYY-MM-DD" (comparável com ev.data)
// Aliança Music e Mídia servem juntos em todo evento — retorna o ministério "parceiro" pra vínculo automático
const parceiroMinisterio = (m) => m === "Aliança Music" ? "Mídia" : m === "Mídia" ? "Aliança Music" : null;
const getSemanaAtual = () => {
  const hoje = new Date();
  const diaSemana = hoje.getDay(); // 0=domingo ... 6=sábado
  const seg = new Date(hoje);
  seg.setDate(hoje.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1));
  const dom = new Date(seg);
  dom.setDate(seg.getDate() + 6);
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { inicio: fmt(seg), fim: fmt(dom) };
};
const tipoColor = { culto: "#c9a84c", oracao: "#3b82f6", kids: "#f59e0b", music: "#8b5cf6" };
const tipoLabel = { culto: "Culto", oracao: "Oração", kids: "Kids", music: "Music" };

export default function FamiliaAliancaApp() {
  const [screen, setScreen] = useState("splash");
  const [tab, setTab] = useState("home");
  const [user, setUser] = useState(null); // eslint-disable-line no-unused-vars
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLider, setIsLider] = useState(false);
  const [ministerioLider, setMinisterioLider] = useState(null); // ministério atualmente sendo gerenciado no painel
  const [meusMinisteriosLider, setMeusMinisteriosLider] = useState([]); // todos os ministérios que o usuário lidera
  const [buscaAddMin, setBuscaAddMin] = useState("");
  const [mostrarAdicionar, setMostrarAdicionar] = useState(false);
  const [perfilMusical, setPerfilMusical] = useState({ funcoes: [], instrumentos: [] });
  const [membroParaAdicionar, setMembroParaAdicionar] = useState(null);
  const [eventoModo, setEventoModo] = useState("novo"); // novo | buscar
  const [buscaAgenda, setBuscaAgenda] = useState("");
  const [eventoEscalaAberto, setEventoEscalaAberto] = useState(null); // evento selecionado para montar escala
  const [categoriaEscala, setCategoriaEscala] = useState(null); // categoria selecionada na escala
  // Categorias dinâmicas (ministérios não-musicais, ex: Mídia)
  const [categoriasEquipe, setCategoriasEquipe] = useState([]);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState("");
  const [categoriaEditando, setCategoriaEditando] = useState(null); // categoria sendo renomeada
  const [membroEditandoPerfil, setMembroEditandoPerfil] = useState(null); // email do membro cujo perfil/categorias está sendo editado
  const [perfilEmEdicao, setPerfilEmEdicao] = useState({ funcoes: [], instrumentos: [], categorias: [] });
  const [categoriaEditNome, setCategoriaEditNome] = useState("");
  const [perfilCategorias, setPerfilCategorias] = useState({ categorias: [] });
  // Módulo Arquivos (Mídia)
  const [arquivosMidia, setArquivosMidia] = useState([]);
  const [novoArquivoMidia, setNovoArquivoMidia] = useState({ titulo: "", arquivo: "" });
  // Pregação (Pastor insere, Mídia visualiza)
  const [pregacoes, setPregacoes] = useState([]);
  const [novaPregacao, setNovaPregacao] = useState({ titulo: "", versiculos: "", eventoId: "", data: "" });
  // Módulo Música
  const [vsItems, setVsItems] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null); // null | 0-100
  const [uploadando, setUploadando] = useState(false);
  const [escalas, setEscalas] = useState([]);
  const [musicas, setMusicas] = useState([]);
  const [cifras, setCifras] = useState([]);
  const [novaMusica, setNovaMusica] = useState({ titulo: "", artista: "", categoria: "", tom: "", tempo: "", link: "" });
  const [musicaExpandida, setMusicaExpandida] = useState(null); // id da música aberta (com arquivos visíveis)
  const [audioTocando, setAudioTocando] = useState(null); // id do arquivo de áudio com player aberto inline
  const [catalogoMusicasAberto, setCatalogoMusicasAberto] = useState(false);
  const [buscaCatalogoMusica, setBuscaCatalogoMusica] = useState("");
  const [filtroCategoriaCatalogo, setFiltroCategoriaCatalogo] = useState("");
  const [musicaCatalogoExpandida, setMusicaCatalogoExpandida] = useState(null);
  const [escalaQuadradoExpandido, setEscalaQuadradoExpandido] = useState(null);
  const [musicaEscalaExpandida, setMusicaEscalaExpandida] = useState(null);
  // Gerenciamento de Administradores
  const [buscaPromoverAdmin, setBuscaPromoverAdmin] = useState("");
  const [membroParaPromover, setMembroParaPromover] = useState(null);
  const [senhaNovoAdmin, setSenhaNovoAdmin] = useState("");
  const [confirmSenhaNovoAdmin, setConfirmSenhaNovoAdmin] = useState("");
  const [senhaConfirmacaoAdminAtual, setSenhaConfirmacaoAdminAtual] = useState("");
  const [modoAdminNovo, setModoAdminNovo] = useState("existente"); // existente | novo
  const [novoAdminCadastro, setNovoAdminCadastro] = useState({ nome: "", email: "", senha: "" });
  const [revogarAlvoAdmin, setRevogarAlvoAdmin] = useState(null);
  const [senhaConfirmacaoRevogar, setSenhaConfirmacaoRevogar] = useState("");
  const [mostrarSenhaAdmin, setMostrarSenhaAdmin] = useState({});
  const [senhaAtualPropria, setSenhaAtualPropria] = useState("");
  const [novaSenhaPropria, setNovaSenhaPropria] = useState("");
  const [confirmNovaSenhaPropria, setConfirmNovaSenhaPropria] = useState("");
  const [buscaMusicaEscala, setBuscaMusicaEscala] = useState("");
  const [dropdownMusicaEscalaAberto, setDropdownMusicaEscalaAberto] = useState(false);
  const [avisoCardExpandido, setAvisoCardExpandido] = useState(false);
  const [novoArquivoMusica, setNovoArquivoMusica] = useState({ nome: "", arquivo: "", link: "" });
  const [musicaSelecionada, setMusicaSelecionada] = useState(null);
  const [pdfAberto, setPdfAberto] = useState(null); // URL do PDF aberto inline
  const [showCompletarCadastro, setShowCompletarCadastro] = useState(false);
  const [completarForm, setCompletarForm] = useState({});
  const [completarPulado, setCompletarPulado] = useState(false);

  // Auth
  const [loginForm, setLoginForm] = useState({ nome: "", email: "", senha: "", modo: "login" });
  const [loginErro, setLoginErro] = useState("");
  const [recuperando, setRecuperando] = useState(false);
  const [recuperandoEmail, setRecuperandoEmail] = useState("");
  const [recuperandoMsg, setRecuperandoMsg] = useState("");

  // Dados
  const [agenda, setAgenda] = useState([]);
  const [palavra, setPalavra] = useState(null);
  const [oracoes, setOracoes] = useState([]);
  const [membros, setMembros] = useState([]);
  const [avisos, setAvisos] = useState([]);
  const [novoAviso, setNovoAviso] = useState({ titulo: "", texto: "", tipo: "info" });
  const [editandoAviso, setEditandoAviso] = useState(null);
  const [estudos, setEstudos] = useState([]);
  const [estudoAberto, setEstudoAberto] = useState(null);
  const [membroSelecionado, setMembroSelecionado] = useState(null);
  const [buscaMembro, setBuscaMembro] = useState("");
  const [anivMes, setAnivMes] = useState(new Date().getMonth() + 1);
  const [membrosView, setMembrosView] = useState("lista"); // lista | aniversariantes
  const [membrosOrdem, setMembrosOrdem] = useState("nome"); // nome | acesso
  const [lancamentos, setLancamentos] = useState([]);
  const [novoLancamento, setNovoLancamento] = useState({ tipo: "entrada", categoria: "Dízimo", descricao: "", valor: "", data: new Date().toISOString().split("T")[0] });
  const [finPeriodo, setFinPeriodo] = useState(new Date().toISOString().slice(0, 7));
  const [finView, setFinView] = useState("dashboard"); // dashboard | lancamentos | novo | dizimistas
  const [ultimaVisita, setUltimaVisita] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fa_ultima_visita") || "{}"); }
    catch { return {}; }
  });
  const [relatorioVisivel, setRelatorioVisivel] = useState(null);
  const [dizimistas, setDizimistas] = useState([]);
  const [novoDizimo, setNovoDizimo] = useState({ membroNome: "", membroEmail: "", valor: "", data: new Date().toISOString().split("T")[0], formaPagamento: "pix" });
  const [buscaDizimista, setBuscaDizimista] = useState("");
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [dizimoPeriodo, setDizimoPeriodo] = useState(new Date().toISOString().slice(0, 7));
  const [dizimoFiltroTipo, setDizimoFiltroTipo] = useState("mes"); // mes | periodo
  const [dizimoDataInicio, setDizimoDataInicio] = useState(new Date().toISOString().split("T")[0]);
  const [dizimoDataFim, setDizimoDataFim] = useState(new Date().toISOString().split("T")[0]);
  // ── NOVO: Entradas (redesenho — lançamento individual, identificado ou não) ──
  const [entradas, setEntradas] = useState([]);
  const [novaEntrada, setNovaEntrada] = useState({
    data: new Date().toISOString().split("T")[0],
    valor: "",
    tipoPagamento: "pix", // pix | cartao | cheque | dinheiro | outros
    outroTipoDesc: "",
    identificado: null, // null (não escolhido ainda) | true | false
    subtipo: "dizimo", // dizimo | oferta (só quando identificado)
    membroNome: "",
    membroEmail: "",
  });
  const [buscaEntradaMembro, setBuscaEntradaMembro] = useState("");
  const [mostrarSugestoesEntrada, setMostrarSugestoesEntrada] = useState(false);
  const [nomeManualEntrada, setNomeManualEntrada] = useState(false);
  const [entradasPeriodo, setEntradasPeriodo] = useState(new Date().toISOString().slice(0, 7));
  // ── NOVO: Saídas (redesenho — cadastro com vencimento, baixa de pagamento depois) ──
  const [saidas, setSaidas] = useState([]);
  const [novaSaida, setNovaSaida] = useState({
    descricao: "",
    dataLancamento: new Date().toISOString().split("T")[0],
    dataVencimento: "",
    tipo: "boleto", // boleto | debito | pix | dinheiro
    valor: "",
  });
  const [buscaSaida, setBuscaSaida] = useState("");
  const [filtroSaidaStatus, setFiltroSaidaStatus] = useState("pendentes"); // pendentes | pagas | todas
  const [saidaBaixaId, setSaidaBaixaId] = useState(null);
  const [dataBaixaTemp, setDataBaixaTemp] = useState(new Date().toISOString().split("T")[0]);
  const [estudoNivel, setEstudoNivel] = useState("iniciante");
  const [concluidos, setConcluidos] = useState({});
  const [novoEstudo, setNovoEstudo] = useState({ titulo: "", versiculo: "", texto: "", perguntas: ["", "", ""], oracao: "", nivel: "iniciante" });
  const [editandoEstudo, setEditandoEstudo] = useState(null);
  const [bannerHome, setBannerHome] = useState(null);
  const [bannerJejum, setBannerJejum] = useState({
    ativo: true,
    titulo: "JEJUM EM FAMÍLIA — DIA 1",
    subtitulo: "22/06 — BUSQUE A PRESENÇA",
    imagemUrl: "https://i.ibb.co/NdLhjscT/Chat-GPT-Image-8-de-jun-de-2026-15-55-33.png",
  });
  const [dicionarioAberto, setDicionarioAberto] = useState(false);
  const [bibliaModo, setBibliaModo] = useState("texto"); // texto | audio
  const [dicionarioLetra, setDicionarioLetra] = useState("A");
  const [dicionarioTermo, setDicionarioTermo] = useState(null);
  const [dicionarioBusca, setDicionarioBusca] = useState("");

  // UI
  const [toast, setToast] = useState("");
  const [ministerioAtivo, setMinisterioAtivo] = useState(null);
  const [oracao, setOracao] = useState({ nome: "", pedido: "" });
  const [adminTab, setAdminTab] = useState("agenda");
  const [novoEvento, setNovoEvento] = useState({ titulo: "", data: "", hora: "", local: "", tipo: "culto" });
  const [tiposCustom, setTiposCustom] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fa_tipos_evento") || "[]"); }
    catch { return []; }
  });
  const [novoTipo, setNovoTipo] = useState("");
  // Modelos de evento (título + horário padrão) e Locais padrão — compartilhados via Firestore
  const [modelosEvento, setModelosEvento] = useState([]);
  const [novoModeloEvento, setNovoModeloEvento] = useState({ titulo: "", horario: "" });
  const [editandoModeloEvento, setEditandoModeloEvento] = useState(null);
  const [locaisEvento, setLocaisEvento] = useState([]);
  const [novoLocalEvento, setNovoLocalEvento] = useState("");
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
  const [notifAtivada, setNotifAtivada] = useState(false);
  const [mostrarBannerNotif, setMostrarBannerNotif] = useState(false);
  const [notifBloqueada, setNotifBloqueada] = useState(false);

  // Verificar status das notificações
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (window.OneSignal) {
        try {
          const perm = await window.OneSignal.Notifications.permission;
          setNotifAtivada(perm);
          setMostrarBannerNotif(!perm);
        } catch { setMostrarBannerNotif(true); }
      } else {
        setMostrarBannerNotif(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const ativarNotificacoes = async () => {
    // Verificar se já foi bloqueado pelo navegador
    if (Notification.permission === "denied") {
      showToast("🔒 Notificações bloqueadas — veja como liberar abaixo");
      setNotifBloqueada(true);
      return;
    }
    try {
      if (window.OneSignal) {
        await window.OneSignal.Notifications.requestPermission();
        const perm = await window.OneSignal.Notifications.permission;
        setNotifAtivada(perm);
        if (perm) {
          setMostrarBannerNotif(false);
          setNotifBloqueada(false);
          showToast("🔔 Notificações ativadas com sucesso!");
        } else {
          setNotifBloqueada(true);
        }
      } else {
        const perm = await Notification.requestPermission();
        if (perm === "granted") {
          setNotifAtivada(true);
          setMostrarBannerNotif(false);
          showToast("🔔 Notificações ativadas com sucesso!");
        } else {
          setNotifBloqueada(true);
        }
      }
    } catch { setNotifBloqueada(true); }
  };
  const [enviandoVoluntario, setEnviandoVoluntario] = useState(false);
  const [maisScrollTarget, setMaisScrollTarget] = useState(null);

  // Reseta a aba do Painel do Líder para uma válida quando muda de ministério
  useEffect(() => {
    if (tab === "admin" && isLider && !isAdmin) {
      const validas = ministerioLider === "Aliança Music"
        ? ["membros-min", "avisos-min", "eventos-min", "musica-min"]
        : ministerioLider === "Mídia"
        ? ["membros-min", "avisos-min", "eventos-min", "arquivos-min"]
        : ["membros-min", "avisos-min", "eventos-min"];
      if (!validas.includes(adminTab)) setAdminTab("membros-min");
    }
  }, [tab, isLider, isAdmin, ministerioLider, adminTab]);

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

  // ── ONESIGNAL INIT ──
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.defer = true;
    script.onload = () => {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function(OneSignal) {
        await OneSignal.init({ appId: ONESIGNAL_APP_ID });
      });
    };
    document.head.appendChild(script);
  }, []);

  // Splash + Firebase load
  useEffect(() => {
    setTimeout(() => {
      const u = store.get(SK.user, null);
      if (u) {
        setUser(u);
        setIsAdmin(u.admin || false);
        // Restaurar estado de líder
        const minsIniciais = u.ministeriosLider?.length > 0 ? u.ministeriosLider : (u.ministerioLider ? [u.ministerioLider] : []);
        if (u.lider && minsIniciais.length > 0) {
          setIsLider(true);
          setMeusMinisteriosLider(minsIniciais);
          setMinisterioLider(minsIniciais[0]);
        }
        // Buscar dados frescos do Firestore para garantir lider/ministerio atualizado
        if (u.email) {
          getDoc(doc(db, "membros", u.email)).then(snap => {
            if (snap.exists()) {
              const dadosFrescos = { id: u.email, ...snap.data() };
              store.set(SK.user, dadosFrescos);
              setUser(dadosFrescos);
              const minsFrescos = dadosFrescos.ministeriosLider?.length > 0 ? dadosFrescos.ministeriosLider : (dadosFrescos.ministerioLider ? [dadosFrescos.ministerioLider] : []);
              if (dadosFrescos.lider && minsFrescos.length > 0) {
                setIsLider(true);
                setMeusMinisteriosLider(minsFrescos);
                setMinisterioLider(prev => minsFrescos.includes(prev) ? prev : minsFrescos[0]);
              } else {
                setIsLider(false);
                setMeusMinisteriosLider([]);
                setMinisterioLider(null);
              }
              // Registrar último acesso
              updateDoc(doc(db, "membros", u.email), { ultimoAcesso: new Date().toISOString() }).catch(() => {});
            }
          }).catch(() => {});
        }
        setScreen("app");
        setTab(u.admin ? "home" : u.lider ? "admin" : u.usuarioPadrao_Mídia ? "midia-videos" : (u.ministerios?.length > 0 ? "meumin" : "home"));
      } // eslint-disable-line no-unused-vars
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

    // Banner Home — tempo real
    const unsubBanner = onSnapshot(doc(db, "config", "bannerHome"), (snap) => {
      if (snap.exists()) setBannerHome(snap.data());
      else setBannerHome(null);
    });

    // Lançamentos financeiros
    const unsubLancamentos = onSnapshot(collection(db, "lancamentos"), (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      lista.sort((a, b) => b.data.localeCompare(a.data));
      setLancamentos(lista);
    });

    // Dizimistas
    const unsubDizimistas = onSnapshot(collection(db, "dizimistas"), (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      lista.sort((a, b) => b.data.localeCompare(a.data));
      setDizimistas(lista);
    });

    // NOVO: Entradas (redesenho do financeiro)
    const unsubEntradas = onSnapshot(collection(db, "entradas"), (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      lista.sort((a, b) => b.data.localeCompare(a.data));
      setEntradas(lista);
    });

    // NOVO: Saídas (redesenho do financeiro)
    const unsubSaidas = onSnapshot(collection(db, "saidas"), (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      lista.sort((a, b) => (a.dataVencimento || "").localeCompare(b.dataVencimento || ""));
      setSaidas(lista);
    });

    // Módulo Música
    const unsubEscalas = onSnapshot(collection(db, "escalas"), snap => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      lista.sort((a, b) => b.data?.localeCompare(a.data));
      setEscalas(lista);
    });
    const unsubMusicas = onSnapshot(collection(db, "musicas"), snap => {
      setMusicas(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.titulo?.localeCompare(b.titulo)));
    });
    const unsubCifras = onSnapshot(collection(db, "cifras"), snap => {
      setCifras(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.titulo?.localeCompare(b.titulo)));
    });
    const unsubVs = onSnapshot(collection(db, "vs"), snap => {
      setVsItems(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.titulo?.localeCompare(b.titulo)));
    });

    // Categorias dinâmicas de equipe (ex: Mídia)
    const unsubCategoriasEquipe = onSnapshot(collection(db, "categoriasEquipe"), snap => {
      setCategoriasEquipe(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    // Modelos de evento (título + horário padrão)
    const unsubModelosEvento = onSnapshot(collection(db, "modelosEvento"), snap => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      lista.sort((a, b) => (a.titulo || "").localeCompare(b.titulo || ""));
      setModelosEvento(lista);
    });
    // Locais padrão de evento
    const unsubLocaisEvento = onSnapshot(collection(db, "locaisEvento"), snap => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      lista.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
      setLocaisEvento(lista);
    });
    // Arquivos de Mídia (imagens para telão, etc.)
    const unsubArquivosMidia = onSnapshot(collection(db, "arquivosMidia"), snap => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      lista.sort((a, b) => (b.criadoEm || "").localeCompare(a.criadoEm || ""));
      setArquivosMidia(lista);
    });
    // Pregações (inseridas pelo Pastor)
    const unsubPregacoes = onSnapshot(collection(db, "pregacoes"), snap => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      lista.sort((a, b) => (b.data || "").localeCompare(a.data || ""));
      setPregacoes(lista);
    });

    const unsubBannerJejum = onSnapshot(doc(db, "config", "bannerJejum"), (snap) => {
      if (snap.exists()) setBannerJejum(snap.data());
    });

    // Estudos — tempo real
    const unsubEstudos = onSnapshot(collection(db, "estudos"), (snap) => {
      setEstudos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Concluídos do usuário
    const userEmail = store.get(SK.user, null)?.email;
    if (userEmail) {
      getDoc(doc(db, "concluidos", userEmail)).then(snap => {
        if (snap.exists()) setConcluidos(snap.data());
      });
    }

    return () => {
      unsubAgenda(); unsubPalavra(); unsubOracoes(); unsubHistorico();
      unsubMembros(); unsubAvisos(); unsubBanner(); unsubBannerJejum(); unsubEstudos(); unsubLancamentos(); unsubDizimistas(); unsubEscalas(); unsubMusicas(); unsubCifras(); unsubVs(); unsubVideo(); unsubDevocional(); unsubAoVivo(); unsubCategoriasEquipe(); unsubArquivosMidia(); unsubPregacoes(); unsubModelosEvento(); unsubLocaisEvento(); unsubEntradas(); unsubSaidas();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const getSpotifyId = (url) => {
    if (!url) return null;
    const m = url.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
    return m ? { type: m[1], id: m[2] } : null;
  };

  const formatarUltimoAcesso = (iso) => {
    if (!iso) return "Nunca acessou";
    const data = new Date(iso);
    const agora = new Date();
    const diffMs = agora - data;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMin / 60);
    const diffDias = Math.floor(diffHoras / 24);
    if (diffMin < 1) return "Agora mesmo";
    if (diffMin < 60) return `há ${diffMin} min`;
    if (diffHoras < 24) return `há ${diffHoras}h`;
    if (diffDias === 1) return "Ontem";
    if (diffDias < 30) return `há ${diffDias} dias`;
    if (diffDias < 365) return `há ${Math.floor(diffDias / 30)} mês(es)`;
    return data.toLocaleDateString("pt-BR");
  };

  // Gera e baixa a pregação como arquivo de texto (.txt), pronta pra organizar em pasta
  const baixarPregacaoTxt = (p) => {
    const linhas = [
      p.titulo || "Pregação",
      "",
      p.versiculos || "",
    ];
    const conteudo = linhas.join("\n");
    const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const nomeArq = (p.titulo || "pregacao").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 60);
    a.download = `${nomeArq || "pregacao"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const baixarArquivo = (url, nomeArquivo) => {
    if (!url) return;
    // Link direto e síncrono com fl_attachment (Cloudinary) — funciona de forma confiável
    // tanto no computador quanto no celular (o fetch+blob assíncrono usado antes falhava
    // silenciosamente em navegadores mobile, especialmente Safari/iOS)
    const urlDownload = url.includes("/upload/") && !url.includes("fl_attachment")
      ? url.replace("/upload/", "/upload/fl_attachment/")
      : url;
    const a = document.createElement("a");
    a.href = urlDownload;
    a.download = nomeArquivo || "arquivo";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ── AUTH ──
  const handleLogin = async () => {
    if (loginForm.modo === "cadastro") {
      if (!loginForm.nome || !loginForm.email || !loginForm.senha || !loginForm.celular || !loginForm.sexo || !loginForm.estadoCivil || !loginForm.dataNascimento) {
        setLoginErro("Preencha todos os campos obrigatórios."); return;
      }
      const snap = await getDoc(doc(db, "membros", loginForm.email));
      if (snap.exists()) { setLoginErro("E-mail já cadastrado."); return; }
      const senhaSalt = gerarSalt();
      const senhaHash = await hashSenha(loginForm.senha, senhaSalt);
      const u = {
        nome: loginForm.nome,
        email: loginForm.email,
        senhaHash,
        senhaSalt,
        celular: loginForm.celular || "",
        sexo: loginForm.sexo || "",
        estadoCivil: loginForm.estadoCivil || "",
        dataNascimento: loginForm.dataNascimento || "",
        batizado: loginForm.batizado || "nao",
        igrejaBAT: loginForm.batizado === "sim" ? (loginForm.igrejaBAT || "") : "",
        dataBAT: loginForm.batizado === "sim" ? (loginForm.dataBAT || "") : "",
        admin: false,
        dataCadastro: new Date().toISOString(),
        ultimoAcesso: new Date().toISOString(),
      };
      await setDoc(doc(db, "membros", loginForm.email), u);
      try {
        const cred = await createUserWithEmailAndPassword(auth, paraContaAuth(loginForm.email), loginForm.senha);
        await setDoc(doc(db, "authIndex", cred.user.uid), { membroId: loginForm.email });
      } catch (errAuth) {
        console.warn("Cadastro salvo, mas o Firebase Authentication não sincronizou:", errAuth);
      }
      store.set(SK.user, { ...u, id: loginForm.email });
      setUser({ ...u, id: loginForm.email }); setScreen("app"); setTab("home");
    } else {
      // Apelido de conveniência: digitar "ALIANCA" continua funcionando, mas aponta pra conta real do Pastor.
      // A senha continua sendo checada normalmente contra o hash — isso não é mais um atalho sem verificação.
      const emailLogin = loginForm.email.trim().toUpperCase() === "ALIANCA" ? "prfernandomellofilho@gmail.com" : loginForm.email;
      const snap = await getDoc(doc(db, "membros", emailLogin));
      let dados;
      if (!snap.exists()) {
        // Bootstrap único da conta mestra do Pastor — só roda essa vez, na primeira vez que o documento não existir.
        // Depois desse primeiro login, a conta passa a funcionar 100% igual a qualquer outra (com hash normal).
        if (emailLogin === "prfernandomellofilho@gmail.com" && loginForm.senha === "mello2026") {
          const saltInicial = gerarSalt();
          const hashInicial = await hashSenha(loginForm.senha, saltInicial);
          dados = { nome: "Pr Fernando Mello", email: "prfernandomellofilho@gmail.com", senhaHash: hashInicial, senhaSalt: saltInicial, admin: true, dataCadastro: new Date().toISOString() };
          await setDoc(doc(db, "membros", "prfernandomellofilho@gmail.com"), dados);
        } else {
          setLoginErro("E-mail ou senha incorretos."); return;
        }
      } else {
        dados = snap.data();
      }
      let senhaOk = false;
      if (dados.senhaHash && dados.senhaSalt) {
        // Conta já migrada — compara o hash
        const hashDigitado = await hashSenha(loginForm.senha, dados.senhaSalt);
        senhaOk = hashDigitado === dados.senhaHash;
      } else if (dados.senha !== undefined) {
        // Conta antiga (senha em texto puro) — valida e migra para hash automaticamente
        senhaOk = dados.senha === loginForm.senha;
        if (senhaOk) {
          const novoSalt = gerarSalt();
          const novoHash = await hashSenha(loginForm.senha, novoSalt);
          await updateDoc(doc(db, "membros", emailLogin), { senhaHash: novoHash, senhaSalt: novoSalt, senha: deleteField() });
          delete dados.senha;
          dados.senhaHash = novoHash;
          dados.senhaSalt = novoSalt;
        }
      }
      if (!senhaOk) { setLoginErro("E-mail ou senha incorretos."); return; }

      // Sincroniza com o Firebase Authentication por baixo dos panos (não bloqueia o login se falhar)
      try {
        const authEmail = paraContaAuth(emailLogin);
        let cred;
        try {
          cred = await signInWithEmailAndPassword(auth, authEmail, loginForm.senha);
        } catch (errSignIn) {
          if (errSignIn.code === "auth/user-not-found" || errSignIn.code === "auth/invalid-credential") {
            cred = await createUserWithEmailAndPassword(auth, authEmail, loginForm.senha);
          } else {
            throw errSignIn;
          }
        }
        await setDoc(doc(db, "authIndex", cred.user.uid), { membroId: emailLogin });
      } catch (errAuth) {
        console.warn("Login no Firebase Authentication não sincronizou (o acesso ao app continua normal):", errAuth);
      }

      const u = { id: emailLogin, ...dados };
      store.set(SK.user, u); setUser(u); setIsAdmin(u.admin || false);
      // Registrar último acesso
      const agoraAcesso = new Date().toISOString();
      updateDoc(doc(db, "membros", emailLogin), { ultimoAcesso: agoraAcesso }).catch(() => {});
      // Detectar líder
      const minsLogin = u.ministeriosLider?.length > 0 ? u.ministeriosLider : (u.ministerioLider ? [u.ministerioLider] : []);
      if (u.lider && minsLogin.length > 0) {
        setIsLider(true);
        setMeusMinisteriosLider(minsLogin);
        setMinisterioLider(minsLogin[0]);
      } else {
        setIsLider(false);
        setMeusMinisteriosLider([]);
        setMinisterioLider(null);
      }
      setScreen("app");
      setTab(u.admin ? "home" : u.lider ? "admin" : u.usuarioPadrao_Mídia ? "midia-videos" : (u.ministerios?.length > 0 ? "meumin" : "home"));
      // Inicializar última visita se for primeira vez
      if (!localStorage.getItem("fa_ultima_visita")) {
        const agora = new Date().toISOString();
        const inicial = { home: agora, biblia: agora, devocional: agora, mais: agora, oracao: agora };
        localStorage.setItem("fa_ultima_visita", JSON.stringify(inicial));
        setUltimaVisita(inicial);
      }
      // Verificar se cadastro está incompleto
      const cadastroCompleto = u.celular && u.sexo && u.estadoCivil && u.dataNascimento;
      if (!cadastroCompleto) {
        setCompletarForm({ celular: u.celular || "", sexo: u.sexo || "", estadoCivil: u.estadoCivil || "", dataNascimento: u.dataNascimento || "", batizado: u.batizado || "", igrejaBAT: u.igrejaBAT || "", dataBAT: u.dataBAT || "" });
        setShowCompletarCadastro(true);
      }
    }
  };

  // Verifica a senha do admin atualmente logado (proteção extra antes de conceder/revogar acesso admin)
  const senhaAdminAtualCorreta = async (senhaDigitada) => {
    if (!senhaDigitada) return false;
    if (user?.senhaHash && user?.senhaSalt) {
      const hash = await hashSenha(senhaDigitada, user.senhaSalt);
      return hash === user.senhaHash;
    }
    return senhaDigitada === user?.senha; // conta ainda não migrada (legado)
  };

  const salvarCadastroCompleto = async () => {
    // Usa o valor editado agora, ou cai pro valor que a pessoa já tinha salvo antes (campo não tocado nesta edição)
    const nome = completarForm.nome ?? user?.nome;
    const celular = completarForm.celular ?? user?.celular;
    const sexo = completarForm.sexo ?? user?.sexo;
    const estadoCivil = completarForm.estadoCivil ?? user?.estadoCivil;
    const dataNascimento = completarForm.dataNascimento ?? user?.dataNascimento;
    const batizado = completarForm.batizado ?? user?.batizado ?? "nao";
    const igrejaBAT = completarForm.igrejaBAT ?? user?.igrejaBAT;
    const dataBAT = completarForm.dataBAT ?? user?.dataBAT;

    if (!nome || !celular || !sexo || !estadoCivil || !dataNascimento) {
      showToast("⚠️ Preencha os campos obrigatórios!"); return;
    }
    const dadosAtualizados = {
      nome: nome || "",
      celular: celular || "",
      sexo: sexo || "",
      estadoCivil: estadoCivil || "",
      dataNascimento: dataNascimento || "",
      batizado: batizado || "nao",
      igrejaBAT: batizado === "sim" ? (igrejaBAT || "") : "",
      dataBAT: batizado === "sim" ? (dataBAT || "") : "",
    };
    await updateDoc(doc(db, "membros", user.email), dadosAtualizados);
    const u = { ...user, ...dadosAtualizados };
    store.set(SK.user, u); setUser(u);
    setCompletarForm({});
    setShowCompletarCadastro(false);
    showToast("✅ Cadastro atualizado! Obrigado!");
  };

  const handleRecuperarSenha = async () => {
    if (!recuperandoEmail.trim()) { setRecuperandoMsg("⚠️ Digite seu e-mail cadastrado."); return; }
    const emailBusca = recuperandoEmail.trim().toLowerCase();
    const snap = await getDoc(doc(db, "membros", emailBusca));
    if (!snap.exists()) { setRecuperandoMsg("⚠️ E-mail não encontrado. Verifique e tente novamente."); return; }
    const dados = snap.data();
    // Gera uma senha temporária nova — não guardamos mais a senha original em texto puro pra poder reenviá-la
    const senhaTemporaria = gerarSenhaTemporaria();
    try {
      await emailjs.send(
        "service_sffzlx2",
        "template_o6kyn56",
        {
          to_name: dados.nome,
          to_email: emailBusca,
          senha_atual: senhaTemporaria,
          app_url: window.location.origin,
        },
        "KkcyGeZOZYPkwGing"
      );
      // Só troca a senha de verdade depois de confirmar que o e-mail foi enviado (evita trancar o acesso à toa)
      const salt = gerarSalt();
      const hash = await hashSenha(senhaTemporaria, salt);
      await updateDoc(doc(db, "membros", emailBusca), { senhaHash: hash, senhaSalt: salt, senha: deleteField() });
      setRecuperandoMsg("✅ Enviamos uma senha temporária para o seu e-mail. Faça login com ela e recomendamos trocá-la depois.");
    } catch {
      setRecuperandoMsg("❌ Erro ao enviar e-mail. Tente novamente.");
    }
  };

  const marcarVisto = (abaId) => {
    const nova = { ...ultimaVisita, [abaId]: new Date().toISOString() };
    setUltimaVisita(nova);
    try { localStorage.setItem("fa_ultima_visita", JSON.stringify(nova)); } catch {}
  };

  // Verifica se há conteúdo novo desde última visita — funciona em tempo real
  const temNovo = (abaId) => {
    if (tab === abaId) return false; // já está na aba, não mostra
    const ultima = ultimaVisita[abaId];
    if (!ultima) return false;
    const dt = new Date(ultima);
    switch (abaId) {
      case "home":
        return avisos.some(a => a.data && new Date(a.data) > dt) ||
               (bannerHome?.atualizado && new Date(bannerHome.atualizado) > dt);
      case "biblia":
        return estudos.some(e => e.criadoEm && new Date(e.criadoEm) > dt);
      case "devocional":
        return devocional?.criadoEm && new Date(devocional.criadoEm) > dt;
      case "mais":
        return avisos.some(a => a.data && new Date(a.data) > dt);
      default:
        return false;
    }
  };

  const handleLogout = () => { store.set(SK.user, null); setUser(null); setIsAdmin(false); setIsLider(false); setMinisterioLider(null); setMeusMinisteriosLider([]); setScreen("login"); setTab("home"); setLoginForm({ nome: "", email: "", senha: "", modo: "login" }); };

  // ── AGENDA ──
  const salvarEvento = async () => {
    if (!novoEvento.titulo || !novoEvento.data || !novoEvento.hora) return;
    if (editandoEvento) {
      await updateDoc(doc(db, "agenda", editandoEvento), novoEvento);
      setEditandoEvento(null);
    } else {
      // Todo evento novo já nasce vinculado a Aliança Music e Mídia (praticamente todo culto tem os dois)
      await addDoc(collection(db, "agenda"), {
        ...novoEvento,
        ministeriosVinculados: Array.from(new Set([...(novoEvento.ministeriosVinculados || []), "Aliança Music", "Mídia"])),
      });
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
    bg: darkMode ? "#050d1f" : "#f0f0f5",
    bg2: darkMode ? "#07112a" : "#ffffff",
    card: darkMode ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.07)",
    cardBorder: darkMode ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.18)",
    text: darkMode ? "#ffffff" : "#0a0a1a",
    textSub: darkMode ? "rgba(255,255,255,.72)" : "rgba(0,0,0,.65)",
    textFaint: darkMode ? "rgba(255,255,255,.42)" : "rgba(0,0,0,.4)",
    nav: darkMode ? "#040c1c" : "#ffffff",
    navBorder: darkMode ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.15)",
    header: darkMode ? "#040c1c" : "#ffffff",
    input: darkMode ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.07)",
    inputBorder: darkMode ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.2)",
    gold: darkMode ? "#c9a84c" : "#9a7020",
  };
  const S = {
    app: { minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'Georgia', 'Times New Roman', serif", position: "relative", overflowX: "hidden" },
    bg: { position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: darkMode ? "linear-gradient(160deg, #0a1a3a 0%, #050d1f 40%, #03091a 70%, #060f28 100%)" : "none" },
    wrap: { position: "relative", zIndex: 1, maxWidth: 430, margin: "0 auto", paddingLeft: "env(safe-area-inset-left, 0px)", paddingRight: "env(safe-area-inset-right, 0px)", paddingBottom: "calc(90px + env(safe-area-inset-bottom, 0px))" },
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
    header: { padding: "calc(28px + env(safe-area-inset-top, 0px)) 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "transparent", borderBottom: "none" },
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
    nav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: T.nav, borderTop: `1px solid ${T.navBorder}`, display: "flex", backdropFilter: "blur(20px)", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom, 0px)", paddingLeft: "env(safe-area-inset-left, 0px)", paddingRight: "env(safe-area-inset-right, 0px)" },
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
    <div style={S.splash} className="tela-cheia">
      <style>{`html,body{height:100%;margin:0;} .tela-cheia{min-height:100vh;min-height:100dvh;} @keyframes fadeIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}} @keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}`}</style>
      <img src="/logo-igreja.png" alt="Família Aliança" style={{ width: 180, animation: "fadeIn 1s ease", borderRadius: 16, background: darkMode ? "transparent" : "#080810", padding: darkMode ? 0 : 12 }} />
      <div style={{ textAlign: "center", animation: "fadeIn 1.4s ease" }}>
        <div style={{ fontSize: 12, color: T.textFaint, animation: "pulse 1.5s ease infinite", marginTop: 8, letterSpacing: 3 }}>Igreja do Nazareno</div>
      </div>
      <div style={{ position: "absolute", bottom: 32, fontSize: 11, color: "rgba(255,255,255,.15)", letterSpacing: 2 }}>v1.0</div>
    </div>
  );

  // ── LOGIN ──
  if (screen === "login") return (
    <div style={S.loginWrap} className="tela-cheia">
      <style>{`html,body{height:100%;margin:0;} .tela-cheia{min-height:100vh;min-height:100dvh;}`}</style>
      <img src="/logo-igreja.png" alt="Família Aliança" style={{ width: 160, marginBottom: 28, borderRadius: 16, background: darkMode ? "transparent" : "#080810", padding: darkMode ? 0 : 12 }} />
      <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 32, textAlign: "center", color: T.text, letterSpacing: 1 }}>
        {recuperando ? "Recuperar Senha" : loginForm.modo === "login" ? "Entrar na sua conta" : "Criar sua conta"}
      </div>

      <div style={{ width: "100%", maxWidth: 360 }}>

        {/* ── TELA RECUPERAR SENHA ── */}
        {recuperando ? (
          <>
            <div style={{ fontSize: 13, color: T.textSub, marginBottom: 20, textAlign: "center", lineHeight: 1.6 }}>
              Digite o e-mail cadastrado e enviaremos suas informações de acesso.
            </div>
            {recuperandoMsg && (
              <div style={{ padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: 13, textAlign: "center", lineHeight: 1.5,
                background: recuperandoMsg.startsWith("✅") ? "rgba(34,197,94,.1)" : recuperandoMsg.startsWith("❌") ? "rgba(239,68,68,.1)" : "rgba(201,168,76,.1)",
                border: `1px solid ${recuperandoMsg.startsWith("✅") ? "rgba(34,197,94,.3)" : recuperandoMsg.startsWith("❌") ? "rgba(239,68,68,.3)" : "rgba(201,168,76,.3)"}`,
                color: recuperandoMsg.startsWith("✅") ? "#22c55e" : recuperandoMsg.startsWith("❌") ? "#ef4444" : "#c9a84c"
              }}>{recuperandoMsg}</div>
            )}
            <input style={S.input} placeholder="Seu e-mail cadastrado" type="email"
              value={recuperandoEmail}
              onChange={e => { setRecuperandoEmail(e.target.value); setRecuperandoMsg(""); }}
              onKeyDown={e => e.key === "Enter" && handleRecuperarSenha()} />
            <button style={S.loginBtn} onClick={handleRecuperarSenha}>Enviar e-mail de recuperação</button>
            <div style={{ textAlign: "center" }}>
              <button style={S.switchBtn} onClick={() => { setRecuperando(false); setRecuperandoEmail(""); setRecuperandoMsg(""); }}>
                ← Voltar para o login
              </button>
            </div>
          </>
        ) : (
          /* ── TELA LOGIN / CADASTRO ── */
          <>
            {loginErro && <div style={S.errMsg}>{loginErro}</div>}
            {loginForm.modo === "cadastro" && (
              <>
                <input style={S.input} placeholder="Seu nome completo *" value={loginForm.nome || ""}
                  onChange={e => { setLoginForm({ ...loginForm, nome: e.target.value }); setLoginErro(""); }} />
                <input style={S.input} placeholder="Celular (WhatsApp) *" type="tel" value={loginForm.celular || ""}
                  onChange={e => { setLoginForm({ ...loginForm, celular: e.target.value }); setLoginErro(""); }} />
                <select style={{ ...S.input, color: loginForm.sexo ? "inherit" : "#888" }}
                  value={loginForm.sexo || ""}
                  onChange={e => { setLoginForm({ ...loginForm, sexo: e.target.value }); setLoginErro(""); }}>
                  <option value="">Sexo *</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                </select>
                <select style={{ ...S.input, color: loginForm.estadoCivil ? "inherit" : "#888" }}
                  value={loginForm.estadoCivil || ""}
                  onChange={e => { setLoginForm({ ...loginForm, estadoCivil: e.target.value }); setLoginErro(""); }}>
                  <option value="">Estado Civil *</option>
                  <option value="Solteiro(a)">Solteiro(a)</option>
                  <option value="Casado(a)">Casado(a)</option>
                  <option value="Divorciado(a)">Divorciado(a)</option>
                  <option value="Viúvo(a)">Viúvo(a)</option>
                  <option value="União Estável">União Estável</option>
                </select>
                <div style={{ fontSize: 11, color: "#c9a84c", marginBottom: 4, marginTop: 4 }}>Data de Nascimento *</div>
                <input style={S.input} type="text" inputMode="numeric" placeholder="DD/MM/AAAA *" maxLength={10} value={loginForm.dataNascimento || ""}
                  onChange={e => { let v=e.target.value.replace(/\D/g,""); if(v.length>=2)v=v.slice(0,2)+"/"+v.slice(2); if(v.length>=5)v=v.slice(0,5)+"/"+v.slice(5); setLoginForm({ ...loginForm, dataNascimento: v }); setLoginErro(""); }} />
                <div style={{ fontSize: 13, color: "#c9a84c", marginBottom: 8, marginTop: 4, fontWeight: "bold" }}>É Batizado(a)?</div>
                <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                  <button onClick={() => setLoginForm({ ...loginForm, batizado: "sim" })}
                    style={{ flex: 1, padding: "10px", borderRadius: 10, border: `2px solid ${loginForm.batizado === "sim" ? "#c9a84c" : "rgba(255,255,255,.2)"}`, background: loginForm.batizado === "sim" ? "rgba(201,168,76,.15)" : "transparent", color: loginForm.batizado === "sim" ? "#c9a84c" : "#aaa", fontWeight: "bold", cursor: "pointer" }}>
                    ✅ Sim
                  </button>
                  <button onClick={() => setLoginForm({ ...loginForm, batizado: "nao", igrejaBAT: "", dataBAT: "" })}
                    style={{ flex: 1, padding: "10px", borderRadius: 10, border: `2px solid ${loginForm.batizado === "nao" ? "#c9a84c" : "rgba(255,255,255,.2)"}`, background: loginForm.batizado === "nao" ? "rgba(201,168,76,.15)" : "transparent", color: loginForm.batizado === "nao" ? "#c9a84c" : "#aaa", fontWeight: "bold", cursor: "pointer" }}>
                    ❌ Não
                  </button>
                </div>
                {loginForm.batizado === "sim" && (
                  <>
                    <input style={S.input} placeholder="Em qual Igreja foi batizado(a)?" value={loginForm.igrejaBAT || ""}
                      onChange={e => setLoginForm({ ...loginForm, igrejaBAT: e.target.value })} />
                    <div style={{ fontSize: 11, color: "#c9a84c", marginBottom: 4 }}>Data do Batismo</div>
                    <input style={S.input} type="text" inputMode="numeric" placeholder="DD/MM/AAAA" maxLength={10} value={loginForm.dataBAT || ""}
                      onChange={e => { let v=e.target.value.replace(/\D/g,""); if(v.length>=2)v=v.slice(0,2)+"/"+v.slice(2); if(v.length>=5)v=v.slice(0,5)+"/"+v.slice(5); setLoginForm({ ...loginForm, dataBAT: v }); }} />
                  </>
                )}
              </>
            )}
            <input style={S.input} placeholder="E-mail" type="email" value={loginForm.email}
              onChange={e => { setLoginForm({ ...loginForm, email: e.target.value }); setLoginErro(""); }} />
            <input style={S.input} placeholder="Senha" type="password" value={loginForm.senha}
              onChange={e => { setLoginForm({ ...loginForm, senha: e.target.value }); setLoginErro(""); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()} />
            <button style={S.loginBtn} onClick={handleLogin}>
              {loginForm.modo === "login" ? "Entrar" : "Criar conta"}
            </button>
            {/* Esqueci a senha — só no modo login */}
            {loginForm.modo === "login" && (
              <div style={{ textAlign: "center", marginBottom: 8 }}>
                <button style={{ ...S.switchBtn, color: "#c9a84c" }} onClick={() => { setRecuperando(true); setRecuperandoEmail(loginForm.email); setRecuperandoMsg(""); }}>
                  Esqueci minha senha
                </button>
              </div>
            )}
            <div style={{ textAlign: "center" }}>
              <button style={S.switchBtn} onClick={() => { setLoginForm({ ...loginForm, modo: loginForm.modo === "login" ? "cadastro" : "login" }); setLoginErro(""); }}>
                {loginForm.modo === "login" ? "Não tenho conta — Cadastrar" : "Já tenho conta — Entrar"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ── NAVEGAÇÃO TABS ──
  // Verificar se membro está escalado em alguma escala futura
  const hoje2 = new Date().toISOString().split("T")[0];
  const membroEscalado = user && !isAdmin && !isLider && escalas.some(e =>
    e.data >= hoje2 && e.membrosEscalados?.[user.email]
  );

  // Usuário Padrão da Mídia (ex: conta fixa da categoria Letra) — vê aba exclusiva de vídeos das músicas
  const meuMembroLiveGlobal = membros.find(mm => mm.email === user?.email);
  const souUsuarioPadraoMidia = !!meuMembroLiveGlobal?.usuarioPadrao_Mídia;

  const TABS = [
    { id: "home", icon: "🏠", label: "Início" },
    { id: "biblia", icon: "📖", label: "Bíblia" },
    { id: "estudos", icon: "📚", label: "Estudos" },
    { id: "oracao", icon: "🙏", label: "Oração" },
    { id: "mais", icon: "⋯", label: "Mais" },
    ...((membroEscalado || user?.ministerios?.length > 0) ? [{ id: "meumin", icon: "⛪", label: "Meu Min." }] : []),
    ...(souUsuarioPadraoMidia ? [{ id: "midia-videos", icon: "🎬", label: "Mídia" }] : []),
    ...(isAdmin || isLider ? [{ id: "admin", icon: isAdmin ? "⚙️" : "🏛️", label: isAdmin ? "Admin" : "Líder" }] : []),
  ];

  const getMonAbbr = (dataStr) => { const meses = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"]; const [, m] = dataStr.split("-"); return meses[parseInt(m) - 1]; };
  const getDay = (dataStr) => dataStr.split("-")[2];

  // ── RENDER APP ──
  return (
    <div style={S.app} className="tela-cheia">
      {/* ── MODAL PDF/IMAGEM INLINE ── */}
      {pdfAberto && (
        <div style={{ position: "fixed", inset: 0, zIndex: 3000, background: "#000", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "#1a1a2e", borderBottom: "1px solid rgba(255,255,255,.1)", flexShrink: 0 }}>
            <button onClick={() => setPdfAberto(null)}
              style={{ background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 8, padding: "6px 14px", color: "#f87171", fontSize: 13, cursor: "pointer" }}>
              ✕ Fechar
            </button>
            <div style={{ fontSize: 13, color: "#fff", flex: 1 }}>📄 Cifra</div>
          </div>
          <div style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: 8 }}>
            {/* Cloudinary converte PDF para imagem automaticamente */}
            <img
              src={pdfAberto.includes("cloudinary.com")
                ? pdfAberto
                    .replace("/raw/upload/", "/image/upload/")
                    .replace(".pdf", ".jpg")
                : pdfAberto}
              alt="Cifra"
              style={{ width: "100%", maxWidth: 800, borderRadius: 8, display: "block" }}
              onError={e => {
                // Se falhar, tenta PNG
                if (!e.target.src.includes(".png")) {
                  e.target.src = e.target.src.replace(".jpg", ".png");
                }
              }}
            />
          </div>
        </div>
      )}

      <div style={S.bg} />

      {/* ── MODAL RELATÓRIO ── */}
      {relatorioVisivel && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,.85)", display: "flex", flexDirection: "column", padding: "20px 16px" }}>
          <div style={{ background: darkMode ? "#07112a" : "#fff", borderRadius: 18, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh", border: "1px solid rgba(201,168,76,.3)" }}>
            {/* Header */}
            <div style={{ background: "linear-gradient(90deg,#c9a84c,#e8c97a)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 13, fontWeight: "bold", color: "#080810" }}>{relatorioVisivel.titulo}</div>
              <button onClick={() => setRelatorioVisivel(null)}
                style={{ background: "rgba(0,0,0,.2)", border: "none", borderRadius: 20, width: 28, height: 28, fontSize: 14, cursor: "pointer", color: "#080810", fontWeight: "bold" }}>✕</button>
            </div>
            {/* Conteúdo */}
            <div style={{ overflowY: "auto", padding: "16px", flex: 1 }}>
              <pre style={{ fontSize: 11, color: T.text, lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "monospace", margin: 0 }}>
                {relatorioVisivel.conteudo}
              </pre>
            </div>
            {/* Footer */}
            <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.cardBorder}`, display: "flex", gap: 8 }}>
              <div style={{ fontSize: 11, color: T.textFaint, flex: 1, alignSelf: "center" }}>
                Gerado em {new Date().toLocaleDateString("pt-BR")}
              </div>
              <button onClick={() => setRelatorioVisivel(null)}
                style={{ padding: "8px 20px", background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 10, color: T.textSub, fontSize: 13, cursor: "pointer", fontFamily: "Georgia,serif" }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        * { box-sizing: border-box; }
        html { font-size: 18px; }
        html, body { height: 100%; margin: 0; }
        #root { min-height: 100vh; min-height: 100dvh; }
        .tela-cheia { min-height: 100vh; min-height: 100dvh; }
        input::placeholder,textarea::placeholder{color:${darkMode ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.35)"};}
        input,textarea,select{color:${T.text} !important; background:${T.input} !important;}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(201,168,76,.3);border-radius:2px}
        select option{background:${darkMode ? "#07112a" : "#ffffff"}; color:${T.text};}
        input[type="date"]::-webkit-calendar-picker-indicator, input[type="time"]::-webkit-calendar-picker-indicator, input[type="month"]::-webkit-calendar-picker-indicator { filter: ${darkMode ? "invert(1)" : "none"}; cursor: pointer; }
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeSlideIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulseDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}
        .acesso-rapido::-webkit-scrollbar{display:none}
        .acesso-rapido{scrollbar-width:none;-ms-overflow-style:none;}
      `}</style>

      {/* ── MODAL COMPLETAR CADASTRO ── */}
      {showCompletarCadastro && !completarPulado && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#0d1117", border: "1px solid rgba(201,168,76,.3)", borderRadius: 20, padding: 24, width: "100%", maxWidth: 420, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              <div style={{ fontSize: 18, fontWeight: "bold", color: "#c9a84c", marginBottom: 4 }}>Complete seu cadastro</div>
              <div style={{ fontSize: 13, color: "#aaa" }}>Precisamos de mais algumas informações para conhecer melhor você!</div>
            </div>
            <input style={S.input} placeholder="Celular (WhatsApp) *" type="tel" value={completarForm.celular || ""}
              onChange={e => setCompletarForm({ ...completarForm, celular: e.target.value })} />
            <select style={{ ...S.input, color: completarForm.sexo ? "inherit" : "#888" }}
              value={completarForm.sexo || ""} onChange={e => setCompletarForm({ ...completarForm, sexo: e.target.value })}>
              <option value="">Sexo *</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
            </select>
            <select style={{ ...S.input, color: completarForm.estadoCivil ? "inherit" : "#888" }}
              value={completarForm.estadoCivil || ""} onChange={e => setCompletarForm({ ...completarForm, estadoCivil: e.target.value })}>
              <option value="">Estado Civil *</option>
              <option value="Solteiro(a)">Solteiro(a)</option>
              <option value="Casado(a)">Casado(a)</option>
              <option value="Divorciado(a)">Divorciado(a)</option>
              <option value="Viúvo(a)">Viúvo(a)</option>
              <option value="União Estável">União Estável</option>
            </select>
            <div style={{ fontSize: 11, color: "#c9a84c", marginBottom: 4 }}>Data de Nascimento *</div>
            <input style={S.input} type="text" inputMode="numeric" placeholder="DD/MM/AAAA *" maxLength={10} value={completarForm.dataNascimento || ""}
              onChange={e => { let v=e.target.value.replace(/\D/g,""); if(v.length>=2)v=v.slice(0,2)+"/"+v.slice(2); if(v.length>=5)v=v.slice(0,5)+"/"+v.slice(5); setCompletarForm({ ...completarForm, dataNascimento: v }); }} />
            <div style={{ fontSize: 13, color: "#c9a84c", marginBottom: 8, fontWeight: "bold" }}>É Batizado(a)?</div>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <button onClick={() => setCompletarForm({ ...completarForm, batizado: "sim" })}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: `2px solid ${completarForm.batizado === "sim" ? "#c9a84c" : "rgba(255,255,255,.2)"}`, background: completarForm.batizado === "sim" ? "rgba(201,168,76,.15)" : "transparent", color: completarForm.batizado === "sim" ? "#c9a84c" : "#aaa", fontWeight: "bold", cursor: "pointer" }}>
                ✅ Sim
              </button>
              <button onClick={() => setCompletarForm({ ...completarForm, batizado: "nao", igrejaBAT: "", dataBAT: "" })}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: `2px solid ${completarForm.batizado === "nao" ? "#c9a84c" : "rgba(255,255,255,.2)"}`, background: completarForm.batizado === "nao" ? "rgba(201,168,76,.15)" : "transparent", color: completarForm.batizado === "nao" ? "#c9a84c" : "#aaa", fontWeight: "bold", cursor: "pointer" }}>
                ❌ Não
              </button>
            </div>
            {completarForm.batizado === "sim" && (
              <>
                <input style={S.input} placeholder="Em qual Igreja foi batizado(a)?" value={completarForm.igrejaBAT || ""}
                  onChange={e => setCompletarForm({ ...completarForm, igrejaBAT: e.target.value })} />
                <div style={{ fontSize: 11, color: "#c9a84c", marginBottom: 4 }}>Data do Batismo</div>
                <input style={S.input} type="text" inputMode="numeric" placeholder="DD/MM/AAAA" maxLength={10} value={completarForm.dataBAT || ""}
                  onChange={e => { let v=e.target.value.replace(/\D/g,""); if(v.length>=2)v=v.slice(0,2)+"/"+v.slice(2); if(v.length>=5)v=v.slice(0,5)+"/"+v.slice(5); setCompletarForm({ ...completarForm, dataBAT: v }); }} />
              </>
            )}
            <button style={S.saveBtn} onClick={salvarCadastroCompleto}>✅ Salvar e continuar</button>
            <button onClick={() => { setCompletarPulado(true); setShowCompletarCadastro(false); }}
              style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", background: "transparent", color: "#666", fontSize: 13, cursor: "pointer", marginTop: 8 }}>
              Pular por agora — completar depois no Meu Perfil
            </button>
          </div>
        </div>
      )}

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

            {/* ── CARD NOVO AVISO (avisos gerais do Admin) ── */}
            {(() => {
              const avisoGeral = avisos.find(a => !a.ministerio);
              if (!avisoGeral) return null;
              const tipoAviso = {
                info:    { cor: "#3b82f6", bg1: "#1e3a5f", bg2: "#0f2440", icon: "ℹ️" },
                urgente: { cor: "#ef4444", bg1: "#5f1e1e", bg2: "#3a0f0f", icon: "🚨" },
                evento:  { cor: "#c9a84c", bg1: "#5f4a1e", bg2: "#3a2c0f", icon: "📅" },
                oracao:  { cor: "#8b5cf6", bg1: "#3a1e5f", bg2: "#22103a", icon: "🙏" },
              }[avisoGeral.tipo] || { cor: "#3b82f6", bg1: "#1e3a5f", bg2: "#0f2440", icon: "ℹ️" };
              return (
                <div onClick={() => setAvisoCardExpandido(v => !v)}
                  style={{
                    margin: "16px 16px 4px", borderRadius: 20, overflow: "hidden", cursor: "pointer",
                    border: `1px solid ${tipoAviso.cor}55`,
                    background: darkMode ? `linear-gradient(135deg, ${tipoAviso.bg1} 0%, ${tipoAviso.bg2} 100%)` : `linear-gradient(135deg, ${tipoAviso.cor}18, ${tipoAviso.cor}08)`,
                    boxShadow: `0 4px 20px ${tipoAviso.cor}25`,
                    animation: "fadeSlideIn .5s ease",
                  }}>
                  <div style={{ background: `linear-gradient(90deg, ${tipoAviso.cor}, ${tipoAviso.cor}cc)`, padding: "6px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff", display: "inline-block", animation: "pulseDot 1.5s infinite" }} />
                    <span style={{ fontSize: 10, fontWeight: "bold", letterSpacing: 3, textTransform: "uppercase", color: "#fff" }}>Novo Aviso</span>
                  </div>
                  <div style={{ padding: "16px", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ fontSize: 32, flexShrink: 0 }}>{tipoAviso.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: "bold", color: darkMode ? "#fff" : "#1a0f00", marginBottom: 4, lineHeight: 1.3 }}>{avisoGeral.titulo}</div>
                      {!avisoCardExpandido && (
                        <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{avisoGeral.texto}</div>
                      )}
                    </div>
                    <div style={{ color: tipoAviso.cor, fontSize: 20, flexShrink: 0, transform: avisoCardExpandido ? "rotate(90deg)" : "none", transition: "transform .2s" }}>›</div>
                  </div>
                  {avisoCardExpandido && (
                    <div style={{ padding: "0 16px 18px 62px", animation: "fadeSlideIn .25s ease" }}>
                      <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{avisoGeral.texto}</div>
                      {avisoGeral.data && (
                        <div style={{ fontSize: 11, color: T.textFaint, marginTop: 10 }}>{new Date(avisoGeral.data).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── BANNER DE IMAGEM ── */}
            {bannerHome?.url && (
              <div style={{ margin: "12px 16px 0", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(201,168,76,.2)" }}>
                <img
                  src={bannerHome.url}
                  alt={bannerHome.titulo || "Banner"}
                  onClick={() => bannerHome.link && window.open(bannerHome.link, "_blank")}
                  style={{ width: "100%", display: "block", borderRadius: 16, cursor: bannerHome.link ? "pointer" : "default" }}
                />
              </div>
            )}

            {/* ── BANNER JEJUM ── */}
            {bannerJejum?.ativo && (
              <div
                onClick={() => bannerJejum.imagemUrl && window.open(bannerJejum.imagemUrl, "_blank")}
                style={{
                  margin: "12px 16px 0",
                  borderRadius: 16,
                  overflow: "hidden",
                  border: "1px solid rgba(99,102,241,.35)",
                  background: darkMode
                    ? "linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#1e1b4b 100%)"
                    : "linear-gradient(135deg,#eef2ff 0%,#e0e7ff 50%,#eef2ff 100%)",
                  cursor: bannerJejum.imagemUrl ? "pointer" : "default",
                  boxShadow: "0 2px 12px rgba(99,102,241,.18)",
                }}>
                <div style={{ background: "linear-gradient(90deg,#4f46e5,#7c3aed)", padding: "5px 16px", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13 }}>🙏</span>
                  <span style={{ fontSize: 10, fontWeight: "bold", letterSpacing: 3, textTransform: "uppercase", color: "#fff" }}>Jejum em Família</span>
                </div>
                <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 17, fontWeight: "bold", color: darkMode ? "#e0e7ff" : "#312e81", lineHeight: 1.3, marginBottom: 6 }}>
                      {bannerJejum.titulo || "Jejum em Família"}
                    </div>
                    {bannerJejum.subtitulo && (
                      <div style={{ fontSize: 13, color: darkMode ? "#a5b4fc" : "#4f46e5", marginBottom: 10 }}>
                        {bannerJejum.subtitulo}
                      </div>
                    )}
                    {bannerJejum.imagemUrl && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "linear-gradient(90deg,#4f46e5,#7c3aed)", borderRadius: 20, padding: "7px 14px" }}>
                        <span style={{ fontSize: 12, fontWeight: "bold", color: "#fff" }}>Clique aqui e acompanhe o dia</span>
                        <span style={{ fontSize: 12, color: "#fff" }}>→</span>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 38, flexShrink: 0 }}>✨</div>
                </div>
              </div>
            )}

            {/* ── CARD DEVOCIONAL DO DIA (com foto do pastor) ── */}
            {devocional ? (
              <div style={{ margin: "16px 16px 4px", borderRadius: 20, overflow: "hidden", position: "relative", background: darkMode ? "linear-gradient(135deg,#0a1a3a 0%,#050d1f 60%)" : "linear-gradient(135deg,#f5f0e8 0%,#ede4d0 60%)", border: `1px solid ${darkMode ? "rgba(201,168,76,.3)" : "rgba(154,112,32,.55)"}`, minHeight: 190 }}>
                {/* faixa dourada topo */}
                <div style={{ background: "linear-gradient(90deg,#c9a84c,#e8c97a)", padding: "6px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: "bold", letterSpacing: 3, textTransform: "uppercase", color: "#080810" }}>🕊️ Devocional do Dia</span>
                </div>
                {/* conteúdo */}
                <div style={{ display: "flex", alignItems: "stretch", minHeight: 160 }}>
                  {/* texto */}
                  <div style={{ flex: 1, padding: "14px 16px 16px" }}>
                    <div style={{ fontSize: 11, color: "#c9a84c", marginBottom: 4, letterSpacing: 1 }}>Pr. Fernando Mello</div>
                    <div style={{ fontSize: 18, fontWeight: "bold", lineHeight: 1.25, color: darkMode ? "#fff" : "#1a0f00", marginBottom: 8 }}>
                      {devocional.titulo}
                    </div>
                    {devocional.palavra && (
                      <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.5, marginBottom: 12, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {devocional.palavra.replace(/\*\*/g, "").split("\n").find(p => p.trim())}
                      </div>
                    )}
                    <button
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", background: "linear-gradient(90deg,#c9a84c,#e8c97a)", border: "none", borderRadius: 20, padding: "10px 16px", fontSize: 13, fontWeight: "bold", color: "#080810", cursor: "pointer", fontFamily: "Georgia,serif" }}
                      onClick={() => setTab("devocional")}>
                      Leia o Devocional completo →
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
                <div style={{ fontSize: 36, marginBottom: 12 }}>🕊️</div>
                <div style={{ fontSize: 14, color: T.textSub }}>Nenhum devocional publicado ainda.</div>
              </div>
            )}


            {/* ── BANNER NOTIFICAÇÕES ── */}
            {mostrarBannerNotif && screen === "app" && (
              <div style={{ margin: "12px 16px 0", borderRadius: 14, background: darkMode ? "rgba(59,130,246,.08)" : "rgba(59,130,246,.06)", border: "1px solid rgba(59,130,246,.25)", padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>🔔</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: "bold", color: "#60a5fa", marginBottom: 2 }}>Ative as notificações</div>
                  <div style={{ fontSize: 11, color: T.textSub }}>Receba avisos e novidades da igreja em tempo real.</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={ativarNotificacoes}
                    style={{ background: "#3b82f6", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: "bold", color: "#fff", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                    Ativar
                  </button>
                  <button onClick={() => setMostrarBannerNotif(false)}
                    style={{ background: "none", border: "none", color: T.textFaint, cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</button>
                </div>
              </div>
            )}

            {/* ── ACESSE AQUI ── */}
            <div style={{ padding: "20px 16px 0" }}>
              <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: T.textSub, marginBottom: 14 }}>Acesse Aqui</div>
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  {
                    label: "Agenda",
                    action: () => { setTab("mais"); setMaisScrollTarget("agenda"); },
                    svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="3"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  },
                  {
                    label: "Fale Conosco",
                    action: () => { setTab("mais"); setMaisScrollTarget("whatsapp"); },
                    svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="rgba(201,168,76,.1)"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="9" y1="14" x2="13" y2="14"/></svg>
                  },
                  {
                    label: "Localização",
                    action: () => { setTab("mais"); setMaisScrollTarget("localizacao"); },
                    svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" fill="rgba(201,168,76,.12)"/><circle cx="12" cy="10" r="2.5"/></svg>
                  },
                ].map(item => (
                  <button key={item.label} onClick={item.action}
                    style={{ flex: 1, background: darkMode ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.05)", border: `1px solid rgba(201,168,76,.18)`, borderRadius: 14, padding: "14px 10px 11px", display: "flex", flexDirection: "column", alignItems: "center", gap: 7, cursor: "pointer", fontFamily: "Georgia,serif" }}>
                    {item.svg}
                    <span style={{ fontSize: 10, color: T.textSub, textAlign: "center", lineHeight: 1.2 }}>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── HORÁRIO DOS CULTOS ── */}
            <div style={{ padding: "20px 16px 0" }}>
              <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: T.textSub }}>Horário dos Cultos</div>
            </div>
            <div style={{ ...S.card, margin: "12px 16px 0" }}>
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
                    <iframe title="Ao Vivo"
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                      src={`https://www.youtube.com/embed/${getYouTubeId(aoVivo.url)}?autoplay=1`}
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
                  <div style={{ fontSize: 12, color: T.textSub }}>Cultos: Ter 15h • Qui 20h • Dom 10h</div>
                </div>
              </div>
            )}

            {/* Último Vídeo do Culto */}
            {ultimoVideo && getYouTubeId(ultimoVideo.url) && (
              <>
                <div style={S.secTitle}>Último Culto</div>
                <div style={{ margin: "0 16px 12px" }}>
                  {ultimoVideo.titulo && (
                    <div style={{ fontSize: 14, fontWeight: "bold", color: T.text, marginBottom: 10 }}>{ultimoVideo.titulo}</div>
                  )}
                  <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid " + T.cardBorder }}>
                    <iframe title="Último Culto"
                      width="100%" height="200"
                      src={`https://www.youtube.com/embed/${getYouTubeId(ultimoVideo.url)}`}
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

            {/* Alternador Texto / Áudio */}
            <div style={{ display: "flex", gap: 8, margin: "0 16px 16px" }}>
              {[{ id: "texto", label: "📖 Texto" }, { id: "audio", label: "🎧 Áudio" }].map(m => (
                <button key={m.id} onClick={() => setBibliaModo(m.id)}
                  style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: `1px solid ${bibliaModo === m.id ? "#c9a84c" : T.cardBorder}`, background: bibliaModo === m.id ? "rgba(201,168,76,.15)" : T.card, color: bibliaModo === m.id ? "#c9a84c" : T.textSub, fontSize: 14, fontWeight: bibliaModo === m.id ? "bold" : "normal", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                  {m.label}
                </button>
              ))}
            </div>

            {bibliaModo === "texto" ? (
              <>
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
              </>
            ) : (
              <>
                <div style={{ margin: "0 16px 20px", background: "linear-gradient(135deg,rgba(139,92,246,.18),rgba(201,168,76,.10))", border: `1px solid ${darkMode ? "rgba(139,92,246,.3)" : "rgba(109,62,200,.4)"}`, borderRadius: 20, padding: "28px 22px", textAlign: "center" }}>
                  <div style={{ fontSize: 52, marginBottom: 16 }}>🎧</div>
                  <div style={{ fontSize: 18, fontWeight: "bold", color: T.text, marginBottom: 10 }}>Ouça a Bíblia Sagrada</div>
                  <div style={{ fontSize: 14, color: T.textSub, lineHeight: 1.7, marginBottom: 20 }}>
                    Prefere ouvir em vez de ler? A Bíblia em áudio narrada, também pelo YouVersion — ótimo pra trajeto, tarefas domésticas ou antes de dormir.
                  </div>
                  <button style={{ width: "100%", padding: "15px 0", background: "linear-gradient(90deg,#8b5cf6,#a78bfa)", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: "bold", cursor: "pointer", fontFamily: "Georgia,serif", marginBottom: 10 }}
                    onClick={() => window.open("https://www.bible.com/pt/audio-bible-app-versions/129-nvi-nova-vers%C3%A3o-internacional---portugu%C3%AAs", "_blank")}>
                    🎧 Ouvir Bíblia em Áudio (NVI)
                  </button>
                  <button style={{ width: "100%", padding: "13px 0", background: T.card, border: "1px solid " + T.cardBorder, borderRadius: 12, color: T.textSub, fontSize: 14, cursor: "pointer", fontFamily: "Georgia,serif", marginBottom: 10 }}
                    onClick={() => window.open("https://www.bible.com/pt/audio-bible-app-versions", "_blank")}>
                    🔊 Ver todas as versões em áudio
                  </button>
                  <button style={{ width: "100%", padding: "13px 0", background: T.card, border: "1px solid " + T.cardBorder, borderRadius: 12, color: T.textSub, fontSize: 14, cursor: "pointer", fontFamily: "Georgia,serif" }}
                    onClick={() => window.open("https://www.bible.com/app", "_blank")}>
                    📱 Baixar App YouVersion
                  </button>
                </div>
                <div style={{ margin: "0 16px 20px", background: "rgba(139,92,246,.06)", border: "1px solid rgba(139,92,246,.15)", borderRadius: 14, padding: "14px 16px" }}>
                  <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.7 }}>
                    💡 O botão acima já abre direto a narração em áudio da versão NVI. Toque em "Ver todas as versões em áudio" para escolher outras traduções, incluindo ARC e NVT.
                  </div>
                </div>
              </>
            )}

            {!dicionarioAberto && (
              <div style={{ margin: "14px 16px 4px", borderRadius: 18, overflow: "hidden", border: "1px solid rgba(201,168,76,.35)", background: darkMode ? "linear-gradient(135deg,#0a1a3a 0%,#050d1f 100%)" : "linear-gradient(135deg,#f5f0e8 0%,#ede4d0 100%)", position: "relative", cursor: "pointer" }}
                onClick={() => { setDicionarioAberto(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                <div style={{ background: "linear-gradient(90deg,#c9a84c,#e8c97a)", padding: "5px 16px" }}>
                  <span style={{ fontSize: 10, fontWeight: "bold", letterSpacing: 3, textTransform: "uppercase", color: "#080810" }}>📖 Ferramenta Bíblica</span>
                </div>
                <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(201,168,76,.12)", border: "1.5px solid rgba(201,168,76,.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 22 }}>📚</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: "bold", color: darkMode ? "#fff" : "#1a0f00", marginBottom: 4 }}>Dicionário Bíblico</div>
                    <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.5 }}>Explore o significado de termos e conceitos bíblicos fundamentais</div>
                  </div>
                  <div style={{ color: "#c9a84c", fontSize: 22, flexShrink: 0 }}>›</div>
                </div>
                <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: "100%", background: "radial-gradient(ellipse at right, rgba(201,168,76,.07) 0%, transparent 70%)", pointerEvents: "none" }} />
              </div>
            )}

            {/* ── TELA DO DICIONÁRIO ── */}
            {dicionarioAberto && (
              <div style={{ animation: "slideUp .3s ease" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px 0" }}>
                  <button onClick={() => { setDicionarioAberto(false); setDicionarioBusca(""); setDicionarioTermo(null); }}
                    style={{ background: "none", border: "none", color: T.gold, cursor: "pointer", fontSize: 14, fontFamily: "Georgia,serif" }}>← Voltar</button>
                  <div style={{ fontSize: 16, fontWeight: "bold", color: T.text }}>📚 Dicionário Bíblico</div>
                </div>

                {/* Busca */}
                <div style={{ padding: "12px 16px 0" }}>
                  <input style={{ ...S.input, marginBottom: 0 }} placeholder="🔍 Buscar termo..."
                    value={dicionarioBusca}
                    onChange={e => { setDicionarioBusca(e.target.value); setDicionarioTermo(null); }} />
                </div>

                {/* Tela de busca */}
                {dicionarioBusca.trim() ? (
                  <div style={{ padding: "12px 0" }}>
                    {DICIONARIO_BIBLICO.flatMap(g => g.termos)
                      .filter(t => t.termo.toLowerCase().includes(dicionarioBusca.toLowerCase()) || t.definicao.toLowerCase().includes(dicionarioBusca.toLowerCase()))
                      .map((t, i) => (
                        <div key={i} style={{ margin: "0 16px 10px", background: T.card, border: `1px solid ${T.cardBorder}`, borderLeft: "3px solid #c9a84c", borderRadius: 14, padding: "12px 14px", cursor: "pointer" }}
                          onClick={() => { setDicionarioTermo(t); setDicionarioBusca(""); }}>
                          <div style={{ fontSize: 14, fontWeight: "bold", color: T.gold, marginBottom: 4 }}>{t.termo}</div>
                          <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{t.definicao}</div>
                        </div>
                      ))}
                  </div>
                ) : dicionarioTermo ? (
                  /* Tela de detalhe do termo */
                  <div style={{ padding: "12px 16px" }}>
                    <button onClick={() => setDicionarioTermo(null)}
                      style={{ background: "none", border: "none", color: T.gold, cursor: "pointer", fontSize: 13, fontFamily: "Georgia,serif", marginBottom: 12 }}>← Voltar ao índice</button>
                    <div style={{ background: T.card, border: "1px solid rgba(201,168,76,.3)", borderRadius: 16, overflow: "hidden" }}>
                      <div style={{ background: "linear-gradient(90deg,#c9a84c,#e8c97a)", padding: "8px 16px" }}>
                        <span style={{ fontSize: 11, fontWeight: "bold", letterSpacing: 2, textTransform: "uppercase", color: "#080810" }}>Dicionário Bíblico</span>
                      </div>
                      <div style={{ padding: "18px 16px" }}>
                        <div style={{ fontSize: 22, fontWeight: "bold", color: T.gold, marginBottom: 14 }}>{dicionarioTermo.termo}</div>
                        <div style={{ fontSize: 14, color: T.textSub, lineHeight: 1.75 }}>{dicionarioTermo.definicao}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Índice por letras */
                  <>
                    {/* Seletor de letras */}
                    <div style={{ overflowX: "auto", padding: "12px 16px 4px", scrollbarWidth: "none" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {DICIONARIO_BIBLICO.map(g => (
                          <button key={g.letra} onClick={() => setDicionarioLetra(g.letra)}
                            style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${dicionarioLetra === g.letra ? "#c9a84c" : T.cardBorder}`, background: dicionarioLetra === g.letra ? "linear-gradient(90deg,#c9a84c,#e8c97a)" : T.card, color: dicionarioLetra === g.letra ? "#080810" : T.textSub, fontWeight: "bold", fontSize: 13, cursor: "pointer", flexShrink: 0, fontFamily: "Georgia,serif" }}>
                            {g.letra}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Lista de termos da letra selecionada */}
                    <div style={{ padding: "8px 0 16px" }}>
                      <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: T.gold, padding: "0 20px", marginBottom: 10 }}>
                        Letra {dicionarioLetra} — {DICIONARIO_BIBLICO.find(g => g.letra === dicionarioLetra)?.termos.length || 0} termos
                      </div>
                      {DICIONARIO_BIBLICO.find(g => g.letra === dicionarioLetra)?.termos.map((t, i) => (
                        <div key={i} style={{ margin: "0 16px 10px", background: T.card, border: `1px solid ${T.cardBorder}`, borderLeft: "3px solid #c9a84c", borderRadius: 14, padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                          onClick={() => setDicionarioTermo(t)}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: "bold", color: T.gold, marginBottom: 3 }}>{t.termo}</div>
                            <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{t.definicao}</div>
                          </div>
                          <div style={{ color: T.gold, fontSize: 18, flexShrink: 0 }}>›</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══ ORAÇÃO ══ */}
        {/* ══ ESTUDOS BÍBLICOS ══ */}
        {tab === "estudos" && (
          <div style={{ animation: "slideUp .4s ease", paddingBottom: 20 }}>
            <div style={{ padding: "16px 16px 0" }}>
              <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#c9a84c", marginBottom: 4 }}>📚 Estudos Bíblicos</div>
            </div>
            {!estudoAberto ? (
              <>
                <div style={{ display: "flex", margin: "14px 16px 16px", background: T.card, borderRadius: 12, padding: 4, border: `1px solid ${T.cardBorder}` }}>
                  {[{ id: "iniciante", label: "🌱 Iniciantes" }, { id: "avancado", label: "🔥 Avançados" }].map(n => (
                    <button key={n.id} onClick={() => setEstudoNivel(n.id)}
                      style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: estudoNivel === n.id ? "bold" : "normal", fontFamily: "Georgia,serif",
                        background: estudoNivel === n.id ? "linear-gradient(90deg,#c9a84c,#e8c97a)" : "transparent",
                        color: estudoNivel === n.id ? "#080810" : T.textSub }}>
                      {n.label}
                    </button>
                  ))}
                </div>
                {[...ESTUDOS_FIXOS, ...estudos].filter(e => e.nivel === estudoNivel).map(estudo => {
                  const feito = concluidos[estudo.id];
                  return (
                    <div key={estudo.id} style={{ margin: "0 16px 12px", background: T.card, border: `1px solid ${feito ? "rgba(34,197,94,.3)" : T.cardBorder}`, borderLeft: `3px solid ${feito ? "#22c55e" : "#c9a84c"}`, borderRadius: 14, padding: "14px 16px", cursor: "pointer" }}
                      onClick={() => setEstudoAberto(estudo)}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <div style={{ fontSize: 14, fontWeight: "bold", color: T.text }}>{estudo.titulo}</div>
                            {feito && <span style={{ fontSize: 10, background: "rgba(34,197,94,.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,.3)", borderRadius: 20, padding: "2px 8px" }}>✓ Concluído</span>}
                          </div>
                          <div style={{ fontSize: 12, color: T.gold, marginBottom: 4 }}>{estudo.versiculo}</div>
                          <div style={{ fontSize: 12, color: T.textSub }}>{estudo.perguntas?.length || 0} perguntas de reflexão</div>
                        </div>
                        <div style={{ color: T.gold, fontSize: 22 }}>›</div>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div style={{ animation: "slideUp .3s ease" }}>
                <button onClick={() => setEstudoAberto(null)}
                  style={{ margin: "12px 16px 0", background: "none", border: "none", color: T.gold, cursor: "pointer", fontSize: 14, fontFamily: "Georgia,serif" }}>
                  ← Voltar aos estudos
                </button>
                <div style={{ margin: "12px 16px 0", borderRadius: 18, overflow: "hidden", border: "1px solid rgba(201,168,76,.3)", background: darkMode ? "linear-gradient(135deg,#0a1a3a,#050d1f)" : "linear-gradient(135deg,#f5f0e8,#ede4d0)" }}>
                  <div style={{ background: "linear-gradient(90deg,#c9a84c,#e8c97a)", padding: "6px 16px" }}>
                    <span style={{ fontSize: 10, fontWeight: "bold", letterSpacing: 3, textTransform: "uppercase", color: "#080810" }}>
                      {estudoAberto.nivel === "iniciante" ? "🌱 Iniciantes" : "🔥 Avançados"}
                    </span>
                  </div>
                  <div style={{ padding: "18px 18px 20px" }}>
                    <div style={{ fontSize: 20, fontWeight: "bold", color: darkMode ? "#fff" : "#1a0f00", marginBottom: 10 }}>{estudoAberto.titulo}</div>
                    <div style={{ fontSize: 13, color: "#c9a84c", fontStyle: "italic", marginBottom: 4, lineHeight: 1.5 }}>{estudoAberto.versiculo}</div>
                  </div>
                </div>
                <div style={{ ...S.card, margin: "12px 16px" }}>
                  <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: T.gold, marginBottom: 12 }}>📖 Estudo</div>
                  <div style={{ fontSize: 14, lineHeight: 1.55, color: T.textSub }}>
                    {estudoAberto.texto.split("\n").map((par, i) => {
                      if (par.trim() === "") return <br key={i} style={{ lineHeight: "0.3" }} />;
                      const parts = par.split(/(\*\*.*?\*\*)/g).map((p, j) =>
                        p.startsWith("**") && p.endsWith("**") ? <strong key={j} style={{ color: T.text }}>{p.slice(2, -2)}</strong> : p
                      );
                      return <p key={i} style={{ marginBottom: 4 }}>{parts}</p>;
                    })}
                  </div>
                </div>
                {estudoAberto.perguntas?.length > 0 && (
                  <div style={{ ...S.card, margin: "0 16px 12px" }}>
                    <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: T.gold, marginBottom: 14 }}>💬 Reflexão</div>
                    {estudoAberto.perguntas.filter(p => p.trim()).map((p, i) => (
                      <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(201,168,76,.15)", border: "1px solid rgba(201,168,76,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: "bold", color: "#c9a84c", flexShrink: 0 }}>{i + 1}</div>
                        <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.6, paddingTop: 3 }}>{p}</div>
                      </div>
                    ))}
                  </div>
                )}
                {estudoAberto.oracao && (
                  <>
                    {/* Versículos de referência */}
                    {estudoAberto.referencias?.length > 0 && (
                      <div style={{ margin: "0 16px 12px", background: darkMode ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.04)", border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: "16px 18px" }}>
                        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: T.gold, marginBottom: 12 }}>📖 Para aprofundar</div>
                        {estudoAberto.referencias.map((ref, i) => (
                          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                            <span style={{ color: "#c9a84c", fontSize: 14, flexShrink: 0, marginTop: 1 }}>•</span>
                            <span style={{ fontSize: 12, color: T.textSub, lineHeight: 1.55 }}>{ref}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ margin: "0 16px 12px", background: "rgba(201,168,76,.06)", border: "1px solid rgba(201,168,76,.2)", borderRadius: 14, padding: "16px 18px" }}>
                      <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: T.gold, marginBottom: 10 }}>🙏 Oração</div>
                      <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.7, fontStyle: "italic" }}>{estudoAberto.oracao}</div>
                    </div>
                  </>
                )}
                <div style={{ margin: "0 16px 24px" }}>
                  <button style={{ width: "100%", padding: "14px 0", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: "bold", fontFamily: "Georgia,serif",
                    background: concluidos[estudoAberto.id] ? "rgba(34,197,94,.15)" : "linear-gradient(90deg,#c9a84c,#e8c97a)",
                    color: concluidos[estudoAberto.id] ? "#22c55e" : "#080810",
                    border: concluidos[estudoAberto.id] ? "1px solid rgba(34,197,94,.3)" : "none" }}
                    onClick={async () => {
                      const novo = { ...concluidos, [estudoAberto.id]: !concluidos[estudoAberto.id] };
                      setConcluidos(novo);
                      if (user?.email) await setDoc(doc(db, "concluidos", user.email), novo);
                      showToast(novo[estudoAberto.id] ? "✅ Estudo marcado como concluído!" : "↩️ Marcado como não concluído");
                    }}>
                    {concluidos[estudoAberto.id] ? "✓ Concluído — Clique para desfazer" : "Marcar como Concluído"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

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

            {/* Voltar */}
            <div style={{ padding: "16px 16px 0" }}>
              <button onClick={() => setTab("home")}
                style={{ background: "none", border: "none", color: T.gold, cursor: "pointer", fontSize: 14, fontFamily: "Georgia,serif", display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
                ‹ Voltar
              </button>
            </div>

            {/* Hero */}
            <div style={{ margin: "16px 16px 0", background: "linear-gradient(135deg,rgba(201,168,76,.18),rgba(100,60,180,.12))", border: `1px solid ${darkMode ? "rgba(201,168,76,.25)" : "rgba(154,112,32,.55)"}`, borderRadius: 20, padding: "28px 22px", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🕊️</div>
              <div style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>Devocional Diário</div>
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
                <div style={S.secTitle}>Devocional de Hoje</div>

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
            {/* Voltar */}
            <div style={{ padding: "16px 16px 0" }}>
              <button onClick={() => setTab("mais")}
                style={{ background: "none", border: "none", color: T.gold, cursor: "pointer", fontSize: 14, fontFamily: "Georgia,serif", display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
                ‹ Voltar
              </button>
            </div>
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

            {/* Voltar */}
            <div style={{ padding: "16px 16px 0" }}>
              <button onClick={() => setTab("home")}
                style={{ background: "none", border: "none", color: T.gold, cursor: "pointer", fontSize: 14, fontFamily: "Georgia,serif", display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
                ‹ Voltar
              </button>
            </div>

            {/* Menu rápido */}
            <div style={S.secTitle}>Menu</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "0 16px 20px" }}>
              {[
                { id: "voluntario", icon: "🤲", label: "Servir" },
                { id: "perfil", icon: "👤", label: "Perfil" },
              ].map(item => (
                <button key={item.id} onClick={() => setTab(item.id)}
                  style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: "16px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", fontFamily: "Georgia,serif" }}>
                  <span style={{ fontSize: 26 }}>{item.icon}</span>
                  <span style={{ fontSize: 12, color: T.text, fontWeight: "bold" }}>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Agenda completa (Admin vê tudo; Membros e Líderes veem só a semana atual) */}
            <div id="mais-agenda" style={S.secTitle}>{isAdmin ? "Agenda Completa" : "Eventos desta Semana"}</div>
            {(() => {
              const { fim } = getSemanaAtual();
              const hoje = new Date().toISOString().split("T")[0];
              const eventosExibidos = isAdmin ? agenda : agenda.filter(e => e.data >= hoje && e.data <= fim);
              if (eventosExibidos.length === 0) {
                return <div style={{ ...S.card, textAlign: "center" }}><div style={{ fontSize: 13, color: T.textSub }}>{isAdmin ? "Nenhum evento." : "Nenhum evento esta semana."}</div></div>;
              }
              return eventosExibidos.map(ev => (
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
              ));
            })()}

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
            <div id="mais-localizacao" style={S.secTitle}>Nossa Localização</div>
            <div style={S.card}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
                <div style={{ fontSize: 20, marginTop: 2 }}>📍</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: "bold", color: T.text, marginBottom: 3 }}>Rua Armando Longatti, nº 45</div>
                  <div style={{ fontSize: 13, color: T.textSub }}>Jardim São Vicente — Piracicaba/SP</div>
                </div>
              </div>
              <div style={{ borderRadius: 10, overflow: "hidden", marginBottom: 12, border: "1px solid " + T.cardBorder }}>
                <iframe title="Localização Igreja Família Aliança"
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
            {/* Notificações */}
            <div style={S.secTitle}>🔔 Notificações</div>
            <div style={{ margin: "0 16px 16px", background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: notifBloqueada ? 14 : 0 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: "bold", color: T.text, marginBottom: 4 }}>
                    {notifAtivada ? "✅ Notificações ativadas" : notifBloqueada ? "🔒 Notificações bloqueadas" : "🔕 Notificações desativadas"}
                  </div>
                  <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.5 }}>
                    {notifAtivada ? "Você receberá avisos e novidades da igreja." : notifBloqueada ? "Seu navegador bloqueou as notificações. Siga os passos abaixo para liberar." : "Ative para receber avisos e novidades em tempo real."}
                  </div>
                </div>
                {!notifAtivada && !notifBloqueada && (
                  <button onClick={ativarNotificacoes}
                    style={{ background: "linear-gradient(90deg,#c9a84c,#e8c97a)", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 12, fontWeight: "bold", color: "#080810", cursor: "pointer", fontFamily: "Georgia,serif", flexShrink: 0 }}>
                    Ativar
                  </button>
                )}
              </div>

              {/* Instruções quando bloqueada */}
              {notifBloqueada && (
                <div style={{ background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, fontWeight: "bold", color: "#f87171", marginBottom: 8 }}>Como liberar as notificações:</div>
                  <div style={{ fontSize: 11, color: T.textSub, lineHeight: 1.8 }}>
                    <div>📱 <strong>Android (Chrome):</strong></div>
                    <div style={{ marginLeft: 18, marginBottom: 6 }}>Toque nos 3 pontos → Configurações → Configurações do site → Notificações → Encontre este site → Permitir</div>
                    <div>🍎 <strong>iPhone (Safari):</strong></div>
                    <div style={{ marginLeft: 18, marginBottom: 6 }}>Ajustes → Safari → Notificações → Encontre familia-alianca.vercel.app → Permitir</div>
                    <div>💻 <strong>Computador (Chrome):</strong></div>
                    <div style={{ marginLeft: 18 }}>Clique no 🔒 na barra de endereço → Notificações → Permitir → Recarregue a página</div>
                  </div>
                  <button onClick={ativarNotificacoes} style={{ marginTop: 10, width: "100%", padding: "8px 0", background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 8, color: "#f87171", fontSize: 12, cursor: "pointer", fontFamily: "Georgia,serif" }}>
                    Tentar novamente após liberar
                  </button>
                </div>
              )}
            </div>

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
                {
                  label: "Site", url: "https://www.familiaaliancapiracicaba.com.br/", color: "#c9a84c", bg: "rgba(201,168,76,.12)", border: "rgba(201,168,76,.3)",
                  svg: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
                },
              ].map(r => (
                <button key={r.label} style={{ flex: 1, minWidth: 70, padding: "14px 8px", background: r.bg, border: `1px solid ${r.border}`, borderRadius: 14, color: r.color, fontSize: 11, cursor: "pointer", fontFamily: "Georgia,serif", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
                  onClick={() => window.open(r.url, "_blank")}>
                  {r.svg}
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══ MEU MINISTÉRIO ══ */}
        {tab === "meumin" && (
          <div style={{ animation: "slideUp .4s ease", paddingBottom: 20 }}>
            {catalogoMusicasAberto ? (() => {
              const musicasDoMin = musicas.filter(m => m.ministerio === catalogoMusicasAberto);
              const CATEGORIAS_FILTRO = [
                { id: "", label: "Todas" },
                { id: "Repertório feminino", label: "Feminino" },
                { id: "Repertório masculino", label: "Masculino" },
                { id: "Repertório geral", label: "Geral" },
              ];
              const musicasFiltradas = musicasDoMin.filter(m => {
                const buscaOk = !buscaCatalogoMusica.trim() ||
                  m.titulo?.toLowerCase().includes(buscaCatalogoMusica.toLowerCase()) ||
                  m.artista?.toLowerCase().includes(buscaCatalogoMusica.toLowerCase());
                const categoriaOk = !filtroCategoriaCatalogo || m.categoria === filtroCategoriaCatalogo;
                return buscaOk && categoriaOk;
              });
              const iconePorTipoCat = { pdf: "📄", audio: "🎵", imagem: "🖼️", link: "🔗" };

              return (
                <div style={{ padding: "0 16px" }}>
                  <div style={{ padding: "16px 0 0" }}>
                    <button onClick={() => { setCatalogoMusicasAberto(false); setMusicaCatalogoExpandida(null); setBuscaCatalogoMusica(""); setFiltroCategoriaCatalogo(""); }}
                      style={{ background: "none", border: "none", color: T.gold, cursor: "pointer", fontSize: 14, fontFamily: "Georgia,serif", display: "flex", alignItems: "center", gap: 4, padding: 0, marginBottom: 10 }}>
                      ‹ Voltar
                    </button>
                  </div>
                  <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#c9a84c", marginBottom: 4 }}>🎵 Músicas — {catalogoMusicasAberto}</div>
                  <div style={{ fontSize: 12, color: T.textSub, marginBottom: 14 }}>{musicasFiltradas.length} de {musicasDoMin.length} música(s)</div>

                  {/* Busca */}
                  <input style={{ ...S.input, marginBottom: 10 }} placeholder="🔍 Buscar por nome ou artista..."
                    value={buscaCatalogoMusica} onChange={e => setBuscaCatalogoMusica(e.target.value)} />

                  {/* Filtro de categoria */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto" }}>
                    {CATEGORIAS_FILTRO.map(c => (
                      <button key={c.id} onClick={() => setFiltroCategoriaCatalogo(c.id)}
                        style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 20, border: `1px solid ${filtroCategoriaCatalogo === c.id ? "#c9a84c" : T.cardBorder}`, background: filtroCategoriaCatalogo === c.id ? "rgba(201,168,76,.15)" : T.card, color: filtroCategoriaCatalogo === c.id ? "#c9a84c" : T.textSub, fontSize: 12, fontWeight: filtroCategoriaCatalogo === c.id ? "bold" : "normal", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                        {c.label}
                      </button>
                    ))}
                  </div>

                  {musicasFiltradas.length === 0 ? (
                    <div style={{ ...S.card, textAlign: "center", padding: "28px 0", marginLeft: 0, marginRight: 0 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🎵</div>
                      <div style={{ fontSize: 13, color: T.textSub }}>Nenhuma música encontrada</div>
                    </div>
                  ) : musicasFiltradas.map(m => {
                    const expandida = musicaCatalogoExpandida === m.id;
                    const ytId = getYouTubeId(m.link);
                    const spId = getSpotifyId(m.link);
                    const arquivosM = m.arquivos || [];
                    return (
                      <div key={m.id} style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderLeft: "3px solid #c9a84c", borderRadius: 12, marginBottom: 10, overflow: "hidden" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer" }}
                          onClick={() => setMusicaCatalogoExpandida(expandida ? null : m.id)}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: "bold", color: T.text }}>{m.titulo}</div>
                            <div style={{ fontSize: 12, color: T.textSub }}>{m.artista} {m.tom && <span style={{ color: "#c9a84c" }}>• Tom: {m.tom}</span>} {m.tempo && <span style={{ color: "#8b5cf6" }}>• 🥁 {m.tempo} BPM</span>}</div>
                            {m.categoria && <div style={{ fontSize: 10, color: "#22d3ee", marginTop: 3 }}>🏷️ {m.categoria}</div>}
                          </div>
                          <span style={{ color: T.textSub, fontSize: 16 }}>{expandida ? "▲" : "▼"}</span>
                        </div>
                        {expandida && (
                          <div style={{ padding: "0 14px 14px" }}>
                            {ytId && <div style={{ margin: "10px 0" }}><iframe width="100%" height="180" src={`https://www.youtube.com/embed/${ytId}`} frameBorder="0" allowFullScreen loading="lazy" style={{ display: "block", borderRadius: 10 }} title="Video player"/></div>}
                            {spId && <div style={{ margin: "10px 0" }}><iframe src={`https://open.spotify.com/embed/${spId.type}/${spId.id}`} width="100%" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" style={{ display: "block", borderRadius: 10 }} title="Spotify player"/></div>}
                            {m.link && !ytId && !spId && (
                              <div style={{ margin: "10px 0" }}>
                                <button onClick={() => window.open(m.link, "_blank")}
                                  style={{ width: "100%", background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.3)", borderRadius: 8, padding: "8px 0", fontSize: 12, color: T.gold, cursor: "pointer" }}>🔗 Abrir Link</button>
                              </div>
                            )}
                            {arquivosM.length === 0 ? (
                              <div style={{ fontSize: 12, color: T.textFaint }}>Nenhum arquivo anexado ainda.</div>
                            ) : (
                              <>
                                <div style={{ fontSize: 11, color: T.gold, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>📎 Arquivos</div>
                                {arquivosM.map(a => (
                                  <div key={a.id} style={{ background: darkMode ? "rgba(139,92,246,.06)" : "rgba(139,92,246,.04)", border: "1px solid rgba(139,92,246,.15)", borderRadius: 10, padding: "8px 10px", marginBottom: 6 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                      <span style={{ fontSize: 15 }}>{iconePorTipoCat[a.tipo] || "📁"}</span>
                                      <span style={{ flex: 1, fontSize: 12, fontWeight: "bold", color: T.text }}>{a.nome}</span>
                                      {a.tipo === "audio" ? (
                                        <button onClick={() => setAudioTocando(audioTocando === a.id ? null : a.id)}
                                          style={{ background: "rgba(139,92,246,.15)", border: "1px solid rgba(139,92,246,.3)", borderRadius: 6, padding: "5px 8px", fontSize: 11, color: "#a78bfa", cursor: "pointer" }}>{audioTocando === a.id ? "⏹ Fechar" : "▶️ Tocar"}</button>
                                      ) : (
                                        <button onClick={() => window.open(a.url, "_blank")}
                                          style={{ background: "rgba(139,92,246,.15)", border: "1px solid rgba(139,92,246,.3)", borderRadius: 6, padding: "5px 8px", fontSize: 11, color: "#a78bfa", cursor: "pointer" }}>Abrir</button>
                                      )}
                                      {a.tipo !== "link" && (
                                        <button onClick={() => baixarArquivo(a.url, a.nome)}
                                          style={{ background: "rgba(34,197,94,.15)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 6, padding: "5px 8px", fontSize: 11, color: "#4ade80", cursor: "pointer" }}>⬇️</button>
                                      )}
                                    </div>
                                    {a.tipo === "audio" && audioTocando === a.id && (
                                      <audio controls autoPlay style={{ width: "100%", marginTop: 8, height: 34 }}>
                                        <source src={a.url} />
                                      </audio>
                                    )}
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })() : (
              <>
            <div style={{ padding: "16px 16px 8px" }}>
              <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#c9a84c", marginBottom: 4 }}>⛪ Meu Ministério</div>
            </div>
            {user?.ministerios?.map(min => {
              const minData = MINISTERIOS.find(m => m.nome === min);
              const avisosMin = avisos.filter(a => a.ministerio === min);
              const hoje3 = new Date().toISOString().split("T")[0];
              const proximaEscala = escalas.filter(e => e.ministerio === min && e.data >= hoje3).sort((a, b) => a.data.localeCompare(b.data))[0];
              const minhasEscalasFuturas = escalas
                .filter(e => e.ministerio === min && e.data >= hoje3 && e.membrosEscalados?.[user?.email])
                .sort((a, b) => a.data.localeCompare(b.data));
              const outrasEscalasFuturas = minhasEscalasFuturas.filter(e => e.id !== proximaEscala?.id);
              const meuDadosEscala = proximaEscala?.membrosEscalados?.[user?.email];
              const meuMembroLive = membros.find(mm => mm.email === user?.email);
              const souUsuarioPadrao = !!meuMembroLive?.[`usuarioPadrao_${min.replace(/\s/g, "_")}`];
              const musicasEscala = (proximaEscala?.musicas || []).map(mid => musicas.find(x => x.id === mid)).filter(Boolean);
              const todosEscalados = Object.entries(proximaEscala?.membrosEscalados || {});
              const escalaLouvorMin = min !== "Aliança Music" && proximaEscala
                ? escalas.find(e => e.ministerio === "Aliança Music" && (e.eventoId === proximaEscala.eventoId || e.eventoRef === proximaEscala.eventoId))
                : null;
              const musicasLouvorMin = (escalaLouvorMin?.musicas || []).map(mid => musicas.find(x => x.id === mid)).filter(Boolean);

              return (
                <div key={min} style={{ margin: "0 16px 16px", background: darkMode ? "rgba(201,168,76,.04)" : "rgba(201,168,76,.06)", border: "1px solid rgba(201,168,76,.2)", borderRadius: 18, overflow: "hidden" }}>
                  {/* Header ministério */}
                  <div style={{ background: "linear-gradient(90deg,#c9a84c,#e8c97a)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{minData?.icon || "⛪"}</span>
                    <div style={{ fontSize: 15, fontWeight: "bold", color: "#080810" }}>{min}</div>
                  </div>
                  <div style={{ padding: "14px 16px" }}>
                    {/* Botão Músicas em destaque */}
                    {min === "Aliança Music" && (
                      <button onClick={() => setCatalogoMusicasAberto(min)}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "linear-gradient(90deg,#c9a84c,#e8c97a)", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 15, fontWeight: "bold", color: "#080810", cursor: "pointer", fontFamily: "Georgia,serif", marginBottom: 14, boxShadow: "0 4px 14px rgba(201,168,76,.35)" }}>
                        🎵 Todas as Músicas
                      </button>
                    )}

                    {/* Avisos */}
                    {avisosMin.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, color: "#c9a84c", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>📢 Avisos</div>
                        {avisosMin.slice(0, 3).map(av => (
                          <div key={av.id} style={{ padding: "10px 12px", background: T.card, border: `1px solid ${T.cardBorder}`, borderLeft: "3px solid #c9a84c", borderRadius: 10, marginBottom: 6 }}>
                            <div style={{ fontSize: 13, fontWeight: "bold", color: T.text }}>{av.titulo}</div>
                            <div style={{ fontSize: 12, color: T.textSub }}>{av.texto}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Próxima escala */}
                    {proximaEscala && (
                      <div>
                        <div style={{ fontSize: 11, color: "#c9a84c", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>📋 Sua Escala Atual</div>
                        <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, overflow: "hidden", marginBottom: 10 }}>
                          <div style={{ background: "linear-gradient(90deg,#c9a84c,#e8c97a)", padding: "7px 14px" }}>
                            <div style={{ fontSize: 13, fontWeight: "bold", color: "#080810" }}>{proximaEscala.culto}</div>
                            <div style={{ fontSize: 11, color: "#080810" }}>{new Date(proximaEscala.data + "T12:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })} {proximaEscala.hora && `• ${proximaEscala.hora}`}</div>
                          </div>
                          <div style={{ padding: "12px 14px" }}>
                            {/* Status */}
                            {meuDadosEscala ? (
                              <div style={{ background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
                                <div style={{ fontSize: 12, fontWeight: "bold", color: "#22c55e", marginBottom: 2 }}>✅ Você está escalado!</div>
                                {meuDadosEscala.funcoes?.length > 0 && <div style={{ fontSize: 12, color: T.textSub }}>🎤 {meuDadosEscala.funcoes.join(", ")}</div>}
                                {meuDadosEscala.instrumentos?.length > 0 && <div style={{ fontSize: 12, color: T.textSub }}>🎸 {meuDadosEscala.instrumentos.join(", ")}</div>}
                                {meuDadosEscala.categorias?.length > 0 && <div style={{ fontSize: 12, color: T.textSub }}>🏷️ {meuDadosEscala.categorias.join(", ")}</div>}
                                {meuDadosEscala.obs && <div style={{ fontSize: 12, color: "#c9a84c", marginTop: 4, fontStyle: "italic" }}>"{meuDadosEscala.obs}"</div>}
                              </div>
                            ) : (
                              <div style={{ background: "rgba(150,150,150,.08)", border: `1px solid ${T.cardBorder}`, borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontSize: 12, color: T.textFaint }}>
                                Você não está escalado para este culto
                              </div>
                            )}

                            {/* Equipe — só para escalados */}
                            {meuDadosEscala && todosEscalados.length > 0 && (
                              <div style={{ marginBottom: 12 }}>
                                <div style={{ fontSize: 11, color: T.gold, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>👥 Equipe</div>
                                {todosEscalados.map(([email, dados]) => (
                                  <div key={email} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: `1px solid ${T.cardBorder}` }}>
                                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(201,168,76,.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: "bold", color: "#c9a84c", flexShrink: 0 }}>
                                      {dados.nome?.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: 12, fontWeight: email === user?.email ? "bold" : "normal", color: email === user?.email ? "#c9a84c" : T.text }}>
                                        {dados.nome} {email === user?.email && "(você)"}
                                      </div>
                                      <div style={{ fontSize: 10, color: T.textSub }}>{dados.funcoes?.join(", ")}{dados.instrumentos?.length > 0 && ` • 🎸 ${dados.instrumentos.join(", ")}`}{dados.categorias?.length > 0 && `🏷️ ${dados.categorias.join(", ")}`}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Músicas — só para escalados, com Cifra e VS aninhados abaixo de cada uma */}
                            {meuDadosEscala && musicasEscala.length > 0 && (() => {
                              const cifrasMin = cifras.filter(c => c.ministerio === min);
                              const vsMin = vsItems.filter(v => v.ministerio === min);
                              const idsDoCulto = musicasEscala.map(m => m.id);
                              // Cifras/VS vinculados a músicas que NÃO estão neste culto (ou sem vínculo) ficam numa seção geral abaixo
                              const cifrasSemVinculo = cifrasMin.filter(c => !c.musicaId || !idsDoCulto.includes(c.musicaId));
                              const vsSemVinculo = vsMin.filter(v => !v.musicaId || !idsDoCulto.includes(v.musicaId));

                              const renderCifra = c => (
                                <div key={c.id} style={{ background: darkMode ? "rgba(139,92,246,.06)" : "rgba(139,92,246,.04)", border: "1px solid rgba(139,92,246,.2)", borderRadius: 10, padding: "10px 12px", marginTop: 8 }}>
                                  <div style={{ fontSize: 12, fontWeight: "bold", color: "#a78bfa", marginBottom: 6 }}>🎸 {c.titulo} {c.tom && <span style={{ color: "#c9a84c", fontSize: 11 }}>• {c.tom}</span>}</div>
                                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                    {c.link && <button onClick={() => window.open(c.link, "_blank")} style={{ flex: 1, minWidth: 80, background: "rgba(139,92,246,.15)", border: "1px solid rgba(139,92,246,.3)", borderRadius: 8, padding: "7px 0", fontSize: 11, fontWeight: "bold", color: "#a78bfa", cursor: "pointer" }}>🔗 Cifra</button>}
                                    {c.arquivo && <button onClick={() => setPdfAberto(pdfAberto === c.arquivo ? null : c.arquivo)} style={{ flex: 1, minWidth: 80, background: "rgba(220,38,38,.15)", border: "1px solid rgba(220,38,38,.3)", borderRadius: 8, padding: "7px 0", fontSize: 11, fontWeight: "bold", color: "#f87171", cursor: "pointer" }}>📄 PDF</button>}
                                    {c.arquivo && <button onClick={() => baixarArquivo(c.arquivo, c.titulo)} style={{ flex: 1, minWidth: 80, background: "rgba(34,197,94,.15)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 8, padding: "7px 0", fontSize: 11, fontWeight: "bold", color: "#4ade80", cursor: "pointer" }}>⬇️ Baixar</button>}
                                    {c.conteudo && <button onClick={() => setMusicaSelecionada(musicaSelecionada?.id === c.id ? null : c)} style={{ flex: 1, minWidth: 80, background: "rgba(139,92,246,.15)", border: "1px solid rgba(139,92,246,.3)", borderRadius: 8, padding: "7px 0", fontSize: 11, fontWeight: "bold", color: "#a78bfa", cursor: "pointer" }}>📝 Ver</button>}
                                  </div>
                                  {musicaSelecionada?.id === c.id && c.conteudo && (
                                    <pre style={{ marginTop: 8, fontSize: 11, color: T.text, lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: "monospace", background: darkMode ? "rgba(0,0,0,.3)" : "rgba(0,0,0,.05)", borderRadius: 8, padding: "10px" }}>{c.conteudo}</pre>
                                  )}
                                </div>
                              );

                              const renderVs = v => (
                                <div key={v.id} style={{ background: darkMode ? "rgba(139,92,246,.06)" : "rgba(139,92,246,.04)", border: "1px solid rgba(139,92,246,.2)", borderRadius: 10, marginTop: 8, overflow: "hidden" }}>
                                  <div style={{ padding: "10px 12px" }}>
                                    <div style={{ fontSize: 12, fontWeight: "bold", color: "#a78bfa" }}>{v.tipo?.includes("audio") ? "🎵" : "📁"} {v.titulo}</div>
                                    {v.artista && <div style={{ fontSize: 11, color: T.textSub }}>{v.artista}</div>}
                                  </div>
                                  {v.arquivo && v.tipo?.includes("audio") && (
                                    <div style={{ padding: "0 12px 10px" }}>
                                      <audio controls style={{ width: "100%", borderRadius: 8 }}>
                                        <source src={v.arquivo} type={v.tipo} />
                                      </audio>
                                    </div>
                                  )}
                                  {v.arquivo && (
                                    <div style={{ padding: "0 12px 10px" }}>
                                      <button onClick={() => baixarArquivo(v.arquivo, v.titulo)}
                                        style={{ width: "100%", background: "rgba(34,197,94,.15)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 8, padding: "7px 0", fontSize: 11, fontWeight: "bold", color: "#4ade80", cursor: "pointer" }}>⬇️ Baixar</button>
                                    </div>
                                  )}
                                </div>
                              );

                              return (
                                <>
                                  <div style={{ marginBottom: 10 }}>
                                    <div style={{ fontSize: 11, color: T.gold, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>🎶 Músicas do Culto</div>
                                    {musicasEscala.map((mus, i) => {
                                      const expandidaMembro = musicaEscalaExpandida === (mus.id || i);
                                      return (
                                      <div key={i} style={{ background: darkMode ? "rgba(0,0,0,.2)" : "rgba(0,0,0,.04)", borderRadius: 12, marginBottom: 8, overflow: "hidden", padding: expandidaMembro ? "0 0 10px" : "0" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", cursor: "pointer" }}
                                          onClick={() => setMusicaEscalaExpandida(expandidaMembro ? null : (mus.id || i))}>
                                          <span style={{ fontSize: 16 }}>🎵</span>
                                          <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: "bold", color: T.text }}>{mus.titulo}</div>
                                            <div style={{ fontSize: 11, color: T.textSub }}>{mus.artista} {mus.tom && <span style={{ color: "#c9a84c" }}>• {mus.tom}</span>} {mus.tempo && <span style={{ color: "#8b5cf6" }}>• 🥁{mus.tempo}</span>}</div>
                                          </div>
                                          <span style={{ color: T.textSub, fontSize: 15 }}>{expandidaMembro ? "▲" : "▼"}</span>
                                        </div>
                                        {expandidaMembro && (
                                          <>
                                            {getYouTubeId(mus.link) && <iframe width="100%" height="160" title="YouTube video" src={`https://www.youtube.com/embed/${getYouTubeId(mus.link)}`} frameBorder="0" allowFullScreen loading="lazy" style={{ display: "block" }} />}
                                            {getSpotifyId(mus.link) && <iframe title="Spotify player" src={`https://open.spotify.com/embed/${getSpotifyId(mus.link).type}/${getSpotifyId(mus.link).id}`} width="100%" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" style={{ display: "block" }} />}
                                            <div style={{ padding: "0 12px" }}>
                                              {(mus.arquivos || []).map(a => (
                                                <div key={a.id} style={{ background: darkMode ? "rgba(139,92,246,.06)" : "rgba(139,92,246,.04)", border: "1px solid rgba(139,92,246,.15)", borderRadius: 10, padding: "8px 10px", marginTop: 8 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                  <span style={{ fontSize: 15 }}>{{ pdf: "📄", audio: "🎵", imagem: "🖼️", link: "🔗" }[a.tipo] || "📁"}</span>
                                                  <span style={{ flex: 1, fontSize: 12, fontWeight: "bold", color: T.text }}>{a.nome}</span>
                                                  {a.tipo === "audio" ? (
                                                    <button onClick={() => setAudioTocando(audioTocando === a.id ? null : a.id)}
                                                      style={{ background: "rgba(139,92,246,.15)", border: "1px solid rgba(139,92,246,.3)", borderRadius: 6, padding: "5px 8px", fontSize: 11, color: "#a78bfa", cursor: "pointer" }}>{audioTocando === a.id ? "⏹ Fechar" : "▶️ Tocar"}</button>
                                                  ) : (
                                                    <button onClick={() => window.open(a.url, "_blank")}
                                                      style={{ background: "rgba(139,92,246,.15)", border: "1px solid rgba(139,92,246,.3)", borderRadius: 6, padding: "5px 8px", fontSize: 11, color: "#a78bfa", cursor: "pointer" }}>Abrir</button>
                                                  )}
                                                  {a.tipo !== "link" && (
                                                    <button onClick={() => baixarArquivo(a.url, a.nome)}
                                                      style={{ background: "rgba(34,197,94,.15)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 6, padding: "5px 8px", fontSize: 11, color: "#4ade80", cursor: "pointer" }}>⬇️</button>
                                                  )}
                                                </div>
                                                {a.tipo === "audio" && audioTocando === a.id && (
                                                  <audio controls autoPlay style={{ width: "100%", marginTop: 8, height: 34 }}>
                                                    <source src={a.url} />
                                                  </audio>
                                                )}
                                                </div>
                                              ))}
                                              {cifrasMin.filter(c => c.musicaId === mus.id).map(renderCifra)}
                                              {vsMin.filter(v => v.musicaId === mus.id).map(renderVs)}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                      );
                                    })}
                                  </div>

                                  {cifrasSemVinculo.length > 0 && (
                                    <div style={{ marginBottom: 10 }}>
                                      <div style={{ fontSize: 11, color: "#8b5cf6", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>🎸 Outras Cifras</div>
                                      {cifrasSemVinculo.map(renderCifra)}
                                    </div>
                                  )}

                                  {vsSemVinculo.length > 0 && (
                                    <div>
                                      <div style={{ fontSize: 11, color: "#a78bfa", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>🎧 Outros VS</div>
                                      {vsSemVinculo.map(renderVs)}
                                    </div>
                                  )}
                                </>
                              );
                            })()}

                            {/* Caso não haja músicas na escala, mostrar Cifras e VS gerais do ministério normalmente */}
                            {meuDadosEscala && musicasEscala.length === 0 && (() => {
                              const cifrasMin = cifras.filter(c => c.ministerio === min);
                              const vsMin = vsItems.filter(v => v.ministerio === min);
                              return (
                                <>
                                  {cifrasMin.length > 0 && (
                                    <div style={{ marginBottom: 10 }}>
                                      <div style={{ fontSize: 11, color: "#8b5cf6", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>🎸 Cifras</div>
                                      {cifrasMin.map(c => (
                                        <div key={c.id} style={{ background: darkMode ? "rgba(139,92,246,.06)" : "rgba(139,92,246,.04)", border: "1px solid rgba(139,92,246,.2)", borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
                                          <div style={{ fontSize: 13, fontWeight: "bold", color: T.text, marginBottom: 6 }}>{c.titulo} {c.tom && <span style={{ color: "#c9a84c", fontSize: 11 }}>• {c.tom}</span>}</div>
                                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                            {c.link && <button onClick={() => window.open(c.link, "_blank")} style={{ flex: 1, minWidth: 80, background: "rgba(139,92,246,.15)", border: "1px solid rgba(139,92,246,.3)", borderRadius: 8, padding: "7px 0", fontSize: 11, fontWeight: "bold", color: "#a78bfa", cursor: "pointer" }}>🔗 Cifra</button>}
                                            {c.arquivo && <button onClick={() => setPdfAberto(pdfAberto === c.arquivo ? null : c.arquivo)} style={{ flex: 1, minWidth: 80, background: "rgba(220,38,38,.15)", border: "1px solid rgba(220,38,38,.3)", borderRadius: 8, padding: "7px 0", fontSize: 11, fontWeight: "bold", color: "#f87171", cursor: "pointer" }}>📄 PDF</button>}
                                            {c.arquivo && <button onClick={() => baixarArquivo(c.arquivo, c.titulo)} style={{ flex: 1, minWidth: 80, background: "rgba(34,197,94,.15)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 8, padding: "7px 0", fontSize: 11, fontWeight: "bold", color: "#4ade80", cursor: "pointer" }}>⬇️ Baixar</button>}
                                            {c.conteudo && <button onClick={() => setMusicaSelecionada(musicaSelecionada?.id === c.id ? null : c)} style={{ flex: 1, minWidth: 80, background: "rgba(139,92,246,.15)", border: "1px solid rgba(139,92,246,.3)", borderRadius: 8, padding: "7px 0", fontSize: 11, fontWeight: "bold", color: "#a78bfa", cursor: "pointer" }}>📝 Ver</button>}
                                          </div>
                                          {musicaSelecionada?.id === c.id && c.conteudo && (
                                            <pre style={{ marginTop: 8, fontSize: 11, color: T.text, lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: "monospace", background: darkMode ? "rgba(0,0,0,.3)" : "rgba(0,0,0,.05)", borderRadius: 8, padding: "10px" }}>{c.conteudo}</pre>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {vsMin.length > 0 && (
                                    <div>
                                      <div style={{ fontSize: 11, color: "#a78bfa", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>🎧 VS</div>
                                      {vsMin.map(v => (
                                        <div key={v.id} style={{ background: darkMode ? "rgba(139,92,246,.06)" : "rgba(139,92,246,.04)", border: "1px solid rgba(139,92,246,.2)", borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
                                          <div style={{ padding: "10px 12px" }}>
                                            <div style={{ fontSize: 13, fontWeight: "bold", color: T.text }}>{v.tipo?.includes("audio") ? "🎵" : "📁"} {v.titulo}</div>
                                            {v.artista && <div style={{ fontSize: 11, color: T.textSub }}>{v.artista}</div>}
                                          </div>
                                          {v.arquivo && v.tipo?.includes("audio") && (
                                            <div style={{ padding: "0 12px 10px" }}>
                                              <audio controls style={{ width: "100%", borderRadius: 8 }}>
                                                <source src={v.arquivo} type={v.tipo} />
                                              </audio>
                                            </div>
                                          )}
                                          {v.arquivo && (
                                            <div style={{ padding: "0 12px 10px" }}>
                                              <button onClick={() => baixarArquivo(v.arquivo, v.titulo)}
                                                style={{ width: "100%", background: "rgba(34,197,94,.15)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 8, padding: "7px 0", fontSize: 11, fontWeight: "bold", color: "#4ade80", cursor: "pointer" }}>⬇️ Baixar</button>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </>
                              );
                            })()}

                            {/* Músicas escolhidas pelo Louvor — para membros de outros ministérios (ex: Mídia) */}
                            {(meuDadosEscala || souUsuarioPadrao) && min !== "Aliança Music" && musicasLouvorMin.length > 0 && (
                              <div style={{ marginTop: 10 }}>
                                <div style={{ fontSize: 11, color: "#8b5cf6", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>🎶 Músicas escolhidas pelo Louvor</div>
                                {musicasLouvorMin.map((mus, i) => (
                                  <div key={i} style={{ background: darkMode ? "rgba(139,92,246,.06)" : "rgba(139,92,246,.04)", border: "1px solid rgba(139,92,246,.2)", borderRadius: 10, padding: "8px 12px", marginBottom: 6 }}>
                                    <div style={{ fontSize: 12, fontWeight: "bold", color: T.text }}>{mus.titulo} <span style={{ color: T.textSub, fontWeight: "normal" }}>— {mus.artista}</span> {mus.tom && <span style={{ color: "#c9a84c" }}>• {mus.tom}</span>} {mus.tempo && <span style={{ color: "#8b5cf6" }}>• 🥁{mus.tempo}</span>}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* Arquivos e Pregação — para membros escalados no Ministério da Mídia (ou Usuário Padrão, que sempre recebe tudo) */}
                            {(meuDadosEscala || souUsuarioPadrao) && min === "Mídia" && (() => {
                              const arquivosDoMin = arquivosMidia.filter(a => a.ministerio === min);
                              const pregacaoAtualMin = [...pregacoes].sort((a, b) => (b.criadoEm || "").localeCompare(a.criadoEm || ""))[0];
                              const vejoPregacao = souUsuarioPadrao || meuDadosEscala?.categorias?.includes("Letra");
                              return (
                                <>
                                  {arquivosDoMin.length > 0 && (
                                    <div style={{ marginTop: 10 }}>
                                      <div style={{ fontSize: 11, color: T.gold, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>🖼️ Arquivos (Telão)</div>
                                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                        {arquivosDoMin.map(a => (
                                          <div key={a.id} style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 12, overflow: "hidden" }}>
                                            <img src={a.arquivo} alt={a.titulo} style={{ width: "100%", height: 90, objectFit: "cover", display: "block" }} />
                                            <div style={{ padding: "6px 8px" }}>
                                              <div style={{ fontSize: 10, fontWeight: "bold", color: T.text, marginBottom: 6 }}>{a.titulo}</div>
                                              <button onClick={() => baixarArquivo(a.arquivo, a.titulo)}
                                                style={{ width: "100%", background: "rgba(34,197,94,.15)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 6, padding: "4px 0", fontSize: 10, fontWeight: "bold", color: "#4ade80", cursor: "pointer" }}>⬇️ Baixar</button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {pregacaoAtualMin && vejoPregacao && (
                                    <div style={{ marginTop: 10 }}>
                                      <div style={{ fontSize: 11, color: "#8b5cf6", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>📜 Pregação</div>
                                      <div style={{ background: darkMode ? "rgba(139,92,246,.06)" : "rgba(139,92,246,.04)", border: "1px solid rgba(139,92,246,.2)", borderRadius: 10, padding: "10px 12px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                                          <div style={{ fontSize: 12, fontWeight: "bold", color: T.text, flex: 1 }}>{pregacaoAtualMin.titulo}</div>
                                          <button onClick={() => baixarPregacaoTxt(pregacaoAtualMin)}
                                            style={{ background: "rgba(34,197,94,.15)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 6, padding: "5px 8px", fontSize: 10, fontWeight: "bold", color: "#4ade80", cursor: "pointer", flexShrink: 0 }}>⬇️ .txt</button>
                                        </div>
                                        {pregacaoAtualMin.versiculos && <div style={{ fontSize: 11, color: T.textSub, whiteSpace: "pre-wrap", lineHeight: 1.6, marginTop: 6 }}>{pregacaoAtualMin.versiculos}</div>}
                                      </div>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quadradinhos com as próximas datas escaladas */}
                    {outrasEscalasFuturas.length > 0 && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 11, color: "#c9a84c", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>🗓️ Próximas Escalas</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                          {outrasEscalasFuturas.map(e => {
                            const d = new Date(e.data + "T12:00");
                            const ativo = escalaQuadradoExpandido === e.id;
                            return (
                              <button key={e.id} onClick={() => setEscalaQuadradoExpandido(ativo ? null : e.id)}
                                style={{ width: 56, height: 56, borderRadius: 12, border: `1px solid ${ativo ? "#c9a84c" : T.cardBorder}`, background: ativo ? "rgba(201,168,76,.18)" : T.card, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Georgia,serif" }}>
                                <span style={{ fontSize: 17, fontWeight: "bold", color: ativo ? "#c9a84c" : T.text, lineHeight: 1 }}>{d.getDate()}</span>
                                <span style={{ fontSize: 9, color: ativo ? "#c9a84c" : T.textSub, textTransform: "uppercase", marginTop: 2 }}>{d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Detalhe da escala selecionada */}
                        {outrasEscalasFuturas.filter(e => e.id === escalaQuadradoExpandido).map(e => {
                          const meusDadosAqui = e.membrosEscalados?.[user?.email];
                          const equipeAqui = Object.entries(e.membrosEscalados || {});
                          return (
                            <div key={e.id} style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, overflow: "hidden", marginBottom: 10, animation: "fadeSlideIn .3s ease" }}>
                              <div style={{ background: "linear-gradient(90deg,#c9a84c,#e8c97a)", padding: "7px 14px" }}>
                                <div style={{ fontSize: 13, fontWeight: "bold", color: "#080810" }}>{e.culto}</div>
                                <div style={{ fontSize: 11, color: "#080810" }}>{new Date(e.data + "T12:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })} {e.hora && `• ${e.hora}`}</div>
                              </div>
                              <div style={{ padding: "12px 14px" }}>
                                {meusDadosAqui && (
                                  <div style={{ background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
                                    <div style={{ fontSize: 12, fontWeight: "bold", color: "#22c55e", marginBottom: 2 }}>✅ Você está escalado!</div>
                                    {meusDadosAqui.funcoes?.length > 0 && <div style={{ fontSize: 12, color: T.textSub }}>🎤 {meusDadosAqui.funcoes.join(", ")}</div>}
                                    {meusDadosAqui.instrumentos?.length > 0 && <div style={{ fontSize: 12, color: T.textSub }}>🎸 {meusDadosAqui.instrumentos.join(", ")}</div>}
                                    {meusDadosAqui.categorias?.length > 0 && <div style={{ fontSize: 12, color: T.textSub }}>🏷️ {meusDadosAqui.categorias.join(", ")}</div>}
                                  </div>
                                )}
                                {equipeAqui.length > 0 && (
                                  <div>
                                    <div style={{ fontSize: 11, color: T.gold, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>👥 Equipe</div>
                                    {equipeAqui.map(([email, dados]) => (
                                      <div key={email} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: `1px solid ${T.cardBorder}` }}>
                                        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(201,168,76,.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: "bold", color: "#c9a84c", flexShrink: 0 }}>
                                          {dados.nome?.charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                          <div style={{ fontSize: 12, fontWeight: email === user?.email ? "bold" : "normal", color: email === user?.email ? "#c9a84c" : T.text }}>
                                            {dados.nome} {email === user?.email && "(você)"}
                                          </div>
                                          <div style={{ fontSize: 10, color: T.textSub }}>{dados.funcoes?.join(", ")}{dados.instrumentos?.length > 0 && ` • 🎸 ${dados.instrumentos.join(", ")}`}{dados.categorias?.length > 0 && `🏷️ ${dados.categorias.join(", ")}`}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {(e.musicas || []).length > 0 && (
                                  <div style={{ marginTop: 12 }}>
                                    <div style={{ fontSize: 11, color: T.gold, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>🎶 Músicas</div>
                                    {(e.musicas || []).map(mid => musicas.find(x => x.id === mid)).filter(Boolean).map((mus, i) => (
                                      <div key={i} style={{ fontSize: 12, color: T.text, padding: "4px 0" }}>🎵 {mus.titulo} <span style={{ color: T.textSub }}>— {mus.artista}</span> {mus.tom && <span style={{ color: "#c9a84c" }}>• {mus.tom}</span>}</div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
              </>
            )}
          </div>
        )}


        {/* ══ MÍDIA (exclusiva do usuário padrão) — músicas do evento + imagens + palavra do pastor ══ */}
        {tab === "midia-videos" && souUsuarioPadraoMidia && (() => {
          const hojeMidia = new Date().toISOString().split("T")[0];
          const escalaAtualLouvor = escalas.filter(e => e.ministerio === "Aliança Music" && e.data >= hojeMidia).sort((a, b) => a.data.localeCompare(b.data))[0];
          const musicasDoEvento = (escalaAtualLouvor?.musicas || []).map(mid => musicas.find(x => x.id === mid)).filter(Boolean);
          const arquivosDoMinMidia = arquivosMidia.filter(a => a.ministerio === "Mídia");
          const pregacaoAtualMidia = [...pregacoes].sort((a, b) => (b.criadoEm || "").localeCompare(a.criadoEm || ""))[0];

          return (
            <div style={{ animation: "slideUp .4s ease", paddingBottom: 20 }}>
              <div style={{ padding: "16px 16px 0" }}>
                <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#c9a84c", marginBottom: 4 }}>🎬 Mídia — Evento Atual</div>
                {escalaAtualLouvor ? (
                  <div style={{ fontSize: 12, color: T.textSub, marginBottom: 14 }}>
                    {escalaAtualLouvor.culto} — {new Date(escalaAtualLouvor.data + "T12:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })} {escalaAtualLouvor.hora && `• ${escalaAtualLouvor.hora}`}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: T.textSub, marginBottom: 14 }}>Nenhum evento futuro cadastrado ainda pelo Louvor.</div>
                )}
              </div>

              <div style={{ padding: "0 16px" }}>
                {/* Músicas escolhidas pelo Louvor */}
                <div style={{ fontSize: 11, color: T.gold, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>🎶 Músicas escolhidas pelo Louvor</div>
                {musicasDoEvento.length === 0 ? (
                  <div style={{ ...S.card, textAlign: "center", padding: "24px 0", marginLeft: 0, marginRight: 0, marginBottom: 20 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🎵</div>
                    <div style={{ fontSize: 13, color: T.textSub }}>Nenhuma música cadastrada ainda para esse evento.</div>
                  </div>
                ) : musicasDoEvento.map(m => {
                  const expandida = musicaCatalogoExpandida === m.id;
                  const ytId = getYouTubeId(m.link);
                  const spId = getSpotifyId(m.link);
                  return (
                    <div key={m.id} style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderLeft: "3px solid #c9a84c", borderRadius: 12, marginBottom: 10, overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer" }}
                        onClick={() => setMusicaCatalogoExpandida(expandida ? null : m.id)}>
                        <span style={{ fontSize: 18 }}>🎬</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: "bold", color: T.text }}>{m.titulo}</div>
                          <div style={{ fontSize: 12, color: T.textSub }}>{m.artista} {m.tom && <span style={{ color: "#c9a84c" }}>• Tom: {m.tom}</span>}</div>
                        </div>
                        <span style={{ color: T.textSub, fontSize: 16 }}>{expandida ? "▲" : "▼"}</span>
                      </div>
                      {expandida && (
                        <div style={{ padding: "0 14px 14px" }}>
                          {ytId ? (
                            <iframe width="100%" height="200" src={`https://www.youtube.com/embed/${ytId}`} frameBorder="0" allowFullScreen loading="lazy" style={{ display: "block", borderRadius: 10 }} title="Video player"/>
                          ) : spId ? (
                            <iframe src={`https://open.spotify.com/embed/${spId.type}/${spId.id}`} width="100%" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" style={{ display: "block", borderRadius: 10 }} title="Spotify player"/>
                          ) : (
                            <div style={{ fontSize: 12, color: T.textFaint, padding: "6px 0" }}>Nenhum vídeo cadastrado para esta música.</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Imagens que serão usadas no telão */}
                <div style={{ fontSize: 11, color: T.gold, letterSpacing: 1, textTransform: "uppercase", margin: "22px 0 8px" }}>🖼️ Imagens do Telão</div>
                {arquivosDoMinMidia.length === 0 ? (
                  <div style={{ ...S.card, textAlign: "center", padding: "24px 0", marginLeft: 0, marginRight: 0, marginBottom: 20 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🖼️</div>
                    <div style={{ fontSize: 13, color: T.textSub }}>Nenhuma imagem cadastrada ainda.</div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                    {arquivosDoMinMidia.map(a => (
                      <div key={a.id} style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 12, overflow: "hidden" }}>
                        <img src={a.arquivo} alt={a.titulo} style={{ width: "100%", height: 100, objectFit: "cover", display: "block" }} />
                        <div style={{ padding: "8px 10px" }}>
                          <div style={{ fontSize: 11, fontWeight: "bold", color: T.text, marginBottom: 6 }}>{a.titulo}</div>
                          <button onClick={() => baixarArquivo(a.arquivo, a.titulo)}
                            style={{ width: "100%", background: "rgba(34,197,94,.15)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 6, padding: "5px 0", fontSize: 10, fontWeight: "bold", color: "#4ade80", cursor: "pointer" }}>⬇️ Baixar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Palavra do Pastor */}
                <div style={{ fontSize: 11, color: "#8b5cf6", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>📜 Palavra do Pastor</div>
                {!pregacaoAtualMidia ? (
                  <div style={{ ...S.card, textAlign: "center", padding: "24px 0", marginLeft: 0, marginRight: 0 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📜</div>
                    <div style={{ fontSize: 13, color: T.textSub }}>O Pastor ainda não inseriu a palavra para esse evento.</div>
                  </div>
                ) : (
                  <div style={{ background: darkMode ? "rgba(139,92,246,.06)" : "rgba(139,92,246,.04)", border: "1px solid rgba(139,92,246,.2)", borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: "bold", color: T.text, flex: 1 }}>{pregacaoAtualMidia.titulo}</div>
                      <button onClick={() => baixarPregacaoTxt(pregacaoAtualMidia)}
                        style={{ background: "rgba(34,197,94,.15)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 6, padding: "6px 10px", fontSize: 11, fontWeight: "bold", color: "#4ade80", cursor: "pointer", flexShrink: 0 }}>⬇️ .txt</button>
                    </div>
                    {pregacaoAtualMidia.versiculos && <div style={{ fontSize: 12, color: T.textSub, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{pregacaoAtualMidia.versiculos}</div>}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ══ PERFIL ══ */}
        {tab === "perfil" && (
          <div style={{ padding: "0 16px 24px", animation: "slideUp .4s ease" }}>
            {/* Voltar */}
            <div style={{ padding: "16px 0 0" }}>
              <button onClick={() => setTab("mais")}
                style={{ background: "none", border: "none", color: T.gold, cursor: "pointer", fontSize: 14, fontFamily: "Georgia,serif", display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
                ‹ Voltar
              </button>
            </div>
            <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#c9a84c", marginBottom: 16 }}>Meu Perfil</div>

            {/* Avatar */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(201,168,76,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, color: "#c9a84c", fontWeight: "bold", border: "2px solid rgba(201,168,76,.4)", marginBottom: 12 }}>
                {user?.nome?.charAt(0).toUpperCase()}
              </div>
              <div style={{ fontSize: 20, fontWeight: "bold", color: "#fff", textAlign: "center" }}>{user?.nome}</div>
              <div style={{ fontSize: 13, color: "#aaa", marginTop: 4 }}>{user?.email}</div>
              {(!user?.celular || !user?.sexo || !user?.estadoCivil) && (
                <div style={{ marginTop: 12, background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.3)", borderRadius: 10, padding: "8px 14px", fontSize: 12, color: "#c9a84c", textAlign: "center" }}>
                  ⚠️ Seu cadastro está incompleto. Complete abaixo!
                </div>
              )}
            </div>

            {/* Dados atuais */}
            {[
              { label: "Celular", valor: user?.celular, icon: "📱" },
              { label: "Sexo", valor: user?.sexo, icon: "👤" },
              { label: "Estado Civil", valor: user?.estadoCivil, icon: "💍" },
              { label: "Data de Nascimento", valor: user?.dataNascimento || null, icon: "🎂" },
              { label: "Batizado(a)", valor: user?.batizado === "sim" ? "Sim" : user?.batizado === "nao" ? "Não" : null, icon: "✝️" },
              { label: "Igreja do Batismo", valor: user?.igrejaBAT, icon: "⛪" },
              { label: "Data do Batismo", valor: user?.dataBAT || null, icon: "📅" },
            ].filter(d => d.valor).map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{d.icon}</span>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#aaa", marginBottom: 2 }}>{d.label}</div>
                  <div style={{ fontSize: 14, fontWeight: "bold", color: "#fff" }}>{d.valor}</div>
                </div>
              </div>
            ))}

            {/* Formulário edição */}
            <div style={{ fontSize: 13, fontWeight: "bold", color: "#c9a84c", marginTop: 20, marginBottom: 12 }}>
              ✏️ {(!user?.celular || !user?.sexo) ? "Complete" : "Edite"} seus dados
            </div>

            <input style={S.input} placeholder="Nome completo *" value={completarForm.nome ?? (user?.nome || "")}
              onChange={e => setCompletarForm({ ...completarForm, nome: e.target.value })} />
            <input style={S.input} placeholder="Celular (WhatsApp) *" type="tel" value={completarForm.celular ?? (user?.celular || "")}
              onChange={e => setCompletarForm({ ...completarForm, celular: e.target.value })} />
            <select style={{ ...S.input, color: (completarForm.sexo ?? user?.sexo) ? "inherit" : "#888" }}
              value={completarForm.sexo ?? (user?.sexo || "")}
              onChange={e => setCompletarForm({ ...completarForm, sexo: e.target.value })}>
              <option value="">Sexo *</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
            </select>
            <select style={{ ...S.input, color: (completarForm.estadoCivil ?? user?.estadoCivil) ? "inherit" : "#888" }}
              value={completarForm.estadoCivil ?? (user?.estadoCivil || "")}
              onChange={e => setCompletarForm({ ...completarForm, estadoCivil: e.target.value })}>
              <option value="">Estado Civil *</option>
              <option value="Solteiro(a)">Solteiro(a)</option>
              <option value="Casado(a)">Casado(a)</option>
              <option value="Divorciado(a)">Divorciado(a)</option>
              <option value="Viúvo(a)">Viúvo(a)</option>
              <option value="União Estável">União Estável</option>
            </select>
            <div style={{ fontSize: 11, color: "#c9a84c", marginBottom: 4 }}>Data de Nascimento *</div>
            <input style={S.input} type="text" inputMode="numeric" placeholder="DD/MM/AAAA *" maxLength={10} value={completarForm.dataNascimento ?? (user?.dataNascimento || "")}
              onChange={e => { let v=e.target.value.replace(/\D/g,""); if(v.length>=2)v=v.slice(0,2)+"/"+v.slice(2); if(v.length>=5)v=v.slice(0,5)+"/"+v.slice(5); setCompletarForm({ ...completarForm, dataNascimento: v }); }} />
            <div style={{ fontSize: 13, color: "#c9a84c", marginBottom: 8, fontWeight: "bold" }}>É Batizado(a)?</div>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              {["sim", "nao"].map(v => (
                <button key={v} onClick={() => setCompletarForm({ ...completarForm, batizado: v, ...(v === "nao" ? { igrejaBAT: "", dataBAT: "" } : {}) })}
                  style={{ flex: 1, padding: "10px", borderRadius: 10, border: `2px solid ${(completarForm.batizado ?? user?.batizado) === v ? "#c9a84c" : "rgba(255,255,255,.2)"}`, background: (completarForm.batizado ?? user?.batizado) === v ? "rgba(201,168,76,.15)" : "transparent", color: (completarForm.batizado ?? user?.batizado) === v ? "#c9a84c" : "#aaa", fontWeight: "bold", cursor: "pointer" }}>
                  {v === "sim" ? "✅ Sim" : "❌ Não"}
                </button>
              ))}
            </div>
            {(completarForm.batizado ?? user?.batizado) === "sim" && (
              <>
                <input style={S.input} placeholder="Em qual Igreja foi batizado(a)?" value={completarForm.igrejaBAT ?? (user?.igrejaBAT || "")}
                  onChange={e => setCompletarForm({ ...completarForm, igrejaBAT: e.target.value })} />
                <div style={{ fontSize: 11, color: "#c9a84c", marginBottom: 4 }}>Data do Batismo</div>
                <input style={S.input} type="text" inputMode="numeric" placeholder="DD/MM/AAAA" maxLength={10} value={completarForm.dataBAT ?? (user?.dataBAT || "")}
                  onChange={e => { let v=e.target.value.replace(/\D/g,""); if(v.length>=2)v=v.slice(0,2)+"/"+v.slice(2); if(v.length>=5)v=v.slice(0,5)+"/"+v.slice(5); setCompletarForm({ ...completarForm, dataBAT: v }); }} />
              </>
            )}

            <button style={S.saveBtn} onClick={salvarCadastroCompleto}>💾 Salvar alterações</button>
          </div>
        )}

        {/* ══ PAINEL LÍDER ══ */}
        {tab === "admin" && isLider && !isAdmin && (
          <div style={{ animation: "slideUp .4s ease" }}>
            <div style={S.adminHeader}>
              <div style={S.adminTitle}>🏛️ Painel do Líder</div>
              <div style={{ fontSize: 12, color: T.textSub, marginTop: 4 }}>Ministério: <span style={{ color: T.gold, fontWeight: "bold" }}>{ministerioLider}</span></div>
            </div>

            {/* Seletor de ministério — quando lidera mais de um */}
            {meusMinisteriosLider.length > 1 && (
              <div style={{ padding: "0 16px 12px" }}>
                <div style={{ fontSize: 11, color: T.textSub, marginBottom: 6 }}>Trocar ministério gerenciado:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {meusMinisteriosLider.map(min => (
                    <button key={min} onClick={() => { setMinisterioLider(min); setAdminTab("membros-min"); setEventoModo("novo"); }}
                      style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${ministerioLider === min ? "#c9a84c" : T.cardBorder}`, background: ministerioLider === min ? "rgba(201,168,76,.15)" : T.card, color: ministerioLider === min ? "#c9a84c" : T.textSub, fontSize: 12, fontWeight: ministerioLider === min ? "bold" : "normal", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                      {min}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs do líder */}
            <div style={S.adminTabs}>
              {(ministerioLider === "Aliança Music"
                ? ["membros-min", "avisos-min", "eventos-min", "musica-min"]
                : ministerioLider === "Mídia"
                ? ["membros-min", "avisos-min", "eventos-min", "arquivos-min"]
                : ["membros-min", "avisos-min", "eventos-min"]
              ).map(t => (
                <button key={t} style={S.adminTab(adminTab === t)} onClick={() => setAdminTab(t)}>
                  {{ "membros-min": "👥 Membros", "avisos-min": "📢 Avisos", "eventos-min": "📅 Eventos", "musica-min": "🎵 Música", "arquivos-min": "🖼️ Arquivos" }[t]}
                </button>
              ))}
            </div>

            {/* Membros do Ministério */}
            {adminTab === "membros-min" && (() => {
              const membrosMin = membros.filter(m => m.ministerios?.includes(ministerioLider));
              const membrosForaMin = membros.filter(m => !m.ministerios?.includes(ministerioLider) && !m.admin);
              const isMusical = ministerioLider === "Aliança Music";
              const categoriasMin = categoriasEquipe.filter(c => c.ministerio === ministerioLider);
              const perfilKey = isMusical
                ? `perfilMusical_${ministerioLider.replace(/\s/g, "_")}`
                : `perfilCategorias_${ministerioLider.replace(/\s/g, "_")}`;

              const addMembro = async (m) => {
                const mins = m.ministerios || [];
                if (!mins.includes(ministerioLider)) {
                  const novosMins = [...mins, ministerioLider];
                  await updateDoc(doc(db, "membros", m.email), {
                    ministerios: novosMins,
                    [perfilKey]: isMusical ? perfilMusical : perfilCategorias
                  });
                  if (user?.email === m.email) {
                    const novoUser = { ...user, ministerios: novosMins };
                    store.set(SK.user, novoUser);
                    setUser(novoUser);
                  }
                  setMembroParaAdicionar(null);
                  setPerfilMusical({ funcoes: [], instrumentos: [] });
                  setPerfilCategorias({ categorias: [] });
                  setMostrarAdicionar(false);
                  showToast(`✅ ${m.nome} adicionado ao ministério!`);
                }
              };

              const removerMembro = async (m) => {
                const mins = (m.ministerios || []).filter(mn => mn !== ministerioLider);
                await updateDoc(doc(db, "membros", m.email), { ministerios: mins });
                showToast(`↩️ ${m.nome} removido do ministério`);
              };

              const adicionarCategoria = async () => {
                const nome = novaCategoriaNome.trim();
                if (!nome) { showToast("⚠️ Informe o nome da categoria!"); return; }
                if (categoriasMin.some(c => c.nome.toLowerCase() === nome.toLowerCase())) { showToast("⚠️ Essa categoria já existe!"); return; }
                await addDoc(collection(db, "categoriasEquipe"), { ministerio: ministerioLider, nome });
                setNovaCategoriaNome("");
                showToast(`✅ Categoria "${nome}" criada!`);
              };

              const editarCategoria = async (cat) => {
                const novoNome = categoriaEditNome.trim();
                if (!novoNome) { showToast("⚠️ Informe o novo nome!"); return; }
                if (novoNome !== cat.nome && categoriasMin.some(c => c.nome.toLowerCase() === novoNome.toLowerCase())) { showToast("⚠️ Já existe uma categoria com esse nome!"); return; }
                await updateDoc(doc(db, "categoriasEquipe", cat.id), { nome: novoNome });
                // Propaga o novo nome para os membros que já tinham essa categoria atribuída
                const afetados = membrosMin.filter(m => m[perfilKey]?.categorias?.includes(cat.nome));
                for (const m of afetados) {
                  const novasCats = m[perfilKey].categorias.map(c => c === cat.nome ? novoNome : c);
                  await updateDoc(doc(db, "membros", m.email), { [perfilKey]: { categorias: novasCats } });
                }
                setCategoriaEditando(null);
                setCategoriaEditNome("");
                showToast(`✅ Categoria renomeada para "${novoNome}"!`);
              };

              const excluirCategoria = async (cat) => {
                const afetados = membrosMin.filter(m => m[perfilKey]?.categorias?.includes(cat.nome));
                const msg = afetados.length > 0
                  ? `Excluir "${cat.nome}"? ${afetados.length} membro(s) perderão essa categoria.`
                  : `Excluir a categoria "${cat.nome}"?`;
                if (!window.confirm(msg)) return;
                await deleteDoc(doc(db, "categoriasEquipe", cat.id));
                for (const m of afetados) {
                  const novasCats = m[perfilKey].categorias.filter(c => c !== cat.nome);
                  await updateDoc(doc(db, "membros", m.email), { [perfilKey]: { categorias: novasCats } });
                }
                showToast(`🗑️ Categoria "${cat.nome}" excluída!`);
              };

              return (
                <div style={{ padding: "0 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: "bold", color: T.gold }}>👥 Membros — {ministerioLider}</div>
                    <span style={{ fontSize: 12, color: T.textSub }}>{membrosMin.length} membro(s)</span>
                  </div>
                  <div style={{ fontSize: 12, color: T.textSub, marginBottom: 16 }}>Gerencie os membros do seu ministério</div>

                  {/* Gerenciar categorias (ministérios não-musicais) */}
                  {!isMusical && (
                    <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: "12px 14px", marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: "bold", color: T.gold, marginBottom: 8 }}>🏷️ Categorias da Equipe</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                        {categoriasMin.length === 0 && <span style={{ fontSize: 12, color: T.textFaint }}>Nenhuma categoria criada ainda</span>}
                        {categoriasMin.map(c => (
                          categoriaEditando === c.id ? (
                            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <input autoFocus style={{ ...S.input, marginBottom: 0, width: 120, padding: "4px 8px", fontSize: 11 }}
                                value={categoriaEditNome} onChange={e => setCategoriaEditNome(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") editarCategoria(c); if (e.key === "Escape") setCategoriaEditando(null); }} />
                              <button onClick={() => editarCategoria(c)} style={{ background: "rgba(34,197,94,.15)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 6, padding: "4px 8px", fontSize: 11, color: "#4ade80", cursor: "pointer" }}>✓</button>
                              <button onClick={() => setCategoriaEditando(null)} style={{ background: "rgba(150,150,150,.15)", border: `1px solid ${T.cardBorder}`, borderRadius: 6, padding: "4px 8px", fontSize: 11, color: T.textSub, cursor: "pointer" }}>✕</button>
                            </div>
                          ) : (
                            <span key={c.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, background: "rgba(6,182,212,.12)", color: "#22d3ee", border: "1px solid rgba(6,182,212,.3)", borderRadius: 20, padding: "4px 6px 4px 10px" }}>
                              {c.nome}
                              <button onClick={() => { setCategoriaEditando(c.id); setCategoriaEditNome(c.nome); }} style={{ background: "none", border: "none", color: "#22d3ee", cursor: "pointer", fontSize: 11, padding: 0 }}>✏️</button>
                              <button onClick={() => excluirCategoria(c)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 11, padding: 0 }}>🗑️</button>
                            </span>
                          )
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input style={{ ...S.input, marginBottom: 0, flex: 1 }} placeholder="Ex: Câmera, Letra, Transmissão..."
                          value={novaCategoriaNome} onChange={e => setNovaCategoriaNome(e.target.value)} />
                        <button onClick={adicionarCategoria}
                          style={{ background: "linear-gradient(90deg,#06b6d4,#22d3ee)", border: "none", borderRadius: 10, padding: "0 16px", fontSize: 12, fontWeight: "bold", color: "#04202a", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                          + Nova
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Botão adicionar */}
                  <button style={{ ...S.saveBtn, marginBottom: 16 }}
                    onClick={() => setMostrarAdicionar(v => !v)}>
                    {mostrarAdicionar ? "✕ Fechar busca" : "➕ Adicionar membro"}
                  </button>

                  {/* Busca para adicionar */}
                  {mostrarAdicionar && (
                    <div style={{ marginBottom: 16 }}>
                      {!membroParaAdicionar ? (
                        <>
                          <input style={{ ...S.input, marginBottom: 8 }}
                            placeholder="🔍 Buscar membro para adicionar..."
                            value={buscaAddMin}
                            onChange={e => setBuscaAddMin(e.target.value)} />
                          {buscaAddMin.trim().length > 1 && (
                            <div style={{ background: darkMode ? "#07112a" : "#fff", border: `1px solid ${T.cardBorder}`, borderRadius: 12, overflow: "hidden" }}>
                              {membrosForaMin
                                .filter(m => m.nome?.toLowerCase().includes(buscaAddMin.toLowerCase()) || m.email?.toLowerCase().includes(buscaAddMin.toLowerCase()))
                                .slice(0, 8)
                                .map(m => (
                                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: `1px solid ${T.cardBorder}` }}>
                                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(201,168,76,.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: "bold", color: "#c9a84c", flexShrink: 0 }}>
                                      {m.nome?.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: 13, fontWeight: "bold", color: T.text }}>{m.nome}</div>
                                      <div style={{ fontSize: 11, color: T.textSub }}>{m.celular || m.email}</div>
                                    </div>
                                    <button onClick={() => { setMembroParaAdicionar(m); setBuscaAddMin(""); setPerfilMusical({ funcoes: [], instrumentos: [] }); setPerfilCategorias({ categorias: [] }); }}
                                      style={{ background: "linear-gradient(90deg,#c9a84c,#e8c97a)", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: "bold", color: "#080810", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                                      Selecionar
                                    </button>
                                  </div>
                                ))}
                              {membrosForaMin.filter(m => m.nome?.toLowerCase().includes(buscaAddMin.toLowerCase())).length === 0 && (
                                <div style={{ padding: "12px 14px", fontSize: 13, color: T.textSub }}>Nenhum membro encontrado</div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        /* Formulário de perfil */
                        <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: "14px 16px" }}>
                          {/* Header membro selecionado */}
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${T.cardBorder}` }}>
                            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(201,168,76,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: "bold", color: "#c9a84c" }}>
                              {membroParaAdicionar.nome?.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: "bold", color: T.text }}>{membroParaAdicionar.nome}</div>
                              <div style={{ fontSize: 11, color: T.textSub }}>{isMusical ? "Definindo perfil musical" : "Definindo categoria(s)"}</div>
                            </div>
                            <button onClick={() => setMembroParaAdicionar(null)}
                              style={{ background: "none", border: "none", color: T.textFaint, cursor: "pointer", fontSize: 18 }}>×</button>
                          </div>

                          {isMusical ? (
                            <>
                              {/* Função vocal */}
                              <div style={{ marginBottom: 14 }}>
                                <div style={{ fontSize: 12, color: T.gold, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>🎤 Função Vocal</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                  {["Ministro(a)", "Soprano", "Contralto", "Tenor", "Barítono"].map(f => (
                                    <button key={f} onClick={() => {
                                      const atual = perfilMusical.funcoes;
                                      setPerfilMusical({ ...perfilMusical, funcoes: atual.includes(f) ? atual.filter(x => x !== f) : [...atual, f] });
                                    }} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${perfilMusical.funcoes.includes(f) ? "#c9a84c" : T.cardBorder}`, background: perfilMusical.funcoes.includes(f) ? "rgba(201,168,76,.2)" : "transparent", color: perfilMusical.funcoes.includes(f) ? "#c9a84c" : T.textSub, fontSize: 12, cursor: "pointer", fontFamily: "Georgia,serif", fontWeight: perfilMusical.funcoes.includes(f) ? "bold" : "normal" }}>
                                      {f}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Instrumento */}
                              <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 12, color: T.gold, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>🎸 Instrumento(s)</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                  {["Violão", "Teclado", "Bateria", "Baixo", "Guitarra", "Flauta", "Violino", "Percussão"].map(i => (
                                    <button key={i} onClick={() => {
                                      const atual = perfilMusical.instrumentos;
                                      setPerfilMusical({ ...perfilMusical, instrumentos: atual.includes(i) ? atual.filter(x => x !== i) : [...atual, i] });
                                    }} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${perfilMusical.instrumentos.includes(i) ? "#8b5cf6" : T.cardBorder}`, background: perfilMusical.instrumentos.includes(i) ? "rgba(139,92,246,.2)" : "transparent", color: perfilMusical.instrumentos.includes(i) ? "#a78bfa" : T.textSub, fontSize: 12, cursor: "pointer", fontFamily: "Georgia,serif", fontWeight: perfilMusical.instrumentos.includes(i) ? "bold" : "normal" }}>
                                      {i}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Resumo selecionado */}
                              {(perfilMusical.funcoes.length > 0 || perfilMusical.instrumentos.length > 0) && (
                                <div style={{ background: "rgba(201,168,76,.06)", border: "1px solid rgba(201,168,76,.15)", borderRadius: 10, padding: "8px 12px", marginBottom: 12, fontSize: 12, color: T.textSub }}>
                                  {perfilMusical.funcoes.length > 0 && <div>🎤 {perfilMusical.funcoes.join(", ")}</div>}
                                  {perfilMusical.instrumentos.length > 0 && <div>🎸 {perfilMusical.instrumentos.join(", ")}</div>}
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              {/* Categorias dinâmicas */}
                              <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 12, color: T.gold, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>🏷️ Categoria(s)</div>
                                {categoriasMin.length === 0 ? (
                                  <div style={{ fontSize: 12, color: T.textFaint }}>Nenhuma categoria criada. Crie uma categoria acima primeiro.</div>
                                ) : (
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                    {categoriasMin.map(c => (
                                      <button key={c.id} onClick={() => {
                                        const atual = perfilCategorias.categorias;
                                        setPerfilCategorias({ categorias: atual.includes(c.nome) ? atual.filter(x => x !== c.nome) : [...atual, c.nome] });
                                      }} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${perfilCategorias.categorias.includes(c.nome) ? "#06b6d4" : T.cardBorder}`, background: perfilCategorias.categorias.includes(c.nome) ? "rgba(6,182,212,.2)" : "transparent", color: perfilCategorias.categorias.includes(c.nome) ? "#22d3ee" : T.textSub, fontSize: 12, cursor: "pointer", fontFamily: "Georgia,serif", fontWeight: perfilCategorias.categorias.includes(c.nome) ? "bold" : "normal" }}>
                                        {c.nome}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {perfilCategorias.categorias.length > 0 && (
                                <div style={{ background: "rgba(6,182,212,.06)", border: "1px solid rgba(6,182,212,.15)", borderRadius: 10, padding: "8px 12px", marginBottom: 12, fontSize: 12, color: T.textSub }}>
                                  🏷️ {perfilCategorias.categorias.join(", ")}
                                </div>
                              )}
                            </>
                          )}

                          <button onClick={() => addMembro(membroParaAdicionar)}
                            style={{ ...S.saveBtn, marginTop: 0 }}>
                            ✅ Confirmar e Adicionar
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lista de membros do ministério */}
                  {membrosMin.length === 0 ? (
                    <div style={{ ...S.card, textAlign: "center", padding: "28px 0", marginLeft: 0, marginRight: 0 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
                      <div style={{ fontSize: 13, color: T.textSub }}>Nenhum membro neste ministério ainda</div>
                      <div style={{ fontSize: 12, color: T.textFaint, marginTop: 4 }}>Use o botão acima para adicionar</div>
                    </div>
                  ) : membrosMin.map(m => {
                    const perfil = m[perfilKey];
                    const usuarioPadraoKey = `usuarioPadrao_${ministerioLider.replace(/\s/g, "_")}`;
                    const ehPadrao = !!m[usuarioPadraoKey];
                    return (
                    <div key={m.id}>
                    <div style={{ ...S.card, marginLeft: 0, marginRight: 0, marginBottom: membroEditandoPerfil === m.email ? 0 : 10, display: "flex", alignItems: "flex-start", gap: 12, border: ehPadrao ? "1px solid rgba(201,168,76,.4)" : undefined, borderBottomLeftRadius: membroEditandoPerfil === m.email ? 0 : undefined, borderBottomRightRadius: membroEditandoPerfil === m.email ? 0 : undefined }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(201,168,76,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: "bold", color: T.gold, flexShrink: 0 }}>
                        {m.nome?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: "bold", color: T.text }}>{m.nome}</div>
                        <div style={{ fontSize: 11, color: T.textSub }}>{m.celular || m.email}</div>
                        {ehPadrao && (
                          <div style={{ fontSize: 10, color: "#c9a84c", marginTop: 3, fontWeight: "bold" }}>📌 Usuário Padrão — sempre recebe tudo</div>
                        )}
                        {isMusical ? (
                          perfil && (perfil.funcoes?.length > 0 || perfil.instrumentos?.length > 0) && (
                            <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {(perfil.funcoes || []).map(f => (
                                <span key={f} style={{ fontSize: 10, background: "rgba(201,168,76,.15)", color: "#c9a84c", border: "1px solid rgba(201,168,76,.3)", borderRadius: 20, padding: "2px 8px" }}>🎤 {f}</span>
                              ))}
                              {(perfil.instrumentos || []).map(i => (
                                <span key={i} style={{ fontSize: 10, background: "rgba(139,92,246,.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,.3)", borderRadius: 20, padding: "2px 8px" }}>🎸 {i}</span>
                              ))}
                            </div>
                          )
                        ) : (
                          perfil && perfil.categorias?.length > 0 && (
                            <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {(perfil.categorias || []).map(c => (
                                <span key={c} style={{ fontSize: 10, background: "rgba(6,182,212,.15)", color: "#22d3ee", border: "1px solid rgba(6,182,212,.3)", borderRadius: 20, padding: "2px 8px" }}>🏷️ {c}</span>
                              ))}
                            </div>
                          )
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={async () => {
                          await updateDoc(doc(db, "membros", m.email), { [usuarioPadraoKey]: !ehPadrao });
                          showToast(ehPadrao ? `↩️ ${m.nome} não é mais Usuário Padrão` : `📌 ${m.nome} agora é Usuário Padrão — sempre recebe tudo!`);
                        }} title="Usuário Padrão: sempre recebe tudo, mesmo sem estar escalado"
                          style={{ background: ehPadrao ? "rgba(201,168,76,.2)" : "transparent", border: `1px solid ${ehPadrao ? "#c9a84c" : T.cardBorder}`, borderRadius: 8, padding: "6px 10px", fontSize: 14, cursor: "pointer" }}>📌</button>
                        <button onClick={() => {
                          if (membroEditandoPerfil === m.email) { setMembroEditandoPerfil(null); return; }
                          setMembroEditandoPerfil(m.email);
                          setPerfilEmEdicao({ funcoes: perfil?.funcoes || [], instrumentos: perfil?.instrumentos || [], categorias: perfil?.categorias || [] });
                        }} title="Editar categorias/perfil"
                          style={{ background: membroEditandoPerfil === m.email ? "rgba(201,168,76,.2)" : "transparent", border: `1px solid ${membroEditandoPerfil === m.email ? "#c9a84c" : T.cardBorder}`, borderRadius: 8, padding: "6px 10px", fontSize: 14, cursor: "pointer" }}>✏️</button>
                        {m.celular && (
                          <button onClick={() => window.open(`https://wa.me/55${m.celular.replace(/\D/g, "")}`, "_blank")}
                            style={{ background: "#25d366", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 14, cursor: "pointer" }}>💬</button>
                        )}
                        <button onClick={() => { if (window.confirm(`Remover ${m.nome} do ministério?`)) removerMembro(m); }}
                          style={S.delBtn}>🗑️</button>
                      </div>
                    </div>

                    {/* Painel de edição de categorias/perfil */}
                    {membroEditandoPerfil === m.email && (
                      <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderTop: "none", borderRadius: "0 0 14px 14px", padding: "14px 16px", marginBottom: 10 }}>
                        {isMusical ? (
                          <>
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ fontSize: 11, color: T.gold, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>🎤 Função Vocal</div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {["Ministro(a)", "Soprano", "Contralto", "Tenor", "Barítono"].map(f => (
                                  <button key={f} onClick={() => {
                                    const atual = perfilEmEdicao.funcoes;
                                    setPerfilEmEdicao({ ...perfilEmEdicao, funcoes: atual.includes(f) ? atual.filter(x => x !== f) : [...atual, f] });
                                  }} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${perfilEmEdicao.funcoes.includes(f) ? "#c9a84c" : T.cardBorder}`, background: perfilEmEdicao.funcoes.includes(f) ? "rgba(201,168,76,.2)" : "transparent", color: perfilEmEdicao.funcoes.includes(f) ? "#c9a84c" : T.textSub, fontSize: 12, cursor: "pointer", fontFamily: "Georgia,serif", fontWeight: perfilEmEdicao.funcoes.includes(f) ? "bold" : "normal" }}>
                                    {f}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div style={{ marginBottom: 14 }}>
                              <div style={{ fontSize: 11, color: T.gold, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>🎸 Instrumento(s)</div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {["Violão", "Teclado", "Bateria", "Baixo", "Guitarra", "Flauta", "Violino", "Percussão"].map(i => (
                                  <button key={i} onClick={() => {
                                    const atual = perfilEmEdicao.instrumentos;
                                    setPerfilEmEdicao({ ...perfilEmEdicao, instrumentos: atual.includes(i) ? atual.filter(x => x !== i) : [...atual, i] });
                                  }} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${perfilEmEdicao.instrumentos.includes(i) ? "#8b5cf6" : T.cardBorder}`, background: perfilEmEdicao.instrumentos.includes(i) ? "rgba(139,92,246,.2)" : "transparent", color: perfilEmEdicao.instrumentos.includes(i) ? "#a78bfa" : T.textSub, fontSize: 12, cursor: "pointer", fontFamily: "Georgia,serif", fontWeight: perfilEmEdicao.instrumentos.includes(i) ? "bold" : "normal" }}>
                                    {i}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 11, color: T.gold, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>🏷️ Categoria(s)</div>
                            {categoriasMin.length === 0 ? (
                              <div style={{ fontSize: 12, color: T.textFaint }}>Nenhuma categoria criada ainda.</div>
                            ) : (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {categoriasMin.map(c => (
                                  <button key={c.id} onClick={() => {
                                    const atual = perfilEmEdicao.categorias;
                                    setPerfilEmEdicao({ ...perfilEmEdicao, categorias: atual.includes(c.nome) ? atual.filter(x => x !== c.nome) : [...atual, c.nome] });
                                  }} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${perfilEmEdicao.categorias.includes(c.nome) ? "#06b6d4" : T.cardBorder}`, background: perfilEmEdicao.categorias.includes(c.nome) ? "rgba(6,182,212,.2)" : "transparent", color: perfilEmEdicao.categorias.includes(c.nome) ? "#22d3ee" : T.textSub, fontSize: 12, cursor: "pointer", fontFamily: "Georgia,serif", fontWeight: perfilEmEdicao.categorias.includes(c.nome) ? "bold" : "normal" }}>
                                    {c.nome}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={async () => {
                            await updateDoc(doc(db, "membros", m.email), {
                              [perfilKey]: isMusical
                                ? { funcoes: perfilEmEdicao.funcoes, instrumentos: perfilEmEdicao.instrumentos }
                                : { categorias: perfilEmEdicao.categorias }
                            });
                            setMembroEditandoPerfil(null);
                            showToast(`✅ Perfil de ${m.nome} atualizado!`);
                          }} style={{ ...S.saveBtn, marginTop: 0, flex: 1 }}>💾 Salvar</button>
                          <button onClick={() => setMembroEditandoPerfil(null)}
                            style={{ padding: "0 16px", background: "transparent", border: `1px solid ${T.cardBorder}`, borderRadius: 10, color: T.textSub, fontSize: 13, cursor: "pointer", fontFamily: "Georgia,serif" }}>Cancelar</button>
                        </div>
                      </div>
                    )}
                    </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Avisos do Ministério */}
            {adminTab === "avisos-min" && (
              <div style={{ padding: "0 16px" }}>
                <div style={{ fontSize: 14, fontWeight: "bold", color: T.gold, marginBottom: 4 }}>📢 Avisos — {ministerioLider}</div>
                <div style={{ fontSize: 12, color: T.textSub, marginBottom: 16 }}>Publique avisos para o seu ministério</div>
                <label style={S.label}>Título *</label>
                <input style={{ ...S.input, marginBottom: 0 }} placeholder="Título do aviso..."
                  value={novoAviso.titulo} onChange={e => setNovoAviso({ ...novoAviso, titulo: e.target.value })} />
                <label style={S.label}>Mensagem *</label>
                <textarea style={{ ...S.textarea, minHeight: 100 }} placeholder="Escreva o aviso..."
                  value={novoAviso.texto} onChange={e => setNovoAviso({ ...novoAviso, texto: e.target.value })} />
                <button style={S.saveBtn} onClick={async () => {
                  if (!novoAviso.titulo || !novoAviso.texto) { showToast("⚠️ Preencha título e mensagem!"); return; }
                  await addDoc(collection(db, "avisos"), {
                    ...novoAviso, tipo: "info",
                    ministerio: ministerioLider,
                    data: new Date().toISOString().split("T")[0]
                  });
                  setNovoAviso({ titulo: "", texto: "", tipo: "info" });
                  showToast("✅ Aviso publicado!");
                }}>📢 Publicar Aviso</button>
                {/* Lista de avisos do ministério */}
                {avisos.filter(a => a.ministerio === ministerioLider).length > 0 && (
                  <>
                    <div style={{ fontSize: 12, color: T.gold, marginTop: 20, marginBottom: 10, letterSpacing: 2, textTransform: "uppercase" }}>Avisos publicados</div>
                    {avisos.filter(a => a.ministerio === ministerioLider).map(av => (
                      <div key={av.id} style={{ ...S.card, marginLeft: 0, marginRight: 0, marginBottom: 8, display: "flex", gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: "bold", color: T.gold }}>{av.titulo}</div>
                          <div style={{ fontSize: 12, color: T.textSub }}>{av.texto}</div>
                        </div>
                        <button style={S.delBtn} onClick={async () => {
                          if (window.confirm("Excluir aviso?")) { await deleteDoc(doc(db, "avisos", av.id)); showToast("🗑️ Removido!"); }
                        }}>🗑️</button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Eventos do Ministério */}
            {adminTab === "eventos-min" && (() => {
              const membrosMin = membros.filter(m => m.ministerios?.includes(ministerioLider));
              const isMusical = ministerioLider === "Aliança Music";
              const perfilKeyEv = isMusical
                ? `perfilMusical_${ministerioLider.replace(/\s/g, "_")}`
                : `perfilCategorias_${ministerioLider.replace(/\s/g, "_")}`;
              const CATEGORIAS = isMusical
                ? ["Ministro(a)", "Soprano", "Contralto", "Tenor", "Barítono", "Violão", "Teclado", "Bateria", "Baixo", "Guitarra", "Flauta", "Violino", "Percussão"]
                : categoriasEquipe.filter(c => c.ministerio === ministerioLider).map(c => c.nome);
              const FUNCOES_VOCAIS = ["Ministro(a)", "Soprano", "Contralto", "Tenor", "Barítono"];

              // Retorna membros que têm aquela função/instrumento (musical) ou categoria (genérico)
              const membrosPorCategoria = (cat) => {
                return membrosMin.filter(m => {
                  const perfil = m[perfilKeyEv];
                  if (!perfil) return false;
                  if (isMusical) {
                    const todasFuncoes = [...(perfil.funcoes || []), ...(perfil.instrumentos || [])];
                    return todasFuncoes.includes(cat);
                  }
                  return (perfil.categorias || []).includes(cat);
                });
              };

              // Eventos deste ministério (próprios + vinculados) — sem duplicar quando um evento bate nos dois filtros
              const eventosMinBrutos = [
                ...agenda.filter(e => e.ministerio === ministerioLider && !e.funcoes),
                ...agenda.filter(e => e.ministeriosVinculados?.includes(ministerioLider))
              ];
              const eventosMin = Array.from(new Map(eventosMinBrutos.map(e => [e.id, e])).values())
                .sort((a, b) => a.data?.localeCompare(b.data));

              // Líderes do Aliança Music e Mídia podem editar qualquer evento da agenda da igreja
              const podeEditarAgendaCompleta = ministerioLider === "Aliança Music" || ministerioLider === "Mídia";

              // Buscar ou criar escala para um evento
              const escalaDoEvento = (eventoId) => escalas.find(e =>
                e.ministerio === ministerioLider &&
                eventoId &&
                (e.eventoId === eventoId || e.eventoRef === eventoId)
              );

              if (eventoEscalaAberto) {
                // ── TELA DE MONTAGEM DA ESCALA ──
                const escala = escalaDoEvento(eventoEscalaAberto.id);
                const escalados = escala?.membrosEscalados || {};

                return (
                  <div style={{ padding: "0 16px" }}>
                    <button onClick={() => { setEventoEscalaAberto(null); setCategoriaEscala(null); }}
                      style={{ background: "none", border: "none", color: T.gold, cursor: "pointer", fontSize: 13, fontFamily: "Georgia,serif", marginBottom: 12 }}>← Voltar aos eventos</button>

                    {/* Header do evento */}
                    <div style={{ background: "linear-gradient(90deg,#c9a84c,#e8c97a)", borderRadius: "14px 14px 0 0", padding: "10px 16px" }}>
                      <div style={{ fontSize: 14, fontWeight: "bold", color: "#080810" }}>{eventoEscalaAberto.titulo}</div>
                      <div style={{ fontSize: 11, color: "#080810" }}>{new Date(eventoEscalaAberto.data + "T12:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })} {eventoEscalaAberto.hora && `• ${eventoEscalaAberto.hora}`}</div>
                    </div>
                    <div style={{ background: T.card, border: `1px solid rgba(201,168,76,.3)`, borderTop: "none", borderRadius: "0 0 14px 14px", padding: "14px 16px", marginBottom: 14 }}>

                      {/* Resumo escalados */}
                      {Object.keys(escalados).length > 0 && (
                        <div style={{ background: "rgba(34,197,94,.06)", border: "1px solid rgba(34,197,94,.2)", borderRadius: 10, padding: "10px 12px", marginBottom: 14 }}>
                          <div style={{ fontSize: 11, color: "#22c55e", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>✅ {Object.keys(escalados).length} escalado(s)</div>
                          {Object.entries(escalados).map(([email, dados]) => (
                            <div key={email} style={{ fontSize: 12, color: T.textSub, marginBottom: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span>• {dados.nome}</span>
                              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                {isMusical ? (
                                  <>
                                    {dados.funcoes?.map(f => <span key={f} style={{ fontSize: 10, color: "#c9a84c", background: "rgba(201,168,76,.1)", borderRadius: 10, padding: "1px 6px" }}>{f}</span>)}
                                    {dados.instrumentos?.map(i => <span key={i} style={{ fontSize: 10, color: "#a78bfa", background: "rgba(139,92,246,.1)", borderRadius: 10, padding: "1px 6px" }}>🎸{i}</span>)}
                                  </>
                                ) : (
                                  dados.categorias?.map(c => <span key={c} style={{ fontSize: 10, color: "#22d3ee", background: "rgba(6,182,212,.1)", borderRadius: 10, padding: "1px 6px" }}>{c}</span>)
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Grid de categorias */}
                      {CATEGORIAS.length === 0 ? (
                        <div style={{ fontSize: 12, color: T.textFaint, marginBottom: 16 }}>Nenhuma categoria criada ainda. Crie categorias na aba Membros primeiro.</div>
                      ) : (
                      <>
                      <div style={{ fontSize: 12, color: T.textSub, marginBottom: 10 }}>Selecione uma categoria para escalar:</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                        {CATEGORIAS.map(cat => {
                          const disponiveis = membrosPorCategoria(cat);
                          const escaladosNaCat = isMusical
                            ? Object.values(escalados).filter(d => [...(d.funcoes || []), ...(d.instrumentos || [])].includes(cat))
                            : Object.values(escalados).filter(d => (d.categorias || []).includes(cat));
                          if (disponiveis.length === 0) return null;
                          return (
                            <button key={cat} onClick={() => setCategoriaEscala(categoriaEscala === cat ? null : cat)}
                              style={{ padding: "10px 12px", border: `1px solid ${categoriaEscala === cat ? "#c9a84c" : escaladosNaCat.length > 0 ? "rgba(34,197,94,.4)" : T.cardBorder}`, borderRadius: 12, background: categoriaEscala === cat ? "rgba(201,168,76,.15)" : escaladosNaCat.length > 0 ? "rgba(34,197,94,.06)" : T.card, cursor: "pointer", textAlign: "left", fontFamily: "Georgia,serif" }}>
                              <div style={{ fontSize: 12, fontWeight: "bold", color: categoriaEscala === cat ? "#c9a84c" : T.text }}>{cat}</div>
                              <div style={{ fontSize: 10, color: T.textFaint }}>
                                {escaladosNaCat.length > 0 ? `✅ ${escaladosNaCat.length} escalado(s)` : `${disponiveis.length} disponível(is)`}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      </>
                      )}

                      {/* Lista de membros da categoria selecionada */}
                      {categoriaEscala && (
                        <div style={{ background: "rgba(201,168,76,.04)", border: `1px solid rgba(201,168,76,.2)`, borderRadius: 12, padding: "12px 14px" }}>
                          <div style={{ fontSize: 12, fontWeight: "bold", color: T.gold, marginBottom: 10 }}>🎵 {categoriaEscala}</div>
                          {membrosPorCategoria(categoriaEscala).map(m => {
                            const entryAtual = escalados[m.email];
                            const ehFuncaoVocal = isMusical && FUNCOES_VOCAIS.includes(categoriaEscala);
                            // "escalado" aqui reflete só a categoria/função/instrumento específico sendo visualizado, não o perfil inteiro
                            const escalado = isMusical
                              ? (ehFuncaoVocal ? entryAtual?.funcoes?.includes(categoriaEscala) : entryAtual?.instrumentos?.includes(categoriaEscala))
                              : entryAtual?.categorias?.includes(categoriaEscala);
                            return (
                              <div key={m.email} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.cardBorder}` }}>
                                <div style={{ width: 34, height: 34, borderRadius: "50%", background: escalado ? "rgba(34,197,94,.15)" : "rgba(201,168,76,.1)", border: `1px solid ${escalado ? "rgba(34,197,94,.4)" : "rgba(201,168,76,.25)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: "bold", color: escalado ? "#22c55e" : "#c9a84c", flexShrink: 0 }}>
                                  {m.nome?.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 13, fontWeight: "bold", color: T.text }}>{m.nome}</div>
                                  {(() => {
                                    const perfil = m[perfilKeyEv];
                                    if (!perfil) return null;
                                    return isMusical ? (
                                      <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 2 }}>
                                        {(perfil.funcoes || []).map(f => <span key={f} style={{ fontSize: 10, color: "#c9a84c", background: "rgba(201,168,76,.1)", borderRadius: 10, padding: "1px 5px" }}>🎤{f}</span>)}
                                        {(perfil.instrumentos || []).map(i => <span key={i} style={{ fontSize: 10, color: "#a78bfa", background: "rgba(139,92,246,.1)", borderRadius: 10, padding: "1px 5px" }}>🎸{i}</span>)}
                                      </div>
                                    ) : (
                                      <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 2 }}>
                                        {(perfil.categorias || []).map(c => <span key={c} style={{ fontSize: 10, color: "#22d3ee", background: "rgba(6,182,212,.1)", borderRadius: 10, padding: "1px 5px" }}>🏷️{c}</span>)}
                                      </div>
                                    );
                                  })()}
                                </div>
                                <div onClick={async () => {
                                  const novos = { ...escalados };
                                  if (isMusical) {
                                    const entry = novos[m.email] || { nome: m.nome, funcoes: [], instrumentos: [] };
                                    const listaAtual = ehFuncaoVocal ? (entry.funcoes || []) : (entry.instrumentos || []);
                                    const novaLista = escalado ? listaAtual.filter(x => x !== categoriaEscala) : [...listaAtual, categoriaEscala];
                                    const novaEntry = ehFuncaoVocal
                                      ? { ...entry, nome: m.nome, funcoes: novaLista }
                                      : { ...entry, nome: m.nome, instrumentos: novaLista };
                                    if ((novaEntry.funcoes || []).length === 0 && (novaEntry.instrumentos || []).length === 0) delete novos[m.email];
                                    else novos[m.email] = novaEntry;
                                  } else {
                                    const entry = novos[m.email] || { nome: m.nome, categorias: [] };
                                    const listaAtual = entry.categorias || [];
                                    const novaLista = escalado ? listaAtual.filter(x => x !== categoriaEscala) : [...listaAtual, categoriaEscala];
                                    if (novaLista.length === 0) delete novos[m.email];
                                    else novos[m.email] = { nome: m.nome, categorias: novaLista };
                                  }

                                  if (escala) {
                                    await updateDoc(doc(db, "escalas", escala.id), { membrosEscalados: novos });
                                  } else {
                                    await addDoc(collection(db, "escalas"), {
                                      eventoId: eventoEscalaAberto.id,
                                      eventoRef: eventoEscalaAberto.id,
                                      culto: eventoEscalaAberto.titulo,
                                      data: eventoEscalaAberto.data,
                                      hora: eventoEscalaAberto.hora || "",
                                      ministerio: ministerioLider,
                                      membrosEscalados: novos,
                                      musicas: [],
                                      criadoEm: new Date().toISOString()
                                    });
                                  }
                                  showToast(escalado ? `↩️ ${m.nome} removido` : `✅ ${m.nome} escalado!`);
                                }} style={{ width: 46, height: 26, borderRadius: 13, background: escalado ? "#22c55e" : "rgba(150,150,150,.3)", cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
                                  <div style={{ position: "absolute", top: 3, left: escalado ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.3)" }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Músicas do evento — gestão apenas para o Aliança Music */}
                      {escala && isMusical && (
                        <div style={{ marginTop: 16 }}>
                          <div style={{ fontSize: 11, color: T.gold, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>🎶 Músicas</div>
                          {(escala.musicas || []).map((mid, i) => {
                            const mus = musicas.find(x => x.id === mid);
                            return mus ? (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${T.cardBorder}` }}>
                                <span style={{ fontSize: 12, color: T.text, flex: 1 }}>🎵 {mus.titulo} <span style={{ color: T.textSub }}>— {mus.artista}</span> {mus.tom && <span style={{ color: "#c9a84c" }}>• {mus.tom}</span>} {mus.tempo && <span style={{ color: "#8b5cf6" }}>• 🥁{mus.tempo}</span>}</span>
                                <button onClick={async () => {
                                  const novas = (escala.musicas || []).filter(x => x !== mid);
                                  await updateDoc(doc(db, "escalas", escala.id), { musicas: novas });
                                }} style={S.delBtn}>✕</button>
                              </div>
                            ) : null;
                          })}
                          <div style={{ position: "relative", marginTop: 8 }}>
                            <input
                              style={{ ...S.input, marginBottom: 0 }}
                              placeholder="🔍 Buscar música por nome ou artista..."
                              value={buscaMusicaEscala}
                              onFocus={() => setDropdownMusicaEscalaAberto(true)}
                              onChange={e => { setBuscaMusicaEscala(e.target.value); setDropdownMusicaEscalaAberto(true); }}
                            />
                            {dropdownMusicaEscalaAberto && (() => {
                              const disponiveis = musicas.filter(m => !(escala.musicas || []).includes(m.id));
                              const filtradas = buscaMusicaEscala.trim()
                                ? disponiveis.filter(m =>
                                    m.titulo?.toLowerCase().includes(buscaMusicaEscala.toLowerCase()) ||
                                    m.artista?.toLowerCase().includes(buscaMusicaEscala.toLowerCase())
                                  )
                                : disponiveis;
                              return (
                                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 20, maxHeight: 260, overflowY: "auto", background: darkMode ? "#07112a" : "#fff", border: `1px solid ${T.cardBorder}`, borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,.35)" }}>
                                  {filtradas.length === 0 ? (
                                    <div style={{ padding: "12px 14px", fontSize: 12, color: T.textSub }}>Nenhuma música encontrada</div>
                                  ) : filtradas.slice(0, 50).map(m => (
                                    <div key={m.id} onClick={async () => {
                                      const novas = [...(escala.musicas || []), m.id];
                                      await updateDoc(doc(db, "escalas", escala.id), { musicas: novas });
                                      setBuscaMusicaEscala(""); setDropdownMusicaEscalaAberto(false);
                                    }}
                                      style={{ padding: "10px 14px", borderBottom: `1px solid ${T.cardBorder}`, cursor: "pointer" }}>
                                      <div style={{ fontSize: 13, fontWeight: "bold", color: T.text }}>{m.titulo}</div>
                                      <div style={{ fontSize: 11, color: T.textSub }}>{m.artista} {m.tom && `• Tom: ${m.tom}`}</div>
                                    </div>
                                  ))}
                                  {filtradas.length > 50 && (
                                    <div style={{ padding: "8px 14px", fontSize: 11, color: T.textFaint }}>Mostrando 50 de {filtradas.length} — refine a busca para ver mais</div>
                                  )}
                                  <div onClick={() => setDropdownMusicaEscalaAberto(false)}
                                    style={{ padding: "8px 14px", fontSize: 11, color: T.gold, textAlign: "center", cursor: "pointer", fontWeight: "bold" }}>Fechar</div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Músicas escolhidas pelo Louvor — visão somente-leitura para outros ministérios (ex: Mídia) */}
                      {!isMusical && (() => {
                        const escalaLouvor = escalas.find(e => e.ministerio === "Aliança Music" && (e.eventoId === eventoEscalaAberto.id || e.eventoRef === eventoEscalaAberto.id));
                        const musicasDoLouvor = (escalaLouvor?.musicas || []).map(mid => musicas.find(x => x.id === mid)).filter(Boolean);
                        if (musicasDoLouvor.length === 0) return null;
                        return (
                          <div style={{ marginTop: 16 }}>
                            <div style={{ fontSize: 11, color: "#8b5cf6", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>🎶 Músicas escolhidas pelo Louvor</div>
                            {musicasDoLouvor.map((mus, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${T.cardBorder}` }}>
                                <span style={{ fontSize: 12, color: T.text, flex: 1 }}>🎵 {mus.titulo} <span style={{ color: T.textSub }}>— {mus.artista}</span> {mus.tom && <span style={{ color: "#c9a84c" }}>• {mus.tom}</span>} {mus.tempo && <span style={{ color: "#8b5cf6" }}>• 🥁{mus.tempo}</span>}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              }

              return (
                <div style={{ padding: "0 16px" }}>
                  <div style={{ fontSize: 14, fontWeight: "bold", color: T.gold, marginBottom: 4 }}>📅 Eventos — {ministerioLider}</div>
                  <div style={{ fontSize: 12, color: T.textSub, marginBottom: 14 }}>Crie um evento próprio ou vincule um evento da agenda da igreja</div>

                  {/* Seletor de modo */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                    {[
                      { id: "novo", label: "➕ Novo Evento" },
                      { id: "buscar", label: "🔍 Buscar na Agenda" },
                      ...(podeEditarAgendaCompleta ? [{ id: "editar", label: "✏️ Editar Eventos" }] : []),
                    ].map(m => (
                      <button key={m.id} onClick={() => setEventoModo(m.id)}
                        style={{ flex: 1, padding: "9px 0", border: `1px solid ${eventoModo === m.id ? "#c9a84c" : T.cardBorder}`, borderRadius: 10, background: eventoModo === m.id ? "linear-gradient(90deg,#c9a84c,#e8c97a)" : T.card, color: eventoModo === m.id ? "#080810" : T.textSub, fontSize: 12, fontWeight: eventoModo === m.id ? "bold" : "normal", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {eventoModo === "novo" && (
                    <>
                      <label style={S.label}>Título do evento *</label>
                      <input style={{ ...S.input, marginBottom: 0 }} placeholder="Ex: Ensaio do Ministério de Música"
                        value={novoEvento.titulo} onChange={e => setNovoEvento({ ...novoEvento, titulo: e.target.value })} />
                      <label style={S.label}>Data *</label>
                      <input type="date" style={{ ...S.input, marginBottom: 0 }}
                        value={novoEvento.data} onChange={e => setNovoEvento({ ...novoEvento, data: e.target.value })} />
                      <label style={S.label}>Horário</label>
                      <input style={{ ...S.input, marginBottom: 0 }} placeholder="Ex: 19h00"
                        value={novoEvento.hora} onChange={e => setNovoEvento({ ...novoEvento, hora: e.target.value })} />
                      <label style={S.label}>Local</label>
                      <input style={{ ...S.input, marginBottom: 0 }} placeholder="Ex: Sala de Ensaio"
                        value={novoEvento.local} onChange={e => setNovoEvento({ ...novoEvento, local: e.target.value })} />
                      <button style={S.saveBtn} onClick={async () => {
                        if (!novoEvento.titulo || !novoEvento.data) { showToast("⚠️ Preencha título e data!"); return; }
                        const parceiro = parceiroMinisterio(ministerioLider);
                        await addDoc(collection(db, "agenda"), {
                          ...novoEvento, tipo: "culto", ministerio: ministerioLider,
                          ministeriosVinculados: parceiro ? [ministerioLider, parceiro] : [],
                          criadoPor: user?.nome || "Líder",
                        });
                        setNovoEvento({ titulo: "", data: "", hora: "", local: "", tipo: "culto", descricao: "" });
                        showToast(parceiro ? `✅ Evento adicionado! (${parceiro} já vê este evento também)` : "✅ Evento adicionado!");
                      }}>📅 Adicionar Evento</button>
                    </>
                  )}

                  {eventoModo === "buscar" && (
                    <>
                      <div style={{ background: "rgba(59,130,246,.06)", border: "1px solid rgba(59,130,246,.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#60a5fa" }}>
                        ℹ️ Selecione um evento da agenda para vincular ao seu ministério.
                      </div>
                      <input style={{ ...S.input, marginBottom: 12 }} placeholder="🔍 Buscar evento..."
                        value={buscaAgenda} onChange={e => setBuscaAgenda(e.target.value)} />
                      {agenda.filter(e => !buscaAgenda.trim() || e.titulo?.toLowerCase().includes(buscaAgenda.toLowerCase()))
                        .filter(e => !e.ministerio || e.ministerio !== ministerioLider)
                        .sort((a, b) => a.data?.localeCompare(b.data)).map(e => {
                          const jaVinculado = e.ministeriosVinculados?.includes(ministerioLider);
                          return (
                            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: T.card, border: `1px solid ${jaVinculado ? "rgba(34,197,94,.3)" : T.cardBorder}`, borderLeft: `3px solid ${jaVinculado ? "#22c55e" : "#c9a84c"}`, borderRadius: 12, marginBottom: 8 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: "bold", color: T.text }}>{e.titulo}</div>
                                <div style={{ fontSize: 11, color: T.textSub }}>{new Date(e.data + "T12:00").toLocaleDateString("pt-BR")}{e.hora && ` • ${e.hora}`}</div>
                              </div>
                              {jaVinculado ? (
                                <div style={{ display: "flex", gap: 6 }}>
                                  <span style={{ fontSize: 11, color: "#22c55e", background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 20, padding: "4px 10px" }}>✓ Vinculado</span>
                                  <button style={S.delBtn} onClick={async () => {
                                    const novosVinc = (e.ministeriosVinculados || []).filter(m => m !== ministerioLider);
                                    await updateDoc(doc(db, "agenda", e.id), { ministeriosVinculados: novosVinc });
                                    showToast("↩️ Vínculo removido!");
                                  }}>×</button>
                                </div>
                              ) : (
                                <button onClick={async () => {
                                  const parceiro = parceiroMinisterio(ministerioLider);
                                  const novosVinc = [...(e.ministeriosVinculados || []), ministerioLider];
                                  if (parceiro && !novosVinc.includes(parceiro)) novosVinc.push(parceiro);
                                  await updateDoc(doc(db, "agenda", e.id), { ministeriosVinculados: novosVinc });
                                  showToast(parceiro ? `✅ Vinculado! (${parceiro} já vê este evento também)` : "✅ Evento vinculado!");
                                }} style={{ background: "linear-gradient(90deg,#c9a84c,#e8c97a)", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: "bold", color: "#080810", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                                  + Vincular
                                </button>
                              )}
                            </div>
                          );
                        })}
                    </>
                  )}

                  {eventoModo === "editar" && podeEditarAgendaCompleta && (
                    <>
                      <div style={{ background: "rgba(59,130,246,.06)", border: "1px solid rgba(59,130,246,.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#60a5fa" }}>
                        ℹ️ Como líder de {ministerioLider}, você pode editar qualquer evento da agenda da igreja.
                      </div>

                      <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 14, color: T.gold }}>
                        {editandoEvento ? "Editar Evento" : "Novo Evento"}
                      </div>
                      <label style={S.label}>Título</label>
                      <input style={{ ...S.input, marginBottom: 0 }} placeholder="Digite ou escolha um modelo já cadastrado" value={novoEvento.titulo}
                        list="lista-modelos-evento-lider"
                        onChange={e => {
                          const valor = e.target.value;
                          const modelo = modelosEvento.find(m => m.titulo === valor);
                          setNovoEvento({ ...novoEvento, titulo: valor, hora: modelo ? modelo.horario : novoEvento.hora });
                        }} />
                      {modelosEvento.length > 0 && (
                        <datalist id="lista-modelos-evento-lider">
                          {modelosEvento.map(m => (
                            <option key={m.id} value={m.titulo} />
                          ))}
                        </datalist>
                      )}
                      <label style={S.label}>Data</label>
                      <input style={{ ...S.input, marginBottom: 0 }} type="date" value={novoEvento.data}
                        onChange={e => setNovoEvento({ ...novoEvento, data: e.target.value })} />
                      <label style={S.label}>Horário</label>
                      <input style={{ ...S.input, marginBottom: 0 }} type="time" value={novoEvento.hora}
                        onChange={e => setNovoEvento({ ...novoEvento, hora: e.target.value })} />
                      <label style={S.label}>Local</label>
                      <select style={S.select} value={novoEvento.local} onChange={e => setNovoEvento({ ...novoEvento, local: e.target.value })}>
                        <option value="">Selecione o local...</option>
                        {locaisEvento.map(l => (
                          <option key={l.id} value={l.nome}>{l.nome}</option>
                        ))}
                        {novoEvento.local && !locaisEvento.some(l => l.nome === novoEvento.local) && (
                          <option value={novoEvento.local}>{novoEvento.local} (personalizado)</option>
                        )}
                      </select>
                      <label style={{ ...S.label, marginTop: 12 }}>Tipo</label>
                      <select style={S.select} value={novoEvento.tipo} onChange={e => setNovoEvento({ ...novoEvento, tipo: e.target.value })}>
                        <option value="culto">Culto</option>
                        <option value="oracao">Reunião de Oração</option>
                        <option value="kids">Kids</option>
                        <option value="music">Music</option>
                        {tiposCustom.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>

                      <button style={{ ...S.saveBtn, marginTop: 14 }} onClick={salvarEvento}>
                        {editandoEvento ? "💾 Atualizar Evento" : "➕ Adicionar Evento"}
                      </button>
                      {editandoEvento && (
                        <button style={{ ...S.saveBtn, background: T.card, color: T.textSub, marginTop: 8 }}
                          onClick={() => { setEditandoEvento(null); setNovoEvento({ titulo: "", data: "", hora: "", local: "", tipo: "culto" }); }}>
                          Cancelar
                        </button>
                      )}

                      <div style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: T.textFaint, marginTop: 24, marginBottom: 12 }}>Todos os Eventos da Agenda</div>
                      {agenda.map(ev => (
                        <div key={ev.id} style={{ ...S.card, marginLeft: 0, marginRight: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: "bold" }}>
                              {ev.titulo}
                              {ev.local && <span style={{ fontWeight: "normal", fontSize: 12, color: T.textFaint }}> · 📍 {ev.local}</span>}
                            </div>
                            <div style={{ fontSize: 12, color: T.textSub }}>{fmtData(ev.data)} • {ev.hora}</div>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button style={{ padding: "6px 10px", background: "rgba(201,168,76,.1)", border: `1px solid ${darkMode ? "rgba(201,168,76,.3)" : "rgba(154,112,32,.6)"}`, borderRadius: 8, color: T.gold, fontSize: 12, cursor: "pointer", fontFamily: "Georgia,serif" }}
                              onClick={() => { setEditandoEvento(ev.id); setNovoEvento({ ...ev }); }}>✏️</button>
                            <button style={S.delBtn} onClick={() => deletarEvento(ev.id)}>🗑️</button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Lista de todos os eventos do ministério com botão "Montar Escala" */}
                  {eventosMin.length > 0 && (
                    <>
                      <div style={{ fontSize: 12, color: T.gold, marginTop: 20, marginBottom: 12, letterSpacing: 2, textTransform: "uppercase" }}>
                        Eventos ({eventosMin.length})
                      </div>
                      {eventosMin.map(e => {
                        const escala = escalaDoEvento(e.id);
                        const qtdEscalados = Object.keys(escala?.membrosEscalados || {}).length;
                        return (
                          <div key={e.id} style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: "12px 14px", marginBottom: 10 }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: "bold", color: T.text }}>{e.titulo}</div>
                                <div style={{ fontSize: 11, color: T.textSub }}>{new Date(e.data + "T12:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}{e.hora && ` • ${e.hora}`}</div>
                                {qtdEscalados > 0 && <div style={{ fontSize: 11, color: "#22c55e", marginTop: 3 }}>✅ {qtdEscalados} escalado(s)</div>}
                              </div>
                              {e.ministerio === ministerioLider && (
                                <button title="Excluir evento inteiro" style={S.delBtn} onClick={async () => {
                                  if (window.confirm("Excluir este evento? Isso remove o evento inteiro (não só a escala).")) {
                                    await deleteDoc(doc(db, "agenda", e.id));
                                    showToast("🗑️ Evento removido!");
                                  }
                                }}>🗑️</button>
                              )}
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => { setEventoEscalaAberto(e); setCategoriaEscala(null); }}
                                style={{ flex: 1, padding: "9px 0", background: "linear-gradient(90deg,#c9a84c,#e8c97a)", border: "none", borderRadius: 10, fontSize: 12, fontWeight: "bold", color: "#080810", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                                📋 {qtdEscalados > 0 ? "Ver/Editar Escala" : "Montar Escala"}
                              </button>
                              {escala && (
                                <button onClick={async () => {
                                  if (window.confirm("Excluir a escala deste evento? Os escalados serão removidos.")) {
                                    await deleteDoc(doc(db, "escalas", escala.id));
                                    showToast("🗑️ Escala removida!");
                                  }
                                }} style={{ padding: "9px 12px", background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 10, color: "#ef4444", fontSize: 11, fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "Georgia,serif" }}>
                                  🗑️ Escala
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              );
            })()}


            {/* ── MÓDULO MÚSICA ── */}
            {adminTab === "musica-min" && (() => {

              return (
                <div style={{ padding: "0 16px" }}>
                  <div style={{ fontSize: 14, fontWeight: "bold", color: T.gold, marginBottom: 4 }}>🎵 Módulo Música</div>
                  <div style={{ fontSize: 12, color: T.textSub, marginBottom: 14 }}>Gerencie as músicas do ministério — cifras, áudios por naipe e links ficam todos dentro de cada música</div>

                  {/* ── MÚSICAS ── */}
                  {(
                    <>
                      <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: "bold", color: T.gold, marginBottom: 10 }}>➕ Nova Música</div>
                        <input style={{ ...S.input, marginBottom: 8 }} placeholder="Título da música *"
                          value={novaMusica.titulo} onChange={e => setNovaMusica({ ...novaMusica, titulo: e.target.value })} />
                        <input style={{ ...S.input, marginBottom: 8 }} placeholder="Artista/Banda"
                          value={novaMusica.artista} onChange={e => setNovaMusica({ ...novaMusica, artista: e.target.value })} />
                        <select style={{ ...S.select, marginBottom: 8 }} value={novaMusica.categoria}
                          onChange={e => setNovaMusica({ ...novaMusica, categoria: e.target.value })}>
                          <option value="">Categoria da música (opcional)</option>
                          <option value="Repertório feminino">Repertório feminino</option>
                          <option value="Repertório masculino">Repertório masculino</option>
                          <option value="Repertório geral">Repertório geral</option>
                          <option value="Ativo">Ativo</option>
                        </select>
                        <input style={{ ...S.input, marginBottom: 8 }} placeholder="Tom (Ex: Dó, Ré, Mi...)"
                          value={novaMusica.tom} onChange={e => setNovaMusica({ ...novaMusica, tom: e.target.value })} />
                        <input type="number" style={{ ...S.input, marginBottom: 8 }} placeholder="🥁 Tempo/BPM (Ex: 120)"
                          value={novaMusica.tempo} onChange={e => setNovaMusica({ ...novaMusica, tempo: e.target.value })} />
                        <input style={{ ...S.input, marginBottom: 0 }} placeholder="🔗 Link YouTube ou Spotify"
                          value={novaMusica.link} onChange={e => setNovaMusica({ ...novaMusica, link: e.target.value })} />
                        {/* Preview do link */}
                        {novaMusica.link && getYouTubeId(novaMusica.link) && (
                          <div style={{ marginTop: 8, borderRadius: 10, overflow: "hidden" }}>
                            <iframe width="100%" height="160" title="YouTube video" src={`https://www.youtube.com/embed/${getYouTubeId(novaMusica.link)}`} frameBorder="0" allowFullScreen style={{ display: "block" }} />
                          </div>
                        )}
                        {novaMusica.link && getSpotifyId(novaMusica.link) && (
                          <div style={{ marginTop: 8, borderRadius: 10, overflow: "hidden" }}>
                            <iframe title="Spotify player" src={`https://open.spotify.com/embed/${getSpotifyId(novaMusica.link).type}/${getSpotifyId(novaMusica.link).id}`} width="100%" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" style={{ display: "block" }} />
                          </div>
                        )}
                        <button style={{ ...S.saveBtn, marginTop: 10 }} onClick={async () => {
                          if (!novaMusica.titulo) { showToast("⚠️ Informe o título!"); return; }
                          await addDoc(collection(db, "musicas"), { ...novaMusica, ministerio: ministerioLider, criadoEm: new Date().toISOString() });
                          setNovaMusica({ titulo: "", artista: "", categoria: "", tom: "", tempo: "", link: "" });
                          showToast("✅ Música adicionada!");
                        }}>🎶 Adicionar Música</button>
                      </div>
                      {musicas.filter(m => m.ministerio === ministerioLider).map(m => {
                        const ytId = getYouTubeId(m.link);
                        const spId = getSpotifyId(m.link);
                        const expandida = musicaExpandida === m.id;
                        const arquivosM = m.arquivos || [];

                        const iconePorTipo = { pdf: "📄", audio: "🎵", imagem: "🖼️", link: "🔗", arquivo: "📁" };

                        const adicionarArquivo = async () => {
                          if (!novoArquivoMusica.nome.trim()) { showToast("⚠️ Dê um nome pro arquivo (Ex: Soprano, Cifra...)"); return; }
                          if (!novoArquivoMusica.arquivo && !novoArquivoMusica.link.trim()) { showToast("⚠️ Envie um arquivo ou informe um link!"); return; }
                          const novoItem = {
                            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
                            nome: novoArquivoMusica.nome.trim(),
                            url: novoArquivoMusica.arquivo || novoArquivoMusica.link.trim(),
                            tipo: novoArquivoMusica.tipoDetectado || "link",
                          };
                          await updateDoc(doc(db, "musicas", m.id), { arquivos: [...arquivosM, novoItem] });
                          setNovoArquivoMusica({ nome: "", arquivo: "", link: "" });
                          showToast(`✅ "${novoItem.nome}" adicionado à música!`);
                        };

                        const removerArquivo = async (arqId) => {
                          if (!window.confirm("Remover este arquivo da música?")) return;
                          await updateDoc(doc(db, "musicas", m.id), { arquivos: arquivosM.filter(a => a.id !== arqId) });
                          showToast("🗑️ Arquivo removido!");
                        };

                        return (
                          <div key={m.id} style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderLeft: "3px solid #c9a84c", borderRadius: 12, marginBottom: 10, overflow: "hidden" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer" }}
                              onClick={() => setMusicaExpandida(expandida ? null : m.id)}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: "bold", color: T.text }}>{m.titulo}</div>
                                <div style={{ fontSize: 12, color: T.textSub }}>{m.artista} {m.tom && <span style={{ color: "#c9a84c" }}>• Tom: {m.tom}</span>} {m.tempo && <span style={{ color: "#8b5cf6" }}>• 🥁 {m.tempo} BPM</span>}</div>
                                {m.categoria && <div style={{ fontSize: 10, color: "#22d3ee", marginTop: 3 }}>🏷️ {m.categoria}</div>}
                                {arquivosM.length > 0 && <div style={{ fontSize: 10, color: T.textFaint, marginTop: 3 }}>📎 {arquivosM.length} arquivo(s) anexado(s)</div>}
                              </div>
                              <span style={{ color: T.textSub, fontSize: 16 }}>{expandida ? "▲" : "▼"}</span>
                              <button onClick={async (e) => { e.stopPropagation(); if (window.confirm("Excluir música?")) { await deleteDoc(doc(db, "musicas", m.id)); showToast("🗑️ Removida!"); } }} style={S.delBtn}>🗑️</button>
                            </div>
                            {/* ── Arquivos nomeados da música (expansível) ── */}
                            {expandida && (
                              <div style={{ padding: "0 14px 14px", marginTop: 4 }}>
                                {/* YouTube embed — só carrega quando a música está aberta */}
                                {ytId && (
                                  <div style={{ margin: "10px 0" }}>
                                    <iframe width="100%" height="180" src={`https://www.youtube.com/embed/${ytId}`} frameBorder="0" allowFullScreen loading="lazy" style={{ display: "block", borderRadius: 10 }} title="Video player"/>
                                  </div>
                                )}
                                {/* Spotify embed — só carrega quando a música está aberta */}
                                {spId && (
                                  <div style={{ margin: "10px 0" }}>
                                    <iframe src={`https://open.spotify.com/embed/${spId.type}/${spId.id}`} width="100%" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" style={{ display: "block", borderRadius: 10 }} title="Spotify player"/>
                                  </div>
                                )}
                                {/* Link externo se não for YT nem Spotify */}
                                {m.link && !ytId && !spId && (
                                  <div style={{ margin: "10px 0" }}>
                                    <button onClick={() => window.open(m.link, "_blank")}
                                      style={{ width: "100%", background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.3)", borderRadius: 8, padding: "8px 0", fontSize: 12, color: T.gold, cursor: "pointer" }}>
                                      🔗 Abrir Link
                                    </button>
                                  </div>
                                )}

                                <div style={{ fontSize: 11, color: T.gold, letterSpacing: 1, textTransform: "uppercase", margin: "12px 0 8px" }}>📎 Arquivos desta música</div>
                                {arquivosM.length === 0 && (
                                  <div style={{ fontSize: 12, color: T.textFaint, marginBottom: 10 }}>Nenhum arquivo anexado ainda — adicione cifra, áudios por naipe (soprano, contralto, tenor), VS, links, etc.</div>
                                )}
                                {arquivosM.map(a => (
                                  <div key={a.id} style={{ background: darkMode ? "rgba(139,92,246,.06)" : "rgba(139,92,246,.04)", border: "1px solid rgba(139,92,246,.15)", borderRadius: 10, padding: "8px 10px", marginBottom: 6 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                      <span style={{ fontSize: 16 }}>{iconePorTipo[a.tipo] || "📁"}</span>
                                      <span style={{ flex: 1, fontSize: 12, fontWeight: "bold", color: T.text }}>{a.nome}</span>
                                      {a.tipo === "audio" ? (
                                        <button onClick={() => setAudioTocando(audioTocando === a.id ? null : a.id)}
                                          style={{ background: "rgba(139,92,246,.15)", border: "1px solid rgba(139,92,246,.3)", borderRadius: 6, padding: "5px 8px", fontSize: 11, color: "#a78bfa", cursor: "pointer" }}>{audioTocando === a.id ? "⏹ Fechar" : "▶️ Tocar"}</button>
                                      ) : (
                                        <button onClick={() => window.open(a.url, "_blank")}
                                          style={{ background: "rgba(139,92,246,.15)", border: "1px solid rgba(139,92,246,.3)", borderRadius: 6, padding: "5px 8px", fontSize: 11, color: "#a78bfa", cursor: "pointer" }}>Abrir</button>
                                      )}
                                      {a.tipo !== "link" && (
                                        <button onClick={() => baixarArquivo(a.url, a.nome)}
                                          style={{ background: "rgba(34,197,94,.15)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 6, padding: "5px 8px", fontSize: 11, color: "#4ade80", cursor: "pointer" }}>⬇️</button>
                                      )}
                                      <button onClick={() => removerArquivo(a.id)}
                                        style={{ background: "rgba(220,38,38,.12)", border: "1px solid rgba(220,38,38,.3)", borderRadius: 6, padding: "5px 8px", fontSize: 11, color: "#f87171", cursor: "pointer" }}>✕</button>
                                    </div>
                                    {a.tipo === "audio" && audioTocando === a.id && (
                                      <audio controls autoPlay style={{ width: "100%", marginTop: 8, height: 34 }}>
                                        <source src={a.url} />
                                      </audio>
                                    )}
                                  </div>
                                ))}

                                {/* Form de novo arquivo nomeado */}
                                <div style={{ background: darkMode ? "rgba(0,0,0,.2)" : "rgba(0,0,0,.03)", borderRadius: 10, padding: "10px 12px", marginTop: 10 }}>
                                  <div style={{ fontSize: 11, color: T.textSub, marginBottom: 8 }}>+ Adicionar arquivo a esta música</div>
                                  <input style={{ ...S.input, marginBottom: 8 }} placeholder='Nome (Ex: "Soprano", "Cifra", "VS Estudo"...)'
                                    value={novoArquivoMusica.nome} onChange={e => setNovoArquivoMusica({ ...novoArquivoMusica, nome: e.target.value })} />
                                  <label style={{ display: "block", border: `1px dashed ${T.cardBorder}`, borderRadius: 10, padding: "10px", textAlign: "center", cursor: "pointer", marginBottom: 8, fontSize: 12, color: T.textSub }}>
                                    {uploadando ? `Enviando... ${uploadProgress ?? 0}%` : novoArquivoMusica.arquivo ? "✅ Arquivo selecionado" : "📤 Toque para subir um arquivo (PDF, áudio, imagem...)"}
                                    <input type="file" accept="application/pdf,audio/*,image/*" style={{ display: "none" }} onChange={async e => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      setUploadando(true);
                                      setUploadProgress(0);
                                      try {
                                        const url = await uploadCloudinary(file, setUploadProgress);
                                        const tipoDetectado = file.type.startsWith("audio/") ? "audio" : file.type === "application/pdf" ? "pdf" : file.type.startsWith("image/") ? "imagem" : "arquivo";
                                        setNovoArquivoMusica(prev => ({ ...prev, arquivo: url, tipoDetectado }));
                                        showToast("✅ Arquivo enviado!");
                                      } catch {
                                        showToast("❌ Erro ao enviar arquivo");
                                      } finally {
                                        setUploadando(false);
                                        setUploadProgress(null);
                                      }
                                    }} />
                                  </label>
                                  <div style={{ textAlign: "center", fontSize: 11, color: T.textFaint, margin: "4px 0" }}>— ou —</div>
                                  <input style={{ ...S.input, marginBottom: 8 }} placeholder="🔗 Cole um link (YouTube, Cifra Club...)"
                                    value={novoArquivoMusica.link} onChange={e => setNovoArquivoMusica({ ...novoArquivoMusica, link: e.target.value, tipoDetectado: "link" })} />
                                  <button style={{ ...S.saveBtn, marginTop: 0 }} onClick={adicionarArquivo}>📎 Adicionar à Música</button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {musicas.filter(m => m.ministerio === ministerioLider).length === 0 && (
                        <div style={{ textAlign: "center", padding: "24px 0", color: T.textSub, fontSize: 13 }}>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>🎶</div>Nenhuma música cadastrada
                        </div>
                      )}
                    </>
                  )}

                  {/* Limpeza de Cifras/VS antigos (cadastrados antes da mudança de estrutura, sem vínculo de música) */}
                  {(() => {
                    const cifrasAntigas = cifras.filter(c => c.ministerio === ministerioLider);
                    const vsAntigos = vsItems.filter(v => v.ministerio === ministerioLider);
                    if (cifrasAntigas.length === 0 && vsAntigos.length === 0) return null;
                    return (
                      <div style={{ marginTop: 24, background: "rgba(220,38,38,.05)", border: "1px solid rgba(220,38,38,.2)", borderRadius: 14, padding: "14px 16px" }}>
                        <div style={{ fontSize: 12, fontWeight: "bold", color: "#f87171", marginBottom: 4 }}>🧹 Cifras/VS antigos (fora da estrutura atual)</div>
                        <div style={{ fontSize: 11, color: T.textSub, marginBottom: 12 }}>Registros cadastrados antes da mudança — não pertencem a nenhuma música do jeito novo. Exclua o que não precisar mais.</div>
                        {cifrasAntigas.map(c => (
                          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${T.cardBorder}` }}>
                            <span style={{ fontSize: 12, color: T.text, flex: 1 }}>🎸 {c.titulo || "(sem título)"}</span>
                            <button onClick={async () => { if (window.confirm(`Excluir a cifra "${c.titulo}"?`)) { await deleteDoc(doc(db, "cifras", c.id)); showToast("🗑️ Excluída!"); } }}
                              style={S.delBtn}>🗑️</button>
                          </div>
                        ))}
                        {vsAntigos.map(v => (
                          <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${T.cardBorder}` }}>
                            <span style={{ fontSize: 12, color: T.text, flex: 1 }}>🎧 {v.titulo || "(sem título)"}</span>
                            <button onClick={async () => { if (window.confirm(`Excluir "${v.titulo}"?`)) { await deleteDoc(doc(db, "vs", v.id)); showToast("🗑️ Excluído!"); } }}
                              style={S.delBtn}>🗑️</button>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                </div>
              );
            })()}

            {/* Arquivos — apenas Mídia */}
            {adminTab === "arquivos-min" && ministerioLider === "Mídia" && (() => {
              const arquivosMin = arquivosMidia.filter(a => a.ministerio === ministerioLider);
              const pregacaoAtualLider = [...pregacoes].sort((a, b) => (b.criadoEm || "").localeCompare(a.criadoEm || ""))[0];

              return (
                <div style={{ padding: "0 16px" }}>
                  <div style={{ fontSize: 14, fontWeight: "bold", color: T.gold, marginBottom: 4 }}>🖼️ Arquivos — {ministerioLider}</div>
                  <div style={{ fontSize: 12, color: T.textSub, marginBottom: 16 }}>Imagens para o telão e a pregação inserida pelo Pastor</div>

                  {/* Upload de imagem para o telão */}
                  <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: "14px 16px", marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: "bold", color: T.gold, marginBottom: 10 }}>➕ Nova Imagem (Telão)</div>
                    <input style={{ ...S.input, marginBottom: 8 }} placeholder="Título (Ex: Fundo Culto de Domingo)"
                      value={novoArquivoMidia.titulo} onChange={e => setNovoArquivoMidia({ ...novoArquivoMidia, titulo: e.target.value })} />

                    <label style={{ display: "block", border: `1px dashed ${T.cardBorder}`, borderRadius: 10, padding: "12px", textAlign: "center", cursor: "pointer", marginBottom: 8, fontSize: 12, color: T.textSub }}>
                      {uploadando ? `Enviando... ${uploadProgress ?? 0}%` : novoArquivoMidia.arquivo ? "✅ Imagem selecionada" : "🖼️ Toque para fazer upload da imagem"}
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadando(true);
                        setUploadProgress(0);
                        try {
                          const url = await uploadCloudinary(file, setUploadProgress);
                          setNovoArquivoMidia(prev => ({ ...prev, arquivo: url }));
                          showToast("✅ Imagem enviada!");
                        } catch (err) {
                          showToast("❌ Erro ao enviar imagem");
                        } finally {
                          setUploadando(false);
                          setUploadProgress(null);
                        }
                      }} />
                    </label>

                    <button style={S.saveBtn} onClick={async () => {
                      if (!novoArquivoMidia.titulo) { showToast("⚠️ Informe o título!"); return; }
                      if (!novoArquivoMidia.arquivo) { showToast("⚠️ Envie uma imagem!"); return; }
                      await addDoc(collection(db, "arquivosMidia"), { ...novoArquivoMidia, tipo: "imagem", ministerio: ministerioLider, criadoEm: new Date().toISOString() });
                      setNovoArquivoMidia({ titulo: "", arquivo: "" });
                      showToast("✅ Imagem salva!");
                    }}>🖼️ Salvar Imagem</button>
                  </div>

                  {/* Lista de imagens */}
                  <div style={{ fontSize: 12, color: T.gold, marginBottom: 10, letterSpacing: 1, textTransform: "uppercase" }}>Imagens ({arquivosMin.length})</div>
                  {arquivosMin.length === 0 ? (
                    <div style={{ ...S.card, textAlign: "center", padding: "24px 0", marginLeft: 0, marginRight: 0, marginBottom: 20 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
                      <div style={{ fontSize: 13, color: T.textSub }}>Nenhuma imagem enviada ainda</div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                      {arquivosMin.map(a => (
                        <div key={a.id} style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 12, overflow: "hidden" }}>
                          <img src={a.arquivo} alt={a.titulo} style={{ width: "100%", height: 100, objectFit: "cover", display: "block" }} />
                          <div style={{ padding: "8px 10px" }}>
                            <div style={{ fontSize: 11, fontWeight: "bold", color: T.text, marginBottom: 6 }}>{a.titulo}</div>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => baixarArquivo(a.arquivo, a.titulo)} style={{ flex: 1, background: "rgba(34,197,94,.15)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 6, padding: "5px 0", fontSize: 10, fontWeight: "bold", color: "#4ade80", cursor: "pointer" }}>⬇️</button>
                              <button onClick={async () => { if (window.confirm("Excluir esta imagem?")) { await deleteDoc(doc(db, "arquivosMidia", a.id)); showToast("🗑️ Removida!"); } }}
                                style={{ flex: 1, background: "rgba(220,38,38,.15)", border: "1px solid rgba(220,38,38,.3)", borderRadius: 6, padding: "5px 0", fontSize: 10, fontWeight: "bold", color: "#f87171", cursor: "pointer" }}>🗑️</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pregação — inserida pelo Pastor, visualização apenas */}
                  <div style={{ fontSize: 12, color: "#8b5cf6", marginBottom: 10, letterSpacing: 1, textTransform: "uppercase" }}>📜 Pregação (inserida pelo Pastor)</div>
                  {!pregacaoAtualLider ? (
                    <div style={{ ...S.card, textAlign: "center", padding: "24px 0", marginLeft: 0, marginRight: 0 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📜</div>
                      <div style={{ fontSize: 13, color: T.textSub }}>O Pastor ainda não inseriu nenhuma pregação</div>
                    </div>
                  ) : (
                    <div style={{ background: darkMode ? "rgba(139,92,246,.06)" : "rgba(139,92,246,.04)", border: "1px solid rgba(139,92,246,.2)", borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                        <div style={{ fontSize: 13, fontWeight: "bold", color: T.text, flex: 1 }}>{pregacaoAtualLider.titulo}</div>
                        <button onClick={() => baixarPregacaoTxt(pregacaoAtualLider)}
                          style={{ background: "rgba(34,197,94,.15)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 6, padding: "6px 10px", fontSize: 11, fontWeight: "bold", color: "#4ade80", cursor: "pointer", flexShrink: 0 }}>⬇️ .txt</button>
                      </div>
                      {pregacaoAtualLider.versiculos && (
                        <div style={{ fontSize: 12, color: T.textSub, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{pregacaoAtualLider.versiculos}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {tab === "admin" && isAdmin && (
          <div style={{ animation: "slideUp .4s ease" }}>
            <div style={S.adminHeader}>
              <div style={S.adminTitle}>⚙️ Painel do Pastor</div>
            </div>
            <div style={S.adminTabs}>
              {["agenda", "padroes", "palavra", "pregacao", "devocional", "avisos", "estudos", "banner", "financeiro", "lideres", "jejum", "video", "aovivo", "membros", "administradores"].map(t => (
                <button key={t} style={S.adminTab(adminTab === t)} onClick={() => setAdminTab(t)}>
                  {{ agenda: "📅 Agenda", padroes: "🧩 Padrões", palavra: "📜 Palavra", pregacao: "🎙️ Pregação", devocional: "🕊️ Devoc", avisos: "📢 Avisos", estudos: "📚 Estudos", banner: "🖼️ Banner", financeiro: "💰 Finanças", lideres: "🏛️ Líderes", jejum: "🙏 Jejum", video: "▶️ Vídeo", aovivo: "🔴 Ao Vivo", membros: "👥 Membros", administradores: "🔐 Admins" }[t]}
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
                <input style={{ ...S.input, marginBottom: 0 }} placeholder="Digite ou escolha um modelo já cadastrado" value={novoEvento.titulo}
                  list="lista-modelos-evento"
                  onChange={e => {
                    const valor = e.target.value;
                    const modelo = modelosEvento.find(m => m.titulo === valor);
                    setNovoEvento({ ...novoEvento, titulo: valor, hora: modelo ? modelo.horario : novoEvento.hora });
                  }} />
                {modelosEvento.length > 0 && (
                  <datalist id="lista-modelos-evento">
                    {modelosEvento.map(m => (
                      <option key={m.id} value={m.titulo} />
                    ))}
                  </datalist>
                )}
                <label style={S.label}>Data</label>
                <input style={{ ...S.input, marginBottom: 0 }} type="date" value={novoEvento.data}
                  onChange={e => setNovoEvento({ ...novoEvento, data: e.target.value })} />
                <label style={S.label}>Horário</label>
                <input style={{ ...S.input, marginBottom: 0 }} type="time" value={novoEvento.hora}
                  onChange={e => setNovoEvento({ ...novoEvento, hora: e.target.value })} />
                <label style={S.label}>Local</label>
                <select style={S.select} value={novoEvento.local} onChange={e => setNovoEvento({ ...novoEvento, local: e.target.value })}>
                  <option value="">Selecione o local...</option>
                  {locaisEvento.map(l => (
                    <option key={l.id} value={l.nome}>{l.nome}</option>
                  ))}
                  {novoEvento.local && !locaisEvento.some(l => l.nome === novoEvento.local) && (
                    <option value={novoEvento.local}>{novoEvento.local} (personalizado)</option>
                  )}
                </select>

                {/* Adicionar novo local rápido */}
                <div style={{ display: "flex", gap: 8, marginTop: 8, marginBottom: 0 }}>
                  <input style={{ ...S.input, marginBottom: 0, flex: 1 }}
                    placeholder="+ Novo local..."
                    value={novoLocalEvento}
                    onChange={e => setNovoLocalEvento(e.target.value)}
                    onKeyDown={async e => {
                      if (e.key === "Enter" && novoLocalEvento.trim()) {
                        await addDoc(collection(db, "locaisEvento"), { nome: novoLocalEvento.trim() });
                        setNovoEvento({ ...novoEvento, local: novoLocalEvento.trim() });
                        setNovoLocalEvento("");
                        showToast("✅ Local adicionado!");
                      }
                    }} />
                  <button onClick={async () => {
                    if (!novoLocalEvento.trim()) return;
                    await addDoc(collection(db, "locaisEvento"), { nome: novoLocalEvento.trim() });
                    setNovoEvento({ ...novoEvento, local: novoLocalEvento.trim() });
                    setNovoLocalEvento("");
                    showToast("✅ Local adicionado!");
                  }} style={{ padding: "0 14px", background: "rgba(201,168,76,.15)", border: "1px solid rgba(201,168,76,.3)", borderRadius: 10, color: T.gold, fontSize: 18, cursor: "pointer", flexShrink: 0 }}>+</button>
                </div>

                <label style={{ ...S.label, marginTop: 12 }}>Tipo</label>
                <select style={S.select} value={novoEvento.tipo} onChange={e => setNovoEvento({ ...novoEvento, tipo: e.target.value })}>
                  <option value="culto">Culto</option>
                  <option value="oracao">Reunião de Oração</option>
                  <option value="kids">Kids</option>
                  <option value="music">Music</option>
                  {tiposCustom.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                {/* Adicionar novo tipo */}
                <div style={{ display: "flex", gap: 8, marginTop: 8, marginBottom: 0 }}>
                  <input style={{ ...S.input, marginBottom: 0, flex: 1 }}
                    placeholder="+ Novo tipo de evento..."
                    value={novoTipo}
                    onChange={e => setNovoTipo(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && novoTipo.trim()) {
                        const novos = [...tiposCustom, novoTipo.trim()];
                        setTiposCustom(novos);
                        localStorage.setItem("fa_tipos_evento", JSON.stringify(novos));
                        setNovoEvento({ ...novoEvento, tipo: novoTipo.trim() });
                        setNovoTipo("");
                        showToast("✅ Tipo adicionado!");
                      }
                    }} />
                  <button onClick={() => {
                    if (!novoTipo.trim()) return;
                    const novos = [...tiposCustom, novoTipo.trim()];
                    setTiposCustom(novos);
                    localStorage.setItem("fa_tipos_evento", JSON.stringify(novos));
                    setNovoEvento({ ...novoEvento, tipo: novoTipo.trim() });
                    setNovoTipo("");
                    showToast("✅ Tipo adicionado!");
                  }} style={{ padding: "0 14px", background: "rgba(201,168,76,.15)", border: "1px solid rgba(201,168,76,.3)", borderRadius: 10, color: T.gold, fontSize: 18, cursor: "pointer", flexShrink: 0 }}>+</button>
                </div>

                {/* Lista de tipos customizados com opção de remover */}
                {tiposCustom.length > 0 && (
                  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {tiposCustom.map(t => (
                      <div key={t} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(201,168,76,.08)", border: "1px solid rgba(201,168,76,.2)", borderRadius: 20, padding: "3px 10px 3px 12px" }}>
                        <span style={{ fontSize: 12, color: T.textSub }}>{t}</span>
                        <button onClick={() => {
                          const novos = tiposCustom.filter(x => x !== t);
                          setTiposCustom(novos);
                          localStorage.setItem("fa_tipos_evento", JSON.stringify(novos));
                          if (novoEvento.tipo === t) setNovoEvento({ ...novoEvento, tipo: "culto" });
                        }} style={{ background: "none", border: "none", color: T.textFaint, cursor: "pointer", fontSize: 14, lineHeight: 1, padding: "0 2px" }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
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
                      <div style={{ fontSize: 13, fontWeight: "bold" }}>
                        {ev.titulo}
                        {ev.local && <span style={{ fontWeight: "normal", fontSize: 12, color: T.textFaint }}> · 📍 {ev.local}</span>}
                      </div>
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

            {/* Admin: Padrões (Modelos de Evento + Locais) */}
            {adminTab === "padroes" && (
              <div style={{ padding: "0 16px" }}>
                <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 4, color: T.gold }}>Modelos de Evento</div>
                <div style={{ fontSize: 12, color: T.textSub, marginBottom: 14 }}>Cadastre combinações de Título + Horário padrão (ex: "Culto de Domingo em Família" → 10h). Na tela de Novo Evento, dá pra escolher o modelo e o horário já vem preenchido.</div>

                <label style={S.label}>Título do modelo</label>
                <input style={{ ...S.input, marginBottom: 0 }} placeholder="Ex: Culto de Domingo em Família"
                  value={novoModeloEvento.titulo}
                  onChange={e => setNovoModeloEvento({ ...novoModeloEvento, titulo: e.target.value })} />
                <label style={S.label}>Horário padrão</label>
                <input style={{ ...S.input, marginBottom: 0 }} type="time"
                  value={novoModeloEvento.horario}
                  onChange={e => setNovoModeloEvento({ ...novoModeloEvento, horario: e.target.value })} />

                <button style={S.saveBtn} onClick={async () => {
                  if (!novoModeloEvento.titulo.trim() || !novoModeloEvento.horario) { showToast("⚠️ Preencha título e horário!"); return; }
                  if (editandoModeloEvento) {
                    await updateDoc(doc(db, "modelosEvento", editandoModeloEvento), { titulo: novoModeloEvento.titulo.trim(), horario: novoModeloEvento.horario });
                    setEditandoModeloEvento(null);
                  } else {
                    await addDoc(collection(db, "modelosEvento"), { titulo: novoModeloEvento.titulo.trim(), horario: novoModeloEvento.horario });
                  }
                  setNovoModeloEvento({ titulo: "", horario: "" });
                  showToast("✅ Modelo salvo!");
                }}>
                  {editandoModeloEvento ? "💾 Atualizar Modelo" : "➕ Adicionar Modelo"}
                </button>
                {editandoModeloEvento && (
                  <button style={{ ...S.saveBtn, background: T.card, color: T.textSub, marginTop: 8 }}
                    onClick={() => { setEditandoModeloEvento(null); setNovoModeloEvento({ titulo: "", horario: "" }); }}>
                    Cancelar
                  </button>
                )}

                <div style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: T.textFaint, marginTop: 24, marginBottom: 12 }}>Modelos Cadastrados</div>
                {modelosEvento.length === 0 ? (
                  <div style={{ fontSize: 12, color: T.textFaint }}>Nenhum modelo cadastrado ainda.</div>
                ) : modelosEvento.map(m => (
                  <div key={m.id} style={{ ...S.card, marginLeft: 0, marginRight: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: "bold" }}>{m.titulo}</div>
                      <div style={{ fontSize: 12, color: T.textSub }}>Horário padrão: {m.horario}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={{ padding: "6px 10px", background: "rgba(201,168,76,.1)", border: `1px solid ${darkMode ? "rgba(201,168,76,.3)" : "rgba(154,112,32,.6)"}`, borderRadius: 8, color: T.gold, fontSize: 12, cursor: "pointer", fontFamily: "Georgia,serif" }}
                        onClick={() => { setEditandoModeloEvento(m.id); setNovoModeloEvento({ titulo: m.titulo, horario: m.horario }); }}>✏️</button>
                      <button style={S.delBtn} onClick={async () => { await deleteDoc(doc(db, "modelosEvento", m.id)); showToast("🗑️ Modelo removido"); }}>🗑️</button>
                    </div>
                  </div>
                ))}

                <div style={{ height: 1, background: "rgba(201,168,76,.15)", margin: "28px 0 20px" }} />

                <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 4, color: T.gold }}>Locais Padrão</div>
                <div style={{ fontSize: 12, color: T.textSub, marginBottom: 14 }}>Cadastre os locais mais usados (Igreja, Espaço de Comunhão, Sala, Casa...). Eles aparecem prontos na hora de criar um evento.</div>

                <div style={{ display: "flex", gap: 8, marginBottom: 0 }}>
                  <input style={{ ...S.input, marginBottom: 0, flex: 1 }}
                    placeholder="+ Novo local..."
                    value={novoLocalEvento}
                    onChange={e => setNovoLocalEvento(e.target.value)}
                    onKeyDown={async e => {
                      if (e.key === "Enter" && novoLocalEvento.trim()) {
                        await addDoc(collection(db, "locaisEvento"), { nome: novoLocalEvento.trim() });
                        setNovoLocalEvento("");
                        showToast("✅ Local adicionado!");
                      }
                    }} />
                  <button onClick={async () => {
                    if (!novoLocalEvento.trim()) return;
                    await addDoc(collection(db, "locaisEvento"), { nome: novoLocalEvento.trim() });
                    setNovoLocalEvento("");
                    showToast("✅ Local adicionado!");
                  }} style={{ padding: "0 14px", background: "rgba(201,168,76,.15)", border: "1px solid rgba(201,168,76,.3)", borderRadius: 10, color: T.gold, fontSize: 18, cursor: "pointer", flexShrink: 0 }}>+</button>
                </div>

                {locaisEvento.length > 0 && (
                  <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {locaisEvento.map(l => (
                      <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(201,168,76,.08)", border: "1px solid rgba(201,168,76,.2)", borderRadius: 20, padding: "3px 10px 3px 12px" }}>
                        <span style={{ fontSize: 12, color: T.textSub }}>{l.nome}</span>
                        <button onClick={async () => { await deleteDoc(doc(db, "locaisEvento", l.id)); }} style={{ background: "none", border: "none", color: T.textFaint, cursor: "pointer", fontSize: 14, lineHeight: 1, padding: "0 2px" }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
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
                <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 4, color: T.gold }}>🔔 Enviar Notificação</div>
                <div style={{ fontSize: 12, color: T.textSub, marginBottom: 16 }}>Envie uma mensagem push para todos os membros do app</div>
                <label style={S.label}>Título</label>
                <input style={{ ...S.input, marginBottom: 0 }} placeholder="Ex: Culto Especial hoje!" value={notifForm.titulo}
                  onChange={e => setNotifForm({ ...notifForm, titulo: e.target.value })} />
                <label style={S.label}>Mensagem</label>
                <textarea style={{ ...S.textarea, minHeight: 80 }} placeholder="Ex: Não perca o culto de hoje às 19h. Te esperamos!"
                  value={notifForm.mensagem} onChange={e => setNotifForm({ ...notifForm, mensagem: e.target.value })} />
                <button style={S.saveBtn} onClick={async () => {
                  if (!notifForm.titulo || !notifForm.mensagem) { showToast("⚠️ Preencha título e mensagem!"); return; }
                  try {
                    const res = await fetch("https://api.onesignal.com/notifications", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Key ${ONESIGNAL_API_KEY}`,
                      },
                      body: JSON.stringify({
                        app_id: ONESIGNAL_APP_ID,
                        included_segments: ["Total Subscriptions"],
                        headings: { pt: notifForm.titulo, en: notifForm.titulo },
                        contents: { pt: notifForm.mensagem, en: notifForm.mensagem },
                        url: "https://familia-alianca.vercel.app",
                      }),
                    });
                    const data = await res.json();
                    if (data.id) {
                      showToast("✅ Notificação enviada para todos!");
                      setNotifForm({ titulo: "", mensagem: "" });
                    } else {
                      showToast("❌ Erro ao enviar. Tente novamente.");
                    }
                  } catch {
                    showToast("❌ Erro de conexão com OneSignal.");
                  }
                }}>🔔 Enviar para todos</button>
                <div style={{ marginTop: 16, background: "rgba(201,168,76,.06)", border: "1px solid rgba(201,168,76,.15)", borderRadius: 10, padding: "12px 14px", fontSize: 12, color: T.textSub, lineHeight: 1.7 }}>
                  💡 A notificação será enviada imediatamente para todos os membros que permitiram notificações no app. Powered by OneSignal.
                </div>
              </div>
            )}

            {/* Admin: Pregação — Pastor insere tópicos/versículos, Mídia visualiza */}
            {adminTab === "pregacao" && (() => {
              const hoje5 = new Date().toISOString().split("T")[0];
              const eventosFuturos = agenda.filter(e => !e.data || e.data >= hoje5).sort((a, b) => a.data?.localeCompare(b.data));
              const pregacoesOrdenadas = [...pregacoes].sort((a, b) => (b.criadoEm || "").localeCompare(a.criadoEm || ""));
              return (
                <div style={{ padding: "0 16px" }}>
                  <div style={{ fontSize: 14, fontWeight: "bold", color: T.gold, marginBottom: 4 }}>🎙️ Pregação</div>
                  <div style={{ fontSize: 12, color: T.textSub, marginBottom: 16 }}>Insira o tema e os versículos da pregação. O Ministério de Mídia poderá visualizar e baixar para preparar o telão.</div>

                  <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: "14px 16px", marginBottom: 20 }}>
                    <label style={S.label}>Tema/Título *</label>
                    <input style={{ ...S.input, marginBottom: 0 }} placeholder="Ex: A Fé que Move Montanhas"
                      value={novaPregacao.titulo} onChange={e => setNovaPregacao({ ...novaPregacao, titulo: e.target.value })} />

                    <label style={S.label}>Versículos / Tópicos</label>
                    <textarea style={{ ...S.input, minHeight: 140, marginBottom: 0, fontFamily: "inherit", whiteSpace: "pre-wrap" }} placeholder={"Ex:\nMateus 17:20\nMarcos 11:22-24\nTópico 1: A fé que agrada a Deus\nTópico 2: Duvidar x Confiar"}
                      value={novaPregacao.versiculos} onChange={e => setNovaPregacao({ ...novaPregacao, versiculos: e.target.value })} />

                    <label style={S.label}>Vincular a um evento da agenda (define a data do culto)</label>
                    <select style={{ ...S.select, marginBottom: 0 }} value={novaPregacao.eventoId}
                      onChange={e => setNovaPregacao({ ...novaPregacao, eventoId: e.target.value })}>
                      <option value="">Nenhum evento específico</option>
                      {eventosFuturos.map(e => (
                        <option key={e.id} value={e.id}>{e.titulo} — {new Date(e.data + "T12:00").toLocaleDateString("pt-BR")}</option>
                      ))}
                    </select>

                    <button style={{ ...S.saveBtn, marginTop: 12 }} onClick={async () => {
                      if (!novaPregacao.titulo) { showToast("⚠️ Informe o tema/título!"); return; }
                      await addDoc(collection(db, "pregacoes"), { titulo: novaPregacao.titulo, versiculos: novaPregacao.versiculos, eventoId: novaPregacao.eventoId, criadoEm: new Date().toISOString(), criadoPor: user?.nome || "Pastor" });
                      setNovaPregacao({ titulo: "", versiculos: "", eventoId: "", data: "" });
                      showToast("✅ Pregação salva!");
                    }}>🎙️ Salvar Pregação</button>
                  </div>

                  <div style={{ fontSize: 12, color: T.gold, marginBottom: 10, letterSpacing: 1, textTransform: "uppercase" }}>Pregações cadastradas ({pregacoesOrdenadas.length})</div>
                  {pregacoesOrdenadas.length === 0 ? (
                    <div style={{ ...S.card, textAlign: "center", padding: "24px 0", marginLeft: 0, marginRight: 0 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🎙️</div>
                      <div style={{ fontSize: 13, color: T.textSub }}>Nenhuma pregação cadastrada ainda</div>
                    </div>
                  ) : pregacoesOrdenadas.map((p, idx) => {
                    const eventoVinculado = agenda.find(e => e.id === p.eventoId);
                    return (
                    <div key={p.id} style={{ ...S.card, marginLeft: 0, marginRight: 0, marginBottom: 10, border: idx === 0 ? "1px solid rgba(34,197,94,.35)" : undefined }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          {idx === 0 && <div style={{ fontSize: 10, fontWeight: "bold", color: "#22c55e", marginBottom: 4 }}>✅ MAIS RECENTE</div>}
                          <div style={{ fontSize: 13, fontWeight: "bold", color: T.text }}>{p.titulo}</div>
                          {eventoVinculado && <div style={{ fontSize: 11, color: T.gold, marginTop: 2 }}>📅 {eventoVinculado.titulo} — {new Date(eventoVinculado.data + "T12:00").toLocaleDateString("pt-BR")}</div>}
                          {p.versiculos && <div style={{ fontSize: 12, color: T.textSub, whiteSpace: "pre-wrap", marginTop: 6, lineHeight: 1.6 }}>{p.versiculos}</div>}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                          <button onClick={() => baixarPregacaoTxt(p)}
                            style={{ background: "rgba(34,197,94,.15)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 8, padding: "6px 10px", fontSize: 12, cursor: "pointer" }}>⬇️ .txt</button>
                          <button onClick={async () => { if (window.confirm("Excluir esta pregação?")) { await deleteDoc(doc(db, "pregacoes", p.id)); showToast("🗑️ Removida!"); } }}
                            style={S.delBtn}>🗑️</button>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Admin: Devocional */}
            {adminTab === "devocional" && (
              <div style={{ padding: "0 16px" }}>
                <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 4, color: T.gold }}>Devocional Diário</div>
                <div style={{ fontSize: 12, color: T.textSub, marginBottom: 16 }}>Publique o devocional do dia para os membros</div>

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
                    data: new Date().toISOString().split("T")[0],
                    criadoEm: new Date().toISOString()
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

            {/* Admin: Estudos Temáticos */}
            {adminTab === "estudos" && (
              <div style={{ padding: "0 16px" }}>
                <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 4, color: T.gold }}>
                  {editandoEstudo ? "✏️ Editar Estudo" : "📚 Novo Estudo Temático"}
                </div>
                <div style={{ fontSize: 12, color: T.textSub, marginBottom: 20 }}>
                  {editandoEstudo ? "Edite as informações do estudo abaixo" : "Crie estudos que aparecerão para os membros"}
                </div>

                <label style={S.label}>Nível</label>
                <select style={{ ...S.select, marginBottom: 0 }} value={novoEstudo.nivel}
                  onChange={e => setNovoEstudo({ ...novoEstudo, nivel: e.target.value })}>
                  <option value="iniciante">🌱 Iniciantes</option>
                  <option value="avancado">🔥 Avançados</option>
                </select>

                <label style={S.label}>Título do estudo *</label>
                <input style={{ ...S.input, marginBottom: 0 }} placeholder="Ex: O Poder da Oração"
                  value={novoEstudo.titulo}
                  onChange={e => setNovoEstudo({ ...novoEstudo, titulo: e.target.value })} />

                <label style={S.label}>Versículo base *</label>
                <input style={{ ...S.input, marginBottom: 0 }} placeholder="Ex: Lucas 18:1 — Era preciso orar sempre..."
                  value={novoEstudo.versiculo}
                  onChange={e => setNovoEstudo({ ...novoEstudo, versiculo: e.target.value })} />

                <label style={S.label}>Texto do estudo *</label>
                <div style={{ background: "rgba(201,168,76,.06)", border: "1px solid rgba(201,168,76,.15)", borderRadius: 8, padding: "8px 12px", marginBottom: 8, fontSize: 11, color: T.textSub }}>
                  💡 Use **negrito** para destacar. Enter para novo parágrafo.
                </div>
                <textarea style={{ ...S.textarea, minHeight: 180 }}
                  placeholder={"Escreva o conteúdo do estudo...\n\nUse **negrito** para destacar palavras importantes."}
                  value={novoEstudo.texto}
                  onChange={e => setNovoEstudo({ ...novoEstudo, texto: e.target.value })} />

                <label style={S.label}>Perguntas de Reflexão</label>
                {novoEstudo.perguntas.map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input style={{ ...S.input, marginBottom: 0, flex: 1 }} placeholder={`Pergunta ${i + 1}...`}
                      value={p} onChange={e => {
                        const ps = [...novoEstudo.perguntas];
                        ps[i] = e.target.value;
                        setNovoEstudo({ ...novoEstudo, perguntas: ps });
                      }} />
                    {novoEstudo.perguntas.length > 1 && (
                      <button style={{ ...S.delBtn, flexShrink: 0 }} onClick={() => {
                        const ps = novoEstudo.perguntas.filter((_, idx) => idx !== i);
                        setNovoEstudo({ ...novoEstudo, perguntas: ps });
                      }}>✕</button>
                    )}
                  </div>
                ))}
                <button style={{ ...S.switchBtn, marginBottom: 8 }} onClick={() => setNovoEstudo({ ...novoEstudo, perguntas: [...novoEstudo.perguntas, ""] })}>
                  + Adicionar pergunta
                </button>

                <label style={S.label}>Oração final</label>
                <textarea style={{ ...S.textarea, minHeight: 100 }}
                  placeholder="Escreva uma oração para encerrar o estudo..."
                  value={novoEstudo.oracao}
                  onChange={e => setNovoEstudo({ ...novoEstudo, oracao: e.target.value })} />

                <button style={S.saveBtn} onClick={async () => {
                  if (!novoEstudo.titulo || !novoEstudo.texto || !novoEstudo.versiculo) { showToast("⚠️ Preencha título, versículo e texto!"); return; }
                  if (editandoEstudo) {
                    await updateDoc(doc(db, "estudos", editandoEstudo), {
                      titulo: novoEstudo.titulo,
                      versiculo: novoEstudo.versiculo,
                      texto: novoEstudo.texto,
                      perguntas: novoEstudo.perguntas,
                      oracao: novoEstudo.oracao,
                      nivel: novoEstudo.nivel,
                    });
                    setEditandoEstudo(null);
                    showToast("✅ Estudo atualizado!");
                  } else {
                    await addDoc(collection(db, "estudos"), { ...novoEstudo, data: new Date().toISOString().split("T")[0] });
                    showToast("✅ Estudo publicado!");
                  }
                  setNovoEstudo({ titulo: "", versiculo: "", texto: "", perguntas: ["", "", ""], oracao: "", nivel: "iniciante" });
                }}>
                  {editandoEstudo ? "💾 Salvar Alterações" : "📚 Publicar Estudo"}
                </button>

                {editandoEstudo && (
                  <button style={{ ...S.saveBtn, background: T.card, color: T.textSub, marginTop: 8 }}
                    onClick={() => { setEditandoEstudo(null); setNovoEstudo({ titulo: "", versiculo: "", texto: "", perguntas: ["", "", ""], oracao: "", nivel: "iniciante" }); }}>
                    Cancelar edição
                  </button>
                )}

                {/* Lista de estudos publicados */}
                {estudos.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, color: T.gold, marginTop: 24, marginBottom: 12, letterSpacing: 2, textTransform: "uppercase" }}>
                      Estudos publicados ({estudos.length})
                    </div>
                    {estudos.map(e => (
                      <div key={e.id} style={{ ...S.card, marginLeft: 0, marginRight: 0, marginBottom: 10, display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: "bold", color: T.gold, marginBottom: 3 }}>{e.titulo}</div>
                          <div style={{ fontSize: 11, color: T.textSub, marginBottom: 2 }}>{e.nivel === "iniciante" ? "🌱 Iniciantes" : "🔥 Avançados"}</div>
                          <div style={{ fontSize: 11, color: T.textFaint, fontStyle: "italic" }}>{e.versiculo}</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <button style={{ padding: "6px 10px", background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.3)", borderRadius: 8, color: T.gold, fontSize: 12, cursor: "pointer", fontFamily: "Georgia,serif" }}
                            onClick={() => {
                              setEditandoEstudo(e.id);
                              setNovoEstudo({
                                titulo: e.titulo,
                                versiculo: e.versiculo,
                                texto: e.texto,
                                perguntas: e.perguntas || [""],
                                oracao: e.oracao || "",
                                nivel: e.nivel,
                              });
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}>✏️</button>
                          <button style={S.delBtn} onClick={async () => {
                            if (window.confirm("Excluir este estudo?")) {
                              await deleteDoc(doc(db, "estudos", e.id));
                              showToast("🗑️ Estudo removido!");
                            }
                          }}>🗑️</button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Admin: Banner Home */}
            {adminTab === "banner" && (
              <div style={{ padding: "0 16px" }}>
                <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 4, color: T.gold }}>🖼️ Banner da Home</div>
                <div style={{ fontSize: 12, color: T.textSub, marginBottom: 8 }}>Aparece acima da Palavra Semanal na tela inicial</div>

                {/* Medidas recomendadas */}
                <div style={{ background: "rgba(59,130,246,.08)", border: "1px solid rgba(59,130,246,.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#60a5fa", lineHeight: 1.8 }}>
                  📐 <strong>Medidas recomendadas:</strong><br/>
                  Largura: <strong>700px</strong> — Altura: <strong>280px</strong><br/>
                  Proporção: <strong>5:2</strong> — Formato: JPG ou PNG<br/>
                  Tamanho máximo: 2MB
                </div>

                <label style={S.label}>URL da Imagem *</label>
                <input style={{ ...S.input, marginBottom: 0 }}
                  placeholder="https://... (hospede a imagem no ImgBB, Cloudinary, etc)"
                  value={bannerHome?.url || ""}
                  onChange={e => setBannerHome({ ...bannerHome, url: e.target.value })} />

                <label style={S.label}>Título (opcional)</label>
                <input style={{ ...S.input, marginBottom: 0 }}
                  placeholder="Ex: Culto Especial de Páscoa"
                  value={bannerHome?.titulo || ""}
                  onChange={e => setBannerHome({ ...bannerHome, titulo: e.target.value })} />

                <label style={S.label}>Link ao clicar (opcional)</label>
                <input style={{ ...S.input, marginBottom: 0 }}
                  placeholder="Ex: https://youtube.com/..."
                  value={bannerHome?.link || ""}
                  onChange={e => setBannerHome({ ...bannerHome, link: e.target.value })} />

                {/* Preview */}
                {bannerHome?.url && (
                  <div style={{ marginTop: 16, marginBottom: 8 }}>
                    <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: T.gold, marginBottom: 8 }}>Preview</div>
                    <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(201,168,76,.2)" }}>
                      <img src={bannerHome.url} alt="Preview" style={{ width: "100%", display: "block" }}
                        onError={e => e.target.style.display = "none"} />
                    </div>
                  </div>
                )}

                <button style={S.saveBtn} onClick={async () => {
                  if (!bannerHome?.url) { showToast("⚠️ Insira a URL da imagem!"); return; }
                  await setDoc(doc(db, "config", "bannerHome"), {
                    url: bannerHome.url,
                    titulo: bannerHome.titulo || "",
                    link: bannerHome.link || "",
                    atualizado: new Date().toISOString()
                  });
                  showToast("✅ Banner publicado!");
                }}>🖼️ Publicar Banner</button>

                {bannerHome?.url && (
                  <button style={{ ...S.saveBtn, background: "rgba(239,68,68,.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,.3)", marginTop: 8 }}
                    onClick={async () => {
                      if (window.confirm("Remover o banner da home?")) {
                        await setDoc(doc(db, "config", "bannerHome"), { url: "", titulo: "", link: "" });
                        setBannerHome(null);
                        showToast("🗑️ Banner removido!");
                      }
                    }}>🗑️ Remover Banner</button>
                )}
              </div>
            )}

            {/* Admin: Líderes */}
            {adminTab === "lideres" && (
              <div style={{ padding: "0 16px" }}>
                <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 4, color: T.gold }}>🏛️ Gerenciar Líderes</div>
                <div style={{ fontSize: 12, color: T.textSub, marginBottom: 16 }}>Defina quais membros são líderes e qual ministério cada um gerencia</div>

                {/* Campo de busca */}
                <input style={{ ...S.input, marginBottom: 16 }}
                  placeholder="🔍 Buscar membro por nome ou e-mail..."
                  value={buscaMembro}
                  onChange={e => setBuscaMembro(e.target.value)} />

                {/* Líderes ativos no topo */}
                {membros.filter(m => m.lider && !m.admin).length > 0 && (
                  <div style={{ background: "rgba(201,168,76,.06)", border: "1px solid rgba(201,168,76,.15)", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: T.gold, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Líderes ativos ({membros.filter(m => m.lider && !m.admin).length})</div>
                    {membros.filter(m => m.lider && !m.admin && ((m.ministeriosLider?.length > 0) || m.ministerioLider)).map(m => (
                      <div key={m.id} style={{ fontSize: 12, color: T.textSub, marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                        <span>{m.nome}</span>
                        <span style={{ color: T.gold, textAlign: "right" }}>{(m.ministeriosLider?.length > 0 ? m.ministeriosLider : [m.ministerioLider]).filter(Boolean).join(", ")}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Contador */}
                {buscaMembro.trim() && (
                  <div style={{ fontSize: 11, color: T.textFaint, marginBottom: 10 }}>
                    {membros.filter(m => !m.admin && (m.nome?.toLowerCase().includes(buscaMembro.toLowerCase()) || m.email?.toLowerCase().includes(buscaMembro.toLowerCase()))).length} resultado(s)
                  </div>
                )}

                {/* Lista de membros */}
                {membros
                  .filter(m => !m.admin)
                  .filter(m => !buscaMembro.trim() ||
                    m.nome?.toLowerCase().includes(buscaMembro.toLowerCase()) ||
                    m.email?.toLowerCase().includes(buscaMembro.toLowerCase())
                  )
                  .sort((a, b) => a.nome?.localeCompare(b.nome))
                  .map(m => (
                  <div key={m.id} style={{ ...S.card, marginLeft: 0, marginRight: 0, marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: m.lider ? 10 : 0 }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: m.lider ? "rgba(201,168,76,.2)" : T.card, border: `1px solid ${m.lider ? "#c9a84c" : T.cardBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: "bold", color: m.lider ? "#c9a84c" : T.textSub, flexShrink: 0 }}>
                        {m.nome?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: "bold", color: T.text }}>{m.nome}</div>
                        <div style={{ fontSize: 11, color: T.textSub }}>{m.email}</div>
                        {m.lider && (m.ministeriosLider?.length > 0 || m.ministerioLider) && (
                          <div style={{ fontSize: 11, color: "#c9a84c", marginTop: 2 }}>🏛️ Líder de {(m.ministeriosLider?.length > 0 ? m.ministeriosLider : [m.ministerioLider]).filter(Boolean).join(", ")}</div>
                        )}
                      </div>
                      {/* Toggle líder */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: T.textSub }}>{m.lider ? "Líder" : "Membro"}</span>
                        <div onClick={async () => {
                          const novoLider = !m.lider;
                          const minsAtuais = m.ministeriosLider?.length > 0 ? m.ministeriosLider : (m.ministerioLider ? [m.ministerioLider] : []);
                          await updateDoc(doc(db, "membros", m.email), {
                            lider: novoLider,
                            ministeriosLider: novoLider ? minsAtuais : [],
                            ministerioLider: novoLider ? (minsAtuais[0] || "") : "" // compatibilidade
                          });
                          showToast(novoLider ? `✅ ${m.nome} é agora líder!` : `↩️ ${m.nome} voltou a ser membro`);
                        }} style={{ width: 46, height: 26, borderRadius: 13, background: m.lider ? "#c9a84c" : "rgba(150,150,150,.3)", cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
                          <div style={{ position: "absolute", top: 3, left: m.lider ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.3)" }} />
                        </div>
                      </div>
                    </div>

                    {/* Seletor de ministérios (múltiplos) quando é líder */}
                    {m.lider && (() => {
                      const minsSelecionados = m.ministeriosLider?.length > 0 ? m.ministeriosLider : (m.ministerioLider ? [m.ministerioLider] : []);
                      const toggleMin = async (nomeMin) => {
                        const novos = minsSelecionados.includes(nomeMin)
                          ? minsSelecionados.filter(x => x !== nomeMin)
                          : [...minsSelecionados, nomeMin];
                        await updateDoc(doc(db, "membros", m.email), {
                          ministeriosLider: novos,
                          ministerioLider: novos[0] || "" // compatibilidade com código legado
                        });
                        showToast(`✅ Ministérios atualizados!`);
                      };
                      return (
                        <div style={{ paddingTop: 8, borderTop: `1px solid ${T.cardBorder}` }}>
                          <div style={{ fontSize: 11, color: T.textSub, marginBottom: 6 }}>Ministério(s) que lidera:</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {MINISTERIOS.map(min => {
                              const ativo = minsSelecionados.includes(min.nome);
                              return (
                                <button key={min.id} onClick={() => toggleMin(min.nome)}
                                  style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${ativo ? "#c9a84c" : T.cardBorder}`, background: ativo ? "rgba(201,168,76,.15)" : "transparent", color: ativo ? "#c9a84c" : T.textSub, fontSize: 12, cursor: "pointer", fontFamily: "Georgia,serif", fontWeight: ativo ? "bold" : "normal" }}>
                                  {ativo ? "✓ " : ""}{min.icon} {min.nome}
                                </button>
                              );
                            })}
                          </div>
                          {minsSelecionados.length === 0 && (
                            <div style={{ fontSize: 11, color: "#f87171", marginTop: 6 }}>⚠️ Selecione ao menos um ministério</div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            )}

            {/* Admin: Banner Jejum */}
            {adminTab === "jejum" && (
              <div style={{ padding: "0 16px" }}>
                <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 4, color: "#818cf8" }}>🙏 Banner de Jejum</div>
                <div style={{ fontSize: 12, color: T.textSub, marginBottom: 16 }}>Aparece antes da Palavra Semanal. Atualize todo dia com o texto do dia.</div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: "bold", color: T.text }}>Banner visível na Home</div>
                    <div style={{ fontSize: 11, color: T.textSub }}>Desative para esconder sem apagar o conteúdo</div>
                  </div>
                  <div onClick={() => setBannerJejum(bj => ({ ...bj, ativo: !bj?.ativo }))}
                    style={{ width: 46, height: 26, borderRadius: 13, background: bannerJejum?.ativo ? "#4f46e5" : "rgba(150,150,150,.3)", cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
                    <div style={{ position: "absolute", top: 3, left: bannerJejum?.ativo ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.3)" }} />
                  </div>
                </div>

                <label style={S.label}>Título do banner *</label>
                <input style={{ ...S.input, marginBottom: 0 }}
                  placeholder="Ex: JEJUM EM FAMÍLIA — DIA 1"
                  value={bannerJejum?.titulo || ""}
                  onChange={e => setBannerJejum(bj => ({ ...bj, titulo: e.target.value }))} />

                <label style={S.label}>Subtítulo (data / tema do dia)</label>
                <input style={{ ...S.input, marginBottom: 0 }}
                  placeholder="Ex: 22/06 — BUSQUE A PRESENÇA"
                  value={bannerJejum?.subtitulo || ""}
                  onChange={e => setBannerJejum(bj => ({ ...bj, subtitulo: e.target.value }))} />

                <label style={S.label}>URL da imagem (abre ao clicar)</label>
                <input style={{ ...S.input, marginBottom: 0 }}
                  placeholder="https://i.ibb.co/..."
                  value={bannerJejum?.imagemUrl || ""}
                  onChange={e => setBannerJejum(bj => ({ ...bj, imagemUrl: e.target.value }))} />
                <div style={{ fontSize: 11, color: T.textSub, marginBottom: 12, marginTop: 4 }}>
                  💡 Hospede a imagem no imgbb.com e cole o Direct Link aqui.
                </div>

                {(bannerJejum?.titulo || bannerJejum?.imagemUrl) && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#818cf8", marginBottom: 8 }}>Preview</div>
                    <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(99,102,241,.35)", background: "linear-gradient(135deg,#eef2ff 0%,#e0e7ff 50%,#eef2ff 100%)" }}>
                      <div style={{ background: "linear-gradient(90deg,#4f46e5,#7c3aed)", padding: "5px 16px", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13 }}>🙏</span>
                        <span style={{ fontSize: 10, fontWeight: "bold", letterSpacing: 3, textTransform: "uppercase", color: "#fff" }}>Jejum em Família</span>
                      </div>
                      <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 17, fontWeight: "bold", color: "#312e81", lineHeight: 1.3, marginBottom: 6 }}>{bannerJejum?.titulo || "Título do dia"}</div>
                          {bannerJejum?.subtitulo && <div style={{ fontSize: 13, color: "#4f46e5", marginBottom: 10 }}>{bannerJejum.subtitulo}</div>}
                          {bannerJejum?.imagemUrl && (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "linear-gradient(90deg,#4f46e5,#7c3aed)", borderRadius: 20, padding: "7px 14px" }}>
                              <span style={{ fontSize: 12, fontWeight: "bold", color: "#fff" }}>Clique aqui e acompanhe o dia</span>
                              <span style={{ color: "#fff" }}>→</span>
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: 38 }}>✨</div>
                      </div>
                    </div>
                  </div>
                )}

                <button style={S.saveBtn} onClick={async () => {
                  if (!bannerJejum?.titulo) { showToast("⚠️ Insira o título do banner!"); return; }
                  await setDoc(doc(db, "config", "bannerJejum"), {
                    ativo: bannerJejum?.ativo ?? true,
                    titulo: bannerJejum?.titulo || "",
                    subtitulo: bannerJejum?.subtitulo || "",
                    imagemUrl: bannerJejum?.imagemUrl || "",
                    atualizado: new Date().toISOString(),
                  });
                  showToast("✅ Banner do Jejum publicado!");
                }}>🙏 Publicar Banner do Jejum</button>

                {bannerJejum?.titulo && (
                  <button style={{ ...S.saveBtn, background: "rgba(239,68,68,.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,.3)", marginTop: 8 }}
                    onClick={async () => {
                      if (window.confirm("Remover o banner do Jejum?")) {
                        await setDoc(doc(db, "config", "bannerJejum"), { ativo: false, titulo: "", subtitulo: "", imagemUrl: "" });
                        setBannerJejum({ ativo: false, titulo: "", subtitulo: "", imagemUrl: "" });
                        showToast("🗑️ Banner do Jejum removido!");
                      }
                    }}>🗑️ Remover Banner</button>
                )}
              </div>
            )}

            {/* Admin: Financeiro */}
            {adminTab === "financeiro" && (() => {
              const CATS_ENTRADA = ["Dízimo", "Oferta", "Contribuição especial", "Doação"];
              const CATS_SAIDA = ["Aluguel", "Contas", "Manutenção", "Material", "Eventos", "Salários/Honorários", "Missões", "Outros"];
              const COR_ENTRADA = "#22c55e";
              const COR_SAIDA = "#ef4444";

              // Filtrar por período
              const lancPeriodo = lancamentos.filter(l => l.data?.startsWith(finPeriodo));
              const totalEntrada = lancPeriodo.filter(l => l.tipo === "entrada").reduce((s, l) => s + (parseFloat(l.valor) || 0), 0);
              const totalSaida = lancPeriodo.filter(l => l.tipo === "saida").reduce((s, l) => s + (parseFloat(l.valor) || 0), 0);
              const saldo = totalEntrada - totalSaida;

              // Totais por categoria
              const porCategoria = (tipo) => {
                const cats = tipo === "entrada" ? CATS_ENTRADA : CATS_SAIDA;
                return cats.map(cat => ({
                  cat,
                  total: lancPeriodo.filter(l => l.tipo === tipo && l.categoria === cat).reduce((s, l) => s + (parseFloat(l.valor) || 0), 0)
                })).filter(c => c.total > 0);
              };

              const fmtVal = (v) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

              return (
                <div style={{ padding: "0 16px" }}>
                  {/* Seletor de view */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", scrollbarWidth: "none" }}>
                    {[{ id: "dashboard", label: "📊 Resumo" }, { id: "entradas", label: "🟢 Entradas (novo)" }, { id: "saidas", label: "🔴 Saídas (novo)" }, { id: "lancamentos", label: "📋 Lançamentos" }].map(v => (
                      <button key={v.id} onClick={() => setFinView(v.id)}
                        style={{ flexShrink: 0, padding: "8px 14px", border: `1px solid ${finView === v.id ? "#c9a84c" : T.cardBorder}`, borderRadius: 10, background: finView === v.id ? "linear-gradient(90deg,#c9a84c,#e8c97a)" : T.card, color: finView === v.id ? "#080810" : T.textSub, fontSize: 12, fontWeight: finView === v.id ? "bold" : "normal", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                        {v.label}
                      </button>
                    ))}
                  </div>

                  {/* Seletor de período */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <span style={{ fontSize: 12, color: T.textSub }}>Período:</span>
                    <input type="month" value={finPeriodo} onChange={e => setFinPeriodo(e.target.value)}
                      style={{ ...S.input, marginBottom: 0, flex: 1, padding: "8px 12px" }} />
                  </div>

                  {/* ── DASHBOARD ── */}
                  {finView === "dashboard" && (
                    <>
                      {/* Cards de resumo */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                        <div style={{ background: "rgba(34,197,94,.08)", border: "1px solid rgba(34,197,94,.25)", borderRadius: 14, padding: "14px 16px" }}>
                          <div style={{ fontSize: 11, color: COR_ENTRADA, letterSpacing: 1, marginBottom: 4 }}>ENTRADAS</div>
                          <div style={{ fontSize: 16, fontWeight: "bold", color: COR_ENTRADA }}>{fmtVal(totalEntrada)}</div>
                        </div>
                        <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 14, padding: "14px 16px" }}>
                          <div style={{ fontSize: 11, color: COR_SAIDA, letterSpacing: 1, marginBottom: 4 }}>SAÍDAS</div>
                          <div style={{ fontSize: 16, fontWeight: "bold", color: COR_SAIDA }}>{fmtVal(totalSaida)}</div>
                        </div>
                      </div>
                      <div style={{ background: saldo >= 0 ? "rgba(34,197,94,.08)" : "rgba(239,68,68,.08)", border: `1px solid ${saldo >= 0 ? "rgba(34,197,94,.25)" : "rgba(239,68,68,.25)"}`, borderRadius: 14, padding: "16px", marginBottom: 16, textAlign: "center" }}>
                        <div style={{ fontSize: 12, color: T.textSub, marginBottom: 4 }}>SALDO DO PERÍODO</div>
                        <div style={{ fontSize: 22, fontWeight: "bold", color: saldo >= 0 ? COR_ENTRADA : COR_SAIDA }}>{saldo >= 0 ? "+" : ""}{fmtVal(saldo)}</div>
                      </div>

                      {/* Entradas por categoria */}
                      {porCategoria("entrada").length > 0 && (
                        <>
                          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: COR_ENTRADA, marginBottom: 8 }}>Entradas por categoria</div>
                          {porCategoria("entrada").map((c, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: T.card, border: `1px solid ${T.cardBorder}`, borderLeft: `3px solid ${COR_ENTRADA}`, borderRadius: 10, marginBottom: 6 }}>
                              <span style={{ fontSize: 13, color: T.text }}>{c.cat}</span>
                              <span style={{ fontSize: 13, fontWeight: "bold", color: COR_ENTRADA }}>{fmtVal(c.total)}</span>
                            </div>
                          ))}
                        </>
                      )}

                      {/* Saídas por categoria */}
                      {porCategoria("saida").length > 0 && (
                        <>
                          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: COR_SAIDA, marginBottom: 8, marginTop: 14 }}>Saídas por categoria</div>
                          {porCategoria("saida").map((c, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: T.card, border: `1px solid ${T.cardBorder}`, borderLeft: `3px solid ${COR_SAIDA}`, borderRadius: 10, marginBottom: 6 }}>
                              <span style={{ fontSize: 13, color: T.text }}>{c.cat}</span>
                              <span style={{ fontSize: 13, fontWeight: "bold", color: COR_SAIDA }}>{fmtVal(c.total)}</span>
                            </div>
                          ))}
                        </>
                      )}

                      {lancPeriodo.length === 0 && (
                        <div style={{ textAlign: "center", padding: "28px 0", color: T.textSub, fontSize: 13 }}>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>💰</div>
                          Nenhum lançamento neste período
                        </div>
                      )}

                      {/* Botões Relatório */}
                      {lancPeriodo.length > 0 && (
                        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                          <button style={{ ...S.saveBtn, flex: 1, background: "rgba(201,168,76,.15)", color: T.gold, border: "1px solid rgba(201,168,76,.3)" }} onClick={() => {
                            const linhas = lancPeriodo.map(l =>
                              `${l.data} | ${l.tipo === "entrada" ? "ENTRADA" : "SAÍDA  "} | ${(l.categoria || "").padEnd(22)} | ${(l.descricao || "-").padEnd(25)} | R$ ${parseFloat(l.valor).toFixed(2)}`
                            ).join("\n");
                            setRelatorioVisivel({
                              titulo: `Relatório Financeiro — ${finPeriodo}`,
                              conteudo: `ENTRADAS: ${fmtVal(totalEntrada)}\nSAÍDAS:   ${fmtVal(totalSaida)}\nSALDO:    ${fmtVal(saldo)}\n\n${"─".repeat(50)}\nDATA       | TIPO    | CATEGORIA              | DESCRIÇÃO                 | VALOR\n${"─".repeat(50)}\n${linhas}\n${"─".repeat(50)}`
                            });
                          }}>👁️ Visualizar</button>
                          <button style={{ ...S.saveBtn, flex: 1, background: "#1a56db" }} onClick={() => {
                            const linhas = lancPeriodo.map(l =>
                              `${l.data} | ${l.tipo === "entrada" ? "ENTRADA" : "SAÍDA"} | ${l.categoria} | ${l.descricao || "-"} | R$ ${parseFloat(l.valor).toFixed(2)}`
                            ).join("\n");
                            const conteudo = `RELATÓRIO FINANCEIRO — FAMÍLIA ALIANÇA\nPeríodo: ${finPeriodo}\n\nENTRADAS: ${fmtVal(totalEntrada)}\nSAÍDAS: ${fmtVal(totalSaida)}\nSALDO: ${fmtVal(saldo)}\n\n${"─".repeat(60)}\n${linhas}\n${"─".repeat(60)}\nGerado em: ${new Date().toLocaleDateString("pt-BR")}`;
                            const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url; a.download = `financeiro-${finPeriodo}.txt`; a.click();
                            showToast("📄 Relatório baixado!");
                          }}>📥 Baixar</button>
                        </div>
                      )}
                    </>
                  )}

                  {/* ── NOVO: ENTRADAS (redesenho) ── */}
                  {finView === "entradas" && (() => {
                    const fmtV = v => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
                    const entradasPeriodoLista = entradas.filter(e => e.data?.startsWith(entradasPeriodo)).sort((a, b) => b.data.localeCompare(a.data));
                    const totalPeriodo = entradasPeriodoLista.reduce((s, e) => s + (parseFloat(e.valor) || 0), 0);
                    const totalDizimo = entradasPeriodoLista.filter(e => e.identificado && e.subtipo === "dizimo").reduce((s, e) => s + (parseFloat(e.valor) || 0), 0);
                    const totalOfertaIdent = entradasPeriodoLista.filter(e => e.identificado && e.subtipo === "oferta").reduce((s, e) => s + (parseFloat(e.valor) || 0), 0);
                    const totalOfertaNaoIdent = entradasPeriodoLista.filter(e => !e.identificado).reduce((s, e) => s + (parseFloat(e.valor) || 0), 0);
                    const labelTipoPag = { pix: "PIX", cartao: "Cartão", cheque: "Cheque", dinheiro: "Dinheiro" };

                    return (
                      <>
                        <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 4, color: T.gold }}>Nova Entrada</div>
                        <div style={{ fontSize: 12, color: T.textSub, marginBottom: 16 }}>Lançamento individual — dízimo, oferta identificada ou oferta avulsa.</div>

                        <label style={S.label}>Data *</label>
                        <input type="date" style={{ ...S.input, marginBottom: 0 }} value={novaEntrada.data}
                          onChange={e => setNovaEntrada({ ...novaEntrada, data: e.target.value })} />

                        <label style={S.label}>Valor (R$) *</label>
                        <input type="number" step="0.01" placeholder="0,00" style={{ ...S.input, marginBottom: 0 }} value={novaEntrada.valor}
                          onChange={e => setNovaEntrada({ ...novaEntrada, valor: e.target.value })} />

                        <label style={S.label}>Tipo</label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: novaEntrada.tipoPagamento === "outros" ? 8 : 0 }}>
                          {[{ id: "pix", label: "💠 PIX" }, { id: "cartao", label: "💳 CT" }, { id: "cheque", label: "📄 CH" }, { id: "dinheiro", label: "💵 $" }, { id: "outros", label: "✏️ Outros" }].map(t => (
                            <button key={t.id} onClick={() => setNovaEntrada({ ...novaEntrada, tipoPagamento: t.id })}
                              style={{ padding: "9px 0", border: `1px solid ${novaEntrada.tipoPagamento === t.id ? "#c9a84c" : T.cardBorder}`, borderRadius: 10, background: novaEntrada.tipoPagamento === t.id ? "rgba(201,168,76,.15)" : T.card, color: novaEntrada.tipoPagamento === t.id ? "#c9a84c" : T.textSub, fontSize: 12, fontWeight: novaEntrada.tipoPagamento === t.id ? "bold" : "normal", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                              {t.label}
                            </button>
                          ))}
                        </div>
                        {novaEntrada.tipoPagamento === "outros" && (
                          <input placeholder="Especifique o tipo..." style={{ ...S.input, marginBottom: 0 }} value={novaEntrada.outroTipoDesc}
                            onChange={e => setNovaEntrada({ ...novaEntrada, outroTipoDesc: e.target.value })} />
                        )}

                        <label style={{ ...S.label, marginTop: 14 }}>Identificado?</label>
                        <div style={{ display: "flex", gap: 8, marginBottom: novaEntrada.identificado !== null ? 12 : 0 }}>
                          {[{ id: true, label: "✅ Sim" }, { id: false, label: "🚫 Não" }].map(op => (
                            <button key={String(op.id)} onClick={() => setNovaEntrada({ ...novaEntrada, identificado: op.id, membroNome: "", membroEmail: "" })}
                              style={{ flex: 1, padding: "10px 0", border: `1px solid ${novaEntrada.identificado === op.id ? "#c9a84c" : T.cardBorder}`, borderRadius: 10, background: novaEntrada.identificado === op.id ? "rgba(201,168,76,.15)" : T.card, color: novaEntrada.identificado === op.id ? "#c9a84c" : T.textSub, fontSize: 13, fontWeight: "bold", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                              {op.label}
                            </button>
                          ))}
                        </div>

                        {novaEntrada.identificado === true && (
                          <>
                            <label style={S.label}>Isso é...</label>
                            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                              {[{ id: "dizimo", label: "🙏 Dízimo" }, { id: "oferta", label: "🎁 Oferta identificada" }].map(s => (
                                <button key={s.id} onClick={() => setNovaEntrada({ ...novaEntrada, subtipo: s.id })}
                                  style={{ flex: 1, padding: "9px 0", border: `1px solid ${novaEntrada.subtipo === s.id ? "#c9a84c" : T.cardBorder}`, borderRadius: 10, background: novaEntrada.subtipo === s.id ? "rgba(201,168,76,.15)" : T.card, color: novaEntrada.subtipo === s.id ? "#c9a84c" : T.textSub, fontSize: 12, fontWeight: "bold", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                                  {s.label}
                                </button>
                              ))}
                            </div>

                            <label style={S.label}>Pessoa</label>
                            {!nomeManualEntrada ? (
                              <div style={{ position: "relative", marginBottom: 8 }}>
                                <input style={{ ...S.input, marginBottom: 0 }} placeholder="Buscar pessoa cadastrada..."
                                  value={buscaEntradaMembro}
                                  onChange={e => { setBuscaEntradaMembro(e.target.value); setMostrarSugestoesEntrada(true); setNovaEntrada({ ...novaEntrada, membroNome: e.target.value, membroEmail: "" }); }}
                                  onFocus={() => setMostrarSugestoesEntrada(true)} />
                                {mostrarSugestoesEntrada && buscaEntradaMembro.length > 1 && (
                                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: darkMode ? "#07112a" : "#fff", border: `1px solid ${T.cardBorder}`, borderRadius: 10, zIndex: 100, maxHeight: 180, overflowY: "auto", boxShadow: "0 4px 16px rgba(0,0,0,.3)" }}>
                                    {membros.filter(m => m.nome?.toLowerCase().includes(buscaEntradaMembro.toLowerCase())).slice(0, 6).map(m => (
                                      <div key={m.id} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: `1px solid ${T.cardBorder}`, fontSize: 13, color: T.text }}
                                        onClick={() => { setNovaEntrada({ ...novaEntrada, membroNome: m.nome, membroEmail: m.email || "" }); setBuscaEntradaMembro(m.nome); setMostrarSugestoesEntrada(false); }}>
                                        <div style={{ fontWeight: "bold" }}>{m.nome}</div>
                                        {m.email && <div style={{ fontSize: 11, color: T.textSub }}>{m.email}</div>}
                                      </div>
                                    ))}
                                    {membros.filter(m => m.nome?.toLowerCase().includes(buscaEntradaMembro.toLowerCase())).length === 0 && (
                                      <div style={{ padding: "10px 14px", fontSize: 13, color: T.textSub }}>Nenhum membro encontrado</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Digite o nome completo..."
                                value={novaEntrada.membroNome}
                                onChange={e => setNovaEntrada({ ...novaEntrada, membroNome: e.target.value })} />
                            )}
                            <button onClick={() => { setNomeManualEntrada(!nomeManualEntrada); setBuscaEntradaMembro(""); setNovaEntrada({ ...novaEntrada, membroNome: "", membroEmail: "" }); }}
                              style={{ background: "none", border: "none", color: T.gold, fontSize: 12, cursor: "pointer", padding: 0, marginBottom: 12, textDecoration: "underline" }}>
                              {nomeManualEntrada ? "🔍 Buscar pessoa cadastrada" : "✏️ Pessoa não está cadastrada — digitar nome"}
                            </button>
                          </>
                        )}

                        {novaEntrada.identificado === false && (
                          <div style={{ background: "rgba(201,168,76,.08)", border: "1px solid rgba(201,168,76,.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: T.textSub }}>
                            Será registrado como <strong style={{ color: T.gold }}>Oferta</strong>, sem identificação de pessoa.
                          </div>
                        )}

                        <button style={S.saveBtn} onClick={async () => {
                          if (!novaEntrada.valor || !novaEntrada.data) { showToast("⚠️ Preencha valor e data!"); return; }
                          if (novaEntrada.identificado === null) { showToast("⚠️ Responda se é identificado!"); return; }
                          if (novaEntrada.identificado && !novaEntrada.membroNome.trim()) { showToast("⚠️ Informe o nome da pessoa!"); return; }
                          if (novaEntrada.tipoPagamento === "outros" && !novaEntrada.outroTipoDesc.trim()) { showToast("⚠️ Especifique o tipo de pagamento!"); return; }

                          await addDoc(collection(db, "entradas"), {
                            data: novaEntrada.data,
                            valor: parseFloat(novaEntrada.valor),
                            tipoPagamento: novaEntrada.tipoPagamento,
                            outroTipoDesc: novaEntrada.tipoPagamento === "outros" ? novaEntrada.outroTipoDesc.trim() : "",
                            identificado: novaEntrada.identificado,
                            subtipo: novaEntrada.identificado ? novaEntrada.subtipo : "oferta",
                            membroNome: novaEntrada.identificado ? novaEntrada.membroNome.trim() : "",
                            membroEmail: novaEntrada.identificado ? novaEntrada.membroEmail : "",
                            criadoEm: new Date().toISOString(),
                          });

                          setNovaEntrada({ data: new Date().toISOString().split("T")[0], valor: "", tipoPagamento: "pix", outroTipoDesc: "", identificado: null, subtipo: "dizimo", membroNome: "", membroEmail: "" });
                          setBuscaEntradaMembro(""); setNomeManualEntrada(false);
                          showToast("✅ Entrada registrada!");
                        }}>💰 Registrar Entrada</button>

                        {/* Lista do período */}
                        <div style={{ marginTop: 28 }}>
                          <div style={{ fontSize: 12, color: T.gold, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>📋 Entradas do Período</div>
                          <input type="month" value={entradasPeriodo} onChange={e => setEntradasPeriodo(e.target.value)} style={{ ...S.input, marginBottom: 12 }} />

                          {entradasPeriodoLista.length > 0 && (
                            <div style={{ background: "rgba(34,197,94,.08)", border: "1px solid rgba(34,197,94,.2)", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                <span style={{ fontSize: 12, color: T.textSub }}>Total do período</span>
                                <span style={{ fontSize: 15, fontWeight: "bold", color: "#22c55e" }}>{fmtV(totalPeriodo)}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <span style={{ fontSize: 11, color: T.textSub }}>🙏 Dízimos</span>
                                <span style={{ fontSize: 12, color: T.text }}>{fmtV(totalDizimo)}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <span style={{ fontSize: 11, color: T.textSub }}>🎁 Ofertas identificadas</span>
                                <span style={{ fontSize: 12, color: T.text }}>{fmtV(totalOfertaIdent)}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 11, color: T.textSub }}>💰 Ofertas (não identificadas)</span>
                                <span style={{ fontSize: 12, color: T.text }}>{fmtV(totalOfertaNaoIdent)}</span>
                              </div>
                            </div>
                          )}

                          {entradasPeriodoLista.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "20px 0", color: T.textSub, fontSize: 13 }}>Nenhuma entrada neste período</div>
                          ) : entradasPeriodoLista.map(e => (
                            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: T.card, border: `1px solid ${T.cardBorder}`, borderLeft: "3px solid #22c55e", borderRadius: 12, marginBottom: 8 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                                  <span style={{ fontSize: 13, fontWeight: "bold", color: T.text }}>
                                    {e.identificado ? (e.subtipo === "dizimo" ? "🙏 Dízimo" : "🎁 Oferta identificada") : "💰 Oferta"}
                                  </span>
                                  <span style={{ fontSize: 13, fontWeight: "bold", color: "#22c55e" }}>{fmtV(parseFloat(e.valor))}</span>
                                </div>
                                {e.identificado && <div style={{ fontSize: 12, color: T.textSub }}>{e.membroNome}</div>}
                                <div style={{ fontSize: 11, color: T.textFaint, marginTop: 2 }}>
                                  {new Date(e.data + "T12:00:00").toLocaleDateString("pt-BR")} • {e.tipoPagamento === "outros" ? e.outroTipoDesc : labelTipoPag[e.tipoPagamento]}
                                </div>
                              </div>
                              <button style={S.delBtn} onClick={async () => {
                                if (window.confirm("Excluir esta entrada?")) {
                                  await deleteDoc(doc(db, "entradas", e.id));
                                  showToast("🗑️ Removido!");
                                }
                              }}>🗑️</button>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}

                  {/* ── NOVO: SAÍDAS (redesenho) ── */}
                  {finView === "saidas" && (() => {
                    const fmtV = v => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
                    const fmtD = s => s ? new Date(s + "T12:00:00").toLocaleDateString("pt-BR") : "—";
                    const hoje = new Date().toISOString().split("T")[0];
                    const labelTipo = { boleto: "🧾 Boleto", debito: "💳 Débito", pix: "💠 PIX", dinheiro: "💵 $" };

                    const totalPendente = saidas.filter(s => !s.pago).reduce((s2, s) => s2 + (parseFloat(s.valor) || 0), 0);
                    const totalVencido = saidas.filter(s => !s.pago && s.dataVencimento && s.dataVencimento < hoje).reduce((s2, s) => s2 + (parseFloat(s.valor) || 0), 0);

                    const filtradas = saidas
                      .filter(s => filtroSaidaStatus === "todas" ? true : filtroSaidaStatus === "pagas" ? s.pago : !s.pago)
                      .filter(s => !buscaSaida.trim() || s.descricao?.toLowerCase().includes(buscaSaida.trim().toLowerCase()));

                    return (
                      <>
                        <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 4, color: T.gold }}>Nova Saída</div>
                        <div style={{ fontSize: 12, color: T.textSub, marginBottom: 16 }}>Cadastre a conta com o vencimento. Depois, busque e dê baixa quando pagar.</div>

                        <label style={S.label}>Descrição / Fornecedor *</label>
                        <input placeholder="Ex: Aluguel do salão, Energia elétrica..." style={{ ...S.input, marginBottom: 0 }}
                          value={novaSaida.descricao}
                          onChange={e => setNovaSaida({ ...novaSaida, descricao: e.target.value })} />

                        <label style={S.label}>Data do Lançamento *</label>
                        <input type="date" style={{ ...S.input, marginBottom: 0 }} value={novaSaida.dataLancamento}
                          onChange={e => setNovaSaida({ ...novaSaida, dataLancamento: e.target.value })} />

                        <label style={S.label}>Data do Vencimento *</label>
                        <input type="date" style={{ ...S.input, marginBottom: 0 }} value={novaSaida.dataVencimento}
                          onChange={e => setNovaSaida({ ...novaSaida, dataVencimento: e.target.value })} />

                        <label style={S.label}>Tipo</label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 0 }}>
                          {[{ id: "boleto", label: "🧾 Boleto" }, { id: "debito", label: "💳 Débito" }, { id: "pix", label: "💠 PIX" }, { id: "dinheiro", label: "💵 $" }].map(t => (
                            <button key={t.id} onClick={() => setNovaSaida({ ...novaSaida, tipo: t.id })}
                              style={{ padding: "9px 0", border: `1px solid ${novaSaida.tipo === t.id ? "#ef4444" : T.cardBorder}`, borderRadius: 10, background: novaSaida.tipo === t.id ? "rgba(239,68,68,.15)" : T.card, color: novaSaida.tipo === t.id ? "#ef4444" : T.textSub, fontSize: 11, fontWeight: novaSaida.tipo === t.id ? "bold" : "normal", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                              {t.label}
                            </button>
                          ))}
                        </div>

                        <label style={S.label}>Valor (R$) *</label>
                        <input type="number" step="0.01" placeholder="0,00" style={{ ...S.input, marginBottom: 0 }}
                          value={novaSaida.valor}
                          onChange={e => setNovaSaida({ ...novaSaida, valor: e.target.value })} />

                        <button style={{ ...S.saveBtn, background: "linear-gradient(90deg,#ef4444,#f87171)" }} onClick={async () => {
                          if (!novaSaida.descricao.trim() || !novaSaida.dataVencimento || !novaSaida.valor) { showToast("⚠️ Preencha descrição, vencimento e valor!"); return; }
                          await addDoc(collection(db, "saidas"), {
                            descricao: novaSaida.descricao.trim(),
                            dataLancamento: novaSaida.dataLancamento,
                            dataVencimento: novaSaida.dataVencimento,
                            tipo: novaSaida.tipo,
                            valor: parseFloat(novaSaida.valor),
                            pago: false,
                            dataPagamento: "",
                            criadoEm: new Date().toISOString(),
                          });
                          setNovaSaida({ descricao: "", dataLancamento: new Date().toISOString().split("T")[0], dataVencimento: "", tipo: "boleto", valor: "" });
                          showToast("✅ Saída cadastrada!");
                        }}>💸 Cadastrar Saída</button>

                        {/* Resumo */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 24, marginBottom: 16 }}>
                          <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 14, padding: "14px 16px" }}>
                            <div style={{ fontSize: 11, color: "#ef4444", letterSpacing: 1, marginBottom: 4 }}>PENDENTE</div>
                            <div style={{ fontSize: 16, fontWeight: "bold", color: "#ef4444" }}>{fmtV(totalPendente)}</div>
                          </div>
                          <div style={{ background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.4)", borderRadius: 14, padding: "14px 16px" }}>
                            <div style={{ fontSize: 11, color: "#ef4444", letterSpacing: 1, marginBottom: 4 }}>VENCIDO</div>
                            <div style={{ fontSize: 16, fontWeight: "bold", color: "#ef4444" }}>{fmtV(totalVencido)}</div>
                          </div>
                        </div>

                        {/* Busca */}
                        <div style={{ fontSize: 12, color: T.gold, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>🔍 Buscar / Dar Baixa</div>
                        <input placeholder="Buscar por descrição/fornecedor..." style={{ ...S.input, marginBottom: 12 }}
                          value={buscaSaida} onChange={e => setBuscaSaida(e.target.value)} />

                        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                          {[{ id: "pendentes", label: "⏳ Pendentes" }, { id: "pagas", label: "✅ Pagas" }, { id: "todas", label: "📋 Todas" }].map(f => (
                            <button key={f.id} onClick={() => setFiltroSaidaStatus(f.id)}
                              style={{ flex: 1, padding: "8px 0", border: `1px solid ${filtroSaidaStatus === f.id ? "#c9a84c" : T.cardBorder}`, borderRadius: 10, background: filtroSaidaStatus === f.id ? "linear-gradient(90deg,#c9a84c,#e8c97a)" : T.card, color: filtroSaidaStatus === f.id ? "#080810" : T.textSub, fontSize: 12, fontWeight: filtroSaidaStatus === f.id ? "bold" : "normal", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                              {f.label}
                            </button>
                          ))}
                        </div>

                        {filtradas.length === 0 ? (
                          <div style={{ textAlign: "center", padding: "20px 0", color: T.textSub, fontSize: 13 }}>Nenhuma saída encontrada</div>
                        ) : filtradas.map(s => {
                          const vencida = !s.pago && s.dataVencimento && s.dataVencimento < hoje;
                          return (
                            <div key={s.id} style={{ padding: "12px 14px", background: T.card, border: `1px solid ${T.cardBorder}`, borderLeft: `3px solid ${s.pago ? "#22c55e" : vencida ? "#ef4444" : "#c9a84c"}`, borderRadius: 12, marginBottom: 8 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                                <span style={{ fontSize: 13, fontWeight: "bold", color: T.text }}>{s.descricao}</span>
                                <span style={{ fontSize: 13, fontWeight: "bold", color: "#ef4444" }}>{fmtV(parseFloat(s.valor))}</span>
                              </div>
                              <div style={{ fontSize: 11, color: T.textFaint, marginBottom: 4 }}>
                                {labelTipo[s.tipo]} • Vencimento: <span style={{ color: vencida ? "#ef4444" : T.textFaint, fontWeight: vencida ? "bold" : "normal" }}>{fmtD(s.dataVencimento)}</span>
                                {vencida && " ⚠️ Vencida"}
                              </div>

                              {s.pago ? (
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                                  <span style={{ fontSize: 12, color: "#22c55e", fontWeight: "bold" }}>✅ Pago em {fmtD(s.dataPagamento)}</span>
                                  <div style={{ display: "flex", gap: 8 }}>
                                    <button onClick={async () => { await updateDoc(doc(db, "saidas", s.id), { pago: false, dataPagamento: "" }); showToast("↩️ Baixa desfeita"); }}
                                      style={{ padding: "6px 10px", background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 8, color: T.textSub, fontSize: 11, cursor: "pointer", fontFamily: "Georgia,serif" }}>🔄 Reabrir</button>
                                    <button style={S.delBtn} onClick={async () => {
                                      if (window.confirm("Excluir esta saída?")) { await deleteDoc(doc(db, "saidas", s.id)); showToast("🗑️ Removido!"); }
                                    }}>🗑️</button>
                                  </div>
                                </div>
                              ) : saidaBaixaId === s.id ? (
                                <div style={{ marginTop: 10, padding: 10, background: "rgba(34,197,94,.08)", border: "1px solid rgba(34,197,94,.25)", borderRadius: 10 }}>
                                  <label style={{ ...S.label, marginTop: 0 }}>Data do Pagamento</label>
                                  <input type="date" style={{ ...S.input, marginBottom: 8 }} value={dataBaixaTemp} onChange={e => setDataBaixaTemp(e.target.value)} />
                                  <div style={{ display: "flex", gap: 8 }}>
                                    <button style={{ flex: 1, padding: "8px 0", background: "#22c55e", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: "bold", cursor: "pointer", fontFamily: "Georgia,serif" }}
                                      onClick={async () => {
                                        await updateDoc(doc(db, "saidas", s.id), { pago: true, dataPagamento: dataBaixaTemp });
                                        setSaidaBaixaId(null);
                                        showToast("✅ Pagamento confirmado!");
                                      }}>✅ Confirmar</button>
                                    <button style={{ flex: 1, padding: "8px 0", background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 8, color: T.textSub, fontSize: 12, cursor: "pointer", fontFamily: "Georgia,serif" }}
                                      onClick={() => setSaidaBaixaId(null)}>Cancelar</button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                                  <button style={{ padding: "6px 12px", background: "rgba(201,168,76,.15)", border: "1px solid rgba(201,168,76,.3)", borderRadius: 8, color: T.gold, fontSize: 12, fontWeight: "bold", cursor: "pointer", fontFamily: "Georgia,serif" }}
                                    onClick={() => { setSaidaBaixaId(s.id); setDataBaixaTemp(hoje); }}>💰 Dar Baixa</button>
                                  <button style={S.delBtn} onClick={async () => {
                                    if (window.confirm("Excluir esta saída?")) { await deleteDoc(doc(db, "saidas", s.id)); showToast("🗑️ Removido!"); }
                                  }}>🗑️</button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </>
                    );
                  })()}

                  {/* ── LANÇAMENTOS ── */}
                  {finView === "lancamentos" && (
                    <>
                      <div style={{ fontSize: 13, color: T.textSub, marginBottom: 12 }}>{lancPeriodo.length} lançamento(s) no período</div>
                      {lancPeriodo.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "28px 0", color: T.textSub, fontSize: 13 }}>Nenhum lançamento neste período</div>
                      ) : lancPeriodo.map(l => (
                        <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: T.card, border: `1px solid ${T.cardBorder}`, borderLeft: `3px solid ${l.tipo === "entrada" ? COR_ENTRADA : COR_SAIDA}`, borderRadius: 12, marginBottom: 8 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                              <span style={{ fontSize: 13, fontWeight: "bold", color: T.text }}>{l.categoria}</span>
                              <span style={{ fontSize: 13, fontWeight: "bold", color: l.tipo === "entrada" ? COR_ENTRADA : COR_SAIDA }}>{l.tipo === "entrada" ? "+" : "-"}{fmtVal(parseFloat(l.valor))}</span>
                            </div>
                            {l.descricao && <div style={{ fontSize: 12, color: T.textSub }}>{l.descricao}</div>}
                            <div style={{ fontSize: 11, color: T.textFaint, marginTop: 2 }}>{new Date(l.data + "T12:00:00").toLocaleDateString("pt-BR")}</div>
                          </div>
                          <button style={S.delBtn} onClick={async () => {
                            if (window.confirm("Excluir lançamento?")) {
                              await deleteDoc(doc(db, "lancamentos", l.id));
                              showToast("🗑️ Removido!");
                            }
                          }}>🗑️</button>
                        </div>
                      ))}
                    </>
                  )}

                  {/* ── NOVO LANÇAMENTO ── */}
                  {finView === "novo" && (
                    <>
                      <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 16, color: T.gold }}>Novo Lançamento</div>

                      <label style={S.label}>Tipo</label>
                      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                        {[{ id: "entrada", label: "✅ Entrada" }, { id: "saida", label: "❌ Saída" }].map(t => (
                          <button key={t.id} onClick={() => setNovoLancamento({ ...novoLancamento, tipo: t.id, categoria: t.id === "entrada" ? "Dízimo" : "Aluguel" })}
                            style={{ flex: 1, padding: "10px 0", border: `1px solid ${novoLancamento.tipo === t.id ? (t.id === "entrada" ? COR_ENTRADA : COR_SAIDA) : T.cardBorder}`, borderRadius: 10, background: novoLancamento.tipo === t.id ? (t.id === "entrada" ? "rgba(34,197,94,.15)" : "rgba(239,68,68,.15)") : T.card, color: novoLancamento.tipo === t.id ? (t.id === "entrada" ? COR_ENTRADA : COR_SAIDA) : T.textSub, fontSize: 13, fontWeight: "bold", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                            {t.label}
                          </button>
                        ))}
                      </div>

                      <label style={S.label}>Categoria</label>
                      <select style={{ ...S.select, marginBottom: 0 }} value={novoLancamento.categoria}
                        onChange={e => setNovoLancamento({ ...novoLancamento, categoria: e.target.value })}>
                        {(novoLancamento.tipo === "entrada" ? CATS_ENTRADA : CATS_SAIDA).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>

                      <label style={S.label}>Valor (R$) *</label>
                      <input type="number" step="0.01" placeholder="0,00" style={{ ...S.input, marginBottom: 0 }}
                        value={novoLancamento.valor}
                        onChange={e => setNovoLancamento({ ...novoLancamento, valor: e.target.value })} />

                      <label style={S.label}>Data *</label>
                      <input type="date" style={{ ...S.input, marginBottom: 0 }}
                        value={novoLancamento.data}
                        onChange={e => setNovoLancamento({ ...novoLancamento, data: e.target.value })} />

                      <label style={S.label}>Descrição (opcional)</label>
                      <input placeholder="Ex: Oferta do culto dominical" style={{ ...S.input, marginBottom: 0 }}
                        value={novoLancamento.descricao}
                        onChange={e => setNovoLancamento({ ...novoLancamento, descricao: e.target.value })} />

                      <button style={S.saveBtn} onClick={async () => {
                        if (!novoLancamento.valor || !novoLancamento.data) { showToast("⚠️ Preencha valor e data!"); return; }
                        await addDoc(collection(db, "lancamentos"), {
                          ...novoLancamento,
                          valor: parseFloat(novoLancamento.valor),
                          criadoEm: new Date().toISOString()
                        });
                        setNovoLancamento({ tipo: "entrada", categoria: "Dízimo", descricao: "", valor: "", data: new Date().toISOString().split("T")[0] });
                        setFinView("lancamentos");
                        showToast("✅ Lançamento registrado!");
                      }}>💰 Registrar Lançamento</button>
                    </>
                  )}
                  {/* ── DIZIMISTAS ── */}
                  {finView === "dizimistas" && (
                    <>
                      <div style={{ fontSize: 14, fontWeight: "bold", color: T.gold, marginBottom: 4 }}>🙏 Registrar Dízimo</div>
                      <div style={{ fontSize: 12, color: T.textSub, marginBottom: 16 }}>Cadastre o dízimo de um membro buscando pelo nome</div>

                      {/* Busca de membro */}
                      <label style={S.label}>Nome do Dizimista *</label>
                      <div style={{ position: "relative", marginBottom: 0 }}>
                        <input style={{ ...S.input, marginBottom: 0 }}
                          placeholder="Digite o nome do membro..."
                          value={buscaDizimista}
                          onChange={e => { setBuscaDizimista(e.target.value); setMostrarSugestoes(true); setNovoDizimo({ ...novoDizimo, membroNome: e.target.value, membroEmail: "" }); }}
                          onFocus={() => setMostrarSugestoes(true)} />
                        {/* Sugestões */}
                        {mostrarSugestoes && buscaDizimista.length > 1 && (
                          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: darkMode ? "#07112a" : "#fff", border: `1px solid ${T.cardBorder}`, borderRadius: 10, zIndex: 100, maxHeight: 180, overflowY: "auto", boxShadow: "0 4px 16px rgba(0,0,0,.3)" }}>
                            {membros.filter(m => m.nome?.toLowerCase().includes(buscaDizimista.toLowerCase())).slice(0, 6).map(m => (
                              <div key={m.id} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: `1px solid ${T.cardBorder}`, fontSize: 13, color: T.text }}
                                onClick={() => { setNovoDizimo({ ...novoDizimo, membroNome: m.nome, membroEmail: m.email || "" }); setBuscaDizimista(m.nome); setMostrarSugestoes(false); }}>
                                <div style={{ fontWeight: "bold" }}>{m.nome}</div>
                                {m.email && <div style={{ fontSize: 11, color: T.textSub }}>{m.email}</div>}
                              </div>
                            ))}
                            {membros.filter(m => m.nome?.toLowerCase().includes(buscaDizimista.toLowerCase())).length === 0 && (
                              <div style={{ padding: "10px 14px", fontSize: 13, color: T.textSub }}>Nenhum membro encontrado</div>
                            )}
                          </div>
                        )}
                      </div>

                      <label style={S.label}>Valor (R$) *</label>
                      <input type="number" step="0.01" placeholder="0,00" style={{ ...S.input, marginBottom: 0 }}
                        value={novoDizimo.valor}
                        onChange={e => setNovoDizimo({ ...novoDizimo, valor: e.target.value })} />

                      <label style={S.label}>Data *</label>
                      <input type="date" style={{ ...S.input, marginBottom: 0 }}
                        value={novoDizimo.data}
                        onChange={e => setNovoDizimo({ ...novoDizimo, data: e.target.value })} />

                      <label style={S.label}>Forma de Pagamento</label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 0 }}>
                        {[{ id: "pix", label: "💠 PIX" }, { id: "cartao", label: "💳 Cartão" }, { id: "deposito", label: "🏦 Depósito" }, { id: "cheque", label: "📄 Cheque" }].map(f => (
                          <button key={f.id} onClick={() => setNovoDizimo({ ...novoDizimo, formaPagamento: f.id })}
                            style={{ padding: "10px 0", border: `1px solid ${novoDizimo.formaPagamento === f.id ? "#c9a84c" : T.cardBorder}`, borderRadius: 10, background: novoDizimo.formaPagamento === f.id ? "rgba(201,168,76,.15)" : T.card, color: novoDizimo.formaPagamento === f.id ? "#c9a84c" : T.textSub, fontSize: 12, fontWeight: novoDizimo.formaPagamento === f.id ? "bold" : "normal", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                            {f.label}
                          </button>
                        ))}
                      </div>

                      <button style={{ ...S.saveBtn, marginTop: 16 }} onClick={async () => {
                        if (!novoDizimo.membroNome || !novoDizimo.valor || !novoDizimo.data) { showToast("⚠️ Preencha nome, valor e data!"); return; }
                        await addDoc(collection(db, "dizimistas"), {
                          ...novoDizimo,
                          valor: parseFloat(novoDizimo.valor),
                          criadoEm: new Date().toISOString()
                        });
                        setNovoDizimo({ membroNome: "", membroEmail: "", valor: "", data: new Date().toISOString().split("T")[0], formaPagamento: "pix" });
                        setBuscaDizimista("");
                        showToast("✅ Dízimo registrado!");
                      }}>🙏 Registrar Dízimo</button>

                      {/* Lista de dizimistas do período */}
                      <div style={{ marginTop: 24 }}>
                        <div style={{ fontSize: 12, color: T.gold, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>📋 Relatório de Dizimistas</div>

                        {/* Tipo de filtro */}
                        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                          {[{ id: "mes", label: "📅 Por Mês" }, { id: "periodo", label: "📆 Por Período" }].map(f => (
                            <button key={f.id} onClick={() => setDizimoFiltroTipo(f.id)}
                              style={{ flex: 1, padding: "8px 0", border: `1px solid ${dizimoFiltroTipo === f.id ? "#c9a84c" : T.cardBorder}`, borderRadius: 10, background: dizimoFiltroTipo === f.id ? "linear-gradient(90deg,#c9a84c,#e8c97a)" : T.card, color: dizimoFiltroTipo === f.id ? "#080810" : T.textSub, fontSize: 12, fontWeight: dizimoFiltroTipo === f.id ? "bold" : "normal", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                              {f.label}
                            </button>
                          ))}
                        </div>

                        {/* Filtro por mês */}
                        {dizimoFiltroTipo === "mes" && (
                          <input type="month" value={dizimoPeriodo} onChange={e => setDizimoPeriodo(e.target.value)}
                            style={{ ...S.input, marginBottom: 12 }} />
                        )}

                        {/* Filtro por período */}
                        {dizimoFiltroTipo === "periodo" && (
                          <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 11, color: T.textSub, marginBottom: 4 }}>De:</div>
                              <input type="date" value={dizimoDataInicio} onChange={e => setDizimoDataInicio(e.target.value)}
                                style={{ ...S.input, marginBottom: 0 }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 11, color: T.textSub, marginBottom: 4 }}>Até:</div>
                              <input type="date" value={dizimoDataFim} onChange={e => setDizimoDataFim(e.target.value)}
                                style={{ ...S.input, marginBottom: 0 }} />
                            </div>
                          </div>
                        )}

                        {(() => {
                          // Filtrar dizimistas
                          const filtrados = dizimistas.filter(d => {
                            if (dizimoFiltroTipo === "mes") return d.data?.startsWith(dizimoPeriodo);
                            return d.data >= dizimoDataInicio && d.data <= dizimoDataFim;
                          }).sort((a, b) => a.membroNome?.localeCompare(b.membroNome));

                          const totalPeriodo = filtrados.reduce((s, d) => s + (parseFloat(d.valor) || 0), 0);
                          const fmtV = v => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
                          const fmtPag = p => p === "pix" ? "PIX" : p === "cartao" ? "Cartão" : p === "deposito" ? "Depósito" : "Cheque";
                          const titulo = dizimoFiltroTipo === "mes"
                            ? `${new Date(dizimoPeriodo + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`
                            : `${new Date(dizimoDataInicio + "T12:00").toLocaleDateString("pt-BR")} a ${new Date(dizimoDataFim + "T12:00").toLocaleDateString("pt-BR")}`;

                          return filtrados.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "20px 0", color: T.textSub, fontSize: 13 }}>
                              <div style={{ fontSize: 28, marginBottom: 8 }}>🙏</div>
                              Nenhum dízimo encontrado neste período
                            </div>
                          ) : (
                            <>
                              {/* Resumo */}
                              <div style={{ background: "rgba(201,168,76,.08)", border: "1px solid rgba(201,168,76,.2)", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                  <span style={{ fontSize: 12, color: T.textSub }}>Total de dizimistas</span>
                                  <span style={{ fontSize: 13, fontWeight: "bold", color: T.text }}>{filtrados.length}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                  <span style={{ fontSize: 12, color: T.textSub }}>Total arrecadado</span>
                                  <span style={{ fontSize: 15, fontWeight: "bold", color: "#22c55e" }}>{fmtV(totalPeriodo)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span style={{ fontSize: 12, color: T.textSub }}>Média por dizimista</span>
                                  <span style={{ fontSize: 13, fontWeight: "bold", color: "#c9a84c" }}>{fmtV(totalPeriodo / filtrados.length)}</span>
                                </div>
                              </div>

                              {/* Lista */}
                              {filtrados.map((d, idx) => (
                                <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: T.card, border: `1px solid ${T.cardBorder}`, borderLeft: "3px solid #c9a84c", borderRadius: 12, marginBottom: 8 }}>
                                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(201,168,76,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: "bold", color: "#c9a84c", flexShrink: 0 }}>
                                    {idx + 1}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: "bold", color: T.text }}>{d.membroNome}</div>
                                    <div style={{ fontSize: 11, color: T.textSub }}>
                                      {new Date(d.data + "T12:00:00").toLocaleDateString("pt-BR")} • {fmtPag(d.formaPagamento)}
                                    </div>
                                  </div>
                                  <div style={{ fontSize: 13, fontWeight: "bold", color: "#22c55e", flexShrink: 0 }}>
                                    {fmtV(parseFloat(d.valor))}
                                  </div>
                                  <button style={S.delBtn} onClick={async () => {
                                    if (window.confirm("Excluir este dízimo?")) {
                                      await deleteDoc(doc(db, "dizimistas", d.id));
                                      showToast("🗑️ Removido!");
                                    }
                                  }}>🗑️</button>
                                </div>
                              ))}

                              {/* Botões Relatório */}
                              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                <button style={{ ...S.saveBtn, flex: 1, background: "rgba(201,168,76,.15)", color: T.gold, border: "1px solid rgba(201,168,76,.3)" }} onClick={() => {
                                  const linhas = filtrados.map((d, i) =>
                                    `${String(i + 1).padStart(2, "0")}. ${d.membroNome} | ${new Date(d.data + "T12:00").toLocaleDateString("pt-BR")} | ${fmtPag(d.formaPagamento)} | ${fmtV(parseFloat(d.valor))}`
                                  ).join("\n");
                                  setRelatorioVisivel({
                                    titulo: `Dizimistas — ${titulo}`,
                                    conteudo: `Total: ${filtrados.length} dizimista(s)\nTotal arrecadado: ${fmtV(totalPeriodo)}\nMédia: ${fmtV(totalPeriodo / filtrados.length)}\n\n${"─".repeat(55)}\n${linhas}\n${"─".repeat(55)}\nTOTAL: ${fmtV(totalPeriodo)}`
                                  });
                                }}>👁️ Visualizar</button>
                                <button style={{ ...S.saveBtn, flex: 1, background: "#1a56db" }} onClick={() => {
                                  const linhas = filtrados.map((d, i) =>
                                    `${String(i + 1).padStart(2, "0")}. ${d.membroNome.padEnd(30)} | ${new Date(d.data + "T12:00").toLocaleDateString("pt-BR")} | ${fmtPag(d.formaPagamento).padEnd(10)} | ${fmtV(parseFloat(d.valor))}`
                                  ).join("\n");
                                  const relatorio = ["═".repeat(62), "   RELATÓRIO DE DIZIMISTAS — IGREJA FAMÍLIA ALIANÇA", `   Período: ${titulo}`, `   Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, "─".repeat(62), `   Total: ${filtrados.length} dizimista(s)`, `   Total arrecadado: ${fmtV(totalPeriodo)}`, "═".repeat(62), linhas, "═".repeat(62), `   TOTAL GERAL: ${fmtV(totalPeriodo)}`, "═".repeat(62)].join("\n");
                                  const blob = new Blob([relatorio], { type: "text/plain;charset=utf-8" });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url; a.download = `dizimistas-${titulo.replace(/\s/g, "-")}.txt`; a.click();
                                  showToast("📄 Relatório baixado!");
                                }}>📥 Baixar</button>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

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
                    <iframe title="Preview" width="100%" height="180"
                      src={`https://www.youtube.com/embed/${getYouTubeId(ultimoVideo.url)}`} frameBorder="0" allowFullScreen style={{ display: "block" }} />
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
                {membroSelecionado ? (
                  <div>
                    <button onClick={() => { setMembroSelecionado(null); setBuscaMembro(""); }}
                      style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: T.gold, fontSize: 13, cursor: "pointer", marginBottom: 16, padding: 0 }}>
                      ← Voltar à lista
                    </button>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
                      <div style={{ width: 70, height: 70, borderRadius: "50%", background: "rgba(201,168,76,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: T.gold, fontWeight: "bold", border: `2px solid ${T.gold}`, marginBottom: 10 }}>
                        {membroSelecionado.nome?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: "bold", color: T.text, textAlign: "center" }}>{membroSelecionado.nome}</div>
                      {membroSelecionado.admin && <div style={{ fontSize: 11, color: T.gold, marginTop: 4, letterSpacing: 2 }}>ADMIN</div>}
                    </div>
                    {[
                      { label: "E-mail", valor: membroSelecionado.email, icon: "✉️" },
                      { label: "Celular", valor: membroSelecionado.celular, icon: "📱" },
                      { label: "Sexo", valor: membroSelecionado.sexo, icon: "👤" },
                      { label: "Estado Civil", valor: membroSelecionado.estadoCivil, icon: "💍" },
                      { label: "Data de Nascimento", valor: membroSelecionado.dataNascimento || null, icon: "🎂" },
                      { label: "Batizado(a)", valor: membroSelecionado.batizado === "sim" ? "Sim" : membroSelecionado.batizado === "nao" ? "Não" : null, icon: "✝️" },
                      { label: "Igreja do Batismo", valor: membroSelecionado.igrejaBAT, icon: "⛪" },
                      { label: "Data do Batismo", valor: membroSelecionado.dataBAT || null, icon: "📅" },
                      { label: "Cadastrado em", valor: membroSelecionado.dataCadastro ? new Date(membroSelecionado.dataCadastro).toLocaleDateString("pt-BR") : null, icon: "🗓️" },
                      { label: "Último Acesso", valor: formatarUltimoAcesso(membroSelecionado.ultimoAcesso), icon: "🕒" },
                    ].filter(d => d.valor).map((d, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 12, marginBottom: 8 }}>
                        <span style={{ fontSize: 20, flexShrink: 0 }}>{d.icon}</span>
                        <div>
                          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: T.textSub, marginBottom: 2 }}>{d.label}</div>
                          <div style={{ fontSize: 14, fontWeight: "bold", color: T.text }}>{d.valor}</div>
                        </div>
                      </div>
                    ))}
                    {membroSelecionado.celular && (
                      <button style={{ ...S.saveBtn, background: "#25d366", marginTop: 8 }}
                        onClick={() => window.open(`https://wa.me/55${membroSelecionado.celular.replace(/\D/g, "")}`, "_blank")}>
                        📱 Chamar no WhatsApp
                      </button>
                    )}
                    <button style={{ ...S.saveBtn, background: "rgba(239,68,68,.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,.3)", marginTop: 8 }}
                      onClick={async () => {
                        if (window.confirm(`Excluir membro ${membroSelecionado.nome}?`)) {
                          await deleteDoc(doc(db, "membros", membroSelecionado.email));
                          setMembroSelecionado(null);
                          showToast("✅ Membro removido!");
                        }
                      }}>🗑️ Excluir Membro</button>
                  </div>
                ) : (
                  <div>
                    {/* Seletor de view */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                      {[{ id: "lista", label: "👥 Membros" }, { id: "aniversariantes", label: "🎂 Aniversariantes" }].map(v => (
                        <button key={v.id} onClick={() => setMembrosView(v.id)}
                          style={{ flex: 1, padding: "9px 0", border: `1px solid ${membrosView === v.id ? "#c9a84c" : T.cardBorder}`, borderRadius: 10, background: membrosView === v.id ? "linear-gradient(90deg,#c9a84c,#e8c97a)" : T.card, color: membrosView === v.id ? "#080810" : T.textSub, fontSize: 12, fontWeight: membrosView === v.id ? "bold" : "normal", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                          {v.label}
                        </button>
                      ))}
                    </div>

                    {/* ── ANIVERSARIANTES ── */}
                    {membrosView === "aniversariantes" && (() => {
                      const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
                      const aniversariantes = membros.filter(m => {
                        if (!m.dataNascimento) return false;
                        const n = m.dataNascimento.trim();
                        let mes;
                        if (n.includes("/")) {
                          // Formato DD/MM/AAAA
                          mes = parseInt(n.split("/")[1]);
                        } else if (n.includes("-") && n.indexOf("-") === 4) {
                          // Formato AAAA-MM-DD
                          mes = parseInt(n.split("-")[1]);
                        } else if (n.includes("-") && n.indexOf("-") !== 4) {
                          // Formato DD-MM-AAAA
                          mes = parseInt(n.split("-")[1]);
                        } else return false;
                        return mes === anivMes;
                      }).sort((a, b) => {
                        const getDiaSort = n => {
                          if (n.includes("/")) return parseInt(n.split("/")[0]);
                          if (n.indexOf("-") === 4) return parseInt(n.split("-")[2]);
                          return parseInt(n.split("-")[0]);
                        };
                        return getDiaSort(a.dataNascimento) - getDiaSort(b.dataNascimento);
                      });
                      const getDia = n => {
                        if (n.includes("/")) return n.split("/")[0];
                        if (n.indexOf("-") === 4) return n.split("-")[2];
                        return n.split("-")[0];
                      };
                      return (
                        <>
                          <select style={{ ...S.select, marginBottom: 16 }} value={anivMes} onChange={e => setAnivMes(parseInt(e.target.value))}>
                            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                          </select>
                          {aniversariantes.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "32px 0" }}>
                              <div style={{ fontSize: 36, marginBottom: 10 }}>🎂</div>
                              <div style={{ fontSize: 13, color: T.textSub }}>Nenhum aniversariante em {MESES[anivMes - 1]}</div>
                              <div style={{ fontSize: 12, color: T.textFaint, marginTop: 6 }}>Verifique se os membros têm data de nascimento cadastrada</div>
                            </div>
                          ) : (
                            <>
                              <div style={{ background: "rgba(201,168,76,.08)", border: "1px solid rgba(201,168,76,.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 13, color: T.textSub }}>🎂 {MESES[anivMes - 1]}</span>
                                <span style={{ fontSize: 14, fontWeight: "bold", color: "#c9a84c" }}>{aniversariantes.length} aniversariante(s)</span>
                              </div>
                              {aniversariantes.map((m, i) => (
                                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: T.card, border: `1px solid ${T.cardBorder}`, borderLeft: "3px solid #c9a84c", borderRadius: 12, marginBottom: 8 }}>
                                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(201,168,76,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, flexDirection: "column" }}>
                                    <div style={{ fontSize: 14, fontWeight: "bold", color: "#c9a84c", lineHeight: 1 }}>{getDia(m.dataNascimento)}</div>
                                    <div style={{ fontSize: 9, color: T.textFaint, textTransform: "uppercase" }}>{MESES[anivMes - 1].slice(0, 3)}</div>
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 14, fontWeight: "bold", color: T.text }}>{m.nome}</div>
                                    {m.celular && <div style={{ fontSize: 12, color: T.textSub }}>📱 {m.celular}</div>}
                                  </div>
                                  {m.celular && (
                                    <button onClick={() => window.open(`https://wa.me/55${m.celular.replace(/\D/g, "")}?text=Feliz%20Anivers%C3%A1rio%20${encodeURIComponent(m.nome.split(" ")[0])}!%20%F0%9F%8E%82%20Que%20Deus%20te%20aben%C3%A7oe!`, "_blank")}
                                      style={{ background: "#25d366", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 16, cursor: "pointer", flexShrink: 0 }}>💬</button>
                                  )}
                                </div>
                              ))}
                              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                <button style={{ ...S.saveBtn, flex: 1, background: "rgba(201,168,76,.15)", color: T.gold, border: "1px solid rgba(201,168,76,.3)" }} onClick={() => {
                                  const linhas = aniversariantes.map((m, i) =>
                                    `${String(i + 1).padStart(2, "0")}. Dia ${getDia(m.dataNascimento).toString().padStart(2, "0")} — ${m.nome}${m.celular ? ` | ${m.celular}` : ""}`
                                  ).join("\n");
                                  setRelatorioVisivel({
                                    titulo: `Aniversariantes — ${MESES[anivMes - 1]}`,
                                    conteudo: `Total: ${aniversariantes.length} aniversariante(s)\n\n${"─".repeat(50)}\n${linhas}\n${"─".repeat(50)}`
                                  });
                                }}>👁️ Visualizar</button>
                                <button style={{ ...S.saveBtn, flex: 1, background: "#1a56db" }} onClick={() => {
                                  const linhas = aniversariantes.map((m, i) =>
                                    `${String(i + 1).padStart(2, "0")}. Dia ${getDia(m.dataNascimento).toString().padStart(2, "0")} — ${m.nome}${m.celular ? ` | ${m.celular}` : ""}`
                                  ).join("\n");
                                  const rel = ["═".repeat(55), `   ANIVERSARIANTES — ${MESES[anivMes - 1].toUpperCase()}`, "   IGREJA FAMÍLIA ALIANÇA", "═".repeat(55), `   Total: ${aniversariantes.length} aniversariante(s)`, `   Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, "─".repeat(55), linhas, "═".repeat(55)].join("\n");
                                  const blob = new Blob([rel], { type: "text/plain;charset=utf-8" });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement("a"); a.href = url; a.download = `aniversariantes-${MESES[anivMes - 1]}.txt`; a.click();
                                  showToast("📄 Relatório baixado!");
                                }}>📥 Baixar</button>
                              </div>
                            </>
                          )}
                        </>
                      );
                    })()}

                    {/* ── LISTA DE MEMBROS ── */}
                    {membrosView === "lista" && (<>
                    <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 4, color: T.gold }}>Membros Cadastrados</div>
                    <div style={{ fontSize: 12, color: T.textSub, marginBottom: 12 }}>{membros.length} membro(s) — toque no nome para ver os detalhes</div>

                    {/* Campo de busca */}
                    <input
                      style={{ ...S.input, marginBottom: 8 }}
                      placeholder="🔍 Buscar por nome ou e-mail..."
                      value={buscaMembro}
                      onChange={e => setBuscaMembro(e.target.value)}
                    />

                    {/* Ordenação */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                      {[{ id: "nome", label: "🔤 Nome" }, { id: "acesso", label: "🕒 Último acesso" }].map(o => (
                        <button key={o.id} onClick={() => setMembrosOrdem(o.id)}
                          style={{ flex: 1, padding: "7px 0", border: `1px solid ${membrosOrdem === o.id ? "#c9a84c" : T.cardBorder}`, borderRadius: 8, background: membrosOrdem === o.id ? "rgba(201,168,76,.12)" : "transparent", color: membrosOrdem === o.id ? "#c9a84c" : T.textSub, fontSize: 11, fontWeight: membrosOrdem === o.id ? "bold" : "normal", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                          {o.label}
                        </button>
                      ))}
                    </div>

                    {/* Contador de resultados */}
                    {buscaMembro.trim() && (
                      <div style={{ fontSize: 11, color: T.textFaint, marginBottom: 10 }}>
                        {membros.filter(m =>
                          m.nome?.toLowerCase().includes(buscaMembro.toLowerCase()) ||
                          m.email?.toLowerCase().includes(buscaMembro.toLowerCase())
                        ).length} resultado(s) encontrado(s)
                      </div>
                    )}

                    {membros.length === 0 ? (
                      <div style={{ ...S.card, marginLeft: 0, marginRight: 0, textAlign: "center" }}>
                        <div style={{ fontSize: 13, color: T.textSub }}>Nenhum membro cadastrado ainda.</div>
                      </div>
                    ) : membros
                        .filter(m =>
                          !buscaMembro.trim() ||
                          m.nome?.toLowerCase().includes(buscaMembro.toLowerCase()) ||
                          m.email?.toLowerCase().includes(buscaMembro.toLowerCase())
                        )
                        .sort((a, b) => membrosOrdem === "nome"
                          ? a.nome?.localeCompare(b.nome)
                          : (b.ultimoAcesso || "").localeCompare(a.ultimoAcesso || ""))
                        .map(m => (
                      <div key={m.id} onClick={() => setMembroSelecionado(m)}
                        style={{ ...S.card, marginLeft: 0, marginRight: 0, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: 8 }}>
                        <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(201,168,76,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: T.gold, fontWeight: "bold", flexShrink: 0, border: `1px solid rgba(201,168,76,.3)` }}>
                          {m.nome?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: "bold", color: T.text }}>{m.nome}</div>
                          <div style={{ fontSize: 11, color: T.textSub }}>{m.celular || m.email}</div>
                          <div style={{ fontSize: 10, color: m.ultimoAcesso ? T.textFaint : "#f87171", marginTop: 2 }}>🕒 {formatarUltimoAcesso(m.ultimoAcesso)}</div>
                        </div>
                        <span style={{ fontSize: 18, color: T.textSub }}>›</span>
                      </div>
                    ))}
                    </>)}
                  </div>
                )}
              </div>
            )}

            {/* ── ADMINISTRADORES ── */}
            {adminTab === "administradores" && (() => {
              const admins = membros.filter(m => m.admin);
              const naoAdmins = membros.filter(m => !m.admin);
              const resultadosBusca = buscaPromoverAdmin.trim().length > 1
                ? naoAdmins.filter(m =>
                    m.nome?.toLowerCase().includes(buscaPromoverAdmin.toLowerCase()) ||
                    m.email?.toLowerCase().includes(buscaPromoverAdmin.toLowerCase())
                  ).slice(0, 8)
                : [];

              const promoverMembro = async () => {
                if (!membroParaPromover) return;
                if (senhaNovoAdmin.length < 6) { showToast("⚠️ A senha deve ter pelo menos 6 caracteres!"); return; }
                if (senhaNovoAdmin !== confirmSenhaNovoAdmin) { showToast("⚠️ As senhas não coincidem!"); return; }
                if (!(await senhaAdminAtualCorreta(senhaConfirmacaoAdminAtual))) { showToast("❌ Sua senha de administrador está incorreta!"); return; }
                const salt = gerarSalt();
                const hash = await hashSenha(senhaNovoAdmin, salt);
                await updateDoc(doc(db, "membros", membroParaPromover.email), {
                  admin: true,
                  senhaHash: hash,
                  senhaSalt: salt,
                  senha: deleteField(),
                  promovidoPor: user?.nome || user?.email || "Admin",
                  dataPromocaoAdmin: new Date().toISOString(),
                });
                showToast(`✅ ${membroParaPromover.nome} agora tem acesso administrativo!`);
                setMembroParaPromover(null); setSenhaNovoAdmin(""); setConfirmSenhaNovoAdmin(""); setSenhaConfirmacaoAdminAtual(""); setBuscaPromoverAdmin("");
              };

              const criarNovoAdmin = async () => {
                if (!novoAdminCadastro.nome.trim() || !novoAdminCadastro.email.trim() || !novoAdminCadastro.senha) { showToast("⚠️ Preencha nome, e-mail e senha!"); return; }
                if (novoAdminCadastro.senha.length < 6) { showToast("⚠️ A senha deve ter pelo menos 6 caracteres!"); return; }
                if (!(await senhaAdminAtualCorreta(senhaConfirmacaoAdminAtual))) { showToast("❌ Sua senha de administrador está incorreta!"); return; }
                const emailNovo = novoAdminCadastro.email.trim().toLowerCase();
                const existente = await getDoc(doc(db, "membros", emailNovo));
                if (existente.exists()) { showToast("⚠️ Já existe um cadastro com esse e-mail! Use a opção 'Promover membro existente'."); return; }
                const salt = gerarSalt();
                const hash = await hashSenha(novoAdminCadastro.senha, salt);
                await setDoc(doc(db, "membros", emailNovo), {
                  nome: novoAdminCadastro.nome.trim(),
                  email: emailNovo,
                  senhaHash: hash,
                  senhaSalt: salt,
                  admin: true,
                  dataCadastro: new Date().toISOString(),
                  ultimoAcesso: null,
                  promovidoPor: user?.nome || user?.email || "Admin",
                  dataPromocaoAdmin: new Date().toISOString(),
                });
                try {
                  const cred = await createUserWithEmailAndPassword(auth, paraContaAuth(emailNovo), novoAdminCadastro.senha);
                  await setDoc(doc(db, "authIndex", cred.user.uid), { membroId: emailNovo });
                } catch (errAuth) {
                  console.warn("Admin criado no Firestore, mas o Firebase Authentication não sincronizou:", errAuth);
                }
                showToast(`✅ Administrador "${novoAdminCadastro.nome}" criado com sucesso!`);
                setNovoAdminCadastro({ nome: "", email: "", senha: "" }); setSenhaConfirmacaoAdminAtual("");
              };

              const revogarAdmin = async (m) => {
                if (m.email === user?.email) { showToast("⚠️ Você não pode remover seu próprio acesso administrativo!"); return; }
                if (!(await senhaAdminAtualCorreta(senhaConfirmacaoRevogar))) { showToast("❌ Sua senha de administrador está incorreta!"); return; }
                await updateDoc(doc(db, "membros", m.email), { admin: false });
                showToast(`↩️ Acesso administrativo de ${m.nome} removido.`);
                setRevogarAlvoAdmin(null); setSenhaConfirmacaoRevogar("");
              };

              const trocarMinhaSenha = async () => {
                if (!senhaAtualPropria) { showToast("⚠️ Digite sua senha atual!"); return; }
                if (novaSenhaPropria.length < 6) { showToast("⚠️ A nova senha deve ter pelo menos 6 caracteres!"); return; }
                if (novaSenhaPropria !== confirmNovaSenhaPropria) { showToast("⚠️ As senhas não coincidem!"); return; }
                if (!(await senhaAdminAtualCorreta(senhaAtualPropria))) { showToast("❌ Senha atual incorreta!"); return; }

                const salt = gerarSalt();
                const hash = await hashSenha(novaSenhaPropria, salt);
                await updateDoc(doc(db, "membros", user.email), { senhaHash: hash, senhaSalt: salt, senha: deleteField() });

                // Atualiza também o Firebase Authentication, pra não ficar dessincronizado
                try {
                  const authEmail = paraContaAuth(user.email);
                  await signInWithEmailAndPassword(auth, authEmail, senhaAtualPropria); // garante sessão "fresca"
                  await updatePassword(auth.currentUser, novaSenhaPropria);
                } catch (errAuth) {
                  console.warn("Senha trocada no app, mas o Firebase Authentication não sincronizou:", errAuth);
                }

                const uAtualizado = { ...user, senhaHash: hash, senhaSalt: salt };
                delete uAtualizado.senha;
                setUser(uAtualizado);
                store.set(SK.user, uAtualizado);

                setSenhaAtualPropria(""); setNovaSenhaPropria(""); setConfirmNovaSenhaPropria("");
                showToast("✅ Senha alterada com sucesso!");
              };

              return (
                <div style={{ padding: "0 16px" }}>
                  <div style={{ fontSize: 14, fontWeight: "bold", color: T.gold, marginBottom: 4 }}>🔐 Administradores</div>
                  <div style={{ background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.25)", borderRadius: 12, padding: "10px 14px", marginBottom: 18, fontSize: 12, color: "#f87171", lineHeight: 1.6 }}>
                    ⚠️ Acesso administrativo dá controle total sobre o app: membros, finanças, avisos, líderes e configurações. Conceda apenas para pessoas de máxima confiança. Toda ação aqui exige sua senha de admin para confirmar.
                  </div>

                  {/* Trocar minha própria senha */}
                  <div style={{ ...S.card, marginLeft: 0, marginRight: 0, marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: "bold", color: T.gold, marginBottom: 10 }}>🔑 Trocar minha senha</div>
                    <label style={{ ...S.label, marginTop: 0 }}>Senha atual</label>
                    <div style={{ position: "relative", marginBottom: 0 }}>
                      <input type={mostrarSenhaAdmin.atual ? "text" : "password"} style={{ ...S.input, marginBottom: 0, paddingRight: 40 }} placeholder="Sua senha atual"
                        value={senhaAtualPropria} onChange={e => setSenhaAtualPropria(e.target.value)} />
                      <button type="button" onClick={() => setMostrarSenhaAdmin({ ...mostrarSenhaAdmin, atual: !mostrarSenhaAdmin.atual })}
                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 0 }}>
                        {mostrarSenhaAdmin.atual ? "🙈" : "👁️"}
                      </button>
                    </div>
                    <label style={S.label}>Nova senha</label>
                    <div style={{ position: "relative", marginBottom: 0 }}>
                      <input type={mostrarSenhaAdmin.nova ? "text" : "password"} style={{ ...S.input, marginBottom: 0, paddingRight: 40 }} placeholder="Mínimo 6 caracteres"
                        value={novaSenhaPropria} onChange={e => setNovaSenhaPropria(e.target.value)} />
                      <button type="button" onClick={() => setMostrarSenhaAdmin({ ...mostrarSenhaAdmin, nova: !mostrarSenhaAdmin.nova })}
                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 0 }}>
                        {mostrarSenhaAdmin.nova ? "🙈" : "👁️"}
                      </button>
                    </div>
                    <label style={S.label}>Confirmar nova senha</label>
                    <input type={mostrarSenhaAdmin.nova ? "text" : "password"} style={{ ...S.input, marginBottom: 0 }} placeholder="Repita a nova senha"
                      value={confirmNovaSenhaPropria} onChange={e => setConfirmNovaSenhaPropria(e.target.value)} />
                    <button style={{ ...S.saveBtn, marginTop: 12 }} onClick={trocarMinhaSenha}>💾 Salvar Nova Senha</button>
                  </div>

                  {/* Lista de admins atuais */}
                  <div style={{ fontSize: 12, color: T.gold, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Administradores atuais ({admins.length})</div>
                  {admins.map(m => (
                    <div key={m.id} style={{ ...S.card, marginLeft: 0, marginRight: 0, marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(220,38,38,.12)", border: "1px solid rgba(220,38,38,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: "bold", color: "#f87171", flexShrink: 0 }}>
                          {m.nome?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: "bold", color: T.text }}>{m.nome} {m.email === user?.email && <span style={{ color: T.textFaint, fontWeight: "normal" }}>(você)</span>}</div>
                          <div style={{ fontSize: 11, color: T.textSub }}>{m.email}</div>
                          {m.promovidoPor && <div style={{ fontSize: 10, color: T.textFaint, marginTop: 2 }}>Concedido por {m.promovidoPor}</div>}
                        </div>
                        {m.email !== user?.email && (
                          <button onClick={() => setRevogarAlvoAdmin(revogarAlvoAdmin === m.email ? null : m.email)}
                            style={{ background: "rgba(220,38,38,.12)", border: "1px solid rgba(220,38,38,.3)", borderRadius: 8, padding: "7px 12px", fontSize: 11, fontWeight: "bold", color: "#f87171", cursor: "pointer" }}>
                            Revogar
                          </button>
                        )}
                      </div>
                      {revogarAlvoAdmin === m.email && (
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.cardBorder}` }}>
                          <div style={{ fontSize: 11, color: T.textSub, marginBottom: 6 }}>Digite sua senha de admin para confirmar a remoção:</div>
                          <div style={{ position: "relative", marginBottom: 8 }}>
                            <input type={mostrarSenhaAdmin.revogar ? "text" : "password"} style={{ ...S.input, marginBottom: 0, paddingRight: 40 }} placeholder="Sua senha de administrador"
                              value={senhaConfirmacaoRevogar} onChange={e => setSenhaConfirmacaoRevogar(e.target.value)} />
                            <button type="button" onClick={() => setMostrarSenhaAdmin({ ...mostrarSenhaAdmin, revogar: !mostrarSenhaAdmin.revogar })}
                              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 0 }}>
                              {mostrarSenhaAdmin.revogar ? "🙈" : "👁️"}
                            </button>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => revogarAdmin(m)} style={{ flex: 1, background: "#dc2626", border: "none", borderRadius: 10, padding: "10px 0", color: "#fff", fontSize: 12, fontWeight: "bold", cursor: "pointer", fontFamily: "Georgia,serif" }}>Confirmar Revogação</button>
                            <button onClick={() => { setRevogarAlvoAdmin(null); setSenhaConfirmacaoRevogar(""); }} style={{ padding: "0 14px", background: "transparent", border: `1px solid ${T.cardBorder}`, borderRadius: 10, color: T.textSub, fontSize: 12, cursor: "pointer", fontFamily: "Georgia,serif" }}>Cancelar</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Conceder novo acesso */}
                  <div style={{ fontSize: 12, color: T.gold, letterSpacing: 1, textTransform: "uppercase", margin: "22px 0 10px" }}>➕ Conceder novo acesso</div>

                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    {[{ id: "existente", label: "Promover membro" }, { id: "novo", label: "Criar do zero" }].map(o => (
                      <button key={o.id} onClick={() => { setModoAdminNovo(o.id); setMembroParaPromover(null); setBuscaPromoverAdmin(""); }}
                        style={{ flex: 1, padding: "9px 0", border: `1px solid ${modoAdminNovo === o.id ? "#c9a84c" : T.cardBorder}`, borderRadius: 10, background: modoAdminNovo === o.id ? "rgba(201,168,76,.12)" : "transparent", color: modoAdminNovo === o.id ? "#c9a84c" : T.textSub, fontSize: 12, fontWeight: modoAdminNovo === o.id ? "bold" : "normal", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                        {o.label}
                      </button>
                    ))}
                  </div>

                  {modoAdminNovo === "existente" ? (
                    <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: "14px 16px" }}>
                      {!membroParaPromover ? (
                        <>
                          <input style={{ ...S.input, marginBottom: 8 }} placeholder="🔍 Buscar membro por nome ou e-mail..."
                            value={buscaPromoverAdmin} onChange={e => setBuscaPromoverAdmin(e.target.value)} />
                          {resultadosBusca.map(m => (
                            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 6px", borderBottom: `1px solid ${T.cardBorder}` }}>
                              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(201,168,76,.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: "bold", color: "#c9a84c", flexShrink: 0 }}>
                                {m.nome?.charAt(0).toUpperCase()}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: "bold", color: T.text }}>{m.nome}</div>
                                <div style={{ fontSize: 11, color: T.textSub }}>{m.email}</div>
                              </div>
                              <button onClick={() => setMembroParaPromover(m)}
                                style={{ background: "linear-gradient(90deg,#c9a84c,#e8c97a)", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: "bold", color: "#080810", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                                Selecionar
                              </button>
                            </div>
                          ))}
                          {buscaPromoverAdmin.trim().length > 1 && resultadosBusca.length === 0 && (
                            <div style={{ fontSize: 12, color: T.textSub, padding: "8px 0" }}>Nenhum membro encontrado</div>
                          )}
                        </>
                      ) : (
                        <>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${T.cardBorder}` }}>
                            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(201,168,76,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: "bold", color: "#c9a84c" }}>
                              {membroParaPromover.nome?.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: "bold", color: T.text }}>{membroParaPromover.nome}</div>
                              <div style={{ fontSize: 11, color: T.textSub }}>{membroParaPromover.email}</div>
                            </div>
                            <button onClick={() => setMembroParaPromover(null)} style={{ background: "none", border: "none", color: T.textFaint, fontSize: 18, cursor: "pointer" }}>×</button>
                          </div>
                          <label style={S.label}>Definir senha de acesso admin *</label>
                          <div style={{ position: "relative", marginBottom: 8 }}>
                            <input type={mostrarSenhaAdmin.novo ? "text" : "password"} style={{ ...S.input, marginBottom: 0, paddingRight: 40 }} placeholder="Mínimo 6 caracteres"
                              value={senhaNovoAdmin} onChange={e => setSenhaNovoAdmin(e.target.value)} />
                            <button type="button" onClick={() => setMostrarSenhaAdmin({ ...mostrarSenhaAdmin, novo: !mostrarSenhaAdmin.novo })}
                              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 0 }}>
                              {mostrarSenhaAdmin.novo ? "🙈" : "👁️"}
                            </button>
                          </div>
                          <label style={S.label}>Confirmar senha *</label>
                          <div style={{ position: "relative", marginBottom: 8 }}>
                            <input type={mostrarSenhaAdmin.confirm ? "text" : "password"} style={{ ...S.input, marginBottom: 0, paddingRight: 40 }} placeholder="Repita a senha"
                              value={confirmSenhaNovoAdmin} onChange={e => setConfirmSenhaNovoAdmin(e.target.value)} />
                            <button type="button" onClick={() => setMostrarSenhaAdmin({ ...mostrarSenhaAdmin, confirm: !mostrarSenhaAdmin.confirm })}
                              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 0 }}>
                              {mostrarSenhaAdmin.confirm ? "🙈" : "👁️"}
                            </button>
                          </div>
                          <label style={S.label}>Sua senha de admin (confirmação) *</label>
                          <div style={{ position: "relative", marginBottom: 12 }}>
                            <input type={mostrarSenhaAdmin.atual1 ? "text" : "password"} style={{ ...S.input, marginBottom: 0, paddingRight: 40 }} placeholder="Confirme com sua própria senha"
                              value={senhaConfirmacaoAdminAtual} onChange={e => setSenhaConfirmacaoAdminAtual(e.target.value)} />
                            <button type="button" onClick={() => setMostrarSenhaAdmin({ ...mostrarSenhaAdmin, atual1: !mostrarSenhaAdmin.atual1 })}
                              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 0 }}>
                              {mostrarSenhaAdmin.atual1 ? "🙈" : "👁️"}
                            </button>
                          </div>
                          <button onClick={promoverMembro} style={{ ...S.saveBtn, marginTop: 0 }}>🔐 Conceder Acesso Admin</button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 14, padding: "14px 16px" }}>
                      <label style={S.label}>Nome completo *</label>
                      <input style={{ ...S.input, marginBottom: 8 }} placeholder="Nome do novo administrador"
                        value={novoAdminCadastro.nome} onChange={e => setNovoAdminCadastro({ ...novoAdminCadastro, nome: e.target.value })} />
                      <label style={S.label}>E-mail *</label>
                      <input type="email" style={{ ...S.input, marginBottom: 8 }} placeholder="email@exemplo.com"
                        value={novoAdminCadastro.email} onChange={e => setNovoAdminCadastro({ ...novoAdminCadastro, email: e.target.value })} />
                      <label style={S.label}>Senha *</label>
                      <div style={{ position: "relative", marginBottom: 8 }}>
                        <input type={mostrarSenhaAdmin.cadastro ? "text" : "password"} style={{ ...S.input, marginBottom: 0, paddingRight: 40 }} placeholder="Mínimo 6 caracteres"
                          value={novoAdminCadastro.senha} onChange={e => setNovoAdminCadastro({ ...novoAdminCadastro, senha: e.target.value })} />
                        <button type="button" onClick={() => setMostrarSenhaAdmin({ ...mostrarSenhaAdmin, cadastro: !mostrarSenhaAdmin.cadastro })}
                          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 0 }}>
                          {mostrarSenhaAdmin.cadastro ? "🙈" : "👁️"}
                        </button>
                      </div>
                      <label style={S.label}>Sua senha de admin (confirmação) *</label>
                      <div style={{ position: "relative", marginBottom: 12 }}>
                        <input type={mostrarSenhaAdmin.atual2 ? "text" : "password"} style={{ ...S.input, marginBottom: 0, paddingRight: 40 }} placeholder="Confirme com sua própria senha"
                          value={senhaConfirmacaoAdminAtual} onChange={e => setSenhaConfirmacaoAdminAtual(e.target.value)} />
                        <button type="button" onClick={() => setMostrarSenhaAdmin({ ...mostrarSenhaAdmin, atual2: !mostrarSenhaAdmin.atual2 })}
                          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 0 }}>
                          {mostrarSenhaAdmin.atual2 ? "🙈" : "👁️"}
                        </button>
                      </div>
                      <button onClick={criarNovoAdmin} style={{ ...S.saveBtn, marginTop: 0 }}>🔐 Criar Administrador</button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* NAV */}
      <nav style={S.nav}>
        {TABS.map(t => (
          <button key={t.id} style={S.navBtn(tab === t.id)} onClick={() => {
            setTab(t.id);
            marcarVisto(t.id);
            setMinisterioAtivo(null);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}>
            <div style={{ position: "relative", display: "inline-block" }}>
              <span style={S.navIcon}>{t.icon}</span>
              {tab !== t.id && temNovo(t.id) && (
                <span style={{ position: "absolute", top: -2, right: -4, width: 8, height: 8, borderRadius: "50%", background: "#22c55e", border: "1.5px solid " + (darkMode ? "#03060f" : "#f5f5f5"), display: "block" }} />
              )}
            </div>
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
