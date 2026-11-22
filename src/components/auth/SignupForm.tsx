import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import type { RegisterRequest, TaxIdType } from '../../types/auth';
import './SignupForm.scss';

interface SignupFormData {
  name: string;
  email: string;
  phone: string;
  taxIdType: TaxIdType | '';
  taxIdNumber: string;
  password: string;
  confirmPassword: string;
}

const initialFormData: SignupFormData = {
  name: '',
  email: '',
  phone: '',
  taxIdType: '',
  taxIdNumber: '',
  password: '',
  confirmPassword: '',
};

const SignupForm = () => {
  const navigate = useNavigate();
  const { user, register } = useAuth();

  const [formData, setFormData] = useState<SignupFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user) navigate('/mi_cuenta');
  }, [user, navigate]);

  useEffect(() => {
    if (!success) return undefined;
    const timeout = window.setTimeout(() => navigate('/iniciar_sesion'), 2000);
    return () => window.clearTimeout(timeout);
  }, [success, navigate]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      setError('El teléfono debe contener exactamente 10 dígitos numéricos.');
      setLoading(false);
      return;
    }

    if (Boolean(formData.taxIdType) !== Boolean(formData.taxIdNumber.trim())) {
      setError('Si elegís un tipo de documento, completá el número; si completás el número, elegí el tipo.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    const request: RegisterRequest = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      ...(formData.phone ? { phone: formData.phone } : {}),
      ...(formData.taxIdType ? { taxIdType: formData.taxIdType } : {}),
      ...(formData.taxIdNumber.trim() ? { taxIdNumber: formData.taxIdNumber.trim() } : {}),
    };

    const { error: registerError } = await register(request);
    setLoading(false);

    if (registerError) {
      setError(registerError.message);
      return;
    }

    setSuccess(true);
  };

  return (
    <div className="signup_container container py-3 py-sm-4 py-md-5 rounded-3">
      <div className="row d-flex justify-content-center align-items-center">
        <div className="col-6 text-center">
          <h2>Crear Cuenta</h2>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="status">
              ¡Cuenta creada correctamente! Ya podés iniciar sesión.
            </div>
          )}

          <form onSubmit={handleRegister}>
            <div className="form-floating mb-3">
              <input
                id="name"
                name="name"
                type="text"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading || success}
                placeholder="Nombre completo"
              />
              <label htmlFor="name">Nombre completo (obligatorio)</label>
            </div>

            <div className="form-floating mb-3">
              <input
                id="email"
                name="email"
                type="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading || success}
                placeholder="Email"
              />
              <label htmlFor="email">Email (obligatorio)</label>
            </div>

            <div className="form-floating mb-3">
              <input
                id="phone"
                name="phone"
                type="tel"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading || success}
                placeholder="Teléfono"
                inputMode="numeric"
                pattern="[0-9]{10}"
                title="Ingresá exactamente 10 dígitos numéricos."
              />
              <label htmlFor="phone">Teléfono de 10 dígitos (opcional)</label>
            </div>

            <div className="form-floating mb-3">
              <select
                id="taxIdType"
                name="taxIdType"
                className="form-select"
                value={formData.taxIdType}
                onChange={handleChange}
                disabled={loading || success}
              >
                <option value="">Sin documento</option>
                <option value="DNI">DNI</option>
                <option value="CUIL">CUIL</option>
                <option value="CUIT">CUIT</option>
                <option value="PASAPORTE">PASAPORTE</option>
              </select>
              <label htmlFor="taxIdType">Tipo de documento (opcional)</label>
            </div>

            <div className="form-floating mb-3">
              <input
                id="taxIdNumber"
                name="taxIdNumber"
                type="text"
                className="form-control"
                value={formData.taxIdNumber}
                onChange={handleChange}
                disabled={loading || success}
                required={Boolean(formData.taxIdType)}
                placeholder="Número de documento"
              />
              <label htmlFor="taxIdNumber">Número de documento (opcional)</label>
            </div>

            <div className="password-input-container mb-3">
              <div className="form-floating position-relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  disabled={loading || success}
                  placeholder="Contraseña"
                />
                <label htmlFor="password">Contraseña (mínimo 6 caracteres)</label>
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((visible) => !visible)}
                  tabIndex={-1}
                  disabled={loading || success}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>

            <div className="password-input-container mb-3">
              <div className="form-floating position-relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-control"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  disabled={loading || success}
                  placeholder="Confirmar contraseña"
                />
                <label htmlFor="confirmPassword">Confirmar contraseña</label>
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  tabIndex={-1}
                  disabled={loading || success}
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading || success} className="main-btn-style mb-3">
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <div>
            <p>
              ¿Ya tenés cuenta?{' '}
              <Link to="/iniciar_sesion">Iniciá sesión</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
