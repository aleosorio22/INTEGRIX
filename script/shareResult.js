// Función para generar la imagen a partir del resultado y compartirla
function generarImagenResultado() {
    const canvas = document.getElementById('resultado-canvas');
    const ctx = canvas.getContext('2d');

    // Ajustar tamaño del canvas
    canvas.width = 1200;
    canvas.height = 630;

    // Crear fondo con gradiente
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0A2A27');
    gradient.addColorStop(1, '#0D3B37');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar logo
    const logo = new Image();
    logo.src = 'img/logoIntegrix-removebg-preview.png';
    logo.onload = function () {
        ctx.drawImage(logo, 50, 50, 120, 120);

        // Dibujar título
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 48px Poppins, sans-serif';
        ctx.fillText('IntegriX - Calculadora de Integrales', 200, 120);

        // Definir el área blanca
        const whiteAreaX = 100;
        const whiteAreaY = 180;
        const whiteAreaWidth = canvas.width - 200;
        const whiteAreaHeight = 300;

        // Crear un área para el resultado con mejor contraste
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(whiteAreaX, whiteAreaY, whiteAreaWidth, whiteAreaHeight);

        // Capturar el contenido de KaTeX
        const katexElement = document.getElementById('math-output');
        if (!katexElement) {
            console.error("El elemento 'math-output' no se encontró.");
            return;
        }

        // Crear un contenedor temporal para el contenido de KaTeX
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.color = '#000000';
        tempContainer.style.background = 'transparent';
        tempContainer.style.width = whiteAreaWidth + 'px';
        tempContainer.style.fontSize = '40px'; // Aumentar un poco más el tamaño de la fuente
        tempContainer.innerHTML = katexElement.innerHTML;
        document.body.appendChild(tempContainer);

        // Capturar el contenido de KaTeX con html2canvas
        html2canvas(tempContainer, { 
            backgroundColor: null,
            scale: 2
        }).then(function (katexCanvas) {
            document.body.removeChild(tempContainer);

            if (!katexCanvas) {
                console.error("No se pudo capturar el contenido de KaTeX.");
                return;
            }

            // Calcular las dimensiones para centrar y ajustar el tamaño
            const scale = Math.min(
                (whiteAreaWidth - 40) / katexCanvas.width,
                (whiteAreaHeight - 40) / katexCanvas.height
            );
            const scaledWidth = katexCanvas.width * scale;
            const scaledHeight = katexCanvas.height * scale;
            const x = whiteAreaX + (whiteAreaWidth - scaledWidth) / 2;
            const y = whiteAreaY + (whiteAreaHeight - scaledHeight) / 2;

            // Insertar la captura de KaTeX en el canvas
            ctx.drawImage(katexCanvas, x, y, scaledWidth, scaledHeight);

            // Añadir fecha y hora
            const now = new Date();
            ctx.font = '24px Poppins, sans-serif';
            ctx.fillStyle = '#A0E4D7';
            ctx.fillText(now.toLocaleString(), 100, canvas.height - 100);

            // Añadir frase final
            ctx.font = 'italic 28px Poppins, sans-serif';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('Calculado por IntegriX', 100, canvas.height - 60);
            ctx.fillText('¡Sigue mejorando tus cálculos con nosotros!', 100, canvas.height - 20);

            // Convertir el canvas a una URL de imagen
            const imagenGenerada = canvas.toDataURL('image/png');

            // Compartir o descargar la imagen
            compartirImagen(imagenGenerada);
        }).catch(error => {
            console.error("Error al capturar el contenido de KaTeX:", error);
        });
    };

    logo.onerror = function () {
        console.error("Error al cargar la imagen del logo. Verifica la ruta del logo.");
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

