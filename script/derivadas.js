// Cargar Pyodide y SymPy
let pyodideReadyPromise = loadPyodide();

async function cargarSymPy() {
    const pyodide = await pyodideReadyPromise;
    await pyodide.loadPackage("sympy");
    return pyodide;
}

// Resolver derivada parcial con validación
async function resolverConValidacion() {
    let input = document.getElementById('math-input').value.trim();

    // Reemplazar "^" por "**" para compatibilidad con SymPy
    input = input.replace(/\^/g, '**');

    // Insertar automáticamente "*" entre número y variable (ej. 3x -> 3*x)
    input = input.replace(/(\d)([a-zA-Z])/g, '$1*$2');
    
    // Insertar automáticamente "*" entre cierre de paréntesis y variable o número (ej. (x+1)3 -> (x+1)*3)
    input = input.replace(/(\))(\d|[a-zA-Z])/g, '$1*$2');

    // Limpiar el resultado y ocultar errores antes de procesar
    limpiarResultado();
    ocultarError();
    ocultarBotonesCompartir(); 

    if (!input) {
        mostrarError('Por favor, ingresa una función válida.');
        return;
    }

    mostrarLoader();

    const pyodide = await cargarSymPy();

    try {
        let result;
        let pasos = []; 

        // Resolver derivada parcial
        result = await pyodide.runPythonAsync(`
            from sympy import symbols, diff, latex
            import json

            x, y = symbols('x y')
            input_expr = ${input}
            derivada_parcial_x = diff(input_expr, x)
            derivada_parcial_y = diff(input_expr, y)
            
            pasos_derivacion = [
                {
                    "paso": f"Función original: {latex(input_expr)}",
                    "explicacion": "Esta es la función original que vamos a derivar."
                },
                {
                    "paso": f"Derivada parcial respecto a x: {latex(derivada_parcial_x)}",
                    "explicacion": "Calculamos la derivada parcial de la función respecto a x."
                },
                {
                    "paso": f"Derivada parcial respecto a y: {latex(derivada_parcial_y)}",
                    "explicacion": "Calculamos la derivada parcial de la función respecto a y."
                }
            ]

            result = {
                'latex_result_x': latex(derivada_parcial_x),
                'latex_result_y': latex(derivada_parcial_y),
                'pasos': pasos_derivacion
            }
            
            json.dumps(result)
        `);

        const pythonResult = JSON.parse(result);
        const resultX = pythonResult.latex_result_x;
        const resultY = pythonResult.latex_result_y;
        pasos = pythonResult.pasos;

        console.log("Resultado de la derivada parcial respecto a x:", resultX);
        console.log("Resultado de la derivada parcial respecto a y:", resultY);
        console.log("Pasos de la derivación:", pasos);

        if (Array.isArray(pasos)) {
            mostrarPasosDerivacion(pasos);
        } else {
            console.log("Pasos no es una lista. Tipo recibido:", typeof pasos);
        }

        const outputElement = document.getElementById('math-output');

        // Renderizar el resultado de la derivada parcial en el campo de resultado
        katex.render(`\\frac{\\partial}{\\partial x} \\left(${input}\\right) = ${resultX}`, outputElement, {
            throwOnError: false
        });
        katex.render(`\\frac{\\partial}{\\partial y} \\left(${input}\\right) = ${resultY}`, outputElement, {
            throwOnError: false
        });

        guardarEnHistorial(input, resultX, resultY);
        mostrarBotonesCompartir();
        ocultarLoader();

    } catch (error) {
        mostrarError("Error en el cálculo de la derivada.");
        ocultarBotonesCompartir();
        ocultarLoader();
        console.error("Error al calcular la derivada:", error);
    }
}

function mostrarPasosDerivacion(pasos) {
    const pasosContainer = document.getElementById('pasos-output');
    pasosContainer.innerHTML = '';  // Limpiar los pasos previos

    pasos.forEach((paso, index) => {
        const pasoElement = document.createElement('div');
        pasoElement.className = 'paso-derivacion mb-3';  // Aplicar clase CSS
        
        // Crear el encabezado del paso
        const pasoHeader = document.createElement('h5');
        pasoHeader.textContent = `Paso ${index + 1}`;  // Dinámico
        pasoElement.appendChild(pasoHeader);
        
        // Crear el contenedor para la expresión matemática
        const mathContainer = document.createElement('div');
        mathContainer.className = 'math-container';
        katex.render(paso.paso, mathContainer, {
            throwOnError: false,
            displayMode: true
        });
        pasoElement.appendChild(mathContainer);
        
        // Crear el párrafo para la explicación
        const explicacionParrafo = document.createElement('p');
        explicacionParrafo.className = 'explicacion mt-2';
        explicacionParrafo.textContent = paso.explicacion;  // Agregar explicación
        pasoElement.appendChild(explicacionParrafo);
        
        // Añadir el paso al contenedor de pasos
        pasosContainer.appendChild(pasoElement);
    });
}

// Mostrar errores
function mostrarError(mensaje) {
    const alertaError = document.getElementById('alerta-error');
    alertaError.textContent = mensaje;
    alertaError.classList.remove('d-none');
}

// Ocultar errores
function ocultarError() {
    const alertaError = document.getElementById('alerta-error');
    alertaError.classList.add('d-none');
}

// Limpiar el resultado
function limpiarResultado() {
    const outputElement = document.getElementById('math-output');
    if (outputElement) {
        outputElement.textContent = 'Aquí se verá la derivada resuelta.';
    }
    ocultarBotonesCompartir();
}

// Función para agregar símbolos al campo de entrada
function agregarSimbolo(simbolo) {
    const input = document.getElementById('math-input');
    
    // Reemplazar notaciones de funciones con su equivalente en SymPy
    const funcionesKaTeX = {
        'ln': 'log', // Logaritmo natural en SymPy
        'log': 'log', // Logaritmo base 10, en SymPy es el mismo comando
        'exp': 'exp', // Exponencial e^x
        'sin': 'sin',
        'cos': 'cos',
        'tan': 'tan',
        'sqrt': 'sqrt'
    };

    // Verificar si el símbolo agregado necesita ser cambiado a una función de SymPy
    if (funcionesKaTeX[simbolo]) {
        input.value += funcionesKaTeX[simbolo];
    } else {
        input.value += simbolo;
    }

    limpiarResultado();
    renderMathInput();  // Renderizar el input actualizado
}

// Función para renderizar el campo de entrada
function renderMathInput() {
    const input = document.getElementById('math-input').value;
    const render = document.getElementById('math-render');
    
    // Renderiza la fórmula en el campo de entrada usando KaTeX
    if (render) {
        katex.render(input, render, {
            throwOnError: false
        });
    }
}

// Función para eliminar el último carácter
function eliminarUltimo() {
    const input = document.getElementById('math-input');
    input.value = input.value.slice(0, -1);
    limpiarResultado();
    ocultarError();
    renderMathInput();
}

// Función para eliminar todo el contenido
function eliminarTodo() {
    const input = document.getElementById('math-input');
    input.value = '';
    limpiarResultado();
    ocultarError();
    renderMathInput();
}

function mostrarLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.remove('d-none');  // Mostrar el loader
    }
}

function ocultarLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('d-none');  // Ocultar el loader
    }
}

function guardarEnHistorial(funcion, resultadoX, resultadoY) {
    let historial = JSON.parse(localStorage.getItem('historial')) || [];
    historial.push({ funcion, resultadoX, resultadoY });
    localStorage.setItem('historial', JSON.stringify(historial));
    actualizarHistorial();
}

// Función para actualizar y mostrar el historial
function actualizarHistorial() {
    const historialElement = document.getElementById('historial-output');
    let historial = JSON.parse(localStorage.getItem('historial')) || [];
    
    if (historial.length === 0) {
        historialElement.innerHTML = 'Aquí se verá el historial de cálculos.';
        return;
    }
    
    // Invertir el historial para que el más reciente esté al principio
    historial = historial.reverse();
    
    historialElement.innerHTML = historial.map(item => `
        <p>\\(${item.funcion}\\) = \\(\\frac{\\partial}{\\partial x} ${item.resultadoX}\\), \\(\\frac{\\partial}{\\partial y} ${item.resultadoY}\\)</p>
    `).join("");

    // Renderizar las expresiones en el historial
    renderMathInElement(historialElement, {
        delimiters: [
            { left: "\\(", right: "\\)", display: false }
        ]
    });
}

// Inicializar historial al cargar la página
document.addEventListener('DOMContentLoaded', actualizarHistorial);

document.getElementById('toggle-historial-btn').addEventListener('click', function() {
    const historialSection = document.getElementById('historial');
    const button = document.getElementById('toggle-historial-btn');
    
    // Alternar la visibilidad del historial
    if (historialSection.classList.contains('visible')) {
        historialSection.classList.remove('visible');
        button.textContent = 'Mostrar Historial';
    } else {
        historialSection.classList.add('visible');
        button.textContent = 'Ocultar Historial';
    }
});

// Función para mostrar los botones de compartir
function mostrarBotonesCompartir() {
    const shareButton = document.getElementById('share-button');
    if (shareButton) {
        shareButton.classList.remove('d-none'); 
    }
}

// Función para ocultar los botones de compartir
function ocultarBotonesCompartir() {
    const shareButtons = document.getElementById('share-button');
    if (shareButtons) {
        shareButtons.classList.add('d-none');  
    }
}

function togglePasos() {
    const pasosContainer = document.getElementById('pasos-container');
    const toggleBtn = document.getElementById('toggle-pasos-btn');
    
    if (pasosContainer.classList.contains('d-none')) {
        pasosContainer.classList.remove('d-none');
        toggleBtn.textContent = 'Ocultar Pasos';
    } else {
        pasosContainer.classList.add('d-none');
        toggleBtn.textContent = 'Mostrar Pasos';
    }
}