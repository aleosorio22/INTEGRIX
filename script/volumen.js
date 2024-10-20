// Cargar Pyodide y SymPy
let pyodideReadyPromise = loadPyodide();

async function cargarSymPy() {
    const pyodide = await pyodideReadyPromise;
    await pyodide.loadPackage("sympy");
    return pyodide;
}

// Resolver integral con validación para calcular el volumen de sólidos
async function resolverConValidacion() {
    let input = document.getElementById('math-input').value.trim();
    const metodoRotacion = document.getElementById('metodo-rotacion').value;
    let limiteInf = document.getElementById('limite-inf').value.trim();
    let limiteSup = document.getElementById('limite-sup').value.trim();

    // Reemplazar "^" por "**" para compatibilidad con SymPy
    input = input.replace(/\^/g, '**');
    input = input.replace(/(\d)([a-zA-Z])/g, '$1*$2');
    input = input.replace(/(\))(\d|[a-zA-Z])/g, '$1*$2');

    // Reemplazar funciones matemáticas comunes con sus equivalentes en SymPy
    const funcionesMath = {
        'sqrt': 'sqrt',
        'ln': 'log',
        'log': 'log',
        'sin': 'sin',
        'cos': 'cos',
        'tan': 'tan',
        'exp': 'exp'
    };

    // Reemplazar funciones dentro del input
    for (const [latexFunc, sympyFunc] of Object.entries(funcionesMath)) {
        const regex = new RegExp(latexFunc, 'g');
        input = input.replace(regex, sympyFunc);
    }

    limpiarResultado();
    ocultarError();

    if (!input) {
        mostrarError('Por favor, ingresa una función válida.');
        return;
    }

    mostrarLoader();
    const pyodide = await cargarSymPy();

    try {
        let result, volumenFormula;

        if (metodoRotacion === 'eje-x') {
            // Rotación alrededor del eje X: π ∫[f(x)]^2 dx
            volumenFormula = `pi*integrate((${input})**2, (x, ${limiteInf}, ${limiteSup}))`;
        } else {
            // Rotación alrededor del eje Y: 2π ∫ x*f(x) dx
            volumenFormula = `2*pi*integrate(x*(${input}), (x, ${limiteInf}, ${limiteSup}))`;
        }

        result = await pyodide.runPythonAsync(`
            from sympy import symbols, integrate, pi, sqrt, log, exp, sin, cos, tan
            x = symbols('x')
            volumen = ${volumenFormula}
            volumen.evalf()  # Evaluar numéricamente
        `);

        const volumenNumerico = parseFloat(result).toFixed(5); // Redondear a 5 decimales
        console.log("Volumen calculado:", volumenNumerico);

        // Renderizar el resultado usando KaTeX
        const outputElement = document.getElementById('math-output');
        const formulaStr = metodoRotacion === 'eje-x'
            ? `\\pi \\int_{${limiteInf}}^{${limiteSup}} \\left(${input}\\right)^2 \\, dx`
            : `2\\pi \\int_{${limiteInf}}^{${limiteSup}} x \\left(${input}\\right) \\, dx`;

        katex.render(`${formulaStr} = ${volumenNumerico}`, outputElement, { throwOnError: false });

        mostrarGrafica(input, limiteInf, limiteSup, metodoRotacion); // Llamar para mostrar la gráfica
        ocultarLoader();

    } catch (error) {
        mostrarError("Error en el cálculo del volumen.");
        ocultarLoader();
        console.error("Error al calcular el volumen:", error);
    }
}

function mostrarGrafica(funcion, limiteInf, limiteSup, metodoRotacion) {
    const container = document.getElementById('grafica-container');
    container.innerHTML = '';

    // Convertir límites a números
    limiteInf = parseFloat(limiteInf);
    limiteSup = parseFloat(limiteSup);

    // Verificar si la función es válida antes de continuar
    if (!funcion || typeof funcion !== 'string' || funcion.trim() === '') {
        console.error("Función no válida:", funcion);
        mostrarError("Función no válida. Por favor, ingresa una función correcta.");
        return;
    }

    // Reemplazar "**" por "^" para que math.js pueda procesarlo correctamente
    funcion = funcion.replace(/\*\*/g, '^');

    // Asegurarse de que la función esté formateada para math.js
    funcion = formatearParaMathJS(funcion);

    // Crear puntos para la curva original
    const numPoints = 200;
    const xValues = Array.from({ length: numPoints }, (_, i) => 
        limiteInf + (limiteSup - limiteInf) * i / (numPoints - 1)
    );

    try {
        // Evaluar la función original
        const yValues = xValues.map(x => {
            try {
                return math.evaluate(funcion, { x });
            } catch (error) {
                console.error(`Error al evaluar la función en x=${x}:`, error);
                throw error;
            }
        });

        // Crear la curva original
        const curvaOriginal = {
            x: xValues,
            y: yValues,
            name: 'Función original',
            type: 'scatter',
            mode: 'lines',
            line: { color: 'blue' }
        };

        // Crear puntos para representar el sólido de revolución
        let trazosRotacion = [];
        
        // Número de círculos a dibujar para simular el sólido
        const numCirculos = 30;
        const tValues = Array.from({ length: 50 }, (_, i) => (2 * Math.PI * i) / 49);

        xValues.forEach((x, index) => {
            const y = yValues[index];
            const color = `rgba(0, 0, 255, ${0.1 + 0.9 * (index / xValues.length)})`;

            if (metodoRotacion === 'eje-x') {
                const circunferencia = {
                    x: Array(50).fill(x),
                    y: tValues.map(angle => y * Math.cos(angle)),
                    z: tValues.map(angle => y * Math.sin(angle)),
                    type: 'scatter3d',
                    mode: 'lines',
                    line: { color: color, width: 2 },
                    showlegend: false
                };
                trazosRotacion.push(circunferencia);
            } else if (metodoRotacion === 'eje-y') {
                const circunferencia = {
                    x: tValues.map(angle => x * Math.cos(angle)),
                    y: Array(50).fill(y),
                    z: tValues.map(angle => x * Math.sin(angle)),
                    type: 'scatter3d',
                    mode: 'lines',
                    line: { color: color, width: 2 },
                    showlegend: false
                };
                trazosRotacion.push(circunferencia);
            }
        });

        const data = [curvaOriginal, ...trazosRotacion];

        const layout = {
            title: 'Visualización del Sólido de Revolución',
            scene: {
                camera: {
                    eye: { x: 1.5, y: 1.5, z: 1.5 }
                },
                xaxis: { title: 'X' },
                yaxis: { title: 'Y' },
                zaxis: { title: 'Z' }
            },
            showlegend: false,
            height: 600
        };

        Plotly.newPlot(container, data, layout, { responsive: true });

    } catch (error) {
        console.error("Error al generar la gráfica:", error);
        mostrarError("Error al generar la gráfica. Verifica la función ingresada.");
    }
}
 

function formatearParaMathJS(funcion) {
    // Reemplazar "^" por "**" para potencias en Python, pero dejar "^" para math.js
    funcion = funcion.replace(/\*\*/g, '^');

    // Reemplazar operadores como "*" que puedan faltar
    funcion = funcion.replace(/(\d)([a-zA-Z])/g, '$1*$2'); // 2x -> 2*x
    funcion = funcion.replace(/(\))(\d|[a-zA-Z])/g, '$1*$2'); // )2 -> )*2, )x -> )*x

    // Reemplazar funciones comunes con sus equivalentes en Math.js
    const funcionesMath = {
        'sqrt': 'sqrt',
        'ln': 'log',
        'log': 'log',
        'sin': 'sin',
        'cos': 'cos',
        'tan': 'tan',
        'exp': 'exp'
    };

    for (const [latexFunc, mathFunc] of Object.entries(funcionesMath)) {
        const regex = new RegExp(latexFunc, 'g');
        funcion = funcion.replace(regex, mathFunc);
    }

    return funcion;
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
    outputElement.textContent = 'Aquí se verá el resultado.';
}

// Función para agregar símbolos al campo de entrada
// Función para agregar símbolos al campo de entrada desde el teclado en pantalla
function agregarSimbolo(simbolo) {
    const input = document.getElementById('math-input');
    
    // Mapeo de funciones matemáticas entre LaTeX y math.js
    const funcionesKaTeX = {
        'ln': 'log',
        'log': 'log',
        'exp': 'exp',
        'sin': 'sin',
        'cos': 'cos',
        'tan': 'tan',
        'sqrt': 'sqrt'
    };

    // Verifica si el símbolo es una función matemática
    if (funcionesKaTeX[simbolo]) {
        input.value += funcionesKaTeX[simbolo];
    } else {
        input.value += simbolo;  // Agrega el símbolo tal cual
    }

    limpiarResultado();
    renderMathInput();  // Renderiza el input
}

// Renderizar el campo de entrada con KaTeX después de la entrada manual o del teclado en pantalla
function renderMathInput() {
    const input = document.getElementById('math-input').value;
    const render = document.getElementById('math-render');
    
    // Usa KaTeX para renderizar la función
    katex.render(input, render, {
        throwOnError: false
    });
}

// Agrega un evento para permitir la entrada manual y actualizar la vista con KaTeX
document.getElementById('math-input').addEventListener('input', () => {
    limpiarResultado();  // Limpia cualquier resultado anterior
    renderMathInput();   // Renderiza el contenido ingresado manualmente
});


// Renderizar el campo de entrada
function renderMathInput() {
    const input = document.getElementById('math-input').value;
    const render = document.getElementById('math-render');
    
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

function mostrarLoader() {
    const loader = document.getElementById('loader');
    loader.classList.remove('d-none');  // Mostrar el loader
}

function ocultarLoader() {
    const loader = document.getElementById('loader');
    loader.classList.add('d-none');  // Ocultar el loader
}
