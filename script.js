document.addEventListener('DOMContentLoaded', function() {
    // Verificar la página actual
    const isLoginPage = window.location.pathname.includes('login.html') || window.location.pathname === '/' || window.location.pathname === '';
    const isHomePage = window.location.pathname.includes('home.html');
    
    // Si está en login y ya está logado, redirigir a home
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (usuarioLogado && isLoginPage) {
        window.location.href = 'home.html';
        return;
    }

    // Si está en home y no está logado, redirigir a login
    if (!usuarioLogado && isHomePage) {
        window.location.href = 'login.html';
        return;
    }

    // Manejar el formulario de login
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Mock del login - siempre exitoso
            localStorage.setItem('usuarioLogado', 'true');
            
            // Redirigir a home
            window.location.replace('home.html');
        });
    }

    // Verificar acceso al back-office
    const isBackOfficePage = window.location.pathname.includes('backoffice.html');
    if (isBackOfficePage && !localStorage.getItem('usuarioLogado')) {
        window.location.replace('./login.html');
    }

    // Manejador para los items del menú
    const menuItems = document.querySelectorAll('.menu-item');
    if (menuItems) {
        menuItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                menuItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');
                
                // Cargar el contenido según la sección
                const section = this.getAttribute('href').replace('#', '');
                if (section === 'espacios') {
                    cargarSeccionEspacios();
                }
            });
        });
    }
});

function cerrarSesion() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = 'login.html';
}

function irABackOffice() {
    // Aseguramos que el usuario está logado antes de navegar
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (usuarioLogado) {
        window.location.replace('./backoffice.html');
    } else {
        window.location.replace('./login.html');
    }
}

function cargarSeccionEspacios() {
    const contentArea = document.querySelector('.content-area');
    console.log('Cargando sección de espacios...');
    
    contentArea.innerHTML = `
        <div class="espacios-container">
            <h2>Gestión de Espacios</h2>
            
            <div class="upload-section">
                <div class="pdf-upload-area" id="dropZone">
                    <i class="fas fa-file-pdf"></i>
                    <p>Arrastra y suelta el plano en PDF</p>
                    <p>o</p>
                    <input type="file" id="pdfInput" accept=".pdf" hidden>
                    <button onclick="document.getElementById('pdfInput').click()" class="upload-button">
                        Selecciona un archivo
                    </button>
                </div>
                <div class="upload-info">
                    <p>El PDF debe contener los códigos de mesa en formato: MESA-XXX</p>
                    <p>Tamaño máximo: 10MB</p>
                </div>
            </div>

            <div id="processingStatus" class="processing-status" style="display: none">
                <div class="spinner"></div>
                <div class="status-details">
                    <p class="status-message">Procesando...</p>
                    <div class="status-log"></div>
                </div>
            </div>

            <div id="planoContainer" class="plano-container" style="display: none">
                <div class="plano-controls">
                    <button id="zoomIn" class="control-button"><i class="fas fa-search-plus"></i></button>
                    <button id="zoomOut" class="control-button"><i class="fas fa-search-minus"></i></button>
                    <button id="reset" class="control-button"><i class="fas fa-undo"></i></button>
                </div>
                <div id="planoWrapper" class="plano-wrapper">
                    <canvas id="planoCanvas"></canvas>
                </div>
                <div id="mesaInfo" class="mesa-info" style="display: none">
                    <h3>Información de la mesa</h3>
                    <p>Código: <span id="mesaCodigo"></span></p>
                    <p>Estado: <span id="mesaEstado"></span></p>
                </div>
            </div>
        </div>
    `;

    console.log('HTML de la sección cargado');
    
    // Configurar el manejo de archivos
    setupFileHandling();
    console.log('Manejadores de archivos configurados');
}

async function procesarPDF(file) {
    const processingStatus = document.getElementById('processingStatus');
    const planoContainer = document.getElementById('planoContainer');
    
    try {
        console.log('Iniciando procesamiento del PDF...');
        processingStatus.style.display = 'flex';
        actualizarEstadoProcesamiento('Iniciando procesamiento del PDF...');

        // 1. Extraer imagen del PDF
        actualizarEstadoProcesamiento('Extrayendo imagen del PDF...');
        console.log('Extrayendo imagen del PDF...');
        const imagenPlano = await extraerImagenDePDF(file);
        console.log('Imagen extraída correctamente:', imagenPlano);
        
        // 2. Detectar espacios en la imagen
        actualizarEstadoProcesamiento('Detectando espacios en el plano...');
        console.log('Iniciando detección de espacios...');
        const espacios = await detectarEspacios(imagenPlano);
        console.log('Espacios detectados:', espacios);
        
        // 3. Mostrar el resultado
        actualizarEstadoProcesamiento('Generando visualización interactiva...');
        console.log('Mostrando plano interactivo...');
        mostrarPlanoInteractivo(imagenPlano, espacios);

        processingStatus.style.display = 'none';
        planoContainer.style.display = 'block';
        console.log('Proceso completado exitosamente');

    } catch (error) {
        console.error('Error en el procesamiento:', error);
        processingStatus.style.display = 'none';
        mostrarError('Error al procesar el archivo: ' + error.message);
    }
}
function setupFileHandling() {
    console.log('Configurando manejadores de archivo...');
    
    const dropZone = document.getElementById('dropZone');
    const pdfInput = document.getElementById('pdfInput');

    if (!dropZone || !pdfInput) {
        console.error('No se encontraron elementos necesarios');
        return;
    }

    // Prevenir comportamiento por defecto del drag & drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Destacar la zona de drop cuando se arrastra un archivo
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('drag-over');
    }

    function unhighlight(e) {
        dropZone.classList.remove('drag-over');
    }

    // Manejar la subida de archivos
    dropZone.addEventListener('drop', handleDrop, false);
    pdfInput.addEventListener('change', handleFiles, false);

    console.log('Eventos de archivo configurados');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles({ target: { files: files } });
}

function handleFiles(e) {
    console.log('Archivo recibido');
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
        console.log('Archivo PDF válido, iniciando procesamiento');
        procesarPDF(file);
    } else {
        console.error('Archivo no válido');
        mostrarError('Por favor, selecciona un archivo PDF válido.');
    }
}

function actualizarEstadoProcesamiento(mensaje) {
    const processingStatus = document.getElementById('processingStatus');
    const statusText = processingStatus.querySelector('p');
    statusText.textContent = mensaje;
    console.log('Estado:', mensaje);
}

function mostrarError(mensaje) {
    const contentArea = document.querySelector('.content-area');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <p style="color: red; margin: 10px 0;">
            <i class="fas fa-exclamation-circle"></i> 
            ${mensaje}
        </p>
    `;
    contentArea.prepend(errorDiv);
    console.error(mensaje);
}

async function extraerImagenDePDF(file) {
    console.log('Iniciando extracción de imagen del PDF');
    try {
        const pdfData = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
        console.log('PDF cargado correctamente');
        
        const page = await pdfData.getPage(1);
        console.log('Primera página obtenida');
        
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
    // Cargar el PDF
    const pdfData = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
    const page = await pdfData.getPage(1);
    
    // Crear canvas temporal para la extracción
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Renderizar página del PDF
    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;

    return {
        dataUrl: canvas.toDataURL('image/png'),
        width: canvas.width,
        height: canvas.height
    };
}

async function detectarEspacios(imagenPlano) {
    // Crear imagen para procesar
    const img = new Image();
    img.src = imagenPlano.dataUrl;
    await new Promise(resolve => img.onload = resolve);

    // Crear canvas temporal para procesamiento
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // Procesar con OpenCV
    const src = cv.imread(canvas);
    const gray = new cv.Mat();
    const binary = new cv.Mat();
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    // Preprocesar imagen
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.threshold(gray, binary, 127, 255, cv.THRESH_BINARY_INV);
    cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    // Detectar espacios
    const espacios = [];
    for (let i = 0; i < contours.size(); ++i) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);
        
        // Filtrar por área mínima
        if (area > 1000) {
            const rect = cv.boundingRect(contour);
            
            // Extraer región para OCR
            const regionCanvas = document.createElement('canvas');
            regionCanvas.width = rect.width;
            regionCanvas.height = rect.height;
            const regionCtx = regionCanvas.getContext('2d');
            regionCtx.drawImage(canvas, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);

            // Añadir espacio detectado
            espacios.push({
                rect: rect,
                imageData: regionCanvas.toDataURL()
            });
        }
    }

    // Liberar memoria
    src.delete(); gray.delete(); binary.delete();
    contours.delete(); hierarchy.delete();

    // Procesar OCR para cada espacio
    const espaciosProcesados = await Promise.all(espacios.map(async (espacio) => {
        const worker = await Tesseract.createWorker();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        
        const { data: { text } } = await worker.recognize(espacio.imageData);
        await worker.terminate();

        return {
            ...espacio,
            codigo: text.trim()
        };
    }));

    return espaciosProcesados.filter(espacio => espacio.codigo);
}

function mostrarPlanoInteractivo(imagenPlano, espacios) {
    const canvas = document.getElementById('planoCanvas');
    const ctx = canvas.getContext('2d');
    
    // Configurar tamaño del canvas
    canvas.width = imagenPlano.width;
    canvas.height = imagenPlano.height;

    // Cargar y dibujar imagen de fondo
    const img = new Image();
    img.src = imagenPlano.dataUrl;
    img.onload = () => {
        // Dibujar plano
        ctx.drawImage(img, 0, 0);
        
        // Dibujar espacios detectados
        espacios.forEach(espacio => {
            ctx.strokeStyle = '#28a745';
            ctx.lineWidth = 2;
            ctx.strokeRect(espacio.rect.x, espacio.rect.y, espacio.rect.width, espacio.rect.height);
            
            // Añadir código
            ctx.fillStyle = 'rgba(40, 167, 69, 0.2)';
            ctx.fillRect(espacio.rect.x, espacio.rect.y, espacio.rect.width, espacio.rect.height);
            
            ctx.fillStyle = '#000';
            ctx.font = '14px Arial';
            ctx.fillText(espacio.codigo, espacio.rect.x + 5, espacio.rect.y + 20);
        });
    };

    // Añadir interactividad
    canvas.onclick = (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) * (canvas.width / rect.width);
        const y = (event.clientY - rect.top) * (canvas.height / rect.height);

        const espacioSeleccionado = espacios.find(espacio => {
            const { rect } = espacio;
            return x >= rect.x && x <= rect.x + rect.width &&
                   y >= rect.y && y <= rect.y + rect.height;
        });

        if (espacioSeleccionado) {
            // Redibujar todo
            ctx.drawImage(img, 0, 0);
            
            // Dibujar todos los espacios
            espacios.forEach(espacio => {
                const esSeleccionado = espacio === espacioSeleccionado;
                ctx.strokeStyle = esSeleccionado ? '#FF4B55' : '#28a745';
                ctx.lineWidth = esSeleccionado ? 3 : 2;
                ctx.strokeRect(espacio.rect.x, espacio.rect.y, espacio.rect.width, espacio.rect.height);
                
                ctx.fillStyle = esSeleccionado ? 
                    'rgba(255, 75, 85, 0.2)' : 
                    'rgba(40, 167, 69, 0.2)';
                ctx.fillRect(espacio.rect.x, espacio.rect.y, espacio.rect.width, espacio.rect.height);
                
                ctx.fillStyle = '#000';
                ctx.font = '14px Arial';
                ctx.fillText(espacio.codigo, espacio.rect.x + 5, espacio.rect.y + 20);
            });

            mostrarInfoMesa(espacioSeleccionado);
        }
    };
}

function mostrarInfoMesa(mesa) {
    const mesaInfo = document.getElementById('mesaInfo');
    const mesaCodigo = document.getElementById('mesaCodigo');
    const mesaEstado = document.getElementById('mesaEstado');

    mesaCodigo.textContent = mesa.codigo;
    mesaEstado.textContent = mesa.estado;
    mesaInfo.style.display = 'block';
}

function setupPlanoControls() {
    let scale = 1;
    const wrapper = document.getElementById('planoWrapper');
    const canvas = document.getElementById('planoCanvas');

    document.getElementById('zoomIn').onclick = () => {
        scale *= 1.2;
        canvas.style.transform = `scale(${scale})`;
    };

    document.getElementById('zoomOut').onclick = () => {
        scale /= 1.2;
        canvas.style.transform = `scale(${scale})`;
    };

    document.getElementById('reset').onclick = () => {
        scale = 1;
        canvas.style.transform = `scale(${scale})`;
    };
} 