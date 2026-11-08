/* Publica TODO de una sola vez: los poemas (colección poemas-publicados) y las calificaciones (colección poemas).
   Se usa una vez, con sesión de administrador. Si lo pulsas de nuevo, omite lo que ya existe. */
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, getDoc, setDoc }
    from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCM8fjWstKNjL4l4AbG3Z16xiYVl6s-XAA",
    authDomain: "poemas-jg.firebaseapp.com",
    projectId: "poemas-jg",
    storageBucket: "poemas-jg.firebasestorage.app",
    messagingSenderId: "619654028698",
    appId: "1:619654028698:web:2d59e97d07a7efd643ee23",
    measurementId: "G-QHE41GVRSH"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, "default");

const POEMAS = [
 {
  "autor": "MG",
  "titulo": "El amor ❤️",
  "fecha": "2024-05-19",
  "nuevo": true,
  "especial": false,
  "poema": "El amor es un sentimiento\nmuy lleno de conocimiento.\nEl amor es sinceridad,\nel amor es siempre la verdad.\n\nEl amor no es un juego,\nel amor en mi alma llevo;\nel amor es verdadero,\nel amor no se combate con fuego."
 },
 {
  "autor": "MG",
  "titulo": "Mi propio cielo",
  "fecha": "2024-05-16",
  "nuevo": true,
  "especial": false,
  "poema": "Tus ojos son dos luceros,\nson como dos mundos enteros.\nTu sonrisa, un rayo de luna\nque no se compara a ninguna.\n\nTu rostro es la galaxia,\ntus mejillas, dos auroras,\ntus labios, rojos planetas\nque al parecer son cometas."
 },
 {
  "autor": "MG",
  "titulo": "Solamente un amigo",
  "fecha": "2025-03-19",
  "nuevo": true,
  "especial": false,
  "poema": "Soñé que salía contigo\nPero solamente eras mi amigo\nTal vez esto se haga realidad\nPero solamente como una amistad\n\nYo no te conozco y tú no me conoces\nEso es lo que siempre dicen mis voces\nSiempre te cuento mis problemas y dudas\nAunque muchas veces son absurdas\n\nAlgún día te podré conocer\nPero en ese momento no sabré que hacer\nEn fin algún día saldré contigo\nPero solamente serás mi amigo"
 },
 {
  "autor": "MG",
  "titulo": "Reflejos del destino",
  "fecha": "2026-01-16",
  "nuevo": true,
  "especial": false,
  "poema": "Detrás de ese espejo\nse encuentra su reflejo,\nel de una bella dama\nque no sabe a quien ama.\n\nSe pierde en sus pensamientos\nrecordando aquellos momentos,\nesperando que el destino\nmarque al fin su camino.\n\nBuscando en sus propios ojos\nuna verdad que se escapa,\nmientras el tiempo, en su antojo,\nel corazón le arrebata."
 },
 {
  "autor": "MG",
  "titulo": "Renacer en el olvido",
  "fecha": "2026-01-20",
  "nuevo": true,
  "especial": false,
  "poema": "Borré tu rastro de mi piel cansada,\nya no te busco en el ayer perdido;\npues deje aquel fuego en el ayer dormido\ny hoy mi alma camina renovada.\nNo necesito luz de aquel pasado,\npara alumbrar el triunfo de mi ahora...\nPues mi corazón lo ha olvidado,\ny en mi propio incendio se redecora.\nSoy el dueño del tiempo que me queda,\nsin deudas, sin cadenas, sin lamento...\nPues aquel triste sentimiento\nya no hay fuerza en el mundo que lo ceda."
 },
 {
  "autor": "MG",
  "titulo": "A pesar de todo",
  "fecha": "2026-01-20",
  "nuevo": true,
  "especial": false,
  "poema": "No quiero volver a enamorarme,\npero ante el color de tus ojos no puedo negarme.\nSon claros y hermosos como el atardecer,\ny guían mi camino en cada anochecer.\nTraté de ser fuerte y no sentir nada,\npero me pierdo en tu luz y en tu mirada.\nEs un brillo que me quita el temor,\ny me hace olvidar cualquier viejo dolor.\nYa no me importa si pierdo o si gano,\nsi puedo tenerte cerca, dándome la mano.\nPorque aunque juré no entregar el corazón,\ntus ojos son hoy mi única razón."
 },
 {
  "autor": "MG",
  "titulo": "Juramento quebrado",
  "fecha": "2026-03-29",
  "nuevo": true,
  "especial": false,
  "poema": "Por culpa de este sentimiento\nEstoy fallando a mi juramento\nEl cual dije no volver a amar\nPero este sentimiento dice que no lo voy a lograr.\nEste amargo sentimiento\nEs el responsable de ahora como me siento:\nun náufrago que juró no volver al mar,\ny hoy se ahoga en las ganas de volverte a buscar.\nAlcé muros de piedra, de hielo y de olvido,\npara cuidar lo poco que no se había hundido.\nPero tú llegaste con una luz tan mansa,\nque hiciste trizas mi última esperanza...\nla esperanza de no sentir nada.\n\nMaldigo la tregua que firmé con mi suerte,\npues hoy mi promesa se siente una muerte.\n¿De qué sirve el orgullo de no claudicar,\nsi el alma me grita que quiere fallar?"
 },
 {
  "autor": "MG",
  "titulo": "Algo sin importancia",
  "fecha": "2026-04-12",
  "nuevo": true,
  "especial": false,
  "poema": "Algo en mi mente hizo que te recordara,\npero mi corazón dijo que ya te olvidara.\nQuizás ese recuerdo no fue importante,\npero lo más importante fue olvidarte\n\nFue muy difícil que mi corazón te amara,\nya quería que eso que sentía terminara;\nPues aquello era algo inquietante,\nya que tú nunca me buscaste."
 },
 {
  "autor": "MG",
  "titulo": "Si no buscas te vas a lamentar",
  "fecha": "2026-04-19",
  "nuevo": true,
  "especial": false,
  "poema": "Aquello ya quedó en el olvido,\nel pasado se debe enterrar;\npues parece un gesto aburrido\nbuscar lo que no has de hallar.\n\nMas seguir el rastro es penoso,\ncual aguja en un vasto pajar;\ny si hoy te muestras omiso,\nmañana te habrás de lamentar."
 },
 {
  "autor": "MG",
  "titulo": "Esa llama fuerte",
  "fecha": "2026-06-30",
  "nuevo": true,
  "especial": false,
  "poema": "Esa llama que ardía por dentro\nse apagó de uno a otro momento.\nEsa llama que se creía fuerte\nahora no es más que una rama verde.\n\nPues esa llama se tenía que apagar,\nporque a las cenizas no iba a ilusionar;\npor eso decidió apagarse\ny, lejos del viento, resguardarse."
 },
 {
  "autor": "MG",
  "titulo": "La última vez y un único recuerdo",
  "fecha": "2026-07-10",
  "nuevo": true,
  "especial": false,
  "poema": "Quizás esta sea la última vez,\nla última vez que te busque,\nla última vez que te llame,\npero no la última vez que te extrañe.\nPues fuiste una gran persona,\nde las que difícilmente se olvidan.\nUna gran persona que se queda en aquel corazón o en aquella memoria;\nuna persona que con su forma de ser es fácil de recordar,\npues en todos los recuerdos que se quedaron grabados, tú tuviste que estar."
 },
 {
  "autor": "MG",
  "titulo": "El adiós que no fue",
  "fecha": "2026-07-20",
  "nuevo": true,
  "especial": false,
  "poema": "Si alguna vez vuelvo a buscarte,\nya no será para rogarte,\nsino para despedirme y agradecer,\npues gracias a ti hoy soy la persona\nque quiero ser.\n\nTú me diste razones para en ti confiar,\npero después con tu actitud pude reflexionar\nesa frase clara que me dijiste,\npues con tus actos me mostraste\nlo poco que me quisiste.\n\nLa frase clara que me dijiste fue:\n\"Ya en nadie se puede confiar\",\npues tú fuiste ese claro ejemplo\nal irte ya sin avisar.\n\nHoy cierro al fin la puerta\na lo que un día pudo ser,\nte doy las gracias por irte\ny enseñarme a renacer."
 },
 {
  "autor": "MG",
  "titulo": "El hubiera del pasado",
  "fecha": "2026-07-20",
  "nuevo": true,
  "especial": false,
  "poema": "Todos tus sueños cumplirás,\ny de esa persona, al fin, te olvidarás.\n\nA pesar de todo, te seguirá recordando,\ny seguirá pensando en qué habría sido\nsi en verdad la hubieras amado.\n\nPero sabrá que el \"hubiera\" ya no existe,\nque todo quedó en el pasado;\nque tiene un gran futuro por delante\ny que de su mente y corazón\ndebe sacarte.\n\nAl principio le será difícil,\npero cuando por fin lo logre,\nvolverá la paz a su alma\nal decir adiós a aquel amor."
 },
 {
  "autor": "MG",
  "titulo": "Errores que cambian",
  "fecha": "2026-07-30",
  "nuevo": true,
  "especial": false,
  "poema": "Otro error volviste a cometer\ny eso te causó coraje y dolor.\nPero no significa que volviste a perder,\nsino que te diste cuenta de que aquel error\nlo corregiste con mucho valor.\nDespués el tiempo querrás regresar atrás,\npero ya no podrás,\npuesto que este error cometido,\nen algún momento de tu futuro,\nte hará cambiar."
 },
 {
  "autor": "MG",
  "titulo": "Un paso atrás",
  "fecha": "2026-09-05",
  "nuevo": true,
  "especial": false,
  "poema": "De nuevo regreso aquel sentimiento\ny eso me trae un mal presentimiento,\npues de nuevo volver a enamorarme\nhará que vuelva a perdonarte.\nSé que nunca me pusiste atención,\npero tu brillo siempre engaña a mi corazón.\nDicen que todo amor llega a su final,\npero lo nuestro no fue ni un cuento real:\nsin un inicio, sin desarrollo que contar...\nPor eso hoy decido dar un paso atrás."
 },
 {
  "autor": "MG",
  "titulo": "Solo un juego",
  "fecha": "2026-11-03",
  "nuevo": true,
  "especial": false,
  "poema": "Bien sabía que fue solo fantasía\ny que en un momento terminaría.\nAl final llegué a la conclusión\nde que lo que sentí fue solo obsesión.\n\nDespués de todo te quise olvidar\npara ya no volver a recordar\ntodas las mentiras que dijiste,\nque bien sé que te arrepentirás.\n\nPara ti fui solo una desconocida\na la que encontraste sola y perdida.\nSolo fui una pérdida de tiempo,\npor suerte para mí fuiste un pasatiempo.\n\nMe prometiste viajar por el mundo\ny esa promesa duró solo un segundo.\nAl final tu amor fue puro juego,\ny yo apagué por ti mi fuego."
 },
 {
  "autor": "HE",
  "titulo": "Ya Fue",
  "fecha": "2025-03-18",
  "nuevo": false,
  "especial": false,
  "poema": "Tenía razón,\nLo decía mi corazón,\nTu no me amabas,\nNi me hablabas.\n\nTu solo respondías,\nYa lo predecía,\nNos dejamos,\nPero aún hablamos.\n\nYo te rogué,\nPara que te quedaras,\nSolo me desahogué, me ilusionaras.\n\nMe dejaste como,\nA Mario Benedetti,\nSolo pensando,\nEn ti.\n\nYo quería,\nUna vida con vos,\nPero ni siquiera,\nPude escuchar tu voz.\n\nUna vida,\nEn la que tuviéramos,\nUn hijo, una hija,\nDos perros.\nPensé que tal vez sería,\nEn esta vida,\nO tal vez será,\nQue me equivoqué de vida."
 },
 {
  "autor": "HE",
  "titulo": "Quisiera",
  "fecha": "2025-03-21",
  "nuevo": false,
  "especial": false,
  "poema": "Quisiera haber,\nSalido con vos,\nPara verte,\nY abrazarte.\n\nQuisiera haber,\nEscuchado tu voz,\nPara saber,\nMás de vos.\n\nQuisiera saber,\nQué hice mal,\nPara ver,\nSi lo puedo arreglar.\n\nQuisiera saber,\nPara ya no beber,\nSi volveríamos a estar,\nO solo queda soñar.\n\nQuisiera soñar,\nNunca despertar,\nPorque mis sueños,\nSon solo con vos.\n\nQuisiera soñar,\nQue en esos,\nBellísimos ojos,\nMe pierdo.\n\nQuisiera perderme,\nEn ese momento sublime,\nCon tan bellos ojos,\nMe mirabas.\n\nQuisiera perderme,\nEn esos labios,\nBesarte sin parar,\nSin querer terminar."
 },
 {
  "autor": "HE",
  "titulo": "Bella Rosa",
  "fecha": "2025-03-25",
  "nuevo": false,
  "especial": false,
  "poema": "Eres hermosa,\nTal cual una rosa.\nQuisiera verte,\nPero frente a frente.\n\nA todas horas\nPienso en vos,\n¿Cómo sonará\nEsa bella voz?\n\nQuiero protegerte siempre,\nAmarte toda la vida,\nY en diciembre\nPresentarte a mi familia.\n\nInvitarte al cine,\nVer una película,\nEs que nuestro amor\nEs de película.\n\nQuiero tomarte\nDe las manos,\nQuiero amarte\nTodos los años.\n\nMe gustaría\nConocer a tu familia,\nSaber las historias\nDe tu infancia.\n\nAunque peleemos,\nSiempre lo arreglamos,\nPorque nuestro amor\nEs siempre de color.\n\nCon este intenso amor\nQue sentimos mutuamente,\nDeseo que este bello amor\nNos dure eternamente."
 },
 {
  "autor": "HE",
  "titulo": "Sueño con vos",
  "fecha": "2025-03-27",
  "nuevo": false,
  "especial": false,
  "poema": "Sueño con vos,\nNo quiero despertar,\nEstoy apunto de escuchar,\nEsa hermosa voz.\n\nLamentablemente desperté,\nDe tan bello sueño que abracé.\nEn la relidad no quería vivir,\nY sin vos me quiero morir.\n\nEres tan bella como la galaxia,\nMás bella que un exoverso,\nQue es único como vos,\nAsí que la amaría toda la vida.\n\nDéjame amarte,\nAhora, eres mi muza,\nDéjame decirte,\nQue estás hermosa.\n\nPorque siento que eres,\nLa mejor de todas las mujeres.\nLa verdad nunca me había pasado,\nY ahora quiero estar a tu lado.\n\nQuiero tener una relación estable,\nDe la que la gente hable,\nSobre como nos amamos,\nY cómo es que estamos.\n\nEspero tu también,\nSueñes conmigo,\nAsí como también,\nYo sueño contigo."
 },
 {
  "autor": "HE",
  "titulo": "Amistad en Redes",
  "fecha": "2025-04-07",
  "nuevo": false,
  "especial": false,
  "poema": "Te conocí en redes sociales,\nCaí en tus redes virtuales.\nDesde entonces, a deshora,\nMiro tu chat cada hora.\n\nAhora, ahora en vos,\nConfío demasiado como,\nPara lo que me tomo,\nEn pronunciar adiós.\n\nOjalá nos conociéramos,\nFrente a frente, donde,\nEn vez de la boca, los ojos,\nHablen y hablen sin fin.\n\n¿Por qué, por qué será,\nQue está tan hermosa,\nSerá que vendrá,\nDe una realidad preciosa?\n\nLamentablemente hay un pero,\nEs que lo único que espero,\nEs no ilusionarme a mi mismo,\nY mantener un rumbo sincero.\n\nSolo que yo no creo,\nQue fuera capaz, capaz,\nDe solo usarme y yo,\nComo un idiota dejarme.\n\nVaya, resulta que me estabas,\nLigando, y eso yo no lo esperaba,\nTal vez si lo intentemos,\nSolo sea para que nos divirtamos.\n\nA pesar de nuestras diferencias,\nTenemos algunos intereses,\nPor nuestras experiencias,\nY por nuestros peses.\n\nGracias por tu fabulosa amistad,\nMe encanta, me encanta en verdad,\nDeseo por favor nos podamos,\nVer frente a frente, solo esperemos."
 },
 {
  "autor": "HE",
  "titulo": "La Canción",
  "fecha": "2025-10-07",
  "nuevo": false,
  "especial": false,
  "poema": "Él te dedicó,\nEsa hermosa canción,\nLa cual algún día salió,\nDel fondo de mi corazón.\n\nDe mi novia a,\nUna gran parte de mi corazón.\nEs por eso que este poema,\nLo escribo desde el corazón.\n\nEres una niña que vale millones,\nPorque tenía muchas visiones,\nContigo en un futuro,\nOlvidando mi pasado obscuro.\n\nEres una princesa,\nQue necesita ser amada,\nPorque está hermosa,\nY es muy disciplinada.\n\nMi lado enamorado,\nFue muy romántico,\nPero ya conmigo has terminado,\nPor ser intensamente romántico.\n\nplaneaba cuidarte,\nQuería amarte,\nDeseaba besarte,\nY solo quería tenerte.\n\nAhora debo conformarme,\nCon ser solo amigos,\nAunque seguiré amándote,\nY quedarnos como desconocidos.\n\nPara muchos,\nUna niña X,\nPero para mi,\nLa reina de mi vida.\n\nTienes una sonrisa encantadora,\nUn alma que me enamora.\nMe pregunto cada día,\n¿En verdad quería ser mi novia?"
 },
 {
  "autor": "HE",
  "titulo": "Marchita",
  "fecha": "2025-10-10",
  "nuevo": false,
  "especial": false,
  "poema": "Ya me da igual,\nSi en mí, piensas o no,\nMi amor no es visual,\nEs a tu alma, un camino.\n\nPerdón que vuelva a llamar,\nSolo quería decirte que tus fotos,\nNo he podido borrar,\nAún pienso en nosotros.\n\nEs por eso que todos,\nLos poemas que te escribo,\nAbsolutamente todos,\nCon mi corazón los escribo.\n\nEn mi cabeza repito siempre,\nEse verso que escribí,\nEn ese mes de diciembre,\nDije la verdad, y la ví.\n\nPero yo habría de ser otro,\nY tú otra, para que fuera,\nDistinto nuestro amor;\nY no quiero que sea distinto.\n\nMejor confío en su voz,\nQue escuche mi agonía,\nPongo mis cargas en manos de Dios,\nY su paz guardará mi alma.\n(felipenses 4:6-73)"
 },
 {
  "autor": "HE",
  "titulo": "La Poesía",
  "fecha": "2025-11-01",
  "nuevo": false,
  "especial": false,
  "poema": "Empezó como pasatiempo,\nPero al paso del tiempo,\nSe volvió un talento,\nEn ocasiones un sentimiento.\n\nLa poesía es algo rara,\nPues si se aclamara,\nTodos la practicaran,\nY por dentro la crearan.\n\nHoy cada rima la usan mal,\nPara escribir sobre maldad,\nPuro contenido vulgar,\nEl cual todos suelen apoyar.\n\nLa poesía sigue siendo un arte,\nCon la que puedes expresarte,\nPuede ser con el corazón,\nHasta con una oración.\n\nPertenezco a esa rareza,\nAunque no les parezca,\nQue sigue escribiendo poesía,\nDe la que antes se hacía."
 },
 {
  "autor": "HE",
  "titulo": "El Amor",
  "fecha": "2025-11-08",
  "nuevo": false,
  "especial": false,
  "poema": "Siempre nos preguntamos,\nLo que significa el amor,\nLo que se siente cuando amamos,\nY no es en la cama cualquier clamor.\n\nEs un grandioso sentimiento,\nQue te hace sentir miles de cosas,\nQue hoy en día ya no siento,\nPues me enfoco en mis metas.\n\nPero el amor te debilita,\nPues cuando te enamoras todo lo das,\nA veces también te limita,\nY en ocasiones ya no hay paradas.\n\nEste sentimiento te llega al alma,\nSiempre les dará mucha calma,\nA pesar de uno que otro problema,\nLlegan a tener su propio lema."
 },
 {
  "autor": "HE",
  "titulo": "Superar",
  "fecha": "2025-11-14",
  "nuevo": false,
  "especial": false,
  "poema": "Tal vez nunca te logre superar,\nPero nunca te voy a esperar,\nMe pregunto cómo es que llegaste,\nNo sé cómo a mi vida entraste.\n\nTal vez si te vuelvo a encontrar,\nAunque no te tenga que esperar,\nTe diré lo feliz que me hiciste,\nCuando conmigo ni estuviste.\n\nTal vez aún me puedas enamorar,\nAunque ya sea difícil de lograr,\nY si ahora ya me reemplazaste,\nTe preguntarás lo que lograste.\n\nTal vez mis cartas vayas a guardar,\nEspero no las vayas a quemar.\nPues la carta que una vez hiciste,\nMegamente feliz me hiciste."
 },
 {
  "autor": "HE",
  "titulo": "Tus ojos",
  "fecha": "2025-11-19",
  "nuevo": false,
  "especial": false,
  "poema": "Cuando me miraste a los ojos,\nEs como si me hubieras enamorado,\nAlgo que no pasa con ojos cualquiera,\nTal vez tú, podrías quitarme lo tarado.\n\nAl ver esos hermosos ojos,\nMe di cuenta de lo hermosa,\nQue sos, me hiciste verlo en tus ojos,\nDe forma similar a una diosa.\n\nYo sé que tengo mala fama,\nPero por ti yo podría cambiar,\nSolo si me das una oportunidad,\nTe podría por siempre amar."
 },
 {
  "autor": "HE",
  "titulo": "Fácil, pero difícil",
  "fecha": "2025-11-26",
  "nuevo": false,
  "especial": false,
  "poema": "El arte de amarte, es tan fuerte que adorarte es para motivarte y siempre amarte, por qué tenerte es fácil para otro, pero difícil amarte, y para mí complicado tenerte, pero muy simple amarte."
 },
 {
  "autor": "HE",
  "titulo": "Melodía de Flor de Primavera",
  "fecha": "2026-01-28",
  "nuevo": false,
  "especial": true,
  "poema": "Cada que abraza tu corazón,\nEl mío hace una gran canción,\nDe todos los momentos especiales,\nSobre todo en aquellos umbrales.\n\nA pesar de no ser nada tú y yo,\nSolo recordando todo aquello,\nTu cuerpo de rosa tan deseado,\nY tu interior nadie ha buscado.\n\nDurante siglos mi amor te he dado,\nTodo poema de amor a ti dedicado,\nPor si ese recuerdo olvidado vuelve,\nEn nuestro profundo amor se disuelve.\n\nAlguien como tú imposible de encontrar,\nPor eso quiero a tu corazón entrar,\nSi quisieras a Marte conmigo llegar,\nJuntos podríamos llegar a volar.\n\nMe asusta tu mala idea,\nQue no te consideres ideal,\nEs que no quiero sentir tus brazos,\nEn momentos en que me abrazas.\n\nPor eso tu voz es una melodía,\nQue me alegra siempre cada día,\nMi presente tranquila,\nPorque calma tu fuerte brisa.\n\nTus labios dicen que mueres por mí,\nTanto tus ojos que vives por mí,\nTan solo un halago hacia ti,\nPara recorrer tu cabeza sin fin.\n\nTus ojos provocadores de desvelo,\nTanto para que acaricies mi pelo,\nTu cara completa formada de pétalos,\nQuedando tu aroma en mi prisión lleno.\n\nEncontrarte en el infinito lucero,\nQuedarme en tu bello paradero,\nSin pensar en que esto no debo,\nContigo ahora todo lo puedo.\n\nAsí que tú, mi inefable tulipán,\nCrea tu mejor y grandioso afán,\nEn mi cabeza siempre ser la primera,\nEstar como flor de primavera."
 },
 {
  "autor": "HE",
  "titulo": "Bosque Irreal",
  "fecha": "2026-02-01",
  "nuevo": false,
  "especial": false,
  "poema": "Recorro un hermoso camino,\nEn medio del frondoso bosque,\nA lo lejos ya no hay pinos,\nLo tomo como un tanto cliché.\n\nLoco por el gran atardecer,\nSolo yo lo disfruto al escribir,\nSin una tristeza que padecer,\nMi corazón vuelve a sentir.\n\nDurante el bello anochecer,\nCada estrella logro percibir,\nEntre cada frontera solo ver,\nCon la luna tan solo reunir.\n\nAl amanecer solo un café,\nDisfrutar de colores inolvidables,\nPoder olvidar lo que pasé,\nFrente a las vistas irreales."
 },
 {
  "autor": "HE",
  "titulo": "El Chico Desamparado",
  "fecha": "2026-02-20",
  "nuevo": false,
  "especial": false,
  "poema": "A veces llega la melancolía,\nSolo en la noche sombría,\nEn situación de soledad,\nLe da por sobrepensar.\n\nAl cabo de cada día,\nEste lo admiraría,\nSus pensamientos de subida,\nSolo en las nubes quedarían.\n\nAnte su estado general,\nSolo queda cabizbajo,\nPara él, el amor es irreal,\nPues le cuesta trabajo.\n\nTiene que quedar en soledad,\nSolo alumbra el faro,\nSi llega la ansiedad,\nSobrevivir es un milagro."
 },
 {
  "autor": "HE",
  "titulo": "Paradójica",
  "fecha": "2026-03-09",
  "nuevo": false,
  "especial": false,
  "poema": "Aquella bella tu manera,\nAsí aquí tu destreza,\nNo conocer otra fortaleza,\nElijo regocijo en tu belleza,\nEres una pregunta sin respuesta,\nUna decisión indispuesta,\nUna fuerza perfecta mal puesta,\nQue dividirte solo cuesta.\n\nEntrego ciego mi corazón,\nCon sosiego mi perdón,\nLuego extraño tu tono burlón,\nSin tu cariño soy un vacilón,\nComprendo no entenderte,\nTienes miedo de perderte,\nSolo fragilidad imprudente,\nTu nombre resuena en mi mente.\n\nA veces eres hielo en calor,\nPuedes perderte lo mejor,\nDe todo mi grande amor,\nQue te tengo a tu favor.\n\nTu camino encuentras perdida,\nCon la energía del sol vencida,\nUna gran tormenta colmada,\nSolo palabras de despedida."
 },
 {
  "autor": "HE",
  "titulo": "Mariana (Acróstico P/verso)",
  "fecha": "2026-04-29",
  "nuevo": false,
  "especial": true,
  "poema": "Mi hermanita de otra sangre,\nA quien amo con mi ser,\nRuego a Dios que cuide a esa mujer,\nIncluso su muerte me puede joder,\nArtista dibujando recuerdos en mi mente,\nNo puedes en ella perderte,\nAunque tenga muchas cosas en mente.\n\nGuapa lo es siempre,\nAntes, incluso en el vientre,\nPero que ella te acepte,\nClaro es que lo intentes,\nInternamente ella lo siente,\nAmar es su gran arte.\n\nPero la amo y la quiero,\nEn las buenas y malas,\nRecurrir a ella para cuidarla,\nEntera mi vida con ella la quiero,\nZafio es al conocerla."
 },
 {
  "autor": "HE",
  "titulo": "Sin título",
  "fecha": "2026-06-11",
  "nuevo": false,
  "especial": false,
  "poema": "Amo tu piel con toda pasión,\nNo sé cómo robé tu corazón,\nSé que fue hace dos años,\nPero no sabes cuánto te extraño.\n\nHe encantado ver tu boca,\nEsa que decía, era muy besable,\nTu paciencia sé que es poca,\nPor eso contigo fui muy responsable.\n\nSin lentes te ves hermosa,\nMás que una bella rosa,\nDistraída parece que posas,\nAsí es como me enamoras.\n\nEres parte esencial de mí,\nAunque ya no sientas lo mismo,\nNo me he podido olvidar de ti,\nAcepto tu amistad por conformismo.\n\nAmo tu piel con toda pasión,\nNo sé cómo robé tu corazón,\nSé que fue hace dos años,\nPero no sabes cuánto te extraño.\n\nHe encantado ver tu boca,\nEsa que decía, era muy besable,\nTu paciencia sé que es poca,\nPor eso contigo fui muy responsable.\n\nSin lentes te ves hermosa,\nMás que una bella rosa,\nDistraída parece que posas,\nAsí es como me enamoras.\n\nEres parte esencial de mí,\nAunque ya no sientas lo mismo,\nNo me he podido olvidar de ti,\nAcepto tu amistad por conformismo."
 },
 {
  "autor": "HE",
  "titulo": "Carpe Diem",
  "fecha": "2026-09-09",
  "nuevo": false,
  "especial": false,
  "poema": "En latín Carpe Diem,\nDos palabras sencillas,\nMi definición similar también,\nNo menos de unas pesadillas.\n\nMi carpe diem es disfrutar,\nContigo cada momento pasar,\nEn modo ajeno a nosotros pensar,\nPor nuestra mente pasear.\n\nCarpe diem me hace valorar,\nTal vez no volveremos a tocar,\nMiedo de despertar sin escuchar,\nTemor de querer soltar.\n\nTener siempre el carpe diem,\nPor mí aplicada recién,\nSatisfacción de libertad,\nAtención a la actualidad."
 },
 {
  "autor": "HE",
  "titulo": "JL (Acróstico P/estrofa)",
  "fecha": "2026-09-29",
  "nuevo": false,
  "especial": true,
  "poema": "Jamás pensé que,\nFueses mi mejor amiga,\nPues nunca hablamos,\nHasta que conocí a tu amiga.\n\nAhora admiro tu ser,\nTu forma del mundo ver,\nIncluso lo bella que eres,\nComo si tuvieses poderes.\n\nRodea mi mente esta emoción,\nEs como de amor una canción,\nTomé una gran decisión,\nLa de meterte a mi corazón.\n\nIrónica mi apariencia de apatía,\nPues por ti la cambiaría,\nSi te recuestas como ese día,\nMi corazón no aguantaría.\n\nEs raro sentir todo esto,\nCon mi corazón dispuesto,\nEspero sientas lo que siento,\nYa tenemos un sentimiento.\n\nLo que pasa por mi mente,\nLa posibilidad de amarte,\nIncluso pienso en besarte,\nEstoy a punto de preguntarte."
 },
 {
  "autor": "HE",
  "titulo": "VOS SOS PELIGRO",
  "fecha": "2026-10-15",
  "nuevo": true,
  "especial": false,
  "poema": "Soñaste conmigo en un lóbrego lugar,\ncasi como si fuese un hogar.\nYo soñé contigo en otro lugar,\nuna alegre y amorosa familia.\n\nEsa casa en que soñabas vivir,\npero nunca se pudo cumplir,\ntal vez hice que lo vieses así,\nPerdón por no cumplir.\n\nNo fue un tal vez, realmente no\nestábamos hechos el tal para cual,\nseguramente fue solo una ilusión\nde tu soledad e imaginación.\n\nNo pensé que fueses a recordar,\nLos lugares que íbamos a visitar,\nContigo los quería explorar,\nPor siempre juntos estar.\n\nSiempre fuiste mi amor,\nincluso por ti sentí temor,\nDejarme era mi terror,\nPues por ti tenía ese ardor.\n\nSi tu mentalidad nunca iba cambiar,\nNi tu perspectiva se iba alterar,\nMi amor lo ibas a extrañar,\n¿Entonces por qué decidiste terminar?\n\nNo sé si realmente me quieres,\nO si es que me extrañes,\nFuiste el amor de mi vida,\nEse que en verdad nunca se olvida.\n\nAhora en verdad quisiera ser,\nComo hace dos años,\nDejar de ser dos extraños,\nUna vida juntos tener."
 },
 {
  "autor": "HE",
  "titulo": "Un Hasta Pronto, Jamás Un Adiós",
  "fecha": "2026-10-18",
  "nuevo": true,
  "especial": true,
  "poema": "Aunque una etapa termina,\nUna nueva se origina,\nTantos momentos juntos,\nSe dividen en diversos mundos.\n\nRecordaré cada plática,\nEn todo momento cada risa,\nNuestros abrazos en cinemática,\nLos ratos que parecían con prisa.\n\nTe agradezco esa oportunidad,\nDejarme ser tu amigo especial,\nQue convertía días comunes,\nEn recuerdos inlovidables.\n\nNunca olvidar lo que pasamos,\nUn cuadro los dos pintamos,\nTodos aquellos recuerdos,\nEn mi corazón quedan guardados.\n\nEstamos en caminos diferentes,\nDejan cumplir nuestra promesa,\nSer mejores amigos por siempre,\nPorque para mí eres importante.\n\nOjalá en el futuro nos veamos,\nTal vez en unos cunatos años,\nEso es porque nos amamos,\nIncluso nos separemos.\n\nEn dos años cambió el horizonte,\nCuando supe que lo cuando lo vea,\nTe recuerde y te lea en el sureste,\nIncluso cuando nunca más te vea.\n\nTengo un lugar en tu corazón,\nAsí como tú en el mío,\nY una vida sin ti, sin razón,\nEn mi mundo habría un mal frío.\n\nParece ayer a conocernos empezamos,\nHoy una gran amistad somos,\nSolo sin darnos cuenta la hicimos,\nAsí nunca olvidar nuestros recuerdos.\n\nEscrita por el \"amor de mi vida\",\nCuando nadie nos lo impida.\n\nTítulo hecho con IA"
 },
 {
  "autor": "HE",
  "titulo": "Año Especial",
  "fecha": "2025-03-07",
  "nuevo": false,
  "especial": false,
  "poema": "Tengo fe, que en Enero,\nRecibiré lo que quiero,\nMucho dinero, pero,\nTu amor es lo que más quiero.\n\nQuiero que sea Febrero,\nPara darte lo que quiero,\nMucho, mucho amor,\nEn especial todo tu valor.\n\nYa quiero, Marzo,\nPara regalarte flores,\nY huelas sus olores,\nMientras mi amor te esparzo.\n\nEspero más Abril,\nPor el día del beso,\nY me llenes de besos,\nComo yo a ti de versos.\n\nEn el mes de Mayo,\nMejor yo ensayo,\nPara conocer a tu mamá,\nPor el día de la mamá.\n\nEn el mes de junio,\nTe quiero encontrar.\nPor el viernes trece,\nUn regalo te quiero dar.\n\nYa quiero que sea Julio,\nPorque aún queda el vestigio,\nDe nuestra antigua amistad,\nY cuando yo te dije la verdad.\n\nQue hermoso Agosto,\nNo tener ningún costo,\nDe inseguridades,\nNi infidelidades.\n\nSeptiembre llega siempre fresco,\nEl otoño empieza a dar su paso,\nAsí como yo te ofrezco,\nUn gran cálido y tierno abrazo.\n\nEspero siempre Octubre,\nDonde el frío nos descubre,\nMientras mi cuerpo te cubre,\nNo quiero que mi rostro se rubre.\n\nFinalmente en Diciembre,\nQuiero a la vida agradecerle,\nPor juntar nuestros nombres,\nY un mejor año con vos pedirle."
 }
];

// id (data-poema) -> { suma, votos }
const CALIFICACIONES = {
 "amistad-en-redes-he": {
  "suma": 25,
  "votos": 6
 },
 "ano-especial-he": {
  "suma": 16,
  "votos": 4
 },
 "bella-rosa-he": {
  "suma": 20,
  "votos": 4
 },
 "bosque-irreal-he": {
  "suma": 20,
  "votos": 4
 },
 "carpe-diem-he": {
  "suma": 20,
  "votos": 4
 },
 "el-amor-he": {
  "suma": 19,
  "votos": 4
 },
 "el-chico-desamparado-he": {
  "suma": 20,
  "votos": 4
 },
 "facil-pero-dificil-he": {
  "suma": 20,
  "votos": 4
 },
 "jl-acrostico-pestrofa-he": {
  "suma": 20,
  "votos": 4
 },
 "la-cancion-he": {
  "suma": 19,
  "votos": 4
 },
 "la-poesia-he": {
  "suma": 20,
  "votos": 4
 },
 "marchita-he": {
  "suma": 19,
  "votos": 4
 },
 "mariana-acrostico-pverso-he": {
  "suma": 20,
  "votos": 4
 },
 "melodia-de-flor-de-primavera-he": {
  "suma": 20,
  "votos": 4
 },
 "paradojica-he": {
  "suma": 20,
  "votos": 4
 },
 "quisiera-he": {
  "suma": 20,
  "votos": 4
 },
 "sueno-con-vos-he": {
  "suma": 20,
  "votos": 4
 },
 "superar-he": {
  "suma": 20,
  "votos": 4
 },
 "tus-ojos-he": {
  "suma": 20,
  "votos": 4
 },
 "sin-titulo-he": {
  "suma": 20,
  "votos": 4
 },
 "ya-fue-he": {
  "suma": 20,
  "votos": 4
 },
 "un-hasta-pronto-jamas-un-adios-he": {
  "suma": 8,
  "votos": 2
 }
};

const clave = (p) => `${p.autor}|${p.fecha}|${p.titulo}`;

const caja = document.createElement("div");
caja.hidden = true;
caja.style.cssText = "margin-top:1.5rem;text-align:center;font-family:sans-serif";
const boton = document.createElement("button");
boton.type = "button";
boton.textContent = `Publicar todo (${POEMAS.length} poemas y ${Object.keys(CALIFICACIONES).length} calificaciones)`;
const aviso = document.createElement("p");
caja.append(boton, aviso);
(document.querySelector("main") || document.body).append(caja);

boton.addEventListener("click", async () => {
    boton.disabled = true;
    try {
        aviso.textContent = "Revisando lo que ya existe...";
        const existentes = new Set((await getDocs(collection(db, "poemas-publicados"))).docs.map((d) => clave(d.data())));

        let poemasNuevos = 0, poemasOmitidos = 0;
        for (const p of POEMAS) {
            if (existentes.has(clave(p))) { poemasOmitidos++; continue; }
            await addDoc(collection(db, "poemas-publicados"), {
                titulo: p.titulo,
                fecha: p.fecha,
                nuevo: p.nuevo,
                especial: p.especial,
                autor: p.autor,
                poema: p.poema
            });
            poemasNuevos++;
            aviso.textContent = `Subiendo poemas... ${poemasNuevos + poemasOmitidos} de ${POEMAS.length}`;
        }

        let califNuevas = 0, califOmitidas = 0;
        for (const [id, datos] of Object.entries(CALIFICACIONES)) {
            const ref = doc(db, "poemas", id);
            if ((await getDoc(ref)).exists()) { califOmitidas++; continue; }
            await setDoc(ref, datos);
            califNuevas++;
            aviso.textContent = `Subiendo calificaciones... ${califNuevas + califOmitidas} de ${Object.keys(CALIFICACIONES).length}`;
        }

        aviso.textContent = `Listo: ${poemasNuevos} poemas y ${califNuevas} calificaciones subidos (${poemasOmitidos} poemas y ${califOmitidas} calificaciones ya existían).`;
    } catch (e) {
        console.error(e);
        aviso.textContent = "Falló la publicación: " + (e.code || e.message);
        boton.disabled = false;
    }
});

onAuthStateChanged(auth, (user) => { caja.hidden = !(user && user.emailVerified); });
