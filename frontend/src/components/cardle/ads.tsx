import { Card, CardContent, Container, Typography } from "@mui/material";
import { useDetectAdBlock } from "adblock-detect-react";
import { FC } from "react";
import { useTranslation } from "react-i18next";

interface Window {
  adsbygoogle: {[key: string]: unknown}[]
}

export const GoogleAdBanner: FC = () => {
  const adBlockDetected = useDetectAdBlock();
  const { t } = useTranslation();
  const isDev = location.href.includes('localhost');

  if (isDev) return <></>;

  const adsByGoogle = (window as unknown as Window)?.adsbygoogle;
  return (
    <Container>
      <Card
        variant="outlined"
        sx={{
          mt: 2,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          alignContent: 'center',
          zIndex: 2,
        }}
      >
        <script>
            (adsbygoogle = window.adsbygoogle || []).push({});
        </script>
        {!adsByGoogle && <Typography variant="overline" sx={{ m: 1 }}>{t('ad.error')}</Typography> }
        {adBlockDetected && <Typography variant="overline" sx={{ m: 1 }}>{t('ad.blocked')}</Typography>}
        <CardContent
          className="adsbygoogle"
          component="ins"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-5211251535508566"
          data-ad-slot="1031703962"
          data-ad-format="auto"
          data-full-width-responsive="true"
        >
        </CardContent>
      </Card>
    </Container>
  )
}