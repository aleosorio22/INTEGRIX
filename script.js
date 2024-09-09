// Cargar Pyodide y SymPy
let pyodideReadyPromise = loadPyodide();

async function cargarSymPy() {
    const pyodide = await pyodideReadyPromise;
    await pyodide.loadPackage("sympy");
    return pyodide;
}

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

    if (!input) {
        mostrarError('Por favor, ingresa una función válida.');
        return;
    }

    const pyodide = await cargarSymPy();

    try {
        let result;
        let limiteInf = '';
        let limiteSup = '';

        if (tipo === 'indefinida' || tipo === 'por-partes' || tipo === 'sustitucion' || tipo === 'trigonometrica') {
            // Resolver integral indefinida (no necesita límites)
            result = await pyodide.runPythonAsync(`
                from sympy import symbols, integrate, sin, cos, tan, exp, log, sqrt, oo, pi, latex
                x = symbols('x')
                integral_result = integrate(${input}, x)
                latex(integral_result) if integral_result else 'None'
            `);
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
                from sympy import symbols, integrate, sin, cos, tan, exp, log, sqrt, oo, pi, latex
                x = symbols('x')
                integral_result = integrate(${input}, (x, ${limiteInf}, ${limiteSup}))
                latex(integral_result) if integral_result else 'None'
            `);
        }

        if (result === 'None') {
            mostrarError("La integral no tiene una solución computable.");
            return;
        }

        const outputElement = document.getElementById('math-output');
        const renderOutput = document.getElementById('render-output');

        // Si es definida o impropia, incluir los límites en la renderización
        if (tipo === 'definida' || tipo === 'impropia') {
            // Mostrar el resultado en el campo original
            katex.render(`\\int_{${limiteInf}}^{${limiteSup}} \\left(${input}\\right) \\, dx = ${result}`, outputElement, {
                throwOnError: false
            });
            
            // Renderizar el resultado de nuevo en la sección de "Resultado Renderizado"
            katex.render(result, renderOutput, {
                throwOnError: false
            });
        } else {
            // Si es indefinida, no mostrar límites
            katex.render(`\\int \\left(${input}\\right) \\, dx = ${result}`, outputElement, {
                throwOnError: false
            });
            
            // Renderizar el resultado de nuevo en la sección de "Resultado Renderizado"
            katex.render(result, renderOutput, {
                throwOnError: false
            });
        }

    } catch (error) {
        mostrarError("Error en el cálculo de la integral.");
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
    renderMathInput();
}

// Función para eliminar todo el contenido
function eliminarTodo() {
    const input = document.getElementById('math-input');
    input.value = '';
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

// Llama a esta función cuando el usuario cambie el tipo de integral
document.getElementById('tipo-integral').addEventListener('change', mostrarOcultarLimites);

// Actualizar la visibilidad de los límites según el tipo de integral
function actualizarLimites() {
    const tipo = document.getElementById('tipo-integral').value;
    const limites = document.getElementById('limites');

    if (tipo === 'indefinida') {
        limites.style.display = 'none';
    } else {
        limites.style.display = 'block';
    }
}
