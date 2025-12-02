import Head from 'next/head'
import { useEffect } from 'react'
import { slugifyWithCounter } from '@sindresorhus/slugify'

import { Layout } from '@/components/Layout'

import 'focus-visible'
import '@/styles/tailwind.css'
import * as Fathom from "fathom-client";

const navigation = [
  {
    title: 'Reference',
    links: [
      { title: 'Onechart Reference', href: '/onechart-reference' },
    ],
  },
]

function getNodeText(node) {
  let text = ''
  for (let child of node.children ?? []) {
    if (typeof child === 'string') {
      text += child
    }
    text += getNodeText(child)
  }
  return text
}

function collectHeadings(nodes, slugify = slugifyWithCounter()) {
  let sections = []

  for (let node of nodes) {
    if (/^h[23]$/.test(node.name)) {
      let title = getNodeText(node)
      if (title) {
        let id = slugify(title)
        node.attributes.id = id
        if (node.name === 'h3') {
          sections[sections.length - 1].children.push({
            ...node.attributes,
            title,
          })
        } else {
          sections.push({ ...node.attributes, title, children: [] })
        }
      }
    }

    sections.push(...collectHeadings(node.children ?? [], slugify))
  }

  return sections
}

import { useRouter } from 'next/router'

export default function App({ Component, pageProps }) {
  let title = pageProps.markdoc?.frontmatter.title

  const router = useRouter()
  let isYamlGeneratorPage = router.pathname === '/'

  let image = "logosocial.png"
  if (pageProps.markdoc?.frontmatter.image_social) {
    image = pageProps.markdoc?.frontmatter.image_social
  }
  if (pageProps.markdoc?.frontmatter.image) {
    image = pageProps.markdoc?.frontmatter.image
  }

  let tableOfContents = pageProps.markdoc?.frontmatter.toc !== false && pageProps.markdoc?.content
    ? collectHeadings(pageProps.markdoc.content)
    : []

  const currentUrl = "https://gimlet.io" + router.pathname;

  let ogTitle = "Deploy and share your frontend, backend or AI project using open-source tooling and social auth."
  let description = "Deploy and share your frontend, backend or AI project using open-source tooling and social auth."
  if (pageProps.markdoc?.frontmatter.description) {
    description = pageProps.markdoc?.frontmatter.description
  }
  let pageTitle = 'Gimlet - Deployment tool built on Kubernetes'
  if (pageProps.markdoc?.frontmatter.title) {
    ogTitle = pageProps.markdoc?.frontmatter.title
    if (pageProps.markdoc?.frontmatter.title.length < 20) {
      pageTitle = pageProps.markdoc?.frontmatter.title + " - " + pageTitle
    } else {
      pageTitle = pageProps.markdoc?.frontmatter.title + " - Gimlet"
    }
  }
  if (pageProps.markdoc?.frontmatter.ogTitle) {
    ogTitle = pageProps.markdoc?.frontmatter.ogTitle
  }
  if (isYamlGeneratorPage) {
    pageTitle = "Kubernetes YAML Generator"
    ogTitle = "Kubernetes YAML Generator"
    description = "Generate Kubernetes YAML files for web application deployments. Uses a generic Helm chart, because no one can remember the Kubernetes yaml syntax."
    image = "yaml-generator.png"
  }

  useEffect(() => {
    Fathom.load('TOOENNXR', {
      excludedDomains: ['localhost', "127.0.0.1"],
    });

    function onRouteChangeComplete() {
      Fathom.trackPageview();
    }
    // Record a pageview when route changes
    router.events.on('routeChangeComplete', onRouteChangeComplete);

    // Unassign event listener
    return () => {
      router.events.off('routeChangeComplete', onRouteChangeComplete);
    };
  }, []);

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="description" content={description} />
        <meta content="Gimlet" property="og:site_name" />

        <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        <meta content={pageTitle} property="og:title"/>
        {isYamlGeneratorPage &&
          <meta
            name="keywords"
            content="kubernetes yaml, kubernetes deployment yaml, yaml generator, kubernetes yaml generator, k8s yaml generator, kubectl yaml, kubernetes yaml reference, k8s deployment yaml, yaml template generator, yaml editor for kubernetes, yaml kubernetes, kubernetes yaml templates, yaml editor, kubernetes manifest, web application deployment yaml, web application manifest"
          />
        }
        <meta content="website" property="og:type" />
        <meta content={`https://api.placid.app/u/ghvjld730lsgd?title[text]=${encodeURI(ogTitle)}`} property="og:image" />
        <meta content={description} property="og:description" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@gimlet_io" />
        <meta name="twitter:creator" content="@gimlet_io" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`https://api.placid.app/u/ghvjld730lsgd?title[text]=${encodeURI(ogTitle)}`} />

        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />

        <link rel="canonical" href={currentUrl} />
        <meta content={currentUrl} property="og:url" />
      </Head>
      <Layout
        navigation={navigation}
        title={title}
        tableOfContents={tableOfContents}
        pageProps={pageProps}
      >
        <Component {...pageProps} />
      </Layout>
    </>
  )
}
