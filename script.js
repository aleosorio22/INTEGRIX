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
        let pasos = []; 

        if (tipo === 'indefinida' || tipo === 'por-partes' || tipo === 'sustitucion' || tipo === 'trigonometrica') {
            // Resolver integral indefinida (no necesita límites)
            //codigo de pyton
            result = await pyodide.runPythonAsync(`
                from sympy import symbols, integrate, sin, cos, tan, exp, log, sqrt, oo, pi, latex, diff
                import json

                x = symbols('x')
                input_expr = ${input}
                integral_result = integrate(input_expr, x)
                
                pasos_integracion = [
                    {
                        "paso": f"Función a integrar: {latex(input_expr)}",
                        "explicacion": "Esta es la función original que vamos a integrar."
                    },
                    {
                        "paso": f"Identificación del tipo de integral: {latex(input_expr)}",
                        "explicacion": "Analizamos la estructura de la función para determinar el método de integración apropiado."
                    },
                    {
                        "paso": f"Descomposición de términos: {latex(input_expr.expand())}",
                        "explicacion": "Expandimos la expresión para identificar mejor sus componentes."
                    },
                    {
                        "paso": f"Aplicación de reglas básicas: \\\\int {latex(input_expr)} \\\\, dx",
                        "explicacion": "Aplicamos las reglas fundamentales de integración según la estructura de la función."
                    },
                    {
                        "paso": f"Desarrollo de la integral: {latex(integral_result)}",
                        "explicacion": "Realizamos los pasos algebraicos necesarios para encontrar la antiderivada."
                    },
                    {
                        "paso": f"Simplificación preliminar: {latex(integral_result.simplify())}",
                        "explicacion": "Simplificamos la expresión para una forma más manejable."
                    },
                    {
                        "paso": f"Verificación por derivación: {latex(diff(integral_result, x))}",
                        "explicacion": "Comprobamos que la derivada de nuestra antiderivada es igual a la función original."
                    },
                    {
                        "paso": f"Resultado final: {latex(integral_result)} + C",
                        "explicacion": "Añadimos la constante de integración C para representar todas las posibles antiderivadas."
                    }
                ]
                

                result = {
                    'latex_result': latex(integral_result) + ' + C',
                    'pasos': pasos_integracion
                }
                
                json.dumps(result)
            `);

            const pythonResult = JSON.parse(result);
            result = pythonResult.latex_result;
            pasos = pythonResult.pasos;

            console.log("Resultado de la integral:", result);
            console.log("Pasos de la integración:", pasos);

            if (Array.isArray(pasos)) {
                mostrarPasosIntegracion(pasos);
            } else {
                console.log("Pasos no es una lista. Tipo recibido:", typeof pasos);
            }

            integralStr = `\\int \\left(${input}\\right) \\, dx`;

        } else if (tipo === 'definida' || tipo === 'impropia') {
            // Obtener límites solo si son necesarios
            limiteInf = document.getElementById('limite-inf').value.trim();
            limiteSup = document.getElementById('limite-sup').value.trim();
            
            // Reemplazar E o e por exp(1)
            limiteInf = limiteInf.replace(/E|e/g, 'exp(1)');
            limiteSup = limiteSup.replace(/E|e/g, 'exp(1)');
            
            //verificar si los limites son infinito positivo o negativo
            const selectInf = document.getElementById('infinito-inf').value;
            const selectSup = document.getElementById('infinito-sup').value;

            // Convertir -∞ y ∞ a las notaciones correspondientes de SymPy
            if (limiteInf === '-∞' || selectInf === 'negativo-infinito') {
                limiteInf = '-oo'; // Notación de SymPy para menos infinito
            } else if (limiteInf === '∞' || selectInf === 'infinito') {
                limiteInf = 'oo'; // Notación de SymPy para infinito positivo
            }
            
            if (limiteSup === '-∞' || selectSup === 'negativo-infinito') {
                limiteSup = '-oo'; // Notación de SymPy para menos infinito
            } else if (limiteSup === '∞' || selectSup === 'infinito') {
                limiteSup = 'oo'; // Notación de SymPy para infinito positivo
            }
            
            // Resolver integral definida o impropia
            result = await pyodide.runPythonAsync(`
                from sympy import symbols, integrate, N, sin, cos, tan, exp, log, sqrt, oo, pi, latex, diff
                import json
        
                x = symbols('x')
                input_expr = ${input}
                limite_inf = ${limiteInf}
                limite_sup = ${limiteSup}
                
                # Calcular la antiderivada
                antiderivada = integrate(input_expr, x)
                
                # Aplicar el teorema fundamental del cálculo
                resultado_definida = antiderivada.subs(x, limite_sup) - antiderivada.subs(x, limite_inf)
                
                # Calcular el valor numérico
                valor_numerico = N(resultado_definida)
                
                pasos_integracion = [
                    {
                        "paso": f"Función a integrar: {latex(input_expr)}",
                        "explicacion": "Esta es la función original que vamos a integrar."
                    },
                    {
                        "paso": f"Límites de integración: de {latex(limite_inf)} a {latex(limite_sup)}",
                        "explicacion": "Estos son los límites de la integral definida."
                    },
                    {
                        "paso": f"Identificación del tipo: {latex(input_expr)}",
                        "explicacion": "Analizamos la estructura de la función y los límites."
                    },
                    {
                        "paso": f"Descomposición de términos: {latex(input_expr.expand())}",
                        "explicacion": "Expandimos la expresión para identificar sus componentes."
                    },
                    {
                        "paso": f"Antiderivada encontrada: {latex(antiderivada)}",
                        "explicacion": "Esta es la antiderivada de la función original."
                    },
                    {
                        "paso": f"Evaluación en límite superior: {latex(antiderivada.subs(x, limite_sup))}",
                        "explicacion": "Sustituimos el límite superior en la antiderivada."
                    },
                    {
                        "paso": f"Evaluación en límite inferior: {latex(antiderivada.subs(x, limite_inf))}",
                        "explicacion": "Sustituimos el límite inferior en la antiderivada."
                    },
                    {
                        "paso": f"Aplicación del Teorema Fundamental: {latex(resultado_definida)}",
                        "explicacion": "Restamos las evaluaciones según el Teorema Fundamental del Cálculo."
                    },
                    {
                        "paso": f"Simplificación del resultado: {latex(resultado_definida.simplify())}",
                        "explicacion": "Simplificamos la expresión final."
                    },
                    {
                        "paso": f"Valor numérico: {latex(valor_numerico)}",
                        "explicacion": "Este es el valor numérico final de la integral definida."
                    }
                ]
                
                result = {
                    'latex_result': latex(resultado_definida),
                    'numeric_result': str(valor_numerico),
                    'pasos': pasos_integracion
                }
                
                json.dumps(result)
            `);
        
            const pythonResult = JSON.parse(result);
            result = pythonResult.latex_result;
            resultadoNumerico = pythonResult.numeric_result;
            pasos = pythonResult.pasos;
        
            console.log("Resultado de la integral:", result);
            console.log("Valor numérico:", resultadoNumerico);
            console.log("Pasos de la integración:", pasos);
        
            if (Array.isArray(pasos)) {
                mostrarPasosIntegracion(pasos);
            } else {
                console.log("Pasos no es una lista. Tipo recibido:", typeof pasos);
            }
        
            integralStr = `\\int_{${limiteInf}}^{${limiteSup}} \\left(${input}\\right) \\, dx`;
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

         // Mostrar los pasos si existen
         if (Array.isArray(pasos)) {
            mostrarPasosIntegracion(pasos);
        }

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

function mostrarPasosIntegracion(pasos) {
    const pasosContainer = document.getElementById('pasos-output');
    pasosContainer.innerHTML = '';  // Limpiar los pasos previos

    pasos.forEach((paso, index) => {
        const pasoElement = document.createElement('div');
        pasoElement.className = 'paso-integracion mb-3';  // Aplicar clase CSS
        
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
    } else if (selectElement.value === 'negativo-infinito') { // Nueva condición para -∞
        inputElement.disabled = true; // Deshabilita el campo si se selecciona -∞
        inputElement.value = '-∞'; // Mostrar visualmente que es -∞
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

function irAGrafica() {
    const tipo = document.getElementById('tipo-integral').value;
    const input = document.getElementById('math-input').value.trim();
    const limiteInf = document.getElementById('limite-inf').value.trim();
    const limiteSup = document.getElementById('limite-sup').value.trim();

   
    window.location.href = `grafica.html?tipo=${encodeURIComponent(tipo)}&input=${encodeURIComponent(input)}&limiteInf=${encodeURIComponent(limiteInf)}&limiteSup=${encodeURIComponent(limiteSup)}&resultado=${encodeURIComponent(resultadoNumerico)}`;
}
