// Función para graficar la función y sombrear el área bajo la curva
function graficarFuncionYArea(input, limiteInf, limiteSup) {
    const canvas = document.getElementById('grafica-canvas');
    const mensajeError = document.getElementById('mensaje-error');  // Obtener el contenedor de mensajes de error

    if (!canvas) {
        console.error('El canvas no está disponible.');
        return;
    }

    const ctx = canvas.getContext('2d');

    // Limpiar el canvas antes de dibujar
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Resetear el mensaje de error
    mensajeError.textContent = '';
    mensajeError.classList.add('d-none');  // Ocultar mensaje de error inicialmente

    // Dibujar los ejes X e Y
    ctx.beginPath();
    ctx.moveTo(50, canvas.height / 2);
    ctx.lineTo(canvas.width - 50, canvas.height / 2); // Eje X
    ctx.moveTo(canvas.width / 2, 50);
    ctx.lineTo(canvas.width / 2, canvas.height - 50); // Eje Y
    ctx.strokeStyle = '#000';
    ctx.stroke();

    // Verificar si los límites están definidos
    const limiteInfValido = limiteInf !== '' && !isNaN(limiteInf);
    const limiteSupValido = limiteSup !== '' && !isNaN(limiteSup);

    // Formatear la entrada del usuario para convertirla en una función matemática válida de JS
    let funcionMatematica;
    try {
        // Insertar "*" automáticamente entre un número y una variable (ej. 5x -> 5*x)
        const formatearInput = input
            .replace(/\^/g, '**')       // Reemplazar potencias (^) por **
            .replace(/(\d)([a-zA-Z])/g, '$1*$2')  // Insertar "*" entre número y variable (ej. 5x -> 5*x)
            .replace(/ln/g, 'Math.log') // Reemplazar ln por logaritmo natural
            .replace(/log/g, 'Math.log10') // Reemplazar log por logaritmo base 10
            .replace(/sqrt/g, 'Math.sqrt') // Reemplazar sqrt por raíz cuadrada
            .replace(/sin/g, 'Math.sin')   // Reemplazar sin por Math.sin
            .replace(/cos/g, 'Math.cos')   // Reemplazar cos por Math.cos
            .replace(/tan/g, 'Math.tan');  // Reemplazar tan por Math.tan

        // Crear la función usando el input formateado
        funcionMatematica = new Function('x', `return ${formatearInput};`);
    } catch (error) {
        mostrarMensajeError('Error al interpretar la función ingresada. Asegúrate de que la función es válida.');
        return;
    }

    // Graficar la función ingresada por el usuario
    ctx.beginPath();
    for (let x = 50; x < canvas.width - 50; x++) {
        const valorX = (x - canvas.width / 2) / 50; // Ajuste para centrar la gráfica
        let y;

        // Evaluar la función ingresada por el usuario
        try {
            y = funcionMatematica(valorX) * 50;
        } catch (error) {
            mostrarMensajeError('Error al evaluar la función ingresada. Revisa la entrada.');
            return;
        }

        // Si el valor de y es válido, trazar la línea
        if (!isNaN(y)) {
            ctx.lineTo(x, canvas.height / 2 - y);
        } else {
            mostrarMensajeError('El valor de la función no es numérico. Revisa la entrada.');
            return;
        }
    }
    ctx.strokeStyle = '#FF0000'; // Color de la curva
    ctx.stroke();

    // Sombrear el área bajo la curva entre limiteInf y limiteSup si son válidos
    if (limiteInfValido && limiteSupValido) {
        const limiteInfPx = (canvas.width / 2) + (parseFloat(limiteInf) * 50);  // Conversión de unidades a píxeles
        const limiteSupPx = (canvas.width / 2) + (parseFloat(limiteSup) * 50);

        ctx.beginPath();
        ctx.moveTo(limiteInfPx, canvas.height / 2);

        for (let x = limiteInfPx; x <= limiteSupPx; x++) {
            const valorX = (x - canvas.width / 2) / 50;
            const y = funcionMatematica(valorX) * 50; // Usando la función ingresada

            if (!isNaN(y)) {
                ctx.lineTo(x, canvas.height / 2 - y);
            }
        }

        ctx.lineTo(limiteSupPx, canvas.height / 2); // Línea hasta el eje X
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 150, 0, 0.3)'; // Color del área bajo la curva
        ctx.fill();
    }

    // Añadir puntos de referencia en los ejes
    agregarPuntosReferencia(ctx, canvas);
}

// Función para mostrar mensaje de error en la interfaz
function mostrarMensajeError(mensaje) {
    const mensajeError = document.getElementById('mensaje-error');
    mensajeError.textContent = mensaje;
    mensajeError.classList.remove('d-none');  // Mostrar el mensaje de error
}

// Función para agregar puntos de referencia en los ejes
function agregarPuntosReferencia(ctx, canvas) {
    const step = 50; // Distancia entre los puntos
    const fontSize = 12;

    // Puntos en el eje X
    ctx.fillStyle = '#000';
    ctx.font = `${fontSize}px Arial`;
    for (let i = -5; i <= 5; i++) {
        const xPos = (canvas.width / 2) + i * step;
        ctx.fillText(i, xPos - 5, canvas.height / 2 + 15); // Posicionar los números ligeramente por debajo del eje X
        ctx.beginPath();
        ctx.moveTo(xPos, canvas.height / 2 - 5);
        ctx.lineTo(xPos, canvas.height / 2 + 5);
        ctx.stroke();
    }

    // Puntos en el eje Y
    for (let i = -5; i <= 5; i++) {
        const yPos = (canvas.height / 2) - i * step;
        ctx.fillText(i, canvas.width / 2 + 10, yPos + 3); // Posicionar los números ligeramente a la derecha del eje Y
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - 5, yPos);
        ctx.lineTo(canvas.width / 2 + 5, yPos);
        ctx.stroke();
    }
}

// Función para ajustar el zoom (a implementar)
function ajustarZoom() {
    console.log("Funcionalidad para ajustar el zoom no implementada aún.");
}

// Función para ajustar los límites de la gráfica (a implementar)
function ajustarLimites() {
    console.log("Funcionalidad para ajustar los límites no implementada aún.");
}
