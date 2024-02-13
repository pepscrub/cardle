import { Card, CardContent } from "@mui/material";
import { FC } from "react";

export const GoogleAdBanner: FC = () => {
  return <Card variant="outlined" sx={{ mt: 2 }}>
    <script>
        (adsbygoogle = window.adsbygoogle || []).push({});
    </script>
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
}