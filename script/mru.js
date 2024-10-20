// Lógica para el cálculo de MRU y la visualización de gráficas

// Referencias a elementos del DOM
const velocidadInput = document.getElementById('velocidad');
const tiempoInicialInput = document.getElementById('tiempo-inicial');
const tiempoFinalInput = document.getElementById('tiempo-final');
const resultadoOutput = document.getElementById('resultado-output');
const calcularButton = document.getElementById('calcular');

// Gráficas
let graficaVelocidad;
let graficaDesplazamiento;

// Función para inicializar las gráficas
function inicializarGraficas() {
    const ctxVelocidad = document.getElementById('grafica-velocidad').getContext('2d');
    const ctxDesplazamiento = document.getElementById('grafica-desplazamiento').getContext('2d');

    // Gráfica de Velocidad
    graficaVelocidad = new Chart(ctxVelocidad, {
        type: 'line',
        data: {
            labels: [], // Se llenará dinámicamente
            datasets: [{
                label: 'Velocidad v(t)',
                data: [],
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Tiempo (t)' } },
                y: { title: { display: true, text: 'Velocidad (v)' } }
            }
        }
    });

    // Gráfica de Desplazamiento (Integración de la Velocidad)
    graficaDesplazamiento = new Chart(ctxDesplazamiento, {
        type: 'line',
        data: {
            labels: [], // Se llenará dinámicamente
            datasets: [{
                label: 'Desplazamiento x(t)',
                data: [],
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 2,
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Tiempo (t)' } },
                y: { title: { display: true, text: 'Posición (x)' } }
            }
        }
    });
}

// Función para calcular el desplazamiento
function calcularDesplazamiento() {
    const velocidad = velocidadInput.value;
    const tiempoInicial = parseFloat(tiempoInicialInput.value);
    const tiempoFinal = parseFloat(tiempoFinalInput.value);

    // Validación básica
    if (!velocidad || isNaN(tiempoInicial) || isNaN(tiempoFinal)) {
        resultadoOutput.textContent = 'Por favor, ingrese una función de velocidad y tiempos válidos.';
        return;
    }

    // Convertir la función de velocidad a una función evaluable
    let desplazamiento = 0;
    let puntosVelocidad = [];
    let puntosPosicion = [];

    for (let t = tiempoInicial; t <= tiempoFinal; t += 0.1) {
        const velocidadEvaluada = eval(velocidad.replace(/t/g, t)); // Evaluar la velocidad
        desplazamiento += velocidadEvaluada * 0.1; // Calcular el desplazamiento
        puntosVelocidad.push({ x: t, y: velocidadEvaluada });
        puntosPosicion.push({ x: t, y: desplazamiento });
    }

    // Mostrar el resultado
    resultadoOutput.textContent = `Desplazamiento total: ${desplazamiento.toFixed(2)} unidades`;

    // Actualizar las gráficas
    actualizarGrafica(graficaVelocidad, puntosVelocidad);
    actualizarGrafica(graficaDesplazamiento, puntosPosicion);
}

// Función para actualizar la gráfica
function actualizarGrafica(grafica, puntos) {
    grafica.data.labels = puntos.map(punto => punto.x);
    grafica.data.datasets[0].data = puntos.map(punto => punto.y);
    grafica.update();
}

// Inicializar todo al cargar la página
window.onload = () => {
    inicializarGraficas();
};

// Evento de clic en el botón calcular
calcularButton.addEventListener('click', calcularDesplazamiento);
