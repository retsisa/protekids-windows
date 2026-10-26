// Datos de los cuentos. Cada página lleva su texto visible y la ruta de su audio.
// RECURSO PROPIO: graba cada página y guarda el .mp3 con el nombre indicado en "audio"
// (carpeta www/assets/audio/cuentos/). Si el archivo no existe, el lector sigue mostrando el texto
// y lee la página con la voz del teléfono.
// Para cambiar un texto o un audio, edita aquí. "audio: null" = solo voz del teléfono.
(function () {
  "use strict";
  var A = "assets/audio/cuentos/";
  var PK = (window.PK = window.PK || {});
  PK.STORIES = [
    {
      id: "la-mochila-de-los-secretos",
      title: "La mochila de los secretos",
      description: "Sorpresas que alegran y secretos que preocupan.",
      pages: [
        { title: "La mochila nueva", audio: A + "mochila_p01.mp3",
          text: "Mateo estrenó una mochila azul con muchos bolsillos. Su abuela le dijo: «Cada bolsillo guarda algo especial».\n¿Y puedo guardar mis sentimientos? preguntó Mateo, riendo.\nLa abuela le guiñó un ojo: «Los sentimientos pesan menos cuando se comparten con alguien que te quiere»." },
        { title: "Una sorpresa para mamá", audio: A + "mochila_p02.mp3",
          text: "Mateo y su hermana Sofía hicieron una tarjeta para el cumpleaños de mamá.\n«¡Es una sorpresa!», susurró Sofía.\nA Mateo le cosquilleaba la barriga de alegría. Al día siguiente, mamá abrió la tarjeta y sonrió muchísimo. Las sorpresas bonitas se guardan poquito tiempo y después hacen felices a todos." },
        { title: "Algo se siente raro", audio: A + "mochila_p03.mp3",
          text: "En el recreo, un chico mayor propuso a Mateo un juego que a Mateo no le gustó.\n«Es nuestro secreto, no se lo cuentes a nadie», le dijo.\nMateo sintió un nudo en la barriga, como una piedrita pesada. «Esto no se siente como la sorpresa de mamá», pensó." },
        { title: "La gran diferencia", audio: A + "mochila_p04.mp3",
          text: "Mateo recordó a su abuela: «Las sorpresas alegran y pronto se cuentan. Un secreto que te preocupa o te da nudo en la barriga no tienes que guardarlo».\nMateo respiró hondo y dijo con voz firme: «No quiero jugar. No me gusta». Y se alejó caminando." },
        { title: "Contar es de valientes", audio: A + "mochila_p05.mp3",
          text: "Mateo buscó a su profesora. «Algo me hizo sentir incómodo», dijo bajito.\nLa profesora se agachó, lo miró a los ojos y lo escuchó sin interrumpirlo.\n«Gracias por contármelo, Mateo. Hiciste muy bien. Nada de esto es tu culpa, y yo te voy a ayudar»." },
        { title: "La mochila más ligera", audio: A + "mochila_p06.mp3",
          text: "Esa tarde, Mateo también se lo contó a mamá y a la abuela. Lo abrazaron fuerte, porque él quiso.\nSintió la mochila más ligera que nunca.\nMateo aprendió algo importante: si un adulto no lo escucha, puede buscar a otro. Siempre hay alguien que ayuda, y los secretos que preocupan se cuentan." }
      ]
    },
    {
      id: "lia-y-el-boton-del-no",
      title: "Lía y el botón del NO",
      description: "Mi cuerpo es mío y tengo derecho a decir «no».",
      pages: [
        { title: "Mi cuerpo es mío", audio: A + "lia_p01.mp3",
          text: "Frente al espejo, Lía movió las manos, los pies y la nariz.\n«Mi cuerpo es como mi casa», pensó. «Yo decido quién entra y cómo».\nSe rio con ganas. Sus manos servían para dibujar, sus piernas para correr y su corazón para sentir. Todo eso era suyo, solamente suyo." },
        { title: "El abrazo de la visita", audio: A + "lia_p02.mp3",
          text: "Llegó de visita una señora que quería darle un abrazo apretado. Lía se escondió detrás de mamá.\n«No tienes que abrazar si no quieres», le susurró mamá. «Puedes saludar con la mano o con una sonrisa».\nLía sonrió y movió la mano. ¡Se sintió muy tranquila!" },
        { title: "Un botón invisible", audio: A + "lia_p03.mp3",
          text: "Mamá le contó un secreto: «Todos tenemos un botón del NO en el corazón. Se aprieta cuando algo no nos gusta».\nLía lo practicó jugando: «¡NO!», dijo fuerte. «¡Basta!», dijo más fuerte.\nMamá aplaudió. Aunque la voz tiemble un poquito, el NO vale igual." },
        { title: "Las cosquillas que no", audio: A + "lia_p04.mp3",
          text: "Jugando con su primo, él empezó a hacerle cosquillas. Al principio era divertido, pero luego a Lía ya no le gustó.\n«¡Para, por favor!», dijo ella, apretando su botón.\nSu primo paró enseguida. «Perdón», dijo. Cuando alguien respeta tu NO, el juego puede seguir bonito." },
        { title: "Cuando no paran", audio: A + "lia_p05.mp3",
          text: "Otro día, un chico del barrio no dejaba de molestarla, aunque ella dijo NO varias veces.\nLía sintió calor en las mejillas. Recordó su botón y gritó: «¡NO!».\nLuego se alejó, porque alejarse también es una buena idea, y corrió a buscar a papá." },
        { title: "Papá escucha", audio: A + "lia_p06.mp3",
          text: "Papá se arrodilló para escucharla. «Hiciste todo bien, Lía. Estoy orgulloso de ti. Voy a ayudarte».\nLía respiró tranquila. Sabía que podía contarle cualquier cosa.\nDesde entonces, cada vez que algo no le gusta, Lía aprieta su botón invisible, se aleja si puede y se lo cuenta a un adulto de confianza." }
      ]
    },
    {
      id: "el-mapa-de-emociones-de-tomi",
      title: "El mapa de emociones de Tomi",
      description: "Poner nombre a lo que siento y pedir ayuda.",
      pages: [
        { title: "Cuatro colores", audio: A + "tomi_p01.mp3",
          text: "Tomi tenía un mapa de emociones pegado en la pared. Tenía cuatro colores: amarillo para la alegría, azul para la tristeza, rojo para el enojo y gris para el aburrimiento.\n«Todas las emociones son bienvenidas», decía su mamá. «Ninguna es mala. Solo nos cuentan algo»." },
        { title: "Un día gris", audio: A + "tomi_p02.mp3",
          text: "Una mañana, Tomi se despertó con la barriga apretada y ganas de quedarse callado.\nMiró su mapa, pero no encontró su color.\n«¿Qué me pasa?», se preguntó. Entonces comprendió algo: si logra ponerle nombre a lo que siente, será más fácil pedir ayuda a alguien." },
        { title: "Ponerle nombre", audio: A + "tomi_p03.mp3",
          text: "Tomi cerró los ojos y pensó en el recreo. Alguien le había pedido algo que a él no le gustó, y se había sentido pequeñito y preocupado.\n«Esto es preocupación», dijo, y la pintó de morado en su mapa.\nAl nombrarla, se sintió un poquito más valiente." },
        { title: "Nadie tenía tiempo", audio: A + "tomi_p04.mp3",
          text: "Tomi fue a contarle a su tío, pero su tío estaba ocupado con el teléfono. «Después, Tomi», le dijo.\nTomi se sintió triste y pensó en quedarse callado.\nPero recordó una regla de su mamá: «Si alguien no te escucha, no te rindas. Busca a otra persona de confianza»." },
        { title: "Otra puerta", audio: A + "tomi_p05.mp3",
          text: "Tomi caminó hasta la cocina, donde estaba mamá. «Tengo algo que contarte», dijo despacito.\nMamá apagó el horno, se sentó a su lado y lo miró con mucha atención.\n«Cuéntame todo lo que quieras, Tomi. Aquí estoy». Y Tomi empezó a hablar, palabra por palabra." },
        { title: "Un color nuevo", audio: A + "tomi_p06.mp3",
          text: "Al terminar, mamá lo abrazó. «Gracias por confiar en mí. Nada de esto es tu culpa. Vamos a resolverlo juntos».\nTomi sintió que la barriga se aflojaba.\nEsa noche agregó un color nuevo al mapa: verde, el color del alivio. ¡Contar siempre ayuda!" }
      ]
    },
    // ---- Cuentos anteriores (se conservan; sin audio grabado: se leen con la voz del teléfono) ----
    /*{
      id: "mi-cuerpo-es-mio",
      title: "Mi cuerpo es mío",
      description: "Luna y su cuerpo especial.",
      pages: [
        { title: "Parte 1", audio: null, text: "Luna tiene un cuerpo muy especial. Tiene manitas, piernas, cabeza y un corazón grande." },
        { title: "Parte 2", audio: null, text: "Luna sabe que su cuerpo es suyo. Nadie puede tocarla si ella no quiere." },
        { title: "Parte 3", audio: null, text: "Un día, alguien quiso tocarla y ella dijo: ¡NO! y se alejó rápidamente." },
        { title: "Parte 4", audio: null, text: "Luna corrió a contarle a su mamá. Su mamá la abrazó y le dijo: ¡Qué valiente eres!" }
      ]
    },
    {
      id: "mis-personas-de-confianza",
      title: "Mis personas de confianza",
      description: "Tomás y los adultos que lo cuidan.",
      pages: [
        { title: "Parte 1", audio: null, text: "Tomás tiene personas que lo cuidan: mamá, papá, su abuela y su profesora." },
        { title: "Parte 2", audio: null, text: "Si algo lo hace sentir triste, asustado o incómodo, Tomás se lo cuenta a alguien de confianza." },
        { title: "Parte 3", audio: null, text: "Tomás sabe que contar no es chismear. Contar es cuidarse." },
        { title: "Parte 4", audio: null, text: "Y siempre hay alguien que lo escucha con mucho cariño." }
      ]
    },
    {
      id: "el-semaforo-del-cuerpo",
      title: "El semáforo del cuerpo",
      description: "Verde, amarillo y rojo para cuidarme.",
      pages: [
        { title: "Parte 1", audio: null, text: "Verde: un abrazo de mamá o un saludo de manos. Se puede si tú quieres y te sientes bien." },
        { title: "Parte 2", audio: null, text: "Amarillo: si alguien necesita tocar una zona, como el doctor, debe avisarte y debe estar un adulto de confianza." },
        { title: "Parte 3", audio: null, text: "Rojo: las partes privadas son solo tuyas. Nadie debe tocarlas ni verlas." },
        { title: "Parte 4", audio: null, text: "Si alguien lo intenta, di NO fuerte, aléjate y cuéntaselo a tu adulto de confianza." }
      ]
    }*/
  ];
})();
