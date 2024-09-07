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

    if (tipo !== 'indefinida') {
        const limiteInf = document.getElementById('limite-inf').value.trim();
        const limiteSup = document.getElementById('limite-sup').value.trim();
        if (!limiteInf || !limiteSup) {
            mostrarError('Por favor, ingresa los límites.');
            return;
        }
    }

    const pyodide = await cargarSymPy();
    
    try {
        let result;
        if (tipo === 'indefinida') {
            // Resolver integral indefinida usando SymPy
            result = await pyodide.runPythonAsync(`
                from sympy import symbols, integrate, sin, cos, tan, exp, log
                x = symbols('x')
                integrate(${input}, x)
            `);
        } else {
            const limiteInf = document.getElementById('limite-inf').value;
            const limiteSup = document.getElementById('limite-sup').value;
            // Resolver integral definida usando SymPy
            result = await pyodide.runPythonAsync(`
                from sympy import symbols, integrate, sin, cos, tan, exp, log
                x = symbols('x')
                integrate(${input}, (x, ${limiteInf}, ${limiteSup}))
            `);
        }

        document.getElementById('math-output').innerHTML = `Resultado: ${result}`;
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
