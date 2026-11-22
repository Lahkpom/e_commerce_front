import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import './LoginForm.scss';

const getPostLoginPath = (role: string | null | undefined): string =>
  role === 'ADMIN' || role === 'OPERATOR' ? '/admin' : '/mi_cuenta';

const LoginForm = () => {
  const navigate = useNavigate();
  const { user, role, signIn, changeExpiredPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mustRenewPassword, setMustRenewPassword] = useState(false);

  useEffect(() => {
    if (user) navigate(getPostLoginPath(role), { replace: true });
  }, [user, role, navigate]);

  const handleEmailLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: signInError, passwordExpired } = await signIn(email, password);
    setLoading(false);

    if (signInError) {
      if (passwordExpired) {
        setMustRenewPassword(true);
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setError(signInError.message || 'Credenciales incorrectas');
      }
      return;
    }

    navigate(getPostLoginPath(data?.user.userRole));
  };

  const handleExpiredPasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('La confirmación no coincide con la nueva contraseña.');
      return;
    }

    setLoading(true);
    const { data, error: changeError } = await changeExpiredPassword({
      email,
      currentPassword: password,
      newPassword,
    });
    setLoading(false);

    if (changeError) {
      setError(changeError.message);
      return;
    }

    navigate(getPostLoginPath(data?.user.userRole), { replace: true });
  };

  return (
    <div className="login_container container py-3 py-sm-4 py-md-5 rounded-3">
      <div className="row d-flex justify-content-center align-items-center">
        <div className="col-6 text-center">
          <h2>Iniciar Sesión</h2>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {mustRenewPassword ? (
            <form className="card card-body text-start" onSubmit={(event) => void handleExpiredPasswordChange(event)}>
              <h3 className="h5">Renovación obligatoria de contraseña</h3>
              <p className="text-muted">
                Tu contraseña inicial o vencida debe actualizarse antes de continuar.
              </p>
              <div className="form-floating mb-3">
                <input
                  id="expired-email"
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={loading}
                  placeholder="Email"
                />
                <label htmlFor="expired-email">Email</label>
              </div>
              <div className="form-floating mb-3">
                <input
                  id="current-password"
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={loading}
                  placeholder="Contraseña actual"
                />
                <label htmlFor="current-password">Contraseña actual</label>
              </div>
              <div className="form-floating mb-3">
                <input
                  id="new-password"
                  type="password"
                  className="form-control"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  minLength={8}
                  maxLength={255}
                  required
                  disabled={loading}
                  placeholder="Nueva contraseña"
                />
                <label htmlFor="new-password">Nueva contraseña (mínimo 8 caracteres)</label>
              </div>
              <div className="form-floating mb-3">
                <input
                  id="confirm-new-password"
                  type="password"
                  className="form-control"
                  value={confirmNewPassword}
                  onChange={(event) => setConfirmNewPassword(event.target.value)}
                  minLength={8}
                  maxLength={255}
                  required
                  disabled={loading}
                  placeholder="Confirmar nueva contraseña"
                />
                <label htmlFor="confirm-new-password">Confirmar nueva contraseña</label>
              </div>
              <button type="submit" disabled={loading} className="main-btn-style mb-2">
                {loading ? 'Actualizando contraseña…' : 'Actualizar y continuar'}
              </button>
              <button
                type="button"
                className="btn btn-link"
                disabled={loading}
                onClick={() => {
                  setMustRenewPassword(false);
                  setError('');
                }}
              >
                Volver al inicio de sesión
              </button>
            </form>
          ) : (
          <form onSubmit={(event) => void handleEmailLogin(event)}>
            <div className="form-floating mb-3">
              <input
                id="email"
                type="email"
                className="form-control"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={loading}
                placeholder="Email"
              />
              <label htmlFor="email">Email</label>
            </div>

            <div className="password-input-container mb-3">
              <div className="form-floating position-relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={loading}
                  placeholder="Contraseña"
                />
                <label htmlFor="password">Contraseña</label>

                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((visible) => !visible)}
                  tabIndex={-1}
                  disabled={loading}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="main-btn-style mb-3">
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>
          )}

          {!mustRenewPassword && <div>
            <p>
              ¿No tenés cuenta?{' '}
              <Link to="/registrarse">Registrate</Link>
            </p>
          </div>}
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
