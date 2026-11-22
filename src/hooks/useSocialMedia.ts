import { useMemo, useCallback } from 'react';
import type { MouseEvent } from 'react';
import type { MainDataContextValue } from '../contexts/MainDataContext.tsx';
import useAuth from './useAuth';

const _MSG_BTN_FAILED =
  'Se detectó un problema con este botón y actualmente no está funcionando. Estamos trabajando para resolverlo. Le pedimos disculpas por las molestias ocasionadas.';

interface SocialMediaItem {
  name: 'facebook' | 'whatsapp';
  icon: string;
  color: string;
  url: string;
}

interface SocialMediaHookValue {
  arrSocialMedia: SocialMediaItem[];
  onClickHandler: (event: MouseEvent<HTMLElement>) => void;
}

const useSocialMedia = (
  globalInfo: Pick<MainDataContextValue['globalInfo'], 'phoneNumber'>,
): SocialMediaHookValue => {
  const { profile } = useAuth();

  const arrSocialMedia = useMemo<SocialMediaItem[]>(
    () => [
      {
        name: 'facebook',
        icon: 'bi bi-facebook',
        color: 'primary',
        url: 'https://www.facebook.com/share/16FkGbSYi4/?mibextid=wwXIfr',
      },
      {
        name: 'whatsapp',
        icon: 'bi bi-whatsapp',
        color: 'success',
        url: `https://wa.me/${globalInfo.phoneNumber.replace(/\D/g, '')}?text=Hola,%20mi%20nombre%20es%20${encodeURIComponent(profile?.userName || 'NOMBRE_AQUI')}.%20Quería%20consultar%20por%20${encodeURIComponent('MENSAJE_AQUI')}`,
      },
    ],
    [profile, globalInfo],
  );

  const onClickHandler = useCallback(
    (event: MouseEvent<HTMLElement>): void => {
      const socialMediaItem = arrSocialMedia.find((item) => item.name === event.currentTarget.id);

      socialMediaItem?.url
        ? window.open(socialMediaItem.url, '_blank', 'noopener,noreferrer')
        : alert(_MSG_BTN_FAILED);
    },
    [arrSocialMedia],
  );

  return {
    arrSocialMedia,
    onClickHandler,
  };
};

export default useSocialMedia;
