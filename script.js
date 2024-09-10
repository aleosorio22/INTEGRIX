// Cargar Pyodide y SymPy
let pyodideReadyPromise = loadPyodide();

async function cargarSymPy() {
    const pyodide = await pyodideReadyPromise;
    await pyodide.loadPackage("sympy");
    return pyodide;
}

let resultadoNumerico = null;

// Resolver integral con validación
async function resolverConValidacion() {
    const tipo = document.getElementById('tipo-integral').value;
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
        let limiteInf = '';
        let limiteSup = '';
        let integralStr = '';

        if (tipo === 'indefinida' || tipo === 'por-partes' || tipo === 'sustitucion' || tipo === 'trigonometrica') {
            // Resolver integral indefinida (no necesita límites)
            result = await pyodide.runPythonAsync(`
                from sympy import symbols, integrate, sin, cos, tan, exp, log, sqrt, oo, pi, latex
                x = symbols('x')
                integral_result = integrate(${input}, x)
                latex(integral_result) if integral_result else 'None'
            `);
            integralStr = `\\int \\left(${input}\\right) \\, dx`;
            
        
        } else if (tipo === 'definida' || tipo === 'impropia') {
            // Obtener límites solo si son necesarios
            limiteInf = document.getElementById('limite-inf').value.trim();
            limiteSup = document.getElementById('limite-sup').value.trim();

            // Reemplazar E o e por exp(1)
            limiteInf = limiteInf.replace(/E|e/g, 'exp(1)');
            limiteSup = limiteSup.replace(/E|e/g, 'exp(1)');

            const selectInf = document.getElementById('infinito-inf').value;
            const selectSup = document.getElementById('infinito-sup').value;

            if (selectInf === 'infinito') {
                limiteInf = 'oo';
            }
            if (selectSup === 'infinito') {
                limiteSup = 'oo';
            }

            // Resolver integral definida o impropia
            result = await pyodide.runPythonAsync(`
                from sympy import symbols, integrate, N, sin, cos, tan, exp, log, sqrt, oo, pi, latex
                x = symbols('x')
                integral_result = integrate(${input}, (x, ${limiteInf}, ${limiteSup}))
                latex_result = latex(integral_result)
                numeric_result = N(integral_result)
                latex_result + "," + str(numeric_result)  # Retornar ambos resultados
            `);

            const [latexResult, numericResult] = result.split(",");  // Separar latex y valor numérico

            integralStr = `\\int_{${limiteInf}}^{${limiteSup}} \\left(${input}\\right) \\, dx`;
            resultadoNumerico = numericResult.trim();  // Guardar el valor numérico
        }

        if (result === 'None') {
            mostrarError("La integral no tiene una solución computable.");
            ocultarBotonesCompartir();
            ocultarLoader();
            return;

        }

        const outputElement = document.getElementById('math-output');

        // Renderizar el resultado de la integral en el campo de resultado
        katex.render(`${integralStr} = ${result}`, outputElement, {
            throwOnError: false
        });

        guardarEnHistorial(integralStr, result);
        mostrarBotonesCompartir();
        ocultarLoader();

    } catch (error) {
        mostrarError("Error en el cálculo de la integral.");
        ocultarBotonesCompartir();
        ocultarLoader();
        console.error("Error al calcular la integral:", error);
    }
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
    outputElement.textContent = 'Aquí se verá la integral resuelta.';
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
    katex.render(input, render, {
        throwOnError: false
    });
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

// Función para desactivar el campo de entrada cuando se seleccione el infinito
function toggleInput(tipoLimite, campoId) {
    const selectElement = document.getElementById(`infinito-${tipoLimite}`);
    const inputElement = document.getElementById(campoId);
    
    if (selectElement.value === 'infinito') {
        inputElement.disabled = true; // Deshabilita el campo si se selecciona infinito
        inputElement.value = '∞'; // Opcional, para mostrar visualmente que es infinito
    } else {
        inputElement.disabled = false; // Habilita el campo si se selecciona número o expresión simbólica
        inputElement.value = ''; // Limpia el campo
    }
}

// Función para mostrar u ocultar los límites según el tipo de integral
function mostrarOcultarLimites() {
    const tipoIntegral = document.getElementById('tipo-integral').value;
    const limitesSection = document.getElementById('limites');
    
    if (tipoIntegral === 'definida' || tipoIntegral === 'impropia') {
        limitesSection.style.display = 'block';  // Muestra los límites
    } else {
        limitesSection.style.display = 'none';   // Oculta los límites
    }
}

function mostrarLoader() {
    const loader = document.getElementById('loader');
    loader.classList.remove('d-none');  // Mostrar el loader
}

function ocultarLoader() {
    const loader = document.getElementById('loader');
    loader.classList.add('d-none');  // Ocultar el loader
}


// Llama a esta función cuando el usuario cambie el tipo de integral
document.getElementById('tipo-integral').addEventListener('change', mostrarOcultarLimites);

function guardarEnHistorial(integral, resultado) {
    let historial = JSON.parse(localStorage.getItem('historial')) || [];
    historial.push({ integral, resultado });
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
        <p>\\(${item.integral}\\) = \\(${item.resultado}\\)</p>
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
    const graphicButton = document.getElementById('graphic-button')
    shareButton.classList.remove('d-none'); 
    graphicButton.classList.remove('d-none')
}

// Función para ocultar los botones de compartir
function ocultarBotonesCompartir() {
    const shareButtons = document.getElementById('share-button');
    const graphicButton = document.getElementById('graphic-button')
    shareButtons.classList.add('d-none');  
    graphicButton.classList.add('d-none')
}


function irAGrafica() {
    const tipo = document.getElementById('tipo-integral').value;
    const input = document.getElementById('math-input').value.trim();
    const limiteInf = document.getElementById('limite-inf').value.trim();
    const limiteSup = document.getElementById('limite-sup').value.trim();

   
    window.location.href = `grafica.html?tipo=${encodeURIComponent(tipo)}&input=${encodeURIComponent(input)}&limiteInf=${encodeURIComponent(limiteInf)}&limiteSup=${encodeURIComponent(limiteSup)}&resultado=${encodeURIComponent(resultadoNumerico)}`;
}
