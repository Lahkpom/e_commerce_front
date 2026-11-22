import { useState } from 'react';
import useMainData from './useMainData.ts';

interface MailResponse {
  success?: boolean | 'true' | 'false';
  message?: string;
  [key: string]: unknown;
}

type SendMailResult =
  | { success: true; data: MailResponse }
  | { success: false; error: string };

interface SubmitMailHookValue {
  sendMail: (subject: string, formData: Record<string, string>) => Promise<SendMailResult>;
  loading: boolean;
  error: string | null;
  success: boolean;
}

const useSubmitMail = (): SubmitMailHookValue => {
  const { globalInfo } = useMainData();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const sendMail = async (
    subject: string,
    formData: Record<string, string>,
  ): Promise<SendMailResult> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`https://formsubmit.co/ajax/${globalInfo.email}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          _subject: subject,
          _captcha: 'false',
          ...formData,
        }),
      });

      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const data = (await response.json()) as MailResponse;

      if (data.success === 'false') {
        throw new Error(data.message || 'Error al enviar el formulario');
      }

      setSuccess(true);
      return { success: true, data };
    } catch (caughtError: unknown) {
      const errorMessage =
        caughtError instanceof Error ? caughtError.message : 'Error al enviar el formulario';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { sendMail, loading, error, success };
};

export default useSubmitMail;
