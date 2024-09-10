// Función para generar la imagen a partir del resultado y compartirla
// Función para generar la imagen a partir del resultado y compartirla
function generarImagenResultado() {
    const canvas = document.getElementById('resultado-canvas');
    const ctx = canvas.getContext('2d');

    // Ajustar tamaño del canvas
    canvas.width = 800;
    canvas.height = 450;

    // Crear fondo oscuro
    ctx.fillStyle = '#16423C';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar logo
    const logo = new Image();
    logo.src = 'logo.png'; // Asegúrate de tener el logo en la ruta correcta
    logo.onload = function () {
        ctx.drawImage(logo, 30, 30, 100, 100); // Ajusta la posición del logo

        // Dibujar título con una fuente moderna y color claro
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 30px Poppins, sans-serif';
        ctx.fillText('IntegriX - Calculadora de Integrales', 150, 80);

        // Usar html2canvas para capturar el contenido renderizado con KaTeX
        const katexElement = document.getElementById('math-output'); // Elemento KaTeX

        // Establecer explícitamente el color del texto en KaTeX para que sea blanco
        katexElement.style.color = '#FFFFFF';

        html2canvas(katexElement, { backgroundColor: null }).then(function (katexCanvas) {
            // Insertar la captura de KaTeX en el canvas sin fondo blanco
            ctx.drawImage(katexCanvas, 150, 150);

            // Añadir una frase final con fuente clara
            ctx.font = 'italic 18px Poppins, sans-serif';
            ctx.fillStyle = '#CCCCCC';
            ctx.fillText('Calculado por IntegriX', 150, 350);
            ctx.fillText('¡Sigue mejorando tus cálculos con nosotros!', 150, 380);

            // Convertir el canvas a una URL de imagen
            const imagenGenerada = canvas.toDataURL('image/png');

            // Compartir o descargar la imagen
            compartirImagen(imagenGenerada);
        });
    };
}

// Función para compartir la imagen generada
function compartirImagen(imagenDataUrl) {
    if (navigator.share) {
        navigator.share({
            title: 'Resultado de IntegriX',
            text: 'Mira este resultado de una integral calculada en IntegriX!',
            files: [
                new File([dataURLtoBlob(imagenDataUrl)], 'resultado.png', { type: 'image/png' })
            ]
        }).then(() => {
            console.log('Compartido exitosamente');
            limpiarResultado(); // Limpiar después de compartir
        })
        .catch(error => console.log('Error al compartir', error));
    } else {
        // Crear enlace de descarga si el dispositivo no soporta la API de compartir
        const link = document.createElement('a');
        link.href = imagenDataUrl;
        link.download = 'resultado.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        limpiarResultado();
    }
}


// Función auxiliar para convertir dataURL a Blob
function dataURLtoBlob(dataUrl) {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

function limpiarResultado() {
    // Limpiar el contenido de math-output
    const outputElement = document.getElementById('math-output');
    
    // Restablecer el estilo
    outputElement.style.color = '';
    outputElement.style.backgroundColor = '';

    // Limpiar el contenido renderizado de KaTeX
    outputElement.textContent = 'Aquí se verá la integral resuelta.';

    // Ocultar el botón de compartir
    const shareButton = document.getElementById('share-button');
    const graphicButton = document.getElementById('graphic-button')
    shareButton.classList.add('d-none');
    graphicButton.classList.add('d-none');
}

