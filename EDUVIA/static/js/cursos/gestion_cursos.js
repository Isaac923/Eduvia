  document.addEventListener('DOMContentLoaded', function() {
      // Auto-eliminar alertas después de 5 segundos
      const alerts = document.querySelectorAll('.alert');
      alerts.forEach(function(alert) {
          setTimeout(function() {
              const bsAlert = new bootstrap.Alert(alert);
              bsAlert.close();
          }, 5000);
      });

      // Variables para los modales
      const detallesModal = document.getElementById('cursoDetallesModal');
      const confirmarEliminarModal = document.getElementById('confirmarEliminarModal');
      const alumnoDetallesModal = document.getElementById('alumnoDetallesModal');
      const container = document.querySelector('.container');
      let cursoActualId = null;

      // Obtener URLs base
      const urls = {
          detalles: '/cursos/api/detalles/',
          alumnosDetalles: '/alumnos/api/detalles/',
          editarCurso: '/cursos/editar/',
          eliminarCurso: '/cursos/eliminar/',
          editarAlumno: '/alumnos/',
          eliminarAlumno: '/alumnos/'
      };

      // Botones para ver detalles
      const verDetallesBtns = document.querySelectorAll('.ver-detalles-btn');
      verDetallesBtns.forEach(btn => {
          btn.addEventListener('click', function() {
              const cursoId = this.getAttribute('data-curso-id');
              cursoActualId = cursoId;
              cargarDetallesCurso(cursoId);
          });
      });

      // Función para cargar los detalles del curso
      function cargarDetallesCurso(cursoId) {
          // Mostrar loading y ocultar contenido y errores
          const loadingElement = document.getElementById('modal-loading');
          const contentElement = document.getElementById('modal-content');
          const errorElement = document.getElementById('modal-error');

          if (loadingElement) loadingElement.style.display = 'block';
          if (contentElement) contentElement.style.display = 'none';
          if (errorElement) errorElement.style.display = 'none';

          // Actualizar enlaces
          const editarLink = document.getElementById('editar-curso-link');
          if (editarLink) editarLink.href = `${urls.editarCurso}${cursoId}/`;

          // Hacer la petición AJAX
          fetch(`${urls.detalles}${cursoId}/`)
              .then(response => {
                  if (!response.ok) {
                      throw new Error(`Error en la respuesta del servidor: ${response.status}`);
                  }
                  return response.json();
              })
              .then(data => {
                  if (data.success) {
                      mostrarDetallesCurso(data.data);
                  } else {
                      mostrarError(data.error || 'Error al cargar los detalles del curso.');
                  }
              })
              .catch(error => {
                  console.error('Error:', error);
                  mostrarError('Error de conexión al cargar los detalles. Detalles: ' + error.message);
              })
              .finally(() => {
                  if (loadingElement) loadingElement.style.display = 'none';
              });
      }

      // Función para mostrar los detalles del curso en el modal
      function mostrarDetallesCurso(curso) {
          function setTextSafely(id, text) {
              const element = document.getElementById(id);
              if (element) {
                  element.textContent = text || 'No disponible';
              }
          }
          function setHtmlSafely(id, html) {
              const element = document.getElementById(id);
              if (element) {
                  element.innerHTML = html;
              }
          }
          try {
              setTextSafely('modal-nivel', `${curso.nivel}° Nivel`);
              setTextSafely('modal-jornada', curso.jornada);

              const jornadaBadge = document.getElementById('modal-jornada-badge');
              if (jornadaBadge) {
                  jornadaBadge.textContent = curso.letra;
                  jornadaBadge.className = `badge ${curso.letra === 'A' ? 'bg-warning' : 'bg-info'}`;
              }

              setTextSafely('modal-total-alumnos', `${curso.total_alumnos} alumnos activos`);

              // Información de los alumnos
              const alumnosLista = document.getElementById('modal-alumnos-lista');
              const alumnosContainer = document.getElementById('alumnos-table-container');
              const noAlumnosMessage = document.getElementById('no-alumnos-message');

              if (alumnosLista) {
                  if (curso.alumnos && curso.alumnos.length > 0) {
                      if (alumnosContainer) alumnosContainer.style.display = 'block';
                      if (noAlumnosMessage) noAlumnosMessage.style.display = 'none';

                      alumnosLista.innerHTML = '';
                      curso.alumnos.forEach(alumno => {
                          // Solo mostrar alumnos activos (ya filtrados desde el backend)
                          const estadoBadge = '<span class="badge bg-success">Activo</span>';
                          
                          alumnosLista.innerHTML += `
                              <tr>
                                  <td>${alumno.nombre}</td>
                                  <td>${alumno.edad || 'N/A'} años</td>
                                  <td>${estadoBadge}</td>
                                  <td>
                                      <button class="btn btn-sm ver-alumno-btn" 
                                       style="background-color: #5c6bc0; color: white;"
                                       title="Ver detalles del alumno"
                                       data-alumno-id="${alumno.id}">
                                          <i class="fas fa-eye"></i> Ver
                                      </button>
                                  </td>
                              </tr>
                          `;
                      });

                      setTimeout(() => {
                          document.querySelectorAll('.ver-alumno-btn').forEach(btn => {
                              btn.addEventListener('click', function() {
                                  const alumnoId = this.getAttribute('data-alumno-id');
                                  cargarDetallesAlumno(alumnoId);
                              });
                          });
                      }, 100);

                  } else {
                      if (alumnosContainer) alumnosContainer.style.display = 'block';
                      if (noAlumnosMessage) noAlumnosMessage.style.display = 'block';
                      alumnosLista.innerHTML = '<tr><td colspan="4" class="text-center">No hay alumnos activos asignados</td></tr>';
                  }
              }

              const modalContent = document.getElementById('modal-content');
              if (modalContent) {
                  modalContent.style.display = 'block';
              }

              setTextSafely('cursoDetallesModalLabel', `Detalles del Curso ${curso.nivel}° ${curso.letra}`);
              setTextSafely('curso-a-eliminar', `${curso.nivel}° ${curso.letra} (${curso.jornada})`);

              const formEliminarCurso = document.getElementById('form-eliminar-curso');
              if (formEliminarCurso) {
                  formEliminarCurso.action = `${urls.eliminarCurso}${curso.id}/`;
              }
          } catch (error) {
              console.error('Error al mostrar detalles del curso:', error);
              mostrarError('Error al mostrar los detalles del curso: ' + error.message);
          }
      }

      // Función para cargar los detalles del alumno
      function cargarDetallesAlumno(alumnoId) {
          const cursoModalInstance = bootstrap.Modal.getInstance(detallesModal);
          cursoModalInstance.hide();

          const alumnoModalInstance = new bootstrap.Modal(alumnoDetallesModal);
          alumnoModalInstance.show();

          const loadingElement = document.getElementById('alumno-modal-loading');
          const contentElement = document.getElementById('alumno-modal-content');
          const errorElement = document.getElementById('alumno-modal-error');

          if (loadingElement) loadingElement.style.display = 'block';
          if (contentElement) contentElement.style.display = 'none';
          if (errorElement) errorElement.style.display = 'none';

          const editarLink = document.getElementById('editar-alumno-link');
          if (editarLink) editarLink.href = `${urls.editarAlumno}${alumnoId}/editar/`;

          fetch(`${urls.alumnosDetalles}${alumnoId}/`)
              .then(response => {
                  if (!response.ok) {
                      throw new Error(`Error en la respuesta del servidor: ${response.status}`);
                  }
                  return response.json();
              })
              .then(data => {
                  if (data.success) {
                      mostrarDetallesAlumno(data.alumno);
                  } else {
                      mostrarErrorAlumno(data.error || 'Error al cargar los detalles del alumno.');
                  }
              })
              .catch(error => {
                  console.error('Error:', error);
                  mostrarErrorAlumno('Error de conexión al cargar los detalles del alumno. Detalles: ' + error.message);
              })
              .finally(() => {
                  if (loadingElement) loadingElement.style.display = 'none';
              });
      }

      // Función para mostrar los detalles del alumno en el modal
      function mostrarDetallesAlumno(alumno) {
          function setTextSafely(id, text) {
              const element = document.getElementById(id);
              if (element) {
                  element.textContent = text || 'No disponible';
              }
          }
          function setHtmlSafely(id, html) {
              const element = document.getElementById(id);
              if (element) {
                  element.innerHTML = html;
              }
          }
          try {
              // Información personal
              setTextSafely('alumno-nombre', alumno.nombre_completo);
              setTextSafely('alumno-rut', alumno.rut);
              setTextSafely('alumno-fecha-nacimiento', alumno.fecha_nacimiento);
              setTextSafely('alumno-edad', alumno.edad ? `${alumno.edad} años` : null);
              setTextSafely('alumno-sexo', alumno.sexo);
              setTextSafely('alumno-estado-civil', alumno.estado_civil);
            
              // Información académica
              setTextSafely('alumno-nivel', alumno.nivel);
              setTextSafely('alumno-jornada', alumno.jornada);
              setTextSafely('alumno-fecha-ingreso', alumno.fecha_ingreso);
              setTextSafely('alumno-ultimo-curso', alumno.ultimo_curso_aprobado);
              setTextSafely('alumno-curso-repetido', alumno.curso_repetido);
            
              // Estado del alumno
              const estadoHtml = alumno.activo ? 
                  '<span style="color: #28a745; font-weight: bold;"><i class="fas fa-check-circle me-1"></i> Activo</span>' : 
                  '<span style="color: #dc3545; font-weight: bold;"><i class="fas fa-times-circle me-1"></i> Inactivo</span>';
              setHtmlSafely('alumno-estado', estadoHtml);
            
              // Información de contacto
              setTextSafely('alumno-direccion', alumno.direccion);
              setTextSafely('alumno-telefono', alumno.telefono);
              setTextSafely('alumno-email', alumno.correo_electronico);
              setTextSafely('alumno-religion', alumno.religion);
              setTextSafely('alumno-situacion-laboral', alumno.situacion_laboral);
            
              // Información PIE
              setTextSafely('alumno-programa-pie', alumno.programa_pie);
              setTextSafely('alumno-profesional-apoyo', alumno.profesional_apoyo);
              setTextSafely('alumno-informe-psicosocial', alumno.informe_psicosocial);
            
              // Contacto de emergencia
              if (alumno.contacto_emergencia) {
                  setTextSafely('alumno-contacto-emergencia-nombre', alumno.contacto_emergencia.nombre);
                  setTextSafely('alumno-contacto-emergencia-parentezco', alumno.contacto_emergencia.parentezco);
                  setTextSafely('alumno-contacto-emergencia-telefono', alumno.contacto_emergencia.telefono);
              } else {
                  // Intentar acceder directamente a las propiedades si no está en un objeto anidado
                  setTextSafely('alumno-contacto-emergencia-nombre', alumno.contacto_emergencia_nombre);
                  setTextSafely('alumno-contacto-emergencia-parentezco', alumno.contacto_emergencia_parentezco);
                  setTextSafely('alumno-contacto-emergencia-telefono', alumno.contacto_emergencia_telefono);
              }
            
              // Mostrar el contenido
              const modalContent = document.getElementById('alumno-modal-content');
              if (modalContent) {
                  modalContent.style.display = 'block';
              }
            
              // Actualizar el título del modal
              setTextSafely('alumnoDetallesModalLabel', `Detalles del Alumno: ${alumno.nombre_completo}`);
            
              // Configurar botones de acción
              const eliminarBtn = document.getElementById('eliminar-alumno-btn');
              if (eliminarBtn) {
                  eliminarBtn.onclick = () => {
                      const detallesModal = document.getElementById('alumnoDetallesModal');
                      if (detallesModal) {
                          const detallesModalInstance = bootstrap.Modal.getInstance(detallesModal);
                          if (detallesModalInstance) {
                              detallesModalInstance.hide();
                          }
                      }
                      setTextSafely('alumno-a-eliminar', alumno.nombre_completo);
                      const formEliminar = document.getElementById('form-eliminar-alumno');
                      if (formEliminar) {
                          formEliminar.action = `${urls.eliminarAlumno}${alumno.id}/eliminar/`;
                      }
                      const confirmarEliminarModal = document.getElementById('confirmarEliminarAlumnoModal');
                      if (confirmarEliminarModal) {
                          const confirmarEliminarModalInstance = new bootstrap.Modal(confirmarEliminarModal);
                          confirmarEliminarModalInstance.show();
                      }
                  };
              }
            
              // Configurar enlace de edición
              const editarLink = document.getElementById('editar-alumno-link');
              if (editarLink) {
                  editarLink.href = `${urls.editarAlumno}${alumno.id}/editar/`;
              }
            
          } catch (error) {
              console.error('Error al mostrar detalles del alumno:', error);
              mostrarErrorAlumno('Error al mostrar los detalles del alumno: ' + error.message);
          }
      }

      function mostrarErrorAlumno(mensaje) {
          const errorElement = document.getElementById('alumno-modal-error');
          const mensajeElement = document.getElementById('alumno-error-message');
          if (errorElement && mensajeElement) {
              mensajeElement.textContent = mensaje;
              errorElement.style.display = 'block';
          }
      }

      function mostrarError(mensaje) {
          const errorElement = document.getElementById('modal-error');
          const mensajeElement = document.getElementById('error-message');
          if (errorElement && mensajeElement) {
              mensajeElement.textContent = mensaje;
              errorElement.style.display = 'block';
          }
      }

      // Botón para eliminar curso
      const eliminarCursoBtn = document.getElementById('eliminar-curso-btn');
      if (eliminarCursoBtn) {
          eliminarCursoBtn.addEventListener('click', function() {
              const detallesModalInstance = bootstrap.Modal.getInstance(detallesModal);
              if (detallesModalInstance) {
                  detallesModalInstance.hide();
              }
              const confirmarEliminarModalInstance = new bootstrap.Modal(confirmarEliminarModal);
              confirmarEliminarModalInstance.show();
          });
      }

      // Efectos hover para las cards de cursos
      const cursoCards = document.querySelectorAll('.curso-card');
      cursoCards.forEach(card => {
          card.addEventListener('mouseenter', function() {
              this.style.transform = 'translateY(-5px)';
              this.style.transition = 'transform 0.3s ease';
              this.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
          });
          card.addEventListener('mouseleave', function() {
              this.style.transform = 'translateY(0)';
              this.style.boxShadow = '';
          });
      });

      // Manejar el regreso del modal de alumno al modal de curso
      if (alumnoDetallesModal) {
          alumnoDetallesModal.addEventListener('hidden.bs.modal', function () {
              if (cursoActualId) {
                  const cursoModalInstance = new bootstrap.Modal(detallesModal);
                  cursoModalInstance.show();
              }
          });
      }
  });