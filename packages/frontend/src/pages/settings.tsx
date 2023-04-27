import { useAtom } from 'jotai';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { VStack } from '@/components/layouts/VStack';
import { PageRoot } from '@/components/PageRoot';
import { Radio } from '@/components/primitives/Radio';
import { RadioGroup } from '@/components/primitives/RadioGroup';
import { Select } from '@/components/primitives/Select';
import { Text } from '@/components/primitives/Text';
import { resources } from '@/langs';
import { themes } from '@/misc/theme';
import { languageAtom, themeAtom } from '@/store/client-settings';

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [theme, setTheme] = useAtom(themeAtom);
  const [language, setLanguage] = useAtom(languageAtom);

  const languageMap = useMemo(() => {
    return Object.entries(resources).map(([k, v]) => [k, v.translation.$languageName as string]);
  }, []);

  return (
    <PageRoot title={t('settings') ?? ''}>
      <VStack>
        <Text as="h1" fontSize="l">{t('theme')}</Text>
        <RadioGroup value={theme} onValueChange={v => setTheme(v as any)}>
          {themes.map(theme => <Radio key={theme} value={theme}>{t(`_themes.${theme}`)}</Radio>)}
        </RadioGroup>
        <Text as="h1" fontSize="l">{t('language')}</Text>
        <VStack gap="2xs">
          <Select value={language} onChange={e => setLanguage(e.target.value)}>
            {languageMap.map(([key, name]) => <option key={key} value={key}>{name} ({key})</option>)}
          </Select>
          <Text as="aside" fontSize="s" color="muted">
            {t('translatedByTheCommunity')}
            <a href="https://crowdin.com/project/misskey-tools" target="_blank" rel="noreferrer noopener">
              {t('helpTranslation')}
            </a>
          </Text>
        </VStack>
      </VStack>
    </PageRoot>
  );
};

export default SettingsPage;
