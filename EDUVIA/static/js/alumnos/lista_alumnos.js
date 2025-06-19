      // Agregar al inicio del archivo para debug
      console.log('JavaScript cargado');
      console.log('SweetAlert2 disponible:', typeof Swal !== 'undefined');

      // Función de prueba para verificar SweetAlert2
      function testSweetAlert() {
          console.log('Probando SweetAlert2...');
          if (typeof Swal !== 'undefined') {
              Swal.fire('¡Funciona!', 'SweetAlert2 está cargado correctamente', 'success');
          } else {
              alert('SweetAlert2 NO está disponible');
          }
      }

      // Variables globales
      let currentAlumnoId = null;
      let currentAlumnoNombre = null;
      let currentAlumnoEstado = null;

      // Variables para paginación
      let currentPage = 1;
      let itemsPerPage = 7;
      let totalItems = 0;
      let filteredRows = [];

      // Función simple para auto-ocultar alertas en 5 segundos
      function autoHideAlerts() {
          const alerts = document.querySelectorAll('.auto-hide-alert');
        
          alerts.forEach(alert => {
              setTimeout(() => {
                  if (alert && alert.parentNode) {
                      alert.remove();
                  }
              }, 5000);
          });
      }

      // =========================================
      // FUNCIONES DE PAGINACIÓN
      // =========================================

      function initializePagination() {
          const rows = document.querySelectorAll('.alumno-row');
          filteredRows = Array.from(rows);
          totalItems = filteredRows.length;
          
          if (totalItems > itemsPerPage) {
              showPagination();
              updatePagination();
              showPage(1);
          } else {
              hidePagination();
              showAllRows();
          }
      }

      function showPagination() {
          const paginationContainer = document.getElementById('pagination-container');
          if (paginationContainer) {
              paginationContainer.style.display = 'flex';
          }
      }

      function hidePagination() {
          const paginationContainer = document.getElementById('pagination-container');
          if (paginationContainer) {
              paginationContainer.style.display = 'none';
          }
      }

      function showAllRows() {
          filteredRows.forEach(row => {
              row.style.display = '';
          });
      }

      function updatePagination() {
          const totalPages = Math.ceil(totalItems / itemsPerPage);
          const paginationList = document.getElementById('pagination-list');
          
          if (!paginationList) return;
          
          // Limpiar paginación existente
          paginationList.innerHTML = '';
          
          // Botón anterior
          const prevButton = createPaginationButton('Anterior', currentPage > 1, () => {
              if (currentPage > 1) {
                  showPage(currentPage - 1);
              }
          });
          prevButton.classList.add('pagination-prev');
          paginationList.appendChild(prevButton);
          
          // Números de página
          for (let i = 1; i <= totalPages; i++) {
              const button = createPaginationButton(i.toString(), true, () => showPage(i));
              if (i === currentPage) {
                  button.classList.add('active');
              }
              paginationList.appendChild(button);
          }
          
          // Botón siguiente
          const nextButton = createPaginationButton('Siguiente', currentPage < totalPages, () => {
              if (currentPage < totalPages) {
                  showPage(currentPage + 1);
              }
          });
          nextButton.classList.add('pagination-next');
          paginationList.appendChild(nextButton);
          
          // Actualizar información de página
          updatePageInfo();
      }

      function createPaginationButton(text, enabled, onClick) {
          const button = document.createElement('button');
          button.textContent = text;
          button.className = 'pagination-btn';
          
          if (enabled) {
              button.addEventListener('click', onClick);
          } else {
              button.disabled = true;
              button.classList.add('disabled');
          }
          
          return button;
      }

      function showPage(pageNumber) {
          currentPage = pageNumber;
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          
          // Ocultar todas las filas
          const allRows = document.querySelectorAll('.alumno-row');
          allRows.forEach(row => {
              row.style.display = 'none';
          });
          
          // Mostrar solo las filas de la página actual
          for (let i = startIndex; i < endIndex && i < filteredRows.length; i++) {
              filteredRows[i].style.display = '';
          }
          
          updatePagination();
          
          // Scroll hacia arriba de la tabla
          const tableContainer = document.querySelector('.table-responsive');
          if (tableContainer) {
              tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
      }

      function updatePageInfo() {
          const pageInfo = document.getElementById('page-info');
          if (pageInfo) {
              const startItem = (currentPage - 1) * itemsPerPage + 1;
              const endItem = Math.min(currentPage * itemsPerPage, totalItems);
              const totalPages = Math.ceil(totalItems / itemsPerPage);
              
              pageInfo.textContent = `Página ${currentPage} de ${totalPages} (${startItem}-${endItem} de ${totalItems} alumnos)`;
          }
      }

      function applyFiltersAndPagination() {
          // Obtener todos los filtros activos
          const searchTerm = document.querySelector('.search-input')?.value.toLowerCase() || '';
          const nivelFilter = document.getElementById('courseFilter')?.value || 'todos';
          const estadoFilter = document.getElementById('statusFilter')?.value || 'todos';
          
          // Filtrar filas
          const allRows = document.querySelectorAll('.alumno-row');
          filteredRows = Array.from(allRows).filter(row => {
              const nombre = row.dataset.nombre.toLowerCase();
              const nivel = row.dataset.nivel.toLowerCase();
              const jornada = row.dataset.jornada.toLowerCase();
              const estado = row.dataset.estado;
              
              // Aplicar filtro de búsqueda
              const matchesSearch = !searchTerm || 
                  nombre.includes(searchTerm) || 
                  nivel.includes(searchTerm) || 
                  jornada.includes(searchTerm);
              
              // Aplicar filtro de nivel
              const matchesNivel = nivelFilter === 'todos' || 
                  row.dataset.nivel === nivelFilter;
              
              // Aplicar filtro de estado
              const matchesEstado = estadoFilter === 'todos' || 
                  estado === estadoFilter;
              
              return matchesSearch && matchesNivel && matchesEstado;
          });
          
          totalItems = filteredRows.length;
          currentPage = 1; // Resetear a la primera página
          
          // Mostrar/ocultar mensaje de "sin resultados"
          const noResultsRow = document.getElementById('no-results-row');
          if (noResultsRow) {
              noResultsRow.style.display = totalItems === 0 ? '' : 'none';
          }
          
          if (totalItems > itemsPerPage) {
              showPagination();
              updatePagination();
              showPage(1);
          } else {
              hidePagination();
              // Ocultar todas las filas primero
              const allRows = document.querySelectorAll('.alumno-row');
              allRows.forEach(row => {
                  row.style.display = 'none';
              });
              // Mostrar solo las filas filtradas
              filteredRows.forEach(row => {
                  row.style.display = '';
              });
          }
      }

      // =========================================
      // FUNCIONES DE FORMATEO
      // =========================================

      // Función mejorada para formatear teléfono chileno
      function formatPhoneNumber(input) {
          let value = input.value.replace(/\D/g, ''); // Remover todo lo que no sea dígito
          
          // Si el campo está vacío, no hacer nada
          if (value.length === 0) {
              input.value = '';
              return;
          }
          
          // Normalizar el número a formato chileno
          let normalizedValue = '';
          
          if (value.startsWith('56')) {
              // Ya empieza con código de país
              if (value.length >= 3 && value.charAt(2) === '9') {
                  // Ya tiene 56 + 9
                  normalizedValue = value.substring(0, 11); // Máximo 11 dígitos
              } else if (value.length >= 2) {
                  // Tiene 56 pero falta el 9
                  normalizedValue = '56' + '9' + value.substring(2, 10); // 56 + 9 + 8 dígitos
              }
          } else if (value.startsWith('9')) {
              // Empieza con 9 (número móvil chileno)
              normalizedValue = '56' + value.substring(0, 9); // 56 + 9 dígitos máximo
          } else {
              // Número sin código de país ni 9 inicial
              if (value.length <= 8) {
                  normalizedValue = '569' + value; // 56 + 9 + número local
              } else {
                  // Si tiene más de 8 dígitos, tomar solo los primeros 8
                  normalizedValue = '569' + value.substring(0, 8);
              }
          }
          
          // Asegurar que no exceda 11 dígitos y que tenga el formato correcto
          if (normalizedValue.length > 11) {
              normalizedValue = normalizedValue.substring(0, 11);
          }
          
          // Verificar que tenga al menos el formato mínimo (569 + al menos 1 dígito)
          if (normalizedValue.length < 4) {
              input.value = '+56 9';
              return;
          }
          
          // Formatear como +56 9 XXXX XXXX
          let formatted = '+56';
          
          if (normalizedValue.length > 2) {
              formatted += ' ' + normalizedValue.charAt(2); // El 9
          }
          
          if (normalizedValue.length > 3) {
              const remainingDigits = normalizedValue.substring(3);
              if (remainingDigits.length <= 4) {
                  formatted += ' ' + remainingDigits;
              } else {
                  formatted += ' ' + remainingDigits.substring(0, 4);
                  if (remainingDigits.length > 4) {
                      formatted += ' ' + remainingDigits.substring(4, 8);
                  }
              }
          }
          
          input.value = formatted;
      }

      // Función para formatear RUT chileno
      function formatRUT(input) {
          let value = input.value.replace(/[^0-9kK]/g, ''); // Mantener solo números y K
          
          if (value.length === 0) {
              input.value = '';
              return;
          }
          
          // Separar el dígito verificador
          let rut = value.slice(0, -1);
          let dv = value.slice(-1).toUpperCase();
          
          // Formatear el RUT con puntos
          if (rut.length > 6) {
              rut = rut.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
          }
          
          // Unir RUT con dígito verificador
          if (dv) {
              input.value = rut + '-' + dv;
          } else {
              input.value = rut;
          }
      }

      // Función mejorada para limpiar teléfono (remover formato)
      function cleanPhone(phone) {
          return phone.replace(/[\s\+\-]/g, '');
      }

      // Función mejorada para limpiar teléfono antes de enviar al servidor
      function cleanPhoneForSubmission(phone) {
          // Remover espacios, + y guiones, pero mantener el formato que espera el servidor
          const cleaned = phone.replace(/[\s\+\-]/g, '');
          
          // Si empieza con 56, asegurar que tenga el formato correcto
          if (cleaned.startsWith('56') && cleaned.length === 11) {
              return '+' + cleaned;
          }
          
          return phone;
      }

      // Función para limpiar RUT (remover formato)
      function cleanRUT(rut) {
          return rut.replace(/[.\-]/g, '').toUpperCase();
      }

      // =========================================
      // FUNCIONES DE VALIDACIÓN DE FORMULARIOS
      // =========================================

      // Función para preparar los datos del formulario antes del envío
      function prepareFormForSubmission() {
          const form = document.querySelector('form[method="post"]');
          if (!form) return;
        
          form.addEventListener('submit', function(e) {
              // Limpiar los campos de teléfono antes del envío
              const phoneFields = form.querySelectorAll('input[name="telefono"], input[name="contacto_emergencia_telefono"]');
        
              phoneFields.forEach(field => {
                  if (field.value) {
                      // Convertir +56 9 XXXX XXXX a +569XXXXXXXX
                      const cleanValue = field.value.replace(/\s/g, '').replace(/^\+56\s?9/, '+569');
                      field.value = cleanValue;
                  }
              });
          });
      }

      // Función para inicializar la validación del formulario
      function initializeFormValidation() {
          const form = document.querySelector('form[method="post"]');
          if (!form) return;

          setupFieldValidation();
          setupFieldFormatting();
          setupRealTimeValidation();
          validateAllFields();
          prepareFormForSubmission();
      }

      // Función para configurar el formateo de campos (actualizada)
      function setupFieldFormatting() {
          // Formateo de RUT
          const rutFields = document.querySelectorAll('input[name="rut"]');
          rutFields.forEach(field => {
              field.addEventListener('input', function() {
                  formatRUT(this);
                  const isValid = validateField(this);
                  applyValidationStyles(this, isValid);
              });
              
              field.addEventListener('blur', function() {
                  formatRUT(this);
                  const isValid = validateField(this);
                  applyValidationStyles(this, isValid);
              });
          });

          // Formateo de teléfono - mejorado
          const phoneFields = document.querySelectorAll('input[name="telefono"], input[name="contacto_emergencia_telefono"]');
          phoneFields.forEach(field => {
              // Establecer placeholder
              field.placeholder = '+56 9 XXXX XXXX';
              
              field.addEventListener('input', function() {
                  formatPhoneNumber(this);
                  const isValid = validateField(this);
                  applyValidationStyles(this, isValid);
              });
              
              field.addEventListener('blur', function() {
                  formatPhoneNumber(this);
                  const isValid = validateField(this);
                  applyValidationStyles(this, isValid);
              });
              
              // Formatear al cargar la página si ya tiene valor
              if (field.value) {
                  formatPhoneNumber(field);
              }
          });
      }

      // Función para configurar la validación de campos
      function setupFieldValidation() {
          const fields = document.querySelectorAll('input, select, textarea');
        
          fields.forEach(field => {
              if (shouldValidateField(field)) {
                  // Agregar eventos de validación (solo para campos que no son RUT o teléfono)
                  if (!['rut', 'telefono', 'contacto_emergencia_telefono'].includes(field.name)) {
                      field.addEventListener('input', () => {
                          const isValid = validateField(field);
                          applyValidationStyles(field, isValid);
                      });
                      field.addEventListener('blur', () => {
                          const isValid = validateField(field);
                          applyValidationStyles(field, isValid);
                      });
                      field.addEventListener('change', () => {
                          const isValid = validateField(field);
                          applyValidationStyles(field, isValid);
                      });
                  }
                
                  // Marcar campos requeridos
                  if (isRequiredField(field)) {
                      const label = document.querySelector(`label[for="${field.id}"]`);
                      if (label && !label.classList.contains('required')) {
                          label.classList.add('required');
                      }
                  }
              }
          });
      }

      // Función para configurar validación en tiempo real
      function setupRealTimeValidation() {
          const fields = document.querySelectorAll('input, select, textarea');
        
          fields.forEach(field => {
              if (shouldValidateField(field)) {
                  // Limpiar mensajes de error cuando el usuario empiece a escribir
                  field.addEventListener('input', function() {
                      clearFieldErrors(this);
                      const isValid = validateField(this);
                      applyValidationStyles(this, isValid);
                  });
                  
                  field.addEventListener('change', function() {
                      clearFieldErrors(this);
                      const isValid = validateField(this);
                      applyValidationStyles(this, isValid);
                  });
                  
                  field.addEventListener('focus', function() {
                      clearFieldErrors(this);
                  });
              }
          });
      }

      // Función para limpiar errores de un campo específico
      function clearFieldErrors(field) {
          const formGroup = field.closest('.form-group');
          if (formGroup) {
              const errorDivs = formGroup.querySelectorAll('.text-danger, .invalid-feedback');
              errorDivs.forEach(errorDiv => {
                  if (field.value.trim() !== '') {
                      errorDiv.style.display = 'none';
                  }
              });
          }
      }

      // Función para determinar si un campo debe ser validado
      function shouldValidateField(field) {
          if (field.type === 'hidden' || field.name === 'csrfmiddlewaretoken') {
              return false;
          }
          return field.name && field.name.trim() !== '';
      }

      // Función para determinar si un campo es requerido
      function isRequiredField(field) {
          const requiredFields = [
              'primer_nombre', 'apellido_paterno', 'apellido_materno', 'rut',
              'fecha_nacimiento', 'sexo', 'estado_civil', 'direccion',
              'numero_nivel', 'letra_nivel', 'fecha_ingreso', 'telefono',
              'correo_electronico'
          ];
          return field.required || requiredFields.includes(field.name);
      }

      // Función principal de validación de campo
      function validateField(field) {
          let isValid = false;
        
          switch (field.type) {
              case 'text':
              case 'textarea':
                  isValid = validateTextField(field);
                  break;
              case 'email':
                  isValid = validateEmailField(field);
                  break;
              case 'tel':
                  isValid = validatePhoneField(field);
                  break;
              case 'date':
                  isValid = validateDateField(field);
                  break;
              case 'select-one':
                  isValid = validateSelectField(field);
                  break;
              case 'checkbox':
                  isValid = validateCheckboxField(field);
                  break;
              default:
                  isValid = field.value.trim() !== '';
          }
        
          return isValid;
      }

      // Funciones de validación específicas por tipo de campo
      function validateTextField(field) {
          const value = field.value.trim();
          const fieldName = field.name;
        
          if (isRequiredField(field) && value === '') {
              return false;
          }
        
          if (value === '') {
              return !isRequiredField(field);
          }
        
          switch (fieldName) {
              case 'primer_nombre':
              case 'segundo_nombre':
              case 'apellido_paterno':
              case 'apellido_materno':
                  return value.length >= 2 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value);
            
              case 'rut':
                  return validateRUT(cleanRUT(value));
            
              case 'religion':
                  return value.length >= 2;
            
              case 'direccion':
                  return value.length >= 5;
            
              case 'contacto_emergencia_nombre':
              case 'contacto_emergencia_parentezco':
                  return value.length >= 2;
            
              case 'ultimo_curso_aprobado':
              case 'curso_repetido':
                  return value.length >= 1;
            
              case 'anio_repitencia':
                  const year = parseInt(value);
                  const currentYear = new Date().getFullYear();
                  return !isNaN(year) && year >= 1900 && year <= currentYear;
            
              default:
                  return value.length >= 1;
          }
      }

      function validateEmailField(field) {
          const value = field.value.trim();
          if (value === '') return !isRequiredField(field);
        
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value);
      }

      function validatePhoneField(field) {
          const value = cleanPhone(field.value);
          if (value === '') return !isRequiredField(field);
        
          // Validar formato chileno: debe tener 11 dígitos y empezar con 569
          // O puede tener el formato +56 9 XXXX XXXX
          const phoneRegex = /^569[0-9]{8}$/;
          const formattedPhoneRegex = /^\+56\s9\s\d{4}\s\d{4}$/;
        
          return phoneRegex.test(value) || formattedPhoneRegex.test(field.value);
      }

      function validateDateField(field) {
          const value = field.value;
          if (value === '') return !isRequiredField(field);
        
          const date = new Date(value);
          const now = new Date();
        
          if (isNaN(date.getTime())) return false;
        
          if (field.name === 'fecha_nacimiento') {
              const minDate = new Date(now.getFullYear() - 100, 0, 1);
              const maxDate = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());
              return date >= minDate && date <= maxDate;
          }
        
          if (field.name === 'fecha_ingreso') {
              const maxDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
              return date <= maxDate;
          }
        
          return true;
      }

      function validateSelectField(field) {
          const value = field.value;
          if (isRequiredField(field) && (value === '' || value === 'todos' || value === '---' || value === '---------')) {
              return false;
          }
          return true;
      }

      function validateCheckboxField(field) {
          return true;
      }

      // Función para validar RUT chileno
      function validateRUT(rut) {
          // Limpiar el RUT
          rut = rut.replace(/[.\-]/g, '').toUpperCase();
        
          if (rut.length < 8 || rut.length > 9) return false;
        
          const body = rut.slice(0, -1);
          const dv = rut.slice(-1);
        
          if (!/^\d+$/.test(body)) return false;
        
          let sum = 0;
          let multiplier = 2;
        
          for (let i = body.length - 1; i >= 0; i--) {
              sum += parseInt(body[i]) * multiplier;
              multiplier = multiplier === 7 ? 2 : multiplier + 1;
          }
        
          const calculatedDV = 11 - (sum % 11);
          let expectedDV;
        
          if (calculatedDV === 11) expectedDV = '0';
          else if (calculatedDV === 10) expectedDV = 'K';
          else expectedDV = calculatedDV.toString();
        
          return dv === expectedDV;
      }

      // Función para aplicar estilos de validación
      function applyValidationStyles(field, isValid) {
          field.classList.remove('valid', 'invalid');
        
          if (field.value.trim() !== '' || isRequiredField(field)) {
              if (isValid) {
                  field.classList.add('valid');
              } else {
                  field.classList.add('invalid');
              }
          }
      }

      // Función para validar todos los campos
      function validateAllFields() {
          const fields = document.querySelectorAll('input, select, textarea');
          fields.forEach(field => {
              if (shouldValidateField(field)) {
                  const isValid = validateField(field);
                  applyValidationStyles(field, isValid);
              }
          });
      }

      // Función para limpiar filtros
      function clearFilters() {
          const nombreBusqueda = document.getElementById('nombre-busqueda');
          const courseFilter = document.getElementById('courseFilter');
          const statusFilter = document.getElementById('statusFilter');
          const filtroForm = document.getElementById('filtro-form');
        
          if (nombreBusqueda) nombreBusqueda.value = '';
          if (courseFilter) courseFilter.value = 'todos';
          if (statusFilter) statusFilter.value = 'todos';
          
          // Aplicar filtros y paginación después de limpiar
          applyFiltersAndPagination();
      }

      // Función para abrir modal de estado
      function openEstadoModal(button) {
          // Verificar si el año permite edición desde el contenedor
          const container = document.querySelector('.user-list-container');
          const permiteEdicion = container ? container.dataset.permiteEdicion === 'true' : false;
        
          if (!permiteEdicion) {
              alert('No se pueden realizar cambios en este año académico. Solo el año activo permite modificaciones.');
              return;
          }
        
          currentAlumnoId = button.getAttribute('data-id');
          currentAlumnoNombre = button.getAttribute('data-nombre');
          currentAlumnoEstado = button.getAttribute('data-estado');
        
          const estadoModalNombre = document.getElementById('estado-modal-nombre');
          const estadoForm = document.getElementById('estadoForm');
          const estadoInactivo = document.getElementById('estadoInactivo');
          const estadoActivo = document.getElementById('estadoActivo');
          const estadoModal = document.getElementById('estadoModal');
        
          if (estadoModalNombre) estadoModalNombre.textContent = currentAlumnoNombre;
          if (estadoForm) estadoForm.action = `/alumnos/${currentAlumnoId}/cambiar-estado/`;
        
          // Actualizar el año en el modal
          const anoFilter = document.getElementById('year-filter');
          if (anoFilter) {
              const estadoModalAno = document.getElementById('estado-modal-ano');
              if (estadoModalAno) {
                  estadoModalAno.textContent = anoFilter.value;
              }
        
              // Actualizar el campo oculto del año
              const anoInput = document.querySelector('#estadoForm input[name="ano"]');
              if (anoInput) {
                  anoInput.value = anoFilter.value;
              }
          }
        
          if (currentAlumnoEstado === 'Inactivo') {
              if (estadoInactivo) estadoInactivo.checked = true;
          } else {
              if (estadoActivo) estadoActivo.checked = true;
          }
        
          if (estadoModal) estadoModal.style.display = 'flex';
      }

      // Función para cerrar modal de estado
      function closeEstadoModal() {
          const estadoModal = document.getElementById('estadoModal');
          if (estadoModal) estadoModal.style.display = 'none';
          currentAlumnoId = null;
          currentAlumnoNombre = null;
          currentAlumnoEstado = null;
      }

      document.addEventListener('DOMContentLoaded', function() {
          // Inicializar validación de formularios si estamos en la página de crear alumnos
          if (window.location.pathname.includes('crear') || window.location.pathname.includes('editar')) {
              initializeFormValidation();
          }
        
          // Inicializar auto-ocultamiento de alertas
          autoHideAlerts();
          
          // Inicializar paginación
          initializePagination();
        
          // Coordinar filtros con paginación
          const courseFilter = document.getElementById('courseFilter');
          const statusFilter = document.getElementById('statusFilter');
          const searchInput = document.querySelector('.search-input');
        
          if (courseFilter) {
              courseFilter.addEventListener('change', function() {
                  if (this.value !== 'todos' && statusFilter && statusFilter.value !== 'inactivo') {
                      statusFilter.value = 'activo';
                  }
                  applyFiltersAndPagination();
              });
          }
            
          if (statusFilter) {
              statusFilter.addEventListener('change', function() {
                  applyFiltersAndPagination();
              });
          }
          
          // Búsqueda en tiempo real con paginación
          if (searchInput) {
              searchInput.addEventListener('input', function() {
                  applyFiltersAndPagination();
              });
          }

          // Modal de detalles del alumno
          document.querySelectorAll('.ver-alumno-detallado').forEach(btn => {
              btn.addEventListener('click', function(e) {
                  e.preventDefault();
                  const alumnoId = this.closest('tr').dataset.id;
                  cargarDetallesAlumno(alumnoId);
              });
          });

          // Botón para eliminar alumno
          const eliminarAlumnoBtn = document.getElementById('eliminar-alumno-btn');
          if (eliminarAlumnoBtn) {
              eliminarAlumnoBtn.addEventListener('click', function() {
                  const alumnoId = document.querySelector('#alumnoDetallesModal').getAttribute('data-alumno-id');
                  const alumnoNombre = document.getElementById('alumno-nombre').textContent;
                
                  // Configurar el modal de confirmación
                  document.getElementById('alumno-a-eliminar').textContent = alumnoNombre;
                  document.getElementById('form-eliminar-alumno').action = `/alumnos/${alumnoId}/eliminar/`;
                
                  // Cerrar el modal de detalles
                  const detallesModal = bootstrap.Modal.getInstance(document.getElementById('alumnoDetallesModal'));
                  if (detallesModal) {
                      detallesModal.hide();
                  }
                
                  // Mostrar el modal de confirmación
                  const confirmarModal = new bootstrap.Modal(document.getElementById('confirmarEliminarAlumnoModal'));
                  confirmarModal.show();
              });
          }

          // Función para cargar los detalles del alumno
          function cargarDetallesAlumno(alumnoId) {
              const alumnoModal = document.getElementById('alumnoDetallesModal');
              alumnoModal.setAttribute('data-alumno-id', alumnoId);
              const alumnoModalInstance = new bootstrap.Modal(alumnoModal);
              alumnoModalInstance.show();
            
              // Mostrar loading y ocultar contenido y errores
              document.getElementById('alumno-modal-loading').style.display = 'block';
              document.getElementById('alumno-modal-content').style.display = 'none';
              document.getElementById('alumno-modal-error').style.display = 'none';
            
              try {
                  // Buscar la fila del alumno
                  const alumnoRow = document.querySelector(`.alumno-row[data-id="${alumnoId}"]`);
                
                  if (!alumnoRow) {
                      throw new Error('No se encontró información del alumno');
                  }
                
                  // Actualizar enlaces
                  const editarAlumnoLink = document.getElementById('editar-alumno-link');
    if (editarAlumnoLink) {
        editarAlumnoLink.href = `/alumnos/${alumnoId}/editar/`;
    }
                  // Mostrar los detalles
                  mostrarDetallesAlumno(alumnoRow);
              } catch (error) {
                  console.error('Error:', error);
                  mostrarErrorAlumno('Error al cargar los detalles del alumno: ' + error.message);
              } finally {
                  document.getElementById('alumno-modal-loading').style.display = 'none';
              }
          }

          // Función para mostrar los detalles del alumno en el modal
          function mostrarDetallesAlumno(alumnoRow) {
              // Función auxiliar para establecer texto de forma segura
              function setTextSafely(id, text) {
                  const element = document.getElementById(id);
                  if (element) {
                      element.textContent = (text && text !== 'undefined' && text !== 'null') ? text : 'No disponible';
                  }
              }

              // Función auxiliar para establecer HTML de forma segura
              function setHtmlSafely(id, html) {
                  const element = document.getElementById(id);
                  if (element) {
                      element.innerHTML = html;
                  }
              }

              try {
                  // Información personal
                  setTextSafely('alumno-nombre', alumnoRow.dataset.nombre);
                  setTextSafely('alumno-rut', alumnoRow.dataset.rut);
                  setTextSafely('alumno-fecha-nacimiento', alumnoRow.dataset.fechaNacimiento);
                  setTextSafely('alumno-edad', alumnoRow.dataset.edad ? `${alumnoRow.dataset.edad} años` : null);
                  setTextSafely('alumno-sexo', alumnoRow.dataset.sexo);
                  setTextSafely('alumno-estado-civil', alumnoRow.dataset.estadoCivil);
                
                  // Información académica
                  setTextSafely('alumno-nivel', alumnoRow.dataset.nivel);
                  setTextSafely('alumno-jornada', alumnoRow.dataset.jornada);
                  setTextSafely('alumno-fecha-ingreso', alumnoRow.dataset.fechaIngreso);
                  setTextSafely('alumno-ultimo-curso', alumnoRow.dataset.ultimoCurso);
                  setTextSafely('alumno-curso-repetido', alumnoRow.dataset.cursoRepetido);
                
                  // Estado del alumno
                  const estadoHtml = alumnoRow.dataset.estado === 'activo' ? 
                      '<span class="status-badge status-active"><i class="fas fa-check-circle me-1"></i> Activo</span>' : 
                      '<span class="status-badge status-inactive"><i class="fas fa-times-circle me-1"></i> Inactivo</span>';
                  setHtmlSafely('alumno-estado', estadoHtml);
                
                  // Información de contacto
                  setTextSafely('alumno-direccion', alumnoRow.dataset.direccion);
                  setTextSafely('alumno-telefono', alumnoRow.dataset.telefono);
                  setTextSafely('alumno-email', alumnoRow.dataset.email);
                  setTextSafely('alumno-religion', alumnoRow.dataset.religion);
                  setTextSafely('alumno-situacion-laboral', alumnoRow.dataset.situacionLaboral);
                
                  // Información PIE
                  setTextSafely('alumno-programa-pie', alumnoRow.dataset.programaPie);
                  setTextSafely('alumno-profesional-apoyo', alumnoRow.dataset.profesionalApoyo);
                  setTextSafely('alumno-informe-psicosocial', alumnoRow.dataset.informePsicosocial);
                
                  // NUEVOS CAMPOS - Diagnóstico y Observaciones (VERSIÓN MÁS CLARA)
                  const diagnostico = alumnoRow.dataset.diagnostico || 'No';
                  let diagnosticoHtml = '';

                  // Versión EXTRA CLARA del diagnóstico:

                  if (diagnostico === 'OK') {
                      diagnosticoHtml = `
                          <div class="alert alert-success border-0 shadow-sm" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white;">
                              <div class="d-flex align-items-center">
                                  <div class="me-3">
                                      <i class="fas fa-check-circle fa-3x"></i>
                                  </div>
                                  <div>
                                      <h4 class="alert-heading mb-2">✅ DIAGNÓSTICO CONFIRMADO</h4>
                                      <p class="mb-0 fw-bold">El alumno cuenta con diagnóstico</p>
                                  </div>
                              </div>
                          </div>
                      `;
                  } else {
                      diagnosticoHtml = `
                          <div class="alert alert-secondary border-0 shadow-sm" style="background: linear-gradient(135deg, #6c757d 0%, #495057 100%); color: white;">
                              <div class="d-flex align-items-center">
                                  <div class="me-3">
                                      <i class="fas fa-times-circle fa-3x"></i>
                                  </div>
                                  <div>
                                      <h4 class="alert-heading mb-2">❌ SIN DIAGNÓSTICO</h4>
                                      <p class="mb-0 fw-bold">El alumno no presenta diagnóstico</p>
                                  </div>
                              </div>
                          </div>
                      `;
                  }

                  setHtmlSafely('alumno-diagnostico', diagnosticoHtml);
                
                  // Observaciones con formato especial
                  const observaciones = alumnoRow.dataset.observaciones || 'Sin observaciones registradas';
                  const observacionesElement = document.getElementById('alumno-observaciones');
                  if (observacionesElement) {
                      if (observaciones === 'Sin observaciones registradas' || observaciones === 'No disponible') {
                          observacionesElement.innerHTML = `
                              <div class="alert alert-light border-0 mb-0" style="background-color: #f8f9fa;">
                                  <i class="fas fa-info-circle text-muted me-2"></i>
                                  <span class="text-muted font-italic">${observaciones}</span>
                              </div>
                          `;
                      } else {
                          observacionesElement.innerHTML = `
                              <div class="observaciones-content p-3 border rounded" style="background-color: #f8fff9; border-color: #28a745 !important;">
                                  <div class="d-flex align-items-start">
                                      <i class="fas fa-comment-alt text-success me-2 mt-1"></i>
                                      <div class="flex-grow-1">
                                          <p class="mb-0" style="white-space: pre-wrap; line-height: 1.5;">${observaciones}</p>
                                      </div>
                                  </div>
                              </div>
                          `;
                      }
                  }
                
                  // Contacto de emergencia
                  setTextSafely('alumno-contacto-emergencia-nombre', alumnoRow.dataset.contactoEmergenciaNombre);
                  setTextSafely('alumno-contacto-emergencia-parentezco', alumnoRow.dataset.contactoEmergenciaParentezco);
                  setTextSafely('alumno-contacto-emergencia-telefono', alumnoRow.dataset.contactoEmergenciaTelefono);
                
                  // Mostrar el contenido
                  document.getElementById('alumno-modal-content').style.display = 'block';
                
                  // Actualizar el título del modal
                  const modalTitle = document.getElementById('alumnoDetallesModalLabel');
                  if (modalTitle) {
                      modalTitle.textContent = `Detalles del Alumno: ${alumnoRow.dataset.nombre}`;
                  }
              } catch (error) {
                  console.error('Error al mostrar detalles del alumno:', error);
                  mostrarErrorAlumno('Error al mostrar los detalles del alumno: ' + error.message);
              }
          }

          // Función para mostrar errores en el modal de alumno
          function mostrarErrorAlumno(mensaje) {
              const errorElement = document.getElementById('alumno-modal-error');
              const errorMessage = document.getElementById('alumno-error-message');
              if (errorMessage) {
                  errorMessage.textContent = mensaje;
              }
              if (errorElement) {
                  errorElement.style.display = 'block';
              }
          }


          // Cerrar modal al hacer clic fuera de él
          const estadoModal = document.getElementById('estadoModal');
          if (estadoModal) {
              estadoModal.addEventListener('click', function(e) {
                  if (e.target === this) {
                      closeEstadoModal();
                  }
              });
          }

          // Manejar envío del formulario de estado
          const estadoForm = document.getElementById('estadoForm');
          if (estadoForm) {
              estadoForm.addEventListener('submit', function(e) {
                  e.preventDefault();
            
                  const selectedEstado = document.querySelector('input[name="nuevo_estado"]:checked');
                  if (selectedEstado) {
                      // Usar el formulario existente directamente
                      const formData = new FormData();
            
                      // Agregar CSRF token
                      const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
                      formData.append('csrfmiddlewaretoken', csrfToken);
            
                      // Agregar el nuevo estado
                      formData.append('nuevo_estado', selectedEstado.value);
            
                      // Agregar el año
                      const anoFilter = document.getElementById('year-filter');
                      if (anoFilter) {
                          formData.append('ano', anoFilter.value);
                      }
            
                      // Enviar con fetch
                      fetch(this.action, {
                          method: 'POST',
                          body: formData
                      }).then(response => {
                          if (response.ok) {
                              window.location.reload();
                          } else {
                              console.error('Error en la respuesta');
                          }
                      }).catch(error => {
                          console.error('Error:', error);
                      });
                  }
              });
          }

          // Función para cambiar año académico
          function cambiarAno() {
              const yearSelect = document.getElementById('year-filter');
              const url = new URL(window.location);
              url.searchParams.set('year', yearSelect.value);
              url.searchParams.delete('nombre');
              url.searchParams.delete('nivel');
              url.searchParams.delete('estado');
              window.location.href = url.toString();
          }

          // Reemplazar temporalmente la función activarAno con esta versión simple
          function activarAno(ano) {
              console.log('FUNCIÓN ACTIVAR AÑO LLAMADA CON:', ano);
              alert('Función llamada con año: ' + ano); // Esto debería aparecer
    
              // Si llega hasta aquí, entonces probamos SweetAlert2
              Swal.fire('Prueba', `Año: ${ano}`, 'info');
          }

          // Función para crear nuevo año
          function crearNuevoAno() {
              Swal.fire({
                  title: 'Crear Nuevo Año Académico',
                  html: `
                      <div class="mb-3">
                          <label for="nuevo-ano" class="form-label">Año Académico:</label>
                          <input type="number" id="nuevo-ano" class="form-control" placeholder="Ej: 2025" min="2025" max="2050">
                      </div>
                      <div class="form-check">
                          <input class="form-check-input" type="checkbox" id="activar-nuevo-ano">
                          <label class="form-check-label" for="activar-nuevo-ano">
                              Activar como año académico activo
                          </label>
                      </div>
                  `,
                  showCancelButton: true,
                  confirmButtonText: 'Crear Año',
                  cancelButtonText: 'Cancelar',
                  preConfirm: () => {
                      const ano = document.getElementById('nuevo-ano').value;
                      const activar = document.getElementById('activar-nuevo-ano').checked;
                      
                      if (!ano) {
                          Swal.showValidationMessage('Por favor ingrese un año');
                          return false;
                      }
                      
                      if (isNaN(ano) || ano < 2025) {
                          Swal.showValidationMessage('Por favor ingrese un año válido');
                          return false;
                      }
                      
                      return { ano: ano, activar: activar };
                  }
              }).then((result) => {
                  if (result.isConfirmed) {
                      const { ano, activar } = result.value;
                      
                      const form = document.createElement('form');
                      form.method = 'POST';
                      form.action = '/alumnos/crear-ano-academico/';
                      
                      const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
                      const csrfInput = document.createElement('input');
                      csrfInput.type = 'hidden';
                      csrfInput.name = 'csrfmiddlewaretoken';
                      csrfInput.value = csrfToken;
                      form.appendChild(csrfInput);
                      
                      const anoInput = document.createElement('input');
                      anoInput.type = 'hidden';
                      anoInput.name = 'ano';
                      anoInput.value = ano;
                      form.appendChild(anoInput);
                      
                      const activarInput = document.createElement('input');
                      activarInput.type = 'hidden';
                      activarInput.name = 'activar';
                      activarInput.value = activar;
                      form.appendChild(activarInput);
                      
                      document.body.appendChild(form);
                      form.submit();
                  }
              });
          }

          // Funciones auxiliares para enviar formularios
          function enviarFormularioActivarAno(ano) {
              const form = document.createElement('form');
              form.method = 'POST';
              form.action = '/alumnos/activar-ano-academico/';
              
              const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
              const csrfInput = document.createElement('input');
              csrfInput.type = 'hidden';
              csrfInput.name = 'csrfmiddlewaretoken';
              csrfInput.value = csrfToken;
              form.appendChild(csrfInput);
              
              const anoInput = document.createElement('input');
              anoInput.type = 'hidden';
              anoInput.name = 'ano';
              anoInput.value = ano;
              form.appendChild(anoInput);
              
              document.body.appendChild(form);
              form.submit();
          }

          function enviarFormularioCrearAno(ano, activar) {
              const form = document.createElement('form');
              form.method = 'POST';
              form.action = '/alumnos/crear-ano-academico/';
              
              const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
              const csrfInput = document.createElement('input');
              csrfInput.type = 'hidden';
              csrfInput.name = 'csrfmiddlewaretoken';
              csrfInput.value = csrfToken;
              form.appendChild(csrfInput);
              
              const anoInput = document.createElement('input');
              anoInput.type = 'hidden';
              anoInput.name = 'ano';
              anoInput.value = ano;
              form.appendChild(anoInput);
              
              const activarInput = document.createElement('input');
              activarInput.type = 'hidden';
              activarInput.name = 'activar';
              activarInput.value = activar;
              form.appendChild(activarInput);
              
              document.body.appendChild(form);
              form.submit();
          }

          // Event listener para cambio de año
          const yearFilter = document.getElementById('year-filter');
          if (yearFilter) {
              yearFilter.addEventListener('change', cambiarAno);
          }
      });

      // Función global para limpiar filtros (llamada desde HTML)
      function limpiarFiltros() {
          clearFilters();
      }
      // Variables globales para la paginación
let paginaActual = 1;
let tamanoPagina = 5;
let totalAlumnos = 0;
let alumnosFiltrados = [];
let todasLasFilas = [];

// Inicializar paginación cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    inicializarPaginacion();
    
    // Agregar event listeners para los filtros
    const searchInput = document.getElementById('searchInput');
    const filterNivel = document.getElementById('filterNivel');
    const filterEstado = document.getElementById('filterEstado');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(aplicarFiltrosYPaginar, 300));
    }
    
    if (filterNivel) {
        filterNivel.addEventListener('change', aplicarFiltrosYPaginar);
    }
    
    if (filterEstado) {
        filterEstado.addEventListener('change', aplicarFiltrosYPaginar);
    }
});

// Función para inicializar la paginación
function inicializarPaginacion() {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;
    
    // Obtener todas las filas de alumnos (excluyendo filas especiales)
    todasLasFilas = Array.from(tableBody.querySelectorAll('.alumno-row'));
    totalAlumnos = todasLasFilas.length;
    
    // Si hay 5 o menos alumnos, no mostrar paginación
    if (totalAlumnos <= 5) {
        document.getElementById('pagination-container').style.display = 'none';
        return;
    }
    
    // Mostrar paginación y aplicar filtros iniciales
    document.getElementById('pagination-container').style.display = 'flex';
    aplicarFiltrosYPaginar();
}

// Función para aplicar filtros y paginar
function aplicarFiltrosYPaginar() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const nivelFilter = document.getElementById('filterNivel')?.value || '';
    const estadoFilter = document.getElementById('filterEstado')?.value || '';
    
    // Filtrar filas
    alumnosFiltrados = todasLasFilas.filter(fila => {
        const nombre = fila.dataset.nombre || '';
        const nivel = fila.dataset.nivel || '';
        const estado = fila.dataset.estado || '';
        
        const coincideNombre = nombre.includes(searchTerm);
        const coincideNivel = !nivelFilter || nivel === nivelFilter;
        const coincideEstado = !estadoFilter || estado === estadoFilter;
        
        return coincideNombre && coincideNivel && coincideEstado;
    });
    
    // Resetear a la primera página si hay filtros activos
    paginaActual = 1;
    
    // Actualizar visualización
    mostrarPagina();
    actualizarControlesPaginacion();
}

// Función para mostrar una página específica
function mostrarPagina() {
    const tableBody = document.getElementById('tableBody');
    const noResultsRow = document.getElementById('no-results-row');
    
    // Ocultar todas las filas primero
    todasLasFilas.forEach(fila => {
        fila.style.display = 'none';
    });
    
    // Si no hay resultados filtrados
    if (alumnosFiltrados.length === 0) {
        noResultsRow.style.display = 'table-row';
        document.getElementById('pagination-container').style.display = 'none';
        return;
    } else {
        noResultsRow.style.display = 'none';
        
        // Mostrar paginación solo si hay más elementos que el tamaño de página
        if (alumnosFiltrados.length > tamanoPagina) {
            document.getElementById('pagination-container').style.display = 'flex';
        } else {
            document.getElementById('pagination-container').style.display = 'none';
        }
    }
    
    // Calcular índices para la página actual
    const inicio = (paginaActual - 1) * tamanoPagina;
    const fin = inicio + tamanoPagina;
    
    // Mostrar filas de la página actual
    const filasParaMostrar = alumnosFiltrados.slice(inicio, fin);
    filasParaMostrar.forEach(fila => {
        fila.style.display = 'table-row';
        fila.classList.add('pagination-fade-in');
    });
    
    // Actualizar información de página
    actualizarInfoPagina();
}

// Función para actualizar la información de la página
function actualizarInfoPagina() {
    const pageInfo = document.getElementById('page-info');
    if (!pageInfo) return;
    
    const totalPaginas = Math.ceil(alumnosFiltrados.length / tamanoPagina);
    const inicio = alumnosFiltrados.length === 0 ? 0 : (paginaActual - 1) * tamanoPagina + 1;
    const fin = Math.min(paginaActual * tamanoPagina, alumnosFiltrados.length);
    
    pageInfo.textContent = `Mostrando ${inicio}-${fin} de ${alumnosFiltrados.length} alumnos`;
}

// Función para actualizar los controles de paginación
function actualizarControlesPaginacion() {
    const totalPaginas = Math.ceil(alumnosFiltrados.length / tamanoPagina);
    
    // Actualizar botones anterior/siguiente
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (prevBtn) {
        prevBtn.disabled = paginaActual <= 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = paginaActual >= totalPaginas;
    }
    
    // Generar números de página
    generarNumerosPagina(totalPaginas);
}

// Función para generar los números de página
function generarNumerosPagina(totalPaginas) {
    const paginationNumbers = document.getElementById('pagination-numbers');
    if (!paginationNumbers) return;
    
    paginationNumbers.innerHTML = '';
    
    if (totalPaginas <= 1) return;
    
    // Lógica para mostrar números de página con elipsis
    const maxVisible = 5; // Máximo número de páginas visibles
    let startPage = Math.max(1, paginaActual - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPaginas, startPage + maxVisible - 1);
    
    // Ajustar si estamos cerca del final
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    // Botón primera página
    if (startPage > 1) {
        crearBotonPagina(1);
        if (startPage > 2) {
            crearElipsis();
        }
    }
    
    // Botones de páginas visibles
    for (let i = startPage; i <= endPage; i++) {
        crearBotonPagina(i);
    }
    
    // Botón última página
    if (endPage < totalPaginas) {
        if (endPage < totalPaginas - 1) {
            crearElipsis();
        }
        crearBotonPagina(totalPaginas);
    }
}

// Función para crear un botón de página
function crearBotonPagina(numeroPagina) {
    const paginationNumbers = document.getElementById('pagination-numbers');
    const button = document.createElement('button');
    button.className = `pagination-number ${numeroPagina === paginaActual ? 'active' : ''}`;
    button.textContent = numeroPagina;
    button.onclick = () => irAPagina(numeroPagina);
    paginationNumbers.appendChild(button);
}

// Función para crear elipsis
function crearElipsis() {
    const paginationNumbers = document.getElementById('pagination-numbers');
    const span = document.createElement('span');
    span.className = 'pagination-ellipsis';
    span.textContent = '...';
    paginationNumbers.appendChild(span);
}

// Función para cambiar de página
function cambiarPagina(direccion) {
    const totalPaginas = Math.ceil(alumnosFiltrados.length / tamanoPagina);
    
    if (direccion === 'prev' && paginaActual > 1) {
        paginaActual--;
    } else if (direccion === 'next' && paginaActual < totalPaginas) {
        paginaActual++;
    }
    
    mostrarPagina();
    actualizarControlesPaginacion();
    
    // Scroll suave hacia la tabla
    document.querySelector('.table-container').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

// Función para ir a una página específica
function irAPagina(numeroPagina) {
    paginaActual = numeroPagina;
    mostrarPagina();
    actualizarControlesPaginacion();
    
    // Scroll suave hacia la tabla
    document.querySelector('.table-container').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

// Función para cambiar el tamaño de página
function cambiarTamanoPagina() {
    const select = document.getElementById('page-size-select');
    tamanoPagina = parseInt(select.value);
    paginaActual = 1; // Resetear a la primera página
    
    mostrarPagina();
    actualizarControlesPaginacion();
}

// Función debounce para optimizar la búsqueda
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Función para reinicializar la paginación (útil cuando se cambia de año)
function reinicializarPaginacion() {
    paginaActual = 1;
    tamanoPagina = 5;
    document.getElementById('page-size-select').value = '5';
    
    setTimeout(() => {
        inicializarPaginacion();
    }, 100);
}

// Agregar al final del script existente de cambiarAno()
const originalCambiarAno = window.cambiarAno;
window.cambiarAno = function() {
    originalCambiarAno();
    // La paginación se reinicializará cuando se recargue la página
};

      