import { useCallback, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { UserResponse } from '../types/auth';
import useMainData from './useMainData.ts';
import useAuth from './useAuth';
import useSubmitMail from './useSubmitMail.ts';

type ContactFormField = 'name' | 'phone_number' | 'message';

interface ContactFormData {
  name: string;
  phone_number: string;
  message: string;
}

interface ValidationResult {
  isValid: boolean;
  value: string;
  message: string;
}

interface SubmitStatus {
  status: 'success' | 'error' | null;
  message: string;
}

interface InfoCardContent {
  type: string;
  value: string;
  icon: string;
}

interface ContactFormHookValue {
  ARR_INFO_CARD_CONTENT: InfoCardContent[];
  formContent: ContactFormData;
  fieldErrors: ContactFormData;
  count: number;
  isSubmitting: boolean;
  submitStatus: SubmitStatus;
  setContentFormState: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmitFormHandler: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}

type FieldValidator = (value: string) => ValidationResult;

const _INITIAL_SUBMIT_STATUS_STATE: SubmitStatus = {
  status: null,
  message: '',
};
const _SUBMIT_STATUS_MESSAGES = {
  success: '¡Mensaje enviado con éxito! Te contactaremos pronto.',
  error: 'Error al enviar el mensaje. Por favor, intenta nuevamente.',
  fieldError: 'Hay errores en el formulario. Por favor, revisa los campos antes de enviar.',
};
const _NAME_REGEX = /^[A-Za-zÁáÉéÍíÓóÚúÑñÜü\s]+$/;
const _PHONE_REGEX = /^[0-9]{10}$/;
const _MESSAGE_REGEX = /^[A-Za-z0-9ÁáÉéÍíÓóÚúÑñÜü\s.,$!?-]{1,500}$/;
const _VALIDATION_RESULT = {
  success: (value: string): ValidationResult => ({
    isValid: true,
    value,
    message: '',
  }),
  error: (message: string): ValidationResult => ({
    isValid: false,
    value: '',
    message,
  }),
};

const _getFormData = (profile: Pick<UserResponse, 'userName' | 'userPhone'> | null = null): ContactFormData => ({
  name: profile?.userName?.toUpperCase() || '',
  phone_number: profile?.userPhone || '',
  message: '',
});

const useContactForm = (): ContactFormHookValue => {
  const { profile } = useAuth();
  const { globalInfo } = useMainData();
  const { sendMail } = useSubmitMail();

  const ARR_INFO_CARD_CONTENT = useMemo<InfoCardContent[]>(
    () => [
      {
        type: 'Email',
        value: globalInfo.email,
        icon: 'bi bi-envelope-fill',
      },
      {
        type: 'Teléfono',
        value: globalInfo.phoneNumber,
        icon: 'bi bi-telephone-fill',
      },
      {
        type: 'Horario',
        value: 'Lunes a Sábado de 09:00 a 18:00',
        icon: 'bi bi-clock-fill',
      },
    ],
    [globalInfo],
  );

  const [formContent, setFormContent] = useState<ContactFormData>(_getFormData());
  const [fieldErrors, setFieldErrors] = useState<ContactFormData>(_getFormData());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>(_INITIAL_SUBMIT_STATUS_STATE);

  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);
  if (profile && !hasLoadedProfile) {
    setFormContent((previous) => ({ ...previous, ..._getFormData(profile) }));
    setHasLoadedProfile(true);
  }

  const count = useMemo(() => formContent.message.length, [formContent.message]);

  const _nameValidation = useCallback((name: string): ValidationResult => {
    if (!name) return _VALIDATION_RESULT.error('El nombre es requerido.');
    if (!_NAME_REGEX.test(name)) {
      return _VALIDATION_RESULT.error('El nombre solo puede contener letras y espacios.');
    }
    return _VALIDATION_RESULT.success(name.toUpperCase());
  }, []);

  const _phoneNumberValidation = useCallback((phone: string): ValidationResult => {
    const cleanedPhoneNumber = phone.replace(/\D/g, '');
    if (!cleanedPhoneNumber) {
      return _VALIDATION_RESULT.error('El número de teléfono es requerido.');
    }
    if (!_PHONE_REGEX.test(cleanedPhoneNumber)) {
      return _VALIDATION_RESULT.error('El número debe tener exactamente 10 dígitos.');
    }
    return _VALIDATION_RESULT.success(cleanedPhoneNumber);
  }, []);

  const _messageValidation = useCallback((message: string): ValidationResult => {
    if (!message) return _VALIDATION_RESULT.error('El mensaje es requerido.');
    if (!_MESSAGE_REGEX.test(message)) {
      return _VALIDATION_RESULT.error('El mensaje contiene caracteres no permitidos.');
    }
    return _VALIDATION_RESULT.success(message);
  }, []);

  const _handleValidationResult = useCallback(
    (id: ContactFormField, unvalidatedValue: string, validationResult: ValidationResult): void => {
      const { isValid, value, message } = validationResult;
      setFormContent((previous) => ({
        ...previous,
        [id]: isValid ? value : unvalidatedValue,
      }));
      setFieldErrors((previous) => ({
        ...previous,
        [id]: isValid ? '' : message,
      }));
    },
    [],
  );

  const _VALIDATORS: Record<ContactFormField, FieldValidator> = useMemo(
    () => ({
      name: _nameValidation,
      phone_number: _phoneNumberValidation,
      message: _messageValidation,
    }),
    [_nameValidation, _phoneNumberValidation, _messageValidation],
  );

  const setContentFormState = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
      const { id, value } = event.currentTarget;
      if (!Object.prototype.hasOwnProperty.call(_VALIDATORS, id)) return;

      const fieldId = id as ContactFormField;
      const upperValue = value.toUpperCase();
      _handleValidationResult(fieldId, upperValue, _VALIDATORS[fieldId](upperValue));
    },
    [_VALIDATORS, _handleValidationResult],
  );

  const _validateAllFields = useCallback(
    (values: ContactFormData): void => {
      (Object.keys(values) as ContactFormField[]).forEach((key) => {
        _handleValidationResult(key, values[key], _VALIDATORS[key](values[key]));
      });
    },
    [_VALIDATORS, _handleValidationResult],
  );

  const onSubmitFormHandler = useCallback(
    async (event: FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();

      setIsSubmitting(true);
      setSubmitStatus(_INITIAL_SUBMIT_STATUS_STATE);

      const currentName = formContent.name.trim();
      const currentPhone = formContent.phone_number.trim();
      const currentMessage = formContent.message.trim();

      _validateAllFields({
        name: currentName,
        phone_number: currentPhone,
        message: currentMessage,
      });

      const hasFieldErrors = Object.values(fieldErrors).some((fieldError) => fieldError.length > 0);
      if (hasFieldErrors) {
        setIsSubmitting(false);
        setSubmitStatus({
          status: 'error',
          message: _SUBMIT_STATUS_MESSAGES.fieldError,
        });
        setTimeout(() => setSubmitStatus(_INITIAL_SUBMIT_STATUS_STATE), 5000);
        return;
      }

      const result = await sendMail('Nueva consulta desde la web', {
        Nombre: currentName,
        Numero: currentPhone,
        WhatsApp: `https://wa.me/549${currentPhone}`,
        Mensaje: currentMessage,
      });

      if (result.success) {
        setSubmitStatus({
          status: 'success',
          message: _SUBMIT_STATUS_MESSAGES.success,
        });
        setFormContent(_getFormData(profile));
        setFieldErrors(_getFormData());
        setTimeout(() => setSubmitStatus(_INITIAL_SUBMIT_STATUS_STATE), 5000);
      } else {
        setSubmitStatus({
          status: 'error',
          message: _SUBMIT_STATUS_MESSAGES.error,
        });
      }

      setIsSubmitting(false);
    },
    [formContent, sendMail, fieldErrors, _validateAllFields, profile],
  );

  return {
    ARR_INFO_CARD_CONTENT,
    formContent,
    fieldErrors,
    count,
    isSubmitting,
    submitStatus,
    setContentFormState,
    onSubmitFormHandler,
  };
};

export default useContactForm;
