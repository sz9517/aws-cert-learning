// @ts-check
// Docusaurus 設定檔。這裡的程式在 Node.js 執行,不要寫瀏覽器端程式碼。
// 文件:https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'AWS Certification Learning',
  tagline: '初學者友善的 AWS 證照中文學習站：考得過，也用得出來',
  favicon: 'img/favicon.svg',

  future: {
    v4: true,
  },

  // 正式網址（GitHub Pages）
  url: 'https://sz9517.github.io',
  // 專案路徑：https://sz9517.github.io/aws-cert-learning/
  baseUrl: '/aws-cert-learning/',

  // GitHub Pages 部署設定
  organizationName: 'sz9517', // GitHub 帳號
  projectName: 'aws-cert-learning', // repo 名稱
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'warn',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  // 網站語言：繁體中文（預設）+ 英文
  i18n: {
    defaultLocale: 'zh-Hant',
    locales: ['zh-Hant', 'en'],
    localeConfigs: {
      'zh-Hant': {label: '中文'},
      en: {label: 'English'},
    },
  },

  // 離線本地搜尋（不需要 Algolia 帳號，適合 GitHub Pages）
  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      /** @type {import('@easyops-cn/docusaurus-search-local').PluginOptions} */
      ({
        hashed: true,
        language: ['zh', 'en'],
        indexDocs: true,
        indexBlog: false,
        docsRouteBasePath: '/',
        highlightSearchTermsOnTargetPage: true,
      }),
    ],
  ],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          routeBasePath: '/', // 讓文件直接當作網站首頁內容
          editUrl: 'https://github.com/sz9517/aws-cert-learning/tree/main/',
        },
        blog: false, // 這個網站不需要部落格
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/docusaurus-social-card.jpg',
      colorMode: {
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'AWS Certification Learning',
        logo: {
          alt: 'AWS Certification Learning',
          src: 'img/logo.svg',
        },
        items: [
          {
            to: '/roadmap',
            position: 'left',
            label: '學習路線圖',
          },
          {
            type: 'localeDropdown',
            position: 'right',
          },
          {
            href: 'https://github.com/sz9517/aws-cert-learning',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: '學習',
            items: [
              {label: '為什麼需要用 AWS？', to: '/intro/why-aws'},
              {label: 'SAA 考試資訊', to: '/saa/exam-info'},
              {label: '名詞與服務對照表', to: '/glossary'},
            ],
          },
          {
            title: '官方資源',
            items: [
              {label: 'AWS 官方考試指南', href: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/'},
              {label: 'AWS 官方文件', href: 'https://docs.aws.amazon.com/'},
            ],
          },
        ],
        copyright: `AWS Certification Learning · 內容為原創學習筆記，AWS 與相關標誌為 Amazon.com, Inc. 之商標。`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
