/* ============================================================
   FastFit · Datos de ejemplo
   ------------------------------------------------------------
   Reemplaza esto por tu API/backend cuando lo tengas.
   Cada profesional tiene:
     img:   ruta a su foto. Si el archivo no existe, la web
            muestra sus iniciales automáticamente (no rompe nada).
     video: link de YouTube o ruta a un archivo de video.
            Déjalo vacío ("") si no quieres mostrar video.
   ============================================================ */

const CATEGORIES = [
  { key: "Personal Trainers", role: "Personal Trainer" },
  { key: "Nutricionistas", role: "Nutricionista" },
  { key: "Fisioterapeutas", role: "Fisioterapeuta" },
  { key: "Chefs Privados", role: "Chef Privado" },
  { key: "Psicólogos Deportivos", role: "Psicólogo Deportivo" },
];

const DISTRICTS = ["San Borja", "Miraflores", "San Isidro", "Surco", "La Molina", "Barranco", "Jesús María", "Magdalena"];

const PROS = [
  { id: "bertha-ruiz", name: "Bertha Ruiz", cat: "Personal Trainers", rating: 4.9, reviews: 128, price: 80, zone: "San Borja",
    img: "images/bertha-ruiz.png", video: "",
    bio: "Entrenadora personal enfocada en fuerza y tonificación. Sesiones a domicilio, en gimnasio o al aire libre con planes adaptados a tu nivel.",
    services: ["Fuerza y tonificación", "Pérdida de grasa", "Entrenamiento funcional", "Plan de rutina mensual"] },
  { id: "macarena-salazar", name: "Macarena Salazar", cat: "Personal Trainers", rating: 4.9, reviews: 98, price: 85, zone: "Miraflores",
    img: "images/macarena-salazar.png", video: "",
    bio: "Especialista en movilidad, pilates y entrenamiento de bajo impacto. Acompañamiento constante para que mantengas tus hábitos.",
    services: ["Pilates", "Movilidad y flexibilidad", "Bajo impacto", "Entrenamiento en pareja"] },
  { id: "valeria-torres", name: "Valeria Torres", cat: "Personal Trainers", rating: 4.3, reviews: 87, price: 60, zone: "Surco",
    img: "images/valeria-torres.png", video: "",
    bio: "Entrenamiento para principiantes y retorno a la actividad física. Rutinas simples, progresivas y sin complicaciones.",
    services: ["Principiantes", "Cardio", "Rutinas en casa", "Seguimiento semanal"] },
  { id: "andrea-paredes", name: "Andrea Paredes", cat: "Nutricionistas", rating: 4.8, reviews: 74, price: 90, zone: "San Isidro",
    img: "images/andrea-paredes.png", video: "",
    bio: "Nutricionista clínica y deportiva. Planes alimenticios personalizados con seguimiento quincenal.",
    services: ["Plan alimenticio", "Nutrición deportiva", "Control de peso", "Lista de compras"] },
  { id: "luis-cardenas", name: "Luis Cárdenas", cat: "Nutricionistas", rating: 4.6, reviews: 52, price: 75, zone: "La Molina",
    img: "images/luis-cardenas.png", video: "",
    bio: "Enfoque en reeducación alimentaria y ganancia de masa muscular sin dietas extremas.",
    services: ["Reeducación alimentaria", "Ganancia muscular", "Consulta online"] },
  { id: "carlos-mendoza", name: "Carlos Mendoza", cat: "Fisioterapeutas", rating: 4.9, reviews: 110, price: 110, zone: "San Borja",
    img: "images/carlos-mendoza.png", video: "",
    bio: "Fisioterapeuta deportivo. Rehabilitación de lesiones, prevención y terapia manual.",
    services: ["Rehabilitación", "Terapia manual", "Prevención de lesiones", "Punción seca"] },
  { id: "diana-quispe", name: "Diana Quispe", cat: "Fisioterapeutas", rating: 4.5, reviews: 63, price: 95, zone: "Jesús María",
    img: "images/diana-quispe.png", video: "",
    bio: "Recuperación postoperatoria y tratamiento de dolor lumbar y cervical.",
    services: ["Dolor lumbar", "Postoperatorio", "Ejercicio terapéutico"] },
  { id: "rodrigo-vega", name: "Rodrigo Vega", cat: "Chefs Privados", rating: 4.8, reviews: 41, price: 150, zone: "Barranco",
    img: "images/rodrigo-vega.png", video: "",
    bio: "Chef privado para meal prep semanal y cenas saludables en tu casa.",
    services: ["Meal prep semanal", "Cenas privadas", "Menús fit", "Clases de cocina"] },
  { id: "sofia-lazo", name: "Sofía Lazo", cat: "Chefs Privados", rating: 4.7, reviews: 36, price: 130, zone: "Magdalena",
    img: "images/sofia-lazo.png", video: "",
    bio: "Cocina saludable y peruana ligera. Menús adaptados a tus objetivos y restricciones.",
    services: ["Cocina saludable", "Menús personalizados", "Eventos pequeños"] },
  { id: "martin-rios", name: "Martín Ríos", cat: "Psicólogos Deportivos", rating: 4.9, reviews: 58, price: 100, zone: "Miraflores",
    img: "images/martin-rios.png", video: "",
    bio: "Psicología del rendimiento: motivación, manejo de la presión y constancia en el entrenamiento.",
    services: ["Motivación", "Manejo de ansiedad competitiva", "Hábitos y constancia"] },
  { id: "paola-nunez", name: "Paola Núñez", cat: "Psicólogos Deportivos", rating: 4.6, reviews: 33, price: 90, zone: "San Isidro",
    img: "images/paola-nunez.png", video: "",
    bio: "Acompañamiento a deportistas amateurs y profesionales en objetivos y equilibrio mental.",
    services: ["Establecimiento de metas", "Mindfulness deportivo", "Sesiones online"] },
];

const REVIEWS = [
  { who: "Camila R.", text: "Puntual, profesional y muy atenta a mis objetivos. 100% recomendada." },
  { who: "Jorge P.", text: "Las sesiones son dinámicas y notas el progreso desde la segunda semana." },
  { who: "Lucía M.", text: "Muy buena comunicación y flexibilidad con los horarios." },
];
