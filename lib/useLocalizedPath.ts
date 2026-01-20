import { useParams } from 'next/navigation';

export function useLocalizedPath() {
  const params = useParams();
  const lang = params.lang as string;

  const getPath = (path: string) => {
    return `/${lang}${path}`;
  };

  return { getPath, lang };
}
