
        document.addEventListener('DOMContentLoaded', function () {
            const rutInput = document.getElementById('rut');
            const rutError = document.getElementById('rut-error');

            // Función para formatear RUT mientras se escribe
            function formatRut(input) {
                let value = input.value.replace(/[^0-9kK]/g, '').toUpperCase();

                if (value.length <= 1) {
                    input.value = value;
                    return;
                }

                // Separar dígito verificador
                const dv = value.slice(-1);
                let numero = value.slice(0, -1);

                // Agregar puntos cada 3 dígitos desde la derecha
                numero = numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

                // Combinar con guión y DV
                input.value = numero + '-' + dv;
            }

            // Función para validar RUT chileno
            function validarRut(rut) {
                // Limpiar RUT
                rut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
                
                if (rut.length < 2) {
                    return false;
                }
                
                // Separar número y dígito verificador
                const numero = rut.slice(0, -1);
                const dv = rut.slice(-1);
                
                // Calcular dígito verificador
                let suma = 0;
                let multiplicador = 2;
                
                for (let i = numero.length - 1; i >= 0; i--) {
                    suma += parseInt(numero.charAt(i)) * multiplicador;
                    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
                }
                
                const resto = suma % 11;
                const dvCalculado = resto < 2 ? resto.toString() : resto === 10 ? 'K' : (11 - resto).toString();
                
                return dv === dvCalculado;
            }

            // Event listener para formatear RUT
            rutInput.addEventListener('input', function () {
                formatRut(this);
                
                // Validar si tiene suficiente longitud
                if (this.value.length >= 3) {
                    if (validarRut(this.value)) {
                        this.classList.remove('is-invalid');
                        this.classList.add('is-valid');
                        rutError.style.display = 'none';
                    } else {
                        this.classList.remove('is-valid');
                        this.classList.add('is-invalid');
                        rutError.style.display = 'block';
                    }
                } else {
                    this.classList.remove('is-valid', 'is-invalid');
                    rutError.style.display = 'none';
                }
            });

            // Validación del formulario antes de enviar
            document.querySelector('.login-form').addEventListener('submit', function(e) {
                const rutValue = rutInput.value;
                
                if (!rutValue.trim()) {
                    e.preventDefault();
                    rutInput.classList.add('is-invalid');
                    rutError.textContent = 'El RUT es requerido';
                    rutError.style.display = 'block';
                    rutInput.focus();
                    return false;
                }
                
                if (!validarRut(rutValue)) {
                    e.preventDefault();
                    rutInput.classList.add('is-invalid');
                    rutError.innerHTML = '<i class="fas fa-exclamation-circle"></i> RUT inválido. Verifique el formato y dígito verificador.';
                    rutError.style.display = 'block';
                    rutInput.focus();
                    return false;
                }
                
                // Si llegamos aquí, el RUT es válido
                return true;
            });

            // Auto-cerrar alertas después de 5 segundos
            const alerts = document.querySelectorAll('.alert');
            alerts.forEach(alert => {
                setTimeout(() => {
                    if (alert.parentNode) {
                        alert.style.transition = 'opacity 0.5s ease';
                        alert.style.opacity = '0';
                        setTimeout(() => {
                            if (alert.parentNode) {
                                alert.remove();
                            }
                        }, 500);
                    }
                }, 5000);
            });
        });