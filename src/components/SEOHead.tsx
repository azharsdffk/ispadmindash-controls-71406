import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description?: string;
  keywords?: string;
  canonical?: string;
}

export const SEOHead = ({ 
  title, 
  description = 'نظام إدارة شبكات الإنترنت المتقدم - ISP Admin Dashboard',
  keywords = 'ISP, إدارة شبكات, فواتير, مشتركين, صيانة, تذاكر',
  canonical
}: SEOHeadProps) => (
  <Helmet>
    <title>{`${title} | ISP Pro`}</title>
    <meta name="description" content={description} />
    <meta name="keywords" content={keywords} />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, nofollow" />
    {canonical && <link rel="canonical" href={canonical} />}
    <meta property="og:title" content={`${title} | ISP Pro`} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <html lang="ar" dir="rtl" />
  </Helmet>
);
