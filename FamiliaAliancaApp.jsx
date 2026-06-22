import React, { useState, useEffect } from "react";
import { db, messaging, solicitarPermissaoNotificacao, onMessage } from "./firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc } from "firebase/firestore";
import emailjs from "@emailjs/browser";

// ─── EMAILJS CONFIG ─────────────────────────────────────────── v1.1 ───────
const ONESIGNAL_APP_ID = "10ba1be7-f0bc-4c2d-bb2e-e9a02d4235f1";
const ONESIGNAL_API_KEY = "os_v2_app_cc5bxz7qxrgc3ozo5gqc2qrv6fvhavzuxthuwrubrn6h6e6hhl7llhqjzm642hcawtwg2341hscb4t6xdvqjwptkzb1665spna4xk3a";
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
  { dia: "Terça-feira", hora: "15h — Oração", icon: "🙏" },
  { dia: "Quinta-feira", hora: "20h", icon: "🌙" },
  { dia: "Domingo", hora: "10h", icon: "🌅" },
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
  {
    id: "f1", nivel: "iniciante", fixo: true,
    titulo: "Quem é Jesus?",
    versiculo: "João 14:6 — \"Eu sou o caminho, a verdade e a vida.\"",
    texto: "Conhecer Jesus é o primeiro e mais importante passo da caminhada cristã. Mas quem é Jesus, de verdade?\n\nEle não é apenas um personagem histórico, um filósofo, ou um bom exemplo de vida. Jesus é o Filho eterno de Deus, que deixou a glória dos céus, tomou forma humana e veio ao mundo com uma missão: nos reconciliar com o Pai.\n\n**Jesus, totalmente Deus e totalmente homem**\n\nUma das grandes verdades da fé cristã é que Jesus é ao mesmo tempo plenamente Deus e plenamente humano. Como humano, Ele sentiu fome, cansaço, tristeza e dor. Em João 11:35, vemos Jesus chorar diante do túmulo de Lázaro, Ele se comove com a nossa dor. Mas como Deus, Ele ordenou que Lázaro saísse do túmulo, e ele saiu.\n\nEssa união entre o divino e o humano é o coração do evangelho: Deus desceu até nós para que pudéssemos subir até Ele.\n\n**Jesus como Caminho**\n\nAntes de Jesus, havia um abismo entre a humanidade e Deus causado pelo pecado. Nenhuma religião, esforço humano ou bondade pessoal seria capaz de atravessar esse abismo. Jesus disse: \"Eu sou o caminho\", não um caminho entre outros, mas o único. Por meio da Sua morte na cruz e da Sua ressurreição, Ele abriu uma porta que estava permanentemente fechada.\n\nPaulo escreve em Romanos 5:8: \"Mas Deus demonstra o seu amor por nós: Cristo morreu em nosso favor quando ainda éramos pecadores.\" Não esperou que fôssemos bons o suficiente. Veio até nós do jeito que éramos.\n\n**Jesus como Verdade**\n\nVivemos em um mundo repleto de opiniões, relativismo e mentiras. Em meio a tudo isso, Jesus se apresenta como a Verdade, não uma verdade entre outras, mas a realidade última sobre Deus, sobre o ser humano e sobre o propósito da vida.\n\nConhecer Jesus é como acender uma luz num quarto escuro. As coisas que pareciam confusas começam a fazer sentido. Quem somos, por que existimos, para onde vamos, tudo isso se clarifica quando encontramos Aquele que é a Verdade.\n\nEm João 8:32, Jesus diz: \"Conhecereis a verdade, e a verdade vos libertará.\" A verdade de Jesus não nos aprisiona com regras, ela nos liberta de tudo que nos mantinha escravizados: o medo, a culpa, a vergonha e a morte.\n\n**Jesus como Vida**\n\nJesus declarou em João 10:10: \"Eu vim para que tenham vida, e a tenham em abundância.\" Ele não veio para nos dar uma religião cheia de obrigações, mas vida, vida verdadeira, com propósito, alegria e esperança eterna.\n\nEssa vida começa aqui e agora, quando abrimos o coração para Ele. E se estende pela eternidade, pois Jesus venceu a morte. Sua ressurreição é a garantia de que nós também ressuscitaremos.\n\n**Um encontro pessoal**\n\nO mais importante não é apenas saber sobre Jesus, é conhecê-Lo pessoalmente. Ele não é uma ideia ou uma doutrina. É uma Pessoa que nos convida a um relacionamento real, diário e transformador.\n\nEm Apocalipse 3:20, Ele diz: \"Estou à porta e bato. Se alguém ouvir a minha voz e abrir a porta, entrarei e cearei com ele, e ele comigo.\" O convite está aberto. A porta está sendo batida. A resposta é nossa.",
    referencias: [
      "João 1:1-14 — A Palavra se fez carne e habitou entre nós",
      "Colossenses 1:15-20 — Jesus, imagem do Deus invisível e primogênito de toda a criação",
      "Filipenses 2:5-11 — Jesus, que era Deus, assumiu a forma de servo",
      "Hebreus 1:1-4 — Deus nos falou por meio do Seu Filho",
      "1 João 5:11-12 — Quem tem o Filho tem a vida",
      "Romanos 5:8 — Cristo morreu por nós quando ainda éramos pecadores",
      "João 11:25-26 — Eu sou a ressurreição e a vida",
    ],
    perguntas: [
      "O que significa para você, pessoalmente, dizer que Jesus é o seu caminho?",
      "Como a verdade de Jesus tem transformado ou pode transformar suas decisões diárias?",
      "De que forma você tem experimentado a vida abundante que Jesus promete? O que ainda te impede de vivê-la plenamente?",
      "Qual aspecto da pessoa de Jesus mais te impressiona: Ele como Deus, como humano, ou como Salvador? Por quê?"
    ],
    oracao: "Senhor Jesus, obrigado por ser meu caminho, minha verdade e minha vida. Obrigado por ter deixado a glória dos céus por mim, por ter carregado meus pecados na cruz e por ter ressuscitado para que eu possa ter vida eterna. Quero Te conhecer cada dia mais profundamente, não apenas saber sobre Ti, mas ter um relacionamento real contigo. Abre meu coração, transforma minha mente e que minha vida reflita a Tua presença em tudo que eu faço. Amém."
  },
  {
    id: "f2", nivel: "iniciante", fixo: true,
    titulo: "O que é Graça?",
    versiculo: "Efésios 2:8-9 — \"Porque pela graça sois salvos, por meio da fé, e isso não vem de vós; é dom de Deus.\"",
    texto: "A graça é um dos conceitos mais belos, mais libertadores e mais mal compreendidos da fé cristã. Entendê-la corretamente muda tudo na nossa caminhada com Deus.\n\n**O que graça significa?**\n\nGraça, no grego original do Novo Testamento, é a palavra \"charis\", favor imerecido, presente não conquistado. Em termos simples: graça é Deus nos dando o que não merecemos, enquanto misericórdia é Deus não nos dando o que merecemos.\n\nNão somos salvos porque somos bons. Não somos amados porque nos esforçamos o suficiente. Somos salvos e amados porque Deus é gracioso, e essa graça é um presente, não um prêmio.\n\n**Por que precisamos da graça?**\n\nA Bíblia é clara: \"Todos pecaram e estão destituídos da glória de Deus\" (Romanos 3:23). O pecado criou uma separação entre nós e Deus que nenhum esforço humano pode superar. Não importa quão boas sejam nossas ações, nossa bondade nunca seria suficiente para nos tornar justos diante de um Deus santo.\n\nÉ como tentar atravessar o oceano a nado. Alguns nadariam mais longe que outros, mas ninguém chegaria ao outro lado. Só a graça de Deus, que nos alcança onde estamos, é capaz de nos levar onde precisamos ir.\n\n**A graça em ação: a cruz**\n\nA maior demonstração da graça de Deus é a cruz de Jesus Cristo. Deus, que não precisava de nada, escolheu enviar Seu próprio Filho para morrer no lugar de pecadores. Paulo escreve em Romanos 5:8: \"Mas Deus demonstra o seu amor por nós: Cristo morreu em nosso favor quando ainda éramos pecadores.\"\n\nNão quando nos arrependemos. Não quando melhoramos. Quando ainda éramos pecadores. Isso é graça.\n\n**Graça não é permissão para pecar**\n\nUm equívoco comum é pensar que a graça dá liberdade para viver como quisermos. Paulo responde isso diretamente em Romanos 6:1-2: \"Que diremos, então? Permaneceremos no pecado para que a graça se multiplique? De modo nenhum!\"\n\nA graça nos transforma de dentro para fora. Quando entendemos profundamente o que foi feito por nós, o desejo natural é viver de forma que honre esse amor. A graça não nos dá permissão para pecar, ela nos dá poder para não pecar.\n\n**Graça para o dia a dia**\n\nA graça não é apenas para o momento da salvação. Ela sustenta toda a nossa caminhada. Hebreus 4:16 nos convida: \"Aproximemo-nos, portanto, com confiança do trono da graça, a fim de recebermos misericórdia e encontrarmos graça que nos ajude no momento da necessidade.\"\n\nCada dia trazemos falhas, fraquezas e erros. Mas há um trono de graça, não de julgamento, ao qual podemos nos aproximar com confiança. Deus não nos recebe com decepção, mas com misericórdia renovada a cada manhã (Lamentações 3:22-23).\n\n**Vivendo como pessoas de graça**\n\nQuem recebe graça é chamado a demonstrá-la. Jesus disse no Sermão do Monte: \"Bem-aventurados os misericordiosos, porque eles alcançarão misericórdia.\" A graça que recebemos não é para ser guardada, é para ser derramada sobre as pessoas ao nosso redor: no perdão que concedemos, na paciência que exercemos e no amor que oferecemos mesmo quando não é merecido.",
    referencias: [
      "Romanos 3:21-26 — A justiça de Deus mediante a fé em Jesus Cristo",
      "Romanos 5:1-8 — Justificados pela fé, temos paz com Deus",
      "Romanos 6:1-14 — A graça não é licença para pecar",
      "Tito 2:11-14 — A graça de Deus que nos ensina a viver retamente",
      "Hebreus 4:14-16 — O trono da graça ao qual nos aproximamos com confiança",
      "Lamentações 3:22-23 — As misericórdias de Deus se renovam a cada manhã",
      "2 Coríntios 12:9 — A minha graça é suficiente para ti",
    ],
    perguntas: [
      "Você já tentou merecer o amor de Deus através de boas obras ou comportamento? Como isso te fez sentir?",
      "De que forma entender que a salvação é completamente pela graça muda sua relação com Deus?",
      "Como você pode demonstrar graça às pessoas ao seu redor esta semana, especialmente àquelas que não a merecem?",
      "Existe algo em sua vida que te faz sentir indigno da graça de Deus? O que a Bíblia diz sobre isso?"
    ],
    oracao: "Pai celestial, obrigado pela Tua graça que me salva, me sustenta e me transforma. Que eu nunca tome esse presente como garantido, mas que viva cada dia maravilhado com o fato de que Tu me amaste enquanto eu ainda era pecador. Liberta-me de tentar ganhar o Teu amor através do meu esforço, e ajuda-me a descansar na graça que já foi dada. Que eu seja, para as pessoas ao meu redor, um reflexo dessa mesma graça que recebi. Em nome de Jesus, amém."
  },
  {
    id: "f3", nivel: "avancado", fixo: true,
    titulo: "A Armadura de Deus",
    versiculo: "Efésios 6:11 — \"Revesti-vos de toda a armadura de Deus, para que possais ficar firmes contra as ciladas do diabo.\"",
    texto: "A vida cristã não é um passeio tranquilo, é uma batalha espiritual real. E Deus não nos deixou desarmados.\n\nPaulo escreve aos Efésios a partir de uma prisão romana, acorrentado a um soldado. Olhando para a armadura daquele guerreiro, o apóstolo inspirado pelo Espírito Santo descreve a proteção espiritual que Deus nos proveu. Cada peça tem um significado profundo e uma aplicação prática para a nossa vida.\n\n**A natureza da batalha**\n\nAntes de descrever a armadura, Paulo nos diz contra quem lutamos: \"Porque não temos que lutar contra a carne e o sangue, mas contra os principados, contra as potestades, contra os príncipes das trevas deste século, contra as hostes espirituais da maldade nos lugares celestiais\" (Efésios 6:12).\n\nNosso inimigo não é de carne e osso. Por isso, armas físicas não resolvem batalhas espirituais. Precisamos de armas espirituais, e Deus as proveu completamente.\n\n**1. Cinto da Verdade**\n\nO cinto era a peça fundamental da armadura romana, sustentava todas as outras e protegia os órgãos vitais. A verdade de Deus é nosso fundamento. Em um mundo onde tudo é relativo e as mentiras são constantes, nos manter ancorados na Palavra de Deus nos protege do engano.\n\nO diabo é chamado de \"pai da mentira\" (João 8:44). Sua estratégia principal é distorcer a verdade, sobre Deus, sobre nós mesmos e sobre o mundo. Conhecer a Palavra é nossa proteção contra esse engano.\n\n**2. Couraça da Justiça**\n\nA couraça protegia o coração e os pulmões, órgãos vitais. A justiça que nos protege não é a nossa própria, é a justiça de Cristo aplicada à nossa vida. Quando o inimigo nos acusa, lembramos que estamos vestidos com a justiça de Jesus.\n\nIsso não significa que vivemos sem cuidado moral. Significa que nossa segurança não está na nossa perfeição, mas na obra completa de Cristo. \"Não há, pois, agora condenação alguma para os que estão em Cristo Jesus\" (Romanos 8:1).\n\n**3. Calçado do Evangelho**\n\nO soldado romano usava sandálias com pregos na sola para ter firmeza no terreno de batalha. O evangelho nos dá firmeza, sabemos onde estamos e para onde vamos. E ao caminhar, levamos boas novas onde quer que pisemos.\n\nEstar calçado com o evangelho também significa estar pronto para compartilhar a fé. Não somos chamados apenas a nos defender, somos chamados a avançar.\n\n**4. Escudo da Fé**\n\nO escudo romano, o \"scutum\", era grande o suficiente para cobrir o corpo inteiro e podia ser interligado com os de outros soldados, formando uma parede impenetrável. A fé nos protege dos \"dardos inflamados do maligno\", as dúvidas, os medos, as acusações e as tentações.\n\nFé não é ausência de dúvida, é escolher confiar em Deus mesmo quando não entendemos. É dizer \"Deus é fiel\" quando as circunstâncias dizem o contrário.\n\n**5. Capacete da Salvação**\n\nO capacete protege a mente, o centro do pensamento, da vontade e das emoções. Saber que somos salvos, que nossa identidade está segura em Cristo, nos protege dos ataques mentais do inimigo.\n\nPaulo escreve em Romanos 12:2: \"Transformai-vos pela renovação da vossa mente.\" A batalha começa na mente. Pensamentos que se alinham com a verdade de Deus produzem vida; pensamentos contrários produzem destruição.\n\n**6. Espada do Espírito**\n\nDas seis peças da armadura, apenas a espada é ofensiva. É a Palavra de Deus, nossa única arma de ataque. Jesus a usou no deserto: cada tentação de Satanás foi respondida com \"Está escrito...\" (Mateus 4:1-11).\n\nConhecer a Escritura de memória nos dá acesso a essa espada em qualquer momento. Não precisamos de um livro em mãos, precisamos da Palavra guardada no coração.\n\n**7. A oração, o combustível da batalha**\n\nDepois de descrever a armadura, Paulo acrescenta: \"Orando em todo o tempo com toda oração e súplica no Espírito\" (Efésios 6:18). A oração não é uma peça da armadura, é o que dá vida a toda ela. Sem oração, a armadura está vestida, mas o guerreiro está fraco.",
    referencias: [
      "Efésios 6:10-18 — A descrição completa da armadura de Deus",
      "2 Coríntios 10:3-5 — As armas da nossa guerra não são carnais",
      "Romanos 8:1 — Nenhuma condenação para os que estão em Cristo",
      "Mateus 4:1-11 — Jesus usando a Palavra contra as tentações de Satanás",
      "1 Pedro 5:8-9 — Sede sóbrios e vigilantes; o diabo anda em derredor",
      "Tiago 4:7 — Resisti ao diabo e ele fugirá de vós",
      "João 8:44 — O diabo é pai da mentira",
      "Romanos 12:2 — Transformai-vos pela renovação da vossa mente",
    ],
    perguntas: [
      "Qual peça da armadura você sente que está mais fraca na sua vida agora? O que você pode fazer para fortalecê-la?",
      "Como o conhecimento das Escrituras tem sido uma \"espada\" nas batalhas que você enfrenta no dia a dia?",
      "De que forma a certeza da sua salvação influencia a forma como você enfrenta os ataques do inimigo contra sua mente?",
      "Como a oração se conecta com o uso de cada peça da armadura? Você tem uma vida de oração que sustenta sua batalha espiritual?"
    ],
    oracao: "Senhor Deus, me revisto hoje de toda a Tua armadura. Cingo-me com a verdade da Tua Palavra. Visto a couraça da justiça de Cristo. Calço-me com o evangelho da paz. Levanto o escudo da fé contra todo dardo do inimigo. Coloco o capacete da salvação sobre minha mente. E empunho a espada do Espírito, que é a Tua Palavra. Que eu possa estar firme neste dia, não na minha própria força, mas no poder do Teu nome. Em nome de Jesus, amém."
  },
  {
    id: "f4", nivel: "avancado", fixo: true,
    titulo: "Vida de Oração",
    versiculo: "Lucas 18:1 — \"Era preciso orar sempre e nunca esmorecer.\"",
    texto: "A oração é o respirar da alma cristã. Sem ela, nossa vida espiritual se enfraquece gradualmente, muitas vezes sem que percebamos, até que nos encontramos distantes de Deus, secos por dentro, sem força para as batalhas da vida.\n\nMas o que é oração, de verdade? E como desenvolvemos uma vida de oração genuína e transformadora?\n\n**Oração é relacionamento, não religião**\n\nO maior equívoco sobre oração é tratá-la como uma obrigação religiosa, uma lista de pedidos que enviamos a um Deus distante na esperança de que atenda. Mas a oração, na sua essência, é conversa com o Pai que nos ama.\n\nJesus chamou Deus de \"Abba\", uma palavra aramaica íntima, equivalente a \"Papai\". Essa intimidade não era exclusiva de Jesus: Paulo escreve em Gálatas 4:6 que o Espírito Santo clama em nós esse mesmo \"Abba, Pai\". Somos convidados à mesma intimidade.\n\nDeus quer ouvir tudo, não apenas os pedidos formais. Suas alegrias, seus medos, suas dúvidas, sua gratidão, sua raiva, sua confusão. Os Salmos são cheios de clamores honestos, às vezes quase desesperados. Deus não se assusta com nossa honestidade.\n\n**Jesus, o modelo de oração**\n\nSe existe alguém que não precisava orar, era Jesus, o próprio Filho de Deus. E ainda assim, os evangelhos mostram que Ele orava constantemente:\n\nAntes de grandes decisões: \"Naqueles dias, Jesus foi ao monte orar, e passou a noite em oração a Deus. Quando amanheceu, chamou os seus discípulos\" (Lucas 6:12-13).\nEm momentos de angústia: No Getsêmani, suando como gotas de sangue, Ele orou: \"Pai, se quiseres, passa de mim este cálice; todavia, não se faça a minha vontade, mas a tua\" (Lucas 22:42).\nEm meio à multidão e na solidão: Marcos registra que Ele se levantava antes do amanhecer para orar (Marcos 1:35).\n\nSe o Filho de Deus priorizava a oração dessa forma, quanto mais nós precisamos dela?\n\n**O Pai Nosso, uma escola de oração**\n\nQuando os discípulos pediram a Jesus \"Ensina-nos a orar\", Ele não deu uma aula teológica, deu um modelo (Lucas 11:1-4). O Pai Nosso não é uma oração para ser recitada mecanicamente, mas uma estrutura que nos guia:\n\n**\"Pai nosso, que estás nos céus\"**, Acesso e intimidade. Podemos chamar o Criador do universo de Pai.\n\n**\"Santificado seja o Teu nome\"**, Adoração em primeiro lugar. Antes de pedir, reconhecemos quem Deus é.\n\n**\"Venha o Teu reino\"**, Alinhamento com os propósitos de Deus, não os nossos.\n\n**\"O pão nosso de cada dia nos dá hoje\"**, Dependência diária. Reconhecemos que tudo vem Dele.\n\n**\"Perdoa-nos as nossas dívidas\"**, Confissão honesta e recebimento do perdão.\n\n**\"Livra-nos do mal\"**, Proteção espiritual.\n\n**A oração que transforma**\n\nUma das verdades mais libertadoras sobre oração é que ela transforma principalmente quem ora, não apenas as circunstâncias. Muitas vezes não mudamos a situação quando oramos, mas somos transformados para enfrentá-la.\n\nA oração alinha nossa vontade com a de Deus. Começa com nossos desejos e pedidos, mas quando persistimos em presença de Deus, algo acontece: nossa perspectiva muda, nossos desejos são purificados, nossa paz aumenta mesmo sem resposta imediata.\n\nFilipenses 4:6-7 captura isso lindamente: \"Não andeis ansiosos de coisa alguma; antes, em tudo fazei conhecidas as vossas petições a Deus em oração e súplica, com ações de graças; e a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos pensamentos em Cristo Jesus.\"\n\nA promessa não é que a situação mudará. É que a paz de Deus guardará nossos corações.\n\n**Cultivando uma vida de oração**\n\nTenha um tempo fixo: Não precisa ser longo no início. Dez minutos consistentes valem mais do que uma hora esporádica.\n\nEncontre um lugar: Jesus falava sobre entrar no seu quarto e fechar a porta. Um lugar associado à oração ajuda a criar o hábito.\n\nUse a Palavra como base: Ore sobre o que leu nas Escrituras. A Bíblia nos diz o que Deus quer ouvir; a oração é nossa resposta.\n\nSeja honesto: Não use linguagem religiosa que não seja sua. Fale com Deus como fala com alguém que ama profundamente.\n\nPersevere: Lucas 18 conta a parábola da viúva persistente. Jesus a ensinou para mostrar que \"era preciso orar sempre e nunca esmorecer\". Nem toda oração é respondida imediatamente, mas toda oração sincera é ouvida.",
    referencias: [
      "Mateus 6:5-15 — O Pai Nosso e os princípios da oração segundo Jesus",
      "Lucas 18:1-8 — A parábola da viúva persistente",
      "Filipenses 4:6-7 — A paz de Deus que excede todo o entendimento",
      "Salmos 62:8 — Derramai o vosso coração diante dele",
      "1 Tessalonicenses 5:17 — Orai sem cessar",
      "Tiago 5:16 — A oração do justo tem grande poder",
      "Romanos 8:26-27 — O Espírito intercede por nós com gemidos inexprimíveis",
      "Marcos 1:35 — Jesus se levantava de madrugada para orar",
    ],
    perguntas: [
      "Qual é o maior obstáculo na sua vida de oração atualmente? Como você pode endereçar esse obstáculo?",
      "Você ora principalmente com pedidos, ou sua oração inclui adoração, confissão, gratidão e intercessão?",
      "Você já viveu uma experiência em que a oração não mudou a circunstância, mas mudou você? Compartilhe.",
      "O que você aprenderia sobre Deus se passasse os próximos 30 dias com um tempo fixo de oração diária?"
    ],
    oracao: "Pai, que maravilha é poder Te chamar de Pai! Obrigado por me convidar a essa intimidade, a conversar contigo a qualquer hora, em qualquer lugar, sobre qualquer coisa. Perdoa-me pelas vezes que tratei a oração como obrigação em vez de privilégio. Ensinai-me a orar como Jesus orava, com persistência, com honestidade, com total dependência de Ti. Que a oração se torne o respirar da minha alma, tão natural quanto o ar que respiro. Em nome de Jesus, amém."
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
  const [estudosAberto, setEstudosAberto] = useState(false);
  const [dicionarioAberto, setDicionarioAberto] = useState(false);
  const [dicionarioLetra, setDicionarioLetra] = useState("A");
  const [dicionarioTermo, setDicionarioTermo] = useState(null);
  const [dicionarioBusca, setDicionarioBusca] = useState("");

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
  const [notifAtivada, setNotifAtivada] = useState(false);
  const [mostrarBannerNotif, setMostrarBannerNotif] = useState(false);
  const [notifBloqueada, setNotifBloqueada] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

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

    // Banner Home — tempo real
    const unsubBanner = onSnapshot(doc(db, "config", "bannerHome"), (snap) => {
      if (snap.exists()) setBannerHome(snap.data());
      else setBannerHome(null);
    });

    // Banner Jejum — tempo real
    const unsubBannerJejum = onSnapshot(doc(db, "config", "bannerJejum"), (snap) => {
      if (snap.exists()) setBannerJejum(snap.data());
      else setBannerJejum(null);
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
      unsubMembros(); unsubAvisos(); unsubBanner(); unsubBannerJejum(); unsubEstudos(); unsubVideo(); unsubDevocional(); unsubAoVivo(); unsubPresenca();
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

  const handleRecuperarSenha = async () => {
    if (!recuperandoEmail.trim()) { setRecuperandoMsg("⚠️ Digite seu e-mail cadastrado."); return; }
    const snap = await getDoc(doc(db, "membros", recuperandoEmail.trim().toLowerCase()));
    if (!snap.exists()) { setRecuperandoMsg("⚠️ E-mail não encontrado. Verifique e tente novamente."); return; }
    const dados = snap.data();
    try {
      await emailjs.send(
        "service_sffzlx2",
        "template_o6kyn56",
        {
          to_name: dados.nome,
          to_email: recuperandoEmail.trim().toLowerCase(),
          senha_atual: dados.senha,
          app_url: window.location.origin,
        },
        "KkcyGeZOZYPkwGing"
      );
      setRecuperandoMsg("✅ E-mail enviado! Verifique sua caixa de entrada.");
    } catch {
      setRecuperandoMsg("❌ Erro ao enviar e-mail. Tente novamente.");
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
    header: { padding: "28px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "transparent", borderBottom: "none" },
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
        select option{background:${darkMode ? "#07112a" : "#ffffff"}; color:${T.text};}
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
                  position: "relative",
                  boxShadow: "0 2px 12px rgba(99,102,241,.18)",
                }}>
                {/* faixa topo */}
                <div style={{ background: "linear-gradient(90deg,#4f46e5,#7c3aed)", padding: "5px 16px", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13 }}>🙏</span>
                  <span style={{ fontSize: 10, fontWeight: "bold", letterSpacing: 3, textTransform: "uppercase", color: "#fff" }}>Jejum em Família</span>
                </div>
                {/* conteúdo */}
                <div style={{ padding: "14px 16px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 17, fontWeight: "bold", color: darkMode ? "#e0e7ff" : "#312e81", lineHeight: 1.3, marginBottom: 6 }}>
                      {bannerJejum.titulo || "Jejum em Família"}
                    </div>
                    {bannerJejum.subtitulo ? (
                      <div style={{ fontSize: 13, color: darkMode ? "#a5b4fc" : "#4f46e5", marginBottom: 10 }}>
                        {bannerJejum.subtitulo}
                      </div>
                    ) : null}
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

            {/* ── CARD PALAVRA SEMANAL (com foto do pastor) ── */}
            {palavra ? (
              <div style={{ margin: "16px 16px 4px", borderRadius: 20, overflow: "hidden", position: "relative", background: darkMode ? "linear-gradient(135deg,#0a1a3a 0%,#050d1f 60%)" : "linear-gradient(135deg,#f5f0e8 0%,#ede4d0 60%)", border: `1px solid ${darkMode ? "rgba(201,168,76,.3)" : "rgba(154,112,32,.55)"}`, minHeight: 190 }}>
                {/* faixa dourada topo */}
                <div style={{ background: "linear-gradient(90deg,#c9a84c,#e8c97a)", padding: "6px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: "bold", letterSpacing: 3, textTransform: "uppercase", color: "#080810" }}>Palavra Semanal</span>
                </div>
                {/* conteúdo */}
                <div style={{ display: "flex", alignItems: "stretch", minHeight: 160 }}>
                  {/* texto */}
                  <div style={{ flex: 1, padding: "14px 16px 16px" }}>
                    <div style={{ fontSize: 11, color: "#c9a84c", marginBottom: 4, letterSpacing: 1 }}>Pr. Fernando Mello</div>
                    <div style={{ fontSize: 20, fontWeight: "bold", lineHeight: 1.25, color: darkMode ? "#fff" : "#1a0f00", marginBottom: 14 }}>
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

            {/* ── BANNER ESTUDOS NOVIDADE ── */}
            {!estudosAberto ? (
              <div style={{ margin: "14px 16px 0", borderRadius: 18, overflow: "hidden", border: "1px solid rgba(201,168,76,.35)", background: darkMode ? "linear-gradient(135deg,#0a1a3a 0%,#050d1f 60%,#07112a 100%)" : "linear-gradient(135deg,#f5f0e8 0%,#ede4d0 100%)", position: "relative" }}>
                <div style={{ background: "linear-gradient(90deg,#c9a84c,#e8c97a)", padding: "5px 16px" }}>
                  <span style={{ fontSize: 10, fontWeight: "bold", letterSpacing: 3, textTransform: "uppercase", color: "#080810" }}>🎉 Novidade no APP!</span>
                </div>
                <div style={{ padding: "16px 18px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(201,168,76,.12)", border: "1.5px solid rgba(201,168,76,.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h7a4 4 0 0 1 4 4v12H4V4z" fill="rgba(201,168,76,.1)"/>
                      <path d="M20 20H11a4 4 0 0 1-4-4V4"/>
                      <line x1="12" y1="4" x2="12" y2="20"/>
                      <line x1="8" y1="9" x2="11" y2="9"/>
                      <line x1="8" y1="13" x2="11" y2="13"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "#c9a84c", letterSpacing: 1, marginBottom: 4 }}>Já disponível!</div>
                    <div style={{ fontSize: 16, fontWeight: "bold", color: darkMode ? "#fff" : "#1a0f00", lineHeight: 1.3, marginBottom: 6 }}>Estudo Bíblico Temático</div>
                    <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.5, marginBottom: 10 }}>Para iniciantes e avançados na caminhada com Deus.</div>
                    <button onClick={() => { setEstudosAberto(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "linear-gradient(90deg,#c9a84c,#e8c97a)", border: "none", borderRadius: 20, padding: "8px 18px", fontSize: 12, fontWeight: "bold", color: "#080810", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                      📚 Clique aqui para acessar →
                    </button>
                  </div>
                </div>
                <div style={{ position: "absolute", top: 0, right: 0, width: 100, height: "100%", background: "radial-gradient(ellipse at right, rgba(201,168,76,.07) 0%, transparent 70%)", pointerEvents: "none" }} />
              </div>
            ) : (
              <div style={{ animation: "slideUp .3s ease" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px 0" }}>
                  <button onClick={() => { setEstudosAberto(false); setEstudoAberto(null); }}
                    style={{ background: "none", border: "none", color: T.gold, cursor: "pointer", fontSize: 14, fontFamily: "Georgia,serif" }}>← Voltar</button>
                  <div style={{ fontSize: 16, fontWeight: "bold", color: T.text }}>📚 Estudos Temáticos</div>
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

            {/* ── ACESSO RÁPIDO ── */}
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
                  <div style={{ fontSize: 12, color: T.textSub }}>Cultos: Ter 15h • Qui 20h • Dom 10h</div>
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
              {["agenda", "palavra", "devocional", "avisos", "estudos", "banner", "jejum", "video", "aovivo", "membros"].map(t => (
                <button key={t} style={S.adminTab(adminTab === t)} onClick={() => setAdminTab(t)}>
                  {{ agenda: "📅 Agenda", palavra: "📜 Palavra", devocional: "🕊️ Devoc", avisos: "📢 Avisos", estudos: "📚 Estudos", banner: "🖼️ Banner", jejum: "🙏 Jejum", video: "▶️ Vídeo", aovivo: "🔴 Ao Vivo", membros: "👥 Membros" }[t]}
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

            {/* Admin: Banner Jejum */}
            {adminTab === "jejum" && (
              <div style={{ padding: "0 16px" }}>
                <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 4, color: "#818cf8" }}>🙏 Banner de Jejum</div>
                <div style={{ fontSize: 12, color: T.textSub, marginBottom: 16 }}>Aparece antes da Palavra Semanal. Atualize todo dia com o texto do dia.</div>

                {/* Toggle ativo */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: "bold", color: T.text }}>Banner visível na Home</div>
                    <div style={{ fontSize: 11, color: T.textSub }}>Desative para esconder sem apagar o conteúdo</div>
                  </div>
                  <div
                    onClick={() => setBannerJejum(bj => ({ ...bj, ativo: !bj?.ativo }))}
                    style={{ width: 46, height: 26, borderRadius: 13, background: bannerJejum?.ativo ? "#4f46e5" : "rgba(150,150,150,.3)", cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
                    <div style={{ position: "absolute", top: 3, left: bannerJejum?.ativo ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.3)" }} />
                  </div>
                </div>

                {/* Título principal */}
                <label style={S.label}>Título do banner *</label>
                <input style={{ ...S.input, marginBottom: 0 }}
                  placeholder="Ex: JEJUM EM FAMÍLIA — DIA 1"
                  value={bannerJejum?.titulo || ""}
                  onChange={e => setBannerJejum(bj => ({ ...bj, titulo: e.target.value }))} />

                {/* Subtítulo */}
                <label style={S.label}>Subtítulo (data / tema do dia)</label>
                <input style={{ ...S.input, marginBottom: 0 }}
                  placeholder="Ex: 22/06 — BUSQUE A PRESENÇA"
                  value={bannerJejum?.subtitulo || ""}
                  onChange={e => setBannerJejum(bj => ({ ...bj, subtitulo: e.target.value }))} />

                {/* URL da imagem */}
                <label style={S.label}>URL da imagem (abre ao clicar)</label>
                <input style={{ ...S.input, marginBottom: 0 }}
                  placeholder="https://... (hospede no ImgBB, Cloudinary, Google Drive, etc)"
                  value={bannerJejum?.imagemUrl || ""}
                  onChange={e => setBannerJejum(bj => ({ ...bj, imagemUrl: e.target.value }))} />
                <div style={{ fontSize: 11, color: T.textSub, marginBottom: 12, marginTop: 4 }}>
                  💡 Cole aqui o link direto da imagem do dia do jejum. O fiel vai clicar no banner e ver a imagem.
                </div>

                {/* Preview */}
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
                          <div style={{ fontSize: 17, fontWeight: "bold", color: "#312e81", lineHeight: 1.3, marginBottom: 6 }}>
                            {bannerJejum?.titulo || "Título do dia"}
                          </div>
                          {bannerJejum?.subtitulo && (
                            <div style={{ fontSize: 13, color: "#4f46e5", marginBottom: 10 }}>{bannerJejum.subtitulo}</div>
                          )}
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

                {/* Botão salvar */}
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
                        setBannerJejum(null);
                        showToast("🗑️ Banner do Jejum removido!");
                      }
                    }}>🗑️ Remover Banner</button>
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
